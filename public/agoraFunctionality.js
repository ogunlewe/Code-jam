const socket = io(); // Initialize Socket.IO

let localStream;
let remoteStream;
let peerConnection;

const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302", // Google's public STUN server
    },
  ],
};

// Access user's media (audio and video)
async function startMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    document.getElementById("localVideo").srcObject = localStream;
  } catch (error) {
    console.error("Error accessing media devices.", error);
  }
}

// Create an offer to initiate the connection
async function createOffer() {
  peerConnection = new RTCPeerConnection(configuration);

  // Add local stream to peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // When remote stream is received
  peerConnection.ontrack = (event) => {
    const [remoteStreamTrack] = event.streams;
    document.getElementById("remoteVideo").srcObject = remoteStreamTrack;
  };

  // When ICE candidates are received
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
}

// Handle incoming offer and send an answer
socket.on("offer", async (offer) => {
  peerConnection = new RTCPeerConnection(configuration);

  // Add local stream to peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // When remote stream is received
  peerConnection.ontrack = (event) => {
    const [remoteStreamTrack] = event.streams;
    document.getElementById("remoteVideo").srcObject = remoteStreamTrack;
  };

  // When ICE candidates are received
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer);
});

// Handle incoming answer
socket.on("answer", async (answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle incoming ICE candidates
socket.on("ice-candidate", async (candidate) => {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error("Error adding received ICE candidate", error);
  }
});

// Function to start the call
function startCall() {
  startMedia().then(() => createOffer());
}

// UI elements (Assuming these buttons are present in your HTML)
document.getElementById("join-audio").addEventListener("click", startCall);
document.getElementById("leave-audio").addEventListener("click", () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    document.getElementById("remoteVideo").srcObject = null;
  }
});
