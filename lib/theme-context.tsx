'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type ThemePreset = 'morning' | 'sunset' | 'night' | 'sakura' | 'forest' | 'cloudy';

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  description: string;
  pageBg: string; // Tailwind class
  pageBgHex: string;
  cardBg: string;
  cardBgHex: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  accentColor: string; // Hex for pill or buttons
  accentText: string;
  accentBgClass: string;
  pillSelectedClass: string;
  bannerOverlayClass: string;
}

export const THEME_CONFIGS: Record<ThemePreset, ThemeConfig> = {
  morning: {
    id: 'morning',
    name: 'Morning Dawn',
    description: 'Warm cream background with cozy amber and wood accents',
    pageBg: 'bg-[#faf6ef]',
    pageBgHex: '#faf6ef',
    cardBg: 'bg-[#fffefb]',
    cardBgHex: '#fffefb',
    textColor: 'text-[#43342a]',
    mutedTextColor: 'text-[#8c7a6e]',
    borderColor: 'border-[#ede2d2]',
    accentColor: '#966746',
    accentText: 'text-[#966746]',
    accentBgClass: 'bg-[#966746]',
    pillSelectedClass: 'bg-[#966746] text-white',
    bannerOverlayClass: 'bg-amber-900/5',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Soft peach-pink atmosphere with terracotta accents',
    pageBg: 'bg-[#fcf1eb]',
    pageBgHex: '#fcf1eb',
    cardBg: 'bg-[#fffcfb]',
    cardBgHex: '#fffcfb',
    textColor: 'text-[#46312a]',
    mutedTextColor: 'text-[#8f746d]',
    borderColor: 'border-[#edd9cf]',
    accentColor: '#b85c3f',
    accentText: 'text-[#b85c3f]',
    accentBgClass: 'bg-[#b85c3f]',
    pillSelectedClass: 'bg-[#b85c3f] text-white',
    bannerOverlayClass: 'bg-rose-900/10',
  },
  night: {
    id: 'night',
    name: 'Night',
    description: 'Deep soothing navy-gray dark canvas with soft periwinkle accents',
    pageBg: 'bg-[#1a1f29]',
    pageBgHex: '#1a1f29',
    cardBg: 'bg-[#232a36]',
    cardBgHex: '#232a36',
    textColor: 'text-[#e6edf5]',
    mutedTextColor: 'text-[#9cb0c8]',
    borderColor: 'border-[#333d4f]',
    accentColor: '#6f88d4',
    accentText: 'text-[#8fa3e8]',
    accentBgClass: 'bg-[#6f88d4]',
    pillSelectedClass: 'bg-[#6f88d4] text-white',
    bannerOverlayClass: 'bg-indigo-950/40',
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    description: 'Delicate blush background with gentle rose accents',
    pageBg: 'bg-[#fdf1f4]',
    pageBgHex: '#fdf1f4',
    cardBg: 'bg-[#fffbfa]',
    cardBgHex: '#fffbfa',
    textColor: 'text-[#473037]',
    mutedTextColor: 'text-[#8e727b]',
    borderColor: 'border-[#edd3db]',
    accentColor: '#ba536b',
    accentText: 'text-[#ba536b]',
    accentBgClass: 'bg-[#ba536b]',
    pillSelectedClass: 'bg-[#ba536b] text-white',
    bannerOverlayClass: 'bg-pink-900/10',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Restful muted sage green background with calm foliage accents',
    pageBg: 'bg-[#eff5ef]',
    pageBgHex: '#eff5ef',
    cardBg: 'bg-[#fcfdfc]',
    cardBgHex: '#fcfdfc',
    textColor: 'text-[#304234]',
    mutedTextColor: 'text-[#738877]',
    borderColor: 'border-[#d4e1d5]',
    accentColor: '#4f7b56',
    accentText: 'text-[#4f7b56]',
    accentBgClass: 'bg-[#4f7b56]',
    pillSelectedClass: 'bg-[#4f7b56] text-white',
    bannerOverlayClass: 'bg-emerald-950/10',
  },
  cloudy: {
    id: 'cloudy',
    name: 'Cloudy',
    description: 'Crisp cool light gray-blue background with slate accents',
    pageBg: 'bg-[#edf2f7]',
    pageBgHex: '#edf2f7',
    cardBg: 'bg-[#fbfdfe]',
    cardBgHex: '#fbfdfe',
    textColor: 'text-[#334252]',
    mutedTextColor: 'text-[#768697]',
    borderColor: 'border-[#d3deea]',
    accentColor: '#4f7397',
    accentText: 'text-[#4f7397]',
    accentBgClass: 'bg-[#4f7397]',
    pillSelectedClass: 'bg-[#4f7397] text-white',
    bannerOverlayClass: 'bg-slate-900/10',
  },
};

export const DEFAULT_BANNER_PATH = '/assets/fox/home_fox.png';

const getBannerUrl = (value: unknown) => {
  if (typeof value !== 'string') return DEFAULT_BANNER_PATH;
  const url = value.trim();
  return url && url !== '/assets/banner/default-banner.webp' &&
    (url.startsWith('data:image/') || url.startsWith('/assets/'))
    ? url
    : DEFAULT_BANNER_PATH;
};

interface ThemeContextType {
  theme: ThemePreset;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemePreset) => void;
  bannerUrl: string;
  bannerPosition: 'center' | 'top' | 'bottom';
  setBannerUrl: (url: string) => void;
  setBannerPosition: (pos: 'center' | 'top' | 'bottom') => void;
  resetBannerToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();

  const [theme, setThemeState] = useState<ThemePreset>('morning');
  const [bannerUrl, setBannerUrlState] = useState<string>(DEFAULT_BANNER_PATH);
  const [bannerPosition, setBannerPositionState] = useState<'center' | 'top' | 'bottom'>('center');

  // Load initial settings from profile or localStorage
  useEffect(() => {
    if (profile) {
      if (profile.theme && THEME_CONFIGS[profile.theme]) {
        setThemeState(profile.theme);
      }
      setBannerUrlState(getBannerUrl(profile.bannerUrl));
      if (profile.bannerPosition && ['center', 'top', 'bottom'].includes(profile.bannerPosition)) {
        setBannerPositionState(profile.bannerPosition as any);
      }
    } else {
      // Demo / Guest mode: check localStorage
      try {
        const savedTheme = localStorage.getItem('pico_theme') as ThemePreset;
        if (savedTheme && THEME_CONFIGS[savedTheme]) {
          setThemeState(savedTheme);
        }
        const savedBanner = localStorage.getItem('pico_banner_url');
        setBannerUrlState(getBannerUrl(savedBanner));
        const savedPos = localStorage.getItem('pico_banner_pos') as any;
        if (savedPos && ['center', 'top', 'bottom'].includes(savedPos)) {
          setBannerPositionState(savedPos);
        }
      } catch {
        // Ignore localStorage error in private browsing
      }
    }
  }, [profile]);

  const setTheme = (newTheme: ThemePreset) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('pico_theme', newTheme);
    } catch {}

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        updateDoc(userDocRef, { theme: newTheme }).catch((err) =>
          console.warn('Failed to save theme to firestore:', err)
        );
      } catch (err) {
        console.warn('Failed to update theme in firestore:', err);
      }
    }
  };

  const setBannerUrl = (url: string) => {
    const nextUrl = getBannerUrl(url);
    setBannerUrlState(nextUrl);
    try {
      localStorage.setItem('pico_banner_url', nextUrl);
    } catch {}

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        updateDoc(userDocRef, { bannerUrl: nextUrl }).catch((err) =>
          console.warn('Failed to save bannerUrl to firestore:', err)
        );
      } catch (err) {
        console.warn('Failed to update bannerUrl in firestore:', err);
      }
    }
  };

  const setBannerPosition = (pos: 'center' | 'top' | 'bottom') => {
    setBannerPositionState(pos);
    try {
      localStorage.setItem('pico_banner_pos', pos);
    } catch {}

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        updateDoc(userDocRef, { bannerPosition: pos }).catch((err) =>
          console.warn('Failed to save bannerPosition to firestore:', err)
        );
      } catch (err) {
        console.warn('Failed to update bannerPosition in firestore:', err);
      }
    }
  };

  const resetBannerToDefault = () => {
    setBannerUrl(DEFAULT_BANNER_PATH);
    setBannerPosition('center');
  };

  const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS.morning;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeConfig,
        setTheme,
        bannerUrl,
        bannerPosition,
        setBannerUrl,
        setBannerPosition,
        resetBannerToDefault,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
