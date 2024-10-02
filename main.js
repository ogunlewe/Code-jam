const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

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

// Socket.IO real-time collaboration setup
io.on('connection', (socket) => {
  console.log('A user connected');

  // Broadcast the changes made by one user to others
  socket.on('code-change', (data) => {
    socket.broadcast.emit('code-update', data);
  });

  // Broadcast cursor position to others
  socket.on('cursor-change', (cursorPosition) => {
    socket.broadcast.emit('cursor-update', cursorPosition);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
