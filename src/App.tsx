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
import { seedInitialDemoData } from '../lib/seed';
import { Sparkles, Database } from 'lucide-react';

function getInitialTab(): ActiveTab {
  return window.location.pathname.startsWith('/study') ? 'study' : 'home';
}

function DashboardContent() {
  const { user } = useAuth();
  const { themeConfig } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);

  // Sub-view routing
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);
  const [selectedWorkDateStr, setSelectedWorkDateStr] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Modals
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Tab switcher with sub-view resets
  const handleTabChange = (tab: ActiveTab) => {
    window.history.pushState({}, '', tab === 'home' ? '/' : `/${tab}`);
    setActiveTab(tab);
    setSelectedAssessmentId(null);
    setSelectedWorkItemId(null);
    setSelectedWorkDateStr(null);
    setSelectedProjectId(null);
  };

  const handleSeedData = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsSeeding(true);
    try {
      await seedInitialDemoData(user.uid);
      window.location.reload();
    } catch (e) {
      console.error(e);
      setIsSeeding(false);
    }
  };

  return (
    <div className={`min-h-screen ${themeConfig.pageBg} ${themeConfig.textColor} flex flex-col transition-colors duration-300 selection:bg-[#f2dfce] selection:text-[#544133]`}>
      {/* 1. Cozy Landscape Banner with dynamically calculated Academic Week */}
      <CozyBanner onOpenSettings={() => setShowSettingsModal(true)} />

      {/* 2. Top Navigation Bar */}
      <TopNav
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
      />

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
              onBack={() => setSelectedAssessmentId(null)}
            />
          ) : (
            <StudyView
              onSelectAssessment={(id) => setSelectedAssessmentId(id)}
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
              onBack={() => setSelectedProjectId(null)}
            />
          ) : (
            <ProjectsView onSelectProject={(id) => setSelectedProjectId(id)} />
          ))}
      </div>

      {/* Footer / Quick Seed Floating Pill */}
      <footer className="py-4 border-t border-[#ede3d4] bg-[#faf6ef] text-center text-xs text-[#9d8a7c]">
        <div className="max-w-[1420px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/assets/branding/motion-logo.png" alt="Motion — Skip motivation. Get to Motion." className="h-12 w-auto object-contain" />
            <span className="text-[#c4b5a5]">•</span>
            <span>Skip motivation. Get to Motion.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#fffdf9] hover:bg-[#f6eee3] text-[#786659] border border-[#ede3d4] shadow-2xs transition-colors cursor-pointer"
              title="Populate your database with the sample courses, coaching classes, and projects from the reference designs"
            >
              <Database className="w-3 h-3 text-[#966746]" />
              <span>{isSeeding ? 'Loading sample data...' : 'Seed Reference Data'}</span>
            </button>
            <span className="text-[11px] text-[#b3a496]">
              {user ? user.displayName || user.email : 'Signed in as Guest'}
            </span>
          </div>
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CozyMediaProvider>
          <DashboardContent />
        </CozyMediaProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
