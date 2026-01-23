Below is a **frontend-facing API documentation draft** for **ThreadSwap Backend API (v1)**, based on the currently implemented routing and auth service/controller behavior you’ve shared (and the endpoints you have already exercised in integration tests).

---

# ThreadSwap Backend API (v1) — Frontend Documentation

## Base URL

- Local: `http://localhost:8080` (or your configured `PORT`)
- All API routes are under: **`/api/v1`**

## Content Type

- JSON requests/responses unless otherwise stated.
- Default headers:
  - `Content-Type: application/json`
  - `Accept: application/json`

## Authentication

- Authenticated routes require a **Bearer JWT**:
  - Header: `Authorization: Bearer <access_token>`

## Standard Error Response

Your error middleware produces structured errors. Frontend should rely on:

- `type` (string) — machine-readable error type
- `detail` (string) — human-readable message

Example:

```json
{
  "type": "auth_error",
  "detail": "Invalid credentials"
}
```

Common status codes:

- `400` Validation errors
- `401` Unauthorized (missing/invalid token or invalid credentials)
- `409` Conflict (e.g., duplicate email)

---

# Health & Readiness

## GET `/health`

Basic service health check.

**Response 200**

```json
{ "ok": true }
```

(Exact payload may vary; treat HTTP 200 as “healthy”.)

## GET `/health/ready`

Readiness probe (typically includes DB connectivity checks).

**Response 200**

```json
{ "ok": true }
```

If dependencies are unavailable, expect non-200.

---

# Auth API

Base path: **`/api/v1/auth`**

## POST `/register`

Create a new user account.

**Request**

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

Validation rules (current):

- `email` must be non-empty
- `password` must be **>= 8 characters**

**Response 201**

```json
{
  "user": {
    "id": "uuid-or-cuid",
    "email": "test@example.com",
    "createdAt": "2026-01-22T16:25:57.294Z"
  },
  "token": "jwt_access_token"
}
```

**Errors**

- `400` invalid email/password
- `409` email already registered

---

## POST `/login`

Authenticate and receive a JWT.

**Request**

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response 200**

```json
{
  "user": {
    "id": "uuid-or-cuid",
    "email": "test@example.com"
  },
  "token": "jwt_access_token"
}
```

**Errors**

- `400` invalid payload (missing email/password)
- `401` invalid credentials

---

## GET `/me`

Get the currently authenticated user.

**Headers**

- `Authorization: Bearer <token>`

**Response 200**

```json
{
  "user": {
    "id": "uuid-or-cuid",
    "email": "test@example.com",
    "createdAt": "2026-01-22T16:25:57.294Z"
  }
}
```

**Errors**

- `401` missing/invalid token

---

## POST `/forgot-password`

Triggers password reset flow. Returns **generic success** (do not leak whether an email exists).

**Request**

```json
{
  "email": "test@example.com"
}
```

**Response 200**

```json
{
  "ok": true
}
```

(Frontend should show a generic message like: “If that email exists, we’ve sent a reset link.”)

---

## POST `/reset-password`

Resets password using a reset token.

**Request**

```json
{
  "token": "reset_token_string",
  "newPassword": "newpassword123"
}
```

**Response 200**

```json
{ "ok": true }
```

**Errors**

- `400` invalid token / expired token / reused token
- `400` invalid new password (if enforced)

---

## POST `/resend-verification`

Resends verification email. Returns **generic success** for privacy.

**Request**

```json
{
  "email": "test@example.com"
}
```

**Response 200**

```json
{ "ok": true }
```

Notes:

- If user is already verified, this should still return 200 (no-op).

---

## POST `/verify-email`

Verifies email using a verification token.

**Request**

```json
{
  "token": "verification_token_string"
}
```

**Response 200**

```json
{ "ok": true }
```

**Errors**

- `400` invalid token / expired / reused

---

# Email (Dev/Test)

Base path: **`/api/v1/email`**

## POST `/test`

Sends a test email (Mailtrap/SMTP). Useful for verifying SMTP integration.

**Request**

```json
{
  "to": "someone@example.com",
  "subject": "Mailtrap test",
  "text": "Hello",
  "html": "<p>Hello</p>"
}
```

**Response 200**

```json
{
  "messageId": "..."
}
```

---

# Uploads

Base path: **`/api/v1/uploads`**

This module is registered, and your S3 service requires `AWS_S3_BUCKET` etc. The exact endpoints depend on `uploads.routes.ts` in your repo; document them under this section with:

- Upload URL
- Request content type (`multipart/form-data` vs JSON)
- Response shape:
  - stable `imageKey` (bucket+key persisted)
  - `imageUrl` (signed URL currently, later CDN)

If you paste the contents of `src/modules/uploads/routes/uploads.routes.ts` (and its controller), I’ll produce the exact upload docs in the same format as Auth above.

---

# Frontend Implementation Notes

## Token storage

- Prefer storing JWT in memory or secure storage (mobile secure storage).
- Send it via `Authorization: Bearer ...` header on protected endpoints (`/me`, and later any marketplace actions).

## Generic-success endpoints

- `forgot-password` and `resend-verification` must always show the same user-facing message regardless of whether the email exists.

---

If you want this delivered as a single `API.md` ready to commit under `/docs`, say so and I’ll format it as a clean markdown document with a table-of-contents and consistent examples.
