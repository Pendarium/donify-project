# Donnify Backend

This backend is the API layer for the Donnify MVP. It exposes the core services for authentication, users, and future association/volunteer workflows described in the project documentation.

## Stack

- NestJS 11
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT / Passport support for secure authentication

## Architecture

- src/app.module.ts: root module and global configuration
- src/modules/auth/: authentication endpoints and logic
- src/modules/users/: user management and profile logic
- src/modules/associations/: associations CRUD and certification flow
- src/modules/volunteer-offers/: volunteer offers CRUD
- src/modules/reviews/: reviews CRUD
- src/prisma/: Prisma client and database access layer

## Local setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Fill in your PostgreSQL connection string.
   Optional: set `RNA_API_TOKEN` if you want to use API Entreprise directly for association verification. If omitted, Donnify falls back to the public Recherche d'entreprises API.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate the Prisma client and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
5. Start the API:
   ```bash
   npm run dev
   ```

The API will be available at http://localhost:3000/api.

## Useful commands

```bash
npm run build
npm run test
npm run lint
npm run db:studio
npm run db:reset
```

## Project status

The backend currently includes authentication, users, associations, volunteer offers, and reviews modules.
