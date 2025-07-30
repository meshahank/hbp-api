const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

const dataDir = path.join(__dirname, 'data');
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const files = {
  users: path.join(dataDir, 'users.json'),
  articles: path.join(dataDir, 'articles.json'),
  comments: path.join(dataDir, 'comments.json'),
  likes: path.join(dataDir, 'likes.json'),
};

// Initialize empty files if they don't exist
Object.values(files).forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '[]');
  }
});

function readData(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (error) {
    return [];
  }
}

function writeData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    const users = readData(files.users);
    
    // Check if user exists
    if (users.find(u => u.email === email || u.username === username)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
      id: generateId(),
      username,
      email,
      firstName,
      lastName,
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    writeData(files.users, users);

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    
    // Remove password from response
    const { password: _, ...userResponse } = user;
    
    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readData(files.users);
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    
    // Remove password from response
    const { password: _, ...userResponse } = user;
    
    res.json({ user: userResponse, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const users = readData(files.users);
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const { password: _, ...userResponse } = user;
  res.json(userResponse);
});

// USERS ROUTES
app.get('/api/users', (req, res) => {
  const users = readData(files.users);
  const safeUsers = users.map(({ password, ...user }) => user);
  res.json(safeUsers);
});

app.get('/api/users/:id', (req, res) => {
  const users = readData(files.users);
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const { password: _, ...userResponse } = user;
  res.json(userResponse);
});

// Helper function to safely get user ID from token
function getUserIdFromHeaders(headers) {
  try {
    if (!headers.authorization) return null;
    const token = headers.authorization.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
}

// Helper function to calculate likes for an article
function calculateArticleLikes(articleId, userId = null) {
  const likes = readData(files.likes);
  const articleLikes = likes.filter(like => like.articleId === articleId);
  const totalLikes = articleLikes.length;
  const isLiked = userId ? articleLikes.some(like => like.userId === userId) : false;
  
  return { totalLikes, isLiked };
}

// ARTICLES ROUTES
app.get('/api/articles', (req, res) => {
  const articles = readData(files.articles);
  const users = readData(files.users);
  const userId = getUserIdFromHeaders(req.headers);
  
  // Filter articles based on status and user
  const filteredArticles = articles.filter(article => {
    // Always show published articles
    if (article.status === 'published') {
      return true;
    }
    
    // Only show draft articles to their author
    if (article.status === 'draft') {
      return userId && article.authorId === userId;
    }
    
    return false;
  });
  
  // Populate author information for each article
  const articlesWithAuthors = filteredArticles.map(article => {
    const author = users.find(u => u.id === article.authorId);
    const { totalLikes, isLiked } = calculateArticleLikes(article.id, userId);
    
    if (author) {
      const { password: _, ...safeAuthor } = author;
      return {
        ...article,
        author: safeAuthor,
        likes: totalLikes,
        isLiked: isLiked
      };
    }
    // Fallback if author not found
    return {
      ...article,
      author: {
        id: 'unknown',
        username: 'Unknown User',
        email: 'unknown@example.com',
        firstName: 'Unknown',
        lastName: 'User'
      },
      likes: totalLikes,
      isLiked: isLiked
    };
  });
  
  res.json(articlesWithAuthors);
});

app.get('/api/articles/:id', (req, res) => {
  const articles = readData(files.articles);
  const users = readData(files.users);
  const article = articles.find(a => a.id === req.params.id);
  const userId = getUserIdFromHeaders(req.headers);
  
  if (!article) {
    return res.status(404).json({ message: 'Article not found' });
  }
  
  // Check if user has permission to view this article
  if (article.status === 'draft' && article.authorId !== userId) {
    return res.status(403).json({ message: 'Access denied. Draft articles can only be viewed by their authors.' });
  }
  
  const { totalLikes, isLiked } = calculateArticleLikes(article.id, userId);
  
  // Populate author information
  const author = users.find(u => u.id === article.authorId);
  if (author) {
    const { password: _, ...safeAuthor } = author;
    res.json({
      ...article,
      author: safeAuthor,
      likes: totalLikes,
      isLiked: isLiked
    });
  } else {
    // Fallback if author not found
    res.json({
      ...article,
      author: {
        id: 'unknown',
        username: 'Unknown User',
        email: 'unknown@example.com',
        firstName: 'Unknown',
        lastName: 'User'
      },
      likes: totalLikes,
      isLiked: isLiked
    });
  }
});

// Get user's own articles (including drafts)
app.get('/api/users/me/articles', authenticateToken, (req, res) => {
  try {
    const articles = readData(files.articles);
    const users = readData(files.users);
    const userId = req.user.id;
    
    // Get all articles by this user (both published and draft)
    const userArticles = articles.filter(article => article.authorId === userId);
    
    // Populate author information for each article
    const articlesWithAuthors = userArticles.map(article => {
      const author = users.find(u => u.id === article.authorId);
      const { totalLikes, isLiked } = calculateArticleLikes(article.id, userId);
      
      if (author) {
        const { password: _, ...safeAuthor } = author;
        return {
          ...article,
          author: safeAuthor,
          likes: totalLikes,
          isLiked: isLiked
        };
      }
      // Fallback if author not found
      return {
        ...article,
        author: {
          id: 'unknown',
          username: 'Unknown User',
          email: 'unknown@example.com',
          firstName: 'Unknown',
          lastName: 'User'
        },
        likes: totalLikes,
        isLiked: isLiked
      };
    });
    
    res.json(articlesWithAuthors);
  } catch (error) {
    console.error('Error fetching user articles:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/articles', authenticateToken, (req, res) => {
  try {
    const articles = readData(files.articles);
    const article = {
      id: generateId(),
      ...req.body,
      authorId: req.user.id,
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    articles.push(article);
    writeData(files.articles, articles);
    
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/articles/:id', authenticateToken, (req, res) => {
  try {
    const articles = readData(files.articles);
    const articleIndex = articles.findIndex(a => a.id === req.params.id);
    
    if (articleIndex === -1) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Check if user owns the article or is admin
    const users = readData(files.users);
    const user = users.find(u => u.id === req.user.id);
    
    if (articles[articleIndex].authorId !== req.user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    articles[articleIndex] = {
      ...articles[articleIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    writeData(files.articles, articles);
    res.json(articles[articleIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/articles/:id', authenticateToken, (req, res) => {
  try {
    const articles = readData(files.articles);
    const articleIndex = articles.findIndex(a => a.id === req.params.id);
    
    if (articleIndex === -1) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Check if user owns the article or is admin
    const users = readData(files.users);
    const user = users.find(u => u.id === req.user.id);
    
    if (articles[articleIndex].authorId !== req.user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    articles.splice(articleIndex, 1);
    writeData(files.articles, articles);
    
    res.json({ message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// LIKES ROUTES
app.post('/api/articles/:id/like', authenticateToken, (req, res) => {
  try {
    const articles = readData(files.articles);
    const likes = readData(files.likes);
    const articleId = req.params.id;
    const userId = req.user.id;
    
    // Check if article exists
    const article = articles.find(a => a.id === articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Check if user already liked this article
    const existingLike = likes.find(like => like.articleId === articleId && like.userId === userId);
    if (existingLike) {
      return res.status(400).json({ message: 'Article already liked' });
    }
    
    // Add like
    const newLike = {
      id: generateId(),
      articleId: articleId,
      userId: userId,
      createdAt: new Date().toISOString()
    };
    
    likes.push(newLike);
    writeData(files.likes, likes);
    
    const { totalLikes, isLiked } = calculateArticleLikes(articleId, userId);
    
    res.json({ 
      message: 'Article liked',
      likes: totalLikes,
      isLiked: isLiked
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/articles/:id/like', authenticateToken, (req, res) => {
  try {
    const articles = readData(files.articles);
    const likes = readData(files.likes);
    const articleId = req.params.id;
    const userId = req.user.id;
    
    // Check if article exists
    const article = articles.find(a => a.id === articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Find and remove the like
    const likeIndex = likes.findIndex(like => like.articleId === articleId && like.userId === userId);
    if (likeIndex === -1) {
      return res.status(400).json({ message: 'Article not liked by user' });
    }
    
    likes.splice(likeIndex, 1);
    writeData(files.likes, likes);
    
    const { totalLikes, isLiked } = calculateArticleLikes(articleId, userId);
    
    res.json({ 
      message: 'Article unliked',
      likes: totalLikes,
      isLiked: isLiked
    });
  } catch (error) {
    console.error('Unlike error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// COMMENTS ROUTES
app.get('/api/articles/:articleId/comments', (req, res) => {
  const comments = readData(files.comments);
  const users = readData(files.users);
  const articleComments = comments.filter(c => c.articleId === req.params.articleId);
  
  // Populate author information for each comment
  const commentsWithAuthors = articleComments.map(comment => {
    const author = users.find(u => u.id === comment.authorId);
    if (author) {
      const { password: _, ...safeAuthor } = author;
      return {
        ...comment,
        author: safeAuthor
      };
    }
    // Fallback if author not found
    return {
      ...comment,
      author: {
        id: 'unknown',
        username: 'Unknown User',
        email: 'unknown@example.com',
        firstName: 'Unknown',
        lastName: 'User'
      }
    };
  });
  
  res.json(commentsWithAuthors);
});

app.post('/api/articles/:articleId/comments', authenticateToken, (req, res) => {
  try {
    const comments = readData(files.comments);
    const users = readData(files.users);
    const comment = {
      id: generateId(),
      articleId: req.params.articleId,
      authorId: req.user.id,
      content: req.body.content,
      createdAt: new Date().toISOString()
    };
    
    comments.push(comment);
    writeData(files.comments, comments);
    
    // Return comment with author information populated
    const author = users.find(u => u.id === req.user.id);
    if (author) {
      const { password: _, ...safeAuthor } = author;
      res.status(201).json({
        ...comment,
        author: safeAuthor
      });
    } else {
      res.status(201).json({
        ...comment,
        author: {
          id: 'unknown',
          username: 'Unknown User',
          email: 'unknown@example.com',
          firstName: 'Unknown',
          lastName: 'User'
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/comments/:id', authenticateToken, (req, res) => {
  try {
    const comments = readData(files.comments);
    const commentIndex = comments.findIndex(c => c.id === req.params.id);
    
    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user owns the comment or is admin
    const users = readData(files.users);
    const user = users.find(u => u.id === req.user.id);
    
    if (comments[commentIndex].authorId !== req.user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    comments.splice(commentIndex, 1);
    writeData(files.comments, comments);
    
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`JSON API server running on port ${PORT}`);
  console.log(`Data stored in: ${dataDir}`);
});
