const express = require('express');  // Import express
const { exec } = require('child_process');  // Import exec for executing shell commands
const path = require('path');  // Import path module to handle file paths
const axios = require('axios');  // Import axios for HTTP requests

const app = express();  // Initialize express application

app.use(express.json());  // Middleware to parse JSON requests
app.use(express.static(path.join(__dirname, 'public')));  // Serve static files from 'public' directory

// Endpoint to execute code
app.post('/execute', (req, res) => {
  const { language, code } = req.body;
  let command;

  if (language === 'javascript') {
    command = `node -e "${code.replace(/"/g, '\\"')}"`;
  } else if (language === 'python') {
    command = `python -c "${code.replace(/"/g, '\\"')}"`;
  } else {
    return res.status(400).json({ output: 'Unsupported language' });
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.json({ output: `Error: ${error.message}` });
    }
    if (stderr) {
      return res.json({ output: `Stderr: ${stderr}` });
    }
    res.json({ output: stdout });
  });
});

// Endpoint to execute terminal commands
app.post('/command', (req, res) => {
  const { command } = req.body;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.json({ output: `Error: ${error.message}` });
    }
    if (stderr) {
      return res.json({ output: `Stderr: ${stderr}` });
    }
    res.json({ output: stdout });
  });
});

const PORT = process.env.PORT || 3000;  // Set the port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);  // Start the server
});
