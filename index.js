// Entry point for the backend API
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Utility to read/write JSON files
function readData(file) {
  const filePath = path.join(__dirname, 'data', file);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeData(file, data) {
  const filePath = path.join(__dirname, 'data', file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Routes will be added here
app.get('/', (req, res) => {
  res.send('HBP API is running');
});

// Import routes
require('./routes/auth')(app, readData, writeData);
require('./routes/articles')(app, readData, writeData);
require('./routes/comments')(app, readData, writeData);
require('./routes/users')(app, readData, writeData);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
