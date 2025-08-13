import express from 'express';
import { generateUserToken, createCall, endCall } from '../lib/stream.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Generate Stream token for user
router.post('/token', protectRoute, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const token = generateUserToken(userId);
    
    res.json({
      token,
      userId,
      success: true
    });
  } catch (error) {
    console.error('Error generating Stream token:', error);
    res.status(500).json({
      message: 'Failed to generate Stream token',
      error: error.message
    });
  }
});

// Create a new call
router.post('/call/create', protectRoute, async (req, res) => {
  try {
    const { callId, members } = req.body;
    const createdBy = req.user._id.toString();
    
    if (!callId || !members || !Array.isArray(members)) {
      return res.status(400).json({
        message: 'Call ID and members array are required'
      });
    }

    // Add the creator to members if not already included
    const allMembers = [
      { user_id: createdBy, role: 'admin' },
      ...members.filter(member => member.user_id !== createdBy)
    ];

    const call = await createCall(callId, createdBy, allMembers);
    
    res.json({
      success: true,
      callId,
      call: call.data || call
    });
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({
      message: 'Failed to create call',
      error: error.message
    });
  }
});

// End a call
router.post('/call/end', protectRoute, async (req, res) => {
  try {
    const { callId } = req.body;
    const userId = req.user._id.toString();
    
    if (!callId) {
      return res.status(400).json({
        message: 'Call ID is required'
      });
    }

    await endCall(callId, userId);
    
    res.json({
      success: true,
      message: 'Call ended successfully'
    });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({
      message: 'Failed to end call',
      error: error.message
    });
  }
});

export default router;
