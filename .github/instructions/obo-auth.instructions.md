---
description: "OBO authentication flow, session management, auth middleware, admin roles. USE WHEN editing auth routes, OBO token exchange, session cookies, or admin RBAC."
applyTo: "src/az_scout/routes/auth.py,src/az_scout/azure_api/_obo.py,src/az_scout/auth.py,src/az_scout/templates/login.html"
---

# OBO (On-Behalf-Of) authentication

Activated when `AZ_SCOUT_CLIENT_ID` and `AZ_SCOUT_CLIENT_SECRET` env vars are set.

## Server-side auth flow

1. User visits `/auth/login` → login page with sign-in options
2. Click "Sign in" → `/auth/login/start` → redirect to Microsoft login
3. Microsoft callback → `/auth/callback` → OBO exchange tested → session cookie created
4. Session stored as HMAC-SHA256 signed HTTP-only cookie
5. CSRF nonces on OAuth state parameter

## Single-tenant-per-session model

- Each session is scoped to the login tenant (extracted from JWT `tid` claim)
- No cross-tenant OBO — to switch tenants, sign out and sign in again
- `list_tenants` returns the single login tenant in OBO mode (no ARM call needed)

## Auth context propagation

- `_AuthContextMiddleware` (raw ASGI, not BaseHTTPMiddleware) reads tokens from:
  - `Authorization: Bearer ...` header (MCP clients)
  - Session cookie (web browser)
- Sets module-level global + contextvars for downstream use
- CLI mode has no middleware → falls through to `DefaultAzureCredential`

## OBO validation at login

- OBO exchange tested in callback before creating session
- Consent/MFA/user errors redirect to login page with specific error messages
- Session never created with invalid auth

## Admin role

- Entra ID App Role `Admin` from home tenant
- `_require_admin()` guard on plugin management write endpoints
- Only honored from the home tenant
- `admin-only` CSS class for role-based UI visibility

## Token cache

- Keyed by full token hash + tenant to prevent cross-user cache pollution
- Session TTL: 8 hours with sliding expiry

## `OboTokenError`

- Exception with `error_code` and optional `claims` fields
- Handled by dedicated exception handler in `app.py` returning 401
