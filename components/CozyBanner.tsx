'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FoxMascot, FoxState } from './FoxMascot';
import { useAuth } from '../lib/auth-context';
import { useTheme, THEME_CONFIGS, ThemePreset, DEFAULT_BANNER_PATH } from '../lib/theme-context';
import { Sparkles, Palette, Check, Image as ImageIcon, RotateCcw, Sliders, Upload, Loader2 } from 'lucide-react';
import { optimizeImageFile, isValidImageFile } from '../lib/image-utils';

interface CozyBannerProps {
  onFoxClick?: () => void;
  foxState?: FoxState;
  onOpenSettings?: () => void;
}

export const CozyBanner: React.FC<CozyBannerProps> = ({
  onFoxClick,
  foxState = 'sleeping',
  onOpenSettings,
}) => {
  const { user, profile } = useAuth();
  const {
    theme,
    themeConfig,
    setTheme,
    bannerUrl,
    bannerPosition,
    setBannerUrl,
    setBannerPosition,
    resetBannerToDefault,
  } = useTheme();

  const semesterName = profile?.semesterConfig?.semesterName || 'August 2026';
  const currentWeek = 3;

  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showBannerMenu, setShowBannerMenu] = useState(false);
  const [showPositionSubmenu, setShowPositionSubmenu] = useState(false);
  const [showPresetsSubmenu, setShowPresetsSubmenu] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(bannerUrl || DEFAULT_BANNER_PATH);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Update currentSrc whenever bannerUrl changes
  useEffect(() => {
    setCurrentSrc(bannerUrl || DEFAULT_BANNER_PATH);
    setImgFailed(false);
  }, [bannerUrl]);

  const handleImgError = () => {
    const defaultWebp: string = DEFAULT_BANNER_PATH;
    const defaultPng: string = '/assets/banner/default-banner.png';
    const defaultSvg: string = '/assets/banner/default-banner.svg';

    if (currentSrc !== defaultWebp) {
      setCurrentSrc(defaultWebp);
    } else if (currentSrc !== defaultPng) {
      setCurrentSrc(defaultPng);
    } else if (currentSrc !== defaultSvg) {
      setCurrentSrc(defaultSvg);
    } else {
      setImgFailed(true);
    }
  };

  // Robust file processor for both input change and drag-and-drop
  const processBannerFile = async (file: File) => {
    if (!isValidImageFile(file)) {
      setUploadError('Please select a valid image (JPG, PNG, WebP, or GIF).');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // Optimizes oversized images to crisp WebP/JPEG under 150KB
      const optimizedDataUrl = await optimizeImageFile(file, {
        maxWidth: 1600,
        maxHeight: 600,
        quality: 0.85,
      });

      setBannerUrl(optimizedDataUrl);
      setCurrentSrc(optimizedDataUrl);
      setImgFailed(false);
      setShowBannerMenu(false);
    } catch (err) {
      console.error('Banner image optimization failed:', err);
      setUploadError(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processBannerFile(file);
    }
    // Clear value so re-selecting same file works
    if (e.target) {
      e.target.value = '';
    }
  };

  // Drag and drop handlers
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
      await processBannerFile(file);
    }
  };

  const currentThemeList = (Object.keys(THEME_CONFIGS) as ThemePreset[]);

  const BANNER_PRESETS = [
    { name: 'Morning Dawn', path: '/assets/banner/default-banner.webp', icon: '☀️' },
    { name: 'Sunset Glow', path: '/assets/banner/dashboard-banner-sunset.webp', icon: '🌅' },
    { name: 'Starry Night', path: '/assets/banner/dashboard-banner-night.webp', icon: '✨' },
    { name: 'Sakura Petals', path: '/assets/banner/dashboard-banner-sakura.webp', icon: '🌸' },
    { name: 'Pine Forest', path: '/assets/banner/dashboard-banner-forest.webp', icon: '🌲' },
    { name: 'Misty Blue', path: '/assets/banner/dashboard-banner-cloudy.webp', icon: '☁️' },
  ];

  return (
    <header
      className="w-full max-w-[1420px] mx-auto pt-6 px-4 sm:px-6 pb-2"
      id="cozy-header"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 
        Responsive Real-Image Banner Container:
        - 100% width
        - Fixed/controlled height (h-[195px] sm:h-[225px])
        - Rounded corners
        - object-fit: cover, object-position configurable
        - Soft window borders
      */}
      <div
        className={`relative w-full h-[195px] sm:h-[225px] rounded-3xl ${
          isDraggingOver ? 'border-[#966746] border-dashed ring-4 ring-[#966746]/20' : themeConfig.borderColor
        } border-[3px] shadow-sm overflow-hidden flex flex-col justify-between p-4 sm:p-6 select-none transition-all duration-200 group`}
      >
        {/* Real Banner Image Asset (Default: /assets/banner/default-banner.webp or user uploaded) */}
        {!imgFailed ? (
          <img
            src={currentSrc}
            alt="Pico Dashboard Header Banner"
            onError={handleImgError}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-all duration-300"
            style={{ objectPosition: bannerPosition }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#b6d5e1] via-[#f5e1d3] to-[#faeee3] pointer-events-none z-0">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-[#fff9ec]/80 blur-md" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#93b996]/60 to-transparent" />
          </div>
        )}

        {/* Drag & Drop Overlay Indicator */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-30 bg-[#faf6ed]/95 backdrop-blur-xs flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#966746] m-2 rounded-2xl animate-in fade-in duration-150">
            <Upload className="w-7 h-7 text-[#966746] animate-bounce" />
            <span className="text-sm font-bold text-[#43342a]">Drop image here to set as your banner</span>
            <span className="text-[11px] text-[#8c7a6e]">Supports JPG, PNG, WebP, GIF</span>
          </div>
        )}

        {/* Uploading progress indicator */}
        {isUploading && (
          <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-2xs flex items-center justify-center gap-2 text-white font-medium text-xs">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Optimizing and applying your new banner...</span>
          </div>
        )}

        {/* Subtle Theme Atmosphere Overlay Tint */}
        <div className={`absolute inset-0 pointer-events-none z-1 transition-colors duration-300 ${themeConfig.bannerOverlayClass}`} />

        {/* Architectural Subtle Window Dividers for aesthetic warmth */}
        <div className="absolute inset-0 pointer-events-none z-2">
          <div className="absolute top-0 bottom-0 left-1/3 w-[1.5px] bg-[#eedfcb]/25" />
          <div className="absolute top-0 bottom-0 left-2/3 w-[1.5px] bg-[#eedfcb]/25" />
          <div className="absolute top-11 left-0 right-0 h-[1.5px] bg-[#eedfcb]/20" />
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/10 to-transparent" />
        </div>

        {/* Top Floating Overlay Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Semester / Academic Week button */}
            <button
              onClick={onOpenSettings}
              id="semester-badge-btn"
              className="self-start inline-flex items-center gap-2.5 bg-[#fffefb]/95 hover:bg-white backdrop-blur-xs px-4 py-1.5 rounded-full border border-[#ede3d4] shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
              title="Click to configure semester dates & name"
            >
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: themeConfig.accentColor }}
              />
              <span className="text-xs sm:text-sm font-medium text-[#735e4f] tracking-wide">
                Semester: <strong className="font-semibold text-[#544133]">{semesterName}</strong>
              </span>
              <span className="text-[#a9998d]">•</span>
              <span className="text-xs sm:text-sm font-bold text-[#544133]">
                We are in WEEK {currentWeek}
              </span>
            </button>

            <div className="flex items-center gap-2 opacity-0 pointer-events-none translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0">
            {/* Banner Theme Atmosphere Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowThemePicker(!showThemePicker);
                  setShowBannerMenu(false);
                }}
                id="banner-theme-picker-btn"
                className="p-1.5 rounded-full bg-[#fffefb]/95 hover:bg-white border border-[#ede3d4] text-[#8c7a6e] hover:text-[#43342a] transition-all shadow-xs cursor-pointer flex items-center gap-1.5 px-2.5"
                title="Change Page Theme Atmosphere"
              >
                <Palette className="w-3.5 h-3.5" style={{ color: themeConfig.accentColor }} />
                <span className="text-[11px] font-semibold text-[#544133] hidden sm:inline">
                  {themeConfig.name}
                </span>
              </button>

              {showThemePicker && (
                <div
                  className="absolute top-9 left-0 z-50 bg-[#fffefb] border border-[#ede2d2] rounded-2xl p-2.5 shadow-xl w-56 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150"
                  id="banner-theme-dropdown"
                >
                  <div className="px-2 py-1 font-bold text-[#8c7a6e] text-[10px] uppercase tracking-wider border-b border-[#f2e7d7] mb-1">
                    Theme Atmosphere
                  </div>
                  {currentThemeList.map((tKey) => {
                    const t = THEME_CONFIGS[tKey];
                    const isSelected = theme === tKey;
                    return (
                      <button
                        key={tKey}
                        onClick={() => {
                          setTheme(tKey);
                          setShowThemePicker(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors text-left ${
                          isSelected
                            ? 'bg-[#f5ece0] font-bold text-[#43342a]'
                            : 'hover:bg-[#fbf7f1] text-[#735e4f]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-[#d2c2b0] shadow-2xs shrink-0"
                            style={{ backgroundColor: t.accentColor }}
                          />
                          <div>
                            <div className="font-semibold leading-tight">{t.name}</div>
                            <div className="text-[10px] text-[#8c7a6e] opacity-80 leading-tight">
                              {tKey === 'night' ? 'Muted dark mode' : tKey === 'sakura' ? 'Blush tint' : tKey === 'forest' ? 'Sage tint' : 'Atmosphere'}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#966746] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Banner Image Controls Button: Upload New, Reset, Adjust Position */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowBannerMenu(!showBannerMenu);
                  setShowThemePicker(false);
                  setShowPositionSubmenu(false);
                }}
                id="banner-settings-btn"
                className="p-1.5 rounded-full bg-[#fffefb]/95 hover:bg-white border border-[#ede3d4] text-[#8c7a6e] hover:text-[#43342a] transition-all shadow-xs cursor-pointer flex items-center gap-1.5 px-2.5"
                title="Banner Image Settings"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#8fae92]" />
                <span className="text-[11px] font-semibold text-[#544133] hidden sm:inline">
                  Banner Image
                </span>
              </button>

              {showBannerMenu && (
                <div
                  className="absolute top-9 left-0 z-50 bg-[#fffefb] border border-[#ede2d2] rounded-2xl p-2 shadow-xl w-56 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150"
                  id="banner-image-menu"
                >
                  <div className="px-2 py-1 font-bold text-[#8c7a6e] text-[10px] uppercase tracking-wider border-b border-[#f2e7d7] mb-1">
                    Banner Settings
                  </div>

                  {uploadError && (
                    <div className="px-2 py-1.5 bg-red-50 text-red-700 text-[11px] rounded-lg border border-red-200">
                      {uploadError}
                    </div>
                  )}

                  {/* 1. Upload New Banner via Label for 100% reliable native activation */}
                  <label className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-[#fbf7f1] text-[#544133] font-medium text-left transition-colors cursor-pointer relative">
                    <Upload className="w-3.5 h-3.5 text-[#966746] shrink-0" />
                    <span className="flex-1">
                      {isUploading ? 'Optimizing...' : 'Upload Image / Photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={isUploading}
                      onChange={handleFileChange}
                    />
                  </label>

                  {/* 2. Choose from Cozy Presets */}
                  <button
                    onClick={() => {
                      setShowPresetsSubmenu(!showPresetsSubmenu);
                      setShowPositionSubmenu(false);
                    }}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[#fbf7f1] text-[#544133] font-medium text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-[#e0a96d]" />
                      <span>Cozy Banner Presets</span>
                    </div>
                    <span className="text-[10px] text-[#8c7a6e]">▸</span>
                  </button>

                  {showPresetsSubmenu && (
                    <div className="bg-[#fcf8f2] rounded-xl p-1.5 border border-[#ede2d2] flex flex-col gap-1 my-0.5 max-h-48 overflow-y-auto">
                      {BANNER_PRESETS.map((p) => (
                        <button
                          key={p.path}
                          onClick={() => {
                            setBannerUrl(p.path);
                            setCurrentSrc(p.path);
                            setImgFailed(false);
                            setShowBannerMenu(false);
                          }}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] transition-colors cursor-pointer ${
                            currentSrc === p.path
                              ? 'bg-[#966746] text-white font-bold'
                              : 'text-[#544133] hover:bg-[#f5ecdd]'
                          }`}
                        >
                          <span>{p.icon}</span>
                          <span className="flex-1 truncate">{p.name}</span>
                          {currentSrc === p.path && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 3. Adjust Position */}
                  <button
                    onClick={() => {
                      setShowPositionSubmenu(!showPositionSubmenu);
                      setShowPresetsSubmenu(false);
                    }}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[#fbf7f1] text-[#544133] font-medium text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-[#8fae92]" />
                      <span>Adjust Alignment</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#8c7a6e] capitalize">
                      {bannerPosition}
                    </span>
                  </button>

                  {showPositionSubmenu && (
                    <div className="flex items-center gap-1 bg-[#f7f0e4] p-1 rounded-xl mx-1 my-0.5 justify-around text-[10px] font-bold">
                      {(['top', 'center', 'bottom'] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => {
                            setBannerPosition(pos);
                            setShowBannerMenu(false);
                          }}
                          className={`px-2 py-1 rounded-lg capitalize cursor-pointer transition-colors ${
                            bannerPosition === pos
                              ? 'bg-[#966746] text-white shadow-2xs'
                              : 'text-[#786659] hover:text-[#43342a]'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 4. Reset to Default */}
                  <button
                    onClick={() => {
                      resetBannerToDefault();
                      setCurrentSrc(DEFAULT_BANNER_PATH);
                      setImgFailed(false);
                      setShowBannerMenu(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#fbf7f1] text-[#8c7a6e] hover:text-[#43342a] text-left transition-colors cursor-pointer border-t border-[#f2e7d7]/70 mt-1 pt-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#a49386]" />
                    <span>Reset to Default</span>
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Daily Affirmation Pill */}
          <div className="self-end sm:self-auto flex items-center gap-1.5 text-xs sm:text-sm text-[#8c7a6e] font-serif italic tracking-wide bg-[#fffefb]/90 backdrop-blur-2xs px-3.5 py-1 rounded-full border border-[#ede3d4]/80 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#cfa361]" />
            <span>&quot;Consistent, quiet progress creates a brighter tomorrow.&quot;</span>
          </div>
        </div>

      </div>
    </header>
  );
};
