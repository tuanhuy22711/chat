import React, { useRef, useEffect } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Minimize2,
  Volume2
} from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import Avatar from './Avatar';

const CallWindow = () => {
  const {
    showCallWindow,
    localStream,
    remoteStream,
    currentCall,
    callStatus,
    callType,
    isVideoEnabled,
    isAudioEnabled,
    isInitiator,
    endCall,
    toggleVideo,
    toggleAudio,
    closeCallWindow
  } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Set up video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!showCallWindow) {
    return null;
  }

  const isVideoCall = callType === 'video';
  const isConnected = callStatus === 'connected';
  const isCalling = callStatus === 'calling';

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white">
        <div className="flex items-center gap-3">
          <Avatar
            src={currentCall?.callerProfilePic || currentCall?.targetProfilePic}
            name={currentCall?.callerName || currentCall?.targetName || 'Unknown'}
            size="size-10"
          />
          <div>
            <h3 className="font-semibold">
              {isInitiator 
                ? (currentCall?.targetName || 'Unknown') 
                : (currentCall?.callerName || 'Unknown')
              }
            </h3>
            <div className="flex items-center gap-1 text-sm text-gray-300">
              {isVideoCall ? <Video size={14} /> : <Volume2 size={14} />}
              <span>
                {isCalling ? 'Calling...' : 
                 isConnected ? 'Connected' : 
                 callStatus}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={closeCallWindow}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          title="Minimize"
        >
          <Minimize2 size={20} />
        </button>
      </div>

      {/* Video area */}
      <div className="flex-1 relative">
        {isVideoCall ? (
          <>
            {/* Remote video (main) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local video (picture-in-picture) */}
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
              {isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <VideoOff size={20} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* No remote video placeholder */}
            {!remoteStream && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <Avatar
                    src={currentCall?.callerProfilePic || currentCall?.targetProfilePic}
                    name={currentCall?.callerName || currentCall?.targetName || 'Unknown'}
                    size="size-32 mx-auto mb-4"
                  />
                  <p className="text-lg">
                    {isCalling ? 'Calling...' : 'Waiting for response...'}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Audio call interface */
          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
            <div className="text-center text-white">
              <Avatar
                src={currentCall?.callerProfilePic || currentCall?.targetProfilePic}
                name={currentCall?.callerName || currentCall?.targetName || 'Unknown'}
                size="size-40 mx-auto mb-6"
              />
              <h2 className="text-2xl font-semibold mb-2">
                {isInitiator 
                  ? (currentCall?.targetName || 'Unknown') 
                  : (currentCall?.callerName || 'Unknown')
                }
              </h2>
              <p className="text-lg text-gray-300">
                {isCalling ? 'Calling...' : 
                 isConnected ? 'Voice call active' : 
                 callStatus}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="p-6 bg-black/80">
        <div className="flex justify-center gap-4">
          {/* Audio toggle */}
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          </button>

          {/* Video toggle (only for video calls) */}
          {isVideoCall && (
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isVideoEnabled 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
          )}

          {/* End call */}
          <button
            onClick={endCall}
            className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
            title="End call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallWindow;
