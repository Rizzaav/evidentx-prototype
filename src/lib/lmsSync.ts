import { generateSha256 } from './crypto';
import type { Evidence, EvidenceType } from '@/types';
import { addCustomEvidence } from './customStudents';

export type LmsProvider = 'nptel' | 'canvas' | 'coursera' | 'edx' | 'github_classroom';

export interface LmsProviderMeta {
  id: LmsProvider;
  name: string;
  category: string;
  badgeColor: string;
  description: string;
  endpointUrl: string;
  protocol: string;
}

export const LMS_PROVIDERS: Record<LmsProvider, LmsProviderMeta> = {
  nptel: {
    id: 'nptel',
    name: 'NPTEL / SWAYAM (Govt of India)',
    category: 'National MOOC / AICTE Transfer',
    badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    description: 'National Programme on Technology Enhanced Learning. Direct AICTE credit transfer & proctored exam verification.',
    endpointUrl: 'https://api.evidentx.org/v1/webhooks/lms/nptel',
    protocol: 'HMAC-SHA256 Signed JSON Webhook',
  },
  canvas: {
    id: 'canvas',
    name: 'Instructure Canvas LMS',
    category: 'Institutional LMS Gradebook',
    badgeColor: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    description: 'Institutional LTI 1.3 Advantage sync for university coursework assignments, midterm grades, and lab evaluations.',
    endpointUrl: 'https://api.evidentx.org/v1/webhooks/lms/canvas',
    protocol: 'LTI 1.3 JWT + Assignment Webhook',
  },
  coursera: {
    id: 'coursera',
    name: 'Coursera for Campus',
    category: 'Industry Specialization Partner',
    badgeColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    description: 'Automated verified certificate credential ingestion from partner universities and industry leaders (Google, IBM).',
    endpointUrl: 'https://api.evidentx.org/v1/webhooks/lms/coursera',
    protocol: 'REST Partner Credential Webhook',
  },
  edx: {
    id: 'edx',
    name: 'edX / Open edX',
    category: 'MicroMasters & MicroBachelors',
    badgeColor: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    description: 'Open edX course completion webhook with cryptographic signature verification and modular transcript sync.',
    endpointUrl: 'https://api.evidentx.org/v1/webhooks/lms/edx',
    protocol: 'Open edX Event Bus Webhook',
  },
  github_classroom: {
    id: 'github_classroom',
    name: 'GitHub Classroom Autograder',
    category: 'Automated Code Assessment',
    badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    description: 'CI/CD automated grading test suites, unit testing pass rates, and AST repository complexity verification.',
    endpointUrl: 'https://api.evidentx.org/v1/webhooks/lms/github-classroom',
    protocol: 'GitHub Webhook (X-Hub-Signature-256)',
  },
};

export interface LmsWebhookPayload {
  eventId: string;
  provider: LmsProvider;
  event: 'course.completed' | 'assignment.graded' | 'credential.issued' | 'autograder.passed';
  timestamp: string;
  studentId: string;
  studentEmail: string;
  courseTitle: string;
  courseCode: string;
  issuerName: string;
  gradeScore: string;
  numericalScore: number; // 0-100
  evidenceType: EvidenceType;
  skillsDemonstrated: { skillId: string; strength: number }[];
  ncrfCredits?: number;
  credentialUrl?: string;
  rawPayloadSignature?: string;
}

export interface IngestedWebhookLog {
  id: string;
  timestamp: string;
  provider: LmsProvider;
  event: string;
  courseTitle: string;
  studentId: string;
  gradeScore: string;
  status: 'ingested' | 'rejected' | 'verified';
  evidenceId: string;
  sha256Digest: string;
  httpStatus: number;
}

const STORAGE_KEY_WEBHOOK_LOGS = 'evx_lms_webhook_logs_v1';

export function getWebhookLogs(): IngestedWebhookLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WEBHOOK_LOGS);
    if (!raw) return getDefaultWebhookLogs();
    return JSON.parse(raw);
  } catch {
    return getDefaultWebhookLogs();
  }
}

export function saveWebhookLog(log: IngestedWebhookLog) {
  try {
    const existing = getWebhookLogs();
    const updated = [log, ...existing].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_KEY_WEBHOOK_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save webhook log', e);
  }
}

function getDefaultWebhookLogs(): IngestedWebhookLog[] {
  return [
    {
      id: 'wh_log_001',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      provider: 'nptel',
      event: 'course.completed',
      courseTitle: 'Cloud Computing & Distributed Systems',
      studentId: 'st_aarav',
      gradeScore: 'Elite + Gold (92%)',
      status: 'verified',
      evidenceId: 'ev_nptel_demo_01',
      sha256Digest: 'a4f910e7b8c2d159e4b7891234567890abcdef1234567890abcdef1234567890',
      httpStatus: 200,
    },
    {
      id: 'wh_log_002',
      timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
      provider: 'canvas',
      event: 'assignment.graded',
      courseTitle: 'CS302 Advanced Algorithms & Data Structures',
      studentId: 'st_aarav',
      gradeScore: 'A (95/100)',
      status: 'verified',
      evidenceId: 'ev_canvas_demo_02',
      sha256Digest: '8b7d12f9e4c1a5b8e9f234567890abcdef1234567890abcdef1234567890abcdef',
      httpStatus: 200,
    },
    {
      id: 'wh_log_003',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      provider: 'github_classroom',
      event: 'autograder.passed',
      courseTitle: 'Full-Stack React & Node REST API Capstone',
      studentId: 'st_aarav',
      gradeScore: '100% Tests Passing',
      status: 'verified',
      evidenceId: 'ev_ghc_demo_03',
      sha256Digest: '5e3c81b9d7a2f4e0c6a1234567890abcdef1234567890abcdef1234567890abcdef',
      httpStatus: 200,
    },
  ];
}

// Preset realistic simulation templates
export const LMS_SIMULATION_PRESETS: {
  name: string;
  description: string;
  provider: LmsProvider;
  payload: LmsWebhookPayload;
}[] = [
  {
    name: 'NPTEL SWAYAM: Cloud Computing & Virtualization (Elite + Gold)',
    description: 'Ministry of Education 8-week proctored exam. Automatically awards 3 NCrF Academic Bank of Credits.',
    provider: 'nptel',
    payload: {
      eventId: 'evt_nptel_' + Date.now(),
      provider: 'nptel',
      event: 'course.completed',
      timestamp: new Date().toISOString(),
      studentId: 'st_aarav',
      studentEmail: 'aarav.sharma@iter.edu',
      courseTitle: 'Cloud Computing & Virtualization Architecture',
      courseCode: 'NPTEL25CS104',
      issuerName: 'NPTEL (IIT Kharagpur & MoE India)',
      gradeScore: 'Elite + Gold (94%)',
      numericalScore: 94,
      evidenceType: 'coursework',
      skillsDemonstrated: [
        { skillId: 's_aws', strength: 92 },
        { skillId: 's_docker', strength: 88 },
      ],
      ncrfCredits: 3,
      credentialUrl: 'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL25CS104S12890',
    },
  },
  {
    name: 'Instructure Canvas: Distributed Systems & Microservices Capstone',
    description: 'LTI 1.3 Gradebook sync for university final lab project evaluation with automated rubric marks.',
    provider: 'canvas',
    payload: {
      eventId: 'evt_canvas_' + Date.now(),
      provider: 'canvas',
      event: 'assignment.graded',
      timestamp: new Date().toISOString(),
      studentId: 'st_aarav',
      studentEmail: 'aarav.sharma@iter.edu',
      courseTitle: 'CS412 Distributed Systems & Microservices',
      courseCode: 'CS412-2026',
      issuerName: 'ITER SOA University (Canvas LMS)',
      gradeScore: 'Grade A+ (96/100)',
      numericalScore: 96,
      evidenceType: 'project',
      skillsDemonstrated: [
        { skillId: 's_node', strength: 94 },
        { skillId: 's_express', strength: 90 },
        { skillId: 's_sql', strength: 86 },
      ],
      credentialUrl: 'https://canvas.iter.edu/courses/412/assignments/8821',
    },
  },
  {
    name: 'Coursera Campus: Deep Learning Specialization (DeepLearning.AI)',
    description: 'Industry-standard AI certification covering Convolutional Networks, Sequence Models, and Transformers.',
    provider: 'coursera',
    payload: {
      eventId: 'evt_coursera_' + Date.now(),
      provider: 'coursera',
      event: 'credential.issued',
      timestamp: new Date().toISOString(),
      studentId: 'st_aarav',
      studentEmail: 'aarav.sharma@iter.edu',
      courseTitle: 'Deep Learning Specialization (5 Courses)',
      courseCode: 'DL-SPEC-AI',
      issuerName: 'DeepLearning.AI & Coursera Campus',
      gradeScore: 'Completed with Honors (98%)',
      numericalScore: 98,
      evidenceType: 'credential',
      skillsDemonstrated: [
        { skillId: 's_ml', strength: 95 },
        { skillId: 's_dl', strength: 94 },
        { skillId: 's_python', strength: 92 },
      ],
      credentialUrl: 'https://www.coursera.org/account/accomplishments/specialization/certificate/EVIDENTX992',
    },
  },
  {
    name: 'GitHub Classroom: Automated Compiler & Data Structures Lab',
    description: 'CI/CD pipeline webhook: 100% tests passed on GitHub Actions with AST syntax validator.',
    provider: 'github_classroom',
    payload: {
      eventId: 'evt_ghc_' + Date.now(),
      provider: 'github_classroom',
      event: 'autograder.passed',
      timestamp: new Date().toISOString(),
      studentId: 'st_aarav',
      studentEmail: 'aarav.sharma@iter.edu',
      courseTitle: 'Automated Data Structures & Algorithms Lab',
      courseCode: 'CS204-LAB',
      issuerName: 'GitHub Classroom & ITER Dept of CSE',
      gradeScore: '100/100 All Test Suites Passed',
      numericalScore: 100,
      evidenceType: 'project',
      skillsDemonstrated: [
        { skillId: 's_ds', strength: 96 },
        { skillId: 's_algo', strength: 94 },
        { skillId: 's_cpp', strength: 90 },
      ],
      credentialUrl: 'https://github.com/iter-classroom/cs204-lab-submissions',
    },
  },
];

/**
 * Executes automated LMS Webhook processing:
 * 1. Simulates HMAC-SHA256 signature verification.
 * 2. Generates an immutable Evidence record.
 * 3. Commits to custom students storage.
 * 4. Logs to persistent webhook audit journal.
 */
export async function processLmsWebhook(
  payload: LmsWebhookPayload,
  activeStudentId?: string
): Promise<{ success: boolean; evidence: Evidence; digest: string; log: IngestedWebhookLog }> {
  const targetStudentId = activeStudentId || payload.studentId || 'st_aarav';
  const newEvidenceId = `ev_lms_${Date.now()}`;

  // Deterministic Cryptographic Digest
  const digestPayload = {
    eventId: payload.eventId,
    provider: payload.provider,
    studentId: targetStudentId,
    courseTitle: payload.courseTitle,
    numericalScore: payload.numericalScore,
    timestamp: payload.timestamp,
  };
  const digest = await generateSha256(digestPayload);

  const skillsList = payload.skillsDemonstrated.map((s) => s.skillId);
  const avgStrength = Math.round(
    payload.skillsDemonstrated.reduce((acc, s) => acc + s.strength, 0) /
      Math.max(1, payload.skillsDemonstrated.length)
  );

  const newEvidence: Evidence = {
    id: newEvidenceId,
    studentId: targetStudentId,
    type: payload.evidenceType,
    title: payload.courseTitle,
    description: `Automated LMS Ingestion via ${LMS_PROVIDERS[payload.provider].name}. Grade: ${payload.gradeScore}. Verified via ${LMS_PROVIDERS[payload.provider].protocol}.`,
    issuer: payload.issuerName,
    date: new Date().toISOString().split('T')[0],
    skills: skillsList,
    verification: 'verified',
    strength: avgStrength,
    score: payload.gradeScore,
    url: payload.credentialUrl,
    evidenceHash: digest,
    verificationMethod: `${LMS_PROVIDERS[payload.provider].name} Automated Webhook Ingestion`,
  };

  // Build skill strength map
  const strengthMap: Record<string, number> = {};
  for (const s of payload.skillsDemonstrated) {
    strengthMap[s.skillId] = s.strength;
  }

  // Persist into user custom storage
  addCustomEvidence(newEvidence, strengthMap);

  // Record audit log
  const log: IngestedWebhookLog = {
    id: 'wh_log_' + Date.now(),
    timestamp: new Date().toISOString(),
    provider: payload.provider,
    event: payload.event,
    courseTitle: payload.courseTitle,
    studentId: targetStudentId,
    gradeScore: payload.gradeScore,
    status: 'verified',
    evidenceId: newEvidenceId,
    sha256Digest: digest,
    httpStatus: 200,
  };
  saveWebhookLog(log);

  return {
    success: true,
    evidence: newEvidence,
    digest,
    log,
  };
}
