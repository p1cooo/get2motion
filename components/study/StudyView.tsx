'use client';

import React, { useEffect, useState } from 'react';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  GraduationCap,
  Calendar,
  FileText,
  Plus,
  Users,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Assessment } from '../../lib/types';
import { DEMO_ASSESSMENTS } from '../../lib/demo-data';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth-context';
import { AllTestsView } from './AllTestsView';
import { AllAssignmentsView } from './AllAssignmentsView';

interface StudyViewProps {
  onSelectAssessment: (assessmentId: string) => void;
  onOpenJoinModal?: () => void;
  onOpenJoinCollab?: () => void;
}

export const StudyView: React.FC<StudyViewProps> = ({
  onSelectAssessment,
  onOpenJoinModal,
  onOpenJoinCollab,
}) => {
  const handleOpenJoin = onOpenJoinCollab || onOpenJoinModal || (() => {});
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>(DEMO_ASSESSMENTS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newType, setNewType] = useState<Assessment['type']>('assignment');
  const [newName, setNewName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newWeight, setNewWeight] = useState('');

  useEffect(() => {
    if (!user) {
      setAssessments(DEMO_ASSESSMENTS);
      return;
    }
    return onSnapshot(
      query(collection(db, 'assessments'), where('ownerId', '==', user.uid)),
      (snapshot) => setAssessments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Assessment))
    );
  }, [user]);

  // Subpage routing within Study Hub
  const [subView, setSubView] = useState<'overview' | 'all-tests' | 'all-assignments'>(() => {
    if (window.location.pathname === '/study/tests') return 'all-tests';
    if (window.location.pathname === '/study/assignments') return 'all-assignments';
    return 'overview';
  });

  const openList = (view: 'all-tests' | 'all-assignments') => {
    window.history.pushState({}, '', view === 'all-tests' ? '/study/tests' : '/study/assignments');
    setSubView(view);
  };

  const returnToOverview = () => {
    window.history.pushState({}, '', '/study');
    setSubView('overview');
  };

  const openAdd = (type: Assessment['type'] = 'assignment') => {
    setNewType(type);
    setIsAddOpen(true);
  };

  const createAssessment = async (event: React.FormEvent) => {
    event.preventDefault();
    const date = newDate || new Date().toISOString().slice(0, 10);
    const draft = {
      name: newName.trim(),
      courseCode: newCourseCode.trim().toUpperCase(),
      type: newType,
      date,
      week: 1,
      weight: Number(newWeight) || 0,
      status: 'Upcoming' as const,
      pinned: false,
      collaborationEnabled: false,
      collaborationCode: null,
      memberIds: [],
      createdAt: new Date().toISOString(),
    };
    if (!draft.name || !draft.courseCode) return;

    if (user) {
      const reference = await addDoc(collection(db, 'assessments'), { ...draft, ownerId: user.uid });
      setIsAddOpen(false);
      onSelectAssessment(reference.id);
      return;
    }

    const id = `guest-assessment-${Date.now()}`;
    setAssessments((current) => [{ ...draft, id, ownerId: 'guest' }, ...current]);
    setIsAddOpen(false);
  };

  // Tests & Assignments arrays
  const allTests = assessments.filter((a) => a.type === 'test');
  const allAssignments = assessments.filter((a) => a.type === 'assignment');

  // Main page shows ONLY next 3 items per section
  const byDate = (a: Assessment, b: Assessment) => a.date.localeCompare(b.date);
  const visibleTests = [...allTests].sort(byDate).slice(0, 3);
  const visibleAssignments = [...allAssignments].sort(byDate).slice(0, 3);

  // Subviews
  if (subView === 'all-tests') {
    return (
      <AllTestsView
        onBack={returnToOverview}
        onSelectAssessment={onSelectAssessment}
        assessments={assessments}
        onAddNewTest={() => {
          returnToOverview();
          openAdd('test');
        }}
      />
    );
  }

  if (subView === 'all-assignments') {
    return (
      <AllAssignmentsView
        onBack={returnToOverview}
        onSelectAssessment={onSelectAssessment}
        assessments={assessments}
        onAddNewAssignment={() => {
          returnToOverview();
          openAdd('assignment');
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-[1420px] mx-auto px-4 sm:px-6 py-4 animate-in fade-in duration-300">
      {/* Top Header Row with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#43342a] tracking-tight">
            Study Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#8c7a6e]">
            Track upcoming examinations, assignments, and collaborative projects.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleOpenJoin}
            id="study-join-collab-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#fffefb] hover:bg-[#f6eee3] text-[#786659] hover:text-[#43342a] text-xs sm:text-sm font-semibold border border-[#ede2d2] transition-all cursor-pointer shadow-xs"
          >
            <Users className="w-4 h-4 text-[#8fae92]" />
            <span>Join with Code</span>
          </button>

          <button
            onClick={() => openAdd()}
            id="study-add-assessment-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#966746] hover:bg-[#7e5335] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Assessment</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: UPCOMING TESTS (Only 3 cards shown, badge displays TOTAL count)
      ========================================================================= */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#df989f]" />
            <h2 className="text-base sm:text-lg font-bold text-[#43342a] tracking-tight">
              Upcoming Tests
            </h2>
            {/* Total upcoming count badge */}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#fcecee] text-[#8a4b53]">
              {allTests.length} tests
            </span>
          </div>

          <button
            onClick={() => openList('all-tests')}
            id="view-more-tests-btn"
            className="text-xs font-semibold text-[#966746] hover:text-[#7e5335] px-3 py-1 rounded-full bg-[#fbf7f1] hover:bg-[#f6eee3] border border-[#ede2d2] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>View More ({allTests.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleTests.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectAssessment(item.id)}
              className="group bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs hover:shadow-md hover:border-[#dfd0be] transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#faeaec] text-[#8a4b53] flex items-center justify-center font-bold text-sm shadow-2xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#faeaec] text-[#8a4b53] border border-[#f5d7db]">
                    Week {item.week} • {item.weight}%
                  </span>
                </div>

                <div className="text-xs font-bold text-[#8a4b53] tracking-wider uppercase mb-1">
                  {item.courseCode}
                </div>
                <h3 className="text-base font-bold text-[#43342a] group-hover:text-[#966746] transition-colors leading-snug">
                  {item.name}
                </h3>
              </div>

              <div className="mt-5 pt-3 border-t border-[#f5ebde] flex items-center justify-between text-xs text-[#8c7a6e]">
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#a9998d]" />
                  <span>{item.date}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                    item.status.toLowerCase() === 'completed'
                      ? 'bg-[#e5efe5] text-[#557859]'
                      : item.status.toLowerCase() === 'in progress'
                      ? 'bg-[#f4ebd9] text-[#826435]'
                      : 'bg-[#f5ede0] text-[#786659]'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: UPCOMING ASSIGNMENTS (Only 3 cards shown, badge displays TOTAL count)
      ========================================================================= */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#e8c078]" />
            <h2 className="text-base sm:text-lg font-bold text-[#43342a] tracking-tight">
              Upcoming Assignments
            </h2>
            {/* Total upcoming count badge */}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#fbf0dc] text-[#8c601b]">
              {allAssignments.length} assignments
            </span>
          </div>

          <button
            onClick={() => openList('all-assignments')}
            id="view-more-assignments-btn"
            className="text-xs font-semibold text-[#966746] hover:text-[#7e5335] px-3 py-1 rounded-full bg-[#fbf7f1] hover:bg-[#f6eee3] border border-[#ede2d2] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>View More ({allAssignments.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleAssignments.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectAssessment(item.id)}
              className="group bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs hover:shadow-md hover:border-[#dfd0be] transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f8edd9] text-[#9b6f1e] flex items-center justify-center font-bold text-sm shadow-2xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.collaborationEnabled && (
                      <span className="p-1 rounded-full bg-[#f4ebe1] text-[#786659]" title="Collaboration Enabled">
                        <Users className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#f8edd9] text-[#9b6f1e] border border-[#ebd8b7]">
                      Week {item.week} • {item.weight}%
                    </span>
                  </div>
                </div>

                <div className="text-xs font-bold text-[#9b6f1e] tracking-wider uppercase mb-1">
                  {item.courseCode}
                </div>
                <h3 className="text-base font-bold text-[#43342a] group-hover:text-[#966746] transition-colors leading-snug">
                  {item.name}
                </h3>
              </div>

              <div className="mt-5 pt-3 border-t border-[#f5ebde] flex items-center justify-between text-xs text-[#8c7a6e]">
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#a9998d]" />
                  <span>{item.date}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                    item.status.toLowerCase() === 'completed'
                      ? 'bg-[#e5efe5] text-[#557859]'
                      : item.status.toLowerCase() === 'in progress'
                      ? 'bg-[#f4ebd9] text-[#826435]'
                      : 'bg-[#f5ede0] text-[#786659]'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: COURSE OVERVIEW CARDS
      ========================================================================= */}
      <div className="mt-10 pt-6 border-t border-[#ede2d2]">
        <h2 className="text-base sm:text-lg font-bold text-[#43342a] tracking-tight mb-4">
          Current Enrolled Courses
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { code: 'CSDA2101', name: 'Data Analytics & Visualization', color: '#f8edd9', textColor: '#9b6f1e' },
            { code: 'CSC1215', name: 'Web Computing Fundamentals', color: '#faeaec', textColor: '#8a4b53' },
            { code: 'CSDB2104', name: 'Database Design & Management', color: '#e5efe5', textColor: '#557859' },
            { code: 'MATH1102', name: 'Discrete Mathematics', color: '#ede8f5', textColor: '#6b578c' },
          ].map((course) => (
            <div
              key={course.code}
              className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-4 shadow-xs hover:border-[#dfd0be] transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: course.textColor }}
                />
                <span className="text-xs font-bold tracking-wider" style={{ color: course.textColor }}>
                  {course.code}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#43342a] leading-tight">
                {course.name}
              </h4>
            </div>
          ))}
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs">
          <form onSubmit={createAssessment} className="w-full max-w-md rounded-2xl border border-[#ede3d4] bg-[#fffdf9] p-6 shadow-2xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#43342a]">Add Assessment</h2>
              <p className="mt-1 text-xs text-[#8c7a6e]">Create a new test or assignment.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['test', 'assignment'] as const).map((type) => (
                <button key={type} type="button" onClick={() => setNewType(type)} className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize ${newType === type ? 'border-[#966746] bg-[#966746] text-white' : 'border-[#ede3d4] bg-[#faf7f2] text-[#786659]'}`}>
                  {type}
                </button>
              ))}
            </div>
            <input required autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Assessment name" className="w-full rounded-xl border border-[#ede3d4] bg-[#faf7f2] px-3 py-2 text-sm text-[#43342a] focus:outline-none focus:ring-1 focus:ring-[#966746]" />
            <input required value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} placeholder="Course code" className="w-full rounded-xl border border-[#ede3d4] bg-[#faf7f2] px-3 py-2 text-sm text-[#43342a] focus:outline-none focus:ring-1 focus:ring-[#966746]" />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full rounded-xl border border-[#ede3d4] bg-[#faf7f2] px-3 py-2 text-sm text-[#43342a] focus:outline-none focus:ring-1 focus:ring-[#966746]" />
              <input type="number" min="0" max="100" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="Weight %" className="w-full rounded-xl border border-[#ede3d4] bg-[#faf7f2] px-3 py-2 text-sm text-[#43342a] focus:outline-none focus:ring-1 focus:ring-[#966746]" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsAddOpen(false)} className="rounded-xl px-4 py-2 text-xs font-semibold text-[#786659] hover:bg-[#f6eee3]">Cancel</button>
              <button type="submit" className="rounded-xl bg-[#966746] px-4 py-2 text-xs font-bold text-white hover:bg-[#7e5335]">Create Assessment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
