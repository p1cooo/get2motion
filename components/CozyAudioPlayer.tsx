'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, CloudRain, Sparkles } from 'lucide-react';

export const CozyAudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [soundMode, setSoundMode] = useState<'rain' | 'lofi'>('rain');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  // Initialize or start ambient sound
  const startSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create Brown/Pink Rain Noise Buffer (5 seconds looped)
      const bufferSize = ctx.sampleRate * 5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise integration filter + soft high hiss
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5 + white * 0.05;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Lowpass filter for warm gentle raindrops
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = soundMode === 'rain' ? 650 : 450;
      filter.Q.value = 1.2;

      // Gain Node for smooth volume control
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      noiseSourceRef.current = noiseSource;
      gainNodeRef.current = gain;
      filterNodeRef.current = filter;
      setIsPlaying(true);
    } catch {
      // Audio context might fail on restricted browser permissions
    }
  };

  const stopSound = () => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
      } catch {
        // ignore
      }
      noiseSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopSound();
    } else {
      startSound();
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol, audioCtxRef.current.currentTime);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSound();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-4 shadow-xs flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg ${isPlaying ? 'bg-[#e7effa] text-[#3c6ca8]' : 'bg-[#f4ebe1] text-[#8c7a6e]'} flex items-center justify-center transition-colors`}>
            <CloudRain className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#43342a] tracking-tight">
              Cozy Ambient Rain
            </div>
            <div className="text-[10px] text-[#9d8a7c]">
              {isPlaying ? 'Gentle rain stream playing' : 'Soft focus audio background'}
            </div>
          </div>
        </div>

        <button
          onClick={togglePlay}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
            isPlaying
              ? 'bg-[#966746] text-white'
              : 'bg-[#f6eee3] hover:bg-[#ede2d2] text-[#786659]'
          }`}
          title={isPlaying ? 'Pause rain' : 'Play cozy rain'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
        </button>
      </div>

      {/* Volume slider and status */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#f7f0e6]">
        <button
          onClick={() => handleVolumeChange(volume === 0 ? 0.35 : 0)}
          className="text-[#9d8a7c] hover:text-[#544133] transition-colors cursor-pointer"
        >
          {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <input
          type="range"
          min="0"
          max="0.8"
          step="0.05"
          value={volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-[#ede2d2] rounded-lg appearance-none cursor-pointer accent-[#966746]"
        />
        <span className="text-[10px] font-mono text-[#9d8a7c] w-6 text-right">
          {Math.round(volume * 125)}%
        </span>
      </div>
    </div>
  );
};
