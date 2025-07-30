# HBP JSON Backend Server

A simple JSON file-based backend for HBP Publishing application.

## Features

- User authentication with JWT
- CRUD operations for articles
- Comments system
- Admin functionality
- Data persistence in JSON files
- Draft article privacy (drafts only visible to authors)
- User-specific likes tracking

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### Articles
- `GET /api/articles` - Get all published articles + user's own drafts
- `GET /api/articles/:id` - Get article by ID (drafts only visible to author)
- `GET /api/users/me/articles` - Get current user's articles (auth required)
- `POST /api/articles` - Create new article (auth required)
- `PUT /api/articles/:id` - Update article (auth required)
- `DELETE /api/articles/:id` - Delete article (auth required)

### Comments
- `GET /api/articles/:articleId/comments` - Get comments for article
- `POST /api/articles/:articleId/comments` - Add comment (auth required)
- `DELETE /api/comments/:id` - Delete comment (auth required)

## Data Storage

All data is stored in JSON files in the `/data` directory:
- `users.json` - User accounts
- `articles.json` - Articles
- `comments.json` - Comments

## Environment

- Server runs on port 4000 by default
- CORS enabled for all origins
- JWT secret: "your-secret-key" (change in production)
