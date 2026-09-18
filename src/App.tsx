import React, { useState } from 'react';
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

function getInitialTab(): ActiveTab {
  if (window.location.pathname.startsWith('/study')) return 'study';
  if (window.location.pathname.startsWith('/work')) return 'work';
  if (window.location.pathname.startsWith('/projects')) return 'projects';
  return 'home';
}

function DashboardContent() {
  const { user, loading, signupSuccess, dismissSignupSuccess } = useAuth();
  const { themeConfig } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);

  // Sub-view routing
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);
  const [selectedWorkDateStr, setSelectedWorkDateStr] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Modals
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Tab switcher with sub-view resets
  const handleTabChange = (tab: ActiveTab) => {
    window.history.pushState({}, '', tab === 'home' ? '/' : `/${tab}`);
    setActiveTab(tab);
    setSelectedAssessmentId(null);
    setSelectedAssessment(null);
    setSelectedWorkItemId(null);
    setSelectedWorkDateStr(null);
    setSelectedProjectId(null);
    setSelectedProject(null);
  };

  if (loading) return <div className="min-h-screen bg-[#faf6ef]" />;

  if (!user) {
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
                setSelectedAssessmentId(null);
                setSelectedAssessment(null);
              }}
            />
          ) : (
            <StudyView
              onSelectAssessment={(id, assessment) => {
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
                setSelectedWorkItemId(null);
                setSelectedWorkDateStr(null);
              }}
            />
          ) : (
            <WorkCalendarView
              onSelectOccurrence={(workItemId, dateStr) => {
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
                setSelectedProjectId(null);
                setSelectedProject(null);
              }}
            />
          ) : (
            <ProjectsView onSelectProject={(id, project) => {
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
