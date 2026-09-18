'use client';

import React from 'react';
import { Home, GraduationCap, Briefcase, Lightbulb, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useTheme } from '../lib/theme-context';

export type ActiveTab = 'home' | 'study' | 'work' | 'projects';

interface TopNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAuth?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAuth,
}) => {
  const { user, profile, signOutUser } = useAuth();
  const { themeConfig } = useTheme();

  const navItems: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Home', icon: <Home className="w-4.5 h-4.5" /> },
    { key: 'study', label: 'Study', icon: <GraduationCap className="w-4.5 h-4.5" /> },
    { key: 'work', label: 'Work', icon: <Briefcase className="w-4.5 h-4.5" /> },
    { key: 'projects', label: 'Projects & Ideas', icon: <Lightbulb className="w-4.5 h-4.5" /> },
  ];

  return (
    <nav
      className="w-full max-w-[1420px] mx-auto px-4 sm:px-6 my-4 flex items-center justify-between gap-3"
      aria-label="Main Navigation"
    >
      {/* Centered Navigation Pills - Dynamic theme styling */}
      <div className={`flex items-center gap-1.5 sm:gap-2.5 ${themeConfig.cardBg} p-1.5 rounded-full border ${themeConfig.borderColor} shadow-xs`}>
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              id={`nav-btn-${item.key}`}
              onClick={() => onSelectTab(item.key)}
              className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? `${themeConfig.pillSelectedClass} shadow-sm font-bold scale-[1.02]`
                  : `${themeConfig.mutedTextColor} hover:${themeConfig.textColor} hover:bg-black/5`
              }`}
            >
              {item.icon}
              <span className="whitespace-nowrap tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right controls: user avatar and sign-out */}
      <div className="flex items-center gap-2.5">
        {user ? (
          <div className="flex items-center gap-2 bg-[#fffefb] px-3 py-1.5 rounded-full border border-[#ede2d2] shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#df989f] text-white text-xs font-bold flex items-center justify-center select-none shadow-2xs">
                {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : 'P'}
              </div>
              <span className="text-xs sm:text-sm text-[#544133] font-semibold hidden sm:inline max-w-[110px] truncate">
                {profile?.displayName || 'Pico'}
              </span>
            </div>
            <button
              onClick={() => signOutUser()}
              id="signout-btn"
              title="Sign Out"
              className="p-1 rounded-full text-[#a49386] hover:text-[#c45353] hover:bg-[#fcf0f2] transition-colors cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            id="signin-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#fffefb] hover:bg-[#f6efe4] text-[#786659] hover:text-[#43342a] text-xs sm:text-sm font-semibold border border-[#ede2d2] transition-all shadow-xs cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-[#df989f] text-white text-[10px] font-bold flex items-center justify-center">
              P
            </div>
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
};
