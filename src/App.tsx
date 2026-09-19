import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { ThemeProvider, useTheme } from '../lib/theme-context';
import { CozyBanner } from '../components/CozyBanner';
import { TopNav, ActiveTab } from '../components/TopNav';
import { HomeView } from '../components/home/HomeView';
import { StudyView } from '../components/study/StudyView';
import { ExpandedAssessmentView } from '../components/study/ExpandedAssessmentView';
import { WorkCalendarView } from '../components/work/WorkCalendarView';
import { ClassDetailView } from '../components/work/ClassDetailView';
import { ProjectsView } from '../components/projects/ProjectsView';
import { ExpandedProjectView } from '../components/projects/ExpandedProjectView';
import { JoinCollaborationModal } from '../components/modals/JoinCollaborationModal';
import { SettingsModal } from '../components/modals/SettingsModal';
import { AuthModal } from '../components/auth/AuthModal';
import { CozyMediaProvider } from '../components/home/cozy-media-context';
import { Assessment, Project } from '../lib/types';

type LocationState = { tab: ActiveTab; assessmentId: string | null; workItemId: string | null; workDate: string | null; projectId: string | null };

function readLocation(): LocationState {
  const path = window.location.pathname.split('/').filter(Boolean);
  const id = path[2] ? decodeURIComponent(path[2]) : null;
  if (path[0] === 'study') return { tab: 'study', assessmentId: path[1] === 'assessment' ? id : null, workItemId: null, workDate: null, projectId: null };
  if (path[0] === 'work') return { tab: 'work', assessmentId: null, workItemId: path[1] === 'item' ? id : null, workDate: new URLSearchParams(window.location.search).get('date'), projectId: null };
  if (path[0] === 'projects') return { tab: 'projects', assessmentId: null, workItemId: null, workDate: null, projectId: path[1] === 'project' ? id : null };
  return { tab: 'home', assessmentId: null, workItemId: null, workDate: null, projectId: null };
}

function DashboardContent() {
  const { user, loading, signingOut, signupSuccess, dismissSignupSuccess } = useAuth();
  const { themeConfig } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => readLocation().tab);

  // Sub-view routing
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(() => readLocation().assessmentId);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(() => readLocation().workItemId);
  const [selectedWorkDateStr, setSelectedWorkDateStr] = useState<string | null>(() => readLocation().workDate);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => readLocation().projectId);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Modals
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const applyLocation = () => {
    const route = readLocation();
    setActiveTab(route.tab);
    setSelectedAssessmentId(route.assessmentId);
    setSelectedAssessment(null);
    setSelectedWorkItemId(route.workItemId);
    setSelectedWorkDateStr(route.workDate);
    setSelectedProjectId(route.projectId);
    setSelectedProject(null);
  };

  useEffect(() => {
    window.addEventListener('popstate', applyLocation);
    return () => window.removeEventListener('popstate', applyLocation);
  }, []);

  const navigate = (url: string) => {
    window.history.pushState({}, '', url);
    applyLocation();
  };

  // Tab switcher with sub-view resets
  const handleTabChange = (tab: ActiveTab) => {
    navigate(tab === 'home' ? '/' : `/${tab}`);
  };

  if (loading) return <div className="min-h-screen bg-[#faf6ef] flex items-center justify-center text-sm font-semibold text-[#786659]">Opening Motion…</div>;

  if (!user || signingOut) {
    return <AuthModal isOpen onClose={() => {}} />;
  }

  return (
    <CozyMediaProvider isHome={activeTab === 'home'}>
    <div className={`min-h-screen ${themeConfig.pageBg} ${themeConfig.textColor} flex flex-col transition-colors duration-300 selection:bg-[#f2dfce] selection:text-[#544133]`}>
      {/* 1. Cozy Landscape Banner with dynamically calculated Academic Week */}
      <CozyBanner onOpenSettings={() => setShowSettingsModal(true)} />

      {/* 2. Top Navigation Bar */}
      <TopNav
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {signupSuccess && (
        <div className="fixed top-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#cbe0cc] bg-[#edf4ee] px-4 py-2 text-sm font-semibold text-[#557859] shadow-lg">
          Account created successfully.
          <button onClick={dismissSignupSuccess} className="ml-3 text-[#557859]/70 hover:text-[#557859]" aria-label="Dismiss confirmation">×</button>
        </div>
      )}

      {/* 3. Main Views Container */}
      <div className="flex-1 pb-16">
        {activeTab === 'home' && (
          <HomeView
            onNavigateToStudy={() => handleTabChange('study')}
            onNavigateToWork={() => handleTabChange('work')}
            onNavigateToProjects={() => handleTabChange('projects')}
          />
        )}

        {activeTab === 'study' &&
          (selectedAssessmentId ? (
            <ExpandedAssessmentView
              assessmentId={selectedAssessmentId}
              assessment={selectedAssessment || undefined}
              onBack={() => {
                navigate('/study');
              }}
            />
          ) : (
            <StudyView
              onSelectAssessment={(id, assessment) => {
                window.history.pushState({}, '', `/study/assessment/${encodeURIComponent(id)}`);
                setSelectedAssessmentId(id);
                setSelectedAssessment(assessment || null);
              }}
              onOpenJoinCollab={() => setShowCollabModal(true)}
            />
          ))}

        {activeTab === 'work' &&
          (selectedWorkItemId && selectedWorkDateStr ? (
            <ClassDetailView
              workItemId={selectedWorkItemId}
              dateStr={selectedWorkDateStr}
              onBack={() => {
                navigate('/work');
              }}
            />
          ) : (
            <WorkCalendarView
              onSelectOccurrence={(workItemId, dateStr) => {
                window.history.pushState({}, '', `/work/item/${encodeURIComponent(workItemId)}?date=${encodeURIComponent(dateStr)}`);
                setSelectedWorkItemId(workItemId);
                setSelectedWorkDateStr(dateStr);
              }}
            />
          ))}

        {activeTab === 'projects' &&
          (selectedProjectId ? (
            <ExpandedProjectView
              projectId={selectedProjectId}
              project={selectedProject || undefined}
              onBack={() => {
                navigate('/projects');
              }}
            />
          ) : (
            <ProjectsView onSelectProject={(id, project) => {
              window.history.pushState({}, '', `/projects/project/${encodeURIComponent(id)}`);
              setSelectedProjectId(id);
              setSelectedProject(project || null);
            }} />
          ))}
      </div>

      {/* Footer */}
      <footer className="py-4 border-t border-[#ede3d4] bg-[#faf6ef] text-center text-xs text-[#9d8a7c]">
        <div className="max-w-[1420px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/assets/branding/motion-logo.png" alt="Motion — Skip motivation. Get to Motion." className="h-12 w-auto object-contain" />
            <span className="text-[#c4b5a5]">•</span>
            <span>Skip motivation. Get to Motion.</span>
          </div>

          <span className="text-[11px] text-[#b3a496]">
            {user.displayName || user.email}
          </span>
        </div>
      </footer>

      {/* Global Modals */}
      <JoinCollaborationModal
        isOpen={showCollabModal}
        onClose={() => setShowCollabModal(false)}
        onJoined={(assessmentId) => {
          setActiveTab('study');
          setSelectedAssessmentId(assessmentId);
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
    </CozyMediaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DashboardContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
