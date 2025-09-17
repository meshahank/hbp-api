// User profile routes
const USERS_FILE = 'users.json';

module.exports = (app, readData, writeData) => {
  // Get all users (admin only)
  app.get('/api/users', (req, res) => {
    const users = readData(USERS_FILE).map(u => ({ id: u.id, username: u.username, isAdmin: u.isAdmin }));
    res.json(users);
  });

  // Get user by id
  app.get('/api/users/:id', (req, res) => {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user.id, username: user.username, isAdmin: user.isAdmin });
  });

  // Update user profile
  app.put('/api/users/:id', (req, res) => {
    let users = readData(USERS_FILE);
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'User not found' });
    users[idx] = { ...users[idx], ...req.body };
    writeData(USERS_FILE, users);
    res.json({ id: users[idx].id, username: users[idx].username, isAdmin: users[idx].isAdmin });
  });
};
