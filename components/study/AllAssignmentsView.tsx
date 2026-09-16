'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
} from 'lucide-react';
import { Assessment } from '../../lib/types';
import { DEMO_ASSESSMENTS } from '../../lib/demo-data';

interface AllAssignmentsViewProps {
  onBack: () => void;
  onSelectAssessment: (assessmentId: string) => void;
  onAddNewAssignment?: () => void;
}

export const AllAssignmentsView: React.FC<AllAssignmentsViewProps> = ({
  onBack,
  onSelectAssessment,
  onAddNewAssignment,
}) => {
  const allAssignments = DEMO_ASSESSMENTS.filter((a) => a.type === 'assignment');

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [weekFilter, setWeekFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'week' | 'recent'>('date-asc');

  // Extract unique courses and weeks
  const availableCourses = Array.from(new Set(allAssignments.map((a) => a.courseCode)));
  const availableWeeks = Array.from(new Set(allAssignments.map((a) => a.week))).sort((a, b) => a - b);

  // Filtered & sorted assignments
  const filteredAssignments = useMemo(() => {
    return allAssignments
      .filter((assignment) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            assignment.name.toLowerCase().includes(q) ||
            assignment.courseCode.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Course filter
        if (courseFilter !== 'all' && !assignment.courseCode.includes(courseFilter)) {
          return false;
        }

        // Week filter
        if (weekFilter !== 'all' && assignment.week !== parseInt(weekFilter, 10)) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'all') {
          if (assignment.status.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
          }
        }

        // Date range filter
        if (dateRangeFilter !== 'all' && assignment.date) {
          const now = new Date();
          const d = new Date(assignment.date);
          const diffDays = Math.ceil(
            (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dateRangeFilter === 'next-7' && (diffDays < 0 || diffDays > 7)) return false;
          if (dateRangeFilter === 'next-14' && (diffDays < 0 || diffDays > 14)) return false;
          if (dateRangeFilter === 'this-month' && (diffDays < 0 || diffDays > 30)) return false;
          if (dateRangeFilter === 'later' && diffDays <= 30) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'week') {
          return a.week - b.week;
        }
        if (sortBy === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [allAssignments, searchQuery, courseFilter, dateRangeFilter, weekFilter, statusFilter, sortBy]);

  return (
    <div className="w-full max-w-[1420px] mx-auto px-4 sm:px-6 py-4 animate-in fade-in duration-300">
      {/* Back button */}
      <button
        onClick={onBack}
        id="back-to-study-btn"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#786659] hover:text-[#43342a] mb-5 px-3 py-1.5 rounded-full bg-[#fffefb] border border-[#ede2d2] shadow-2xs hover:bg-[#f6eee3] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Study Hub</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#43342a] tracking-tight">
              Upcoming Assignments & Deliverables
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#fbf0dc] text-[#8c601b] border border-[#f5e0be]">
              {filteredAssignments.length} of {allAssignments.length} assignments
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8c7a6e] mt-1">
            Track individual homework, team projects, collaboration codes, and submission deadlines.
          </p>
        </div>

        {onAddNewAssignment && (
          <button
            onClick={onAddNewAssignment}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[#966746] hover:bg-[#7e5335] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Assignment</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#fffefb] rounded-2xl border border-[#ede2d2] p-4 sm:p-5 shadow-xs mb-6 flex flex-col gap-3">
        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#a9998d] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assignments by title or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] placeholder-[#a9998d] focus:outline-none focus:border-[#966746]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[#8c7a6e] flex items-center gap-1 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] font-medium focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="date-asc">Due Date (Earliest First)</option>
              <option value="date-desc">Due Date (Latest First)</option>
              <option value="week">Academic Week</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f2e6d2] text-xs">
          <span className="font-bold text-[#8c7a6e] flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </span>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Courses</option>
            {availableCourses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="next-7">Next 7 Days</option>
            <option value="next-14">Next 14 Days</option>
            <option value="this-month">This Month</option>
            <option value="later">Later</option>
          </select>

          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Weeks</option>
            {availableWeeks.map((w) => (
              <option key={w} value={w.toString()}>
                Week {w}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#fbf7f1] border border-[#ded2c0] text-[#43342a] font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {(courseFilter !== 'all' ||
            dateRangeFilter !== 'all' ||
            weekFilter !== 'all' ||
            statusFilter !== 'all' ||
            searchQuery) && (
            <button
              onClick={() => {
                setCourseFilter('all');
                setDateRangeFilter('all');
                setWeekFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-[#966746] hover:underline font-semibold ml-2 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-[#fffefb] rounded-2xl border border-dashed border-[#ded2c0] p-12 text-center text-sm text-[#8c7a6e]">
          No assignments match the selected filters. Try resetting the filters above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((item) => (
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
                      <span className="p-1 rounded-full bg-[#f4ebe1] text-[#786659]" title="Team Collaboration Enabled">
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
      )}
    </div>
  );
};
