# Enable Entra ID Authentication (EasyAuth)

This guide walks through creating an Entra ID App Registration and configuring EasyAuth on your az-scout Container App.

## Prerequisites

- Azure CLI (`az`) authenticated with permissions to create App Registrations
- An already-deployed az-scout Container App (see [main README](../README.md#deploy-to-azure-container-app))
- Your Container App URL (e.g. `https://az-scout.<env>.<region>.azurecontainerapps.io`)

## 1. Set variables

```bash
# Your Container App FQDN (from the deployment output)
APP_URL="https://az-scout.<env>.<region>.azurecontainerapps.io"

# Display name for the App Registration
APP_NAME="az-scout"
```

## 2. Create the App Registration

```bash
APP_ID=$(az ad app create \
  --display-name "$APP_NAME" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris "${APP_URL}/.auth/login/aad/callback" \
  --enable-id-token-issuance true \
  --query appId -o tsv)

echo "Client ID: $APP_ID"
```

> **Note:** `--enable-id-token-issuance true` is required — Container Apps EasyAuth uses the `id_token` implicit grant flow.

## 3. Create a client secret

```bash
APP_SECRET=$(az ad app credential reset \
  --id "$APP_ID" \
  --display-name "az-scout-easyauth" \
  --query password -o tsv)

echo "Client Secret: $APP_SECRET"
```

> **Important:** Save this secret immediately — it cannot be retrieved later.

## 4. Create the Service Principal (Enterprise Application)

The Service Principal is the identity object in your tenant that controls user access:

```bash
az ad sp create --id "$APP_ID"
```

## 5. Deploy with EasyAuth enabled

```bash
az deployment group create \
  -g rg-az-scout \
  -f deploy/main.bicep \
  -p readerSubscriptionIds='["SUB_ID_1","SUB_ID_2"]' \
  -p enableAuth=true \
  -p authClientId="$APP_ID" \
  -p authClientSecret="$APP_SECRET"
```

## 6. Restrict access to specific users (optional)

By default, any user in your Entra ID tenant can sign in. To restrict access to specific users or groups:

### Enable assignment requirement

```bash
SP_OBJECT_ID=$(az ad sp show --id "$APP_ID" --query id -o tsv)

az ad sp update --id "$SP_OBJECT_ID" \
  --set appRoleAssignmentRequired=true
```

### Assign a user

```bash
USER_OBJECT_ID=$(az ad user show --id user@example.com --query id -o tsv)

az rest --method POST \
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_OBJECT_ID/appRoleAssignments" \
  --body "{
    \"principalId\": \"$USER_OBJECT_ID\",
    \"resourceId\": \"$SP_OBJECT_ID\",
    \"appRoleId\": \"00000000-0000-0000-0000-000000000000\"
  }"
```

The `appRoleId` of all-zeros is the built-in "Default Access" role.

### Assign a group

```bash
GROUP_OBJECT_ID=$(az ad group show --group "My Group" --query id -o tsv)

az rest --method POST \
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_OBJECT_ID/appRoleAssignments" \
  --body "{
    \"principalId\": \"$GROUP_OBJECT_ID\",
    \"resourceId\": \"$SP_OBJECT_ID\",
    \"appRoleId\": \"00000000-0000-0000-0000-000000000000\"
  }"
```

## Troubleshooting

| Error | Fix |
|---|---|
| `AADSTS700054: response_type 'id_token' is not enabled` | Run `az ad app update --id $APP_ID --set web/implicitGrantSettings/enableIdTokenIssuance=true` |
| `AADSTS700016: application was not found` | Verify `authClientId` matches the App Registration and it's in the correct tenant |
| `AADSTS50105: admin has not granted consent` | Assignment is required but the user is not assigned — see step 6 |
| "Assignment required?" toggle is greyed out in the portal | Use the CLI command in step 6 instead |
| `Resource does not exist` when querying the SP | Create it first with `az ad sp create --id $APP_ID` |
| `AADSTS65001: The user or administrator has not consented to use the application` | The App Registration must expose an API and pre-authorize the Azure CLI — see [step 7](#7-connect-mcp-clients-through-easyauth) |

## 7. Connect MCP clients through EasyAuth

When EasyAuth is enabled, the MCP SSE endpoint (`/mcp/sse`) is also protected. Browser-based access handles login automatically via redirects, but programmatic MCP clients (VS Code Copilot, Claude Desktop, etc.) must pass a bearer token in the request headers.

### Expose an API and pre-authorize the Azure CLI

Before you can obtain tokens with `az account get-access-token`, your App Registration must expose an API scope and pre-authorize the Azure CLI as a client application.

#### a. Add an Application ID URI and a `user_impersonation` scope

```bash
# Set the Application ID URI
az ad app update --id "$APP_ID" \
  --identifier-uris "api://$APP_ID"

# Get the object ID (different from appId)
APP_OBJECT_ID=$(az ad app show --id "$APP_ID" --query id -o tsv)

# Generate a unique ID for the scope
SCOPE_ID=$(uuidgen)

# Add the user_impersonation scope
az rest --method PATCH \
  --uri "https://graph.microsoft.com/v1.0/applications/$APP_OBJECT_ID" \
  --body "{
    \"api\": {
      \"oauth2PermissionScopes\": [{
        \"adminConsentDescription\": \"Access az-scout\",
        \"adminConsentDisplayName\": \"Access az-scout\",
        \"id\": \"$SCOPE_ID\",
        \"isEnabled\": true,
        \"type\": \"User\",
        \"userConsentDescription\": \"Access az-scout on your behalf\",
        \"userConsentDisplayName\": \"Access az-scout\",
        \"value\": \"user_impersonation\"
      }]
    }
  }"

echo "Scope ID: $SCOPE_ID"
```

#### b. Pre-authorize the Azure CLI

The Azure CLI has a well-known App ID: `04b07795-8ddb-461a-bbee-02f9e1bf7b46`. Pre-authorizing it allows `az account get-access-token` to work without interactive consent:

```bash
az rest --method PATCH \
  --uri "https://graph.microsoft.com/v1.0/applications/$APP_OBJECT_ID" \
  --body "{
    \"api\": {
      \"preAuthorizedApplications\": [{
        \"appId\": \"04b07795-8ddb-461a-bbee-02f9e1bf7b46\",
        \"delegatedPermissionIds\": [\"$SCOPE_ID\"]
      }]
    }
  }"
```

> **Tip:** You can verify the configuration in the Azure Portal under **Entra ID > App registrations > az-scout > Expose an API**. You should see `user_impersonation` listed with the Azure CLI as an authorized client application.

#### c. Grant admin consent for the Azure CLI

The pre-authorization above tells Entra ID *which* scopes the Azure CLI may request, but a **delegated permission grant** (admin consent) is still required so that users are not prompted for interactive consent:

```bash
# Get the Azure CLI's service principal object ID in your tenant
CLI_SP_ID=$(az ad sp show --id 04b07795-8ddb-461a-bbee-02f9e1bf7b46 --query id -o tsv)

# Get your app's service principal object ID
APP_SP_ID=$(az ad sp show --id "$APP_ID" --query id -o tsv)

# Create an OAuth2 permission grant (admin consent for all users)
az rest --method POST \
  --uri "https://graph.microsoft.com/v1.0/oauth2PermissionGrants" \
  --body "{
    \"clientId\": \"$CLI_SP_ID\",
    \"consentType\": \"AllPrincipals\",
    \"resourceId\": \"$APP_SP_ID\",
    \"scope\": \"user_impersonation\"
  }"
```

> **Note:** This requires the `DelegatedPermissionGrant.ReadWrite.All` or `Directory.ReadWrite.All` permission. If you are a tenant admin this works out of the box.

### Obtain a token

Use the Azure CLI to get an access token using the Application ID URI as the resource:

```bash
TOKEN=$(az account get-access-token \
  --resource "api://$APP_ID" \
  --query accessToken -o tsv)
```

> **Note:** Tokens are short-lived (typically 1 hour). You will need to refresh the token periodically.

### VS Code Copilot (recommended)

Create a `.vscode/mcp.json` in your workspace (or add to your user `settings.json` under `mcp.servers`):

```jsonc
{
  "inputs": [
    {
      "type": "promptString",
      "id": "az-scout-token",
      "description": "Bearer token (run: az account get-access-token --resource api://<APP_ID> --query accessToken -o tsv)",
      "password": true
    }
  ],
  "servers": {
    "az-scout": {
      "type": "sse",
      "url": "https://az-scout.<env>.<region>.azurecontainerapps.io/mcp/sse",
      "headers": {
        "Authorization": "Bearer ${input:az-scout-token}"
      }
    }
  }
}
```

VS Code will prompt you for the token when the MCP server connection is first established.

To refresh an expired token, restart the MCP server (`MCP: List Servers` → restart) and paste a fresh token.

### Claude Desktop / generic MCP clients

Add a `headers` block to your MCP client configuration:

```json
{
  "mcpServers": {
    "az-scout": {
      "url": "https://az-scout.<env>.<region>.azurecontainerapps.io/mcp/sse",
      "headers": {
        "Authorization": "Bearer <TOKEN>"
      }
    }
  }
}
```

Replace `<TOKEN>` with the output of `az account get-access-token --resource api://<APP_ID> --query accessToken -o tsv`.

### Verify the token

You can test that your token works before configuring the MCP client:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://az-scout.<env>.<region>.azurecontainerapps.io/api/tenants"
```

A successful response confirms the token is valid and EasyAuth accepts it.

## Concepts

- **App Registration** — defines *what* your application is (client ID, redirect URIs, secrets). Found under **Entra ID > App registrations**.
- **Enterprise Application (Service Principal)** — controls *who* can access it (user assignments, conditional access). Auto-created when you run `az ad sp create`. Found under **Entra ID > Enterprise applications**.
- **EasyAuth** — Azure's built-in authentication middleware. It intercepts requests before they reach your app, handling login/logout/token validation at the platform level. No code changes needed.
