'use client';

import React, { useState, useEffect } from 'react';
import {
  Music,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  Edit2,
  Plus,
  Upload,
  ExternalLink,
  Check,
  X,
  Play,
  Loader2,
} from 'lucide-react';
import { optimizeImageFile, isValidImageFile } from '../../lib/image-utils';
import { parseYouTubeUrl, useCozyMedia, type CozyMediaSettings } from './cozy-media-context';

export const CozyMediaPanel: React.FC = () => {
  const { settings, saveSettings, play } = useCozyMedia();
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'youtube' | 'image'>('youtube');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imgErrorStep, setImgErrorStep] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Reset imgErrorStep whenever imageUrl changes so fresh uploads/presets always render
  useEffect(() => {
    setImgErrorStep(0);
  }, [settings.imageUrl]);


  const handleSaveYouTube = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsed = parseYouTubeUrl(inputUrl);
    if (!parsed) {
      setErrorMsg('Please enter a valid YouTube video or playlist URL (e.g. youtube.com/watch?v=...)');
      return;
    }

    const updated: CozyMediaSettings = {
      ...settings,
      mode: 'youtube',
      youtubeUrl: inputUrl.trim(),
    };
    saveSettings(updated);
    setIsEditing(false);
    setInputUrl('');
  };

  const handleRemoveMedia = () => {
    const updated: CozyMediaSettings = {
      mode: 'none',
      youtubeUrl: '',
      imageUrl: '',
    };
    saveSettings(updated);
    setIsEditing(false);
  };

  const processImageUpload = async (file: File) => {
    if (!isValidImageFile(file)) {
      setErrorMsg('Please select a valid image (JPG, PNG, WebP, or GIF).');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);

    try {
      // Optimizes oversized images to crisp WebP/JPEG under 120KB
      const optimized = await optimizeImageFile(file, {
        maxWidth: 1000,
        maxHeight: 800,
        quality: 0.85,
      });

      const updated: CozyMediaSettings = {
        ...settings,
        mode: 'image',
        imageUrl: optimized,
      };
      saveSettings(updated);
      setIsEditing(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImageUpload(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processImageUpload(file);
    }
  };

  const handleSaveImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    const updated: CozyMediaSettings = {
      ...settings,
      mode: 'image',
      imageUrl: inputUrl.trim(),
    };
    saveSettings(updated);
    setIsEditing(false);
    setInputUrl('');
  };

  const parsedEmbed = settings.youtubeUrl ? parseYouTubeUrl(settings.youtubeUrl) : null;

  return (
    <div
      className={`bg-[#fffefb] rounded-2xl border ${
        isDraggingOver ? 'border-[#966746] border-dashed ring-4 ring-[#966746]/20' : 'border-[#ede2d2]'
      } p-4 sm:p-5 shadow-xs flex flex-col relative overflow-hidden group transition-all duration-200`}
      id="cozy-media-panel"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-30 bg-[#faf6ed]/95 backdrop-blur-xs flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#966746] m-2 rounded-xl animate-in fade-in duration-150">
          <Upload className="w-6 h-6 text-[#966746] animate-bounce" />
          <span className="text-xs font-bold text-[#43342a]">Drop image here to update visual frame</span>
        </div>
      )}

      {/* Uploading Spinner Overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-2xs flex items-center justify-center gap-2 text-white font-medium text-xs rounded-2xl">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Optimizing image...</span>
        </div>
      )}
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#f2e6d2]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#f8edd9] text-[#9b6f1e] flex items-center justify-center shadow-2xs">
            {settings.mode === 'image' ? (
              <ImageIcon className="w-3.5 h-3.5" />
            ) : (
              <Music className="w-3.5 h-3.5" />
            )}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#43342a] tracking-tight">
              {settings.mode === 'image' ? 'Cozy Visual Frame' : 'Cozy Lo-Fi / Media'}
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setInputUrl(settings.mode === 'youtube' ? settings.youtubeUrl : settings.imageUrl);
              setActiveTab(settings.mode === 'image' ? 'image' : 'youtube');
              setErrorMsg(null);
            }}
            id="cozy-media-edit-btn"
            className="p-1.5 rounded-lg text-[#8c7a6e] hover:text-[#43342a] hover:bg-[#f6eee3] transition-colors cursor-pointer"
            title={settings.mode === 'none' ? 'Add YouTube or Image' : 'Change media'}
          >
            {settings.mode === 'none' ? (
              <Plus className="w-3.5 h-3.5" />
            ) : (
              <Edit2 className="w-3.5 h-3.5" />
            )}
          </button>
          {settings.mode !== 'none' && (
            <button
              onClick={handleRemoveMedia}
              className="p-1.5 rounded-lg text-[#8c7a6e] hover:text-[#8a4b53] hover:bg-[#fcecee] transition-colors cursor-pointer"
              title="Remove media"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Configuration / Editing Overlay Form */}
      {isEditing ? (
        <div className="flex flex-col gap-3 py-2 animate-in fade-in duration-200">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#fbf7f1] rounded-xl border border-[#ede2d2] text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('youtube');
                setInputUrl(settings.youtubeUrl);
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'youtube'
                  ? 'bg-[#966746] text-white shadow-2xs'
                  : 'text-[#786659] hover:text-[#43342a]'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>YouTube URL</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('image');
                setInputUrl(settings.imageUrl);
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'image'
                  ? 'bg-[#966746] text-white shadow-2xs'
                  : 'text-[#786659] hover:text-[#43342a]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image / GIF</span>
            </button>
          </div>

          {activeTab === 'youtube' ? (
            <form onSubmit={handleSaveYouTube} className="flex flex-col gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#786659] block mb-1">
                  YouTube Video or Playlist URL
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... or playlist?list=..."
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setErrorMsg(null);
                  }}
                  autoFocus
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] placeholder-[#a9998d] focus:outline-none focus:border-[#966746]"
                />
              </div>

              {errorMsg && (
                <div className="text-[11px] text-[#8a4b53] font-medium bg-[#fcecee] p-2 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs text-[#8c7a6e] hover:text-[#43342a] hover:bg-[#f6eee3] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 text-xs font-bold bg-[#966746] hover:bg-[#7e5335] text-white rounded-lg shadow-2xs cursor-pointer"
                >
                  Save Media
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#786659] block mb-1">
                  Upload local image/GIF or paste web URL
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <label
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#fbf7f1] hover:bg-[#f6eee3] border border-[#ded2c0] text-xs font-bold text-[#6c5b4f] transition-colors cursor-pointer relative"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#966746]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isUploading ? 'Optimizing photo...' : 'Choose File (JPG, PNG, GIF, WebP)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="sr-only"
                    />
                  </label>
                </div>

                <form onSubmit={handleSaveImageUrl} className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/cozy-art.gif"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] placeholder-[#a9998d] focus:outline-none focus:border-[#966746]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-bold bg-[#966746] hover:bg-[#7e5335] text-white rounded-xl cursor-pointer"
                  >
                    Save URL
                  </button>
                </form>

                {/* Cozy Presets */}
                <div className="mt-2 pt-2 border-t border-[#f2e6d2]">
                  <div className="text-[10px] font-bold text-[#8c7a6e] mb-1">
                    Or choose a cozy preset:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        saveSettings({ ...settings, mode: 'image', imageUrl: '/assets/art/cozy-art.webp' });
                        setIsEditing(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#fbf7f1] hover:bg-[#f6eee3] text-[#544133] border border-[#ede2d2] text-left truncate cursor-pointer font-medium"
                    >
                      ☕ Cozy Study Desk
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        saveSettings({ ...settings, mode: 'image', imageUrl: '/assets/banner/dashboard-banner-forest.webp' });
                        setIsEditing(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#fbf7f1] hover:bg-[#f6eee3] text-[#544133] border border-[#ede2d2] text-left truncate cursor-pointer font-medium"
                    >
                      🌲 Forest Canopy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        saveSettings({ ...settings, mode: 'image', imageUrl: '/assets/banner/dashboard-banner-sunset.webp' });
                        setIsEditing(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#fbf7f1] hover:bg-[#f6eee3] text-[#544133] border border-[#ede2d2] text-left truncate cursor-pointer font-medium"
                    >
                      🌅 Sunset Glow
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        saveSettings({ ...settings, mode: 'image', imageUrl: '/assets/banner/dashboard-banner-night.webp' });
                        setIsEditing(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#fbf7f1] hover:bg-[#f6eee3] text-[#544133] border border-[#ede2d2] text-left truncate cursor-pointer font-medium"
                    >
                      ✨ Starry Night
                    </button>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="text-[11px] text-[#8a4b53] font-medium bg-[#fcecee] p-2 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs text-[#8c7a6e] hover:text-[#43342a] hover:bg-[#f6eee3] rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : settings.mode === 'youtube' && parsedEmbed ? (
        /* The persistent iframe lives at app level so navigation does not stop playback. */
        <div className="flex flex-col gap-2">
          <div id="cozy-media-player-slot" className="w-full aspect-video rounded-xl border border-[#ede2d2] bg-[#fbf7f1] shadow-2xs" />
          <p className="text-[10px] text-[#9d8a7c] text-center italic">
            Press Play to listen • Paste your favorite playlist or lo-fi stream anytime
          </p>
        </div>
      ) : settings.mode === 'image' ? (
        /* Image / GIF Display with Bulletproof Fallbacks */
        <div className="flex flex-col gap-2">
          <div className="w-full h-[155px] rounded-xl overflow-hidden border border-[#ede2d2] bg-[#fbf7f1] flex items-center justify-center relative">
            {imgErrorStep === 0 ? (
              <img
                src={settings.imageUrl || '/assets/art/cozy-art.webp'}
                alt="Cozy Art"
                className="w-full h-full object-cover"
                onError={() => setImgErrorStep(1)}
              />
            ) : imgErrorStep === 1 ? (
              <img
                src="/assets/art/cozy-art.webp"
                alt="Cozy Art"
                className="w-full h-full object-cover"
                onError={() => setImgErrorStep(2)}
              />
            ) : imgErrorStep === 2 ? (
              <img
                src="/assets/art/cozy-art.png"
                alt="Cozy Art"
                className="w-full h-full object-cover"
                onError={() => setImgErrorStep(3)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#fbf4e8] to-[#eedfcb] flex flex-col items-center justify-center p-3 text-center">
                <div className="text-2xl mb-1">☕</div>
                <div className="text-xs font-bold text-[#544133]">Cozy Study Corner</div>
                <div className="text-[10px] text-[#8c7a6e]">Peaceful focus space</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty / No Media Prompt */
        <div
          onClick={() => {
            setIsEditing(true);
            setInputUrl('');
          }}
          className="p-5 rounded-xl border border-dashed border-[#ded2c0] bg-[#faf5ed]/50 hover:bg-[#faf5ed] flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
        >
          <div className="w-9 h-9 rounded-full bg-[#f4ebe1] text-[#966746] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-[#544133]">Add YouTube Music or GIF</div>
          <div className="text-[10px] text-[#9d8a7c] mt-0.5">
            Embed your study playlist, lo-fi beats, or ambient artwork
          </div>
        </div>
      )}
    </div>
  );
};
