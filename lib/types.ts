export type AreaType = 'general' | 'study' | 'work' | 'project' | 'personal';
export type PriorityType = 'mainQuest' | 'normal';
export type ParentType = 'assessment' | 'work' | 'project' | null;

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  bannerPosition?: string | null;
  theme?: 'morning' | 'sunset' | 'night' | 'sakura' | 'forest' | 'cloudy';
  semesterConfig?: {
    semesterName: string;      // e.g. "August 2026"
    semesterStartDate: string; // e.g. "2026-09-01"
  };
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  ownerId: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  dueDate: string | null; // "YYYY-MM-DD"
  area: AreaType;
  priority: PriorityType;
  showOnHome: boolean;
  parentType: ParentType;
  parentId: string | null;
  assignedToUserIds: string[]; // UIDs only
}

export interface Assessment {
  id: string;
  ownerId: string;
  name: string;
  courseCode: string;
  type: 'test' | 'assignment';
  week: number;
  date: string; // "YYYY-MM-DD"
  weight: number; // e.g. 20 for 20%
  status: 'Upcoming' | 'In progress' | 'Completed';
  pinned: boolean;
  collaborationEnabled: boolean;
  collaborationCode: string | null;
  memberIds: string[];
  createdAt: string;
}

export interface AssessmentNote {
  id: string;
  assessmentId: string;
  date: string; // e.g. "Mar 10, 2025"
  items: string[];
  authorId?: string;
  createdAt?: string;
}

export interface AssessmentResource {
  id: string;
  assessmentId: string;
  title: string;
  url: string;
  type: 'link' | 'document';
  storagePath?: string;
  createdAt?: string;
}

export interface WorkItem {
  id: string;
  ownerId: string;
  title: string; // e.g. "Joshua", "Saturday Group Class", "CocoDay"
  type: 'class' | 'event';
  subject: string; // e.g. "Chess Lesson", "Tournament Prep"
  defaultTime: string; // e.g. "4:00 PM" or "12:00–1:00 PM"
  isRecurring: boolean;
  dayOfWeek?: number; // 0 (Sun) to 6 (Sat)
  recurrenceInterval?: 'weekly' | 'none' | 'daily' | 'biweekly' | 'monthly' | 'custom';
  recurrenceRule?: string; // e.g. "Repeats weekly on Sunday"
  color?: 'sage' | 'blush' | 'lavender' | 'sand' | 'blue' | 'soft blue' | 'peach';
  startDate: string; // "YYYY-MM-DD"
  defaultNotesProgress?: string;
  createdAt?: string;
}

export interface WorkOccurrence {
  id: string;
  workItemId: string;
  ownerId: string;
  date: string; // "YYYY-MM-DD"
  time: string; // e.g. "4:00 PM"
  color?: 'sage' | 'blush' | 'lavender' | 'sand' | 'blue' | 'soft blue' | 'peach';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  whatHappened: string[];
  nextLessonNotes: string[];
  notesProgress: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  status: 'Active' | 'Planning' | 'On Hold' | 'Someday' | 'Completed' | 'Idea';
  section: 'active' | 'someday' | 'completed';
  icon: string;
  targetDate?: string | null; // "YYYY-MM-DD"
  overviewNotes?: string;
  ideas?: ProjectIdea[] | string[];
  notes?: ProjectNote[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectIdea {
  id: string;
  content: string;
}

export interface ProjectNote {
  id: string;
  content: string;
  authorId: string;
  authorName?: string;
  createdAt: string;
}

export interface CollaborationCode {
  code: string;
  assessmentId: string;
  ownerId: string;
  enabled: boolean;
}
