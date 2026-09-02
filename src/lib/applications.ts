import { useState, useEffect, useCallback } from 'react';
import type { Application, ApplicationStatus } from '@/types';
import { notifyStudentOnStatusChange } from '@/lib/notifications';
import { opportunityMap } from '@/data/mockData';

const STORAGE_KEY = 'evx_applications_v1';

// Seed demo applications
const SEED_APPLICATIONS: Application[] = [
  {
    id: 'app_1',
    studentId: 'st_aarav',
    opportunityId: 'op_fe_intern',
    appliedDate: '2025-07-05',
    status: 'Shortlisted',
    matchScoreAtApply: 88,
    notes: 'Strong React and SQL verified project evidence.',
  },
  {
    id: 'app_2',
    studentId: 'st_diya',
    opportunityId: 'op_ml_research',
    appliedDate: '2025-07-11',
    status: 'Interviewing',
    matchScoreAtApply: 94,
    notes: 'Exceptional deep learning and medical imaging portfolio.',
  },
  {
    id: 'app_3',
    studentId: 'st_rohan',
    opportunityId: 'op_backend_swe',
    appliedDate: '2025-06-22',
    status: 'Reviewing',
    matchScoreAtApply: 82,
    notes: 'Solid Node.js and AWS background.',
  },
  {
    id: 'app_4',
    studentId: 'st_ananya',
    opportunityId: 'op_ux_designer',
    appliedDate: '2025-07-08',
    status: 'Offered',
    matchScoreAtApply: 91,
    notes: 'Stellar Figma case studies with user research.',
  },
];

function loadApplications(): Application[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveApplications(SEED_APPLICATIONS);
      return SEED_APPLICATIONS;
    }
    return JSON.parse(raw) as Application[];
  } catch {
    return SEED_APPLICATIONS;
  }
}

function saveApplications(apps: Application[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch (err) {
    console.error('Failed to save applications', err);
  }
}

let listeners: (() => void)[] = [];
function notify() {
  for (const l of listeners) l();
}

export function useApplications() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  const applications = loadApplications();

  const apply = useCallback((studentId: string, opportunityId: string, matchScore?: number) => {
    const apps = loadApplications();
    const existing = apps.find((a) => a.studentId === studentId && a.opportunityId === opportunityId);
    if (existing) return existing;

    const newApp: Application = {
      id: `app_${Date.now()}`,
      studentId,
      opportunityId,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
      matchScoreAtApply: matchScore,
    };
    apps.unshift(newApp);
    saveApplications(apps);
    notify();
    return newApp;
  }, []);

  const updateStatus = useCallback(
    (studentId: string, opportunityId: string, status: ApplicationStatus, notes?: string) => {
      const apps = loadApplications();
      const idx = apps.findIndex((a) => a.studentId === studentId && a.opportunityId === opportunityId);
      if (idx !== -1) {
        apps[idx].status = status;
        if (notes !== undefined) apps[idx].notes = notes;
      } else {
        apps.unshift({
          id: `app_${Date.now()}`,
          studentId,
          opportunityId,
          appliedDate: new Date().toISOString().split('T')[0],
          status,
          notes,
        });
      }
      saveApplications(apps);
      notify();

      // Trigger real-time student notification
      try {
        const opp = opportunityMap[opportunityId];
        notifyStudentOnStatusChange(
          studentId,
          opp?.title || 'Internship Opportunity',
          opp?.organization || 'Recruiting Team',
          status,
          opportunityId
        );
      } catch (err) {
        console.warn('Notification dispatch error:', err);
      }
    },
    []
  );

  const getApplication = useCallback(
    (studentId: string, opportunityId: string) => {
      return applications.find((a) => a.studentId === studentId && a.opportunityId === opportunityId);
    },
    [applications]
  );

  const hasApplied = useCallback(
    (studentId: string, opportunityId: string) => {
      return applications.some((a) => a.studentId === studentId && a.opportunityId === opportunityId);
    },
    [applications]
  );

  const getStudentApplications = useCallback(
    (studentId: string) => {
      return applications.filter((a) => a.studentId === studentId);
    },
    [applications]
  );

  const getOpportunityApplications = useCallback(
    (opportunityId: string) => {
      return applications.filter((a) => a.opportunityId === opportunityId);
    },
    [applications]
  );

  return {
    applications,
    apply,
    updateStatus,
    getApplication,
    hasApplied,
    getStudentApplications,
    getOpportunityApplications,
  };
}
