# Overview

This is a web application for "Görkem İnşaat" - a construction management system that uses Google Sheets as a database. The application provides a modern web interface for managing construction projects, financial records, and accounting data while leveraging Google Sheets API for data storage and synchronization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript using Vite as the build tool. It follows a component-based architecture with:
- **UI Framework**: Shadcn/UI components built on Radix UI primitives for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark modes)
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
The backend uses Node.js with Express in a full-stack TypeScript setup:
- **Server Framework**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM configured for PostgreSQL with schema definitions
- **Storage Strategy**: Hybrid approach using both PostgreSQL for local caching and Google Sheets as the primary data source
- **Build System**: ESBuild for production bundling, TSX for development

## Data Storage Solutions
The application implements a dual-storage approach:
- **Primary Storage**: Google Sheets accessed via Google Sheets API v4
- **Local Cache**: PostgreSQL database using Drizzle ORM for improved performance
- **Synchronization**: Manual sync functionality to pull data from Google Sheets into local cache
- **Schema Management**: Drizzle migrations for database versioning

The data model includes:
- Sheets metadata (tracking Google Sheet tabs)
- Sheet records (cached row data)
- Projects (construction project tracking)
- Transactions (financial records)
- Dashboard metrics (computed analytics)

## Authentication and Authorization
The system uses Google Service Account authentication:
- Service account credentials stored in environment variables
- Google Sheets API access with appropriate scopes
- No user authentication system (single organization use case)

## External Dependencies

### Google Services
- **Google Sheets API v4**: Primary data storage and retrieval
- **Google Service Account**: Authentication for API access
- **@neondatabase/serverless**: PostgreSQL connection driver for Neon database

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling and validation
- **Zod**: Runtime type validation and schema definition
- **Chart.js**: Data visualization for dashboard charts
- **Tailwind CSS**: Utility-first CSS framework

### Backend Services
- **Express.js**: Web server framework
- **Drizzle ORM**: Type-safe database operations
- **connect-pg-simple**: PostgreSQL session store
- **Google APIs**: Node.js client for Google services

### Development Tools
- **Vite**: Frontend build tool with HMR
- **TypeScript**: Static type checking
- **ESBuild**: Backend bundling for production
- **Replit**: Hosting and development environment