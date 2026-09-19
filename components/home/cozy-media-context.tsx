'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Minimize2, Pause, Play, Maximize2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../lib/auth-context';
import { db } from '../../lib/firebase';

export interface CozyMediaSettings {
  mode: 'youtube' | 'image' | 'none';
  youtubeUrl: string;
  imageUrl: string;
}

const DEFAULT_SETTINGS: CozyMediaSettings = { mode: 'image', youtubeUrl: '', imageUrl: '/assets/art/cozy-art.webp' };

export const parseYouTubeUrl = (url: string): { type: 'video' | 'playlist'; embedUrl: string } | null => {
  try {
    const value = url.trim();
    if (!value) return null;
    const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
    const listId = parsed.searchParams.get('list');
    if (listId && /^[a-zA-Z0-9_-]+$/.test(listId)) return { type: 'playlist', embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(listId)}` };
    const videoId = parsed.searchParams.get('v') || (parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.pathname.split('/embed/')[1]);
    return videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? { type: 'video', embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` } : null;
  } catch { return null; }
};

type CozyMediaContextValue = { settings: CozyMediaSettings; saveSettings: (settings: CozyMediaSettings) => void; play: () => void; pause: () => void; previous: () => void; next: () => void; isPlaylist: boolean; isHidden: boolean; setIsHidden: (hidden: boolean) => void };
const CozyMediaContext = createContext<CozyMediaContextValue | null>(null);

const sendPlayerCommand = (frame: HTMLIFrameElement | null, func: string) => frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');

export const CozyMediaProvider: React.FC<React.PropsWithChildren<{ isHome: boolean }>> = ({ children, isHome }) => {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<CozyMediaSettings>(DEFAULT_SETTINGS);
  const [isHidden, setIsHidden] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (profile?.cozyMedia) {
      setSettings({ ...DEFAULT_SETTINGS, ...profile.cozyMedia });
      return;
    }
    try {
      const saved = localStorage.getItem(`motion:cozy-media:${user?.uid || 'guest'}`);
      setSettings(saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS);
    } catch { setSettings(DEFAULT_SETTINGS); }
  }, [profile?.cozyMedia, user?.uid]);
  const saveSettings = (next: CozyMediaSettings) => {
    setSettings(next);
    try { localStorage.setItem(`motion:cozy-media:${user?.uid || 'guest'}`, JSON.stringify(next)); } catch { /* non-persistent browser */ }
    if (user) void updateDoc(doc(db, 'users', user.uid), { cozyMedia: next }).catch((error) => console.error('Could not save media preference.', error));
  };
  const parsed = parseYouTubeUrl(settings.youtubeUrl);
  useEffect(() => { if (isHome) setIsHidden(false); }, [isHome]);
  const value = useMemo(() => ({
    settings, saveSettings,
    play: () => sendPlayerCommand(frameRef.current, 'playVideo'),
    pause: () => sendPlayerCommand(frameRef.current, 'pauseVideo'),
    previous: () => parsed?.type === 'playlist' && sendPlayerCommand(frameRef.current, 'previousVideo'),
    next: () => parsed?.type === 'playlist' && sendPlayerCommand(frameRef.current, 'nextVideo'),
    isPlaylist: parsed?.type === 'playlist',
    isHidden, setIsHidden,
  }), [settings, parsed?.type, isHidden]);
  return <CozyMediaContext.Provider value={value}>{children}{parsed && settings.mode === 'youtube' && <CozyMediaPlayer frameRef={frameRef} parsed={parsed} isHome={isHome} />}</CozyMediaContext.Provider>;
};

export const useCozyMedia = () => {
  const context = useContext(CozyMediaContext);
  if (!context) throw new Error('CozyMediaProvider is required');
  return context;
};

const CozyMediaPlayer: React.FC<{ frameRef: React.RefObject<HTMLIFrameElement | null>; parsed: NonNullable<ReturnType<typeof parseYouTubeUrl>>; isHome: boolean }> = ({ frameRef, parsed, isHome }) => {
  const { play, pause, previous, next, isPlaylist, isHidden, setIsHidden } = useCozyMedia();
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setSlot(isHome ? document.getElementById('cozy-media-player-slot') : null);
  }, [isHome]);
  useEffect(() => () => {
    sendPlayerCommand(frameRef.current, 'stopVideo');
  }, [frameRef]);
  const target = isHome ? slot : document.body;
  return <>
    {!isHome && isHidden && <button onClick={() => setIsHidden(false)} className="fixed bottom-4 right-4 z-40 rounded-full border border-[#ede2d2] bg-[#fffefb] p-3 text-[#786659] shadow-lg hover:bg-[#f6eee3]" title="Show media player" aria-label="Show media player"><Maximize2 className="w-4 h-4" /></button>}
    {target && createPortal(<aside className={`z-40 overflow-hidden border border-[#ede2d2] bg-[#fffefb] shadow-xl ${isHome ? 'w-full rounded-xl' : `fixed bottom-4 right-4 w-56 rounded-2xl ${isHidden ? 'invisible pointer-events-none' : ''}`}`} aria-label={isHome ? 'Cozy media player' : 'Cozy media mini-player'}>
    <iframe ref={frameRef} src={`${parsed.embedUrl}${parsed.embedUrl.includes('?') ? '&' : '?'}enablejsapi=1&playsinline=1`} title="Cozy Media Stream" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" className="block w-full aspect-video border-0" />
    <div className={`${isHome && slot ? 'hidden' : 'flex'} items-center justify-center gap-2 p-1.5`}>
      <button onClick={previous} disabled={!isPlaylist} className="p-1.5 rounded-lg text-[#786659] hover:bg-[#f6eee3] disabled:opacity-35" title="Previous"><ChevronLeft className="w-4 h-4" /></button>
      <button onClick={pause} className="p-1.5 rounded-lg text-[#786659] hover:bg-[#f6eee3]" title="Pause"><Pause className="w-4 h-4" /></button>
      <button onClick={play} className="p-1.5 rounded-lg bg-[#966746] text-white hover:bg-[#7e5335]" title="Play"><Play className="w-4 h-4" /></button>
      <button onClick={next} disabled={!isPlaylist} className="p-1.5 rounded-lg text-[#786659] hover:bg-[#f6eee3] disabled:opacity-35" title="Next"><ChevronRight className="w-4 h-4" /></button>
      {!isHome && <button onClick={() => setIsHidden(true)} className="p-1.5 rounded-lg text-[#786659] hover:bg-[#f6eee3]" title="Hide player"><Minimize2 className="w-4 h-4" /></button>}
    </div>
    </aside>, target)}
  </>;
};
