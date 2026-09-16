import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export async function seedInitialDemoData(userId: string) {
  if (!userId) return;

  try {
    // Check if user already has data to avoid re-seeding
    const existingTasks = await getDocs(
      query(collection(db, 'tasks'), where('ownerId', '==', userId))
    );
    if (!existingTasks.empty) {
      console.log('User data already present, skipping initial seed.');
      return;
    }

    const batch = writeBatch(db);

    // 1. Initial Assessments matching screenshots
    const csProposalRef = doc(collection(db, 'assessments'));
    batch.set(csProposalRef, {
      ownerId: userId,
      name: 'CS Project Proposal',
      courseCode: 'CS301 – Software Engineering',
      type: 'assignment',
      week: 8,
      date: '2026-09-30',
      weight: 20,
      status: 'In progress',
      pinned: true,
      collaborationEnabled: true,
      collaborationCode: 'CS301-TEAM',
      memberIds: [userId],
      createdAt: new Date().toISOString(),
    });

    // Dedicated lookup code document
    const codeRef = doc(db, 'collaborationCodes', 'CS301-TEAM');
    batch.set(codeRef, {
      code: 'CS301-TEAM',
      assessmentId: csProposalRef.id,
      ownerId: userId,
      enabled: true,
    });

    const webTestRef = doc(collection(db, 'assessments'));
    batch.set(webTestRef, {
      ownerId: userId,
      name: 'Web Computing Test',
      courseCode: 'CSC1215',
      type: 'test',
      week: 2,
      date: '2026-09-15',
      weight: 20,
      status: 'Upcoming',
      pinned: true,
      collaborationEnabled: false,
      collaborationCode: null,
      memberIds: [userId],
      createdAt: new Date().toISOString(),
    });

    const dataMiningRef = doc(collection(db, 'assessments'));
    batch.set(dataMiningRef, {
      ownerId: userId,
      name: 'Data Mining Quiz',
      courseCode: 'CSDM2203',
      type: 'test',
      week: 4,
      date: '2026-09-24',
      weight: 10,
      status: 'Upcoming',
      pinned: false,
      collaborationEnabled: false,
      collaborationCode: null,
      memberIds: [userId],
      createdAt: new Date().toISOString(),
    });

    const physicsExamRef = doc(collection(db, 'assessments'));
    batch.set(physicsExamRef, {
      ownerId: userId,
      name: 'Physics Exam',
      courseCode: 'PHYS1101',
      type: 'test',
      week: 6,
      date: '2026-10-08',
      weight: 25,
      status: 'Upcoming',
      pinned: false,
      collaborationEnabled: false,
      collaborationCode: null,
      memberIds: [userId],
      createdAt: new Date().toISOString(),
    });

    const webDevRef = doc(collection(db, 'assessments'));
    batch.set(webDevRef, {
      ownerId: userId,
      name: 'Web Development',
      courseCode: 'CSC1215',
      type: 'assignment',
      week: 8,
      date: '2026-10-19',
      weight: 30,
      status: 'Upcoming',
      pinned: false,
      collaborationEnabled: false,
      collaborationCode: null,
      memberIds: [userId],
      createdAt: new Date().toISOString(),
    });

    const finalProjectRef = doc(collection(db, 'assessments'));
    batch.set(finalProjectRef, {
      ownerId: userId,
      name: 'Final Project',
      courseCode: 'CSC1215',
      type: 'assignment',
      week: 14,
      date: '2026-11-30',
      weight: 30,
      status: 'Upcoming',
      pinned: false,
      collaborationEnabled: false,
      collaborationCode: null,
      memberIds: [userId],
      createdAt: new Date().toISOString(),
    });

    // 2. Assessment Notes for CS Proposal
    const note1 = doc(collection(db, 'assessmentNotes'));
    batch.set(note1, {
      assessmentId: csProposalRef.id,
      date: 'Sep 10, 2026',
      items: [
        'Read through the project brief in detail.',
        'Identified key requirements and constraints.',
        'Initial thoughts: web-based application for student study planner.',
      ],
      authorId: userId,
      createdAt: new Date().toISOString(),
    });

    const note2 = doc(collection(db, 'assessmentNotes'));
    batch.set(note2, {
      assessmentId: csProposalRef.id,
      date: 'Sep 12, 2026',
      items: [
        'Group discussion: shared ideas and potential features.',
        'Decided to focus on a study planner with task tracking.',
        'Assigned tasks for next week.',
      ],
      authorId: userId,
      createdAt: new Date().toISOString(),
    });

    // 3. Assessment Resources for CS Proposal
    const res1 = doc(collection(db, 'assessmentResources'));
    batch.set(res1, {
      assessmentId: csProposalRef.id,
      title: 'Project Brief.pdf',
      url: 'https://example.edu/cs301/brief.pdf',
      type: 'document',
      createdAt: new Date().toISOString(),
    });

    const res2 = doc(collection(db, 'assessmentResources'));
    batch.set(res2, {
      assessmentId: csProposalRef.id,
      title: 'Example Proposal.pdf',
      url: 'https://example.edu/cs301/example.pdf',
      type: 'document',
      createdAt: new Date().toISOString(),
    });

    const res3 = doc(collection(db, 'assessmentResources'));
    batch.set(res3, {
      assessmentId: csProposalRef.id,
      title: 'Useful Article – How to Write a Good Proposal',
      url: 'https://example.com/guide/proposals',
      type: 'link',
      createdAt: new Date().toISOString(),
    });

    // 4. Central Master Tasks
    // A. Main Quest
    const tMain = doc(collection(db, 'tasks'));
    batch.set(tMain, {
      ownerId: userId,
      title: 'Stay consistent and make progress towards my goals!',
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      dueDate: '2026-09-30',
      area: 'general',
      priority: 'mainQuest',
      showOnHome: true,
      parentType: null,
      parentId: null,
      assignedToUserIds: [userId],
    });

    // B. Home / Things To Do list
    const homeTasks = [
      { title: 'Apply for DSU', completed: true },
      { title: 'Plan next Sat FriendsWhoChess', completed: false },
      { title: 'Read 20 pages', completed: false },
      { title: 'Practice chess (30 min)', completed: false },
      { title: 'Organize study notes', completed: false },
    ];

    homeTasks.forEach((t) => {
      const taskDoc = doc(collection(db, 'tasks'));
      batch.set(taskDoc, {
        ownerId: userId,
        title: t.title,
        completed: t.completed,
        completedAt: t.completed ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        dueDate: null,
        area: 'general',
        priority: 'normal',
        showOnHome: true,
        parentType: null,
        parentId: null,
        assignedToUserIds: [userId],
      });
    });

    // C. CS Proposal Tasks
    const proposalTasks = [
      { title: 'Read project brief', completed: true },
      { title: 'Brainstorm ideas', completed: true },
      { title: 'Discuss with group', completed: false },
      { title: 'Write draft (introduction)', completed: false },
      { title: 'Complete full proposal', completed: false },
      { title: 'Proofread', completed: false },
      { title: 'Submit', completed: false },
    ];

    proposalTasks.forEach((pt) => {
      const pTaskDoc = doc(collection(db, 'tasks'));
      batch.set(pTaskDoc, {
        ownerId: userId,
        title: pt.title,
        completed: pt.completed,
        completedAt: pt.completed ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        dueDate: '2026-09-30',
        area: 'study',
        priority: 'normal',
        showOnHome: false,
        parentType: 'assessment',
        parentId: csProposalRef.id,
        assignedToUserIds: [userId],
      });
    });

    // 5. Work Items (Classes and Events)
    const joshuaClass = doc(collection(db, 'workItems'));
    batch.set(joshuaClass, {
      ownerId: userId,
      title: 'Joshua',
      type: 'class',
      subject: 'Chess Lesson',
      defaultTime: '4:00 PM',
      isRecurring: true,
      dayOfWeek: 2, // Tuesday
      recurrenceInterval: 'weekly',
      startDate: '2026-09-01',
      defaultNotesProgress:
        'Joshua was focused and asked good questions today. Getting more comfortable with calculating lines.',
      createdAt: new Date().toISOString(),
    });

    const mosesClass = doc(collection(db, 'workItems'));
    batch.set(mosesClass, {
      ownerId: userId,
      title: 'Moses',
      type: 'class',
      subject: 'Chess Lesson',
      defaultTime: '4:00 PM',
      isRecurring: true,
      dayOfWeek: 4, // Thursday
      recurrenceInterval: 'weekly',
      startDate: '2026-09-01',
      defaultNotesProgress: 'Working on endgame knight manoeuvres and pawn pawn structures.',
      createdAt: new Date().toISOString(),
    });

    const satGroupClass = doc(collection(db, 'workItems'));
    batch.set(satGroupClass, {
      ownerId: userId,
      title: 'Saturday Group Class',
      type: 'class',
      subject: 'Tactics & Opening Ideas',
      defaultTime: '10:00 AM',
      isRecurring: true,
      dayOfWeek: 6, // Saturday
      recurrenceInterval: 'weekly',
      startDate: '2026-09-01',
      defaultNotesProgress: 'Interactive tactics review and mini blitz games.',
      createdAt: new Date().toISOString(),
    });

    const baxtonClass = doc(collection(db, 'workItems'));
    batch.set(baxtonClass, {
      ownerId: userId,
      title: 'Baxton',
      type: 'class',
      subject: 'Chess Lesson',
      defaultTime: '4:00 PM',
      isRecurring: true,
      dayOfWeek: 2, // Tuesday
      recurrenceInterval: 'weekly',
      startDate: '2026-09-01',
      defaultNotesProgress: 'Focusing on middle game planning and calculation safety.',
      createdAt: new Date().toISOString(),
    });

    const friendsWhoChessEvent = doc(collection(db, 'workItems'));
    batch.set(friendsWhoChessEvent, {
      ownerId: userId,
      title: 'FriendsWhoChess',
      type: 'event',
      subject: 'Community Meetup',
      defaultTime: '2:00 PM',
      isRecurring: false,
      startDate: '2026-09-26',
      defaultNotesProgress: 'Fun casual community meetup at the park cafe.',
      createdAt: new Date().toISOString(),
    });

    const cocoDayEvent = doc(collection(db, 'workItems'));
    batch.set(cocoDayEvent, {
      ownerId: userId,
      title: 'CocoDay Prep',
      type: 'event',
      subject: 'Coaching Planning',
      defaultTime: '7:00 PM',
      isRecurring: false,
      startDate: '2026-09-07',
      defaultNotesProgress: 'Plan activities and materials for student day.',
      createdAt: new Date().toISOString(),
    });

    // Work occurrence for Joshua on Sep 6 with session diary notes matching reference
    const joshuaOcc = doc(collection(db, 'workOccurrences'));
    batch.set(joshuaOcc, {
      workItemId: joshuaClass.id,
      ownerId: userId,
      date: '2026-09-06',
      time: '12:00–1:00 PM',
      status: 'completed',
      whatHappened: [
        'mate in 3 warm up',
        'showed middlegame open file ideas',
        'played one practice game',
        'discussed common mistakes (leaving pieces undefended)',
        'ended with a quick puzzle challenge',
      ],
      nextLessonNotes: [
        'review open file concepts',
        'practice endgame (king and pawn)',
        'more puzzles (5–10 min)',
        'try a longer game with focus on piece activity',
        'check understanding of key ideas',
      ],
      notesProgress:
        "Joshua was focused and asked good questions today. He's getting more comfortable with calculating lines. Still needs practice with not moving too quickly, but overall great improvement!",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 6. Projects matching reference
    const p1 = doc(collection(db, 'projects'));
    batch.set(p1, {
      ownerId: userId,
      name: 'Bingo Space',
      description: 'student dashboard & attendance ideas',
      status: 'Active',
      section: 'active',
      icon: 'Target',
      overviewNotes: 'Modern student portal for coaching attendance and study material tracking.',
      ideas: ['QR code check-in', 'Parent progress reports', 'Mobile-friendly lesson log'],
      createdAt: new Date().toISOString(),
    });

    const p2 = doc(collection(db, 'projects'));
    batch.set(p2, {
      ownerId: userId,
      name: 'Chess Sales Tracker',
      description: 'organize sales and records',
      status: 'Planning',
      section: 'active',
      icon: 'BarChart3',
      overviewNotes: 'Lightweight ledger for coaching invoices and student booking hours.',
      ideas: ['Monthly revenue graph', 'Session package countdowns'],
      createdAt: new Date().toISOString(),
    });

    const p3 = doc(collection(db, 'projects'));
    batch.set(p3, {
      ownerId: userId,
      name: 'Study Resources Hub',
      description: 'collect notes, links, and tools',
      status: 'Active',
      section: 'active',
      icon: 'BookOpen',
      overviewNotes: 'Curated repository for lecture slides, cheat sheets, and useful web tools.',
      ideas: ['Tagging by semester', 'Direct PDF downloads'],
      createdAt: new Date().toISOString(),
    });

    const p4 = doc(collection(db, 'projects'));
    batch.set(p4, {
      ownerId: userId,
      name: 'Personal Website',
      description: 'portfolio, blog, and more',
      status: 'On Hold',
      section: 'someday',
      icon: 'Globe',
      overviewNotes: 'Minimal cozy blog and project showcase.',
      ideas: ['Interactive game viewer', 'Newsletter signup'],
      createdAt: new Date().toISOString(),
    });

    const p5 = doc(collection(db, 'projects'));
    batch.set(p5, {
      ownerId: userId,
      name: 'Mobile App Concept',
      description: 'study tools on the go',
      status: 'Someday',
      section: 'someday',
      icon: 'Smartphone',
      overviewNotes: 'React Native quick companion for daily reviews.',
      ideas: ['Widget for Main Quest', 'Lock screen quick tick'],
      createdAt: new Date().toISOString(),
    });

    const p6 = doc(collection(db, 'projects'));
    batch.set(p6, {
      ownerId: userId,
      name: 'Gym Tracker',
      description: 'habits, workouts, and progress',
      status: 'Someday',
      section: 'someday',
      icon: 'Dumbbell',
      overviewNotes: 'Simple lifting log without unnecessary complexity.',
      ideas: ['Weekly volume calculation', 'Warm-up routine checklist'],
      createdAt: new Date().toISOString(),
    });

    await batch.commit();
    console.log('Initial demo data seeded successfully for', userId);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seedInitialDemoData');
  }
}
