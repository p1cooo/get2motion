'use client';

import React, { useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Users, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../lib/auth-context';
import confetti from 'canvas-confetti';

interface JoinCollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (assessmentId: string) => void;
}

export const JoinCollaborationModal: React.FC<JoinCollaborationModalProps> = ({
  isOpen,
  onClose,
  onJoined,
}) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return;

    // Direct match for demo assessment
    if (normalizedCode === 'CS301-TEAM' || normalizedCode === 'CSC1215-FINAL') {
      try {
        confetti({ particleCount: 30, spread: 60 });
      } catch {}
      onJoined('demo-assessment-cs-proposal');
      onClose();
      return;
    }

    if (!user) {
      setErrorMsg('Please sign in or use demo code "CS301-TEAM" to preview collaboration.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Direct get on /collaborationCodes/{normalizedCode} by exact document ID
      const codeRef = doc(db, 'collaborationCodes', normalizedCode);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        setErrorMsg('Invalid code. Please check with your group leader.');
        setLoading(false);
        return;
      }

      const codeData = codeSnap.data();
      if (!codeData.enabled || !codeData.assessmentId) {
        setErrorMsg('This collaboration code has been disabled or expired.');
        setLoading(false);
        return;
      }

      const assessmentId = codeData.assessmentId;

      // 2. Add only the authenticated user's UID to assessment's memberIds
      const assessmentRef = doc(db, 'assessments', assessmentId);
      await updateDoc(assessmentRef, {
        memberIds: arrayUnion(user.uid),
      });

      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#8fae92', '#df989f', '#cfa361'],
      });

      onClose();
      onJoined(assessmentId);
    } catch (err: any) {
      console.error('Join error:', err);
      setErrorMsg(
        err?.message?.includes('permission')
          ? 'You do not have permission to join this assessment.'
          : 'Unable to join assessment. Please verify the code.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#fffdf9] rounded-2xl p-6 border border-[#ede3d4] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#ede3d4]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#edf5ee] text-[#5e8b64]">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-[#43342a]">Join Group Assessment</h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[#8c7a6e] hover:text-[#43342a] cursor-pointer"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-[#8c7a6e] mt-3 leading-relaxed">
          Enter the collaboration code shared by your teammate (for example{' '}
          <span className="font-mono font-semibold text-[#544133]">CS301-TEAM</span>) to view
          assessment tasks, notes, and resources.
        </p>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-[#fcf0f2] border border-[#f4cfd4] flex items-center gap-2 text-xs text-[#b35760]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#786659] mb-1.5">
              Collaboration Code
            </label>
            <input
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. CS301-TEAM"
              className="w-full px-4 py-2.5 text-sm font-mono tracking-wider rounded-xl border border-[#ede3d4] bg-[#faf7f2] text-[#43342a] placeholder-[#ad9d91] focus:outline-none focus:ring-1 focus:ring-[#966746]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#786659] hover:bg-[#f6eee3] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code.trim() || loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#966746] hover:bg-[#835637] rounded-xl shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Joining...' : 'Join Assessment'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
