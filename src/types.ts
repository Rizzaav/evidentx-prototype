// =================== Core Domain Types ===================

export type VerificationStatus = 'verified' | 'pending' | 'self-reported';
export type EvidenceType = 'coursework' | 'project' | 'competition' | 'credential' | 'experience';

export type UserRole = 'student' | 'organization' | 'team-creator';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
}

export type SkillCategory =
  | 'Frontend'
  | 'Backend'
  | 'Data & AI'
  | 'Design'
  | 'DevOps'
  | 'Database'
  | 'Languages'
  | 'Soft Skills'
  | 'Cloud'
  | 'Mobile';

export interface Evidence {
  id: string;
  studentId: string;
  type: EvidenceType;
  title: string;
  description: string;
  issuer: string;
  date: string; // ISO
  skills: string[]; // skill ids
  verification: VerificationStatus;
  strength: number; // 0-100 — how strongly this evidence demonstrates the skill
  score?: string; // grade/score label if relevant (e.g., "A (92/100)", "1st Place")
  url?: string;
  evidenceHash?: string; // SHA-256 tamper-proof cryptographic fingerprint
  verificationMethod?: string; // e.g., 'GitHub REST API & AST Parser', 'Institutional SSO', 'Open Badges JSON-LD'
}

export interface StudentSkill {
  studentId: string;
  skillId: string;
  proficiency: number; // 0-100, weighted derived from evidence
  evidenceIds: string[]; // supporting evidence
}

export interface Student {
  id: string;
  name: string;
  email: string;
  program: string;
  year: string;
  university: string;
  bio: string;
  avatarColor: string;
  interests: string[];
  photoUrl?: string; // Optional student headshot / avatar photograph
}

// Opportunity (internship)
export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  location: string;
  type: 'Internship' | 'Research' | 'Hackathon Team' | 'Project';
  duration: string;
  stipend: string;
  description: string;
  postedBy: string; // organization name
  postedDate: string;
  requiredSkills: string[]; // skill ids
  preferredSkills: string[]; // skill ids
  minEvidenceStrength?: number; // optional threshold
}

export interface TeamRequirement {
  id: string;
  title: string;
  organization: string;
  description: string;
  roles: TeamRole[];
  requiredSkills: string[]; // skill ids the team needs overall
  createdDate: string;
}

export interface TeamRole {
  id: string;
  name: string;
  requiredSkills: string[]; // skill ids
  description: string;
}

// =================== Matching Output ===================

export interface SkillMatch {
  skillId: string;
  studentProficiency: number; // 0-100, 0 if missing
  status: 'matched' | 'partial' | 'missing';
  evidenceTitles: string[];
  evidenceStrength: number; // best evidence strength
  required: boolean; // required vs preferred
}

export interface MatchResult {
  studentId: string;
  targetId: string; // opportunity or team id
  targetType: 'opportunity' | 'team';
  matchScore: number; // 0-100
  matchedSkills: SkillMatch[];
  partialSkills: SkillMatch[];
  missingSkills: SkillMatch[];
  supportingEvidence: { skillId: string; skillName: string; evidence: string[] }[];
  explanation: string;
  fairExplanation: string;
  strengths: string[];
  gaps: string[];
}

export interface TeamCandidateMatch {
  studentId: string;
  rolesFit: { roleId: string; roleName: string; fitScore: number; matchedSkills: SkillMatch[] }[];
  overallScore: number;
  contributedSkills: string[]; // skill ids this student brings that team needs
  explanation: string;
}

export interface TeamComposition {
  candidates: TeamCandidateMatch[];
  filledRoles: string[]; // role ids with at least one strong candidate
  missingSkills: string[]; // skill ids not covered by any selected candidate
  coverage: { skillId: string; covered: boolean; coveredBy: string[] }[];
}

export interface RecommendedDevelopment {
  skillId: string;
  skillName: string;
  status: 'partial' | 'missing';
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

// =================== Applications ===================
export type ApplicationStatus = 'Applied' | 'Reviewing' | 'Shortlisted' | 'Interviewing' | 'Offered' | 'Rejected';

export interface Application {
  id: string;
  studentId: string;
  opportunityId: string;
  appliedDate: string;
  status: ApplicationStatus;
  notes?: string;
  matchScoreAtApply?: number;
}

