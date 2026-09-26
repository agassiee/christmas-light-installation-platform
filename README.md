# Christmas Light Installation SaaS

This is a production-oriented SaaS application for a Christmas light installation and removal business.

## Prerequisites
- Node.js (v18+)
- Docker and Docker Compose (for local database)

## Local Development Setup

1. **Environment Setup**
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. **Start the Database**
   Start the local PostgreSQL instance using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. **Install Dependencies**
   Install all dependencies for the workspace (frontend and backend):
   ```bash
   npm install
   ```

4. **Database Migrations**
   Run Prisma migrations to set up the schema:
   ```bash
   npm run prisma:migrate
   ```

5. **Start Development Servers**
   Start both the frontend and backend servers:
   ```bash
   npm run dev
   ```

   - Frontend will run on `http://localhost:5173`
   - Backend will run on `http://localhost:3000`

## Useful Commands
- `npm run dev` - Start development servers.
- `npm run typecheck` - Run TypeScript compiler checks.
- `npm run lint` - Run ESLint.
- `npm run test` - Run automated tests.
- `npm run prisma:studio` - Open Prisma Studio to inspect the database.
