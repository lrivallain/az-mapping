# API Reference

az-scout exposes a REST API backed by FastAPI. Interactive documentation is available at runtime:

- **Swagger UI**: `http://127.0.0.1:5001/docs`
- **ReDoc**: `http://127.0.0.1:5001/redoc`

---

## Discovery Endpoints

### `GET /api/tenants`

List Azure AD tenants accessible with the current credentials.

**Response:**

```json
[
  {
    "tenant_id": "00000000-0000-0000-0000-000000000000",
    "display_name": "Contoso",
    "authenticated": true
  }
]
```

---

### `GET /api/subscriptions`

List enabled Azure subscriptions.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tenantId` | `string` *(optional)* | Scope to a specific tenant |

**Response:**

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "name": "Production"
  }
]
```

---

### `GET /api/regions`

List Azure regions that support Availability Zones.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `subscriptionId` | `string` *(optional)* | Scope to a specific subscription |
| `tenantId` | `string` *(optional)* | Scope to a specific tenant |

**Response:**

```json
[
  {
    "name": "westeurope",
    "displayName": "West Europe"
  }
]
```

---

## Topology Endpoints

### `GET /api/mappings`

Get logical-to-physical zone mappings for subscriptions in a region.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `region` | `string` | Azure region name (e.g. `westeurope`) |
| `subscriptionIds` | `string[]` | One or more subscription IDs |
| `tenantId` | `string` *(optional)* | Tenant ID |

**Response:**

```json
[
  {
    "subscription_id": "00000000-0000-0000-0000-000000000000",
    "subscription_name": "Production",
    "mappings": [
      { "logicalZone": "1", "physicalZone": "westeurope-az1" },
      { "logicalZone": "2", "physicalZone": "westeurope-az2" },
      { "logicalZone": "3", "physicalZone": "westeurope-az3" }
    ]
  }
]
```

---

## Planner Endpoints

### `GET /api/skus`

Get VM SKU availability per zone for a region and subscription.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `region` | `string` | Azure region name |
| `subscriptionId` | `string` | Subscription ID |
| `tenantId` | `string` *(optional)* | Tenant ID |
| `resourceType` | `string` *(optional)* | Resource type filter (default: `virtualMachines`) |
| `name` | `string` *(optional)* | SKU name substring filter |
| `family` | `string` *(optional)* | SKU family substring filter |
| `minVcpus` / `maxVcpus` | `integer` *(optional)* | vCPU count range |
| `minMemoryGb` / `maxMemoryGb` | `float` *(optional)* | Memory range in GB |

---

### `POST /api/deployment-confidence`

Compute Deployment Confidence Scores for one or more SKUs.

**Request body:**

```json
{
  "region": "westeurope",
  "subscription_id": "00000000-0000-0000-0000-000000000000",
  "skus": ["Standard_D4s_v5", "Standard_E4s_v5"],
  "prefer_spot": false,
  "instance_count": 3,
  "include_signals": true
}
```

---

### `GET /api/spot-scores`

Get Spot Placement Scores for VM sizes in a region.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `region` | `string` | Azure region name |
| `subscriptionId` | `string` | Subscription ID |
| `vmSizes` | `string[]` | List of VM size names |
| `tenantId` | `string` *(optional)* | Tenant ID |

---

### `GET /api/sku-pricing`

Get retail pricing for a SKU in a region.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `region` | `string` | Azure region name |
| `skuName` | `string` | SKU name (e.g. `Standard_D4s_v5`) |

---

### `POST /api/deployment-plan`

Generate a ranked deployment plan for a set of requirements.

**Request body:**

```json
{
  "region": "westeurope",
  "subscription_id": "00000000-0000-0000-0000-000000000000",
  "vcpus": 4,
  "memory_gb": 16,
  "instance_count": 3,
  "prefer_spot": false
}
```

**Response:** Ranked list of deployment options with confidence scores, zone distribution, and pricing.

---

## Plugin Manager Endpoints

### `GET /api/plugins`

List all loaded plugins (built-in and external).

### `GET /api/plugins/recommended`

List curated recommended plugins with install status.

### `POST /api/plugins/install`

Install a plugin from PyPI or a GitHub URL.

### `DELETE /api/plugins/{name}`

Uninstall a plugin by name.

---

## Error Responses

Per-subscription errors are returned inline (not as HTTP errors):

```json
{
  "subscription_id": "00000000-0000-0000-0000-000000000000",
  "error": {
    "code": "AuthorizationFailed",
    "message": "User is not authorized to perform this action."
  }
}
```

Unhandled server errors return HTTP 500:

```json
{ "error": "Unexpected error message" }
```
