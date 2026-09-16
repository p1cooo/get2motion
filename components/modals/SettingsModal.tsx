'use client';

import React, { useState } from 'react';
import { Settings, Calendar, Save, Check } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { getAcademicWeek } from '../../lib/academic-week';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateSemesterConfig } = useAuth();
  const [semesterName, setSemesterName] = useState(
    profile?.semesterConfig?.semesterName || 'August 2026'
  );
  const [semesterStartDate, setSemesterStartDate] = useState(
    profile?.semesterConfig?.semesterStartDate || '2026-09-01'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const previewWeek = getAcademicWeek(semesterStartDate);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateSemesterConfig(semesterName.trim(), semesterStartDate);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#fffdf9] rounded-2xl p-6 border border-[#ede3d4] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#ede3d4]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#faf7f2] border border-[#ede3d4] text-[#786659]">
              <Settings className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-[#43342a]">Academic Semester Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[#8c7a6e] hover:text-[#43342a] cursor-pointer"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#786659] mb-1.5">
              Semester Display Name
            </label>
            <input
              type="text"
              required
              value={semesterName}
              onChange={(e) => setSemesterName(e.target.value)}
              placeholder="e.g. August 2026 or Spring 2027"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ede3d4] bg-[#faf7f2] text-[#43342a] focus:outline-none focus:ring-1 focus:ring-[#966746]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#786659] mb-1.5">
              Semester Start Date (Week 1)
            </label>
            <input
              type="date"
              required
              value={semesterStartDate}
              onChange={(e) => setSemesterStartDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ede3d4] bg-[#faf7f2] text-[#43342a] focus:outline-none focus:ring-1 focus:ring-[#966746]"
            />
            <p className="text-[11px] text-[#9d8a7c] mt-1.5">
              Current calculated academic week based on this start date:{' '}
              <strong className="text-[#544133]">Week {previewWeek}</strong>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f5ede2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#786659] hover:bg-[#f6eee3] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#966746] hover:bg-[#835637] rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
