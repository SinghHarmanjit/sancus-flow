# API Contracts: Chat API

**Feature**: 000-agentic-apis-bootstrap
**Service**: `agentic-apis` (Port 4001)
**Base URL**: `http://localhost:4001`

---

## POST `/chat/session`

Create a new chat session.

### Request Body
```json
{
  "domain": "wills" | "conveyancing"
}
```

### Response `201 Created`
```json
{
  "sessionId": "uuid",
  "domain": "wills",
  "status": "active",
  "createdAt": "2026-10-03T00:00:00.000Z"
}
```

### Errors
| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_DOMAIN` | domain is not `wills` or `conveyancing` |

---

## POST `/chat/:sessionId/message`

Send a user message and receive an LLM reply.

### Path Params
- `sessionId` — UUID of an active session

### Request Body
```json
{
  "content": "I need help with my will"
}
```

### Response `201 Created`
```json
{
  "messageId": "uuid",
  "reply": "I can help with that. Could you tell me...",
  "sessionId": "uuid"
}
```

### Errors
| Status | Code | Description |
|--------|------|-------------|
| 400 | `EMPTY_CONTENT` | `content` is empty or whitespace |
| 404 | `SESSION_NOT_FOUND` | sessionId does not exist |
| 422 | `SESSION_CLOSED` | session status is not `active` |
| 503 | `LLM_UNAVAILABLE` | LLM service not reachable |

---

## GET `/chat/:sessionId`

Retrieve session details with full message history.

### Response `200 OK`
```json
{
  "sessionId": "uuid",
  "domain": "wills",
  "status": "active",
  "createdAt": "2026-10-03T00:00:00.000Z",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "I need help with my will",
      "createdAt": "2026-10-03T00:00:01.000Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "I can help with that...",
      "createdAt": "2026-10-03T00:00:02.000Z"
    }
  ]
}
```

### Errors
| Status | Code | Description |
|--------|------|-------------|
| 404 | `SESSION_NOT_FOUND` | sessionId does not exist |

---

## GET `/health`

Health check endpoint.

### Response `200 OK`
```json
{
  "status": "ok",
  "db": "connected",
  "llm": "reachable"
}
```

---

## NestJS DTO Schemas

```ts
// CreateSessionDto
class CreateSessionDto {
  @IsIn(['wills', 'conveyancing'])
  domain: 'wills' | 'conveyancing';
}

// SendMessageDto
class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
```

All requests validated by NestJS global `ValidationPipe` with `whitelist: true`.
