const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

// Load SSL certificate files
const options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt')
};

// Define a route
app.get('/', (req, res) => {
  res.send('Hello, Secure World!');
});

// Start HTTPS server
https.createServer(options, app).listen(3000, () => {
  console.log('HTTPS server running on https://localhost:3000');
});
