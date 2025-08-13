import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { axiosInstance } from './axios.js';

class StreamVideoService {
  constructor() {
    this.client = null;
    this.call = null;
    this.user = null;
    this.token = null;
    this.apiKey = import.meta.env.VITE_STREAM_API_KEY || 'pavaphavh3cc'; // Your Stream API key
  }

  // Initialize the Stream Video client
  async initialize(user) {
    try {
      console.log('Starting Stream initialization for user:', user);
      
      this.user = {
        id: user._id,
        name: user.fullName,
        image: user.profilePic
      };

      console.log('Stream user object:', this.user);
      console.log('Stream API key:', this.apiKey);

      // Get token from backend
      console.log('Requesting Stream token from backend...');
      const response = await axiosInstance.post('/stream/token');
      this.token = response.data.token;
      
      console.log('Received Stream token:', this.token ? 'Token received' : 'No token');

      // Create Stream Video client
      console.log('Creating StreamVideoClient...');
      this.client = new StreamVideoClient({
        apiKey: this.apiKey,
        user: this.user,
        token: this.token
      });

      console.log('Stream Video initialized successfully');
      return this.client;
    } catch (error) {
      console.error('Error initializing Stream Video:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      throw error;
    }
  }

  // Create a call
  async createCall(callId, members = []) {
    try {
      if (!this.client) {
        throw new Error('Stream Video client not initialized');
      }

      console.log('Creating call with ID:', callId);

      // Create call instance directly
      this.call = this.client.call('default', callId);
      
      // Join the call and create it if it doesn't exist
      await this.call.join({ create: true });
      
      console.log('Call created and joined successfully');
      return this.call;
    } catch (error) {
      console.error('Error creating call:', error);
      throw error;
    }
  }

  // Join an existing call
  async joinCall(callId) {
    try {
      if (!this.client) {
        throw new Error('Stream Video client not initialized');
      }

      this.call = this.client.call('default', callId);
      await this.call.join();
      
      console.log('Joined call successfully');
      return this.call;
    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  }

  // Leave the current call
  async leaveCall() {
    try {
      if (this.call) {
        await this.call.leave();
        this.call = null;
        console.log('Left call successfully');
      }
    } catch (error) {
      console.error('Error leaving call:', error);
      throw error;
    }
  }

  // End the call (for call creator)
  async endCall() {
    try {
      if (this.call) {
        // End call locally
        await this.call.leave();
        this.call = null;
        
        console.log('Call ended successfully');
      }
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  // Toggle camera
  async toggleCamera() {
    try {
      if (this.call) {
        await this.call.camera.toggle();
        return this.call.camera.state.status === 'enabled';
      }
      return false;
    } catch (error) {
      console.error('Error toggling camera:', error);
      return false;
    }
  }

  // Toggle microphone
  async toggleMicrophone() {
    try {
      if (this.call) {
        await this.call.microphone.toggle();
        return this.call.microphone.state.status === 'enabled';
      }
      return false;
    } catch (error) {
      console.error('Error toggling microphone:', error);
      return false;
    }
  }

  // Get call state
  getCallState() {
    if (!this.call) return null;
    
    return {
      callId: this.call.id,
      isJoined: this.call.state.callingState === 'joined',
      participants: this.call.state.participants,
      cameraEnabled: this.call.camera.state.status === 'enabled',
      microphoneEnabled: this.call.microphone.state.status === 'enabled'
    };
  }

  // Cleanup
  cleanup() {
    if (this.call) {
      this.call.leave();
      this.call = null;
    }
    if (this.client) {
      this.client.disconnectUser();
      this.client = null;
    }
    this.user = null;
    this.token = null;
  }

  // Generate call ID
  generateCallId(userId1, userId2) {
    const sortedIds = [userId1, userId2].sort();
    return `call_${sortedIds[0]}_${sortedIds[1]}_${Date.now()}`;
  }
}

// Export singleton instance
export const streamVideoService = new StreamVideoService();
export default streamVideoService;
