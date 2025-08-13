import Peer from 'simple-peer';
import { io } from 'socket.io-client';

class WebRTCService {
  constructor() {
    this.peer = null;
    this.socket = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isInitiator = false;
    this.callType = null; // 'video' or 'audio'
    this.onCallReceived = null;
    this.onCallAccepted = null;
    this.onCallRejected = null;
    this.onCallEnded = null;
    this.onRemoteStream = null;
    this.onError = null;
  }

  // Initialize WebRTC service with socket connection
  initialize(socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  // Setup socket event listeners for WebRTC signaling
  setupSocketListeners() {
    this.socket.on('call:incoming', (data) => {
      console.log('Incoming call:', data);
      if (this.onCallReceived) {
        this.onCallReceived(data);
      }
    });

    this.socket.on('call:accepted', (data) => {
      console.log('Call accepted:', data);
      this.handleCallAccepted(data);
    });

    this.socket.on('call:rejected', (data) => {
      console.log('Call rejected:', data);
      if (this.onCallRejected) {
        this.onCallRejected(data);
      }
    });

    this.socket.on('call:ended', (data) => {
      console.log('Call ended:', data);
      this.handleCallEnded();
    });

    this.socket.on('webrtc:signal', (data) => {
      console.log('WebRTC signal received:', data);
      if (this.peer) {
        this.peer.signal(data.signal);
      }
    });

    this.socket.on('call:user-busy', (data) => {
      console.log('User is busy:', data);
      if (this.onError) {
        this.onError('User is currently busy');
      }
    });
  }

  // Start a call (initiator)
  async startCall(targetUserId, callType = 'video') {
    try {
      this.callType = callType;
      this.isInitiator = true;

      // Get user media
      const constraints = {
        video: callType === 'video',
        audio: true
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create peer connection
      this.peer = new Peer({
        initiator: true,
        trickle: false,
        stream: this.localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.setupPeerListeners();

      // Send call invitation
      this.socket.emit('call:initiate', {
        targetUserId,
        callType,
        callerId: this.socket.auth?.userId
      });

      return this.localStream;
    } catch (error) {
      console.error('Error starting call:', error);
      if (this.onError) {
        this.onError('Failed to access camera/microphone');
      }
      throw error;
    }
  }

  // Accept an incoming call
  async acceptCall(callData) {
    try {
      this.callType = callData.callType;
      this.isInitiator = false;

      // Get user media
      const constraints = {
        video: callData.callType === 'video',
        audio: true
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create peer connection
      this.peer = new Peer({
        initiator: false,
        trickle: false,
        stream: this.localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.setupPeerListeners();

      // Accept the call
      this.socket.emit('call:accept', {
        callerId: callData.callerId,
        targetUserId: callData.targetUserId
      });

      return this.localStream;
    } catch (error) {
      console.error('Error accepting call:', error);
      if (this.onError) {
        this.onError('Failed to access camera/microphone');
      }
      throw error;
    }
  }

  // Reject an incoming call
  rejectCall(callData) {
    this.socket.emit('call:reject', {
      callerId: callData.callerId,
      targetUserId: callData.targetUserId
    });
  }

  // End current call
  endCall() {
    if (this.peer) {
      this.socket.emit('call:end', {
        peerId: this.peer._id
      });
    }
    this.handleCallEnded();
  }

  // Setup peer connection event listeners
  setupPeerListeners() {
    this.peer.on('signal', (signal) => {
      console.log('Sending WebRTC signal:', signal);
      this.socket.emit('webrtc:signal', {
        signal,
        target: this.isInitiator ? 'receiver' : 'caller'
      });
    });

    this.peer.on('stream', (stream) => {
      console.log('Received remote stream:', stream);
      this.remoteStream = stream;
      if (this.onRemoteStream) {
        this.onRemoteStream(stream);
      }
    });

    this.peer.on('connect', () => {
      console.log('Peer connected');
      if (this.onCallAccepted) {
        this.onCallAccepted();
      }
    });

    this.peer.on('error', (error) => {
      console.error('Peer error:', error);
      if (this.onError) {
        this.onError('Connection error: ' + error.message);
      }
    });

    this.peer.on('close', () => {
      console.log('Peer connection closed');
      this.handleCallEnded();
    });
  }

  // Handle call accepted
  handleCallAccepted(data) {
    if (this.onCallAccepted) {
      this.onCallAccepted(data);
    }
  }

  // Handle call ended
  handleCallEnded() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    // Close peer connection
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.remoteStream = null;
    this.isInitiator = false;
    this.callType = null;

    if (this.onCallEnded) {
      this.onCallEnded();
    }
  }

  // Toggle video during call
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // Toggle audio during call
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // Get call status
  getCallStatus() {
    return {
      isInCall: !!this.peer,
      callType: this.callType,
      isInitiator: this.isInitiator,
      hasLocalStream: !!this.localStream,
      hasRemoteStream: !!this.remoteStream
    };
  }

  // Event handlers (to be set by components)
  setEventHandlers({
    onCallReceived,
    onCallAccepted,
    onCallRejected,
    onCallEnded,
    onRemoteStream,
    onError
  }) {
    this.onCallReceived = onCallReceived;
    this.onCallAccepted = onCallAccepted;
    this.onCallRejected = onCallRejected;
    this.onCallEnded = onCallEnded;
    this.onRemoteStream = onRemoteStream;
    this.onError = onError;
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService();
export default webRTCService;
