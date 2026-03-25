"""Non-streaming chat completion with tool calling.

Provides ``ai_complete()`` — a single-shot completion helper that runs the full
tool-calling loop server-side and returns the final response as a dict.  Designed
for plugin routes that need inline AI recommendations outside the chat panel.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
from dataclasses import dataclass, field
from typing import Any

from az_scout.services.ai_chat._config import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_DEPLOYMENT,
    AZURE_OPENAI_ENDPOINT,
)
from az_scout.services.ai_chat._dispatch import (
    _execute_tool,
    _get_tool_params,
    _truncate_tool_result,
)
from az_scout.services.ai_chat._tools import TOOL_DEFINITIONS

logger = logging.getLogger(__name__)

# Reuse the same limits as the streaming path
_MAX_TOOL_ROUNDS = 10
_MAX_RETRIES = 3
_DEFAULT_RETRY_WAIT = 10


@dataclass
class CompletionResult:
    """Result of a non-streaming AI completion."""

    content: str
    tool_calls: list[dict[str, Any]] = field(default_factory=list)


async def ai_complete(
    prompt: str,
    *,
    system_prompt: str | None = None,
    tenant_id: str | None = None,
    region: str | None = None,
    subscription_id: str | None = None,
    tools: bool = True,
) -> CompletionResult:
    """Run a single-shot AI completion with optional tool calling.

    Parameters
    ----------
    prompt:
        The user message to send.
    system_prompt:
        Custom system prompt.  When *None*, no system message is included
        (the caller is expected to provide domain-specific instructions).
    tenant_id, region, subscription_id:
        Azure context — auto-injected into tool call arguments.
    tools:
        Whether to enable tool calling.  Set *False* for pure text completion.

    Returns
    -------
    CompletionResult:
        The final assistant text and a list of tool calls that were executed.
    """
    import httpx

    messages: list[dict[str, Any]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    url = (
        f"{AZURE_OPENAI_ENDPOINT.rstrip('/')}/openai/deployments/"
        f"{AZURE_OPENAI_DEPLOYMENT}/chat/completions"
        f"?api-version={AZURE_OPENAI_API_VERSION}"
    )
    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_API_KEY,
    }

    tool_log: list[dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=120.0) as client:
        for _round in range(_MAX_TOOL_ROUNDS):
            body: dict[str, Any] = {"messages": messages}
            if tools and TOOL_DEFINITIONS:
                body["tools"] = TOOL_DEFINITIONS
                body["tool_choice"] = "auto"

            # Retry loop for 429 rate-limit errors
            resp_data: dict[str, Any] | None = None
            for _attempt in range(_MAX_RETRIES):
                resp = await client.post(url, json=body, headers=headers)
                if resp.status_code == 429:
                    retry_after = _DEFAULT_RETRY_WAIT
                    if resp.headers.get("retry-after"):
                        with contextlib.suppress(TypeError, ValueError):
                            retry_after = int(resp.headers["retry-after"])
                    if _attempt < _MAX_RETRIES - 1:
                        logger.warning(
                            "Azure OpenAI 429, retrying in %ss (attempt %s/%s)",
                            retry_after,
                            _attempt + 1,
                            _MAX_RETRIES,
                        )
                        await asyncio.sleep(retry_after)
                        continue
                    resp.raise_for_status()
                elif resp.status_code != 200:
                    resp.raise_for_status()
                else:
                    resp_data = resp.json()
                    break

            if resp_data is None:
                return CompletionResult(content="Error: failed to get response from AI model.")

            choices = resp_data.get("choices", [])
            if not choices:
                return CompletionResult(content="")

            choice = choices[0]
            message = choice.get("message", {})
            finish_reason = choice.get("finish_reason", "")

            # If no tool calls, return the final content
            if finish_reason != "tool_calls" or not message.get("tool_calls"):
                return CompletionResult(
                    content=message.get("content", ""),
                    tool_calls=tool_log,
                )

            # Execute tool calls
            messages.append(message)

            for tc in message["tool_calls"]:
                tool_name = tc["function"]["name"]
                try:
                    raw_args = tc["function"].get("arguments", "")
                    args = json.loads(raw_args) if raw_args else {}
                except json.JSONDecodeError:
                    args = {}

                # Auto-inject context parameters
                if tenant_id and "tenant_id" in _get_tool_params(tool_name):
                    args.setdefault("tenant_id", tenant_id)
                if region and "region" in _get_tool_params(tool_name):
                    args.setdefault("region", region)
                if subscription_id:
                    if "subscription_id" in _get_tool_params(tool_name):
                        args.setdefault("subscription_id", subscription_id)
                    if "subscription_ids" in _get_tool_params(tool_name):
                        args.setdefault("subscription_ids", [subscription_id])

                result = _execute_tool(tool_name, args)
                tool_content = _truncate_tool_result(result)

                tool_log.append(
                    {
                        "name": tool_name,
                        "arguments": args,
                        "result_length": len(result),
                    }
                )

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": tool_content,
                    }
                )

    # Exhausted rounds
    return CompletionResult(content="", tool_calls=tool_log)
