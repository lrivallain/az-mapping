---
description: "Azure ARM API patterns, authentication, pagination, and error handling for az-scout. USE WHEN editing files in azure_api/, or adding ARM calls."
applyTo: "src/az_scout/azure_api/**"
---

# Azure API conventions

## Authentication

- Auth uses `DefaultAzureCredential` with optional `tenant_id` parameter.
- When OBO is enabled (`AZ_SCOUT_CLIENT_ID` + `AZ_SCOUT_CLIENT_SECRET`), `_get_headers()` uses the OBO-exchanged token from the user's session.
- CLI mode (`az-scout chat`, `az-scout mcp --stdio`) has no middleware, so `_get_headers()` falls back to `DefaultAzureCredential`.
- The `_NO_TOKEN` sentinel prevents web requests from reaching `DefaultAzureCredential` when OBO is enabled.

## ARM helpers

All ARM calls **must** use the public helpers — never call `requests.get/post` directly:

- `arm_get(url, tenant_id?)` — single GET with Bearer auth, retry on 429/5xx
- `arm_post(url, body, tenant_id?)` — single POST with Bearer auth, retry
- `arm_paginate(url, tenant_id?)` — GET with automatic `nextLink` pagination
- `get_headers(tenant_id?)` — raw token for non-ARM endpoints (e.g. Retail Prices API)

These provide: automatic Bearer-token auth, 429/5xx retry with exponential backoff, and structured error handling (`ArmAuthorizationError`, `ArmNotFoundError`, `ArmRequestError`).

## API base URL

`https://management.azure.com`

## Error handling

- Per-subscription errors must be included in the response, not fail the whole request.
- Return error objects: `{"subscription_id": "...", "error": {"code": "...", "message": "..."}}`
- Never raise unhandled exceptions for per-subscription failures.

## Pagination

Handle `nextLink` via `arm_paginate()` for all list endpoints. Never manually implement pagination loops.

## Performance

- Avoid O(n²) loops over subscriptions.
- Avoid re-authenticating inside loops (token is cached per-tenant).
- Avoid fetching full SKU catalogs when filters are provided.
- Do not load large datasets into memory unnecessarily.
