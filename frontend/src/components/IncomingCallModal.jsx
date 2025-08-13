import React from 'react';
import { Phone, PhoneOff, Video, Volume2 } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import Avatar from './Avatar';

const IncomingCallModal = () => {
  const {
    showIncomingCallModal,
    currentCall,
    acceptCall,
    rejectCall
  } = useCallStore();

  if (!showIncomingCallModal || !currentCall) {
    return null;
  }

  const isVideoCall = currentCall.callType === 'video';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-96 max-w-md mx-4 shadow-xl">
        <div className="text-center">
          {/* Caller Avatar */}
          <div className="mb-4">
            <Avatar
              src={currentCall.callerProfilePic}
              name={currentCall.callerName}
              size="size-20 mx-auto"
            />
          </div>

          {/* Incoming call text */}
          <h3 className="text-xl font-semibold mb-2">
            {currentCall.callerName}
          </h3>
          
          <div className="flex items-center justify-center gap-2 text-sm text-base-content/70 mb-6">
            {isVideoCall ? (
              <>
                <Video size={16} />
                <span>Incoming video call</span>
              </>
            ) : (
              <>
                <Volume2 size={16} />
                <span>Incoming voice call</span>
              </>
            )}
          </div>

          {/* Call actions */}
          <div className="flex justify-center gap-4">
            {/* Reject button */}
            <button
              onClick={rejectCall}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
              title="Decline"
            >
              <PhoneOff size={24} />
            </button>

            {/* Accept button */}
            <button
              onClick={acceptCall}
              className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors"
              title="Accept"
            >
              {isVideoCall ? <Video size={24} /> : <Phone size={24} />}
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

export default IncomingCallModal;
