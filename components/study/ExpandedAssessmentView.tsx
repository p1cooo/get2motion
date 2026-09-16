'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Check,
  Plus,
  FileText,
  ExternalLink,
  Users,
  Paperclip,
  BookOpen,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  DEMO_ASSESSMENTS,
  DEMO_CS_PROPOSAL_TASKS,
  DEMO_CS_PROPOSAL_NOTES,
  DEMO_CS_PROPOSAL_RESOURCES,
  DEMO_TEAM_MEMBERS,
} from '../../lib/demo-data';

interface ExpandedAssessmentViewProps {
  assessmentId: string;
  onBack: () => void;
}

type AssessmentStatus = 'Upcoming' | 'In Progress' | 'Completed';

interface ResourceItem {
  id: string;
  title: string;
  url: string;
  type: 'url' | 'file';
  dateAdded?: string;
}

interface JournalEntry {
  id: string;
  assessmentId: string;
  date: string;
  items: string[];
  authorId: string;
  createdAt: string;
}

const COLLAB_MEMBERS = [
  { id: 'demo-user-pico', name: 'Pico', initial: 'P', color: '#966746', bg: '#f5ece0' },
  { id: 'demo-user-alyssa', name: 'Alyssa', initial: 'A', color: '#8a4b53', bg: '#faeaec' },
  { id: 'demo-user-wayne', name: 'Wayne', initial: 'W', color: '#557859', bg: '#e5efe5' },
  { id: 'demo-user-jacob', name: 'Jacob', initial: 'J', color: '#6b578c', bg: '#ede8f5' },
];

export const ExpandedAssessmentView: React.FC<ExpandedAssessmentViewProps> = ({
  assessmentId,
  onBack,
}) => {
  // Find assessment or fallback to CS Project Proposal
  const initialAssessment =
    DEMO_ASSESSMENTS.find((a) => a.id === assessmentId) || DEMO_ASSESSMENTS[6];

  // Editable Header State
  const [assessmentName, setAssessmentName] = useState(initialAssessment.name);
  const [isEditingName, setIsEditingName] = useState(false);

  const [courseCode, setCourseCode] = useState(initialAssessment.courseCode);
  const [isEditingCourse, setIsEditingCourse] = useState(false);

  const [status, setStatus] = useState<AssessmentStatus>(
    (initialAssessment.status as AssessmentStatus) || 'In Progress'
  );
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [dueDate, setDueDate] = useState(initialAssessment.date || '2027-03-30');
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);

  const [weight, setWeight] = useState(initialAssessment.weight);
  const [isEditingWeight, setIsEditingWeight] = useState(false);

  const [week, setWeek] = useState(initialAssessment.week);
  const [isEditingWeek, setIsEditingWeek] = useState(false);

  // 5-letter Collaboration Code
  const [collabCode, setCollabCode] = useState(
    initialAssessment.collaborationCode && initialAssessment.collaborationCode.length === 5
      ? initialAssessment.collaborationCode
      : 'KJQTX'
  );
  const [copiedCode, setCopiedCode] = useState(false);

  // Tasks with Assignees
  const [tasks, setTasks] = useState(DEMO_CS_PROPOSAL_TASKS);
  const [blankTaskText, setBlankTaskText] = useState('');
  const [activeAssigneePickerTaskId, setActiveAssigneePickerTaskId] = useState<string | null>(null);

  // Resources
  const [resources, setResources] = useState<ResourceItem[]>(
    DEMO_CS_PROPOSAL_RESOURCES.map((r) => ({
      ...r,
      type: 'url' as const,
      dateAdded: 'Sep 10',
    }))
  );
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<'url' | 'file'>('url');
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editingResourceTitle, setEditingResourceTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Journal Notes
  const [notes, setNotes] = useState<JournalEntry[]>(DEMO_CS_PROPOSAL_NOTES);
  const [blankNoteText, setBlankNoteText] = useState('');
  const [activeAuthorId, setActiveAuthorId] = useState('demo-user-pico');

  // Copy Collaboration Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(collabCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Regenerate random 5 uppercase letters
  const handleRegenerateCode = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    setCollabCode(code);
  };

  // Toggle Task Completion
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  // Update Task Assignees
  const handleToggleAssignee = (taskId: string, memberId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const current = t.assignedToUserIds || [];
        let next: string[];
        if (current.includes(memberId)) {
          next = current.filter((id) => id !== memberId);
        } else {
          next = [...current, memberId];
        }
        return { ...t, assignedToUserIds: next };
      })
    );
  };

  const handleSetAllAssignees = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, assignedToUserIds: COLLAB_MEMBERS.map((m) => m.id) }
          : t
      )
    );
  };

  const handleSetNoneAssignees = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignedToUserIds: [] } : t))
    );
  };

  // Blank Row Quick Entry: Tasks
  const handleBlankTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blankTaskText.trim()) return;

      const newTask = {
        id: `task-cs-${Date.now()}`,
        ownerId: 'demo-user-pico',
        title: blankTaskText.trim(),
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        dueDate: null,
        area: 'study' as const,
        priority: 'normal' as const,
        showOnHome: false,
        parentType: 'assessment' as const,
        parentId: initialAssessment.id,
        assignedToUserIds: ['demo-user-pico'],
      };

      setTasks((prev) => [...prev, newTask]);
      setBlankTaskText('');
    }
  };

  // Blank Row Quick Entry: Journal Notes
  const handleBlankNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blankNoteText.trim()) return;

      const todayStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const newEntry: JournalEntry = {
        id: `note-${Date.now()}`,
        assessmentId: initialAssessment.id,
        date: todayStr,
        items: [blankNoteText.trim()],
        authorId: activeAuthorId,
        createdAt: new Date().toISOString(),
      };

      setNotes((prev) => [newEntry, ...prev]);
      setBlankNoteText('');
    }
  };

  // Resources Management
  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceTitle.trim()) return;

    const newRes: ResourceItem = {
      id: `res-${Date.now()}`,
      title: newResourceTitle.trim(),
      url: newResourceUrl.trim() || '#',
      type: newResourceType,
      dateAdded: 'Today',
    };

    setResources((prev) => [...prev, newRes]);
    setNewResourceTitle('');
    setNewResourceUrl('');
    setShowAddResourceModal(false);
  };

  const handleRemoveResource = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveResourceTitle = (id: string) => {
    if (editingResourceTitle.trim()) {
      setResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, title: editingResourceTitle.trim() } : r))
      );
    }
    setEditingResourceId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewResourceTitle(file.name);
    setNewResourceUrl(URL.createObjectURL(file));
    setNewResourceType('file');
  };

  return (
    <div className="w-full max-w-[1420px] mx-auto px-4 sm:px-6 py-4 animate-in fade-in duration-300">
      {/* Top Back Navigation Button */}
      <button
        onClick={onBack}
        id="back-to-study-btn"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#786659] hover:text-[#43342a] mb-5 px-3 py-1.5 rounded-full bg-[#fffefb] border border-[#ede2d2] shadow-2xs hover:bg-[#f6eee3] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Study Hub</span>
      </button>

      {/* =========================================================================
          ASSESSMENT HEADER BANNER (Inline Editable: Name, Course, Status, Due Date, Weight, Week)
      ========================================================================= */}
      <div className="bg-[#fffefb] rounded-3xl border border-[#ede2d2] p-6 sm:p-8 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#f2e6d2]">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#f8edd9] text-[#9b6f1e] flex items-center justify-center font-bold shadow-2xs shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>

            <div>
              {/* Status Selector Dropdown */}
              <div className="relative inline-block mb-1.5">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  id="assessment-status-chip"
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    status === 'Completed'
                      ? 'bg-[#e5efe5] text-[#557859] border-[#c2ddc4]'
                      : status === 'In Progress'
                      ? 'bg-[#f4ebd9] text-[#826435] border-[#ead4b5]'
                      : 'bg-[#f5ede0] text-[#786659] border-[#ded0bf]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === 'Completed'
                        ? 'bg-[#557859]'
                        : status === 'In Progress'
                        ? 'bg-[#826435]'
                        : 'bg-[#786659]'
                    }`}
                  />
                  <span>Status: {status}</span>
                  <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                </button>

                {showStatusDropdown && (
                  <div className="absolute top-8 left-0 z-50 bg-[#fffefb] border border-[#ede2d2] rounded-2xl p-1.5 shadow-xl w-40 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                    {(['Upcoming', 'In Progress', 'Completed'] as AssessmentStatus[]).map((s) => (
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

              {/* Assessment Name Inline Edit */}
              {isEditingName ? (
                <input
                  type="text"
                  value={assessmentName}
                  onChange={(e) => setAssessmentName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingName(false);
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  autoFocus
                  className="text-2xl sm:text-3xl font-extrabold text-[#43342a] bg-white border border-[#966746] rounded-xl px-2 py-0.5 focus:outline-none"
                />
              ) : (
                <h1
                  onClick={() => setIsEditingName(true)}
                  className="text-2xl sm:text-3xl font-extrabold text-[#43342a] tracking-tight hover:text-[#966746] cursor-text transition-colors"
                  title="Click to edit assessment name"
                >
                  {assessmentName}
                </h1>
              )}

              {/* Course Code Inline Edit */}
              {isEditingCourse ? (
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  onBlur={() => setIsEditingCourse(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingCourse(false);
                    if (e.key === 'Escape') setIsEditingCourse(false);
                  }}
                  autoFocus
                  className="text-sm font-semibold text-[#8c7a6e] mt-1 bg-white border border-[#966746] rounded-md px-2 py-0.5 focus:outline-none"
                />
              ) : (
                <p
                  onClick={() => setIsEditingCourse(true)}
                  className="text-sm font-semibold text-[#8c7a6e] mt-1 hover:text-[#43342a] cursor-text"
                  title="Click to edit course code"
                >
                  {courseCode}
                </p>
              )}
            </div>
          </div>

          {/* Automatic 5-Letter Collaboration Code Box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#fbf7f1] p-3.5 rounded-2xl border border-[#ede2d2]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8fae92]" />
              <div className="text-xs font-bold text-[#786659]">Collaboration Code:</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold tracking-widest bg-white px-3 py-1 rounded-xl border border-[#ded2c0] text-[#43342a] shadow-2xs">
                {collabCode}
              </span>
              <button
                onClick={handleCopyCode}
                id="copy-collab-code-btn"
                className="p-1.5 rounded-xl bg-white hover:bg-[#f6eee3] border border-[#ded2c0] text-[#786659] transition-colors cursor-pointer"
                title="Copy code"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-[#557859]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleRegenerateCode}
                id="regen-collab-code-btn"
                className="p-1.5 rounded-xl bg-white hover:bg-[#f6eee3] border border-[#ded2c0] text-[#786659] transition-colors cursor-pointer"
                title="Regenerate 5-letter code"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Metadata Strip: Editable Due Date, Weight, and Week */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#8c7a6e]">
          <div className="flex flex-wrap items-center gap-6">
            {/* Due Date */}
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-[#a9998d]" />
              <span className="text-[#a9998d]">Due:</span>
              {isEditingDueDate ? (
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    setIsEditingDueDate(false);
                  }}
                  onBlur={() => setIsEditingDueDate(false)}
                  autoFocus
                  className="bg-white border border-[#966746] rounded px-1.5 py-0.5 text-xs text-[#43342a]"
                />
              ) : (
                <span
                  onClick={() => setIsEditingDueDate(true)}
                  className="font-bold text-[#43342a] cursor-pointer hover:underline"
                  title="Click to change date"
                >
                  {dueDate}
                </span>
              )}
            </div>

            {/* Weight */}
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-[#a9998d]">Weight:</span>
              {isEditingWeight ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value, 10) || 0)}
                  onBlur={() => setIsEditingWeight(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingWeight(false);
                  }}
                  autoFocus
                  className="w-14 bg-white border border-[#966746] rounded px-1.5 py-0.5 text-xs text-[#43342a]"
                />
              ) : (
                <span
                  onClick={() => setIsEditingWeight(true)}
                  className="font-bold text-[#43342a] cursor-pointer hover:underline"
                  title="Click to edit weight"
                >
                  {weight}%
                </span>
              )}
            </div>

            {/* Academic Week */}
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-[#a9998d]">Week:</span>
              {isEditingWeek ? (
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={week}
                  onChange={(e) => setWeek(parseInt(e.target.value, 10) || 1)}
                  onBlur={() => setIsEditingWeek(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingWeek(false);
                  }}
                  autoFocus
                  className="w-14 bg-white border border-[#966746] rounded px-1.5 py-0.5 text-xs text-[#43342a]"
                />
              ) : (
                <span
                  onClick={() => setIsEditingWeek(true)}
                  className="font-bold text-[#43342a] cursor-pointer hover:underline"
                  title="Click to override week"
                >
                  Week {week}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#9d8a7c]">
            <span>Active Team:</span>
            <div className="flex items-center -space-x-1.5">
              {COLLAB_MEMBERS.map((m) => (
                <span
                  key={m.id}
                  style={{ backgroundColor: m.bg, color: m.color }}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center font-extrabold text-[10px] shadow-2xs"
                  title={m.name}
                >
                  {m.initial}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          LOWER 2-COLUMN SECTION: TASKS + MANAGEABLE RESOURCES & NOTES JOURNAL
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN (lg:col-span-7): Assessment Tasks + Assignee Picker
        ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 sm:p-6 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f2e6d2]">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#43342a] tracking-tight">
                  Tasks & Deliverables
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f4ebe1] text-[#786659]">
                  {tasks.filter((t) => !t.completed).length} open
                </span>
              </div>
              <span className="text-[11px] text-[#a9998d] italic">
                Click chip to assign team members
              </span>
            </div>

            {/* List of Tasks */}
            <div className="flex flex-col divide-y divide-[#f7f0e6]">
              {tasks.map((task) => {
                const assignedIds = task.assignedToUserIds || [];
                const isAll = assignedIds.length === COLLAB_MEMBERS.length;

                return (
                  <div
                    key={task.id}
                    className="py-3 flex items-start justify-between gap-3 group -mx-2 px-2 rounded-xl hover:bg-[#faf5ec] transition-colors relative"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className="mt-0.5 w-5 h-5 rounded-md border-2 border-[#d3c2af] group-hover:border-[#966746] bg-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 text-[#8fae92]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-sm font-medium leading-snug break-words ${
                            task.completed ? 'line-through text-[#a9998d]' : 'text-[#483a30]'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                    </div>

                    {/* Assignee Chip & Popover */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveAssigneePickerTaskId(
                            activeAssigneePickerTaskId === task.id ? null : task.id
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fbf7f1] hover:bg-[#f6eee3] border border-[#ede2d2] text-xs font-semibold text-[#786659] transition-colors cursor-pointer shadow-2xs"
                        title="Click to assign members"
                      >
                        {assignedIds.length === 0 ? (
                          <span className="text-[#a9998d]">Unassigned</span>
                        ) : isAll ? (
                          <span className="text-[#557859] font-bold">All Team</span>
                        ) : (
                          <div className="flex items-center -space-x-1">
                            {assignedIds.map((id) => {
                              const member = COLLAB_MEMBERS.find((m) => m.id === id);
                              if (!member) return null;
                              return (
                                <span
                                  key={id}
                                  style={{ backgroundColor: member.bg, color: member.color }}
                                  className="w-4.5 h-4.5 rounded-full border border-white flex items-center justify-center text-[9px] font-bold"
                                  title={member.name}
                                >
                                  {member.initial}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <ChevronDown className="w-3 h-3 text-[#a9998d]" />
                      </button>

                      {/* Themed Assignee Picker Popover */}
                      {activeAssigneePickerTaskId === task.id && (
                        <div className="absolute right-0 top-8 z-50 bg-[#fffefb] border border-[#ede2d2] rounded-2xl p-2.5 shadow-xl w-48 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-2 py-1 font-bold text-[#8c7a6e] text-[10px] uppercase tracking-wider border-b border-[#f2e7d7]">
                            Assign to
                          </div>
                          {COLLAB_MEMBERS.map((m) => {
                            const isAssigned = assignedIds.includes(m.id);
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleToggleAssignee(task.id, m.id)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors ${
                                  isAssigned ? 'bg-[#f5ece0] font-bold text-[#43342a]' : 'hover:bg-[#fbf7f1] text-[#786659]'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    style={{ backgroundColor: m.bg, color: m.color }}
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                  >
                                    {m.initial}
                                  </span>
                                  <span>{m.name}</span>
                                </div>
                                {isAssigned && <Check className="w-3.5 h-3.5 text-[#966746]" />}
                              </button>
                            );
                          })}

                          <div className="my-1 border-t border-[#f2e7d7]" />

                          <div className="flex items-center justify-between px-1 gap-1">
                            <button
                              type="button"
                              onClick={() => handleSetAllAssignees(task.id)}
                              className="flex-1 py-1 text-center rounded-lg bg-[#fbf7f1] hover:bg-[#f6eee3] text-[#786659] font-bold text-[11px] cursor-pointer"
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetNoneAssignees(task.id)}
                              className="flex-1 py-1 text-center rounded-lg bg-[#fbf7f1] hover:bg-[#f6eee3] text-[#786659] font-bold text-[11px] cursor-pointer"
                            >
                              None
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Blank Row Quick Entry: Tasks */}
            <div className="mt-3 pt-2.5 border-t border-[#f2e6d2]">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#faf5ed]/70 hover:bg-[#faf5ed] border border-transparent hover:border-[#ded2c0] transition-colors">
                <Plus className="w-4 h-4 text-[#a9998d]" />
                <input
                  type="text"
                  placeholder="+ Add new task (Press Enter)..."
                  value={blankTaskText}
                  onChange={(e) => setBlankTaskText(e.target.value)}
                  onKeyDown={handleBlankTaskKeyDown}
                  className="flex-1 bg-transparent text-xs sm:text-sm text-[#43342a] placeholder-[#a9998d] focus:outline-none py-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (lg:col-span-5): Resources + Progress Notes Journal
        ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* 1. Manageable Resources Panel (Max-height + Internal Scrolling) */}
          <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#f2e6d2]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#f8edd9] text-[#9b6f1e] flex items-center justify-center shadow-2xs">
                  <Paperclip className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#43342a]">
                  Resources & Links
                </h3>
              </div>

              <button
                onClick={() => setShowAddResourceModal(true)}
                id="attach-resource-btn"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbf7f1] hover:bg-[#f6eee3] border border-[#ede2d2] text-xs font-bold text-[#786659] hover:text-[#43342a] transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attach</span>
              </button>
            </div>

            {/* Scrollable Resources Container */}
            <div className="flex flex-col divide-y divide-[#f7f0e6] max-h-[220px] overflow-y-auto pr-1">
              {resources.length === 0 ? (
                <div className="text-xs text-[#9d8a7c] py-4 text-center italic">
                  No resources attached yet.
                </div>
              ) : (
                resources.map((res) => (
                  <div
                    key={res.id}
                    className="py-2.5 flex items-center justify-between gap-2 group hover:bg-[#faf5ec] -mx-1.5 px-1.5 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-[#9b6f1e] shrink-0" />
                      {editingResourceId === res.id ? (
                        <input
                          type="text"
                          value={editingResourceTitle}
                          onChange={(e) => setEditingResourceTitle(e.target.value)}
                          onBlur={() => handleSaveResourceTitle(res.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveResourceTitle(res.id);
                            if (e.key === 'Escape') setEditingResourceId(null);
                          }}
                          autoFocus
                          className="text-xs font-semibold bg-white border border-[#966746] rounded px-1.5 py-0.5 flex-1"
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setEditingResourceId(res.id);
                            setEditingResourceTitle(res.title);
                          }}
                          className="text-xs font-semibold text-[#483a30] hover:text-[#966746] truncate cursor-text"
                          title="Click to rename"
                        >
                          {res.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg text-[#8c7a6e] hover:text-[#43342a] hover:bg-[#f6eee3] transition-colors"
                        title="Open resource"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => {
                          setEditingResourceId(res.id);
                          setEditingResourceTitle(res.title);
                        }}
                        className="p-1 rounded-lg text-[#8c7a6e] hover:text-[#43342a] hover:bg-[#f6eee3] transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveResource(res.id)}
                        className="p-1 rounded-lg text-[#8c7a6e] hover:text-[#8a4b53] hover:bg-[#fcecee] transition-colors"
                        title="Delete resource"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Resource Modal / Form */}
            {showAddResourceModal && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#fbf7f1] border border-[#ded2c0] flex flex-col gap-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-[#43342a]">
                  <span>Attach New Resource</span>
                  <button
                    onClick={() => setShowAddResourceModal(false)}
                    className="text-[#a9998d] hover:text-[#43342a]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewResourceType('url')}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold ${
                      newResourceType === 'url'
                        ? 'bg-[#966746] text-white'
                        : 'bg-white text-[#786659] border border-[#ede2d2]'
                    }`}
                  >
                    Web URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewResourceType('file')}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold ${
                      newResourceType === 'file'
                        ? 'bg-[#966746] text-white'
                        : 'bg-white text-[#786659] border border-[#ede2d2]'
                    }`}
                  >
                    File / Document
                  </button>
                </div>

                <form onSubmit={handleAddResource} className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Resource Title (e.g. Slide Deck, Rubric PDF)"
                    value={newResourceTitle}
                    onChange={(e) => setNewResourceTitle(e.target.value)}
                    required
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-white border border-[#ded2c0] text-[#43342a]"
                  />

                  {newResourceType === 'url' ? (
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={newResourceUrl}
                      onChange={(e) => setNewResourceUrl(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-white border border-[#ded2c0] text-[#43342a]"
                    />
                  ) : (
                    <div>
                      <label
                        className="w-full py-2 px-3 rounded-lg bg-white hover:bg-[#faf5ed] border border-[#ded2c0] text-xs font-semibold text-[#786659] text-center cursor-pointer block"
                      >
                        <span>Choose File (PDF, DOCX, ZIP, Images)</span>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddResourceModal(false)}
                      className="px-2.5 py-1 text-xs text-[#8c7a6e]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-bold bg-[#966746] text-white rounded-lg"
                    >
                      Attach
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* 2. Progress Notes & Journal (Author Attribution + Fixed/Max-Height Internal Scrolling) */}
          <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#f2e6d2]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#faeaec] text-[#8a4b53] flex items-center justify-center shadow-2xs">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#43342a]">
                  Notes & Progress Journal
                </h3>
              </div>

              {/* Author selector for new notes */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#9d8a7c] font-bold">Posting as:</span>
                <select
                  value={activeAuthorId}
                  onChange={(e) => setActiveAuthorId(e.target.value)}
                  className="text-xs bg-[#fbf7f1] border border-[#ded2c0] rounded-lg px-2 py-0.5 text-[#43342a] font-semibold cursor-pointer"
                >
                  {COLLAB_MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fixed/Max-Height Scroll Container */}
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {notes.map((entry) => {
                const author =
                  COLLAB_MEMBERS.find((m) => m.id === entry.authorId) || COLLAB_MEMBERS[0];

                return (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-[#fcf9f4] border border-[#ede2d2] flex flex-col gap-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#f2e6d2] pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ backgroundColor: author.bg, color: author.color }}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-2xs"
                        >
                          {author.initial}
                        </span>
                        <span className="font-bold text-[#43342a]">{author.name}</span>
                      </div>
                      <span className="text-[11px] text-[#a9998d] font-medium">{entry.date}</span>
                    </div>

                    <ul className="list-disc list-inside text-[#544133] leading-relaxed space-y-1">
                      {entry.items.map((item, idx) => (
                        <li key={idx} className="break-words">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Blank Row Quick Entry: Journal Notes */}
            <div className="mt-3 pt-2.5 border-t border-[#f2e6d2]">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#faf5ed]/70 hover:bg-[#faf5ed] border border-transparent hover:border-[#ded2c0] transition-colors">
                <Plus className="w-4 h-4 text-[#a9998d]" />
                <input
                  type="text"
                  placeholder="+ Add journal note (Press Enter)..."
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
    </div>
  );
};
