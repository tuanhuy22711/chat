import { create } from 'zustand';
import { streamVideoService } from '../lib/streamVideo.js';

export const useStreamCallStore = create((set, get) => ({
  // Call state
  client: null,
  call: null,
  callId: null,
  isInCall: false,
  isInitialized: false,
  
  // Call participants
  participants: [],
  localParticipant: null,
  
  // Media state
  isCameraOn: true,
  isMicrophoneOn: true,
  
  // UI state
  isIncomingCall: false,
  incomingCallData: null,
  isCallWindowOpen: false,
  
  // Error state
  error: null,

  // Initialize Stream Video
  initializeStream: async (user) => {
    try {
      set({ error: null });
      const client = await streamVideoService.initialize(user);
      set({ 
        client,
        isInitialized: true 
      });
      return client;
    } catch (error) {
      console.error('Failed to initialize Stream:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Start a call
  startCall: async (targetUser, callType = 'video') => {
    try {
      const { client, isInitialized } = get();
      
      // Check if Stream is initialized
      if (!isInitialized || !client) {
        throw new Error('Stream not initialized. Please wait for initialization to complete.');
      }

      const callId = streamVideoService.generateCallId(
        client.user.id,
        targetUser._id
      );

      const call = await streamVideoService.createCall(callId, [targetUser]);
      
      set({
        call,
        callId,
        isInCall: true,
        isCallWindowOpen: true,
        error: null
      });

      return call;
    } catch (error) {
      console.error('Failed to start call:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Join a call
  joinCall: async (callId) => {
    try {
      const call = await streamVideoService.joinCall(callId);
      
      set({
        call,
        callId,
        isInCall: true,
        isIncomingCall: false,
        incomingCallData: null,
        isCallWindowOpen: true,
        error: null
      });

      return call;
    } catch (error) {
      console.error('Failed to join call:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Leave call
  leaveCall: async () => {
    try {
      await streamVideoService.leaveCall();
      
      set({
        call: null,
        callId: null,
        isInCall: false,
        isCallWindowOpen: false,
        participants: [],
        localParticipant: null,
        error: null
      });
    } catch (error) {
      console.error('Failed to leave call:', error);
      set({ error: error.message });
    }
  },

  // End call
  endCall: async () => {
    try {
      await streamVideoService.endCall();
      
      set({
        call: null,
        callId: null,
        isInCall: false,
        isCallWindowOpen: false,
        participants: [],
        localParticipant: null,
        error: null
      });
    } catch (error) {
      console.error('Failed to end call:', error);
      set({ error: error.message });
    }
  },

  // Toggle camera
  toggleCamera: async () => {
    try {
      const isCameraOn = await streamVideoService.toggleCamera();
      set({ isCameraOn });
      return isCameraOn;
    } catch (error) {
      console.error('Failed to toggle camera:', error);
      set({ error: error.message });
      return false;
    }
  },

  // Toggle microphone
  toggleMicrophone: async () => {
    try {
      const isMicrophoneOn = await streamVideoService.toggleMicrophone();
      set({ isMicrophoneOn });
      return isMicrophoneOn;
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      set({ error: error.message });
      return false;
    }
  },

  // Handle incoming call
  handleIncomingCall: (callData) => {
    set({
      isIncomingCall: true,
      incomingCallData: callData
    });
  },

  // Accept incoming call
  acceptIncomingCall: async () => {
    const { incomingCallData } = get();
    if (incomingCallData) {
      await get().joinCall(incomingCallData.callId);
    }
  },

  // Reject incoming call
  rejectIncomingCall: () => {
    set({
      isIncomingCall: false,
      incomingCallData: null
    });
  },

  // Update participants
  updateParticipants: (participants) => {
    set({ participants });
  },

  // Set local participant
  setLocalParticipant: (participant) => {
    set({ localParticipant: participant });
  },

  // Close call window
  closeCallWindow: () => {
    set({ isCallWindowOpen: false });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Cleanup
  cleanup: () => {
    streamVideoService.cleanup();
    set({
      client: null,
      call: null,
      callId: null,
      isInCall: false,
      isInitialized: false,
      participants: [],
      localParticipant: null,
      isCameraOn: true,
      isMicrophoneOn: true,
      isIncomingCall: false,
      incomingCallData: null,
      isCallWindowOpen: false,
      error: null
    });
  }
}));
