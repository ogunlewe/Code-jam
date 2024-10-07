const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to generate Agora room
app.post('/generate-room', async (req, res) => {
  try {
    const { data } = await axios.post('https://api.agora.io/v1/apps/{your-app-id}/rooms', {
      name: 'your-room-name',
      uid: 'your-unique-id',
    });
    const roomUUID = data.roomUUID;
    const token = data.token;
    
    res.json({ roomUUID, token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

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

// WebRTC signaling using Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle offer
  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);
  });

  // Handle answer
  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (candidate) => {
    socket.broadcast.emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
