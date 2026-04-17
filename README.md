# StockMaster Pro

StockMaster Pro is a full-stack inventory and point-of-sale (POS) platform for small and medium retail businesses. It combines product inventory control, customer and employee management, checkout operations, analytics dashboards, and auditability in a single web application.

## Project Overview

The project follows a clear three-layer architecture:

- `frontend` - React + Vite + Tailwind CSS single-page application.
- `backend` - Spring Boot REST API with JWT authentication and business logic.
- `database` - PostgreSQL for persistent transactional data.

The frontend communicates with the backend through `/api/*` endpoints. The backend manages domain logic, security, and database operations through JPA/Hibernate.

## Core Features

- JWT-based authentication (`register`, `login`) with protected APIs.
- Inventory lifecycle management (create, update, restock, delete, low-stock tracking).
- POS checkout with stock deduction and transaction recording.
- Customer management with purchase history and loyalty points.
- Employee management.
- Dashboard metrics and chart data for decision support.
- Full audit logging and inventory history tracking.

## Functional Workflow

1. User registration/login returns a JWT token.
2. The frontend stores the token and sends `Authorization: Bearer <token>` for protected endpoints.
3. Inventory is managed from the item module (`/api/items`).
4. At checkout (`/api/sales/checkout`):
   - cart items are validated,
   - stock is decremented,
   - sale and sale-items are persisted,
   - customer points are updated,
   - inventory history and audit logs are written.
5. Dashboard endpoints aggregate sales, stock, and customer data for analytics.
6. Audit and inventory history provide traceability for operations.

## API Scope (High-Level)

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/PUT /api/users/me`, `PUT /api/users/me/password`
- `GET/POST/PUT/DELETE /api/items`, `GET /api/items/barcode/{barcode}`
- `GET/POST/PUT /api/customers`, `GET /api/customers/phone/{phone}`, `GET /api/customers/{id}/history`
- `GET/POST/PUT/DELETE /api/employees`
- `GET /api/sales`, `POST /api/sales/checkout`
- `GET /api/dashboard/stats`, `GET /api/dashboard/chart-data`, `GET /api/dashboard/top-selling`, `GET /api/dashboard/low-stock`, `GET /api/dashboard/recent-sales`
- `GET /api/inventory-history`
- `GET /api/audit-logs`

Authentication rules:

- `/api/auth/**` is public.
- All other `/api/**` routes require a valid JWT.

## Database Operations and Data Flow

Primary entities:

- `users`
- `items`
- `customers`
- `employees`
- `sales`
- `sale_items`
- `inventory_history`
- `audit_logs`

Data behavior:

- Schema is managed by Hibernate (`spring.jpa.hibernate.ddl-auto=update`).
- Checkout is transactional and designed to prevent invalid stock mutations.
- All critical inventory/customer/user actions write audit records.

## Project Structure

```text
stockmaster-pro/
  backend/
    src/main/java/com/stockmaster/
      config/
      controller/
      dto/
      exception/
      model/
      repository/
      security/
      service/
    src/main/resources/application.properties
    pom.xml
  frontend/
    src/
    nginx.conf
    package.json
  docker-compose.yml
  .env
```

## Configuration

Root `.env` (used by Docker Compose):

```env
DB_NAME=stockmaster
DB_USERNAME=stockmaster
DB_PASSWORD=stockmaster123
JWT_SECRET=stockmaster-super-secret-key-that-is-at-least-256-bits-long-for-hs256
```

Important backend properties:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`, `jwt.expiration`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS` (optional override)

## Execution Process

### Option A: Run with Docker (Recommended)

Prerequisites:

- Docker Desktop (or Docker Engine + Compose)

Steps:

1. From project root, ensure `.env` exists and has DB/JWT values.
2. Build and start all services:

```bash
docker compose up -d --build
```

3. Access services:
   - Frontend: `http://localhost:3001`
   - Backend API (host): `http://localhost:8081`
   - Backend health/protected endpoints: via frontend proxy at `http://localhost:3001/api/*`

4. View logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

5. Stop services:

```bash
docker compose down
```

6. Stop services and remove DB volume (full reset):

```bash
docker compose down -v
```

### Option B: Run Locally Without Docker

Prerequisites:

- Java 17+
- Maven 3.9+
- Node.js 20+
- PostgreSQL 16+ (or compatible)

#### 1) Start PostgreSQL

Create database/user matching backend configuration, or set environment variables:

- `DB_URL` (example: `jdbc:postgresql://localhost:5432/stockmaster`)
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`

#### 2) Run Backend

```bash
cd backend
mvn spring-boot:run
```

Default local backend URL: `http://localhost:8080`

#### 3) Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Default frontend dev URL: `http://localhost:3000`

The dev server proxies `/api` requests to `http://localhost:8080`.

## Build and Validation Commands

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
cd backend
mvn clean package -DskipTests
```

## Troubleshooting

- `403` on auth/register:
  verify frontend origin is allowed by backend CORS (`APP_CORS_ALLOWED_ORIGIN_PATTERNS`).
- `401 Unauthorized` on protected endpoints:
  ensure JWT token is included in `Authorization` header.
- Database connection errors:
  verify Postgres is running and credentials match `.env`/backend properties.
- Frontend API not reachable:
  confirm backend container is healthy and frontend `nginx`/Vite proxy is targeting correct backend port.

## Deployment Notes

- Frontend production build is served by Nginx.
- Backend is packaged as a Spring Boot executable JAR.
- Containers are production-friendly and can be deployed to any environment supporting Docker Compose or equivalent orchestration.
"# Shops" 
