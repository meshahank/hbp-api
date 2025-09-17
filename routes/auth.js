
// Authentication routes
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const USERS_FILE = 'users.json';
const SECRET = 'hbp_secret_key';

module.exports = (app, readData, writeData) => {
    // Get current user profile
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, SECRET);
      const users = readData(USERS_FILE);
      const user = users.find(u => u.id === decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Return user info (omit password)
      const { password, ...userData } = user;
      res.json(userData);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  });
  // Register
  app.post('/api/auth/register', (req, res) => {
    const { username, password, email, firstName, lastName } = req.body;
    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({ message: 'Missing required fields: username, password, email, firstName, lastName' });
    }
    let users = readData(USERS_FILE);
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = {
      id: uuidv4(),
      username,
      email,
      firstName,
      lastName,
      role: 'user',
      password: hashedPassword,
      isAdmin: false
    };
    users.push(newUser);
    writeData(USERS_FILE, users);
    res.status(201).json({ message: 'User registered' });
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { username, email, password } = req.body;
    const users = readData(USERS_FILE);
    // Find user by username or email
    const user = users.find(u => (u.username === username || u.email === email));
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, isAdmin: user.isAdmin }, SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
  });
};
