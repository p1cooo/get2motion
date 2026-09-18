'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
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
import { db, getAppStorage } from '../../lib/firebase';
import { createTask } from '../../lib/task-store';
import { useAuth } from '../../lib/auth-context';
import { Assessment, AssessmentResource, Task } from '../../lib/types';

interface ExpandedAssessmentViewProps {
  assessmentId: string;
  assessment?: Assessment;
  onBack: () => void;
}

type AssessmentStatus = 'Upcoming' | 'In Progress' | 'Completed';

interface ResourceItem extends Omit<AssessmentResource, 'type'> {
  type: 'url' | 'file' | 'link' | 'document';
  dateAdded?: string;
}

interface JournalEntry {
  id: string;
  assessmentId: string;
  date: string;
  items: string[];
  authorId: string;
  authorName?: string;
  createdAt: string;
}

export const ExpandedAssessmentView: React.FC<ExpandedAssessmentViewProps> = ({
  assessmentId,
  assessment: selectedAssessment,
  onBack,
}) => {
  const { user, profile } = useAuth();
  const initializedCodeFor = useRef<string | null>(null);
  const initialAssessment = selectedAssessment ?? {
    id: assessmentId,
    ownerId: user?.uid || 'guest',
    name: 'New assessment',
    courseCode: '',
    type: 'test' as const,
    week: 1,
    date: '',
    weight: 0,
    status: 'Upcoming' as const,
    pinned: false,
    collaborationEnabled: false,
    collaborationCode: null,
    memberIds: [],
    createdAt: new Date().toISOString(),
  };

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blankTaskText, setBlankTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [activeAssigneePickerTaskId, setActiveAssigneePickerTaskId] = useState<string | null>(null);

  // Resources
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<'url' | 'file'>('url');
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editingResourceTitle, setEditingResourceTitle] = useState('');
  const [selectedResourceFile, setSelectedResourceFile] = useState<File | null>(null);

  // Journal Notes
  const [notes, setNotes] = useState<JournalEntry[]>([]);
  const [blankNoteText, setBlankNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [activeAuthorId, setActiveAuthorId] = useState('demo-user-pico');
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const members = user
    ? Array.from(new Set([user.uid, ...memberIds])).map((id, index) => {
        const isCurrentUser = id === user.uid;
        const name = isCurrentUser
          ? profile?.displayName || user.displayName || user.email || 'You'
          : `Member ${id.slice(0, 6)}`;
        const colors = [
          { color: '#966746', bg: '#f5ece0' },
          { color: '#8a4b53', bg: '#faeaec' },
          { color: '#557859', bg: '#e5efe5' },
          { color: '#6b578c', bg: '#ede8f5' },
        ];
        return { id, name, initial: name.charAt(0).toUpperCase(), ...colors[index % colors.length] };
      })
    : [];

  const persistNewCode = async (previousCode?: string | null) => {
    if (!user) return;
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = Array.from({ length: 5 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
      try {
        await runTransaction(db, async (transaction) => {
          const codeRef = doc(db, 'collaborationCodes', code);
          if ((await transaction.get(codeRef)).exists()) throw new Error('Code already exists');
          transaction.set(codeRef, { code, assessmentId, ownerId: user.uid, enabled: true });
          transaction.update(doc(db, 'assessments', assessmentId), {
            collaborationCode: code,
            collaborationEnabled: true,
          });
          if (previousCode && previousCode !== code) transaction.delete(doc(db, 'collaborationCodes', previousCode));
        });
        setCollabCode(code);
        return;
      } catch (error) {
        if (attempt === 9) console.error('Unable to generate collaboration code', error);
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    const unsubscribers = [
      onSnapshot(doc(db, 'assessments', assessmentId), (snapshot) => {
        if (!snapshot.exists()) return;
        const assessment = snapshot.data() as Assessment;
        setAssessmentName(assessment.name);
        setCourseCode(assessment.courseCode);
        setStatus((assessment.status === 'In progress' ? 'In Progress' : assessment.status) as AssessmentStatus);
        setDueDate(assessment.date);
        setWeight(assessment.weight);
        setWeek(assessment.week);
        setMemberIds(assessment.memberIds || []);
        if (assessment.collaborationCode?.match(/^[A-Z]{5}$/)) setCollabCode(assessment.collaborationCode);
        else if (assessment.ownerId === user.uid && initializedCodeFor.current !== assessmentId) {
          initializedCodeFor.current = assessmentId;
          void persistNewCode(assessment.collaborationCode);
        }
      }),
      onSnapshot(query(collection(db, 'tasks'), where('parentId', '==', assessmentId)), (snapshot) => {
        setTasks(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Task));
      }),
      onSnapshot(query(collection(db, 'assessmentResources'), where('assessmentId', '==', assessmentId)), (snapshot) => {
        setResources(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as ResourceItem));
      }),
      onSnapshot(query(collection(db, 'assessmentNotes'), where('assessmentId', '==', assessmentId)), (snapshot) => {
        setNotes(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as JournalEntry).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      }),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [assessmentId, user]);

  const saveAssessment = (changes: Partial<Assessment>) => {
    if (user) void updateDoc(doc(db, 'assessments', assessmentId), changes);
  };

  // Copy Collaboration Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(collabCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Regenerate random 5 uppercase letters
  const handleRegenerateCode = () => {
    if (!user) {
      const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      setCollabCode(Array.from({ length: 5 }, () => letters[Math.floor(Math.random() * letters.length)]).join(''));
      return;
    }
    void persistNewCode(collabCode);
  };

  // Toggle Task Completion
  const handleToggleTask = (taskId: string) => {
    if (!user) setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
    const task = tasks.find((item) => item.id === taskId);
    if (user && task) void updateDoc(doc(db, 'tasks', taskId), {
      completed: !task.completed,
      completedAt: task.completed ? null : new Date().toISOString(),
    });
  };

  const saveTaskTitle = (taskId: string) => {
    const title = editingTaskTitle.trim();
    if (!title) {
      if (!user) setTasks((current) => current.filter((task) => task.id !== taskId));
      if (user) void deleteDoc(doc(db, 'tasks', taskId));
    } else {
      if (!user) setTasks((current) => current.map((task) => task.id === taskId ? { ...task, title } : task));
      if (user) void updateDoc(doc(db, 'tasks', taskId), { title });
    }
    setEditingTaskId(null);
  };

  // Update Task Assignees
  const handleToggleAssignee = (taskId: string, memberId: string) => {
    if (!user) setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const current = t.assignedToUserIds || [];
        let next: string[];
        if (current.includes(memberId)) {
          next = current.filter((id) => id !== memberId);
        } else {
          next = [...current, memberId];
        }
        if (user) void updateDoc(doc(db, 'tasks', taskId), { assignedToUserIds: next });
        return { ...t, assignedToUserIds: next };
      })
    );
  };

  const handleSetAllAssignees = (taskId: string) => {
    if (!user) setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, assignedToUserIds: members.map((m) => m.id) }
          : t
      )
    );
    if (user) void updateDoc(doc(db, 'tasks', taskId), { assignedToUserIds: members.map((m) => m.id) });
  };

  const handleSetNoneAssignees = (taskId: string) => {
    if (!user) setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignedToUserIds: [] } : t))
    );
    if (user) void updateDoc(doc(db, 'tasks', taskId), { assignedToUserIds: [] });
  };

  // Blank Row Quick Entry: Tasks
  const handleBlankTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blankTaskText.trim()) return;

      const newTask: Omit<Task, 'id'> = {
        ownerId: user?.uid || 'demo-user-pico',
        title: blankTaskText.trim(),
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        dueDate: null,
        area: 'study' as const,
        priority: 'normal' as const,
        showOnHome: false,
        parentType: 'assessment' as const,
        parentId: assessmentId,
        assignedToUserIds: [user?.uid || 'demo-user-pico'],
      };

      if (user) void createTask(newTask);
      else setTasks((prev) => [...prev, { ...newTask, id: `task-cs-${Date.now()}` }]);
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
        assessmentId,
        date: todayStr,
        items: [blankNoteText.trim()],
        authorId: user?.uid || activeAuthorId,
        authorName: profile?.displayName || user?.displayName || undefined,
        createdAt: new Date().toISOString(),
      };

      if (user) void addDoc(collection(db, 'assessmentNotes'), newEntry);
      else setNotes((prev) => [...prev, newEntry]);
      setBlankNoteText('');
    }
  };

  const saveJournalEntry = (noteId: string) => {
    const content = editingNoteText.trim();
    if (!content) return;
    if (!user) setNotes((current) => current.map((note) => note.id === noteId ? { ...note, items: [content] } : note));
    if (user) void updateDoc(doc(db, 'assessmentNotes', noteId), { items: [content] });
    setEditingNoteId(null);
  };

  // Resources Management
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceTitle.trim()) return;

    let url = newResourceUrl.trim() || '#';
    let storagePath: string | undefined;
    if (user && newResourceType === 'file' && selectedResourceFile) {
      storagePath = `assessments/${assessmentId}/resources/${Date.now()}-${selectedResourceFile.name}`;
      const fileRef = ref(getAppStorage(), storagePath);
      await uploadBytes(fileRef, selectedResourceFile);
      url = await getDownloadURL(fileRef);
    }
    const newRes: Omit<ResourceItem, 'id'> = {
      title: newResourceTitle.trim(),
      url,
      type: newResourceType,
      dateAdded: 'Today',
      assessmentId,
      storagePath,
      createdAt: new Date().toISOString(),
    };

    if (user) await addDoc(collection(db, 'assessmentResources'), newRes);
    else setResources((prev) => [...prev, { ...newRes, id: `res-${Date.now()}` }]);
    setNewResourceTitle('');
    setNewResourceUrl('');
    setSelectedResourceFile(null);
    setShowAddResourceModal(false);
  };

  const handleRemoveResource = async (id: string) => {
    const resource = resources.find((item) => item.id === id);
    if (user) {
      if (resource?.storagePath) await deleteObject(ref(getAppStorage(), resource.storagePath));
      await deleteDoc(doc(db, 'assessmentResources', id));
    } else setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveResourceTitle = (id: string) => {
    if (editingResourceTitle.trim()) {
      setResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, title: editingResourceTitle.trim() } : r))
      );
      if (user) void updateDoc(doc(db, 'assessmentResources', id), { title: editingResourceTitle.trim() });
    }
    setEditingResourceId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewResourceTitle(file.name);
    setSelectedResourceFile(file);
    setNewResourceUrl(user ? '' : URL.createObjectURL(file));
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
                          saveAssessment({ status: s === 'In Progress' ? 'In progress' : s });
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
                  onBlur={() => { setIsEditingName(false); saveAssessment({ name: assessmentName.trim() || initialAssessment.name }); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setIsEditingName(false); saveAssessment({ name: assessmentName.trim() || initialAssessment.name }); }
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
                  onBlur={() => { setIsEditingCourse(false); saveAssessment({ courseCode: courseCode.trim() || initialAssessment.courseCode }); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setIsEditingCourse(false); saveAssessment({ courseCode: courseCode.trim() || initialAssessment.courseCode }); }
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
                    saveAssessment({ date: e.target.value });
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
                  onBlur={() => { setIsEditingWeight(false); saveAssessment({ weight }); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setIsEditingWeight(false); saveAssessment({ weight }); }
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
                  onBlur={() => { setIsEditingWeek(false); saveAssessment({ week }); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setIsEditingWeek(false); saveAssessment({ week }); }
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
              {members.map((m) => (
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
                const isAll = assignedIds.length === members.length;

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
                        {editingTaskId === task.id ? <input
                          autoFocus
                          value={editingTaskTitle}
                          onChange={(event) => setEditingTaskTitle(event.target.value)}
                          onBlur={() => saveTaskTitle(task.id)}
                          onKeyDown={(event) => { if (event.key === 'Enter') saveTaskTitle(task.id); if (event.key === 'Escape') setEditingTaskId(null); }}
                          className="w-full rounded-md border border-[#966746] bg-white px-2 py-0.5 text-sm focus:outline-none"
                        /> : <span
                          onClick={() => { setEditingTaskId(task.id); setEditingTaskTitle(task.title); }}
                          title="Click to edit task"
                          className={`cursor-text text-sm font-medium leading-snug break-words ${
                            task.completed ? 'line-through text-[#a9998d]' : 'text-[#483a30]'
                          }`}
                        >
                          {task.title}
                        </span>}
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
                              const member = members.find((m) => m.id === id);
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
                          {members.map((m) => {
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
                  {(user ? members.filter((m) => m.id === user.uid) : members).map((m) => (
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
                const author = members.find((m) => m.id === entry.authorId) || {
                  id: entry.authorId,
                  name: entry.authorName || 'Collaborator',
                  initial: (entry.authorName || 'C').charAt(0).toUpperCase(),
                  color: '#786659',
                  bg: '#f5ece0',
                };

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

                    {editingNoteId === entry.id ? (
                      <input
                        autoFocus
                        value={editingNoteText}
                        onChange={(event) => setEditingNoteText(event.target.value)}
                        onBlur={() => saveJournalEntry(entry.id)}
                        onKeyDown={(event) => { if (event.key === 'Enter') saveJournalEntry(entry.id); if (event.key === 'Escape') setEditingNoteId(null); }}
                        className="w-full rounded-md border border-[#966746] bg-white px-2 py-1 text-sm text-[#544133] focus:outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditingNoteId(entry.id); setEditingNoteText(entry.items.join(' ')); }}
                        className="w-full text-left text-[#544133] leading-relaxed hover:text-[#966746]"
                        title="Click to edit journal entry"
                      >
                        {entry.items.join(' ')}
                      </button>
                    )}
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
