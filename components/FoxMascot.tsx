'use client';

import React from 'react';

export type FoxState = 'sleeping' | 'awake' | 'walking' | 'idle' | 'happy';

interface FoxMascotProps {
  state?: FoxState;
  size?: number;
  className?: string;
}

export const FoxMascot: React.FC<FoxMascotProps> = ({
  state = 'sleeping',
  size = 80,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  // If user provided webp assets in /assets/fox/
  if (!imgFailed) {
    return (
      <img
        src={`/assets/fox/fox-${state}.webp`}
        alt={`Pico the Fox (${state})`}
        width={size}
        height={state === 'sleeping' ? size * 0.72 : size}
        onError={() => setImgFailed(true)}
        className={`select-none object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105 ${className}`}
        style={{ maxWidth: size, maxHeight: size }}
      />
    );
  }

  if (state === 'sleeping') {
    return (
      <svg
        width={size}
        height={size * 0.72}
        viewBox="0 0 100 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`select-none drop-shadow-sm transition-transform duration-300 hover:scale-105 ${className}`}
        aria-label="Sleeping Fox Mascot"
      >
        {/* Sleeping Fox Body: Curled Cozy Circle */}
        <defs>
          <linearGradient id="foxFur" x1="20" y1="10" x2="80" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e5894b" />
            <stop offset="1" stopColor="#d36f32" />
          </linearGradient>
          <linearGradient id="foxWhite" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fffdf9" />
            <stop offset="1" stopColor="#f5ebda" />
          </linearGradient>
        </defs>

        {/* Outer Fluffy Tail curling around */}
        <path
          d="M75 56 C88 54 94 40 92 28 C90 18 78 14 68 18 C58 22 56 34 54 44 C50 56 62 58 75 56 Z"
          fill="url(#foxFur)"
        />
        {/* Tail White Tip */}
        <path
          d="M92 28 C90 18 78 14 68 18 C72 23 78 28 85 30 Z"
          fill="url(#foxWhite)"
        />

        {/* Curled Body Oval */}
        <ellipse cx="48" cy="46" rx="36" ry="22" fill="url(#foxFur)" />

        {/* Soft White Belly Fluff */}
        <path
          d="M28 46 C34 52 46 56 58 52 C52 46 40 44 28 46 Z"
          fill="url(#foxWhite)"
          opacity="0.9"
        />

        {/* Fox Head resting down */}
        <path
          d="M20 48 C16 42 16 32 24 26 C32 20 42 22 46 30 C50 38 46 48 38 52 C30 56 22 54 20 48 Z"
          fill="url(#foxFur)"
        />

        {/* Left Ear */}
        <polygon points="23,26 14,12 28,18" fill="#d36f32" />
        <polygon points="21,24 16,15 25,19" fill="#fce4d6" />

        {/* Right Ear */}
        <polygon points="36,22 42,8 46,22" fill="#d36f32" />
        <polygon points="38,20 42,12 44,20" fill="#fce4d6" />

        {/* White Cheek / Muzzle */}
        <path
          d="M18 42 C18 36 24 32 30 34 C36 36 38 42 36 46 C32 50 20 48 18 42 Z"
          fill="url(#foxWhite)"
        />

        {/* Cute Sleeping Eye (curved arc) */}
        <path
          d="M26 38 Q29 42 32 38"
          stroke="#43342a"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Little Dark Nose */}
        <circle cx="19" cy="44" r="2" fill="#382b22" />

        {/* Soft Rosy Cheek Blush */}
        <ellipse cx="33" cy="42" rx="3" ry="1.8" fill="#f3a7aa" opacity="0.65" />

        {/* Sleep Zzz Floating */}
        <g className="animate-pulse" opacity="0.75">
          <text x="68" y="16" fill="#8c7a6e" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
            z
          </text>
          <text x="76" y="10" fill="#8c7a6e" fontSize="12" fontFamily="sans-serif" fontWeight="bold">
            z
          </text>
        </g>
      </svg>
    );
  }

  // Awake / Walking / Happy / Idle States
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none drop-shadow-sm transition-transform duration-300 hover:scale-105 ${className}`}
      aria-label="Pico Fox Mascot"
    >
      <defs>
        <linearGradient id="foxFurAwake" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e88e50" />
          <stop offset="1" stopColor="#d36f32" />
        </linearGradient>
        <linearGradient id="foxWhiteAwake" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fffdfa" />
          <stop offset="1" stopColor="#faefe0" />
        </linearGradient>
      </defs>

      {/* Bushy Tail */}
      <path
        d="M68 62 C82 60 92 48 88 32 C84 20 72 18 64 26 C58 32 60 48 58 56 Z"
        fill="url(#foxFurAwake)"
      />
      {/* White Tail Tip */}
      <path d="M88 32 C84 20 72 18 64 26 C70 30 78 34 88 32 Z" fill="url(#foxWhiteAwake)" />

      {/* Body */}
      <ellipse cx="50" cy="62" rx="24" ry="18" fill="url(#foxFurAwake)" />
      {/* White Chest */}
      <path d="M40 56 C44 64 54 66 60 60 C56 54 46 52 40 56 Z" fill="url(#foxWhiteAwake)" />

      {/* Paws */}
      <ellipse cx="38" cy="78" rx="6" ry="4" fill="url(#foxFurAwake)" />
      <ellipse cx="54" cy="78" rx="6" ry="4" fill="url(#foxFurAwake)" />

      {/* Head */}
      <circle cx="46" cy="38" r="18" fill="url(#foxFurAwake)" />

      {/* Ears */}
      <polygon points="34,26 24,10 40,16" fill="#d36f32" />
      <polygon points="35,24 27,14 38,18" fill="#fce4d6" />
      <polygon points="56,26 68,10 52,16" fill="#d36f32" />
      <polygon points="55,24 65,14 54,18" fill="#fce4d6" />

      {/* Face White Patches */}
      <path
        d="M34 40 C34 32 42 28 46 30 C50 28 58 32 58 40 C56 46 50 48 46 48 C42 48 36 46 34 40 Z"
        fill="url(#foxWhiteAwake)"
      />

      {/* Eyes */}
      {state === 'happy' ? (
        <>
          <path d="M39 36 Q42 32 45 36" stroke="#382b22" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M48 36 Q51 32 54 36" stroke="#382b22" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="41" cy="36" r="2.5" fill="#382b22" />
          <circle cx="42" cy="35" r="0.8" fill="#ffffff" />
          <circle cx="51" cy="36" r="2.5" fill="#382b22" />
          <circle cx="52" cy="35" r="0.8" fill="#ffffff" />
        </>
      )}

      {/* Nose */}
      <polygon points="44,42 48,42 46,45" fill="#382b22" />

      {/* Cheerful Mouth */}
      <path d="M44 46 Q46 48 48 46" stroke="#382b22" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* Blush */}
      <ellipse cx="36" cy="41" rx="2.5" ry="1.5" fill="#f3a7aa" opacity="0.6" />
      <ellipse cx="56" cy="41" rx="2.5" ry="1.5" fill="#f3a7aa" opacity="0.6" />
    </svg>
  );
};
