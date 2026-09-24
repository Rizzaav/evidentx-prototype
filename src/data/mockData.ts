import type {
  Skill,
  Student,
  Evidence,
  StudentSkill,
  Opportunity,
  TeamRequirement,
} from '@/types';

// =================== Custom Students, Opps & Teams (localStorage) ===================
// User-created entities are merged with demo data so every existing
// function (matchers, passport summary, skill gap) works unchanged.
const CUSTOM_KEY = 'evx_custom_students_v1';
const CUSTOM_OPP_KEY = 'evx_custom_opps_v1';
const CUSTOM_TEAM_KEY = 'evx_custom_teams_v1';

type CustomData = {
  students: Student[];
  evidence: Evidence[];
  evidenceSkillStrength: Record<string, Record<string, number>>;
};

function loadCustomData(): CustomData {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return { students: [], evidence: [], evidenceSkillStrength: {} };
    const parsed = JSON.parse(raw) as CustomData;
    return {
      students: parsed.students ?? [],
      evidence: parsed.evidence ?? [],
      evidenceSkillStrength: parsed.evidenceSkillStrength ?? {},
    };
  } catch {
    return { students: [], evidence: [], evidenceSkillStrength: {} };
  }
}

function loadCustomOpportunities(): Opportunity[] {
  try {
    const raw = localStorage.getItem(CUSTOM_OPP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadCustomTeams(): TeamRequirement[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TEAM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

let _customData: CustomData = loadCustomData();
let _customOpportunities: Opportunity[] = loadCustomOpportunities();
let _customTeams: TeamRequirement[] = loadCustomTeams();


// =================== Skills (20+) ===================
export const SKILLS: Skill[] = [
  { id: 's_react', name: 'React', category: 'Frontend' },
  { id: 's_js', name: 'JavaScript', category: 'Frontend' },
  { id: 's_ts', name: 'TypeScript', category: 'Frontend' },
  { id: 's_node', name: 'Node.js', category: 'Backend' },
  { id: 's_express', name: 'Express', category: 'Backend' },
  { id: 's_python', name: 'Python', category: 'Languages' },
  { id: 's_sql', name: 'SQL', category: 'Database' },
  { id: 's_mongo', name: 'MongoDB', category: 'Database' },
  { id: 's_ml', name: 'Machine Learning', category: 'Data & AI' },
  { id: 's_dl', name: 'Deep Learning', category: 'Data & AI' },
  { id: 's_pandas', name: 'Pandas / NumPy', category: 'Data & AI' },
  { id: 's_uiux', name: 'UI/UX Design', category: 'Design' },
  { id: 's_figma', name: 'Figma', category: 'Design' },
  { id: 's_research', name: 'User Research', category: 'Design' },
  { id: 's_docker', name: 'Docker', category: 'DevOps' },
  { id: 's_aws', name: 'AWS / Cloud', category: 'Cloud' },
  { id: 's_gcp', name: 'GCP', category: 'Cloud' },
  { id: 's_git', name: 'Git', category: 'DevOps' },
  { id: 's_cpp', name: 'C++', category: 'Languages' },
  { id: 's_java', name: 'Java', category: 'Languages' },
  { id: 's_ds', name: 'Data Structures', category: 'Languages' },
  { id: 's_algo', name: 'Algorithms', category: 'Languages' },
  { id: 's_problem', name: 'Problem Solving', category: 'Soft Skills' },
  { id: 's_comm', name: 'Communication', category: 'Soft Skills' },
  { id: 's_team', name: 'Teamwork', category: 'Soft Skills' },
  { id: 's_flutter', name: 'Flutter', category: 'Mobile' },
  { id: 's_android', name: 'Android', category: 'Mobile' },
];

export const skillMap: Record<string, Skill> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s])
);

// =================== Students (5) ===================
export const STUDENTS: Student[] = [
  {
    id: 'st_aarav',
    name: 'Rishav Singh',
    email: 'rishav.s@university.edu',
    program: 'B.Tech Computer Science',
    year: '3rd Year',
    university: 'ITER SOA',
    bio: 'Full-stack developer focused on building web products. Loves hackathons and shipping fast.',
    avatarColor: 'from-brand-500 to-brand-700',
    interests: ['Web Development', 'Open Source', 'Hackathons'],
  },
  {
    id: 'st_diya',
    name: 'Diya Patel',
    email: 'diya.p@university.edu',
    program: 'B.Tech Information Technology',
    year: '4th Year',
    university: 'NIT Surat',
    bio: 'ML & data science enthusiast. Built models for healthcare and sustainability projects.',
    avatarColor: 'from-accent-500 to-accent-700',
    interests: ['Machine Learning', 'Research', 'Data Science'],
  },
  {
    id: 'st_rohan',
    name: 'Rohan Verma',
    email: 'rohan.v@university.edu',
    program: 'B.Des Interaction Design',
    year: '3rd Year',
    university: 'NID Ahmedabad',
    bio: 'Product designer who bridges research and interface. Detail-driven systems thinker.',
    avatarColor: 'from-amber-500 to-orange-600',
    interests: ['Product Design', 'Accessibility', 'Design Systems'],
  },
  {
    id: 'st_kavya',
    name: 'Kavya Reddy',
    email: 'kavya.r@university.edu',
    program: 'B.Tech Computer Science',
    year: '2nd Year',
    university: 'BITS Pilani',
    bio: 'Backend-leaning developer exploring cloud and distributed systems.',
    avatarColor: 'from-rose-500 to-pink-600',
    interests: ['Cloud', 'Backend Systems', 'DevOps'],
  },
  {
    id: 'st_arjun',
    name: 'Arjun Iyer',
    email: 'arjun.i@university.edu',
    program: 'B.Tech Electronics + CS Dual',
    year: '4th Year',
    university: 'IIIT Hyderabad',
    bio: 'Interdisciplinary builder — mobile, embedded, and data pipelines. Hackathon regular.',
    avatarColor: 'from-emerald-500 to-teal-600',
    interests: ['Mobile', 'IoT', 'Full-stack'],
  },
];

export const studentMap: Record<string, Student> = Object.fromEntries(
  STUDENTS.map((s) => [s.id, s])
);
for (const s of _customData.students) studentMap[s.id] = s;

// Merged student map (demo + custom). Rebuilt on demand.
export function getAllStudentMap(): Record<string, Student> {
  const m: Record<string, Student> = { ...studentMap };
  for (const s of _customData.students) m[s.id] = s;
  return m;
}

// =================== Evidence ===================
// Helper to build evidence rows concisely
type E = {
  id: string;
  studentId: string;
  type: Evidence['type'];
  title: string;
  description: string;
  issuer: string;
  date: string;
  skills: { id: string; strength: number }[];
  verification: Evidence['verification'];
  score?: string;
  url?: string;
  evidenceHash?: string;
  verificationMethod?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  aiAuditSummary?: Evidence['aiAuditSummary'];
};

const RAW_EVIDENCE: E[] = [
  // ----- Vishal (full-stack frontend focus) -----
  {
    id: 'ev_aarav_1', studentId: 'st_aarav', type: 'project',
    title: 'Smart Campus Navigation App',
    description: 'Real-time indoor navigation for campus using React + Node.js + Mapbox. 1.2k users.',
    issuer: 'University Hackathon', date: '2025-03-12',
    skills: [{ id: 's_react', strength: 88 }, { id: 's_node', strength: 80 }, { id: 's_js', strength: 82 }, { id: 's_problem', strength: 86 }],
    verification: 'verified', score: '1st Place',
  },
  {
    id: 'ev_aarav_2', studentId: 'st_aarav', type: 'coursework',
    title: 'Web Development Coursework',
    description: 'Built 4 full-stack apps as part of CS302. Grade A.',
    issuer: 'ITER SOA', date: '2024-11-20',
    skills: [{ id: 's_js', strength: 84 }, { id: 's_react', strength: 80 }, { id: 's_node', strength: 72 }],
    verification: 'verified', score: 'A (92/100)',
  },
  {
    id: 'ev_aarav_3', studentId: 'st_aarav', type: 'project',
    title: 'E-Commerce Backend Project',
    description: 'REST API with Node.js, Express, MongoDB. JWT auth, payments, inventory.',
    issuer: 'Personal Project', date: '2025-01-05',
    skills: [{ id: 's_node', strength: 85 }, { id: 's_express', strength: 82 }, { id: 's_mongo', strength: 74 }, { id: 's_sql', strength: 45 }],
    verification: 'pending',
    evidenceHash: 'c9f872b1587e914041b65e23da049281a1795e1e19483c68352bfa7b89791102',
    verificationMethod: 'AI Forensic Pre-Screen & HITL Review Queue',
    aiAuditSummary: {
      confidenceScore: 88,
      nameMatch: true,
      extractedRecipient: 'Aarav Sharma',
      issuerDetected: 'GitHub Repository Artifact',
      flags: [
        '✅ Candidate Identity Verified: Full name "Aarav Sharma" detected in project repository README.',
        '🏛️ Recognized Platform: GitHub source code archive submitted.',
        '🎯 Competency Mapping: 4 backend competencies correlated (Node.js, Express, MongoDB, SQL).'
      ],
      skillsDetected: ['Node.js', 'Express', 'MongoDB', 'SQL'],
      ocrSnippet: 'E-Commerce backend REST API with JWT authorization, stripe webhooks, order processing pipeline.',
      analyzedAt: '2026-09-20T10:30:00Z',
    },
  },
  {
    id: 'ev_aarav_4', studentId: 'st_aarav', type: 'credential',
    title: 'Cloud Fundamentals Credential',
    description: 'AWS Cloud Practitioner foundational certification.',
    issuer: 'Amazon Web Services', date: '2025-06-01',
    skills: [{ id: 's_aws', strength: 78 }],
    verification: 'verified', score: 'Pass',
  },
  {
    id: 'ev_aarav_5', studentId: 'st_aarav', type: 'coursework',
    title: 'Data Structures & Algorithms',
    description: 'Core CS coursework covering trees, graphs, DP. Strong problem-solving.',
    issuer: 'ITER SOA', date: '2024-05-10',
    skills: [{ id: 's_ds', strength: 90 }, { id: 's_algo', strength: 88 }, { id: 's_problem', strength: 91 }],
    verification: 'verified', score: 'A (95/100)',
  },
  {
    id: 'ev_aarav_6', studentId: 'st_aarav', type: 'competition',
    title: 'Smart India Hackathon 2025',
    description: 'National finalist — built disaster-response coordination platform.',
    issuer: 'Govt. of India', date: '2025-04-02',
    skills: [{ id: 's_react', strength: 84 }, { id: 's_team', strength: 88 }, { id: 's_comm', strength: 82 }],
    verification: 'verified', score: 'Finalist (Top 6)',
  },
  {
    id: 'ev_aarav_7', studentId: 'st_aarav', type: 'coursework',
    title: 'Database Systems',
    description: 'SQL, normalization, transactions. Moderate coverage.',
    issuer: 'ITER SOA', date: '2024-08-15',
    skills: [{ id: 's_sql', strength: 48 }],
    verification: 'verified', score: 'B+ (78/100)',
  },
  {
    id: 'ev_aarav_8', studentId: 'st_aarav', type: 'credential',
    title: 'TypeScript Advanced',
    description: 'Online credential covering generics, type utilities.',
    issuer: 'Frontend Masters', date: '2025-02-18',
    skills: [{ id: 's_ts', strength: 76 }],
    verification: 'verified',
  },

  // ----- Diya (ML/data focus) -----
  {
    id: 'ev_diya_1', studentId: 'st_diya', type: 'project',
    title: 'Diabetes Prediction Model',
    description: 'XGBoost + feature engineering. 0.91 ROC-AUC on held-out set.',
    issuer: 'Research Lab', date: '2025-02-10',
    skills: [{ id: 's_ml', strength: 88 }, { id: 's_pandas', strength: 85 }, { id: 's_python', strength: 84 }],
    verification: 'verified',
  },
  {
    id: 'ev_diya_2', studentId: 'st_diya', type: 'coursework',
    title: 'Machine Learning Coursework',
    description: 'Supervised + unsupervised ML. Implemented core algorithms from scratch.',
    issuer: 'NIT Surat', date: '2024-12-05',
    skills: [{ id: 's_ml', strength: 86 }, { id: 's_python', strength: 80 }],
    verification: 'verified', score: 'A (94/100)',
  },
  {
    id: 'ev_diya_3', studentId: 'st_diya', type: 'project',
    title: 'Medical Image Segmentation',
    description: 'U-Net deep learning model for tumor segmentation. 88% IoU.',
    issuer: 'Healthcare Hackathon', date: '2025-05-20',
    skills: [{ id: 's_dl', strength: 82 }, { id: 's_ml', strength: 78 }, { id: 's_problem', strength: 80 }],
    verification: 'verified', score: '2nd Place',
  },
  {
    id: 'ev_diya_4', studentId: 'st_diya', type: 'credential',
    title: 'TensorFlow Developer Certificate',
    description: 'Official TensorFlow certification.',
    issuer: 'Google', date: '2025-03-15',
    skills: [{ id: 's_dl', strength: 80 }, { id: 's_ml', strength: 78 }],
    verification: 'verified',
  },
  {
    id: 'ev_diya_5', studentId: 'st_diya', type: 'coursework',
    title: 'Data Analysis with Python',
    description: 'Pandas, NumPy, visualization, statistical analysis.',
    issuer: 'NIT Surat', date: '2024-09-10',
    skills: [{ id: 's_pandas', strength: 88 }, { id: 's_python', strength: 82 }],
    verification: 'verified', score: 'A (91/100)',
  },
  {
    id: 'ev_diya_6', studentId: 'st_diya', type: 'coursework',
    title: 'Database Management Systems',
    description: 'SQL queries, schema design, indexing.',
    issuer: 'NIT Surat', date: '2024-07-22',
    skills: [{ id: 's_sql', strength: 75 }],
    verification: 'verified', score: 'A- (88/100)',
  },
  {
    id: 'ev_diya_7', studentId: 'st_diya', type: 'competition',
    title: 'Kaggle Data Science Bowl',
    description: 'Top 8% finish in computer vision competition.',
    issuer: 'Kaggle', date: '2025-01-30',
    skills: [{ id: 's_ml', strength: 84 }, { id: 's_pandas', strength: 82 }, { id: 's_problem', strength: 85 }],
    verification: 'verified', score: 'Top 8%',
  },
  {
    id: 'ev_diya_8', studentId: 'st_diya', type: 'credential',
    title: 'Google Cloud ML Engineer',
    description: 'Vertex AI, MLOps fundamentals.',
    issuer: 'Google Cloud', date: '2025-06-10',
    skills: [{ id: 's_gcp', strength: 72 }, { id: 's_ml', strength: 70 }],
    verification: 'verified',
  },

  // ----- Rohan (design focus) -----
  {
    id: 'ev_rohan_1', studentId: 'st_rohan', type: 'project',
    title: 'Fintech App Redesign',
    description: 'End-to-end UX redesign — research, wireframes, hi-fi prototype in Figma.',
    issuer: 'Design Studio Intern', date: '2025-04-15',
    skills: [{ id: 's_uiux', strength: 90 }, { id: 's_figma', strength: 88 }, { id: 's_research', strength: 82 }],
    verification: 'verified',
  },
  {
    id: 'ev_rohan_2', studentId: 'st_rohan', type: 'coursework',
    title: 'Human-Computer Interaction',
    description: 'Heuristic evaluation, usability testing, prototyping.',
    issuer: 'NID Ahmedabad', date: '2024-11-01',
    skills: [{ id: 's_uiux', strength: 85 }, { id: 's_research', strength: 80 }],
    verification: 'verified', score: 'A (93/100)',
  },
  {
    id: 'ev_rohan_3', studentId: 'st_rohan', type: 'project',
    title: 'Design System for NGO Portal',
    description: 'Component library, tokens, accessibility audit (WCAG AA).',
    issuer: 'Pro-bono Project', date: '2025-02-20',
    skills: [{ id: 's_figma', strength: 84 }, { id: 's_uiux', strength: 80 }, { id: 's_comm', strength: 76 }],
    verification: 'verified',
  },
  {
    id: 'ev_rohan_4', studentId: 'st_rohan', type: 'competition',
    title: 'Adobe Design Achievement Awards',
    description: 'Semi-finalist — interaction design category.',
    issuer: 'Adobe', date: '2025-05-08',
    skills: [{ id: 's_uiux', strength: 82 }, { id: 's_figma', strength: 78 }],
    verification: 'verified', score: 'Semi-finalist',
  },
  {
    id: 'ev_rohan_5', studentId: 'st_rohan', type: 'credential',
    title: 'Google UX Design Certificate',
    description: '7-course professional certificate in UX process.',
    issuer: 'Google', date: '2024-12-20',
    skills: [{ id: 's_uiux', strength: 78 }, { id: 's_research', strength: 75 }],
    verification: 'verified',
  },
  {
    id: 'ev_rohan_6', studentId: 'st_rohan', type: 'coursework',
    title: 'Visual Design Foundations',
    description: 'Typography, color, layout, grid systems.',
    issuer: 'NID Ahmedabad', date: '2024-08-30',
    skills: [{ id: 's_uiux', strength: 76 }],
    verification: 'verified', score: 'A (90/100)',
  },
  {
    id: 'ev_rohan_7', studentId: 'st_rohan', type: 'project',
    title: 'Frontend Handoff Prototype',
    description: 'Built interactive React prototype from Figma for handoff.',
    issuer: 'Course Project', date: '2025-03-25',
    skills: [{ id: 's_react', strength: 62 }, { id: 's_js', strength: 60 }],
    verification: 'pending',
    evidenceHash: 'b4a187e029f631a0e83b4c12d45819e6473210985a7201bc6382109472301984',
    verificationMethod: 'AI Forensic Pre-Screen & HITL Review Queue',
    aiAuditSummary: {
      confidenceScore: 84,
      nameMatch: true,
      extractedRecipient: 'Rohan Mehta',
      issuerDetected: 'NID Coursework Prototype',
      flags: [
        '✅ Candidate Identity Verified: Name matched to Rohan Mehta.',
        '🏫 Institutional Project: NID interaction design capstone.',
        '🎯 Competency Mapping: 2 frontend skills identified (React, JavaScript).'
      ],
      skillsDetected: ['React', 'JavaScript'],
      ocrSnippet: 'Interactive Figma design system handoff implemented with component library and storybook.',
      analyzedAt: '2026-09-18T14:20:00Z',
    },
  },

  // ----- Kavya (backend/cloud) -----
  {
    id: 'ev_kavya_1', studentId: 'st_kavya', type: 'project',
    title: 'Distributed URL Shortener',
    description: 'Go-style design in Node. Redis cache, base62, horizontal scaling notes.',
    issuer: 'Personal Project', date: '2025-03-01',
    skills: [{ id: 's_node', strength: 78 }, { id: 's_aws', strength: 72 }, { id: 's_problem', strength: 80 }],
    verification: 'verified',
  },
  {
    id: 'ev_kavya_2', studentId: 'st_kavya', type: 'coursework',
    title: 'Cloud Computing',
    description: 'AWS services, IaC, deployment pipelines.',
    issuer: 'BITS Pilani', date: '2025-04-20',
    skills: [{ id: 's_aws', strength: 82 }, { id: 's_docker', strength: 75 }],
    verification: 'verified', score: 'A (90/100)',
  },
  {
    id: 'ev_kavya_3', studentId: 'st_kavya', type: 'coursework',
    title: 'Backend Engineering',
    description: 'REST, auth, ORMs, microservices basics.',
    issuer: 'BITS Pilani', date: '2024-10-12',
    skills: [{ id: 's_node', strength: 80 }, { id: 's_express', strength: 78 }, { id: 's_sql', strength: 70 }],
    verification: 'verified', score: 'A- (87/100)',
  },
  {
    id: 'ev_kavya_4', studentId: 'st_kavya', type: 'credential',
    title: 'AWS Solutions Architect Associate',
    description: 'Official AWS SAA certification.',
    issuer: 'Amazon Web Services', date: '2025-06-05',
    skills: [{ id: 's_aws', strength: 85 }, { id: 's_docker', strength: 70 }],
    verification: 'verified',
  },
  {
    id: 'ev_kavya_5', studentId: 'st_kavya', type: 'project',
    title: 'CI/CD Pipeline Project',
    description: 'Dockerized Node app with GitHub Actions deploy to EC2.',
    issuer: 'DevOps Workshop', date: '2025-02-15',
    skills: [{ id: 's_docker', strength: 78 }, { id: 's_git', strength: 82 }, { id: 's_aws', strength: 70 }],
    verification: 'verified',
  },
  {
    id: 'ev_kavya_6', studentId: 'st_kavya', type: 'coursework',
    title: 'Database Systems',
    description: 'PostgreSQL, indexing, transactions.',
    issuer: 'BITS Pilani', date: '2024-09-01',
    skills: [{ id: 's_sql', strength: 78 }, { id: 's_mongo', strength: 60 }],
    verification: 'verified', score: 'A (89/100)',
  },
  {
    id: 'ev_kavya_7', studentId: 'st_kavya', type: 'competition',
    title: 'Cloud Hackathon — Serverless Challenge',
    description: 'Built event-driven serverless app on Lambda.',
    issuer: 'AWS User Group', date: '2025-05-10',
    skills: [{ id: 's_aws', strength: 80 }, { id: 's_node', strength: 72 }, { id: 's_team', strength: 78 }],
    verification: 'verified', score: 'Winner',
  },
  {
    id: 'ev_kavya_8', studentId: 'st_kavya', type: 'coursework',
    title: 'Data Structures',
    description: 'Core DS coursework.',
    issuer: 'BITS Pilani', date: '2024-06-15',
    skills: [{ id: 's_ds', strength: 80 }, { id: 's_algo', strength: 78 }],
    verification: 'verified', score: 'B+ (84/100)',
  },

  // ----- Arjun (interdisciplinary mobile/data) -----
  {
    id: 'ev_arjun_1', studentId: 'st_arjun', type: 'project',
    title: 'HealthSync Mobile App',
    description: 'Flutter app for patient vitals tracking with BLE device integration.',
    issuer: 'Capstone Project', date: '2025-04-10',
    skills: [{ id: 's_flutter', strength: 85 }, { id: 's_android', strength: 78 }, { id: 's_problem', strength: 82 }],
    verification: 'verified',
  },
  {
    id: 'ev_arjun_2', studentId: 'st_arjun', type: 'coursework',
    title: 'Mobile Application Development',
    description: 'Flutter + Dart, state management, REST integration.',
    issuer: 'IIIT Hyderabad', date: '2025-01-18',
    skills: [{ id: 's_flutter', strength: 82 }, { id: 's_android', strength: 75 }],
    verification: 'verified', score: 'A (91/100)',
  },
  {
    id: 'ev_arjun_3', studentId: 'st_arjun', type: 'project',
    title: 'Sensor Data Pipeline',
    description: 'Python pipeline ingesting IoT sensor data into Postgres + dashboards.',
    issuer: 'Research Project', date: '2025-02-25',
    skills: [{ id: 's_python', strength: 80 }, { id: 's_sql', strength: 72 }, { id: 's_pandas', strength: 70 }],
    verification: 'verified',
  },
  {
    id: 'ev_arjun_4', studentId: 'st_arjun', type: 'competition',
    title: 'IoT Innovation Challenge',
    description: 'Built low-cost air quality monitor + dashboard.',
    issuer: 'TechFest', date: '2025-03-22',
    skills: [{ id: 's_flutter', strength: 76 }, { id: 's_problem', strength: 84 }, { id: 's_team', strength: 80 }],
    verification: 'verified', score: '2nd Place',
  },
  {
    id: 'ev_arjun_5', studentId: 'st_arjun', type: 'coursework',
    title: 'Data Structures & Algorithms',
    description: 'Strong fundamentals; competitive programming participant.',
    issuer: 'IIIT Hyderabad', date: '2024-05-20',
    skills: [{ id: 's_ds', strength: 85 }, { id: 's_algo', strength: 86 }, { id: 's_cpp', strength: 80 }],
    verification: 'verified', score: 'A (92/100)',
  },
  {
    id: 'ev_arjun_6', studentId: 'st_arjun', type: 'credential',
    title: 'Flutter & Dart Essentials',
    description: 'Online credential for mobile dev.',
    issuer: 'Udemy', date: '2024-12-10',
    skills: [{ id: 's_flutter', strength: 78 }, { id: 's_android', strength: 70 }],
    verification: 'verified',
  },
  {
    id: 'ev_arjun_7', studentId: 'st_arjun', type: 'project',
    title: 'React Admin Dashboard',
    description: 'Built internal admin panel in React + TypeScript.',
    issuer: 'Internship', date: '2025-05-15',
    skills: [{ id: 's_react', strength: 74 }, { id: 's_ts', strength: 72 }, { id: 's_js', strength: 70 }],
    verification: 'verified',
  },
  {
    id: 'ev_arjun_8', studentId: 'st_arjun', type: 'coursework',
    title: 'Database Systems',
    description: 'SQL fundamentals + NoSQL overview.',
    issuer: 'IIIT Hyderabad', date: '2024-08-10',
    skills: [{ id: 's_sql', strength: 68 }],
    verification: 'verified', score: 'B+ (82/100)',
  },
];

export const EVIDENCE: Evidence[] = RAW_EVIDENCE.map((e) => {
  const flat: Evidence = {
    id: e.id,
    studentId: e.studentId,
    type: e.type,
    title: e.title,
    description: e.description,
    issuer: e.issuer,
    date: e.date,
    skills: e.skills.map((s) => s.id),
    verification: e.verification,
    strength: Math.max(...e.skills.map((s) => s.strength)),
    score: e.score,
    url: e.url,
    evidenceHash: e.evidenceHash,
    verificationMethod: e.verificationMethod,
    verifiedBy: e.verifiedBy,
    verifiedAt: e.verifiedAt,
    rejectionReason: e.rejectionReason,
    aiAuditSummary: e.aiAuditSummary,
  };
  return flat;
});

// Per-skill evidence strength lookup (skillId -> strength) per evidence
export const evidenceSkillStrength: Record<string, Record<string, number>> = {};
for (const e of RAW_EVIDENCE) {
  evidenceSkillStrength[e.id] = {};
  for (const s of e.skills) evidenceSkillStrength[e.id][s.id] = s.strength;
}

// Merge custom evidence skill strengths into the lookup.
for (const [evId, map] of Object.entries(loadCustomData().evidenceSkillStrength)) {
  evidenceSkillStrength[evId] = map;
}

// Merged evidence map (demo + custom).
function buildEvidenceMap(): Record<string, Evidence> {
  const m: Record<string, Evidence> = Object.fromEntries(EVIDENCE.map((e) => [e.id, e]));
  for (const e of _customData.evidence) m[e.id] = e;
  return m;
}

export const evidenceMap: Record<string, Evidence> = buildEvidenceMap();

// =================== Derive Student Skills from Evidence ===================
// proficiency = weighted average of evidence strengths, with verification bonus.
function deriveStudentSkills(): StudentSkill[] {
  const out: StudentSkill[] = [];
  for (const student of STUDENTS) {
    const bySkill = new Map<string, string[]>();
    for (const e of EVIDENCE) {
      if (e.studentId !== student.id) continue;
      for (const skId of e.skills) {
        if (!bySkill.has(skId)) bySkill.set(skId, []);
        bySkill.get(skId)!.push(e.id);
      }
    }
    for (const [skillId, evIds] of bySkill) {
      let total = 0;
      let weightSum = 0;
      for (const evId of evIds) {
        const strength = evidenceSkillStrength[evId][skillId] ?? 50;
        const ver = evidenceMap[evId].verification;
        const verMult = ver === 'verified' ? 1.0 : ver === 'pending' ? 0.8 : ver === 'self-reported' ? 0.6 : 0.0;
        const w = verMult;
        total += strength * w;
        weightSum += w;
      }
      const proficiency = weightSum > 0 ? Math.round(total / weightSum) : 0;
      out.push({ studentId: student.id, skillId, proficiency, evidenceIds: evIds });
    }
  }
  return out;
}

export const STUDENT_SKILLS: StudentSkill[] = deriveStudentSkills();

// =================== Custom Students (localStorage) ===================
export function getCustomData(): CustomData {
  return _customData;
}

let _dataVersion = 1;
export function getDataVersion(): number {
  return _dataVersion;
}

let _studentSkillsById: Map<string, StudentSkill[]> | null = null;
let _studentEvidenceById: Map<string, Evidence[]> | null = null;

export function _reloadCustomData() {
  _dataVersion++;
  _customData = loadCustomData();
  _customOpportunities = loadCustomOpportunities();
  _customTeams = loadCustomTeams();

  for (const k of Object.keys(studentMap)) delete studentMap[k];
  for (const s of STUDENTS) studentMap[s.id] = s;
  for (const s of _customData.students) studentMap[s.id] = s;

  for (const k of Object.keys(evidenceMap)) delete evidenceMap[k];
  for (const e of EVIDENCE) evidenceMap[e.id] = e;
  for (const e of _customData.evidence) evidenceMap[e.id] = e;

  for (const k of Object.keys(opportunityMap)) delete opportunityMap[k];
  for (const o of OPPORTUNITIES) opportunityMap[o.id] = o;
  for (const o of _customOpportunities) opportunityMap[o.id] = o;

  for (const k of Object.keys(teamMap)) delete teamMap[k];
  for (const t of TEAMS) teamMap[t.id] = t;
  for (const t of _customTeams) teamMap[t.id] = t;

  _mergedStudents = null;
  _mergedEvidence = null;
  _mergedSkills = null;
  _studentSkillsById = null;
  _studentEvidenceById = null;
}


function deriveCustomSkills(): StudentSkill[] {
  const out: StudentSkill[] = [];
  for (const student of _customData.students) {
    const bySkill = new Map<string, string[]>();
    for (const e of _customData.evidence) {
      if (e.studentId !== student.id) continue;
      for (const skId of e.skills) {
        if (!bySkill.has(skId)) bySkill.set(skId, []);
        bySkill.get(skId)!.push(e.id);
      }
    }
    for (const [skillId, evIds] of bySkill) {
      let total = 0;
      let weightSum = 0;
      for (const evId of evIds) {
        const strength = _customData.evidenceSkillStrength[evId]?.[skillId] ?? 50;
        const ver = _customData.evidence.find((e) => e.id === evId)?.verification ?? 'self-reported';
        const verMult = ver === 'verified' ? 1.0 : ver === 'pending' ? 0.8 : ver === 'self-reported' ? 0.6 : 0.0;
        total += strength * verMult;
        weightSum += verMult;
      }
      const proficiency = weightSum > 0 ? Math.round(total / weightSum) : 0;
      out.push({ studentId: student.id, skillId, proficiency, evidenceIds: evIds });
    }
  }
  return out;
}

// Merged collections (lazy + cached so matching engine uses custom data too).
let _mergedStudents: Student[] | null = null;
let _mergedEvidence: Evidence[] | null = null;
let _mergedSkills: StudentSkill[] | null = null;

function mergedStudents(): Student[] {
  if (!_mergedStudents) _mergedStudents = [...STUDENTS, ..._customData.students];
  return _mergedStudents;
}
function mergedEvidence(): Evidence[] {
  if (!_mergedEvidence) {
    const map = new Map<string, Evidence>();
    for (const e of EVIDENCE) map.set(e.id, e);
    for (const e of _customData.evidence) map.set(e.id, e);
    _mergedEvidence = Array.from(map.values());
  }
  return _mergedEvidence;
}
function mergedSkills(): StudentSkill[] {
  if (!_mergedSkills) _mergedSkills = [...STUDENT_SKILLS, ...deriveCustomSkills()];
  return _mergedSkills;
}

export function getAllStudents(): Student[] {
  return mergedStudents();
}

export function getStudentSkills(studentId: string): StudentSkill[] {
  if (!_studentSkillsById) {
    _studentSkillsById = new Map();
    for (const s of mergedSkills()) {
      if (!_studentSkillsById.has(s.studentId)) {
        _studentSkillsById.set(s.studentId, []);
      }
      _studentSkillsById.get(s.studentId)!.push(s);
    }
    for (const [, list] of _studentSkillsById) {
      list.sort((a, b) => b.proficiency - a.proficiency);
    }
  }
  return _studentSkillsById.get(studentId) ?? [];
}

export function getStudentEvidence(studentId: string): Evidence[] {
  if (!_studentEvidenceById) {
    _studentEvidenceById = new Map();
    for (const e of mergedEvidence()) {
      if (!_studentEvidenceById.has(e.studentId)) {
        _studentEvidenceById.set(e.studentId, []);
      }
      _studentEvidenceById.get(e.studentId)!.push(e);
    }
    for (const [, list] of _studentEvidenceById) {
      list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    }
  }
  return _studentEvidenceById.get(studentId) ?? [];
}

export function skillName(id: string): string {
  return skillMap[id]?.name ?? id;
}

// =================== Opportunities (5+) ===================
export const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'op_fe_intern',
    title: 'Frontend Developer Intern',
    organization: 'TechFlow Labs',
    location: 'Bengaluru (Hybrid)',
    type: 'Internship',
    duration: '6 months',
    stipend: '₹35,000/mo',
    description:
      'Build customer-facing React applications for our SaaS analytics platform. Work with design systems, optimize performance, and ship features used by 50k+ users.',
    postedBy: 'TechFlow Labs',
    postedDate: '2025-07-01',
    requiredSkills: ['s_react', 's_js', 's_node', 's_sql'],
    preferredSkills: ['s_ts', 's_uiux', 's_git', 's_aws'],
  },
  {
    id: 'op_ml_research',
    title: 'ML Research Intern — Healthcare',
    organization: 'MediCore AI',
    location: 'Remote',
    type: 'Research',
    duration: '4 months',
    stipend: '₹40,000/mo',
    description:
      'Research and productionize ML models for medical imaging. Strong Python + deep learning required; healthcare domain exposure a plus.',
    postedBy: 'MediCore AI',
    postedDate: '2025-07-10',
    requiredSkills: ['s_ml', 's_python', 's_dl', 's_pandas'],
    preferredSkills: ['s_sql', 's_gcp', 's_research', 's_problem'],
  },
  {
    id: 'op_backend_swe',
    title: 'Backend Engineering Intern',
    organization: 'PayBridge',
    location: 'Hyderabad (On-site)',
    type: 'Internship',
    duration: '3 months',
    stipend: '₹30,000/mo',
    description:
      'Design scalable APIs and microservices for a fintech payments platform. Real-world distributed systems work with Node.js + cloud.',
    postedBy: 'PayBridge',
    postedDate: '2025-06-20',
    requiredSkills: ['s_node', 's_sql', 's_express', 's_aws'],
    preferredSkills: ['s_docker', 's_git', 's_mongo', 's_problem'],
  },
  {
    id: 'op_ux_designer',
    title: 'Product Design Intern',
    organization: 'Lumen Studio',
    location: 'Mumbai (Hybrid)',
    type: 'Internship',
    duration: '4 months',
    stipend: '₹28,000/mo',
    description:
      'Own end-to-end design for a B2B product. User research, prototyping, and design system contributions. Figma power user.',
    postedBy: 'Lumen Studio',
    postedDate: '2025-07-05',
    requiredSkills: ['s_uiux', 's_figma', 's_research'],
    preferredSkills: ['s_comm', 's_react', 's_team'],
  },
  {
    id: 'op_mobile_dev',
    title: 'Mobile App Developer Intern',
    organization: 'HealthFirst',
    location: 'Remote',
    type: 'Internship',
    duration: '6 months',
    stipend: '₹32,000/mo',
    description:
      'Build Flutter mobile apps for patient engagement. Work with health data, offline sync, and clean UX.',
    postedBy: 'HealthFirst',
    postedDate: '2025-06-28',
    requiredSkills: ['s_flutter', 's_android', 's_node'],
    preferredSkills: ['s_sql', 's_uiux', 's_git', 's_problem'],
  },
  {
    id: 'op_fullstack',
    title: 'Full-stack Developer Intern',
    organization: 'EduNova',
    location: 'Pune (Hybrid)',
    type: 'Internship',
    duration: '5 months',
    stipend: '₹33,000/mo',
    description:
      'Work across React + Node + SQL on an EdTech platform serving 200k students. Feature ownership end-to-end.',
    postedBy: 'EduNova',
    postedDate: '2025-07-12',
    requiredSkills: ['s_react', 's_node', 's_sql', 's_js'],
    preferredSkills: ['s_ts', 's_aws', 's_uiux', 's_git'],
  },
];

export const opportunityMap: Record<string, Opportunity> = Object.fromEntries(
  OPPORTUNITIES.map((o) => [o.id, o])
);
for (const o of _customOpportunities) opportunityMap[o.id] = o;

export function getAllOpportunities(): Opportunity[] {
  return [...OPPORTUNITIES, ..._customOpportunities];
}

export function addCustomOpportunity(opp: Opportunity) {
  _customOpportunities.unshift(opp);
  opportunityMap[opp.id] = opp;
  localStorage.setItem(CUSTOM_OPP_KEY, JSON.stringify(_customOpportunities));
}

export function removeCustomOpportunity(id: string) {
  _customOpportunities = _customOpportunities.filter((o) => o.id !== id);
  delete opportunityMap[id];
  localStorage.setItem(CUSTOM_OPP_KEY, JSON.stringify(_customOpportunities));
}

// =================== Teams (3+) ===================
export const TEAMS: TeamRequirement[] = [
  {
    id: 'team_ai_health',
    title: 'AI Healthcare Innovation Team',
    organization: 'SIH Grand Challenge',
    description:
      'Multidisciplinary team building an AI-powered clinical decision support tool. Needs frontend, backend, ML, and design.',
    createdDate: '2025-07-15',
    requiredSkills: ['s_react', 's_node', 's_python', 's_ml', 's_uiux', 's_sql'],
    roles: [
      { id: 'r_fe', name: 'Frontend Developer', requiredSkills: ['s_react', 's_js'], description: 'Build the clinician-facing UI.' },
      { id: 'r_be', name: 'Backend Developer', requiredSkills: ['s_node', 's_sql'], description: 'API + data layer for patient records.' },
      { id: 'r_ds', name: 'Data Scientist', requiredSkills: ['s_ml', 's_python'], description: 'Build and validate clinical models.' },
      { id: 'r_ux', name: 'UI/UX Designer', requiredSkills: ['s_uiux', 's_figma'], description: 'Design safe, usable clinician workflows.' },
    ],
  },
  {
    id: 'team_fintech',
    title: 'Fintech Payments Squad',
    organization: 'Innovation Cell',
    description:
      'Build a prototype digital wallet with security and UX focus. Backend-heavy with design polish.',
    createdDate: '2025-07-18',
    requiredSkills: ['s_node', 's_sql', 's_react', 's_uiux', 's_aws', 's_docker'],
    roles: [
      { id: 'r_fe', name: 'Frontend Developer', requiredSkills: ['s_react', 's_js'], description: 'Wallet UI and transaction flows.' },
      { id: 'r_be', name: 'Backend Developer', requiredSkills: ['s_node', 's_sql'], description: 'Payments service + ledger.' },
      { id: 'r_devops', name: 'DevOps Engineer', requiredSkills: ['s_aws', 's_docker'], description: 'CI/CD + secure deployment.' },
      { id: 'r_ux', name: 'UX Designer', requiredSkills: ['s_uiux'], description: 'Trust-focused UX research and design.' },
    ],
  },
  {
    id: 'team_sustain',
    title: 'Sustainability Data Platform Team',
    organization: 'GreenCampus Initiative',
    description:
      'Multidisciplinary team building a campus carbon-footprint analytics platform. Data + mobile + design.',
    createdDate: '2025-07-20',
    requiredSkills: ['s_python', 's_pandas', 's_flutter', 's_uiux', 's_sql', 's_ml'],
    roles: [
      { id: 'r_data', name: 'Data Engineer', requiredSkills: ['s_python', 's_sql'], description: 'Ingest + model sustainability data.' },
      { id: 'r_ml', name: 'ML Engineer', requiredSkills: ['s_ml', 's_pandas'], description: 'Predictive analytics for consumption.' },
      { id: 'r_mobile', name: 'Mobile Developer', requiredSkills: ['s_flutter'], description: 'Student-facing mobile experience.' },
      { id: 'r_ux', name: 'UX Designer', requiredSkills: ['s_uiux'], description: 'Behavior-change design for students.' },
    ],
  },
];

export const teamMap: Record<string, TeamRequirement> = Object.fromEntries(
  TEAMS.map((t) => [t.id, t])
);
for (const t of _customTeams) teamMap[t.id] = t;

export function getAllTeams(): TeamRequirement[] {
  return [...TEAMS, ..._customTeams];
}

export function addCustomTeam(team: TeamRequirement) {
  _customTeams.unshift(team);
  teamMap[team.id] = team;
  localStorage.setItem(CUSTOM_TEAM_KEY, JSON.stringify(_customTeams));
}

export function removeCustomTeam(id: string) {
  _customTeams = _customTeams.filter((t) => t.id !== id);
  delete teamMap[id];
  localStorage.setItem(CUSTOM_TEAM_KEY, JSON.stringify(_customTeams));
}


// =================== Organizations ===================
export const ORGANIZATIONS = [
  { id: 'org_techflow', name: 'TechFlow Labs', industry: 'SaaS Analytics' },
  { id: 'org_medicore', name: 'MediCore AI', industry: 'Healthtech AI' },
  { id: 'org_paybridge', name: 'PayBridge', industry: 'Fintech' },
  { id: 'org_lumen', name: 'Lumen Studio', industry: 'Product Design' },
  { id: 'org_healthfirst', name: 'HealthFirst', industry: 'Healthtech' },
];
