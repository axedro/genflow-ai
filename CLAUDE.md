# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

GenFlow AI is a full-stack TypeScript application with a modular architecture:

- **Backend**: Express.js API server with Prisma ORM, PostgreSQL database, Redis caching, and JWT authentication
- **Frontend**: React with Vite, TypeScript, Zustand for state management, React Query for data fetching, and Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM for data modeling and migrations
- **Infrastructure**: Docker Compose for local development environment

The application follows a workspace-based multi-tenant architecture where users belong to workspaces and can have different roles (OWNER, ADMIN, USER, VIEWER).

## Development Commands

### Backend (`/backend`)
```bash
# Development
npm run dev              # Start development server with nodemon
npm run build           # Compile TypeScript to JavaScript
npm run start           # Run production server

# Testing
npm run test            # Run Jest tests
npm run test:watch      # Run tests in watch mode
npm run test:ci         # Run tests with coverage for CI

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes to database
npm run db:migrate      # Run database migrations
npm run db:studio       # Open Prisma Studio

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Run ESLint with auto-fix
```

### Frontend (`/frontend`)
```bash
npm run dev             # Start Vite development server
npm run build           # Build for production (TypeScript check + Vite build)
npm run lint            # Run ESLint
npm run preview         # Preview production build locally
```

### Infrastructure
```bash
# From project root
docker-compose up       # Start PostgreSQL and Redis services
docker-compose down     # Stop services
```

## Core Domain Models

The application centers around these key entities:
- **User**: Authentication and user management with OAuth support
- **Workspace**: Multi-tenant workspaces with role-based access
- **Workflow**: AI-generated or manual workflow definitions
- **Execution**: Workflow execution tracking and results
- **Integration**: Third-party service connections
- **AIInteraction**: AI usage tracking and analytics

## Key Architectural Patterns

### Backend Structure
- **Controllers**: Handle HTTP requests and responses (`/controllers`)
- **Services**: Business logic and external integrations (`/services`)
- **Routes**: API endpoint definitions with validation (`/routes`)
- **Middleware**: Authentication, validation, and error handling (`/middleware`)
- **Config**: Environment and service configuration (`/config`)

### Frontend Structure
- **Pages**: Top-level route components (`/pages`)
- **Components**: Reusable UI components organized by feature (`/components`)
- **Stores**: Zustand state management (`/stores`)
- **Services**: API communication and external services (`/services`)
- **Hooks**: Custom React hooks (`/hooks`)

### Authentication Flow
- JWT-based authentication with refresh tokens
- Session management with Redis
- OAuth integration support
- Role-based access control at workspace level

### Database Design
- Uses Prisma with PostgreSQL
- Soft deletes with cascade relationships
- Workspace-scoped data isolation
- Audit trails for executions and AI interactions

## Environment Setup

The application requires:
- PostgreSQL database (configured in docker-compose.yml)
- Redis for caching and sessions
- Environment variables for API keys and configuration

## Testing Strategy

- Backend: Jest with Supertest for API testing
- Database: Test database with Prisma migrations
- Setup file: `backend/src/tests/setup.ts` for test configuration