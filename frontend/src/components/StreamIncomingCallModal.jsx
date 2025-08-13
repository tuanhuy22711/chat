import React from 'react';
import { useStreamCallStore } from '../store/useStreamCallStore.js';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';

const StreamIncomingCallModal = () => {
  const {
    isIncomingCall,
    incomingCallData,
    acceptIncomingCall,
    rejectIncomingCall
  } = useStreamCallStore();

  if (!isIncomingCall || !incomingCallData) {
    return null;
  }

  const handleAccept = async () => {
    try {
      await acceptIncomingCall();
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleReject = () => {
    rejectIncomingCall();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden">
        <div className="text-center">
          {/* Caller Info */}
          <div className="mb-6">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-gray-200">
              {incomingCallData.callerProfilePic ? (
                <img
                  src={incomingCallData.callerProfilePic}
                  alt={incomingCallData.callerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-white text-2xl font-bold">
                  {incomingCallData.callerName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {incomingCallData.callerName || 'Unknown Caller'}
            </h3>
            
            <p className="text-gray-600 mb-2">
              Incoming {incomingCallData.callType || 'video'} call
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              {incomingCallData.callType === 'video' ? (
                <Video className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              <span>Stream Call</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-8">
            {/* Reject Button */}
            <button
              onClick={handleReject}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            >
              <PhoneOff className="w-8 h-8" />
            </button>

            {/* Accept Button */}
            <button
              onClick={handleAccept}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            >
              <Phone className="w-8 h-8" />
            </button>
          </div>

          {/* Ring animation */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-32 h-32 border-2 border-primary rounded-full animate-pulse-ring"></div>
              <div className="w-40 h-40 border-2 border-primary rounded-full animate-pulse-ring absolute -top-4 -left-4 animation-delay-500"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
};

export default StreamIncomingCallModal;
