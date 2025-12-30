# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Root Level Commands
```bash
# Install all dependencies (client and server)
npm run install:all

# Start both client and server concurrently
npm run dev

# Build production versions
npm run server:build
npm run client:build

# Start production server
npm run server:start
```

### Server Commands (cd server)
```bash
# Development with auto-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Initialize database with sample data
npm run init-db

# Initialize database with 30 sample videos
npm run init-db-30

# Create superadmin user
npm run create-superadmin

# Initialize categories
npm run init-categories

# Upload video files
npm run upload-videos

# Initialize with real video files
npm run init-real-videos
```

### Client Commands (cd client)
```bash
# Start development server (port 3000)
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Architecture Overview

### Full-Stack Structure
This is a monorepo containing a React frontend and Node.js/Express backend for an AI video materials e-commerce platform.

**Frontend (client/)**
- React 18 with TypeScript
- Tailwind CSS for styling 
- React Router for navigation
- React Query for data fetching (legacy v3)
- React Hook Form for form handling
- Axios for HTTP client with automatic JWT token handling
- Context-based state management (AuthContext, CartContext)

**Backend (server/)**
- Express.js with TypeScript
- MongoDB with Mongoose ODM
- JWT authentication with bcryptjs password hashing
- Express rate limiting and helmet security middleware
- Nodemailer for email services
- File upload handling with multer

### Key Architecture Patterns

**Authentication Flow:**
- JWT tokens stored in localStorage
- Automatic token attachment via Axios interceptors (client/src/services/api.ts:9-15)
- Protected routes using `protect` middleware (server/src/middleware/auth.ts)
- Context-based auth state management (client/src/contexts/AuthContext.tsx)
- Auto-logout on 401 responses (client/src/services/api.ts:17-26)

**Data Models:**
- User: username, password (hashed), email, phone, role (user/admin/superadmin) with validation patterns
- Video: title, description, category, price, thumbnailUrl, videoUrl, tags, duration, fileSize
- Cart: user-specific video collections
- Purchase: user purchases with download expiration (48 hours)
- Admin roles support multi-level access control

**API Structure:**
- `/api/auth` - Authentication (register, login, profile, password reset)
- `/api/videos` - Video catalog, search, categories, downloads
- `/api/cart` - Shopping cart operations
- `/api/purchases` - Order creation, payment completion, history

**Database:**
- MongoDB with text indexes on Video title/description/tags for search (server/src/models/Video.ts:65)
- Compound indexes on category, price, createdAt for filtering/sorting (server/src/models/Video.ts:66-68)
- Purchase records include download limits and expiration tracking

## Development Environment Setup

1. Ensure MongoDB is running (default: mongodb://localhost:27017/ai-video-store)
2. Create server/.env from server/.env.example template
3. Configure email settings (Gmail SMTP recommended)
4. Run database initialization: `cd server && npm run init-db`
5. Start development: `npm run dev` (starts both frontend and backend)

**Important Proxy Configuration:** The client is configured to proxy API requests to port 8081 (client/package.json:50), but the server runs on port 5000 by default. You must either:
- Update the client's proxy setting to `"http://localhost:5000"` in client/package.json, OR
- Configure the server to run on port 8081 by setting `PORT=8081` in server/.env

## File Organization

**Frontend Components:**
- Admin/ - Admin panel components and sidebar
- Auth/ - Login, register, password reset modals, route protection
- Layout/ - Header, footer, main layout wrapper
- Video/ - Video cards and display components
- Search/ - Search bar, category filters, sorting
- UI/ - Reusable components (loading, pagination)
- User/ - User profile and account management

**Backend Structure:**
- routes/ - Express route handlers
- models/ - Mongoose schemas and interfaces
- middleware/ - Auth, error handling, rate limiting
- config/ - Database connection setup
- services/ - Business logic services
- utils/ - Email utilities
- scripts/ - Database initialization and admin creation

## Testing and Quality

Client has Jest testing available via react-scripts (npm test). Server has no test framework configured currently.

## Security Features

- JWT token expiration (7 days default)
- Password hashing with bcryptjs (12 salt rounds)
- Rate limiting (100 requests/15min general, 5 requests/15min for auth)
- Helmet security headers
- CORS configuration
- Input validation with express-validator
- File upload restrictions
- Chinese phone number validation (1[3-9]\d{9})

## Payment Integration

Contains mock payment implementation for Alipay/WeChat. Production deployment requires:
- Valid merchant accounts and API keys
- Proper webhook/callback handling
- Payment verification and security measures

## Video Categories

The system supports the following predefined video categories:
- 科技 (Technology)
- 自然 (Nature) 
- 城市 (City)
- 人物 (People)
- 抽象 (Abstract)
- 商务 (Business)
- 教育 (Education)
- 娱乐 (Entertainment)
- 其他 (Others)

## Development Workflow Patterns

### Common Development Tasks
When modifying this codebase, follow these established patterns:

**Adding New API Endpoints:**
1. Define route in appropriate `/server/src/routes/` file
2. Add controller logic following existing error handling patterns
3. Update corresponding API functions in `client/src/services/api.ts`
4. Add TypeScript interfaces if needed

**Adding New Components:**
1. Follow existing component structure in `client/src/components/`
2. Use established patterns: React hooks, TypeScript interfaces, Tailwind classes
3. Integrate with existing contexts (AuthContext, CartContext) when needed
4. Follow existing error handling and loading state patterns

**Database Changes:**
1. Modify Mongoose schemas in `server/src/models/`
2. Update database initialization script if needed: `server/src/scripts/initDatabase.ts`
3. Consider index implications for queries
4. Update TypeScript interfaces to match schema changes

### Code Style and Conventions
- **Frontend**: React hooks, functional components, TypeScript strict mode
- **Backend**: Express middleware patterns, async/await, proper error handling
- **Database**: Mongoose with proper indexing for search and filtering
- **Authentication**: JWT tokens with automatic refresh on 401 responses
- **Error Handling**: Consistent error response format across API endpoints

### Testing Strategy
- Client: Jest testing via react-scripts (`npm test` in client directory)
- Server: No testing framework currently configured
- Manual testing via development servers and database initialization scripts

## Lint and Type Checking

The project uses TypeScript for type safety. Before committing changes, ensure code passes type checking:

**Client (Frontend):**
- TypeScript compilation handled by react-scripts
- Type checking: `cd client && npx tsc --noEmit`
- ESLint configuration extends react-app and react-app/jest

**Server (Backend):**
- Build and type check: `cd server && npm run build`
- TypeScript compilation outputs to `dist/` directory
- Development with type checking: `cd server && npm run dev`

**Important:** Always run build commands to verify type correctness before deploying.

## Docker Support

The project includes Docker configuration:
- `docker-compose.yml` - Multi-container setup with MongoDB
- `init-docker.sh` - Initialization script for Docker environment
- Containers: Node.js app, MongoDB, optional Nginx reverse proxy

To run with Docker:
```bash
# Initialize and start containers
./init-docker.sh

# Or manually with docker-compose
docker-compose up --build
```

## Lint and Type Checking

The project uses TypeScript for type safety. Before committing changes, ensure code passes type checking:

**Client (Frontend):**
- TypeScript compilation handled by react-scripts
- Type checking: `cd client && npx tsc --noEmit`
- ESLint configuration extends react-app and react-app/jest

**Server (Backend):**
- Build and type check: `cd server && npm run build`
- TypeScript compilation outputs to `dist/` directory
- Development with type checking: `cd server && npm run dev`

**Important:** Always run build commands to verify type correctness before deploying.

## Docker Support

The project includes Docker configuration:
- `docker-compose.yml` - Multi-container setup with MongoDB
- `init-docker.sh` - Initialization script for Docker environment
- Containers: Node.js app, MongoDB, optional Nginx reverse proxy

To run with Docker:
```bash
# Initialize and start containers
./init-docker.sh

# Or manually with docker-compose
docker-compose up --build
```

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.