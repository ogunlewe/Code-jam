const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');  // fs-extra to handle file operations
const app = express();
const os = require('os');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to execute code
app.post('/execute', (req, res) => {
  const { language, code } = req.body;
  let filePath;

  // Determine file extension based on language
  if (language === 'javascript') {
    filePath = path.join(os.tmpdir(), 'tempCode.js');  // Temporary JS file
  } else if (language === 'python') {
    filePath = path.join(os.tmpdir(), 'tempCode.py');  // Temporary Python file
  } else {
    return res.status(400).json({ output: 'Unsupported language' });
  }

  // Write the code to the temporary file
  fs.writeFile(filePath, code, (err) => {
    if (err) {
      return res.json({ output: `Error writing file: ${err.message}` });
    }

    // Execute the file using the appropriate command
    let command = language === 'javascript' ? `node ${filePath}` : `python ${filePath}`;

    exec(command, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
      // Clean up the temp file after execution
      fs.remove(filePath, () => {});

      if (error) {
        return res.json({ output: `Error: ${error.message}` });
      }
      if (stderr) {
        return res.json({ output: `Stderr: ${stderr}` });
      }
      res.json({ output: stdout });
    });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
