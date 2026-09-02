import { useState, useEffect, useCallback } from 'react';
import type { ApplicationStatus, UserRole } from '@/types';
import { opportunityMap } from '@/data/mockData';

export type NotificationType = 'shortlist' | 'interview' | 'offer' | 'reject' | 'review' | 'system' | 'evidence_update';

export interface AppNotification {
  id: string;
  studentId: string;
  targetRole?: 'student' | 'organization' | 'all';
  type: NotificationType;
  title: string;
  message: string;
  opportunityId?: string;
  opportunityTitle?: string;
  organizationName?: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    evidenceId?: string;
    evidenceTitle?: string;
    studentName?: string;
    sha256Hash?: string;
    [key: string]: any;
  };
}

const STORAGE_KEY = 'evx_notifications_v1';

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_seed_org_1',
    studentId: 'st_aarav',
    targetRole: 'organization',
    type: 'evidence_update',
    title: '📝 Candidate Evidence Updated',
    message: 'Aarav Sharma updated verified project "Distributed Analytics Engine" (SHA-256 seal resealed). Match score recalculated.',
    opportunityId: 'op_fe_intern',
    opportunityTitle: 'Frontend Developer Intern',
    organizationName: 'TechFlow Labs',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    read: false,
    metadata: {
      evidenceTitle: 'Distributed Analytics Engine',
      studentName: 'Aarav Sharma',
    },
  },
  {
    id: 'notif_seed_1',
    studentId: 'st_aarav',
    targetRole: 'student',
    type: 'shortlist',
    title: '🎉 Application Shortlisted!',
    message: 'TechFlow Labs shortlisted your Skill Passport for Frontend Developer Intern (92% Match).',
    opportunityId: 'op_fe_intern',
    opportunityTitle: 'Frontend Developer Intern',
    organizationName: 'TechFlow Labs',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
  },
  {
    id: 'notif_seed_2',
    studentId: 'st_diya',
    targetRole: 'student',
    type: 'interview',
    title: '🎙️ Interview Stage Invitation',
    message: 'MediCore AI scheduled an AI Engineering technical round for AI Research Associate.',
    opportunityId: 'op_ml_research',
    opportunityTitle: 'AI Research Associate',
    organizationName: 'MediCore AI',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
  },
];

function loadStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStoredNotifications(SEED_NOTIFICATIONS);
      return SEED_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw) as AppNotification[];
    // Ensure seed organization notification exists if missing
    if (!parsed.some((n) => n.type === 'evidence_update')) {
      parsed.unshift(SEED_NOTIFICATIONS[0]);
      saveStoredNotifications(parsed);
    }
    return parsed;
  } catch {
    return SEED_NOTIFICATIONS;
  }
}

function saveStoredNotifications(notifs: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
  } catch (err) {
    console.error('Failed to save notifications', err);
  }
}

let listeners: (() => void)[] = [];
function notifyListeners() {
  for (const l of listeners) l();
}

export function pushNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
  const current = loadStoredNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  current.unshift(newNotif);
  saveStoredNotifications(current);
  notifyListeners();
  return newNotif;
}

export function notifyStudentOnStatusChange(
  studentId: string,
  opportunityTitle: string,
  organizationName: string,
  status: ApplicationStatus,
  opportunityId?: string
) {
  let title = 'Application Status Updated';
  let message = `${organizationName} updated your application status to "${status}".`;
  let type: NotificationType = 'system';

  if (status === 'Shortlisted') {
    title = '🎉 Application Shortlisted!';
    message = `Great news! ${organizationName} has shortlisted your verified Skill Passport for ${opportunityTitle}.`;
    type = 'shortlist';
  } else if (status === 'Interviewing') {
    title = '🎙️ Interview Stage Invitation!';
    message = `${organizationName} has moved you to the Interview Stage for ${opportunityTitle}. Prepare your technical walkthrough!`;
    type = 'interview';
  } else if (status === 'Offered') {
    title = '🏆 Official Offer Extended!';
    message = `Congratulations! ${organizationName} has extended an official internship offer for ${opportunityTitle}!`;
    type = 'offer';
  } else if (status === 'Rejected') {
    title = 'Application Status Update';
    message = `${organizationName} has concluded applicant reviews for ${opportunityTitle}. Keep building your verified skill passport!`;
    type = 'reject';
  } else if (status === 'Reviewing') {
    title = '👀 Skill Passport Under Review';
    message = `${organizationName} is actively reviewing your verified credentials for ${opportunityTitle}.`;
    type = 'review';
  }

  return pushNotification({
    studentId,
    targetRole: 'student',
    type,
    title,
    message,
    opportunityId,
    opportunityTitle,
    organizationName,
  });
}

/**
 * Notifies reviewing recruiters when a student edits or updates any evidence artifact.
 * Reseals with cryptographic SHA-256 hash and updates matching scores.
 */
export function notifyRecruitersOnEvidenceUpdate({
  studentId,
  studentName,
  evidenceTitle,
  evidenceId,
  newHash,
}: {
  studentId: string;
  studentName: string;
  evidenceTitle: string;
  evidenceId?: string;
  newHash?: string;
}) {
  let applications: any[] = [];
  try {
    const raw = localStorage.getItem('evx_applications_v1');
    if (raw) applications = JSON.parse(raw);
  } catch {}

  const studentApps = applications.filter((a) => a.studentId === studentId);
  const notifiedOrgs = new Set<string>();

  if (studentApps.length > 0) {
    for (const app of studentApps) {
      const opp = opportunityMap[app.opportunityId];
      const orgName = opp?.organization || 'TechFlow Labs';
      notifiedOrgs.add(orgName);

      pushNotification({
        studentId,
        targetRole: 'organization',
        type: 'evidence_update',
        title: '📝 Candidate Evidence Updated',
        message: `${studentName} updated verified evidence "${evidenceTitle}". Deterministic SHA-256 seal resealed & match score refreshed.`,
        opportunityId: app.opportunityId,
        opportunityTitle: opp?.title || 'Internship Opportunity',
        organizationName: orgName,
        metadata: {
          evidenceId,
          evidenceTitle,
          studentName,
          sha256Hash: newHash,
        },
      });
    }
  } else {
    // Default organization alert if not yet applied
    pushNotification({
      studentId,
      targetRole: 'organization',
      type: 'evidence_update',
      title: '📝 Candidate Evidence Updated',
      message: `${studentName} updated verified evidence "${evidenceTitle}" with a new SHA-256 seal.`,
      opportunityId: 'op_fe_intern',
      opportunityTitle: 'Frontend Developer Intern',
      organizationName: 'TechFlow Labs',
      metadata: {
        evidenceId,
        evidenceTitle,
        studentName,
        sha256Hash: newHash,
      },
    });
    notifiedOrgs.add('TechFlow Labs');
  }

  // Also push confirmation to the student
  pushNotification({
    studentId,
    targetRole: 'student',
    type: 'system',
    title: '🛡️ Evidence Resealed & Recruiters Notified',
    message: `Your changes to "${evidenceTitle}" have been sealed with a new SHA-256 hash. Reviewing recruiters at ${Array.from(notifiedOrgs).join(', ')} were notified.`,
    metadata: {
      evidenceId,
      evidenceTitle,
      sha256Hash: newHash,
    },
  });
}

export type NotificationFilter =
  | string
  | {
      studentId?: string;
      role?: UserRole;
      organization?: string;
    };

export function useNotifications(filter?: NotificationFilter) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  const all = loadStoredNotifications();

  // Filter based on student or organization perspective
  const notifications = all.filter((n) => {
    if (!filter) return true;

    if (typeof filter === 'string') {
      return n.studentId === filter && (n.targetRole === 'student' || !n.targetRole);
    }

    if (filter.role === 'organization') {
      return n.targetRole === 'organization';
    }

    if (filter.role === 'student') {
      return (!n.targetRole || n.targetRole === 'student') && (!filter.studentId || n.studentId === filter.studentId);
    }

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    const list = loadStoredNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.read = true;
      saveStoredNotifications(list);
      notifyListeners();
    }
  }, []);

  const markAllAsRead = useCallback((activeFilter?: NotificationFilter) => {
    const list = loadStoredNotifications();
    for (const item of list) {
      if (!activeFilter) {
        item.read = true;
      } else if (typeof activeFilter === 'string') {
        if (item.studentId === activeFilter && (item.targetRole === 'student' || !item.targetRole)) {
          item.read = true;
        }
      } else if (activeFilter.role === 'organization') {
        if (item.targetRole === 'organization') {
          item.read = true;
        }
      } else if (activeFilter.role === 'student') {
        if ((!item.targetRole || item.targetRole === 'student') && (!activeFilter.studentId || item.studentId === activeFilter.studentId)) {
          item.read = true;
        }
      }
    }
    saveStoredNotifications(list);
    notifyListeners();
  }, []);

  const clearAll = useCallback((activeFilter?: NotificationFilter) => {
    let list = loadStoredNotifications();
    if (!activeFilter) {
      list = [];
    } else if (typeof activeFilter === 'string') {
      list = list.filter((n) => !(n.studentId === activeFilter && (n.targetRole === 'student' || !n.targetRole)));
    } else if (activeFilter.role === 'organization') {
      list = list.filter((n) => n.targetRole !== 'organization');
    } else if (activeFilter.role === 'student') {
      list = list.filter((n) => !((!n.targetRole || n.targetRole === 'student') && (!activeFilter.studentId || n.studentId === activeFilter.studentId)));
    }
    saveStoredNotifications(list);
    notifyListeners();
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
