"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, ChevronLeft, ChevronRight } from 'lucide-react';

// Size configuration
const FACE_WIDTH = 800;  // Base width for the component
const FACE_HEIGHT = 500; // Height for the face image
const WAVE_HEIGHT = 400; // Height for the waveform
const TOTAL_HEIGHT = FACE_HEIGHT + WAVE_HEIGHT - 100; // Total container height (with overlap)
const WAVE_TOP_POSITION = FACE_HEIGHT - 100; // Position where waveform starts
const WAVE_STROKE_WIDTH = Math.max(4, Math.floor(FACE_WIDTH / 133)); // Scales with width, min 4px

// Updated expressions object to include emotion names
const expressions = {
  1: {
    path: "/expressions/normal.png",
    name: "Neutral"
  },
  2: {
    path: "/expressions/happy.png",
    name: "Happy"
  },
  3: {
    path: "/expressions/sad.png",
    name: "Sad"
  },
  4: {
    path: "/expressions/angry.png",
    name: "Angry"
  },
  5: {
    path: "/expressions/surprised.png",
    name: "Surprised"
  }
};

const CharacterFace = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState(new Array(128).fill(50));
  const [currentExpression, setCurrentExpression] = useState('1');
  const [showControls, setShowControls] = useState(true);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const WAVE_COLOR = '#20B2AA';

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (['1', '2', '3', '4', '5'].includes(event.key)) {
        setCurrentExpression(event.key);
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        setShowControls(prev => !prev);
      }
      if (event.key === ' ') {
        event.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      setIsRecording(true);
      animate();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRecording(false);
  };

  const animate = () => {
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);
    
    const processedData = Array.from(dataArray);
    setAudioData(processedData);
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const createWaveformPath = () => {
    const width = FACE_WIDTH;
    const height = WAVE_HEIGHT;
    const points = audioData.map((value, index) => {
      const x = (index / (audioData.length - 1)) * width;
      const y = ((value - 128) / 128) * (height / 2) + (height / 2);
      return `${x},${y}`;
    });
    return `M 0,${height/2} L ${points.join(' L ')}`;
  };


  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen min-w-screen bg-black overflow-hidden">
      {/* Fixed Control Panel */}
      <div className={`fixed left-0 top-0 h-screen transition-transform duration-300 transform ${showControls ? 'translate-x-0' : '-translate-x-full'} z-50`}>
        <div className="h-full flex">
          <div className="bg-gray-900 p-4 space-y-6 w-64">
            <div className="space-y-2">
              <p className="text-white text-sm mb-2">Recording Control</p>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-full px-4 py-2 rounded-lg flex items-center gap-2 justify-center ${
                  isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-colors`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4" /> Stop (Space)
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> Start (Space)
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-white text-sm mb-2">Expressions</p>
              <div className="flex flex-col gap-2">
                {Object.entries(expressions).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setCurrentExpression(key)}
                    className={`px-3 py-2 rounded text-left ${
                      currentExpression === key 
                        ? 'bg-teal-500 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{value.name}</span>
                      <span className="text-sm opacity-50">Key {key}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-gray-400 text-sm mt-4">
              <p>Keyboard Controls:</p>
              <ul className="mt-2 space-y-1">
                <li>1-5: Change expressions</li>
                <li>Space: Toggle recording</li>
                <li>Tab: Toggle controls</li>
              </ul>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setShowControls(prev => !prev)}
            className="bg-gray-800 px-2 flex items-center text-gray-300 hover:text-white"
          >
            {showControls ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </div>
      </div>

      {/* Main Character Display */}
      <div className="flex-1 flex justify-center items-start pt-20">
      <div className="overflow-hidden relative" style={{ height: `${TOTAL_HEIGHT}px` }}>
          {/* Oscilloscope Mouth */}
          <div className="absolute w-full" style={{ top: `${WAVE_TOP_POSITION}px` }}>
            <svg 
              width={FACE_WIDTH}
              height={WAVE_HEIGHT}
              className="bg-black"
              viewBox={`0 0 ${FACE_WIDTH} ${WAVE_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <path
                d={createWaveformPath()}
                fill="none"
                stroke={WAVE_COLOR}
                strokeWidth="4"
              />
            </svg>
          </div>

          {/* Face Expression */}
          <div className="relative z-10">
            <img 
              src={expressions[currentExpression].path}
              alt={`${expressions[currentExpression].name} expression`}
              className="w-full object-cover"
              style={{ height: `${FACE_HEIGHT}px`, width: `${FACE_WIDTH}px` }}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background: black;
        }
      `}</style>
    </div>
  );
};

export default CharacterFace;