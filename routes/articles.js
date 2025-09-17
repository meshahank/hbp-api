// Article routes
const { v4: uuidv4 } = require('uuid');
const ARTICLES_FILE = 'articles.json';

module.exports = (app, readData, writeData) => {
  // Get all articles
  app.get('/api/articles', (req, res) => {
    const articles = readData(ARTICLES_FILE);
    res.json(articles);
  });

  // Get article by id
  app.get('/api/articles/:id', (req, res) => {
    const articles = readData(ARTICLES_FILE);
    const article = articles.find(a => a.id === req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  });

  // Create article
  app.post('/api/articles', (req, res) => {
    const { title, content, category, tags, status, author } = req.body;
    if (!title || !content || !author || !author.id || !author.firstName || !author.lastName) {
      return res.status(400).json({ message: 'Missing required fields: title, content, author (id, firstName, lastName)' });
    }
    let articles = readData(ARTICLES_FILE);
    const newArticle = {
      id: uuidv4(),
      title,
      content,
      excerpt: req.body.excerpt || content.slice(0, 100),
      category: category || '',
      tags: tags || [],
      status: status || 'published',
      author,
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    articles.push(newArticle);
    writeData(ARTICLES_FILE, articles);
    res.status(201).json(newArticle);
  });

  // Edit article
  app.put('/api/articles/:id', (req, res) => {
    let articles = readData(ARTICLES_FILE);
    const idx = articles.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Article not found' });
    const oldArticle = articles[idx];
    const updatedFields = { ...req.body };
    // If content is being updated and no new excerpt is provided, regenerate excerpt
    if (updatedFields.content && !('excerpt' in updatedFields)) {
      updatedFields.excerpt = updatedFields.content.slice(0, 100);
    }
    articles[idx] = { ...oldArticle, ...updatedFields, updatedAt: new Date().toISOString() };
    writeData(ARTICLES_FILE, articles);
    res.json(articles[idx]);
  });

  // Delete article
  app.delete('/api/articles/:id', (req, res) => {
    let articles = readData(ARTICLES_FILE);
    const idx = articles.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Article not found' });
    const deleted = articles.splice(idx, 1);
    writeData(ARTICLES_FILE, articles);
    res.json(deleted[0]);
  });
};
