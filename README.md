# API Observability Platform

A user-centric proxy, monitoring, and analytics platform for external APIs. Register endpoints, receive unique proxy URLs, and observe request/response traffic with usage analytics, latency metrics, and optional Telegram/Slack notifications.

## Features

- **Proxy Engine**: Path-based (`/r/{slug}/...`) and subdomain-based routing. Forwards requests to your target URL while logging metadata.
- **Request Logging**: Captures method, path, headers (sensitive data masked), body (truncated), response status, duration.
- **Analytics**: Summary stats (total requests, avg latency, uptime %), time-series charts, method/status breakdowns.
- **Notifications**: Telegram and Slack integrations with alert rules (e.g., status >= 500, latency > 2000ms) and throttling.
- **Security**: Header masking (Authorization, Cookie, etc.), rate limiting on management API.

## Tech Stack

- **Backend**: NestJS, Prisma, PostgreSQL, JWT auth
- **Frontend**: React, Vite, TanStack Query, Recharts, Tailwind CSS
- **Infra**: Docker Compose (Postgres, Redis)

## Quick Start

### Prerequisites

- Node.js 22+
- Docker (for Postgres)
- PostgreSQL (or use Docker)

### 1. Clone and install

```bash
git clone <repo-url>
cd proxy-server
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and set:

Use `.env.example` as a template. Important variables:

- `POSTGRES_URL` – Prisma connection string
- `JWT_SECRET` – required; access tokens use `JWT_ACCESS_EXPIRES_IN` (e.g. `15m`), refresh cookies use `JWT_REFRESH_EXPIRES_IN` (e.g. `7d`)
- `CORS_ORIGIN` – comma-separated allowed origins (e.g. `http://localhost:5173`)
- `REDIS_URL` or `REDIS_HOST` – optional; enables distributed alert throttling
- `SMTP_*` – optional; without SMTP, verification/reset codes are logged by the backend

### 3. Database

Ensure Postgres is running (e.g. `npm run docker:local:up`), then:

```bash
npm run db:migrate:dev -w apps/backend
```

After pulling changes, apply new migrations (adds email verification, refresh tokens, etc.).

### 4. Run

**Terminal 1 – Backend:**

```bash
npm run start:dev -w apps/backend
```

**Terminal 2 – Frontend:**

```bash
npm run dev -w apps/web
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### 5. Test the proxy

1. Register, verify email with the 6-digit code (check server logs if SMTP is not configured), then sign in.
2. Create an endpoint (e.g. name: "Test", target: `https://httpbin.org`).
3. Copy the proxy URL (e.g. `http://localhost:3000/r/abc123xyz`).
4. Send a request: `curl http://localhost:3000/r/abc123xyz/get`
5. View logs and analytics in the dashboard.

## API Reference

### Auth

Base path: `/api/v1/auth`. Public routes use `@Public()`; other API routes require `Authorization: Bearer <accessToken>`. Refresh token is an **httpOnly** cookie (`refresh_token`, path `/`).

| Method | Path                       | Description |
| ------ | -------------------------- | ----------- |
| POST   | `/auth/sign-up`            | Register; sends verification email (or logs code) |
| POST   | `/auth/verify-email`       | Body: `email`, `code` — returns access token + sets refresh cookie |
| POST   | `/auth/resend-verification`| Body: `email` |
| POST   | `/auth/sign-in`            | Login (verified email only); sets refresh cookie |
| POST   | `/auth/refresh`            | Rotate refresh cookie; new access token in body |
| POST   | `/auth/logout`             | Revoke refresh session (Bearer + cookie) |
| GET    | `/auth/me`                 | Current user |
| POST   | `/auth/forgot-password`    | Body: `email` |
| POST   | `/auth/reset-password`     | Body: `email`, `code`, `newPassword` |

### Endpoints

| Method | Path             | Description                                     |
| ------ | ---------------- | ----------------------------------------------- |
| GET    | `/endpoints`     | List user endpoints                             |
| POST   | `/endpoints`     | Create (body: `name`, `targetUrl`, `isActive?`) |
| GET    | `/endpoints/:id` | Get one                                         |
| PATCH  | `/endpoints/:id` | Update                                          |
| DELETE | `/endpoints/:id` | Delete                                          |

All require `Authorization: Bearer <token>`.

### Proxy

Requests to `/r/{slug}/...` or `{slug}.your-domain.com/...` are proxied to the configured target. The slug is the unique identifier from the endpoint.

### Logs

| Method | Path                         | Description                                              |
| ------ | ---------------------------- | -------------------------------------------------------- |
| GET    | `/logs/endpoint/:endpointId` | List logs (query: `limit`, `offset`, `method`, `status`) |
| GET    | `/logs/:id`                  | Get single log                                           |

### Analytics

| Method | Path                                | Description                            |
| ------ | ----------------------------------- | -------------------------------------- |
| GET    | `/analytics/:endpointId/summary`    | Summary stats                          |
| GET    | `/analytics/:endpointId/timeseries` | Time-series (query: `bucket`, `limit`) |
| GET    | `/analytics/:endpointId/breakdown`  | By method and status                   |

### Notifications

| Method | Path                                      | Description                                                |
| ------ | ----------------------------------------- | ---------------------------------------------------------- |
| POST   | `/notifications/channels`                 | Create channel (body: `type`, `config`)                    |
| GET    | `/notifications/channels`                 | List channels                                              |
| POST   | `/notifications/alert-rules`              | Create rule (body: `endpointId`, `channelId`, `condition`) |
| GET    | `/notifications/alert-rules/endpoint/:id` | List rules for endpoint                                    |

## Deployment

### VPS with Nginx and Let's Encrypt

1. **Provision a VPS** (Ubuntu 22.04 recommended).

2. **Install Node, Docker, Nginx, Certbot:**

   ```bash
   sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx docker.io
   ```

3. **DNS**: Add an A record for your domain (e.g. `proxy.example.com`) and a wildcard `*.proxy.example.com` pointing to the server IP.

4. **Build and run:**

   ```bash
   npm run build -w apps/backend
   npm run build -w apps/web
   ```

5. **Nginx** – reverse proxy for API and frontend, SSL termination:

   ```nginx
   server {
       listen 80;
       server_name proxy.example.com *.proxy.example.com;
       return 301 https://$host$request_uri;
   }
   server {
       listen 443 ssl;
       server_name proxy.example.com *.proxy.example.com;
       ssl_certificate /etc/letsencrypt/live/proxy.example.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/proxy.example.com/privkey.pem;

       location / {
           proxy_pass http://localhost:5173;  # or serve static from apps/web/dist
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
       }
       location ~ ^/(auth|endpoints|logs|analytics|notifications|r) {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

6. **Wildcard SSL:**

   ```bash
   sudo certbot certonly --nginx -d proxy.example.com -d "*.proxy.example.com"
   ```

7. **Run backend** (e.g. with PM2):

   ```bash
   pm2 start dist/apps/backend/main.js --name api-observability
   ```

## Project Structure

```
proxy-server/
├── apps/
│   ├── backend/     # NestJS API
│   └── web/         # React dashboard
├── libs/shared/
├── docker-compose.local.yml
└── .env.example
```

## License

ISC
