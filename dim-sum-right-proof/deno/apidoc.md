# DimSum RightProof API Documentation

Base URL: `https://your-api-domain.com` (or `http://localhost:8000` for local development)

---

## Overview

This API provides endpoints for managing dataset licences in the DimSum RightProof system. It supports CRUD operations for dataset licence records stored in Supabase.

---

## Endpoints

### General

#### GET `/`

Returns a welcome message.

**cURL:**
```bash
curl http://localhost:8000/
```

**Response:**
```
Hello from AI DimSum RightProof!
```

---

#### GET `/docs`

Returns the raw API documentation in markdown format.

**cURL:**
```bash
curl http://localhost:8000/docs
```

**Response:** Raw markdown text

---

#### GET `/docs/html`

Returns the API documentation rendered as HTML with GitHub Flavored Markdown styling.

**cURL:**
```bash
curl http://localhost:8000/docs/html
```

**Response:** HTML document

---

### Dataset Licences

#### GET `/dataset_licences`

Fetch all dataset licences, ordered by creation date (newest first).

**cURL:**
```bash
curl http://localhost:8000/dataset_licences
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "created_at": "2025-01-24T10:00:00.000Z",
      "context": "Markdown content describing the licence...",
      "unique_id": "550e8400-e29b-41d4-a716-446655440000",
      "cantonese_categories_id": 1,
      "nft_id": 123
    }
  ]
}
```

**Error Response (500):**
```json
{
  "error": "Could not fetch dataset_licences"
}
```

---

#### GET `/dataset_licences/:id`

Fetch a single dataset licence by ID or UUID.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Either the numeric `id` or the `unique_id` (UUID format) |

**cURL (by numeric ID):**
```bash
curl http://localhost:8000/dataset_licences/1
```

**cURL (by UUID):**
```bash
curl http://localhost:8000/dataset_licences/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "created_at": "2025-01-24T10:00:00.000Z",
    "context": "Markdown content describing the licence...",
    "unique_id": "550e8400-e29b-41d4-a716-446655440000",
    "cantonese_categories_id": 1,
    "nft_id": 123
  }
}
```

**Error Response (404):**
```json
{
  "error": "Dataset licence not found"
}
```

---

#### POST `/dataset_licences`

Create a new dataset licence.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Name of the dataset (stored as `name` in database) |
| `context` | `string` | No | Markdown content describing the licence terms and conditions |
| `cantonese_categories_id` | `number` | No | Reference to cantonese categories table |
| `nft_id` | `number` | No | Reference to the NFT ID |

**cURL:**
```bash
curl -X POST http://localhost:8000/dataset_licences \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Dataset",
    "context": "# Data Tokenization Protocol\n\n## Profit Distribution\n- 70% to token holders\n- 20% to original creator\n- 10% for maintenance",
    "cantonese_categories_id": 1,
    "nft_id": 123
  }'
```

**Success Response (201):**
```json
{
  "data": {
    "id": 1,
    "created_at": "2025-01-24T10:00:00.000Z",
    "name": "My Dataset",
    "context": "# Data Tokenization Protocol...",
    "unique_id": "550e8400-e29b-41d4-a716-446655440000",
    "cantonese_categories_id": 1,
    "nft_id": 123
  },
  "message": "Dataset licence created successfully"
}
```

**Error Response (500):**
```json
{
  "error": "Could not create dataset_licence"
}
```

---

#### PUT `/dataset_licences/:unique_id`

Update an existing dataset licence by unique_id.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `unique_id` | `uuid` | The UUID of the dataset licence to update |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `context` | `string` | No | Markdown content describing the licence terms and conditions |
| `cantonese_categories_id` | `number` | No | Reference to cantonese categories table |
| `nft_id` | `number` | No | Reference to the NFT ID |

**cURL:**
```bash
curl -X PUT http://localhost:8000/dataset_licences/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "context": "Updated licence content...",
    "cantonese_categories_id": 2,
    "nft_id": 456
  }'
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "created_at": "2025-01-24T10:00:00.000Z",
    "context": "Updated licence content...",
    "unique_id": "550e8400-e29b-41d4-a716-446655440000",
    "cantonese_categories_id": 2,
    "nft_id": 456
  },
  "message": "Dataset licence updated successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Dataset licence not found"
}
```

**Error Response (500):**
```json
{
  "error": "Could not update dataset_licence"
}
```

---

#### DELETE `/dataset_licences/:id`

Delete a dataset licence by ID.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The numeric ID of the dataset licence to delete |

**cURL:**
```bash
curl -X DELETE http://localhost:8000/dataset_licences/1
```

**Success Response:**
```json
{
  "message": "Dataset licence deleted successfully"
}
```

**Error Response (500):**
```json
{
  "error": "Could not delete dataset_licence"
}
```

---

## Data Schema

### Dataset Licence

| Field | Type | Description |
|-------|------|-------------|
| `id` | `bigint` | Auto-generated primary key |
| `created_at` | `timestamp` | Auto-generated creation timestamp |
| `name` | `text` | Name of the dataset (nullable) |
| `context` | `text` | Markdown content for the licence (nullable) |
| `unique_id` | `uuid` | Auto-generated unique identifier |
| `cantonese_categories_id` | `bigint` | Foreign key to cantonese categories (nullable) |
| `nft_id` | `bigint` | Reference to NFT ID (nullable) |

---

## Environment Variables

The API requires the following environment variables:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |

---

## Running Locally

```bash
# Development mode with hot reload
deno task dev

# Production mode
deno task start
```

The server runs on port `8000` by default.

---

## CORS

CORS is enabled for all routes, allowing cross-origin requests from any domain.
