# HBP API Testing Guide

This guide covers how to test the backend API using Thunder Client (VS Code extension) and how to test the integration with the React frontend.

---

## 1. Testing with Thunder Client

### Setup
- Install the Thunder Client extension in VS Code.
- Make sure your backend server is running at `http://localhost:5000`.

### Authentication
#### Register a User
- **POST** `http://localhost:5000/api/auth/register`
- **Body (JSON):**
```
{
  "username": "johndoe",
  "password": "test1234",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```
- **Expected:** `{ "message": "User registered" }`

#### Login
- **POST** `http://localhost:5000/api/auth/login`
- **Body (JSON):**
```
{
  "username": "johndoe",
  "password": "test1234"
}
```
- **Expected:** `{ "token": "...", "user": { ... } }`
- Save the token for authenticated requests.

### Articles
#### Get All Articles
- **GET** `http://localhost:5000/api/articles`
- **Expected:** Array of articles with all required fields.

#### Create Article
- **POST** `http://localhost:5000/api/articles`
- **Body (JSON):**
```
{
  "title": "Test Article",
  "content": "This is a test article.",
  "category": "General",
  "tags": ["test"],
  "status": "published",
  "author": {
    "id": "1",
    "email": "john@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```
- **Expected:** Article object with all fields.

#### Get Article by ID
- **GET** `http://localhost:5000/api/articles/{id}`

#### Update Article
- **PUT** `http://localhost:5000/api/articles/{id}`
- **Body:** (any updatable fields)

#### Delete Article
- **DELETE** `http://localhost:5000/api/articles/{id}`

### Comments
#### Add Comment
- **POST** `http://localhost:5000/api/articles/{articleId}/comments`
- **Body (JSON):**
```
{
  "authorId": "1",
  "content": "Nice article!"
}
```

#### Get Comments
- **GET** `http://localhost:5000/api/articles/{articleId}/comments`

#### Delete Comment
- **DELETE** `http://localhost:5000/api/comments/{commentId}`

---

## 2. Testing in the React Frontend

### Prerequisites
- Start the backend (`npm start` in `hbp-api`)
- Start the frontend (`npm run dev` in `hbp-client`)

### Steps
1. **Register and Login:**
   - Use the Register and Login forms. Confirm you can log in and see your user info.
2. **Create Article:**
   - Use the Create Article page. Fill all fields. Confirm the article appears in the list.
3. **Like/Unlike Article:**
   - Click the like button. The like count should update.
4. **Edit/Delete Article:**
   - Use edit/delete actions (if available) and confirm changes.
5. **Add Comment:**
   - Open an article, add a comment, and confirm it appears.
6. **Check Error Handling:**
   - Try submitting forms with missing fields. Confirm error messages appear.
7. **Logout and Access Control:**
   - Log out and try to access protected pages. You should be redirected to login.

---

## 3. Troubleshooting
- If you see errors like `Cannot read properties of undefined`, check your backend data for missing fields.
- Use browser dev tools and Thunder Client to inspect API responses.
- Check the console for error logs.

---

**Happy testing!**
