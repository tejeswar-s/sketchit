import { useEffect, useRef, useState } from 'react';

// Helper: get a unique ID for this client (could use userId from context)
function getMyId(user) {
  return user?.userId || Math.random().toString(36).slice(2);
}

export default function useVoiceChat({ isMicOn, roomCode, user, socket, players, globalMuted, isHostUser }) {
  const localStreamRef = useRef(null);
  const peerConnections = useRef({}); // userId -> RTCPeerConnection
  const remoteAudioRefs = useRef({}); // userId -> HTMLAudioElement
  const analyserNodes = useRef({}); // userId -> AnalyserNode
  const [speakingUsers, setSpeakingUsers] = useState({}); // userId -> true/false
  // Buffer for ICE candidates received before remoteDescription is set
  const iceCandidateBuffer = useRef({});

  // Start/stop local audio stream
  useEffect(() => {
    if (!window || !navigator) return;
    if (isMicOn) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        localStreamRef.current = stream;
        Object.values(peerConnections.current).forEach(pc => {
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
        });
      });
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      Object.values(peerConnections.current).forEach(pc => {
        pc.getSenders().forEach(sender => {
          if (sender.track && sender.track.kind === 'audio') {
            pc.removeTrack(sender);
          }
        });
      });
    }
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [isMicOn]);

  // Handle joining/leaving peers
  useEffect(() => {
    if (!socket || !roomCode || !user || !players) return;
    const myId = getMyId(user);
    players.forEach(p => {
      if (p.userId === myId) return;
      if (!peerConnections.current[p.userId]) {
        const pc = new window.RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerConnections.current[p.userId] = pc;
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
        }
        pc.ontrack = event => {
          let audio = remoteAudioRefs.current[p.userId];
          if (!audio) {
            audio = document.createElement('audio');
            audio.autoplay = true;
            audio.style.display = 'none';
            document.body.appendChild(audio);
            remoteAudioRefs.current[p.userId] = audio;
          }
          audio.srcObject = event.streams[0];

          // --- Voice Activity Detection ---
          if (window.AudioContext) {
            const ctx = new window.AudioContext();
            const source = ctx.createMediaStreamSource(event.streams[0]);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            analyserNodes.current[p.userId] = analyser;
            const data = new Uint8Array(analyser.frequencyBinCount);
            let speaking = false;
            function checkSpeaking() {
              analyser.getByteFrequencyData(data);
              // Simple threshold: if average > 20, consider speaking
              const avg = data.reduce((a, b) => a + b, 0) / data.length;
              const isNowSpeaking = avg > 20;
              if (isNowSpeaking !== speaking) {
                speaking = isNowSpeaking;
                setSpeakingUsers(prev => ({ ...prev, [p.userId]: speaking }));
              }
              requestAnimationFrame(checkSpeaking);
            }
            checkSpeaking();
          }
          // --- End VAD ---
        };
        pc.onicecandidate = e => {
          if (e.candidate) {
            socket.emit('voice-ice-candidate', { code: roomCode, candidate: e.candidate, from: myId });
          }
        };
      }
    });
    Object.keys(peerConnections.current).forEach(pid => {
      if (!players.find(p => p.userId === pid)) {
        peerConnections.current[pid].close();
        delete peerConnections.current[pid];
        if (remoteAudioRefs.current[pid]) {
          remoteAudioRefs.current[pid].remove();
          delete remoteAudioRefs.current[pid];
        }
        if (analyserNodes.current[pid]) {
          analyserNodes.current[pid].disconnect();
          delete analyserNodes.current[pid];
        }
        setSpeakingUsers(prev => {
          const copy = { ...prev };
          delete copy[pid];
          return copy;
        });
      }
    });
  }, [players, socket, roomCode, user, isMicOn]);

  // WebRTC signaling handlers
  useEffect(() => {
    if (!socket || !roomCode || !user) return;
    const myId = getMyId(user);
    const handleOffer = async ({ offer, from }) => {
      if (from === myId) return;
      let pc = peerConnections.current[from];
      if (!pc) {
        pc = new window.RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerConnections.current[from] = pc;
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
        }
        pc.ontrack = event => {
          let audio = remoteAudioRefs.current[from];
          if (!audio) {
            audio = document.createElement('audio');
            audio.autoplay = true;
            audio.style.display = 'none';
            document.body.appendChild(audio);
            remoteAudioRefs.current[from] = audio;
          }
          audio.srcObject = event.streams[0];

          // --- Voice Activity Detection ---
          if (window.AudioContext) {
            const ctx = new window.AudioContext();
            const source = ctx.createMediaStreamSource(event.streams[0]);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            analyserNodes.current[from] = analyser;
            const data = new Uint8Array(analyser.frequencyBinCount);
            let speaking = false;
            function checkSpeaking() {
              analyser.getByteFrequencyData(data);
              const avg = data.reduce((a, b) => a + b, 0) / data.length;
              const isNowSpeaking = avg > 20;
              if (isNowSpeaking !== speaking) {
                speaking = isNowSpeaking;
                setSpeakingUsers(prev => ({ ...prev, [from]: speaking }));
              }
              requestAnimationFrame(checkSpeaking);
            }
            checkSpeaking();
          }
          // --- End VAD ---
        };
        pc.onicecandidate = e => {
          if (e.candidate) {
            socket.emit('voice-ice-candidate', { code: roomCode, candidate: e.candidate, from: myId });
          }
        };
      }
      // Only set remote offer if in the right state
      if (pc.signalingState === 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        // Add any buffered ICE candidates
        if (iceCandidateBuffer.current[from]) {
          for (const cand of iceCandidateBuffer.current[from]) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          iceCandidateBuffer.current[from] = [];
        }
        const answer = await pc.createAnswer();
        if (pc.signalingState === 'have-remote-offer') {
          await pc.setLocalDescription(answer);
          console.log('🎤 Sending answer to:', from);
          socket.emit('voice-answer', { code: roomCode, answer, from: myId });
        } else {
          console.warn('Skipping setLocalDescription(answer): wrong signaling state', pc.signalingState);
        }
      } else {
        console.warn('Skipping setRemoteDescription(offer): wrong signaling state', pc.signalingState);
      }
    };
    const handleAnswer = async ({ answer, from }) => {
      if (from === myId) return;
      const pc = peerConnections.current[from];
      if (pc) {
        // Only set remote answer if in the right state
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          // Add any buffered ICE candidates
          if (iceCandidateBuffer.current[from]) {
            for (const cand of iceCandidateBuffer.current[from]) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            iceCandidateBuffer.current[from] = [];
          }
        } else {
          console.warn('Skipping setRemoteDescription(answer): wrong signaling state', pc.signalingState);
        }
      }
    };
    const handleIce = async ({ candidate, from }) => {
      if (from === myId) return;
      const pc = peerConnections.current[from];
      if (pc) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Buffer the candidate
          if (!iceCandidateBuffer.current[from]) iceCandidateBuffer.current[from] = [];
          iceCandidateBuffer.current[from].push(candidate);
        }
      }
    };
    socket.on('voice-offer', handleOffer);
    socket.on('voice-answer', handleAnswer);
    socket.on('voice-ice-candidate', handleIce);
    if (isMicOn) {
      console.log('🎤 Creating offers for existing peers...');
      Object.entries(peerConnections.current).forEach(async ([pid, pc]) => {
        if (pid === myId) return;
        console.log('🎤 Creating offer for:', pid);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('voice-offer', { code: roomCode, offer, from: myId });
      });
    }
    return () => {
      socket.off('voice-offer', handleOffer);
      socket.off('voice-answer', handleAnswer);
      socket.off('voice-ice-candidate', handleIce);
    };
  }, [socket, roomCode, user, isMicOn]);

  // Mute/unmute remote audio elements based on globalMuted
  useEffect(() => {
    Object.entries(remoteAudioRefs.current).forEach(([userId, audio]) => {
      if (!isHostUser && globalMuted) {
        audio.muted = true;
      } else {
        audio.muted = false;
      }
    });
  }, [globalMuted, isHostUser]);

  // Expose speakingUsers for UI
  return { speakingUsers };
} 