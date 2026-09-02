import { studentMap, opportunityMap, getStudentSkills, getStudentEvidence, skillMap } from '@/data/mockData';
import { matchStudentToOpportunity, skillGapAnalysis } from '@/lib/matchingEngine';
import type { Opportunity } from '@/types';

const STORAGE_KEY_API_KEY = 'evx_gemini_key';

/**
 * Retrieves the Gemini API key.
 * Prioritizes GEMINI_KEY from .env, then VITE_GEMINI_KEY, then local user overrides.
 */
export function getGeminiApiKey(): string {
  const envKey = (import.meta.env.GEMINI_KEY || import.meta.env.VITE_GEMINI_KEY || '') as string;
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return (localStorage.getItem(STORAGE_KEY_API_KEY) || '').trim();
}

/**
 * Allows updating or overriding the Gemini API key at runtime.
 */
export function setGeminiApiKey(key: string): void {
  if (key && key.trim().length > 0) {
    localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_API_KEY);
  }
}

/**
 * Checks if a Gemini API key is configured.
 */
export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey().length > 0;
}

/**
 * Compiles a structured, comprehensive technical dossier for a student.
 */
export function buildCandidateContext(studentId: string, opp?: Opportunity): string {
  const student = studentMap[studentId];
  if (!student) return 'Candidate not found.';

  const skills = getStudentSkills(studentId);
  const evidenceList = getStudentEvidence(studentId);

  const skillsText = skills
    .map((sk) => {
      const sName = skillMap[sk.skillId]?.name || sk.skillId;
      return `- ${sName}: Level ${sk.level}/5 (${sk.verified ? 'Cryptographically Verified' : 'Self-Reported'}) via ${sk.verifiedSources.join(', ') || 'Portfolio'}`;
    })
    .join('\n');

  const evidenceText = evidenceList
    .map((ev) => {
      return `- ${ev.title} (${ev.type.toUpperCase()}) | Issuer: ${ev.issuer} | SHA-256 Hash: ${ev.evidenceHash || 'Verified Seal'} | URL: ${ev.url || 'N/A'}\n  Summary: ${ev.description}`;
    })
    .join('\n');

  let matchText = '';
  if (opp) {
    const match = matchStudentToOpportunity(studentId, opp);
    const gap = skillGapAnalysis(studentId, opp);
    matchText = `
EVALUATION TARGET OPPORTUNITY:
- Role: ${opp.title} at ${opp.organization} (${opp.type})
- Location: ${opp.location} | Remote: ${opp.remote ? 'Yes' : 'No'}
- Required Skills: ${opp.requiredSkills.map((s) => skillMap[s.skillId]?.name || s.skillId).join(', ')}
- Algorithmic Match Score: ${match.overallScore}% (Skill Fit: ${match.skillScore}%, Evidence Quality: ${match.evidenceScore}%, Track Record: ${match.trackRecordScore}%)
- Verified Strengths: ${match.breakdown.filter((b) => b.studentLevel >= b.requiredLevel).map((b) => b.skillName).join(', ') || 'None'}
- Identified Skill Gaps: ${gap.gaps.map((g) => `${g.skillName} (Current: L${g.currentLevel}, Needed: L${g.requiredLevel})`).join(', ') || 'No critical gaps'}`;
  }

  return `CANDIDATE DOSSIER:
Name: ${student.name}
Email: ${student.email}
University: ${student.university}
Program: ${student.program} (Year: ${student.year})
Bio: ${student.bio}
Interests: ${student.interests.join(', ')}

VERIFIED TECHNICAL SKILLS:
${skillsText}

CRYPTOGRAPHICALLY SEALED EVIDENCE & ARTIFACTS:
${evidenceText}
${matchText}`;
}

/**
 * Calls Google Gemini REST API to generate a concise 3-sentence executive summary.
 */
export async function generateCandidateSummary(studentId: string, opp?: Opportunity): Promise<string> {
  const apiKey = getGeminiApiKey();
  const context = buildCandidateContext(studentId, opp);

  if (!apiKey) {
    // Elegant fallback preview when API key is pending configuration
    const student = studentMap[studentId];
    if (!student) return 'Candidate not found.';
    const skills = getStudentSkills(studentId);
    const topSkills = skills.slice(0, 3).map((s) => skillMap[s.skillId]?.name || s.skillId).join(', ');
    return `${student.name} is a high-performing ${student.program} candidate at ${student.university}, demonstrating verified core proficiency in ${topSkills}. Their portfolio features cryptographically sealed production evidence with full SHA-256 integrity, proving zero credential fabrication. For ${opp ? opp.title : 'technical roles'}, they exhibit strong algorithmic alignment with verifiable GitHub code and industry credentials. (Add GEMINI_KEY to .env for dynamic AI generation)`;
  }

  const systemInstruction = `You are the EvidentX Senior Technical Talent Evaluator and Cryptographic Evidence Auditor.
Your task is to write a punchy, executive candidate summary for hiring managers and recruiters.
Follow these rules strictly:
1. Limit to exactly 3 or 4 dense, high-impact sentences.
2. Highlight their verified technical strengths, key production artifacts, and cryptographic proof integrity.
3. If an opportunity is provided, explain specifically why they fit or what their top advantages are for that role.
4. Maintain an authoritative, objective, professional tone. Avoid generic fluff.`;

  const prompt = `${context}

Please provide an executive technical evaluation summary for this candidate.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      throw new Error(msg);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini returned an empty response.');
    }

    return candidateText.trim();
  } catch (error: any) {
    console.error('Gemini API generateCandidateSummary error:', error);
    throw error;
  }
}

/**
 * Handles multi-turn conversational Q&A about a candidate between recruiter and Gemini.
 */
export async function askCandidateQuestion(
  studentId: string,
  opp: Opportunity | undefined,
  question: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<string> {
  const apiKey = getGeminiApiKey();
  const context = buildCandidateContext(studentId, opp);

  if (!apiKey) {
    const student = studentMap[studentId];
    return `To chat live with Gemini AI about ${student?.name || 'this candidate'} and interrogate their evidence, please set GEMINI_KEY in your .env file.`;
  }

  const systemInstruction = `You are the EvidentX AI Recruiter Assistant. You are an expert technical interviewer and evidence auditor.
You have access to the following verified candidate dossier:
${context}

Instructions:
1. Answer the recruiter's questions directly, accurately, and concisely based strictly on the verified facts in the dossier.
2. Reference specific verified skills, projects, GitHub commits, or credentials whenever relevant.
3. If the recruiter asks about a skill, qualification, or tool NOT found in their verified evidence, honestly state that no verified proof exists for it in their skill passport.
4. Keep answers focused, insightful, and helpful for a technical hiring manager. Use brief bullet points when comparing multiple aspects.`;

  // Format contents array for Gemini
  const contents = [
    ...history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    })),
    {
      role: 'user',
      parts: [{ text: question }],
    },
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      throw new Error(msg);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini returned an empty response.');
    }

    return candidateText.trim();
  } catch (error: any) {
    console.error('Gemini API askCandidateQuestion error:', error);
    throw error;
  }
}
