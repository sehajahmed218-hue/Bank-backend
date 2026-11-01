# Backend Ledger API

A REST API for user authentication, account management, and ledger-backed transfers. The service uses Express, MongoDB, and Mongoose.

## Features

- User registration and login with JWT authentication
- Account creation and balance lookup
- Account-to-account transactions with idempotency keys
- Immutable debit and credit ledger entries
- Email notifications for registration and successful transfers
- A system-user-only endpoint for adding initial funds

## Requirements

- Node.js and npm
- MongoDB configured as a replica set (the transaction endpoints use MongoDB sessions and transactions)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/backend-ledger?replicaSet=rs0
   JWT_SECRET=replace-with-a-long-random-secret

   # Gmail OAuth2 settings for email notifications
   EMAIL_USER=your-email@example.com
   CLIENT_ID=your-google-oauth-client-id
   CLIENT_SECRET=your-google-oauth-client-secret
   REFRESH_TOKEN=your-google-oauth-refresh-token
   ```

   `PORT` is optional and defaults to `3000`. Configure MongoDB with a replica set and use its connection string for `MONGO_URI`. The email credentials are used for registration and transaction notifications.

3. Start the server:

   ```bash
   npm start
   ```

   For development with automatic restarts:

   ```bash
   npm run dev
   ```

The health endpoint is `GET /` and returns `Ledger Service is up and running`.

## Authentication

Registration and login return a JWT and set it in a `token` cookie. For protected endpoints, send that cookie or provide the token as a bearer token:

```http
Authorization: Bearer <token>
```

## API

All request and response bodies use JSON.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a user |
| `POST` | `/api/auth/login` | Public | Log in |
| `POST` | `/api/auth/logout` | Public | Log out and invalidate the current token |
| `POST` | `/api/accounts` | Authenticated | Create an account |
| `GET` | `/api/accounts` | Authenticated | List the signed-in user's accounts |
| `GET` | `/api/accounts/balance/:accountId` | Authenticated | Get the balance of the user's account |
| `POST` | `/api/transactions` | Authenticated | Transfer funds between accounts |
| `POST` | `/api/transactions/system/initial-funds` | System user | Add initial funds to an account |

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Alex Example",
  "email": "alex@example.com",
  "password": "choose-a-password"
}
```

Passwords must be at least six characters. Registration returns the user and a JWT.

### Log in

```json
{
  "email": "alex@example.com",
  "password": "choose-a-password"
}
```

### Create an account

Send an authenticated `POST /api/accounts` request with an empty JSON object. The account is created for the signed-in user and defaults to `INR`.

### Get a balance

```http
GET /api/accounts/balance/<accountId>
```

The response includes the account ID and its balance, calculated from ledger entries.

### Transfer funds

```http
POST /api/transactions
Content-Type: application/json
```

```json
{
  "fromAccount": "<sender-account-id>",
  "toAccount": "<recipient-account-id>",
  "amount": 100,
  "idempotencyKey": "unique-key-for-this-transfer"
}
```

Both accounts must be active, and the sender must have sufficient funds. Use a unique `idempotencyKey` for each transfer to prevent duplicate processing.

### Add initial funds

```http
POST /api/transactions/system/initial-funds
Content-Type: application/json
```

```json
{
  "toAccount": "<recipient-account-id>",
  "amount": 1000,
  "idempotencyKey": "unique-key-for-this-funding"
}
```

This endpoint requires a JWT belonging to a system user. The public registration endpoint creates regular users, not system users.
