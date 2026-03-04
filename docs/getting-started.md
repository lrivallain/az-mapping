# Getting Started

This guide covers everything you need to install and run az-scout.

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Python** | ≥ 3.11 |
| **Azure credentials** | Any method supported by `DefaultAzureCredential` (`az login`, managed identity, environment variables, …) |
| **RBAC** | **Reader** on the subscriptions you want to query; **Virtual Machine Contributor** for Spot Placement Scores |
| **Azure OpenAI** *(optional)* | For the AI Chat Assistant — set `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, and optionally `AZURE_OPENAI_API_VERSION` |

---

## Installation

### Recommended: `uv` (no install required)

[uv](https://docs.astral.sh/uv/) lets you run az-scout directly without a system-wide install:

```bash
# Authenticate to Azure first
az login

# Launch — uv downloads az-scout automatically
uvx az-scout
```

Your browser opens at `http://127.0.0.1:5001` automatically.

### `pip` install

```bash
pip install az-scout
az-scout
```

### Docker

```bash
docker run --rm -p 8000:8000 \
  -e AZURE_TENANT_ID=<your-tenant> \
  -e AZURE_CLIENT_ID=<your-sp-client-id> \
  -e AZURE_CLIENT_SECRET=<your-sp-secret> \
  ghcr.io/lrivallain/az-scout:latest
```

### Dev Container

A [Dev Container](https://containers.dev/) configuration is included. Requires Docker and VS Code with the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension.

1. Open the repository in VS Code.
2. Select **Reopen in Container**.
3. Run:

    ```bash
    uv run az-scout web --host 0.0.0.0 --port 5001 --reload --no-open -v
    ```

---

## CLI Reference

```
az-scout [COMMAND] [OPTIONS]

Commands:
  web   Run the web UI (default)
  mcp   Run the MCP server

az-scout --help      # global help
az-scout web --help  # web subcommand help
az-scout mcp --help  # mcp subcommand help
az-scout --version   # print version
```

### `az-scout web`

Runs the web UI and API server.

| Option | Default | Description |
|--------|---------|-------------|
| `--host TEXT` | `127.0.0.1` | Host to bind to |
| `--port INTEGER` | `5001` | Port to listen on |
| `--no-open` | — | Don't open the browser automatically |
| `-v, --verbose` | — | Enable verbose logging |
| `--reload` | — | Auto-reload on code changes *(development only)* |

### `az-scout mcp`

Runs the MCP server in standalone mode.

| Option | Default | Description |
|--------|---------|-------------|
| `--http` | — | Use Streamable HTTP transport instead of stdio |
| `--port INTEGER` | `8080` | Port for Streamable HTTP transport |
| `-v, --verbose` | — | Enable verbose logging |

---

## Deploy to Azure Container App

az-scout can be deployed as a production web app in Azure using the included Bicep template.

!!! warning "Security note"
    The web UI is designed for local use. Do **not** expose it publicly without additional security measures (authentication, network restrictions, etc.).

### One-click via Azure Portal

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Flrivallain%2Faz-scout%2Fmain%2Fdeploy%2Fmain.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2Flrivallain%2Faz-scout%2Fmain%2Fdeploy%2FcreateUiDefinition.json)

### Bicep CLI

```bash
# Create resource group
az group create -n rg-az-scout -l <your-region>

# Deploy (replace with your subscription IDs)
az deployment group create \
  -g rg-az-scout \
  -f deploy/main.bicep \
  -p readerSubscriptionIds='["SUB_ID_1","SUB_ID_2"]'
```

See [`deploy/main.example.bicepparam`](https://github.com/lrivallain/az-scout/blob/main/deploy/main.example.bicepparam) for all available parameters.

### Resources created

| Resource | Purpose |
|----------|---------|
| **Container App** | Runs `ghcr.io/lrivallain/az-scout` |
| **Managed Identity** | `Reader` role on target subscriptions |
| **VM Contributor** | `Virtual Machine Contributor` for Spot Placement Scores |
| **Log Analytics** | Container logs and diagnostics |
| **Container Apps Env** | Hosting environment |

### Enable Entra ID authentication (EasyAuth)

```bash
# Phase 1: create App Registration before deploying
./deploy/setup-easyauth.sh --enable-mcp

# Deploy with the client credentials
az deployment group create -g rg-az-scout -f deploy/main.bicep \
  -p enableAuth=true -p authClientId='<id>' -p authClientSecret='<secret>'

# Phase 2: add redirect URIs after deployment
./deploy/setup-easyauth.sh --resource-group rg-az-scout --enable-mcp --enable-vscode
```

For a complete walkthrough, see [`deploy/EASYAUTH.md`](https://github.com/lrivallain/az-scout/blob/main/deploy/EASYAUTH.md).

---

## Installing Plugins

az-scout can be extended with plugins. Use the built-in Plugin Manager (puzzle icon in the top-right) for one-click installation, or install manually:

```bash
uv pip install az-scout-plugin-batch-sku
```

Restart az-scout — the plugin is discovered automatically.

See the [Plugin Development Guide](plugins/index.md) to create your own plugin.
