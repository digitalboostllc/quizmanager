# Project Infrastructure Rules

## Environment Setup

### Local Development
- **Database**: Local PostgreSQL
  ```
  DATABASE_URL="postgresql://said:@localhost:5432/fbquiz"
  ```
- **Redis**: Local Redis instance for queues
  ```
  REDIS_HOST=localhost
  REDIS_PORT=6379
  ```
- **Environment Files**:
  - `.env.local` for local development
  - Never commit `.env` or `.env.local` files
  - Use `.env.example` for documentation

### Production (Vercel)
- **Database**: Supabase PostgreSQL
  ```
  DATABASE_URL="postgres://postgres.sfrafxfmasyrtqfuztlz:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
  ```
- **Environment Variables**: Managed through Vercel dashboard
- **Deployment**: Automatic deployment from `main` branch

## Development Workflow

### 1. Local Development
```bash
# Start local development
npm run dev

# Database migrations
npx prisma migrate dev    # Create and apply migrations locally
npx prisma generate      # Update Prisma Client

# Before committing
npm run lint            # Check for linting issues
```

### 2. Database Changes
- Create migrations locally first
- Test migrations locally
- Push to GitHub
- Vercel will automatically apply migrations to Supabase

### 3. Deployment Process
- Push to GitHub `main` branch
- Vercel automatically:
  - Builds the application
  - Generates Prisma Client
  - Deploys to production

## Infrastructure Components

### 1. Database (Prisma)
- Local: PostgreSQL on localhost
- Production: Supabase PostgreSQL
- Always use Prisma migrations for schema changes
- Keep both environments in sync

### 2. Authentication (NextAuth.js)
- Uses Prisma adapter
- Configured for both local and production
- Session management through database

### 3. File Storage
- Uses Vercel Blob Storage
- Same configuration in both environments
- Access through `BLOB_READ_WRITE_TOKEN`

### 4. Build Configuration
- `package.json`:
  ```json
  {
    "scripts": {
      "build": "prisma generate && next build",
      "postinstall": "prisma generate"
    }
  }
  ```
- `vercel.json`:
  ```json
  {
    "buildCommand": "prisma generate && next build",
    "installCommand": "npm install"
  }
  ```

## Version Control Rules

### 1. Git Workflow
- Main branch: `main`
- Always pull before starting work
- Commit messages should be descriptive
- Use `--no-verify` flag if pre-commit hooks fail

### 2. Files to Never Commit
- `.env`
- `.env.local`
- `node_modules/`
- `.next/`
- Any local configuration files

## Dependencies Management

### 1. Package Updates
- Use exact versions for critical packages
- Use caret (^) for minor updates
- Test dependency updates locally first

### 2. Critical Dependencies
- Next.js: 15.1.7
- Prisma: ^6.4.1
- React: ^18.3.1
- TypeScript: ^5

## Environment Variables

### Required in Both Environments
```env
# Database
DATABASE_URL
POSTGRES_PRISMA_URL
POSTGRES_URL
POSTGRES_URL_NON_POOLING

# Supabase
SUPABASE_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_JWT_SECRET
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Storage
BLOB_READ_WRITE_TOKEN

# Auth
NEXTAUTH_URL
NEXTAUTH_SECRET

# OpenAI
OPENAI_API_KEY
```

## Maintenance Rules

### 1. Regular Tasks
- Keep dependencies updated
- Monitor Vercel deployments
- Check database migrations
- Review environment variables

### 2. Troubleshooting
- Check logs in Vercel dashboard
- Verify database connections
- Confirm environment variables
- Review build output

### 3. Performance
- Monitor database queries
- Check API response times
- Review Vercel analytics
- Monitor blob storage usage

## Security Rules

### 1. Environment Variables
- Never expose sensitive keys
- Use appropriate access levels
- Rotate secrets periodically

### 2. Database
- Use connection pooling in production
- Implement proper indexes
- Regular backups (automated)

### 3. API Security
- Implement rate limiting
- Validate all inputs
- Use proper authentication 