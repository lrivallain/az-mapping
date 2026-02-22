"""On-Behalf-Of (OBO) authentication for user-context delegation.

When the MCP server receives a bearer token (e.g. from Copilot Studio),
this module exchanges it for an ARM-scoped token via the OBO flow,
so Azure API calls execute under the calling user's identity.

Required environment variables (all three must be set to enable OBO):
    AZURE_OBO_CLIENT_ID     — App Registration client ID
    AZURE_OBO_CLIENT_SECRET — App Registration client secret
    AZURE_OBO_TENANT_ID     — Entra ID tenant ID

When not set, the server falls back to DefaultAzureCredential.
"""

import base64
import json
import logging
import os
from contextvars import ContextVar
from typing import Any

logger = logging.getLogger(__name__)

# ContextVar scoped to the current async request
_user_bearer_token: ContextVar[str | None] = ContextVar("_user_bearer_token", default=None)

# OBO configuration from environment
OBO_CLIENT_ID = os.environ.get("AZURE_OBO_CLIENT_ID", "")
OBO_CLIENT_SECRET = os.environ.get("AZURE_OBO_CLIENT_SECRET", "")
OBO_TENANT_ID = os.environ.get("AZURE_OBO_TENANT_ID", "")

ARM_SCOPE = "https://management.azure.com/.default"


def is_obo_configured() -> bool:
    """Return True if all OBO environment variables are set."""
    return bool(OBO_CLIENT_ID and OBO_CLIENT_SECRET and OBO_TENANT_ID)


def get_user_token() -> str | None:
    """Return the current request's user bearer token, or None."""
    return _user_bearer_token.get()


def set_user_token(token: str | None) -> None:
    """Set the user bearer token for the current async context."""
    _user_bearer_token.set(token)


def get_obo_headers(tenant_id: str | None = None) -> dict[str, str] | None:
    """Exchange the user's token for ARM-scoped headers via OBO.

    Returns ``None`` if OBO is not configured or no user token is present.
    """
    user_token = get_user_token()
    if not user_token or not is_obo_configured():
        return None
    return _exchange_obo(user_token, tenant_id)


def _exchange_obo(user_token: str, tenant_id: str | None = None) -> dict[str, str] | None:
    """Perform the OBO token exchange and return ARM headers."""
    from azure.identity import OnBehalfOfCredential

    try:
        cred = OnBehalfOfCredential(
            tenant_id=tenant_id or OBO_TENANT_ID,
            client_id=OBO_CLIENT_ID,
            client_secret=OBO_CLIENT_SECRET,
            user_assertion=user_token,
        )
        token = cred.get_token(ARM_SCOPE)
        return {
            "Authorization": f"Bearer {token.token}",
            "Content-Type": "application/json",
        }
    except Exception:
        logger.warning("OBO token exchange failed")
        return None


def check_obo_tenant_auth(user_token: str, tenant_id: str) -> bool:
    """Check if OBO token exchange succeeds for a specific tenant."""
    from azure.identity import OnBehalfOfCredential

    try:
        cred = OnBehalfOfCredential(
            tenant_id=tenant_id,
            client_id=OBO_CLIENT_ID,
            client_secret=OBO_CLIENT_SECRET,
            user_assertion=user_token,
        )
        cred.get_token(ARM_SCOPE)
        return True
    except Exception:
        return False


def get_user_tenant_id() -> str | None:
    """Extract tenant ID from the user's bearer token JWT claims."""
    user_token = get_user_token()
    if not user_token:
        return None
    try:
        payload = user_token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        claims = json.loads(base64.urlsafe_b64decode(payload))
        tid: str | None = claims.get("tid") or claims.get("tenant_id")
        return tid
    except Exception:
        return None


class OBOMiddleware:
    """ASGI middleware: capture bearer token from request headers.

    Checks ``X-MS-TOKEN-AAD-ACCESS-TOKEN`` first (EasyAuth), then
    ``Authorization: Bearer ...`` (direct API calls).
    """

    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope["type"] == "http":
            set_user_token(self._extract_token(scope))
        await self.app(scope, receive, send)

    @staticmethod
    def _extract_token(scope: dict[str, Any]) -> str | None:
        """Extract bearer token from headers."""
        easyauth_token = None
        auth_token = None
        for name, value in scope.get("headers", []):
            header_name = name.decode().lower()
            if header_name == "x-ms-token-aad-access-token":
                easyauth_token = value.decode()
            elif header_name == "authorization":
                auth_value = value.decode()
                if auth_value.lower().startswith("bearer "):
                    auth_token = auth_value[7:].strip()
        return easyauth_token or auth_token
