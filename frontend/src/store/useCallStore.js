import { create } from "zustand";
import webRTCService from "../lib/webrtc";
import toast from "react-hot-toast";

export const useCallStore = create((set, get) => ({
  // Call state
  isInCall: false,
  callType: null, // 'video' | 'audio'
  isInitiator: false,
  callStatus: 'idle', // 'idle' | 'calling' | 'receiving' | 'connected' | 'ended'
  
  // Streams
  localStream: null,
  remoteStream: null,
  
  // Call participants
  currentCall: null, // { callerId, targetUserId, callType, callerName, targetName }
  
  // Media controls
  isVideoEnabled: true,
  isAudioEnabled: true,
  
  // UI state
  showIncomingCallModal: false,
  showCallWindow: false,
  callError: null,

  // Initialize WebRTC service
  initializeWebRTC: (socket) => {
    webRTCService.initialize(socket);
    
    // Set up event handlers
    webRTCService.setEventHandlers({
      onCallReceived: (callData) => {
        set({
          currentCall: callData,
          callStatus: 'receiving',
          showIncomingCallModal: true,
          callType: callData.callType
        });
      },
      
      onCallAccepted: () => {
        set({
          callStatus: 'connected',
          showIncomingCallModal: false,
          showCallWindow: true
        });
      },
      
      onCallRejected: () => {
        set({
          callStatus: 'ended',
          showIncomingCallModal: false,
          showCallWindow: false,
          currentCall: null
        });
        toast.error('Call was rejected');
      },
      
      onCallEnded: () => {
        set({
          isInCall: false,
          callStatus: 'idle',
          callType: null,
          isInitiator: false,
          localStream: null,
          remoteStream: null,
          currentCall: null,
          showIncomingCallModal: false,
          showCallWindow: false,
          isVideoEnabled: true,
          isAudioEnabled: true,
          callError: null
        });
      },
      
      onRemoteStream: (stream) => {
        set({ remoteStream: stream });
      },
      
      onError: (error) => {
        set({ callError: error });
        toast.error(error);
      }
    });
  },

  // Start a call
  startCall: async (targetUser, callType = 'video') => {
    try {
      set({
        callStatus: 'calling',
        callType,
        isInitiator: true,
        isInCall: true,
        currentCall: {
          targetUserId: targetUser._id,
          targetName: targetUser.fullName,
          callType
        },
        showCallWindow: true
      });

      const localStream = await webRTCService.startCall(targetUser._id, callType);
      
      set({
        localStream,
        isVideoEnabled: callType === 'video',
        isAudioEnabled: true
      });

    } catch (error) {
      console.error('Failed to start call:', error);
      set({
        callStatus: 'idle',
        isInCall: false,
        showCallWindow: false,
        callError: 'Failed to start call'
      });
      toast.error('Failed to start call');
    }
  },

  // Accept incoming call
  acceptCall: async () => {
    try {
      const { currentCall } = get();
      if (!currentCall) return;

      set({ callStatus: 'connecting' });

      const localStream = await webRTCService.acceptCall(currentCall);
      
      set({
        localStream,
        isInCall: true,
        isVideoEnabled: currentCall.callType === 'video',
        isAudioEnabled: true,
        showIncomingCallModal: false
      });

    } catch (error) {
      console.error('Failed to accept call:', error);
      set({
        showIncomingCallModal: false,
        callError: 'Failed to accept call'
      });
      toast.error('Failed to accept call');
    }
  },

  // Reject incoming call
  rejectCall: () => {
    const { currentCall } = get();
    if (currentCall) {
      webRTCService.rejectCall(currentCall);
    }
    
    set({
      showIncomingCallModal: false,
      currentCall: null,
      callStatus: 'idle'
    });
  },

  // End current call
  endCall: () => {
    webRTCService.endCall();
    // State will be updated by onCallEnded handler
  },

  // Toggle video
  toggleVideo: () => {
    const enabled = webRTCService.toggleVideo();
    set({ isVideoEnabled: enabled });
    return enabled;
  },

  // Toggle audio
  toggleAudio: () => {
    const enabled = webRTCService.toggleAudio();
    set({ isAudioEnabled: enabled });
    return enabled;
  },

  // Close call window
  closeCallWindow: () => {
    set({ showCallWindow: false });
  },

  // Clear call error
  clearCallError: () => {
    set({ callError: null });
  }
}));
