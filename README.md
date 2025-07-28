# Publishing Website API

A complete backend API for a publishing website built with Node.js, Express, Prisma, and PostgreSQL.

## Features

- 🔐 **JWT Authentication** - Register, login, and secure routes
- 👥 **User Roles** - Author and Admin role-based access control
- 📝 **Article Management** - Create, read, update, delete articles with draft/published states
- 💬 **Comments System** - Nested comments on articles
- ❤️ **Like System** - Users can like/unlike articles
- 🏷️ **Tagging System** - Organize articles with tags
- 📄 **Pagination** - Efficient data loading with pagination
- 🔍 **Search** - Search articles and users
- 🛡️ **Security** - Rate limiting, CORS, helmet protection
- ✅ **Validation** - Input validation with express-validator

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: express-validator
- **Security**: helmet, cors, rate limiting

## Project Structure

```
src/
├── config/
│   └── database.js          # Prisma client configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── articleController.js # Article management
│   ├── commentController.js # Comment management
│   └── userController.js    # User management
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   └── errorHandler.js     # Error handling middleware
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── articles.js         # Article routes
│   ├── comments.js         # Comment routes
│   └── users.js            # User routes
├── utils/
│   └── helpers.js          # Utility functions
└── server.js               # Express server setup

prisma/
├── schema.prisma           # Database schema
└── seed.js                 # Database seeding script
```

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd publishing-website-api

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
```

Required environment variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/publishing_db?schema=public"
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with sample data
npm run db:seed
```

### 4. Start the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Articles
- `GET /api/articles` - Get all articles (with pagination, search, filters)
- `GET /api/articles/:id` - Get single article
- `POST /api/articles` - Create new article (authenticated)
- `PUT /api/articles/:id` - Update article (author/admin only)
- `DELETE /api/articles/:id` - Delete article (author/admin only)
- `POST /api/articles/:id/publish` - Publish article (admin only)
- `POST /api/articles/:id/like` - Like article (authenticated)
- `DELETE /api/articles/:id/like` - Unlike article (authenticated)
- `GET /api/articles/:id/likes` - Get article likes

### Comments
- `POST /api/comments` - Create comment (authenticated)
- `GET /api/comments/article/:articleId` - Get article comments
- `PUT /api/comments/:id` - Update comment (author/admin only)
- `DELETE /api/comments/:id` - Delete comment (author/admin only)

### Users
- `GET /api/users` - Get all users (with pagination, search, filters)
- `GET /api/users/:id` - Get single user
- `GET /api/users/:id/articles` - Get user's articles
- `DELETE /api/users/:id` - Delete user (admin only)

### Health Check
- `GET /api/health` - API health status

## Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String
  firstName String?
  lastName  String?
  role      UserRole @default(AUTHOR) // AUTHOR | ADMIN
  bio       String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  articles  Article[]
  comments  Comment[]
  likes     Like[]
}
```

### Article Model
```prisma
model Article {
  id            String        @id @default(cuid())
  title         String
  slug          String        @unique
  content       String
  excerpt       String?
  featuredImage String?
  status        ArticleStatus @default(DRAFT) // DRAFT | SUBMITTED | PUBLISHED
  publishedAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  authorId      String
  author        User          @relation(fields: [authorId], references: [id])
  comments      Comment[]
  likes         Like[]
  tags          ArticleTag[]
}
```

## Test Accounts

After running the seed script, you can use these test accounts:

- **Admin**: admin@example.com / admin123
- **Author 1**: john@example.com / author123  
- **Author 2**: jane@example.com / author123

## API Usage Examples

### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123",
    "firstName": "New",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "author123"
  }'
```

### Create an article
```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My New Article",
    "content": "This is the content of my article...",
    "excerpt": "A brief description",
    "tags": ["Technology", "Tutorial"]
  }'
```

### Get articles with pagination
```bash
curl "http://localhost:3000/api/articles?page=1&limit=10&search=node"
```

## Development

### Database Operations

```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database
npx prisma migrate reset

# Generate Prisma client after schema changes
npm run db:generate

# Create and apply new migration
npx prisma migrate dev --name your-migration-name
```

### Adding New Features

1. Update the Prisma schema if needed
2. Run migrations
3. Create/update controllers
4. Add routes
5. Test your endpoints

## Security Features

- **Rate Limiting**: Prevents abuse with configurable request limits
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express
- **JWT**: Stateless authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: express-validator for request validation
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a secure `JWT_SECRET`
3. Configure proper `DATABASE_URL`
4. Set up HTTPS
5. Configure production CORS origins
6. Set up logging and monitoring
7. Use a process manager like PM2

## License

MIT
