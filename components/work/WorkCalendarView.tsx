'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Users,
  Grid,
  CalendarDays,
  X,
  Repeat,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { DEMO_SEPTEMBER_ENTRIES, CalendarEntryDemo } from '../../lib/demo-data';

interface WorkCalendarViewProps {
  onSelectWorkItem?: (workItemId: string, dateStr: string) => void;
  onSelectOccurrence?: (workItemId: string, dateStr: string) => void;
  onOpenCreateModal?: () => void;
}

export type EventColor = 'sage' | 'blush' | 'lavender' | 'sand' | 'soft blue' | 'peach';

export const EVENT_COLORS: Record<
  EventColor,
  { name: string; bg: string; text: string; border: string; dot: string }
> = {
  sage: {
    name: 'Sage',
    bg: 'bg-[#e5efe5]',
    text: 'text-[#3f5f43]',
    border: 'border-[#c4dcbf]',
    dot: '#557859',
  },
  blush: {
    name: 'Blush',
    bg: 'bg-[#faeaec]',
    text: 'text-[#8a4b53]',
    border: 'border-[#f2cbd0]',
    dot: '#df989f',
  },
  lavender: {
    name: 'Lavender',
    bg: 'bg-[#ede8f5]',
    text: 'text-[#5e4b7c]',
    border: 'border-[#d8cde8]',
    dot: '#8d78ab',
  },
  sand: {
    name: 'Sand',
    bg: 'bg-[#f5ede2]',
    text: 'text-[#6d543b]',
    border: 'border-[#e2d5c3]',
    dot: '#966746',
  },
  'soft blue': {
    name: 'Soft blue',
    bg: 'bg-[#e2edf7]',
    text: 'text-[#3a5d7c]',
    border: 'border-[#c5d8ea]',
    dot: '#527c9e',
  },
  peach: {
    name: 'Peach',
    bg: 'bg-[#fdede4]',
    text: 'text-[#87492c]',
    border: 'border-[#f5d0bd]',
    dot: '#d46f48',
  },
};

export type RecurrenceOption =
  | 'Does not repeat'
  | 'Every day'
  | 'Every week'
  | 'Every 2 weeks'
  | 'Every month'
  | 'Custom';

function getDefaultEndTime(startTimeStr: string): string {
  const match = startTimeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return '12:00 PM';
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  let ampm = match[3].toUpperCase();

  if (hour === 11 && ampm === 'AM') {
    hour = 12;
    ampm = 'PM';
  } else if (hour === 11 && ampm === 'PM') {
    hour = 12;
    ampm = 'AM';
  } else if (hour === 12) {
    hour = 1;
  } else {
    hour = (hour % 12) + 1;
  }

  return `${hour}:${minute} ${ampm}`;
}

export const WorkCalendarView: React.FC<WorkCalendarViewProps> = ({
  onSelectWorkItem,
  onSelectOccurrence,
}) => {
  const handleSelect = onSelectWorkItem || onSelectOccurrence || (() => {});

  // View mode: 'month' or 'day'
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<number>(15); // Sep 15 default

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = September (0-indexed)
  const [filterType, setFilterType] = useState<'all' | 'class' | 'event'>('all');

  // Local calendar entries state with full persistence & reactive updates
  const [entries, setEntries] = useState<CalendarEntryDemo[]>(DEMO_SEPTEMBER_ENTRIES);

  // Drag & drop state
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [dragTargetDay, setDragTargetDay] = useState<number | null>(null);
  const [pendingRecurringDrop, setPendingRecurringDrop] = useState<{
    entry: CalendarEntryDemo;
    targetDay: number;
  } | null>(null);

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'class' | 'event'>('class');
  const [newDateStr, setNewDateStr] = useState('2026-09-15');
  const [newStartTime, setNewStartTime] = useState('11:00 AM');
  const [newEndTime, setNewEndTime] = useState('12:00 PM');
  const [newRecurrence, setNewRecurrence] = useState<RecurrenceOption>('Every week');
  const [newColor, setNewColor] = useState<EventColor>('sage');
  const [newNotes, setNewNotes] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build grid: fixed 7-column calendar
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  // Open modal with prefilled slot values
  const openCreateModalForSlot = (day: number, startTime: string) => {
    const formattedDate = `2026-09-${String(day).padStart(2, '0')}`;
    setNewDateStr(formattedDate);
    setNewStartTime(startTime);
    setNewEndTime(getDefaultEndTime(startTime));
    setNewTitle('');
    setNewNotes('');
    setNewType('class');
    setNewRecurrence('Every week');
    setNewColor('sage');
    setIsAddModalOpen(true);
  };

  // Handle Add Item Submit
  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const dayParsed = parseInt(newDateStr.split('-')[2] || '15', 10);
    const combinedTime = `${newStartTime} – ${newEndTime}`;

    const newEntry: CalendarEntryDemo = {
      id: `custom-${Date.now()}`,
      workItemId: `work-custom-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      date: newDateStr,
      dayNum: dayParsed,
      time: combinedTime,
      color: newColor,
      recurrenceRule: newRecurrence !== 'Does not repeat' ? newRecurrence : undefined,
      notes: newNotes.trim() || undefined,
    };

    setEntries((prev) => [...prev, newEntry]);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewNotes('');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, entry: CalendarEntryDemo) => {
    e.dataTransfer.setData('text/plain', entry.id);
    setDraggedEntryId(entry.id);
  };

  const handleDropOnDay = (e: React.DragEvent, targetDay: number) => {
    e.preventDefault();
    setDragTargetDay(null);

    const entryId = e.dataTransfer.getData('text/plain') || draggedEntryId;
    if (!entryId) return;

    const foundEntry = entries.find((item) => item.id === entryId);
    if (!foundEntry) return;

    if (foundEntry.dayNum === targetDay) return; // Dropped on same day

    // Check if it is a recurring event
    if (foundEntry.recurrenceRule && foundEntry.recurrenceRule !== 'Does not repeat') {
      setPendingRecurringDrop({ entry: foundEntry, targetDay });
      return;
    }

    // Single event reschedule: updates immediately
    executeReschedule(foundEntry, targetDay, false);
  };

  const executeReschedule = (entry: CalendarEntryDemo, targetDay: number, allFuture: boolean) => {
    const newDate = `2026-09-${String(targetDay).padStart(2, '0')}`;

    if (allFuture) {
      // Shift all future occurrences by delta
      const delta = targetDay - entry.dayNum;
      setEntries((prev) =>
        prev.map((item) => {
          if (item.workItemId === entry.workItemId && item.dayNum >= entry.dayNum) {
            const nextDay = Math.min(30, Math.max(1, item.dayNum + delta));
            return {
              ...item,
              dayNum: nextDay,
              date: `2026-09-${String(nextDay).padStart(2, '0')}`,
            };
          }
          return item;
        })
      );
    } else {
      // Shift only this single occurrence
      setEntries((prev) =>
        prev.map((item) => {
          if (item.id === entry.id) {
            return {
              ...item,
              dayNum: targetDay,
              date: newDate,
              // mark as single occurrence exception if needed
              recurrenceRule: undefined,
            };
          }
          return item;
        })
      );
    }
    setPendingRecurringDrop(null);
    setDraggedEntryId(null);
  };

  // Switch to Day View on date click
  const handleDayClick = (dayNum: number) => {
    setSelectedDay(dayNum);
    setViewMode('day');
  };

  // Day View Entries
  const selectedDayEntries = entries.filter((e) => e.dayNum === selectedDay);

  // Hourly slots for Outlook-style Day View (8 AM to 8 PM)
  const hours = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM',
  ];

  return (
    <div className="w-full max-w-[1420px] mx-auto px-4 sm:px-6 py-4 animate-in fade-in duration-300">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#43342a] tracking-tight">
            Work & Coaching Schedule
          </h1>
          <p className="text-xs sm:text-sm text-[#8c7a6e]">
            Manage classes, events, session notes, and recurring routines.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Month / Day View Switcher */}
          <div className="flex items-center gap-1 bg-[#fbf7f1] p-1 rounded-full border border-[#ede2d2] text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#966746] text-white shadow-2xs'
                  : 'text-[#786659] hover:text-[#43342a]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Month View</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-[#966746] text-white shadow-2xs'
                  : 'text-[#786659] hover:text-[#43342a]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Day View</span>
            </button>
          </div>

          {/* Filter Type Pills */}
          <div className="flex items-center gap-1 bg-[#fbf7f1] p-1 rounded-full border border-[#ede2d2] text-xs">
            {(['all', 'class', 'event'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer capitalize ${
                  filterType === t
                    ? 'bg-[#fffefb] text-[#43342a] shadow-2xs'
                    : 'text-[#786659] hover:text-[#43342a]'
                }`}
              >
                {t === 'all' ? 'All Items' : `${t}es`}
              </button>
            ))}
          </div>

          {/* "+ Add Class / Event" Button (SINGLE PLUS ONLY) */}
          <button
            onClick={() => {
              openCreateModalForSlot(selectedDay, '11:00 AM');
            }}
            id="add-class-event-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#966746] hover:bg-[#7e5335] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class / Event</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: RESTORED FIXED-SIZE MONTH CALENDAR
          - Fixed consistent height (h-[120px] sm:h-[128px])
          - Clicking cell immediately opens Day View
          - Maximum 3 items visible, remainder becomes +X more
      ========================================================================= */}
      {viewMode === 'month' && (
        <div className="bg-[#fffefb] rounded-3xl border border-[#ede2d2] p-5 sm:p-7 shadow-xs">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#f2e6d2]">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#43342a]">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f4ebe1] text-[#786659]">
                Semester Week 3
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-full hover:bg-[#f6eee3] text-[#786659] hover:text-[#43342a] transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentMonth(8);
                  setCurrentYear(2026);
                }}
                className="px-3 py-1 text-xs font-semibold rounded-full bg-[#fbf7f1] hover:bg-[#f6eee3] border border-[#ede2d2] text-[#786659]"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-full hover:bg-[#f6eee3] text-[#786659] hover:text-[#43342a] transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Header Labels */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-[#8c7a6e] tracking-wider uppercase">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* 
            Fixed-size Calendar Grid:
            - Equal height: h-[120px] sm:h-[128px]
            - Equal structure, no auto-growing
            - Max 3 visible items, overflow becomes +X more
          */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dayNum, index) => {
              if (dayNum === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-[120px] sm:h-[128px] rounded-2xl bg-[#faf6ef]/40 border border-dashed border-[#f2e7d7]/60"
                  />
                );
              }

              const isToday = dayNum === 15;
              const isSelected = selectedDay === dayNum;
              const dayEntries = filteredEntries.filter((e) => e.dayNum === dayNum);
              const visibleEntries = dayEntries.slice(0, 3);
              const overflowCount = dayEntries.length - 3;

              return (
                <div
                  key={dayNum}
                  onClick={() => handleDayClick(dayNum)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragTargetDay(dayNum);
                  }}
                  onDragLeave={() => setDragTargetDay(null)}
                  onDrop={(e) => handleDropOnDay(e, dayNum)}
                  className={`h-[120px] sm:h-[128px] rounded-2xl p-2 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                    dragTargetDay === dayNum
                      ? 'bg-[#fbf4e8] border-[#966746] ring-2 ring-[#ebd8b7]'
                      : isToday
                      ? 'bg-[#fffaf0] border-[#d8be92] shadow-2xs'
                      : isSelected
                      ? 'bg-[#fffdfa] border-[#966746] shadow-2xs'
                      : 'bg-[#fffdfa] border-[#ede2d2] hover:border-[#dfd0be] hover:bg-[#fffefb]'
                  }`}
                >
                  {/* Top Day Number Row */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-[#966746] text-white'
                          : 'text-[#544133] group-hover:text-[#966746]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dayEntries.length > 0 && (
                      <span className="text-[9px] font-bold text-[#a9998d]">
                        {dayEntries.length} {dayEntries.length === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </div>

                  {/* Visible Entries (Strict Max 3 items) */}
                  <div className="flex flex-col gap-1 my-0.5 overflow-hidden">
                    {visibleEntries.map((entry) => {
                      const colorConfig =
                        EVENT_COLORS[entry.color as EventColor] || EVENT_COLORS.sage;

                      return (
                        <div
                          key={entry.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(e, entry);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(entry.workItemId, entry.date);
                          }}
                          className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border} truncate transition-all cursor-grab active:cursor-grabbing hover:scale-[1.01] shadow-2xs flex items-center gap-1`}
                          title={`${entry.title} (${entry.time})`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: colorConfig.dot }}
                          />
                          <span className="truncate">{entry.title}</span>
                          {entry.recurrenceRule && (
                            <Repeat className="w-2.5 h-2.5 shrink-0 opacity-60" />
                          )}
                        </div>
                      );
                    })}

                    {/* Overflow Pill: "+X more" opens Day View */}
                    {overflowCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDayClick(dayNum);
                        }}
                        className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#f6eee3] hover:bg-[#ebdcc8] text-[#786659] hover:text-[#43342a] border border-[#ede2d2] transition-colors text-left flex items-center justify-between cursor-pointer"
                        title="Click to view all items for this day"
                      >
                        <span>+{overflowCount} more</span>
                        <span className="text-[9px] font-normal opacity-75">view →</span>
                      </button>
                    )}
                  </div>

                  {/* Subtle Footer Bar */}
                  <div className="h-0.5 flex items-center justify-center">
                    {dayEntries.length > 0 && (
                      <span className="w-5 h-0.5 rounded-full bg-[#ded2c0]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: OUTLOOK-STYLE HOURLY TIMELINE DAY VIEW
          - Consistent Back button on the TOP-LEFT: "← Back to Month View"
          - Clicking any empty hour slot immediately opens Add Class/Event modal
          - Pre-fills Date, Start Time, End Time
          - Existing items render in relevant slots and are clickable & draggable
      ========================================================================= */}
      {viewMode === 'day' && (
        <div>
          {/* Consistent Top-Left Back Navigation */}
          <button
            onClick={() => setViewMode('month')}
            id="back-to-month-view-btn"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#786659] hover:text-[#43342a] mb-5 px-3 py-1.5 rounded-full bg-[#fffefb] border border-[#ede2d2] shadow-2xs hover:bg-[#f6eee3] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Month View</span>
          </button>

          <div className="bg-[#fffefb] rounded-3xl border border-[#ede2d2] p-5 sm:p-7 shadow-xs">
            {/* Day Navigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#f2e6d2]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
                  className="p-1.5 rounded-full hover:bg-[#f6eee3] text-[#786659] cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#43342a]">
                    {selectedDay} September {currentYear}
                  </h2>
                  <span className="text-xs text-[#8c7a6e] font-medium">
                    {selectedDayEntries.length} scheduled session{selectedDayEntries.length === 1 ? '' : 's'} • Click any empty slot to add
                  </span>
                </div>

                <button
                  onClick={() => setSelectedDay((d) => Math.min(30, d + 1))}
                  className="p-1.5 rounded-full hover:bg-[#f6eee3] text-[#786659] cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDay(15)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-[#fbf7f1] hover:bg-[#f6eee3] border border-[#ede2d2] text-[#786659] cursor-pointer"
                >
                  Go to Today (Sep 15)
                </button>
                <button
                  onClick={() => openCreateModalForSlot(selectedDay, '11:00 AM')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full bg-[#966746] text-white hover:bg-[#7e5335] cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to this Day</span>
                </button>
              </div>
            </div>

            {/* Hourly Timeline Slots (8:00 AM to 8:00 PM) */}
            <div className="flex flex-col divide-y divide-[#f2e6d2]">
              {hours.map((hour) => {
                // Match entries for this hour
                const hourEntries = selectedDayEntries.filter((e) => {
                  const hourPrefix = hour.split(':')[0];
                  const isPm = hour.includes('PM');
                  return (
                    e.time.includes(hourPrefix) &&
                    (isPm ? e.time.includes('PM') : e.time.includes('AM'))
                  );
                });

                return (
                  <div
                    key={hour}
                    onClick={() => openCreateModalForSlot(selectedDay, hour)}
                    className="py-3 flex items-start gap-4 min-h-[68px] hover:bg-[#fdfbf7] transition-colors px-2.5 rounded-xl cursor-pointer group"
                    title={`Click to add event at ${hour}`}
                  >
                    {/* Time Label */}
                    <div className="w-20 text-xs font-bold text-[#8c7a6e] shrink-0 pt-1 group-hover:text-[#966746]">
                      {hour}
                    </div>

                    {/* Content Slot / Interactive Area */}
                    <div className="flex-1 flex flex-col gap-2">
                      {hourEntries.length > 0 ? (
                        hourEntries.map((entry) => {
                          const colorConfig =
                            EVENT_COLORS[entry.color as EventColor] || EVENT_COLORS.sage;

                          return (
                            <div
                              key={entry.id}
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                handleDragStart(e, entry);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(entry.workItemId, entry.date);
                              }}
                              className={`p-3 rounded-2xl border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border} flex items-center justify-between cursor-pointer hover:shadow-sm transition-all`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: colorConfig.dot }}
                                />
                                <div>
                                  <div className="font-bold text-sm">{entry.title}</div>
                                  <div className="text-xs opacity-85 flex items-center gap-2 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    <span>{entry.time}</span>
                                    {entry.recurrenceRule && (
                                      <span className="flex items-center gap-1 font-medium">
                                        <Repeat className="w-3 h-3" />
                                        <span>{entry.recurrenceRule}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span className="text-xs font-bold underline">
                                {entry.type === 'class' ? 'Open Class Journal →' : 'View Details →'}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-9 flex items-center text-xs text-[#a9998d]/60 group-hover:text-[#966746] transition-colors italic">
                          + Click to schedule at {hour}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RECURRING EVENT RESCHEDULING PROMPT MODAL
      ========================================================================= */}
      {pendingRecurringDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#fffefb] rounded-3xl border border-[#ede2d2] p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f8edd9] text-[#9b6f1e] flex items-center justify-center shrink-0">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#43342a] text-base">Recurring Event</h3>
                <p className="text-xs text-[#8c7a6e]">
                  How would you like to reschedule &quot;{pendingRecurringDrop.entry.title}&quot; to Sep{' '}
                  {pendingRecurringDrop.targetDay}?
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() =>
                  executeReschedule(
                    pendingRecurringDrop.entry,
                    pendingRecurringDrop.targetDay,
                    false
                  )
                }
                className="w-full py-2.5 px-4 rounded-xl bg-[#fbf7f1] hover:bg-[#f6eee3] border border-[#ede2d2] text-xs font-bold text-[#43342a] text-left transition-colors cursor-pointer"
              >
                This event only
              </button>

              <button
                onClick={() =>
                  executeReschedule(
                    pendingRecurringDrop.entry,
                    pendingRecurringDrop.targetDay,
                    true
                  )
                }
                className="w-full py-2.5 px-4 rounded-xl bg-[#966746] hover:bg-[#7e5335] text-white text-xs font-bold text-left transition-colors cursor-pointer"
              >
                This and following events
              </button>
            </div>

            <button
              onClick={() => setPendingRecurringDrop(null)}
              className="text-xs text-[#8c7a6e] hover:text-[#43342a] text-center pt-1 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD CLASS / EVENT MODAL (With Full Required Fields & Only 1 Plus)
      ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#fffefb] rounded-3xl border border-[#ede2d2] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2e6d2]">
              <h3 className="text-base font-extrabold text-[#43342a]">
                + Add Class / Event
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#a9998d] hover:text-[#43342a] p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="flex flex-col gap-3.5">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-[#786659] block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Joshua Coaching, FriendsWhoChess Club"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] focus:outline-none focus:ring-2 focus:ring-[#966746]"
                />
              </div>

              {/* Type: Class vs Event */}
              <div>
                <label className="text-xs font-bold text-[#786659] block mb-1">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('class')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      newType === 'class'
                        ? 'bg-[#966746] text-white border-[#966746]'
                        : 'bg-[#fbf7f1] text-[#786659] border-[#ded2c0]'
                    }`}
                  >
                    Class / Lesson
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('event')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      newType === 'event'
                        ? 'bg-[#966746] text-white border-[#966746]'
                        : 'bg-[#fbf7f1] text-[#786659] border-[#ded2c0]'
                    }`}
                  >
                    Event / Meeting
                  </button>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-[#786659] block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newDateStr}
                  onChange={(e) => setNewDateStr(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] focus:outline-none focus:ring-2 focus:ring-[#966746]"
                />
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#786659] block mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:00 AM"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] focus:outline-none focus:ring-2 focus:ring-[#966746]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#786659] block mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12:00 PM"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] focus:outline-none focus:ring-2 focus:ring-[#966746]"
                  />
                </div>
              </div>

              {/* Repeat Options */}
              <div>
                <label className="text-xs font-bold text-[#786659] block mb-1">
                  Repeat
                </label>
                <select
                  value={newRecurrence}
                  onChange={(e) => setNewRecurrence(e.target.value as RecurrenceOption)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] font-medium focus:outline-none focus:ring-2 focus:ring-[#966746]"
                >
                  <option value="Does not repeat">Does not repeat</option>
                  <option value="Every day">Every day</option>
                  <option value="Every week">Every week</option>
                  <option value="Every 2 weeks">Every 2 weeks</option>
                  <option value="Every month">Every month</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {/* Pastel Color Palette */}
              <div>
                <label className="text-xs font-bold text-[#786659] block mb-1.5">
                  Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(EVENT_COLORS) as EventColor[]).map((cKey) => {
                    const c = EVENT_COLORS[cKey];
                    const isSelected = newColor === cKey;
                    return (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => setNewColor(cKey)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isSelected
                            ? `${c.bg} ${c.text} ${c.border} ring-2 ring-[#966746]`
                            : 'bg-white text-[#786659] border-[#ded2c0]'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: c.dot }}
                        />
                        <span className="capitalize">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="text-xs font-bold text-[#786659] block mb-1">
                  Optional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Lesson objectives, student preferences, or room details..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] focus:outline-none focus:ring-2 focus:ring-[#966746] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f2e6d2]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-[#8c7a6e] hover:text-[#43342a] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#966746] hover:bg-[#7e5335] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
