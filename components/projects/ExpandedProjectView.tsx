'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ListTodo,
  Lightbulb,
  FileText,
  Plus,
  Check,
  Target,
  Sparkles,
  Layers,
  ChevronDown,
  Calendar,
  X,
  Trash2,
} from 'lucide-react';
import {
  DEMO_PROJECTS,
  DEMO_BINGO_TASKS,
  DEMO_BINGO_NOTES,
} from '../../lib/demo-data';

interface ExpandedProjectViewProps {
  projectId: string;
  onBack: () => void;
}

type ProjectStatus = 'Idea' | 'Active' | 'Completed';

export const ExpandedProjectView: React.FC<ExpandedProjectViewProps> = ({
  projectId,
  onBack,
}) => {
  const initialProject =
    DEMO_PROJECTS.find((p) => p.id === projectId) || DEMO_PROJECTS[0];

  // Editable Header State
  const [projectName, setProjectName] = useState(initialProject.name);
  const [isEditingName, setIsEditingName] = useState(false);

  const [description, setDescription] = useState(initialProject.description);
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  const [status, setStatus] = useState<ProjectStatus>(
    (initialProject.status as ProjectStatus) || 'Active'
  );
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [targetDate, setTargetDate] = useState<string | null>(initialProject.targetDate || '2026-10-31');
  const [isEditingDate, setIsEditingDate] = useState(false);

  // Tasks with inline editing + blank-row quick entry
  const [tasks, setTasks] = useState(DEMO_BINGO_TASKS);
  const [blankTaskText, setBlankTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // Ideas with blank-row quick entry
  const [ideas, setIdeas] = useState<string[]>(
    initialProject.ideas && initialProject.ideas.length > 0
      ? initialProject.ideas
      : [
          'Add audio sound effects when checking off bingo squares',
          'Export board as shareable high-res PNG or PDF printable',
          'Leaderboard for daily community bingo runs',
        ]
  );
  const [blankIdeaText, setBlankIdeaText] = useState('');

  // Notes with fixed-height scrolling container + blank-row quick entry
  const [notes, setNotes] = useState<string[]>(DEMO_BINGO_NOTES);
  const [blankNoteText, setBlankNoteText] = useState('');

  // Task Handlers
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleStartEditTask = (taskId: string, currentTitle: string) => {
    setEditingTaskId(taskId);
    setEditingTaskTitle(currentTitle);
  };

  const handleSaveTaskTitle = (taskId: string) => {
    if (editingTaskTitle.trim()) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, title: editingTaskTitle.trim() } : t))
      );
    }
    setEditingTaskId(null);
  };

  // Blank Row Quick Entry: Tasks
  const handleBlankTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blankTaskText.trim()) return;

      const newTask = {
        id: `task-${Date.now()}`,
        ownerId: 'demo-user-pico',
        title: blankTaskText.trim(),
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        dueDate: null,
        area: 'project' as const,
        priority: 'normal' as const,
        showOnHome: false,
        parentType: 'project' as const,
        parentId: initialProject.id,
        assignedToUserIds: ['demo-user-pico'],
      };

      setTasks((prev) => [...prev, newTask]);
      setBlankTaskText('');
    }
  };

  // Blank Row Quick Entry: Ideas
  const handleBlankIdeaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blankIdeaText.trim()) return;
      setIdeas((prev) => [...prev, blankIdeaText.trim()]);
      setBlankIdeaText('');
    }
  };

  // Blank Row Quick Entry: Notes
  const handleBlankNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blankNoteText.trim()) return;
      const today = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      setNotes((prev) => [`${today}: ${blankNoteText.trim()}`, ...prev]);
      setBlankNoteText('');
    }
  };

  return (
    <div className="w-full max-w-[1420px] mx-auto px-4 sm:px-6 py-4 animate-in fade-in duration-300">
      {/* Top Back Navigation Button */}
      <button
        onClick={onBack}
        id="back-to-projects-btn"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#786659] hover:text-[#43342a] mb-5 px-3 py-1.5 rounded-full bg-[#fffefb] border border-[#ede2d2] shadow-2xs hover:bg-[#f6eee3] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects & Ideas</span>
      </button>

      {/* =========================================================================
          PROJECT DETAIL HEADER (Inline Editable Name, Status, Description, Target Date)
      ========================================================================= */}
      <div className="bg-[#fffefb] rounded-3xl border border-[#ede2d2] p-6 sm:p-8 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#f2e6d2]">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-[#e8f1e9] text-[#557859] flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Target className="w-7 h-7" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Status Dropdown: Idea, Active, Completed */}
              <div className="relative inline-block mb-1.5">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  id="project-status-chip"
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    status === 'Completed'
                      ? 'bg-[#ede8f5] text-[#6b578c] border-[#d8cde8]'
                      : status === 'Active'
                      ? 'bg-[#e5efe5] text-[#557859] border-[#cbe0cc]'
                      : 'bg-[#fbf0dc] text-[#8c601b] border-[#ebd8b7]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === 'Completed'
                        ? 'bg-[#6b578c]'
                        : status === 'Active'
                        ? 'bg-[#557859]'
                        : 'bg-[#8c601b]'
                    }`}
                  />
                  <span>Status: {status}</span>
                  <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                </button>

                {showStatusDropdown && (
                  <div className="absolute top-8 left-0 z-50 bg-[#fffefb] border border-[#ede2d2] rounded-2xl p-1.5 shadow-xl w-36 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                    {(['Idea', 'Active', 'Completed'] as ProjectStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setStatus(s);
                          setShowStatusDropdown(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-left font-semibold cursor-pointer transition-colors ${
                          status === s
                            ? 'bg-[#f5ece0] text-[#43342a] font-bold'
                            : 'hover:bg-[#fbf7f1] text-[#786659]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Project Name Inline Edit */}
              {isEditingName ? (
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingName(false);
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  autoFocus
                  className="w-full text-2xl sm:text-3xl font-extrabold text-[#43342a] bg-white border border-[#966746] rounded-xl px-2 py-0.5 focus:outline-none"
                />
              ) : (
                <h1
                  onClick={() => setIsEditingName(true)}
                  className="text-2xl sm:text-3xl font-extrabold text-[#43342a] tracking-tight hover:text-[#966746] cursor-text transition-colors"
                  title="Click to edit project name"
                >
                  {projectName}
                </h1>
              )}

              {/* Description Inline Edit */}
              {isEditingDesc ? (
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => setIsEditingDesc(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      setIsEditingDesc(false);
                    }
                  }}
                  autoFocus
                  className="w-full text-sm font-semibold text-[#8c7a6e] mt-1 bg-white border border-[#966746] rounded-xl p-2 focus:outline-none"
                />
              ) : (
                <p
                  onClick={() => setIsEditingDesc(true)}
                  className="text-sm font-semibold text-[#8c7a6e] mt-1 hover:text-[#43342a] cursor-text"
                  title="Click to edit description"
                >
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Target Date Box (Optional & Editable) */}
          <div className="px-5 py-3 rounded-2xl bg-[#fbf7f1] border border-[#ede2d2] min-w-[170px] text-center shrink-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold text-[#9d8a7c] tracking-wider">
                Target Milestone
              </span>
              {targetDate && (
                <button
                  onClick={() => setTargetDate(null)}
                  className="text-[10px] text-[#966746] hover:underline"
                  title="Clear target date"
                >
                  Clear
                </button>
              )}
            </div>

            {isEditingDate ? (
              <input
                type="date"
                value={targetDate || ''}
                onChange={(e) => {
                  setTargetDate(e.target.value || null);
                  setIsEditingDate(false);
                }}
                onBlur={() => setIsEditingDate(false)}
                autoFocus
                className="text-xs bg-white border border-[#966746] rounded px-2 py-0.5 text-[#43342a]"
              />
            ) : (
              <div
                onClick={() => setIsEditingDate(true)}
                className="text-sm font-bold text-[#43342a] cursor-pointer hover:underline flex items-center justify-center gap-1.5"
                title="Click to set target date"
              >
                <Calendar className="w-3.5 h-3.5 text-[#a9998d]" />
                <span>{targetDate || 'No Target Date'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Project Meta Bar */}
        <div className="pt-4 flex items-center justify-between text-xs text-[#8c7a6e]">
          <div className="flex items-center gap-4">
            <span>
              <strong>{tasks.filter((t) => t.completed).length}</strong> of {tasks.length} tasks completed
            </span>
            <span>•</span>
            <span>
              <strong>{ideas.length}</strong> brainstorm ideas
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[#9d8a7c]">
            <Sparkles className="w-3.5 h-3.5 text-[#cfa361]" />
            <span>Personal Project • Pico</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3-COLUMN INTERACTIVE CONTENT: TASKS, IDEAS, AND NOTES
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMN 1: Tasks (Inline Editable + Completed tasks crossed out + Blank Row Quick Entry) */}
        <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#f2e6d2]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#e8f1e9] text-[#557859] flex items-center justify-center">
                <ListTodo className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#43342a]">
                Tasks & Deliverables
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f4ebe1] text-[#786659]">
              {tasks.filter((t) => !t.completed).length} open
            </span>
          </div>

          <div className="flex flex-col divide-y divide-[#f7f0e6] max-h-[300px] overflow-y-auto pr-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="py-2.5 flex items-center justify-between gap-2 group hover:bg-[#faf5ec] -mx-1.5 px-1.5 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className="w-4.5 h-4.5 rounded-md border-2 border-[#d3c2af] group-hover:border-[#966746] bg-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    {task.completed && <Check className="w-3 h-3 text-[#8fae92]" />}
                  </button>

                  {editingTaskId === task.id ? (
                    <input
                      type="text"
                      value={editingTaskTitle}
                      onChange={(e) => setEditingTaskTitle(e.target.value)}
                      onBlur={() => handleSaveTaskTitle(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTaskTitle(task.id);
                        if (e.key === 'Escape') setEditingTaskId(null);
                      }}
                      autoFocus
                      className="text-xs sm:text-sm font-medium bg-white border border-[#966746] rounded px-1.5 py-0.5 flex-1"
                    />
                  ) : (
                    <span
                      onClick={() => handleStartEditTask(task.id, task.title)}
                      className={`text-xs sm:text-sm font-medium leading-snug break-words flex-1 cursor-text ${
                        task.completed ? 'line-through text-[#a9998d]' : 'text-[#483a30]'
                      }`}
                      title="Click to edit task title"
                    >
                      {task.title}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Blank Row Quick Entry: Tasks */}
          <div className="mt-3 pt-2.5 border-t border-[#f2e6d2]">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#faf5ed]/70 hover:bg-[#faf5ed] border border-transparent hover:border-[#ded2c0] transition-colors">
              <Plus className="w-3.5 h-3.5 text-[#a9998d]" />
              <input
                type="text"
                placeholder="+ Add task (Press Enter)..."
                value={blankTaskText}
                onChange={(e) => setBlankTaskText(e.target.value)}
                onKeyDown={handleBlankTaskKeyDown}
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#43342a] placeholder-[#a9998d] focus:outline-none py-1"
              />
            </div>
          </div>
        </div>

        {/* COLUMN 2: Ideas (Blank-Row Quick Entry) */}
        <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#f2e6d2]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#fbf0dc] text-[#8c601b] flex items-center justify-center">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#43342a]">
                Ideas & Sparks
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#fbf0dc] text-[#8c601b]">
              {ideas.length}
            </span>
          </div>

          <div className="flex flex-col divide-y divide-[#f7f0e6] max-h-[300px] overflow-y-auto pr-1">
            {ideas.map((idea, idx) => (
              <div
                key={idx}
                className="py-2.5 text-xs sm:text-sm text-[#483a30] leading-relaxed flex items-start gap-2"
              >
                <span className="text-[#e8c078] font-bold mt-0.5">💡</span>
                <span className="flex-1 break-words">{idea}</span>
              </div>
            ))}
          </div>

          {/* Blank Row Quick Entry: Ideas */}
          <div className="mt-3 pt-2.5 border-t border-[#f2e6d2]">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#faf5ed]/70 hover:bg-[#faf5ed] border border-transparent hover:border-[#ded2c0] transition-colors">
              <Plus className="w-3.5 h-3.5 text-[#a9998d]" />
              <input
                type="text"
                placeholder="+ Add idea (Press Enter)..."
                value={blankIdeaText}
                onChange={(e) => setBlankIdeaText(e.target.value)}
                onKeyDown={handleBlankIdeaKeyDown}
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#43342a] placeholder-[#a9998d] focus:outline-none py-1"
              />
            </div>
          </div>
        </div>

        {/* COLUMN 3: Notes & Log (Fixed-Height Scrolling Container + Blank-Row Quick Entry) */}
        <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#f2e6d2]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#faeaec] text-[#8a4b53] flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#43342a]">
                Notes & Brainstorm Log
              </h3>
            </div>
          </div>

          {/* Fixed-Height Scroll Container */}
          <div className="flex flex-col divide-y divide-[#f7f0e6] max-h-[300px] overflow-y-auto pr-1">
            {notes.map((note, idx) => (
              <div
                key={idx}
                className="py-2.5 text-xs sm:text-sm text-[#483a30] leading-relaxed flex items-start gap-2"
              >
                <span className="text-[#8fae92] font-bold mt-0.5">•</span>
                <span className="flex-1 break-words">{note}</span>
              </div>
            ))}
          </div>

          {/* Blank Row Quick Entry: Notes */}
          <div className="mt-3 pt-2.5 border-t border-[#f2e6d2]">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#faf5ed]/70 hover:bg-[#faf5ed] border border-transparent hover:border-[#ded2c0] transition-colors">
              <Plus className="w-3.5 h-3.5 text-[#a9998d]" />
              <input
                type="text"
                placeholder="+ Add note (Press Enter)..."
                value={blankNoteText}
                onChange={(e) => setBlankNoteText(e.target.value)}
                onKeyDown={handleBlankNoteKeyDown}
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#43342a] placeholder-[#a9998d] focus:outline-none py-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
