let client;
let localAudioTrack;
let isMuted = false;

document.getElementById('join-audio').addEventListener('click', async () => {
    // Initialize Agora client
    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    const appId = '4547ccb088dd4df7a0cf10e60f29c335'; // Replace with your Agora App ID
    const channel = 'test'; // Replace with your channel name
    const token = null; // Use token if your project is secured

    try {
        // Join the channel
        await client.join(appId, channel, token, null);

        // Create local audio track
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

        // Publish the local audio track to the Agora channel
        await client.publish([localAudioTrack]);

        console.log('Audio call started');

        // Update UI
        document.getElementById('join-audio').style.display = 'none';
        document.getElementById('leave-audio').style.display = 'inline';
        document.getElementById('mute-audio').style.display = 'inline';
    } catch (error) {
        console.error('Failed to join audio call:', error);
    }

    // Subscribe to remote users
    client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack.play();
            console.log('Remote audio playing');
        }
    });
});

// Leave the audio call
document.getElementById('leave-audio').addEventListener('click', async () => {
    if (client) {
        await client.leave();
        localAudioTrack.close();

        console.log('Audio call left');
        document.getElementById('join-audio').style.display = 'inline';
        document.getElementById('leave-audio').style.display = 'none';
        document.getElementById('mute-audio').style.display = 'none';
        document.getElementById('unmute-audio').style.display = 'none';
    }
});

// Mute audio
document.getElementById('mute-audio').addEventListener('click', () => {
    localAudioTrack.setMuted(true);
    isMuted = true;
    document.getElementById('mute-audio').style.display = 'none';
    document.getElementById('unmute-audio').style.display = 'inline';
    console.log('Audio muted');
});

// Unmute audio
document.getElementById('unmute-audio').addEventListener('click', () => {
    localAudioTrack.setMuted(false);
    isMuted = false;
    document.getElementById('mute-audio').style.display = 'inline';
    document.getElementById('unmute-audio').style.display = 'none';
    console.log('Audio unmuted');
});
