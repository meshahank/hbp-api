# 🚀 **Neon.tech Database Setup & API Testing Guide**

## **Complete Setup Instructions**

### **1. Neon.tech Database Setup**

Your Neon.tech database is already configured! Here's what was done:

✅ **Database URL**: `postgresql://neondb_owner:npg_8O2heVWBozIJ@ep-crimson-heart-a1mn77og-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

✅ **Schema Applied**: User, Article, Comment, Like, Tag models
✅ **Sample Data**: 3 users, 3 articles, 3 comments, 3 likes, 5 tags

### **2. Test Accounts Available**

```bash
👤 Admin User:
   📧 Email: admin@example.com
   🔑 Password: admin123
   🎭 Role: ADMIN

👤 Author 1:
   📧 Email: john@example.com  
   🔑 Password: author123
   🎭 Role: AUTHOR

👤 Author 2:
   📧 Email: jane@example.com
   🔑 Password: author123
   🎭 Role: AUTHOR  
```

## **🧪 API Testing Guide**

### **Server Status**
✅ **API Server**: Running on http://localhost:5000
✅ **Health Check**: http://localhost:5000/api/health

---

## **📝 PowerShell Testing Commands**

### **1. Health Check**
```powershell
Invoke-WebRequest -Uri 'http://localhost:5000/api/health'
```

### **2. User Authentication**

#### **Login as Author**
```powershell
$headers = @{'Content-Type' = 'application/json'}
$body = @{email='john@example.com'; password='author123'} | ConvertTo-Json
$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' -Method POST -Headers $headers -Body $body
$loginData = $response.Content | ConvertFrom-Json
$token = $loginData.token
Write-Host "JWT Token: $token"
```

#### **Login as Admin**
```powershell
$headers = @{'Content-Type' = 'application/json'}
$body = @{email='admin@example.com'; password='admin123'} | ConvertTo-Json
$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' -Method POST -Headers $headers -Body $body
$adminData = $response.Content | ConvertFrom-Json
$adminToken = $adminData.token
```

#### **Register New User**
```powershell
$headers = @{'Content-Type' = 'application/json'}
$body = @{
    email='newuser@example.com'
    username='newuser'
    password='password123'
    firstName='New'
    lastName='User'
} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/register' -Method POST -Headers $headers -Body $body
```

### **3. Article Operations**

#### **Get All Articles**
```powershell
# Public access (published articles only)
Invoke-WebRequest -Uri 'http://localhost:5000/api/articles'

# With authentication (see drafts too)
$headers = @{'Authorization' = "Bearer $token"}
Invoke-WebRequest -Uri 'http://localhost:5000/api/articles' -Headers $headers
```

#### **Get Articles with Pagination & Search**
```powershell
# Search articles
Invoke-WebRequest -Uri 'http://localhost:5000/api/articles?search=react&page=1&limit=5'

# Filter by author
Invoke-WebRequest -Uri 'http://localhost:5000/api/articles?author=johndoe'
```

#### **Create New Article**
```powershell
$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $token"
}
$body = @{
    title='My Amazing New Article'
    content='This is the content of my amazing article with **markdown** support!'
    excerpt='A brief description of the article'
    tags=@('Technology', 'Tutorial', 'New Tag')
} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:5000/api/articles' -Method POST -Headers $headers -Body $body
```

#### **Get Single Article**
```powershell
# Replace {article-id} with actual article ID from previous response
Invoke-WebRequest -Uri 'http://localhost:5000/api/articles/{article-id}'
```

#### **Like an Article**
```powershell
$headers = @{'Authorization' = "Bearer $token"}
Invoke-WebRequest -Uri 'http://localhost:5000/api/articles/{article-id}/like' -Method POST -Headers $headers
```

### **4. Comment Operations**

#### **Create Comment**
```powershell
$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $token"
}
$body = @{
    content='This is a great article! Thanks for sharing.'
    articleId='{article-id}'
} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:5000/api/comments' -Method POST -Headers $headers -Body $body
```

#### **Reply to Comment**
```powershell
$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $token"
}
$body = @{
    content='Thanks for the feedback!'
    articleId='{article-id}'
    parentId='{parent-comment-id}'
} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:5000/api/comments' -Method POST -Headers $headers -Body $body
```

### **5. User Operations**

#### **Get All Users**
```powershell
Invoke-WebRequest -Uri 'http://localhost:5000/api/users'
```

#### **Get User Profile**
```powershell
$headers = @{'Authorization' = "Bearer $token"}
Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/profile' -Headers $headers
```

#### **Update Profile**
```powershell
$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $token"
}
$body = @{
    bio='Updated bio: I am a passionate developer!'
    firstName='John Updated'
} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Headers $headers -Body $body
```

---

## **🔧 Database Management**

### **View Database in Prisma Studio**
```bash
npm run db:studio
```
Opens at: http://localhost:5555

### **Reset and Reseed Database**
```bash
npx prisma migrate reset
npm run db:seed
```

### **Generate SQL Migration Files**
```bash
npx prisma migrate dev --name your-migration-name
```

---

## **📊 Neon.tech SQL Queries**

You can run these directly in your Neon.tech SQL Editor:

### **Check All Tables**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### **View All Users**
```sql
SELECT id, email, username, "firstName", "lastName", role, "createdAt"
FROM users;
```

### **View Published Articles with Authors**
```sql
SELECT 
    a.id,
    a.title,
    a.slug,
    a.status,
    a."publishedAt",
    u.username as author
FROM articles a
JOIN users u ON a."authorId" = u.id
WHERE a.status = 'PUBLISHED'
ORDER BY a."createdAt" DESC;
```

### **View Articles with Like Counts**
```sql
SELECT 
    a.title,
    u.username as author,
    COUNT(l.id) as likes_count
FROM articles a
LEFT JOIN users u ON a."authorId" = u.id
LEFT JOIN likes l ON a.id = l."articleId"
WHERE a.status = 'PUBLISHED'
GROUP BY a.id, a.title, u.username
ORDER BY likes_count DESC;
```

### **View Comments with Nested Structure**
```sql
SELECT 
    c.id,
    c.content,
    c."parentId",
    u.username as commenter,
    a.title as article_title
FROM comments c
JOIN users u ON c."userId" = u.id
JOIN articles a ON c."articleId" = a.id
ORDER BY c."createdAt" DESC;
```

---

## **🚀 Production Deployment Checklist**

### **Environment Variables for Production**
```env
DATABASE_URL="your-neon-production-db-url"
JWT_SECRET="super-secure-production-secret"
NODE_ENV="production"
PORT=5000
ALLOWED_ORIGINS="https://yourdomain.com"
```

### **Neon.tech Production Setup**
1. Create production branch in Neon.tech
2. Update connection string
3. Run migrations: `npx prisma migrate deploy`
4. Set up connection pooling
5. Configure SSL settings

---

## **🎯 Common Use Cases**

### **Blog Website Integration**
```javascript
// Frontend example - Login and get articles
const login = async () => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    localStorage.setItem('token', data.token);
};

const getArticles = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/articles', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
};
```

### **Admin Dashboard Integration**
```javascript
// Admin functions
const publishArticle = async (articleId) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/articles/${articleId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
};
```

---

## **📈 Performance Monitoring**

### **Database Performance (Neon.tech)**
- Monitor connection pool usage
- Check query performance in Neon Console
- Set up alerts for slow queries

### **API Performance**
- Monitor response times
- Track authentication success rates
- Set up logging for errors

---

## **🔐 Security Best Practices**

✅ **Implemented:**
- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS protection
- SQL injection prevention (Prisma ORM)

✅ **Additional Recommendations:**
- Use HTTPS in production
- Implement refresh tokens
- Add API versioning
- Set up proper logging
- Monitor for suspicious activity

---

## **🆘 Troubleshooting**

### **Common Issues**

1. **Database Connection Error**
   ```bash
   # Check if Neon.tech DB is accessible
   npx prisma db pull
   ```

2. **Migration Issues**
   ```bash
   # Reset and re-apply migrations
   npx prisma migrate reset
   npx prisma migrate dev
   ```

3. **JWT Token Issues**
   ```bash
   # Generate new JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

Your API is now fully functional with Neon.tech database! 🎉
