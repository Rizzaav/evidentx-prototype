import type {
  StudentSkill,
  Evidence,
  MatchResult,
  SkillMatch,
  Opportunity,
  TeamRequirement,
  TeamCandidateMatch,
  TeamComposition,
  RecommendedDevelopment,
} from '@/types';
import {
  getStudentSkills,
  getStudentEvidence,
  evidenceMap,
  evidenceSkillStrength,
  skillMap,
  skillName,
  getAllStudents,
  getDataVersion,
  studentMap,
} from '@/data/mockData';

// ============================================================
// Deterministic Matching Engine with Inverted Index & Memoization
// ------------------------------------------------------------
// Principles:
// - Transparent: every score is computable from evidence.
// - Evidence-weighted: verified evidence > pending > self-reported.
// - Required skills outweigh preferred skills.
// - ONLY uses skill/proficiency/evidence. No protected attributes.
// ============================================================

const VERIFICATION_MULTIPLIER: Record<Evidence['verification'], number> = {
  verified: 1.0,
  pending: 0.8,
  'self-reported': 0.6,
};

// Thresholds for matched / partial / missing
const MATCH_THRESHOLD = 70; // proficiency >= 70 -> matched
const PARTIAL_THRESHOLD = 40; // 40-69 -> partial; < 40 -> missing

export function classifyStatus(proficiency: number): SkillMatch['status'] {
  if (proficiency >= MATCH_THRESHOLD) return 'matched';
  if (proficiency >= PARTIAL_THRESHOLD) return 'partial';
  return 'missing';
}

// Weights for scoring
const REQUIRED_WEIGHT = 2.0;
const PREFERRED_WEIGHT = 1.0;
const PARTIAL_CREDIT = 0.5; // partial skill counts as half
const EVIDENCE_BONUS_WEIGHT = 0.15; // up to 15% bonus from evidence strength

// ============================================================
// High-Performance Inverted Index & Cache Store
// ============================================================

let _lastKnownDataVersion = -1;
let _invertedSkillIndex: Map<string, Set<string>> | null = null;
const _studentSkillsMapCache = new Map<string, Map<string, StudentSkill>>();
const _opportunityMatchCache = new Map<string, MatchResult>();
const _teamMatchCache = new Map<string, TeamCandidateMatch>();
const _passportSummaryCache = new Map<string, ReturnType<typeof computePassportSummary>>();
const _skillGapCache = new Map<string, ReturnType<typeof computeSkillGapAnalysis>>();

/**
 * Clear all internal caches. Called when mock data / custom data version increments.
 */
export function clearMatchingCache() {
  _invertedSkillIndex = null;
  _studentSkillsMapCache.clear();
  _opportunityMatchCache.clear();
  _teamMatchCache.clear();
  _passportSummaryCache.clear();
  _skillGapCache.clear();
}

/**
 * Checks whether the underlying data changed and flushes caches accordingly.
 */
function ensureFreshCache() {
  const currentVersion = getDataVersion();
  if (currentVersion !== _lastKnownDataVersion) {
    clearMatchingCache();
    _lastKnownDataVersion = currentVersion;
  }
}

/**
 * Fast O(1) map of a student's skills by skillId.
 */
function getStudentSkillsMap(studentId: string): Map<string, StudentSkill> {
  ensureFreshCache();
  let map = _studentSkillsMapCache.get(studentId);
  if (!map) {
    const studentSkills = getStudentSkills(studentId);
    map = new Map(studentSkills.map((s) => [s.skillId, s]));
    _studentSkillsMapCache.set(studentId, map);
  }
  return map;
}

/**
 * Inverted Skill Index: Maps each skillId -> Set of studentIds who possess that skill.
 * Provides O(1) candidate lookup by skill instead of scanning the full candidate database.
 */
export function getInvertedSkillIndex(): Map<string, Set<string>> {
  ensureFreshCache();
  if (_invertedSkillIndex) return _invertedSkillIndex;

  const index = new Map<string, Set<string>>();
  const allStudents = getAllStudents();

  for (const student of allStudents) {
    const skills = getStudentSkills(student.id);
    for (const s of skills) {
      if (!index.has(s.skillId)) {
        index.set(s.skillId, new Set());
      }
      index.get(s.skillId)!.add(student.id);
    }
  }

  _invertedSkillIndex = index;
  return _invertedSkillIndex;
}

/**
 * Fast candidate retrieval using Inverted Index:
 * Returns student IDs possessing any (or all) of the specified skills.
 */
export function getCandidatesWithSkills(
  skillIds: string[],
  matchMode: 'any' | 'all' = 'any'
): string[] {
  const index = getInvertedSkillIndex();
  if (skillIds.length === 0) return getAllStudents().map((s) => s.id);

  if (matchMode === 'any') {
    const candidateSet = new Set<string>();
    for (const skId of skillIds) {
      const studentsWithSkill = index.get(skId);
      if (studentsWithSkill) {
        for (const stId of studentsWithSkill) candidateSet.add(stId);
      }
    }
    return Array.from(candidateSet);
  } else {
    // 'all' mode: intersection
    const sets = skillIds.map((skId) => index.get(skId) ?? new Set<string>());
    if (sets.length === 0) return [];
    sets.sort((a, b) => a.size - b.size);
    const result: string[] = [];
    for (const stId of sets[0]) {
      if (sets.every((s) => s.has(stId))) {
        result.push(stId);
      }
    }
    return result;
  }
}

/**
 * Precomputed match statistics for a specific skill across all candidates.
 */
export function getSkillMatchStats(skillId: string): {
  totalCandidates: number;
  avgProficiency: number;
  topCandidatesCount: number;
} {
  const index = getInvertedSkillIndex();
  const studentIds = Array.from(index.get(skillId) ?? []);
  if (studentIds.length === 0) {
    return { totalCandidates: 0, avgProficiency: 0, topCandidatesCount: 0 };
  }

  let totalProficiency = 0;
  let topCount = 0;

  for (const stId of studentIds) {
    const skillsMap = getStudentSkillsMap(stId);
    const ss = skillsMap.get(skillId);
    if (ss) {
      totalProficiency += ss.proficiency;
      if (ss.proficiency >= MATCH_THRESHOLD) topCount++;
    }
  }

  return {
    totalCandidates: studentIds.length,
    avgProficiency: Math.round(totalProficiency / studentIds.length),
    topCandidatesCount: topCount,
  };
}

// Build a SkillMatch record for a student vs a required skill
function buildSkillMatch(
  skillId: string,
  required: boolean,
  studentSkillsMap: Map<string, StudentSkill>
): SkillMatch {
  const ss = studentSkillsMap.get(skillId);
  const proficiency = ss?.proficiency ?? 0;
  const evidenceTitles: string[] = (ss?.evidenceIds ?? []).map(
    (id) => evidenceMap[id]?.title ?? ''
  );
  // best evidence strength for this skill
  let bestStrength = 0;
  for (const evId of ss?.evidenceIds ?? []) {
    const s = evidenceSkillStrength[evId]?.[skillId] ?? 0;
    const ver = evidenceMap[evId]?.verification ?? 'self-reported';
    const weighted = s * VERIFICATION_MULTIPLIER[ver];
    if (weighted > bestStrength) {
      bestStrength = weighted;
    }
  }
  return {
    skillId,
    studentProficiency: proficiency,
    status: classifyStatus(proficiency),
    evidenceTitles,
    evidenceStrength: Math.round(bestStrength),
    required,
  };
}

/**
 * Core matching: student vs opportunity.
 * Returns deterministic matchScore + full breakdown.
 * Uses cached result when opportunity and student skills are unchanged.
 */
export function matchStudentToOpportunity(
  studentId: string,
  opportunity: Opportunity
): MatchResult {
  ensureFreshCache();
  const cacheKey = `${studentId}::${opportunity.id}::${opportunity.requiredSkills.join(',')}::${opportunity.preferredSkills.join(',')}`;
  const cached = _opportunityMatchCache.get(cacheKey);
  if (cached) return cached;

  const map = getStudentSkillsMap(studentId);

  const all: SkillMatch[] = [];
  for (const skId of opportunity.requiredSkills) {
    all.push(buildSkillMatch(skId, true, map));
  }
  for (const skId of opportunity.preferredSkills) {
    if (!opportunity.requiredSkills.includes(skId)) {
      all.push(buildSkillMatch(skId, false, map));
    }
  }

  const matchedSkills = all.filter((s) => s.status === 'matched');
  const partialSkills = all.filter((s) => s.status === 'partial');
  const missingSkills = all.filter((s) => s.status === 'missing');

  // ---- Score calculation ----
  const requiredTotal = opportunity.requiredSkills.length;
  const preferredTotal = opportunity.preferredSkills.length;
  const maxWeighted = requiredTotal * REQUIRED_WEIGHT + preferredTotal * PREFERRED_WEIGHT;

  let earnedWeighted = 0;
  for (const m of matchedSkills) {
    earnedWeighted += m.required ? REQUIRED_WEIGHT : PREFERRED_WEIGHT;
  }
  for (const p of partialSkills) {
    // partial credit scaled by how close to MATCH_THRESHOLD
    const frac = PARTIAL_CREDIT * (p.studentProficiency / MATCH_THRESHOLD);
    earnedWeighted += (p.required ? REQUIRED_WEIGHT : PREFERRED_WEIGHT) * Math.min(frac, PARTIAL_CREDIT);
  }

  const baseScore = maxWeighted > 0 ? (earnedWeighted / maxWeighted) * 100 : 0;

  // Evidence strength bonus: average evidence strength of matched skills, scaled
  const matchedWithEvidence = matchedSkills.filter((m) => m.evidenceStrength > 0);
  const avgEvidence =
    matchedWithEvidence.length > 0
      ? matchedWithEvidence.reduce((a, b) => a + b.evidenceStrength, 0) / matchedWithEvidence.length
      : 0;
  const evidenceBonus = (avgEvidence / 100) * EVIDENCE_BONUS_WEIGHT * 100;

  // Penalty: missing required skills reduces score
  const missingRequired = missingSkills.filter((m) => m.required).length;
  const missingRequiredPenalty = requiredTotal > 0 ? (missingRequired / requiredTotal) * 8 : 0;

  const matchScore = Math.max(
    0,
    Math.min(100, Math.round(baseScore + evidenceBonus - missingRequiredPenalty))
  );

  // ---- Supporting evidence ----
  const supportingEvidence = matchedSkills
    .concat(partialSkills)
    .map((m) => ({
      skillId: m.skillId,
      skillName: skillName(m.skillId),
      evidence: m.evidenceTitles,
    }))
    .filter((e) => e.evidence.length > 0);

  // ---- Explanation ----
  const matchedReq = matchedSkills.filter((m) => m.required).length;
  const matchedPref = matchedSkills.filter((m) => !m.required).length;

  const explanationParts: string[] = [];
  explanationParts.push(
    `The candidate demonstrates ${matchedReq} of ${requiredTotal} required skills` +
      (preferredTotal > 0 ? ` and ${matchedPref} of ${preferredTotal} preferred skills` : '') +
      ' through verified coursework, projects, competitions and credentials.'
  );
  if (partialSkills.length > 0) {
    explanationParts.push(
      `Partially matched skills: ${partialSkills.map((p) => skillName(p.skillId)).join(', ')} ` +
        `— demonstrated but below the proficiency threshold (${MATCH_THRESHOLD}%).`
    );
  }
  if (missingRequired > 0) {
    explanationParts.push(
      `Missing required skills: ${missingSkills.filter((m) => m.required).map((m) => skillName(m.skillId)).join(', ')}. ` +
        `These reduced the match score. Recommended development areas are suggested below.`
    );
  }
  if (matchedWithEvidence.length > 0) {
    explanationParts.push(
      `Evidence strength bonus: average supporting evidence strength is ${Math.round(avgEvidence)}%, ` +
        `reflecting the quality and verification status of the proof.`
    );
  }

  const explanation = explanationParts.join(' ');

  const fairExplanation =
    'This recommendation considers only demonstrated skills, evidence strength, verification status and proficiency. ' +
    'It does NOT use gender, religion, caste, race, disability, appearance, family income or any protected/irrelevant attribute.';

  const strengths = matchedSkills
    .filter((m) => m.required)
    .map((m) => `${skillName(m.skillId)} (${m.studentProficiency}%) — ${m.evidenceTitles[0] ?? 'verified'}`);

  const gaps = missingSkills
    .filter((m) => m.required)
    .map((m) => skillName(m.skillId));

  const result: MatchResult = {
    studentId,
    targetId: opportunity.id,
    targetType: 'opportunity',
    matchScore,
    matchedSkills,
    partialSkills,
    missingSkills,
    supportingEvidence,
    explanation,
    fairExplanation,
    strengths,
    gaps,
  };

  _opportunityMatchCache.set(cacheKey, result);
  return result;
}

/**
 * Rank all students against an opportunity.
 */
export function rankStudentsForOpportunity(opportunity: Opportunity): MatchResult[] {
  ensureFreshCache();
  const allStudents = getAllStudents();
  return allStudents
    .map((s) => matchStudentToOpportunity(s.id, opportunity))
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Rank all opportunities for a student (student discovery view).
 */
export function rankOpportunitiesForStudent(studentId: string, opportunities: Opportunity[]): MatchResult[] {
  ensureFreshCache();
  return opportunities
    .map((o) => matchStudentToOpportunity(studentId, o))
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ============================================================
// Skill Gap Analysis
// ============================================================

const DEV_RECOMMENDATIONS_MAP: Record<string, string> = {
  s_sql: 'Beginner SQL course + a database-backed project recommended (e.g., build a CRUD app with PostgreSQL).',
  s_node: 'Backend project recommended — build a REST API with Node.js + Express covering auth and data modeling.',
  s_ml: 'Introductory ML course recommended (scikit-learn) plus a Kaggle beginner competition.',
  s_dl: 'Deep learning specialization recommended — implement a CNN/U-Net on a small image dataset.',
  s_docker: 'Docker fundamentals + containerize an existing project and deploy it.',
  s_aws: 'AWS Cloud Practitioner path + deploy a small app to EC2/Lambda.',
  s_flutter: 'Flutter + Dart basics course recommended — build a 3-screen mobile app.',
  s_uiux: 'UX Design fundamentals — run a usability test on an existing product.',
  s_figma: 'Figma basics + recreate a known app screen as a hi-fi prototype.',
  s_research: 'User research methods — conduct 3 user interviews and synthesize findings.',
  s_python: 'Python for data science track recommended.',
  s_pandas: 'Data analysis with Pandas — complete a data cleaning + visualization project.',
};

function computeSkillGapAnalysis(
  studentId: string,
  opportunity: Opportunity
): {
  strong: SkillMatch[];
  partial: SkillMatch[];
  missing: SkillMatch[];
  recommendations: RecommendedDevelopment[];
} {
  const res = matchStudentToOpportunity(studentId, opportunity);
  const recommendations: RecommendedDevelopment[] = [];

  for (const p of res.partialSkills) {
    recommendations.push({
      skillId: p.skillId,
      skillName: skillName(p.skillId),
      status: 'partial',
      recommendation:
        DEV_RECOMMENDATIONS_MAP[p.skillId] ??
        `Practice ${skillName(p.skillId)} through a guided project to raise proficiency above ${MATCH_THRESHOLD}%.`,
      priority: p.required ? 'high' : 'medium',
    });
  }
  for (const m of res.missingSkills) {
    recommendations.push({
      skillId: m.skillId,
      skillName: skillName(m.skillId),
      status: 'missing',
      recommendation:
        DEV_RECOMMENDATIONS_MAP[m.skillId] ??
        `Start learning ${skillName(m.skillId)} with a beginner course and add a project as evidence.`,
      priority: m.required ? 'high' : 'low',
    });
  }
  recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return {
    strong: res.matchedSkills,
    partial: res.partialSkills,
    missing: res.missingSkills,
    recommendations,
  };
}

export function skillGapAnalysis(
  studentId: string,
  opportunity: Opportunity
): {
  strong: SkillMatch[];
  partial: SkillMatch[];
  missing: SkillMatch[];
  recommendations: RecommendedDevelopment[];
} {
  ensureFreshCache();
  const cacheKey = `${studentId}::${opportunity.id}::gap`;
  const cached = _skillGapCache.get(cacheKey);
  if (cached) return cached;

  const result = computeSkillGapAnalysis(studentId, opportunity);
  _skillGapCache.set(cacheKey, result);
  return result;
}

// ============================================================
// Interactive "What-If" Skill Simulator
// ============================================================

export interface SimulatedMatchResult {
  baseScore: number;
  simulatedScore: number;
  delta: number;
  strong: (SkillMatch & { isSimulated?: boolean })[];
  partial: SkillMatch[];
  missing: SkillMatch[];
  simulatedSkillIds: string[];
}

export function simulateOpportunityMatch(
  studentId: string,
  opportunity: Opportunity,
  simulatedSkillIds: Set<string> | string[]
): SimulatedMatchResult {
  const baseMatch = matchStudentToOpportunity(studentId, opportunity);
  const baseGap = skillGapAnalysis(studentId, opportunity);
  const simSet = new Set(simulatedSkillIds);

  if (simSet.size === 0) {
    return {
      baseScore: baseMatch.matchScore,
      simulatedScore: baseMatch.matchScore,
      delta: 0,
      strong: baseGap.strong,
      partial: baseGap.partial,
      missing: baseGap.missing,
      simulatedSkillIds: [],
    };
  }

  const existingMap = getStudentSkillsMap(studentId);
  const simMap = new Map(existingMap);

  for (const skId of simSet) {
    simMap.set(skId, {
      studentId,
      skillId: skId,
      proficiency: 85,
      evidenceIds: [],
    });
  }

  const all: (SkillMatch & { isSimulated?: boolean })[] = [];
  for (const skId of opportunity.requiredSkills) {
    const sm = buildSkillMatch(skId, true, simMap);
    if (simSet.has(skId)) {
      sm.studentProficiency = 85;
      sm.status = 'matched';
      sm.evidenceStrength = 85;
      sm.evidenceTitles = ['Interactive "What-If" Simulation'];
      (sm as any).isSimulated = true;
    }
    all.push(sm);
  }
  for (const skId of opportunity.preferredSkills) {
    if (!opportunity.requiredSkills.includes(skId)) {
      const sm = buildSkillMatch(skId, false, simMap);
      if (simSet.has(skId)) {
        sm.studentProficiency = 85;
        sm.status = 'matched';
        sm.evidenceStrength = 85;
        sm.evidenceTitles = ['Interactive "What-If" Simulation'];
        (sm as any).isSimulated = true;
      }
      all.push(sm);
    }
  }

  const matchedSkills = all.filter((s) => s.status === 'matched');
  const partialSkills = all.filter((s) => s.status === 'partial');
  const missingSkills = all.filter((s) => s.status === 'missing');

  const requiredTotal = opportunity.requiredSkills.length;
  const preferredTotal = opportunity.preferredSkills.length;
  const maxWeighted = requiredTotal * REQUIRED_WEIGHT + preferredTotal * PREFERRED_WEIGHT;

  let earnedWeighted = 0;
  for (const m of matchedSkills) {
    earnedWeighted += m.required ? REQUIRED_WEIGHT : PREFERRED_WEIGHT;
  }
  for (const p of partialSkills) {
    const frac = PARTIAL_CREDIT * (p.studentProficiency / MATCH_THRESHOLD);
    earnedWeighted += (p.required ? REQUIRED_WEIGHT : PREFERRED_WEIGHT) * Math.min(frac, PARTIAL_CREDIT);
  }

  const baseScoreCalc = maxWeighted > 0 ? (earnedWeighted / maxWeighted) * 100 : 0;
  const matchedWithEvidence = matchedSkills.filter((m) => m.evidenceStrength > 0);
  const avgEvidence =
    matchedWithEvidence.length > 0
      ? matchedWithEvidence.reduce((a, b) => a + b.evidenceStrength, 0) / matchedWithEvidence.length
      : 0;
  const evidenceBonus = (avgEvidence / 100) * EVIDENCE_BONUS_WEIGHT * 100;

  const missingRequired = missingSkills.filter((m) => m.required).length;
  const missingRequiredPenalty = requiredTotal > 0 ? (missingRequired / requiredTotal) * 8 : 0;

  const simulatedScore = Math.max(
    0,
    Math.min(100, Math.round(baseScoreCalc + evidenceBonus - missingRequiredPenalty))
  );

  return {
    baseScore: baseMatch.matchScore,
    simulatedScore,
    delta: Math.max(0, simulatedScore - baseMatch.matchScore),
    strong: matchedSkills,
    partial: partialSkills,
    missing: missingSkills,
    simulatedSkillIds: Array.from(simSet),
  };
}

// ============================================================
// Team Matching
// ============================================================

/**
 * Match a student against a team's roles.
 * For each role, compute fitScore = match score against that role's required skills.
 */
export function matchStudentToTeam(
  studentId: string,
  team: TeamRequirement
): TeamCandidateMatch {
  ensureFreshCache();
  const cacheKey = `${studentId}::${team.id}::${team.requiredSkills.join(',')}::${team.roles.map((r) => `${r.id}:${r.requiredSkills.join(',')}`).join('|')}`;
  const cached = _teamMatchCache.get(cacheKey);
  if (cached) return cached;

  const map = getStudentSkillsMap(studentId);

  const rolesFit = team.roles.map((role) => {
    const roleMatches = role.requiredSkills.map((skId) =>
      buildSkillMatch(skId, true, map)
    );
    const matched = roleMatches.filter((m) => m.status === 'matched').length;
    const partial = roleMatches.filter((m) => m.status === 'partial').length;
    const total = role.requiredSkills.length || 1;
    const fitScore = Math.round(
      ((matched + partial * PARTIAL_CREDIT) / total) * 100
    );
    return {
      roleId: role.id,
      roleName: role.name,
      fitScore,
      matchedSkills: roleMatches,
    };
  });

  // overall = best role fit, boosted slightly if they cover multiple roles
  const bestFit = Math.max(...rolesFit.map((r) => r.fitScore));
  const multiRoleBoost = rolesFit.filter((r) => r.fitScore >= 60).length > 1 ? 5 : 0;
  const overallScore = Math.min(100, bestFit + multiRoleBoost);

  // contributed skills = team-required skills the student has (matched or partial)
  const contributedSkills: string[] = [];
  for (const skId of team.requiredSkills) {
    const ss = map.get(skId);
    if (ss && ss.proficiency >= PARTIAL_THRESHOLD) contributedSkills.push(skId);
  }

  const topRole = [...rolesFit].sort((a, b) => b.fitScore - a.fitScore)[0] ?? {
    roleName: 'General Contributor',
    fitScore: 0,
  };

  const explanation =
    `Best fit for the ${topRole.roleName} role (${topRole.fitScore}%). ` +
    `Contributes ${contributedSkills.length} of ${team.requiredSkills.length} team-required skills: ` +
    contributedSkills.map((s) => skillName(s)).join(', ') +
    `. ` +
    (rolesFit.filter((r) => r.fitScore >= 60).length > 1
      ? 'Also flexible across multiple roles — valuable for a multidisciplinary team.'
      : 'Specialized in one role.');

  const result: TeamCandidateMatch = {
    studentId,
    rolesFit,
    overallScore,
    contributedSkills,
    explanation,
  };

  _teamMatchCache.set(cacheKey, result);
  return result;
}

export function rankStudentsForTeam(team: TeamRequirement): TeamCandidateMatch[] {
  ensureFreshCache();
  const allStudents = getAllStudents();
  return allStudents
    .map((s) => matchStudentToTeam(s.id, team))
    .sort((a, b) => b.overallScore - a.overallScore);
}

/**
 * Given selected candidates for a team, compute skill coverage + missing skills.
 */
export function teamComposition(
  team: TeamRequirement,
  selectedStudentIds: string[]
): TeamComposition {
  ensureFreshCache();
  const candidates = selectedStudentIds.map((id) => matchStudentToTeam(id, team));
  const coverage = team.requiredSkills.map((skId) => {
    const coveredBy: string[] = [];
    for (const c of candidates) {
      if (c.contributedSkills.includes(skId)) coveredBy.push(c.studentId);
    }
    return { skillId: skId, covered: coveredBy.length > 0, coveredBy };
  });
  const missingSkills = coverage.filter((c) => !c.covered).map((c) => c.skillId);
  const filledRoles = team.roles
    .filter((role) =>
      candidates.some((c) =>
        c.rolesFit.some((r) => r.roleId === role.id && r.fitScore >= 60)
      )
    )
    .map((r) => r.id);

  return { candidates, filledRoles, missingSkills, coverage };
}

export interface OptimalSquadResult {
  squadStudentIds: string[];
  coveragePercent: number;
  coveredSkills: string[];
  missingSkills: string[];
  roleAssignments: { roleId: string; roleName: string; studentId: string; studentName: string; fitScore: number }[];
  explanation: string;
}

/**
 * Algorithmic squad assembly optimizer:
 * Selects the optimal combination of candidates to maximize skill coverage
 * and allocate specialists across required team roles.
 */
export function autoAssembleOptimalSquad(
  team: TeamRequirement,
  maxSquadSize: number = 4
): OptimalSquadResult {
  const allCandidates = rankStudentsForTeam(team);
  const requiredSkills = new Set(team.requiredSkills);
  const selectedIds: string[] = [];
  const coveredSkills = new Set<string>();

  // Step 1: Assign top candidates per role
  for (const role of team.roles) {
    if (selectedIds.length >= maxSquadSize) break;
    const candidate = allCandidates
      .filter((c) => !selectedIds.includes(c.studentId))
      .map((c) => {
        const rf = c.rolesFit.find((r) => r.roleId === role.id)?.fitScore ?? 0;
        const map = getStudentSkillsMap(c.studentId);
        let newSkills = 0;
        for (const sk of team.requiredSkills) {
          if (!coveredSkills.has(sk)) {
            const ss = map.get(sk);
            if (ss && ss.proficiency >= PARTIAL_THRESHOLD) newSkills++;
          }
        }
        return { c, rf, newSkills, totalBenefit: rf + newSkills * 20 };
      })
      .sort((a, b) => b.totalBenefit - a.totalBenefit)[0];

    if (candidate) {
      selectedIds.push(candidate.c.studentId);
      const map = getStudentSkillsMap(candidate.c.studentId);
      for (const sk of team.requiredSkills) {
        const ss = map.get(sk);
        if (ss && ss.proficiency >= PARTIAL_THRESHOLD) {
          coveredSkills.add(sk);
        }
      }
    }
  }

  // Step 2: Fill remaining missing skills if capacity allows
  while (selectedIds.length < maxSquadSize && coveredSkills.size < requiredSkills.size) {
    const candidate = allCandidates
      .filter((c) => !selectedIds.includes(c.studentId))
      .map((c) => {
        const map = getStudentSkillsMap(c.studentId);
        let newSkills = 0;
        for (const sk of team.requiredSkills) {
          if (!coveredSkills.has(sk)) {
            const ss = map.get(sk);
            if (ss && ss.proficiency >= PARTIAL_THRESHOLD) newSkills++;
          }
        }
        return { c, newSkills };
      })
      .sort((a, b) => b.newSkills - a.newSkills)[0];

    if (candidate && candidate.newSkills > 0) {
      selectedIds.push(candidate.c.studentId);
      const map = getStudentSkillsMap(candidate.c.studentId);
      for (const sk of team.requiredSkills) {
        const ss = map.get(sk);
        if (ss && ss.proficiency >= PARTIAL_THRESHOLD) {
          coveredSkills.add(sk);
        }
      }
    } else {
      break;
    }
  }

  const comp = teamComposition(team, selectedIds);
  const roleAssignments = team.roles.map((role) => {
    let best = { studentId: '', studentName: 'Unfilled', fitScore: 0 };
    for (const cand of comp.candidates) {
      const rf = cand.rolesFit.find((r) => r.roleId === role.id);
      if (rf && rf.fitScore > best.fitScore) {
        const s = studentMap[cand.studentId];
        best = { studentId: cand.studentId, studentName: s ? s.name : cand.studentId, fitScore: rf.fitScore };
      }
    }
    return {
      roleId: role.id,
      roleName: role.name,
      studentId: best.studentId,
      studentName: best.studentName,
      fitScore: best.fitScore,
    };
  });

  const coveredCount = comp.coverage.filter((c) => c.covered).length;
  const totalCount = team.requiredSkills.length || 1;
  const coveragePercent = Math.round((coveredCount / totalCount) * 100);

  const explanation =
    `Assembled ${selectedIds.length}-member squad achieving ${coveragePercent}% coverage of team competencies. ` +
    (comp.missingSkills.length === 0
      ? '100% of all required skills are fully covered with zero gap deficiencies.'
      : `Missing ${comp.missingSkills.length} skill(s): ${comp.missingSkills.map((s) => skillName(s)).join(', ')}.`);

  return {
    squadStudentIds: selectedIds,
    coveragePercent,
    coveredSkills: comp.coverage.filter((c) => c.covered).map((c) => c.skillId),
    missingSkills: comp.missingSkills,
    roleAssignments,
    explanation,
  };
}

// ============================================================
// Passport Summary Helpers
// ============================================================

function computePassportSummary(studentId: string) {
  const skills = getStudentSkills(studentId);
  const evidence = getStudentEvidence(studentId);
  const verifiedEvidence = evidence.filter((e) => e.verification === 'verified');
  const totalEvidence = evidence.length;
  const avgProficiency =
    skills.length > 0
      ? Math.round(skills.reduce((a, b) => a + b.proficiency, 0) / skills.length)
      : 0;
  const topSkills = skills.slice(0, 5);
  const byCategory = new Map<string, number>();
  for (const s of skills) {
    const cat = skillMap[s.skillId]?.category ?? 'Other';
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
  }
  return {
    skills,
    evidence,
    verifiedEvidence,
    totalEvidence,
    avgProficiency,
    topSkills,
    byCategory: Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]),
  };
}

export function passportSummary(studentId: string) {
  ensureFreshCache();
  const cached = _passportSummaryCache.get(studentId);
  if (cached) return cached;

  const summary = computePassportSummary(studentId);
  _passportSummaryCache.set(studentId, summary);
  return summary;
}
