const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
