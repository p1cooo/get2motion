'use client';

import React, { useEffect, useState, useRef } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import {
  Flag,
  Plus,
  Check,
  Undo2,
  Sparkles,
  Clock,
  GripVertical,
  Crown,
  Edit2,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { Task } from '../../lib/types';
import { CozyMediaPanel } from './CozyMediaPanel';
import { db } from '../../lib/firebase';
import confetti from 'canvas-confetti';

interface HomeViewProps {
  onNavigateToStudy?: () => void;
  onNavigateToWork?: () => void;
  onNavigateToProjects?: () => void;
}

const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();

export const HomeView: React.FC<HomeViewProps> = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }
    return onSnapshot(
      query(collection(db, 'tasks'), where('ownerId', '==', user.uid)),
      (snapshot) => setTasks(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Task))
    );
  }, [user]);

  // Blank row quick-entry input states
  const [blankThingsToDoText, setBlankThingsToDoText] = useState('');
  const [blankMainQuestText, setBlankMainQuestText] = useState('');
  const thingsInputRef = useRef<HTMLInputElement | null>(null);
  const mainQuestInputRef = useRef<HTMLInputElement | null>(null);

  // Inline editing task state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // Drag & drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isOverMainQuest, setIsOverMainQuest] = useState(false);
  const [isOverThingsToDo, setIsOverThingsToDo] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // MULTIPLE Main Quest tasks (active, priority === 'mainQuest')
  const homeTasks = tasks.filter((task) => task.showOnHome || task.parentType === null);
  const mainQuests = homeTasks.filter((t) => !t.completed && t.priority === 'mainQuest');

  // Open "Things To Do" tasks (excluding completed and main quest)
  const thingsToDo = homeTasks.filter((t) => !t.completed && t.priority !== 'mainQuest')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Completed "Done Today" tasks
  const doneToday = homeTasks.filter((t) => t.completed && t.completedAt && isToday(t.completedAt));

  // Checkbox toggle handler (Only checkbox toggles completion!)
  const handleToggleTask = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const nextCompleted = !task.completed;
          if (nextCompleted) {
            try {
              confetti({
                particleCount: 35,
                spread: 45,
                origin: { y: 0.7 },
                colors: ['#cfa361', '#df989f', '#8fae92', '#e5894b'],
              });
            } catch {
              // ignore
            }
          }
          return {
            ...task,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : null,
          };
        }
        return task;
      })
    );
    const task = tasks.find((item) => item.id === taskId);
    if (user && task) void updateDoc(doc(db, 'tasks', taskId), {
      completed: !task.completed,
      completedAt: task.completed ? null : new Date().toISOString(),
    });
  };

  // Move task to Main Quest (multi-quest supported)
  const handleMoveToMainQuest = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, priority: 'mainQuest', showOnHome: true } : t))
    );
    if (user) void updateDoc(doc(db, 'tasks', taskId), { priority: 'mainQuest', showOnHome: true });
  };

  // Move task to Things To Do
  const handleMoveToThingsToDo = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, priority: 'normal', showOnHome: true } : t))
    );
    if (user) void updateDoc(doc(db, 'tasks', taskId), { priority: 'normal', showOnHome: true });
  };

  // Start inline editing
  const startEditing = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  // Save inline editing
  const saveEditing = () => {
    if (editingTaskId && editingTaskTitle.trim()) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTaskId ? { ...t, title: editingTaskTitle.trim() } : t
        )
      );
    }
    if (editingTaskId && !editingTaskTitle.trim()) {
      setTasks((prev) => prev.filter((task) => task.id !== editingTaskId));
      if (user) void deleteDoc(doc(db, 'tasks', editingTaskId));
    } else if (user && editingTaskId) {
      void updateDoc(doc(db, 'tasks', editingTaskId), { title: editingTaskTitle.trim() });
    }
    setEditingTaskId(null);
  };

  // Blank Row Quick Entry for Things To Do: Enter saves & keeps input focused for next entry!
  const handleThingsToDoBlankKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blankThingsToDoText.trim()) return;

      const newTask: Task = {
        id: `task-user-${Date.now()}`,
        ownerId: user?.uid || 'demo-user-pico',
        title: blankThingsToDoText.trim(),
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        dueDate: null,
        area: 'personal',
        priority: 'normal',
        showOnHome: true,
        parentType: null,
        parentId: null,
        assignedToUserIds: [user?.uid || 'demo-user-pico'],
      };

      if (user) void addDoc(collection(db, 'tasks'), newTask);
      else setTasks((prev) => [...prev, newTask]);
      setBlankThingsToDoText('');
    } else if (e.key === 'Escape') {
      setBlankThingsToDoText('');
      thingsInputRef.current?.blur();
    }
  };

  // Blank Row Quick Entry for Main Quest
  const handleMainQuestBlankKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blankMainQuestText.trim()) return;

      const newTask: Task = {
        id: `task-mq-${Date.now()}`,
        ownerId: user?.uid || 'demo-user-pico',
        title: blankMainQuestText.trim(),
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        dueDate: null,
        area: 'study',
        priority: 'mainQuest',
        showOnHome: true,
        parentType: null,
        parentId: null,
        assignedToUserIds: [user?.uid || 'demo-user-pico'],
      };

      if (user) void addDoc(collection(db, 'tasks'), newTask);
      else setTasks((prev) => [newTask, ...prev]);
      setBlankMainQuestText('');
    } else if (e.key === 'Escape') {
      setBlankMainQuestText('');
      mainQuestInputRef.current?.blur();
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOverMainQuest = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverMainQuest(true);
  };

  const handleDropOnMainQuest = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverMainQuest(false);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      handleMoveToMainQuest(taskId);
    }
    setDraggedTaskId(null);
  };

  const handleDragOverThingsToDo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverThingsToDo(true);
  };

  const handleDropOnThingsToDo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverThingsToDo(false);
    setDragOverIndex(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      handleMoveToThingsToDo(taskId);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="w-full max-w-[1420px] mx-auto px-4 sm:px-6 py-4 animate-in fade-in duration-300">
      {/* 
        Balanced 3-Column Lower Layout
        LEFT: Fox illustration card + Multiple Main Quests (Fixed/Max-height scrollable drop target)
        CENTER: Daily Quote + Things To Do List (with Drag & Drop + Blank Row Quick Entry)
        RIGHT: Cozy Media Panel (YouTube / GIF) + Done Today (Fixed-Height Scrollable)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN (lg:col-span-4): Fox Mascot Card + Multiple Main Quests
        ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* 1. Calm Home encouragement card */}
          <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-6 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-[#dfd0be] transition-colors min-h-[150px]">
            <div className="absolute w-36 h-36 rounded-full bg-[#faefe0] -top-6 -right-6 pointer-events-none opacity-50" />
            <Sparkles className="relative w-7 h-7 text-[#cfa361] mb-2" />
            <div className="relative text-sm font-serif italic text-[#4a3b31]">One gentle step is enough for today.</div>
            <div className="relative mt-1 text-[11px] text-[#9d8a7c] font-medium tracking-wide">Keep your pace, Motion.</div>
          </div>

          {/* 2. Main Quest Focus Card (Supports MULTIPLE Main Quest tasks with fixed/max-height scrolling) */}
          <div
            onDragOver={handleDragOverMainQuest}
            onDragLeave={() => setIsOverMainQuest(false)}
            onDrop={handleDropOnMainQuest}
            id="main-quest-panel"
            className={`rounded-2xl border-2 p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all flex flex-col ${
              isOverMainQuest
                ? 'bg-[#fbf4e8] border-[#cfa361] scale-[1.01] ring-4 ring-[#ebd8b7]/50'
                : 'bg-[#fffefb] border-[#e6d0a8]'
            }`}
          >
            {/* Header Ribbon */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f2e6d2]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#f8edd9] text-[#9b6f1e] flex items-center justify-center shadow-2xs">
                  <Flag className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-[#43342a] tracking-tight">
                      Main Quest
                    </h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f8edd9] text-[#9b6f1e]">
                      {mainQuests.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9d8a7c] font-medium">Top daily priorities</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-[#f8edd9] text-[#9b6f1e] border border-[#ebd8b7] flex items-center gap-1">
                <Crown className="w-3 h-3 text-[#cfa361]" />
                <span>Primary</span>
              </span>
            </div>

            {/* Scrollable Container for Multiple Main Quests */}
            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {mainQuests.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-[#ead6b5] bg-[#fffaf0]/60 text-center flex flex-col items-center justify-center text-xs text-[#9d8a7c] italic">
                  Drag any task here from Things To Do to make it a Main Quest.
                </div>
              ) : (
                mainQuests.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="group relative flex items-start gap-3 p-3.5 rounded-xl border border-[#ead6b5] bg-[#fffaf0] hover:bg-[#fff6e3] text-[#43342a] transition-all cursor-grab active:cursor-grabbing shadow-2xs"
                  >
                    {/* Checkbox (Only clicking this completes the task!) */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleTask(task.id, e)}
                      aria-label="Mark task done"
                      className="mt-0.5 w-5 h-5 rounded-md border-2 border-[#cbb396] hover:border-[#966746] bg-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3] text-[#8fae92]" />}
                    </button>

                    {/* Task Title (Clicking text enters inline edit, DOES NOT complete task) */}
                    <div className="flex-1 min-w-0">
                      {editingTaskId === task.id ? (
                        <input
                          type="text"
                          value={editingTaskTitle}
                          onChange={(e) => setEditingTaskTitle(e.target.value)}
                          onBlur={saveEditing}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing();
                            if (e.key === 'Escape') setEditingTaskId(null);
                          }}
                          autoFocus
                          className="w-full text-sm font-bold bg-white border border-[#966746] rounded-md px-2 py-0.5 focus:outline-none"
                        />
                      ) : (
                        <div
                          onClick={(e) => startEditing(task, e)}
                          className="text-sm font-bold leading-snug break-words cursor-text group-hover:text-[#2d221a]"
                          title="Click to edit title"
                        >
                          {task.title}
                        </div>
                      )}

                      {task.area && (
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#8c7a6e]">
                          <span className="px-2 py-0.5 rounded-sm bg-[#f2e7d5] font-semibold uppercase text-[#6c5b4f]">
                            {task.area}
                          </span>
                          {task.dueDate && <span>Due {task.dueDate}</span>}
                        </div>
                      )}
                    </div>

                    {/* Demote / Move back to Things To Do */}
                    <button
                      type="button"
                      onClick={() => handleMoveToThingsToDo(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#a59487] hover:text-[#43342a] hover:bg-[#f2e6d2] rounded-md transition-all cursor-pointer shrink-0"
                      title="Move back to Things To Do"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Blank Row Quick Entry for Main Quest */}
            <div className="mt-3 pt-2.5 border-t border-[#f2e6d2]">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#faf5ed]/70 hover:bg-[#faf5ed] border border-transparent hover:border-[#ded2c0] transition-colors">
                <Plus className="w-3.5 h-3.5 text-[#a9998d]" />
                <input
                  ref={mainQuestInputRef}
                  type="text"
                  placeholder="+ Add Main Quest (Press Enter)..."
                  value={blankMainQuestText}
                  onChange={(e) => setBlankMainQuestText(e.target.value)}
                  onKeyDown={handleMainQuestBlankKeyDown}
                  className="flex-1 bg-transparent text-xs sm:text-sm text-[#43342a] placeholder-[#a9998d] focus:outline-none py-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CENTER COLUMN (lg:col-span-5): Daily Affirmation + Things To Do List
        ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* 1. Daily Quote / Affirmation Card */}
          <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs flex items-center gap-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#f5ede0] text-[#966746] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#cfa361]" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-serif italic text-[#4a3b31] leading-relaxed">
                &ldquo;The secret of getting ahead is getting started.&rdquo;
              </p>
              <span className="text-[11px] text-[#9d8a7c] font-sans font-medium tracking-wide">
                — Daily reminder for steady progress
              </span>
            </div>
          </div>

          {/* 2. Things To Do List Card with Drag-and-Drop, Quick Entry, and Inline Editing */}
          <div
            onDragOver={handleDragOverThingsToDo}
            onDragLeave={() => setIsOverThingsToDo(false)}
            onDrop={handleDropOnThingsToDo}
            id="things-to-do-panel"
            className={`bg-[#fffefb] rounded-2xl border p-5 sm:p-6 shadow-xs flex flex-col transition-all ${
              isOverThingsToDo ? 'border-[#cfa361] ring-2 ring-[#ebd8b7]/40 bg-[#fdfbf7]' : 'border-[#ede2d2]'
            }`}
          >
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#f2e6d2]">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#43342a] tracking-tight">
                  Things To Do
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f4ebe1] text-[#786659]">
                  {thingsToDo.length}
                </span>
              </div>

              <span className="text-[11px] text-[#a9998d] italic hidden sm:inline">
                Drag to reorder • Click text to edit
              </span>
            </div>

            {/* List of Tasks (Drag to/from Main Quest) */}
            <div className="flex flex-col divide-y divide-[#f7f0e6]">
              {thingsToDo.map((task, idx) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className={`group py-2.5 flex items-center justify-between gap-2.5 -mx-2 px-2 rounded-xl transition-all cursor-grab active:cursor-grabbing hover:bg-[#faf5ec]`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Drag Handle */}
                    <span className="text-[#c8b7a6] group-hover:text-[#966746] opacity-30 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-3.5 h-3.5" />
                    </span>

                    {/* Checkbox (Only clicking this completes the task!) */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleTask(task.id, e)}
                      aria-label="Mark task done"
                      className="w-5 h-5 rounded-md border-2 border-[#d3c2af] group-hover:border-[#966746] bg-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 text-[#8fae92]" />}
                    </button>

                    {/* Title or Inline Edit (Clicking text starts inline edit, does NOT complete task) */}
                    {editingTaskId === task.id ? (
                      <input
                        type="text"
                        value={editingTaskTitle}
                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing();
                          if (e.key === 'Escape') setEditingTaskId(null);
                        }}
                        autoFocus
                        className="flex-1 text-sm bg-white border border-[#966746] rounded-md px-2 py-0.5 focus:outline-none"
                      />
                    ) : (
                      <span
                        onClick={(e) => startEditing(task, e)}
                        className="text-sm font-medium text-[#483a30] group-hover:text-[#2d221a] truncate flex-1 cursor-text"
                        title="Click to edit title"
                      >
                        {task.title}
                      </span>
                    )}
                  </div>

                  {/* Actions: Promote to Main Quest & Area Tag */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveToMainQuest(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#bbaaa0] hover:text-[#cfa361] hover:bg-[#f6eee3] transition-all cursor-pointer flex items-center gap-1"
                      title="Promote to Main Quest"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold hidden sm:inline">Main Quest</span>
                    </button>

                    {task.area && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          task.area === 'work'
                            ? 'bg-[#e5efe5] text-[#557859]'
                            : task.area === 'study'
                            ? 'bg-[#f4ebd9] text-[#826435]'
                            : 'bg-[#f7e6e8] text-[#8a4b53]'
                        }`}
                      >
                        {task.area}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Blank Row Quick Entry: typing + Enter saves and stays focused for next entry */}
            <div className="mt-2 pt-2 border-t border-[#f2e6d2]">
              <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-[#faf5ed]/60 hover:bg-[#faf5ed] border border-transparent hover:border-[#ded2c0] transition-colors">
                <Plus className="w-4 h-4 text-[#a9998d]" />
                <input
                  ref={thingsInputRef}
                  type="text"
                  placeholder="+ Add new task (Press Enter to add)..."
                  value={blankThingsToDoText}
                  onChange={(e) => setBlankThingsToDoText(e.target.value)}
                  onKeyDown={handleThingsToDoBlankKeyDown}
                  className="flex-1 bg-transparent text-sm text-[#43342a] placeholder-[#a9998d] focus:outline-none py-1"
                />
                {blankThingsToDoText && (
                  <span className="text-[10px] font-bold text-[#966746] bg-[#f5ede0] px-2 py-0.5 rounded-md">
                    Press ↵ Enter
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (lg:col-span-3): Cozy Media Panel + Done Today
        ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* 1. Optional User YouTube / Media Panel (Replaces Rain Synthesizer) */}
          <CozyMediaPanel />

          {/* 2. Done Today Card (Fixed-Height Scrolling Container) */}
          <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-4 sm:p-5 shadow-xs flex flex-col" id="done-today-panel">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#f2e6d2]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#8fae92]" />
                <h2 className="text-sm sm:text-base font-bold text-[#43342a] tracking-tight">
                  Done Today
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#edf4ee] text-[#557859]">
                  {doneToday.length}
                </span>
              </div>
            </div>

            {doneToday.length === 0 ? (
              <div className="text-xs text-[#9d8a7c] text-center py-6 italic">
                Check off a task to celebrate your progress today.
              </div>
            ) : (
              /* Fixed height scrolling list so 20+ items scroll cleanly without making page taller */
              <div className="flex flex-col divide-y divide-[#f7f0e6] max-h-[320px] overflow-y-auto pr-1">
                {doneToday.map((task) => (
                  <div
                    key={task.id}
                    className="py-2.5 flex items-start justify-between gap-2 group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-4 h-4 rounded-full bg-[#8fae92] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#7d6c60] line-through truncate">
                          {task.title}
                        </div>
                        {task.completedAt && (
                          <div className="flex items-center gap-1 text-[10px] text-[#a9998d] mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>
                              {new Date(task.completedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleTask(task.id)}
                      title="Undo task completion"
                      className="p-1 rounded-md text-[#b5a598] hover:text-[#966746] hover:bg-[#f6eee3] transition-colors cursor-pointer shrink-0"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
