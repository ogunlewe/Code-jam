// Agora app ID (replace with your own)
const appId = "YOUR_ACTUAL_AGORA_APP_ID";
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

let localAudioTrack, localVideoTrack, screenTrack;
let joinedChannel = false;

async function startVideoCall() {
  await joinChannel();
  localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  localVideoTrack = await AgoraRTC.createCameraVideoTrack();
  await client.publish([localAudioTrack, localVideoTrack]);
}

async function startAudioCall() {
  await joinChannel();
  localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  await client.publish([localAudioTrack]);
}

async function startScreenSharing() {
  await joinChannel();
  screenTrack = await AgoraRTC.createScreenVideoTrack();
  await client.publish([screenTrack]);
}

async function joinChannel() {
  if (!joinedChannel) {
    const uid = await client.join(appId, "main", null, null);
    console.log("Joined channel:", uid);
    joinedChannel = true;
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
  }
}

async function handleUserPublished(user, mediaType) {
  await client.subscribe(user, mediaType);
  if (mediaType === "video") {
    const remoteVideoTrack = user.videoTrack;
    const playerContainer = document.createElement("div");
    playerContainer.id = user.uid.toString();
    playerContainer.style.width = "640px";
    playerContainer.style.height = "480px";
    document.getElementById("remoteStreams").append(playerContainer);
    remoteVideoTrack.play(playerContainer);
  }
  if (mediaType === "audio") {
    const remoteAudioTrack = user.audioTrack;
    remoteAudioTrack.play();
  }
}

function handleUserUnpublished(user) {
  const playerContainer = document.getElementById(user.uid.toString());
  if (playerContainer) {
    playerContainer.remove();
  }
}

// Event listeners
document.getElementById("startVideoCall").addEventListener("click", startVideoCall);
document.getElementById("startAudioCall").addEventListener("click", startAudioCall);
document.getElementById("startScreenSharing").addEventListener("click", startScreenSharing);