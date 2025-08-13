import { StreamVideoClient } from "@stream-io/video-client";
import jwt from 'jsonwebtoken';

// Stream configuration
const STREAM_API_KEY = process.env.STREAM_API_KEY || 'pavaphavh3cc'; // Your Stream app ID
const STREAM_SECRET = process.env.STREAM_SECRET; // Your Stream secret

if (!STREAM_SECRET) {
  console.warn('STREAM_SECRET is not set. Please add it to your .env file for production use.');
}

export { STREAM_API_KEY, STREAM_SECRET };

// Helper function to generate user token (server-side token generation)
export const generateUserToken = (userId) => {
  try {
    if (!STREAM_SECRET) {
      throw new Error('Stream secret not configured. Please check STREAM_SECRET.');
    }
    
    // Generate JWT token for Stream
    const payload = {
      user_id: userId,
      iss: 'https://getstream.io',
      sub: 'user/' + userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    };
    
    return jwt.sign(payload, STREAM_SECRET, { algorithm: 'HS256' });
  } catch (error) {
    console.error('Error generating Stream token:', error);
    throw error;
  }
};

// Helper function to create a Stream Video client for server-side operations
export const createStreamClient = (userId) => {
  try {
    if (!STREAM_SECRET) {
      throw new Error('Stream secret not configured. Please check STREAM_SECRET.');
    }
    
    const token = generateUserToken(userId);
    const user = { id: userId };
    
    const client = new StreamVideoClient({
      apiKey: STREAM_API_KEY,
      token,
      user
    });
    
    return client;
  } catch (error) {
    console.error('Error creating Stream client:', error);
    throw error;
  }
};

// Helper function to create a call
export const createCall = async (callId, createdBy, members) => {
  try {
    const client = createStreamClient(createdBy);
    const call = client.call('default', callId);
    
    const response = await call.getOrCreate({
      data: {
        created_by_id: createdBy,
        members: members.map(member => ({
          user_id: member.user_id,
          role: member.role || 'user'
        }))
      }
    });

    return response;
  } catch (error) {
    console.error('Error creating Stream call:', error);
    throw error;
  }
};

// Helper function to end a call
export const endCall = async (callId, userId) => {
  try {
    const client = createStreamClient(userId);
    const call = client.call('default', callId);
    await call.end();
    return true;
  } catch (error) {
    console.error('Error ending Stream call:', error);
    throw error;
  }
};
