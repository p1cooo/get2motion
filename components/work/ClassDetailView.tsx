'use client';

import React, { useEffect, useState } from 'react';
import { arrayUnion, doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  ListTodo,
  FileText,
  Plus,
  Check,
  BookOpen,
  Repeat,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import type { CalendarEntryDemo } from '../../lib/demo-data';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth-context';

type PrepItem = { id: string; title: string; completed: boolean };
type WorkDetailData = CalendarEntryDemo & {
  whatHappened?: string[];
  nextLesson?: string[];
  todoPrep?: PrepItem[];
};

interface ClassDetailViewProps {
  workItemId: string;
  dateStr: string;
  onBack: () => void;
}

type RecurrenceType =
  | 'Does not repeat'
  | 'Every day'
  | 'Every week'
  | 'Every 2 weeks'
  | 'Every month'
  | 'Custom';

export const ClassDetailView: React.FC<ClassDetailViewProps> = ({
  workItemId,
  dateStr,
  onBack,
}) => {
  const { user } = useAuth();
  const [entry, setEntry] = useState<CalendarEntryDemo | null>(null);
  useEffect(() => {
    if (!user) { setEntry(null); return; }
    return onSnapshot(doc(db, 'workItems', workItemId), (snapshot) => {
      if (!snapshot.exists() || snapshot.data().ownerId !== user.uid) { setEntry(null); return; }
      const data = snapshot.data() as Omit<WorkDetailData, 'id' | 'workItemId'>;
      setEntry({ ...data, id: snapshot.id, workItemId: snapshot.id, dayNum: Number(data.date?.slice(-2)) || 1 });
    });
  }, [user, workItemId]);
  const diary = {
    studentName: entry?.title ?? 'Work item',
    subtitle: `${entry?.date ?? dateStr} • ${entry?.type === 'class' ? 'Class details' : 'Event details'}`,
    whatHappened: (entry as WorkDetailData | null)?.whatHappened || [],
    nextLesson: (entry as WorkDetailData | null)?.nextLesson || [],
    todoPrep: (entry as WorkDetailData | null)?.todoPrep || [],
  };

  // Editable Session Date, Time, and Recurrence
  const [sessionDate, setSessionDate] = useState(dateStr || '2026-09-06');
  const [isEditingDate, setIsEditingDate] = useState(false);

  const [startTime, setStartTime] = useState(entry?.time.split('–')[0]?.trim() || '12:00 PM');
  const [endTime, setEndTime] = useState(entry?.time.split('–')[1]?.trim() || '1:00 PM');
  const [isEditingTime, setIsEditingTime] = useState(false);

  const [recurrence, setRecurrence] = useState<RecurrenceType>('Every week');
  const [showRecurrenceMenu, setShowRecurrenceMenu] = useState(false);

  // 3 Note lists with blank-row quick-entry
  const [whatHappened, setWhatHappened] = useState(diary.whatHappened);
  const [blankHappened, setBlankHappened] = useState('');

  const [nextLesson, setNextLesson] = useState(diary.nextLesson);
  const [blankNext, setBlankNext] = useState('');

  const [todoPrep, setTodoPrep] = useState(diary.todoPrep);
  const [blankPrep, setBlankPrep] = useState('');

  useEffect(() => {
    if (!entry) return;
    const [start = '12:00 PM', end = '1:00 PM'] = entry.time.split('–').map((value) => value.trim());
    setSessionDate(entry.date);
    setStartTime(start);
    setEndTime(end);
    setRecurrence((entry.recurrenceRule as RecurrenceType) || 'Does not repeat');
    setWhatHappened((entry as WorkDetailData).whatHappened || []);
    setNextLesson((entry as WorkDetailData).nextLesson || []);
    setTodoPrep((entry as WorkDetailData).todoPrep || []);
  }, [entry]);

  const saveEntry = (changes: Record<string, unknown>) => {
    if (user && entry) void updateDoc(doc(db, 'workItems', entry.id), changes);
  };

  const addPrepItem = (item: PrepItem) => {
    if (!user) {
      setTodoPrep((current) => [...current, item]);
      return;
    }
    void runTransaction(db, async (transaction) => {
      const workItemRef = doc(db, 'workItems', workItemId);
      const snapshot = await transaction.get(workItemRef);
      if (!snapshot.exists() || snapshot.data().ownerId !== user.uid) return;
      const current = (snapshot.data() as WorkDetailData).todoPrep || [];
      transaction.update(workItemRef, { todoPrep: [...current, item] });
    });
  };

  const handleTogglePrep = (id: string) => {
    if (!user) {
      setTodoPrep((prev) => prev.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
      return;
    }
    void runTransaction(db, async (transaction) => {
      const workItemRef = doc(db, 'workItems', workItemId);
      const snapshot = await transaction.get(workItemRef);
      if (!snapshot.exists() || snapshot.data().ownerId !== user.uid) return;
      const current = (snapshot.data() as WorkDetailData).todoPrep || [];
      transaction.update(workItemRef, { todoPrep: current.map((item) => item.id === id ? { ...item, completed: !item.completed } : item) });
    });
  };

  // Blank row quick entry: What Happened
  const handleHappenedKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blankHappened.trim()) return;
      if (!user) setWhatHappened((current) => [...current, blankHappened.trim()]);
      else saveEntry({ whatHappened: arrayUnion(blankHappened.trim()) });
      setBlankHappened('');
    } else if (e.key === 'Escape') {
      setBlankHappened('');
    }
  };

  // Blank row quick entry: Next Lesson Note
  const handleNextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blankNext.trim()) return;
      if (!user) setNextLesson((current) => [...current, blankNext.trim()]);
      else saveEntry({ nextLesson: arrayUnion(blankNext.trim()) });
      setBlankNext('');
    } else if (e.key === 'Escape') {
      setBlankNext('');
    }
  };

  // Blank row quick entry: To-do / Prep
  const handlePrepKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blankPrep.trim()) return;
      addPrepItem({ id: crypto.randomUUID?.() || `prep-${Date.now()}`, title: blankPrep.trim(), completed: false });
      setBlankPrep('');
    } else if (e.key === 'Escape') {
      setBlankPrep('');
    }
  };

  return (
    <div className="w-full max-w-[1420px] mx-auto px-4 sm:px-6 py-4 animate-in fade-in duration-300">
      {/* Back Button */}
      <button
        onClick={onBack}
        id="back-to-calendar-btn"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#786659] hover:text-[#43342a] mb-5 px-3 py-1.5 rounded-full bg-[#fffefb] border border-[#ede2d2] shadow-2xs hover:bg-[#f6eee3] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Work Calendar</span>
      </button>

      {/* Header Banner with Editable Session Date, Time, and Recurrence */}
      <div className="bg-[#fffefb] rounded-3xl border border-[#ede2d2] p-6 sm:p-8 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#f2e6d2]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f1e9] text-[#557859] text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#557859]" />
              {entry?.type === 'class' ? 'Class details' : 'Event details'}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#43342a] tracking-tight">
                {diary.studentName}
              </h1>
            </div>
            <p className="text-sm font-semibold text-[#8c7a6e] mt-1">
              {diary.subtitle}
            </p>
          </div>

          {/* Editable Session Controls Strip */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Session Date */}
            <div className="px-4 py-2.5 rounded-2xl bg-[#fbf7f1] border border-[#ede2d2] text-center min-w-[110px]">
              <div className="text-[10px] uppercase font-bold text-[#9d8a7c] tracking-wider mb-0.5">
                Session Date
              </div>
              {isEditingDate ? (
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => {
                    setSessionDate(e.target.value);
                    saveEntry({ date: e.target.value });
                    setIsEditingDate(false);
                  }}
                  onBlur={() => setIsEditingDate(false)}
                  autoFocus
                  className="text-xs font-bold text-[#43342a] bg-white border border-[#966746] rounded px-1.5 py-0.5"
                />
              ) : (
                <div
                  onClick={() => setIsEditingDate(true)}
                  className="text-xs sm:text-sm font-bold text-[#43342a] cursor-pointer hover:underline"
                  title="Click to edit date"
                >
                  {sessionDate}
                </div>
              )}
            </div>

            {/* Session Time */}
            <div className="px-4 py-2.5 rounded-2xl bg-[#fbf7f1] border border-[#ede2d2] text-center min-w-[125px]">
              <div className="text-[10px] uppercase font-bold text-[#9d8a7c] tracking-wider mb-0.5">
                Time
              </div>
              {isEditingTime ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-14 text-xs font-bold text-[#966746] bg-white border border-[#966746] rounded px-1"
                  />
                  <span className="text-xs text-[#a9998d]">–</span>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    onBlur={() => {
                      saveEntry({ time: `${startTime} – ${endTime}` });
                      setIsEditingTime(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveEntry({ time: `${startTime} – ${endTime}` });
                        setIsEditingTime(false);
                      }
                    }}
                    className="w-14 text-xs font-bold text-[#966746] bg-white border border-[#966746] rounded px-1"
                  />
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingTime(true)}
                  className="text-xs sm:text-sm font-bold text-[#966746] cursor-pointer hover:underline"
                  title="Click to edit time"
                >
                  {startTime} – {endTime}
                </div>
              )}
            </div>

            {/* Recurrence Dropdown */}
            <div className="relative">
              <div className="px-4 py-2.5 rounded-2xl bg-[#fbf7f1] border border-[#ede2d2] text-center min-w-[120px]">
                <div className="text-[10px] uppercase font-bold text-[#9d8a7c] tracking-wider mb-0.5">
                  Recurrence
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecurrenceMenu(!showRecurrenceMenu)}
                  className="text-xs sm:text-sm font-bold text-[#557859] flex items-center justify-center gap-1 cursor-pointer hover:underline w-full"
                >
                  <Repeat className="w-3 h-3" />
                  <span>{recurrence}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </div>

              {showRecurrenceMenu && (
                <div className="absolute top-12 right-0 z-50 bg-[#fffefb] border border-[#ede2d2] rounded-2xl p-1.5 shadow-xl w-48 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                  {(
                    [
                      'Does not repeat',
                      'Every day',
                      'Every week',
                      'Every 2 weeks',
                      'Every month',
                      'Custom',
                    ] as RecurrenceType[]
                  ).map((rec) => (
                    <button
                      key={rec}
                      onClick={() => {
                        setRecurrence(rec);
                        saveEntry({ recurrenceRule: rec });
                        setShowRecurrenceMenu(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-left font-semibold cursor-pointer transition-colors ${
                        recurrence === rec
                          ? 'bg-[#f5ece0] text-[#43342a] font-bold'
                          : 'hover:bg-[#fbf7f1] text-[#786659]'
                      }`}
                    >
                      {rec}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          3-COLUMN JOURNAL NOTES WITH BLANK-ROW QUICK ENTRY FOR ALL 3 LISTS
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMN 1: What Happened (Blank-Row Quick Entry) */}
        <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[#f2e6d2]">
            <div className="w-6 h-6 rounded-lg bg-[#e8f1e9] text-[#557859] flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#43342a]">
              What Happened
            </h3>
          </div>

          <div className="flex flex-col divide-y divide-[#f7f0e6] max-h-[280px] overflow-y-auto pr-1">
            {whatHappened.map((item, idx) => (
              <div
                key={idx}
                className="py-2 text-xs sm:text-sm text-[#483a30] leading-relaxed flex items-start gap-2"
              >
                <span className="text-[#8fae92] font-bold mt-0.5">•</span>
                <span className="flex-1 break-words">{item}</span>
              </div>
            ))}
          </div>

          {/* Blank Row Quick Entry */}
          <div className="mt-3 pt-2.5 border-t border-[#f2e6d2]">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#faf5ed]/70 hover:bg-[#faf5ed] border border-transparent hover:border-[#ded2c0] transition-colors">
              <Plus className="w-3.5 h-3.5 text-[#a9998d]" />
              <input
                type="text"
                placeholder="+ Add session note (Press Enter)..."
                value={blankHappened}
                onChange={(e) => setBlankHappened(e.target.value)}
                onKeyDown={handleHappenedKeyDown}
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#43342a] placeholder-[#a9998d] focus:outline-none py-1"
              />
            </div>
          </div>
        </div>

        {/* COLUMN 2: Next Lesson Note (Blank-Row Quick Entry) */}
        <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[#f2e6d2]">
            <div className="w-6 h-6 rounded-lg bg-[#faeaec] text-[#8a4b53] flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#43342a]">
              Notes
            </h3>
          </div>

          <div className="flex flex-col divide-y divide-[#f7f0e6] max-h-[280px] overflow-y-auto pr-1">
            {nextLesson.map((item, idx) => (
              <div
                key={idx}
                className="py-2 text-xs sm:text-sm text-[#483a30] leading-relaxed flex items-start gap-2"
              >
                <span className="text-[#df989f] font-bold mt-0.5">•</span>
                <span className="flex-1 break-words">{item}</span>
              </div>
            ))}
          </div>

          {/* Blank Row Quick Entry */}
          <div className="mt-3 pt-2.5 border-t border-[#f2e6d2]">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#faf5ed]/70 hover:bg-[#faf5ed] border border-transparent hover:border-[#ded2c0] transition-colors">
              <Plus className="w-3.5 h-3.5 text-[#a9998d]" />
              <input
                type="text"
                placeholder="+ Add lesson plan note (Press Enter)..."
                value={blankNext}
                onChange={(e) => setBlankNext(e.target.value)}
                onKeyDown={handleNextKeyDown}
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#43342a] placeholder-[#a9998d] focus:outline-none py-1"
              />
            </div>
          </div>
        </div>

        {/* COLUMN 3: To-do / Prep Checklist (Blank-Row Quick Entry) */}
        <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#f2e6d2]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#f8edd9] text-[#9b6f1e] flex items-center justify-center">
                <ListTodo className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#43342a]">
                To-do / Prep
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f4ebe1] text-[#786659]">
              {todoPrep.filter((t) => !t.completed).length} pending
            </span>
          </div>

          <div className="flex flex-col divide-y divide-[#f7f0e6] max-h-[280px] overflow-y-auto pr-1">
            {todoPrep.map((item) => (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between gap-2 group hover:bg-[#faf5ec] -mx-1 px-1 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePrep(item.id)}
                    className="w-4.5 h-4.5 rounded-md border-2 border-[#d3c2af] group-hover:border-[#966746] bg-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    {item.completed && <Check className="w-3 h-3 text-[#8fae92]" />}
                  </button>
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      item.completed ? 'line-through text-[#a9998d]' : 'text-[#483a30]'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Blank Row Quick Entry */}
          <div className="mt-3 pt-2.5 border-t border-[#f2e6d2]">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#faf5ed]/70 hover:bg-[#faf5ed] border border-transparent hover:border-[#ded2c0] transition-colors">
              <Plus className="w-3.5 h-3.5 text-[#a9998d]" />
              <input
                type="text"
                placeholder="+ Add prep task (Press Enter)..."
                value={blankPrep}
                onChange={(e) => setBlankPrep(e.target.value)}
                onKeyDown={handlePrepKeyDown}
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#43342a] placeholder-[#a9998d] focus:outline-none py-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
