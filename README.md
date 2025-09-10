# 🏴‍☠️ Treasure Hunt App

A pirate themed QR code-based treasure hunt application.

### Prerequisites

- Node.js 18+
- Docker Desktop
- Yarn 4.0+

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd treasure_hunt
yarn install
```

### 2. Environment Setup

```bash
# Copy environment template (backend)
cp backend/.env.example backend/.env

# Copy environment template (frontend)
cp frontend/.env.local.example frontend/.env.local
```

Edit the files with your configuration

### 3. Start Services

```bash
# Start database container, backend, and frontend
yarn dev
```

### 4. Access the Application

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## Testing

The project includes comprehensive unit and integration tests for both backend and frontend.

```bash
# Run all backend and frontend unit tests
yarn test
```

### Database Management

```bash
# Start PostgreSQL container
yarn db:up

# Stop PostgreSQL container
yarn db:down

# View database logs
yarn db:logs

# Reset database (deletes all data)
yarn db:reset

# Connect to database directly
docker compose exec postgres psql -U postgres -d treasure_hunt
```
