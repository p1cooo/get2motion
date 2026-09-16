'use client';

import React, { useState } from 'react';
import {
  Lightbulb,
  Plus,
  CheckCircle2,
  ListTodo,
  Clock,
  Sparkles,
  ChevronRight,
  Target,
  BarChart3,
  BookOpen,
  Globe,
  Smartphone,
  Dumbbell,
  Calendar,
  X,
  GripVertical,
  Check,
} from 'lucide-react';
import { Project } from '../../lib/types';
import { DEMO_PROJECTS } from '../../lib/demo-data';

interface ProjectsViewProps {
  onSelectProject: (projectId: string) => void;
  onOpenCreateModal?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onSelectProject,
}) => {
  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);

  // View More toggles
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllIdeas, setShowAllIdeas] = useState(false);

  // Drag & drop state
  const [draggedProjId, setDraggedProjId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<'active' | 'someday' | 'completed' | null>(null);

  // Quick add project modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjSection, setNewProjSection] = useState<'active' | 'someday' | 'completed'>('active');
  const [newProjTargetDate, setNewProjTargetDate] = useState<string>('');

  // Groups
  const activeProjects = projects.filter((p) => p.section === 'active');
  const somedayProjects = projects.filter((p) => p.section === 'someday');
  const completedProjects = projects.filter((p) => p.section === 'completed');

  // 3-item limit for main overview
  const visibleActive = showAllActive ? activeProjects : activeProjects.slice(0, 3);
  const visibleSomeday = showAllIdeas ? somedayProjects : somedayProjects.slice(0, 3);

  // Drag and Drop handlers between sections
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedProjId(id);
  };

  const handleDropOnSection = (e: React.DragEvent, targetSection: 'active' | 'someday' | 'completed') => {
    e.preventDefault();
    setDragOverSection(null);

    const id = e.dataTransfer.getData('text/plain') || draggedProjId;
    if (!id) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newStatus =
          targetSection === 'active'
            ? 'Active'
            : targetSection === 'completed'
            ? 'Completed'
            : 'Idea';

        return {
          ...p,
          section: targetSection,
          status: newStatus,
        };
      })
    );
    setDraggedProjId(null);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      ownerId: 'demo-user-pico',
      name: newProjName.trim(),
      description: newProjDesc.trim() || 'A new personal endeavor.',
      section: newProjSection,
      status:
        newProjSection === 'active'
          ? 'Active'
          : newProjSection === 'completed'
          ? 'Completed'
          : 'Idea',
      targetDate: newProjTargetDate ? newProjTargetDate : null,
      icon: 'Target',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [newProj, ...prev]);
    setIsAddModalOpen(false);
    setNewProjName('');
    setNewProjDesc('');
    setNewProjTargetDate('');
  };

  // Helper to render distinct pastel icon tiles
  const renderProjectIcon = (iconName?: string | null) => {
    switch (iconName) {
      case 'Target':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#e8f1e9] text-[#557859] flex items-center justify-center font-bold shadow-2xs">
            <Target className="w-5 h-5" />
          </div>
        );
      case 'BarChart3':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#f6eee3] text-[#966746] flex items-center justify-center font-bold shadow-2xs">
            <BarChart3 className="w-5 h-5" />
          </div>
        );
      case 'BookOpen':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#e7effa] text-[#446b9e] flex items-center justify-center font-bold shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
        );
      case 'Globe':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#faeaec] text-[#8a4b53] flex items-center justify-center font-bold shadow-2xs">
            <Globe className="w-5 h-5" />
          </div>
        );
      case 'Smartphone':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#ede8f5] text-[#6b578c] flex items-center justify-center font-bold shadow-2xs">
            <Smartphone className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#fbf0dc] text-[#8c601b] flex items-center justify-center font-bold shadow-2xs">
            <Lightbulb className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-[1420px] mx-auto px-4 sm:px-6 py-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#43342a] tracking-tight">
            Projects & Ideas
          </h1>
          <p className="text-xs sm:text-sm text-[#8c7a6e]">
            Drag items between Ideas and Active Projects. Track milestone target dates and brainstorm notes.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          id="new-project-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#966746] hover:bg-[#7e5335] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* =========================================================================
          SECTION 1: ACTIVE PROJECTS (3-item limit, Total count badge, Drag-to-reschedule)
      ========================================================================= */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverSection('active');
        }}
        onDragLeave={() => setDragOverSection(null)}
        onDrop={(e) => handleDropOnSection(e, 'active')}
        className={`mb-8 p-4 rounded-3xl border transition-colors ${
          dragOverSection === 'active'
            ? 'bg-[#f8f2e9] border-[#966746] ring-2 ring-[#ebd8b7]'
            : 'border-transparent'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#557859]" />
            <h2 className="text-base sm:text-lg font-bold text-[#43342a] tracking-tight">
              Active Projects
            </h2>
            {/* Total Count Badge */}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e5efe5] text-[#557859]">
              {activeProjects.length} projects
            </span>
          </div>

          {activeProjects.length > 3 && (
            <button
              onClick={() => setShowAllActive(!showAllActive)}
              id="view-more-active-projects-btn"
              className="text-xs font-semibold text-[#966746] hover:text-[#7e5335] px-3 py-1 rounded-full bg-[#fbf7f1] hover:bg-[#f6eee3] border border-[#ede2d2] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{showAllActive ? 'Show Less' : `View More (${activeProjects.length})`}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${showAllActive ? 'rotate-90' : ''}`}
              />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleActive.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onClick={() => onSelectProject(item.id)}
              className="group bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs hover:shadow-md hover:border-[#dfd0be] transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  {renderProjectIcon(item.icon)}
                  <div className="flex items-center gap-1">
                    <span className="cursor-grab text-[#a9998d] hover:text-[#43342a] p-1">
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#e5efe5] text-[#557859] border border-[#cbe0cc]">
                      Active
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#43342a] group-hover:text-[#966746] transition-colors leading-snug">
                  {item.name}
                </h3>
                <p className="text-xs text-[#8c7a6e] mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#f5ebde] flex items-center justify-between text-xs text-[#8c7a6e]">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#a9998d]" />
                  <span>
                    {item.targetDate ? `Target: ${item.targetDate}` : 'No target date'}
                  </span>
                </div>
                <span className="text-[#966746] font-semibold group-hover:translate-x-0.5 transition-transform">
                  View →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: PROJECT IDEAS / SOMEDAY (3-item limit, Total count badge, Drag-to-reschedule)
      ========================================================================= */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverSection('someday');
        }}
        onDragLeave={() => setDragOverSection(null)}
        onDrop={(e) => handleDropOnSection(e, 'someday')}
        className={`mb-8 p-4 rounded-3xl border transition-colors ${
          dragOverSection === 'someday'
            ? 'bg-[#f8f2e9] border-[#966746] ring-2 ring-[#ebd8b7]'
            : 'border-transparent'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#e8c078]" />
            <h2 className="text-base sm:text-lg font-bold text-[#43342a] tracking-tight">
              Project Ideas & Backlog
            </h2>
            {/* Total Count Badge */}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#fbf0dc] text-[#8c601b]">
              {somedayProjects.length} ideas
            </span>
          </div>

          {somedayProjects.length > 3 && (
            <button
              onClick={() => setShowAllIdeas(!showAllIdeas)}
              id="view-more-ideas-btn"
              className="text-xs font-semibold text-[#966746] hover:text-[#7e5335] px-3 py-1 rounded-full bg-[#fbf7f1] hover:bg-[#f6eee3] border border-[#ede2d2] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{showAllIdeas ? 'Show Less' : `View More (${somedayProjects.length})`}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${showAllIdeas ? 'rotate-90' : ''}`}
              />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleSomeday.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onClick={() => onSelectProject(item.id)}
              className="group bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-5 shadow-xs hover:shadow-md hover:border-[#dfd0be] transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  {renderProjectIcon(item.icon)}
                  <div className="flex items-center gap-1">
                    <span className="cursor-grab text-[#a9998d] hover:text-[#43342a] p-1">
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#fbf0dc] text-[#8c601b] border border-[#ebd8b7]">
                      Idea
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#43342a] group-hover:text-[#966746] transition-colors leading-snug">
                  {item.name}
                </h3>
                <p className="text-xs text-[#8c7a6e] mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#f5ebde] flex items-center justify-between text-xs text-[#8c7a6e]">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#a9998d]" />
                  <span>{item.targetDate ? `Target: ${item.targetDate}` : 'Someday'}</span>
                </div>
                <span className="text-[#966746] font-semibold group-hover:translate-x-0.5 transition-transform">
                  Explore →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: COMPLETED PROJECTS DROP ZONE & LIST
      ========================================================================= */}
      {completedProjects.length > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverSection('completed');
          }}
          onDragLeave={() => setDragOverSection(null)}
          onDrop={(e) => handleDropOnSection(e, 'completed')}
          className={`p-4 rounded-3xl border transition-colors ${
            dragOverSection === 'completed'
              ? 'bg-[#f8f2e9] border-[#966746] ring-2 ring-[#ebd8b7]'
              : 'border-transparent'
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8fae92]" />
            <h2 className="text-base sm:text-lg font-bold text-[#43342a] tracking-tight">
              Completed Projects
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ede8f5] text-[#6b578c]">
              {completedProjects.length} completed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {completedProjects.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onClick={() => onSelectProject(item.id)}
                className="group bg-[#fffefb]/80 rounded-2xl border border-[#ede2d2] p-5 shadow-xs hover:border-[#dfd0be] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {renderProjectIcon(item.icon)}
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#ede8f5] text-[#6b578c]">
                      Done
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#786659] line-through leading-snug">
                    {item.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          NEW PROJECT MODAL (With Optional Target Date)
      ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#fffefb] rounded-3xl border border-[#ede2d2] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2e6d2]">
              <h3 className="text-base font-extrabold text-[#43342a]">
                + New Project
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#a9998d] hover:text-[#43342a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-[#786659] block mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. YouTube Video Series, Marathon Prep"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#786659] block mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of goals and milestones..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#786659] block mb-1">
                    Section / Status
                  </label>
                  <select
                    value={newProjSection}
                    onChange={(e) => setNewProjSection(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] font-medium"
                  >
                    <option value="active">Active Project</option>
                    <option value="someday">Idea / Backlog</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Optional Target Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#786659]">
                      Target Date
                    </label>
                    {newProjTargetDate && (
                      <button
                        type="button"
                        onClick={() => setNewProjTargetDate('')}
                        className="text-[10px] text-[#966746] hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={newProjTargetDate}
                    onChange={(e) => setNewProjTargetDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f2e6d2]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-[#8c7a6e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#966746] hover:bg-[#7e5335] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
