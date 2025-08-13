import React, { useEffect } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  CallParticipantsList,
  PaginatedGridLayout
} from '@stream-io/video-react-sdk';
import { useStreamCallStore } from '../store/useStreamCallStore.js';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Users, X } from 'lucide-react';

const StreamCallWindow = () => {
  const {
    client,
    call,
    isInCall,
    isCallWindowOpen,
    isCameraOn,
    isMicrophoneOn,
    participants,
    toggleCamera,
    toggleMicrophone,
    leaveCall,
    endCall,
    closeCallWindow
  } = useStreamCallStore();

  // Don't render if not in call or window is closed
  if (!isInCall || !isCallWindowOpen || !client || !call) {
    return null;
  }

  const handleLeaveCall = async () => {
    await leaveCall();
  };

  const handleEndCall = async () => {
    await endCall();
  };

  const handleToggleCamera = async () => {
    await toggleCamera();
  };

  const handleToggleMicrophone = async () => {
    await toggleMicrophone();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">Call in Progress</span>
          <span className="text-gray-400 text-sm">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <button
          onClick={closeCallWindow}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <PaginatedGridLayout />
          </StreamCall>
        </StreamVideo>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-6">
        <div className="flex justify-center items-center space-x-6">
          {/* Microphone Toggle */}
          <button
            onClick={handleToggleMicrophone}
            className={`p-4 rounded-full transition-all duration-200 ${
              isMicrophoneOn 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isMicrophoneOn ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={handleToggleCamera}
            className={`p-4 rounded-full transition-all duration-200 ${
              isCameraOn 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isCameraOn ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </button>

          {/* Participants */}
          <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200">
            <Users className="w-6 h-6" />
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Leave Call (for participants) */}
          <button
            onClick={handleLeaveCall}
            className="p-4 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white transition-all duration-200"
          >
            <Phone className="w-6 h-6 rotate-12" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreamCallWindow;
