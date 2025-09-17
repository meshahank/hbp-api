// Comments routes
const { v4: uuidv4 } = require('uuid');
const COMMENTS_FILE = 'comments.json';

module.exports = (app, readData, writeData) => {
  // Get comments for an article
  app.get('/api/articles/:id/comments', (req, res) => {
    const comments = readData(COMMENTS_FILE);
    const articleComments = comments.filter(c => c.articleId === req.params.id);
    res.json(articleComments);
  });

  // Add comment to article
  app.post('/api/articles/:id/comments', (req, res) => {
    const { authorId, content } = req.body;
    let comments = readData(COMMENTS_FILE);
    const newComment = { id: uuidv4(), articleId: req.params.id, authorId, content, createdAt: new Date().toISOString() };
    comments.push(newComment);
    writeData(COMMENTS_FILE, comments);
    res.status(201).json(newComment);
  });

  // Delete comment
  app.delete('/api/comments/:id', (req, res) => {
    let comments = readData(COMMENTS_FILE);
    const idx = comments.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Comment not found' });
    const deleted = comments.splice(idx, 1);
    writeData(COMMENTS_FILE, comments);
    res.json(deleted[0]);
  });
};
