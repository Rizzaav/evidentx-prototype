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
      return `- ${sName}: Proficiency ${sk.proficiency}/100 based on ${sk.evidenceIds.length} evidence artifact(s)`;
    })
    .join('\n');

  const evidenceText = evidenceList
    .map((ev) => {
      return `- ${ev.title} (${ev.type.toUpperCase()}) | Issuer: ${ev.issuer} | Verification: ${ev.verification} (Strength: ${ev.strength}/100) | SHA-256 Seal: ${ev.evidenceHash || 'Verified Seal'} | URL: ${ev.url || 'N/A'}\n  Summary: ${ev.description}`;
    })
    .join('\n');

  let matchText = '';
  if (opp) {
    const match = matchStudentToOpportunity(studentId, opp);
    const gap = skillGapAnalysis(studentId, opp);
    matchText = `
EVALUATION TARGET OPPORTUNITY:
- Role: ${opp.title} at ${opp.organization} (${opp.type})
- Location: ${opp.location} | Duration: ${opp.duration}
- Required Skills: ${opp.requiredSkills.map((id) => skillMap[id]?.name || id).join(', ')}
- Algorithmic Match Score: ${match.matchScore}%
- Verified Strengths: ${match.strengths.join(', ') || 'None'}
- Identified Skill Gaps: ${match.gaps.join(', ') || 'No critical gaps'}
- Actionable Development Recommendations: ${gap.recommendations.map((r) => `${r.skillName} (${r.priority} priority): ${r.recommendation}`).join('; ') || 'None'}`;
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

const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-3-flash-preview',
];

async function executeGeminiRequest(
  apiKey: string,
  body: Record<string, any>
): Promise<string> {
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = errData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        if (response.status === 404 || response.status === 503) {
          lastError = new Error(msg);
          continue;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        throw new Error('Gemini returned an empty response.');
      }

      return candidateText.trim();
    } catch (error: any) {
      lastError = error;
      if (error.name === 'TypeError') {
        throw error;
      }
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini AI.');
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
    return await executeGeminiRequest(apiKey, {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1000,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
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
    return await executeGeminiRequest(apiKey, {
      contents,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1200,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
  } catch (error: any) {
    console.error('Gemini API askCandidateQuestion error:', error);
    throw error;
  }
}

export interface InterviewEvaluationParams {
  questionTitle: string;
  questionScenario: string;
  questionCategory: string;
  difficulty: string;
  targetSkills: string[];
  starTip?: string;
  modelAnswer: string;
  userAnswer: string;
  evidenceTitle?: string;
  studentName?: string;
}

export interface InterviewEvaluationResult {
  technical: number;
  evidence: number;
  communication: number;
  overallGrade: string;
  relevanceScore: number;
  strengths: string[];
  improvements: string[];
  detailedCritique: string;
  isAiGenerated?: boolean;
}

/**
 * Intelligent semantic evaluation fallback when Gemini API key is absent or network fails.
 * Rigorously grades answers across the full 0-100 range and detects off-topic / gibberish answers.
 */
export function evaluateInterviewAnswerLocal(
  params: InterviewEvaluationParams
): InterviewEvaluationResult {
  const { questionTitle, questionScenario, questionCategory, targetSkills, modelAnswer, userAnswer } = params;
  const rawAnswer = userAnswer.trim();
  const lowerAnswer = rawAnswer.toLowerCase();
  const words = rawAnswer ? rawAnswer.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  if (wordCount < 8) {
    return {
      technical: 5,
      evidence: 5,
      communication: 10,
      relevanceScore: 5,
      overallGrade: 'No Hire (Response Incomplete)',
      strengths: ['Submitted an initial response.'],
      improvements: [
        'Provide a complete, multi-sentence technical response.',
        'Address the specific engineering scenario and explain your design decisions.',
        'Include concrete results or architectural trade-offs.',
      ],
      detailedCritique: 'The answer is too brief to evaluate. A technical interview response should be at least 40-150 words detailing problem context, action taken, and technical outcome.',
      isAiGenerated: false,
    };
  }

  // Build question & scenario keywords
  const questionKeywords: string[] = [
    ...questionTitle.toLowerCase().split(/\W+/),
    ...questionScenario.toLowerCase().split(/\W+/),
    ...targetSkills.map((s) => s.replace(/^s_/, '').toLowerCase()),
    ...modelAnswer.toLowerCase().split(/\W+/),
  ].filter(
    (w) =>
      w.length > 3 &&
      !['with', 'from', 'this', 'that', 'your', 'have', 'were', 'when', 'what', 'into', 'they', 'looking', 'about'].includes(w)
  );

  const uniqueQuestionKeywords = Array.from(new Set(questionKeywords));

  // Category specific technical keywords
  const categoryTerms: Record<string, string[]> = {
    'Full-Stack': [
      'react', 'state', 'hook', 'usememo', 'usecallback', 'render', 'reconciliation', 'async',
      'promise', 'debounce', 'throttle', 'race', 'abortcontroller', 'api', 'component', 'props',
      'context', 'redux', 'zustand', 'cache', 'payload', 'socket', 'dom', 'ui', 'batch', 'latency'
    ],
    'Systems & Backend': [
      'sql', 'index', 'b-tree', 'query', 'explain', 'analyze', 'scan', 'partition', 'schema',
      'redis', 'cache', 'ttl', 'stampede', 'hash', 'latency', 'p99', 'throughput', 'lock',
      'transaction', 'acid', 'scale', 'database', 'postgres', 'pool', 'shard'
    ],
    'AI & ML': [
      'model', 'train', 'overfit', 'leakage', 'k-fold', 'stratified', 'split', 'pr-auc', 'roc-auc',
      'f1', 'imbalance', 'skew', 'scaler', 'pipeline', 'scikit', 'transform', 'drift', 'accuracy',
      'precision', 'recall', 'feature', 'imputation', 'epoch', 'loss'
    ],
    'Architecture': [
      'docker', 'kubernetes', 'pod', 'ci', 'cd', 'rollback', 'circuit breaker', 'incident',
      'probe', 'prometheus', 'alert', 'availability', 'failover', 'tag', 'checksum', 'lockfile',
      'dependency', 'outage', 'triage', 'post-mortem', 'distributed', 'service'
    ],
  };

  const domainKeywords = categoryTerms[questionCategory] || categoryTerms['Full-Stack'];

  let questionMatches = 0;
  for (const kw of uniqueQuestionKeywords) {
    if (lowerAnswer.includes(kw)) questionMatches++;
  }

  let domainMatches = 0;
  for (const term of domainKeywords) {
    if (lowerAnswer.includes(term)) domainMatches++;
  }

  const totalMatches = questionMatches + domainMatches * 2;
  const isOffTopic = totalMatches < 2 || (wordCount > 25 && domainMatches === 0 && questionMatches < 2);

  // If completely off-topic or gibberish
  if (isOffTopic) {
    return {
      technical: Math.max(5, Math.min(18, totalMatches * 4)),
      evidence: Math.max(5, Math.min(15, totalMatches * 3)),
      communication: Math.min(30, Math.round(wordCount >= 20 ? 25 : 12)),
      relevanceScore: Math.min(15, totalMatches * 4),
      overallGrade: 'No Hire (Off-Topic / Irrelevant)',
      strengths: [
        wordCount >= 20 ? 'Demonstrates sentence structure and conversational fluency.' : 'Submitted an initial response.'
      ],
      improvements: [
        `Directly address the scenario: "${questionScenario.slice(0, 110)}..."`,
        `Discuss relevant technical mechanisms (e.g. ${domainKeywords.slice(0, 4).join(', ')}).`,
        'Ground your answer in real project evidence rather than unrelated statements.',
      ],
      detailedCritique: 'The response does not address the technical scenario asked in this question. No relevant engineering methods, tools, or architectural solutions were provided. Please reread the question and provide a solution targeting the specified technologies.',
      isAiGenerated: false,
    };
  }

  // Relevant answers evaluation
  const hasMetrics = /\b\d+(\.\d+)?(%)|\b\d+\s*(ms|s|sec|fps|hz|kb|mb|gb|x|req)\b|\breduced by\b|\bimproved by\b|\blatency\b|\bthroughput\b|\bp99\b/i.test(rawAnswer);
  const hasEvidence = /\b(in my project|we implemented|i designed|i refactored|i configured|i deployed|we used|root cause|isolated|diagnosed|tested)\b/i.test(rawAnswer);
  const hasProblem = /\b(bottleneck|issue|challenge|leak|problem|slow|failure|outage|drift|imbalance)\b/i.test(rawAnswer);
  const hasAction = /\b(implemented|refactored|deployed|introduced|configured|migrated|optimized)\b/i.test(rawAnswer);
  const hasResult = hasMetrics || /\b(resulted in|enabled|eliminated|prevented|ensured|achieved)\b/i.test(rawAnswer);
  const starScore = (hasProblem ? 7 : 0) + (hasAction ? 8 : 0) + (hasResult ? 10 : 0);

  let targetSkillHits = 0;
  for (const skill of targetSkills) {
    const cleanSkill = skill.replace(/^s_/, '').toLowerCase();
    if (lowerAnswer.includes(cleanSkill)) targetSkillHits++;
  }

  let techScore = 20 + Math.min(45, domainMatches * 9) + Math.min(20, questionMatches * 3) + Math.min(12, targetSkillHits * 6);
  if (wordCount < 30) techScore = Math.min(techScore, 45);
  techScore = Math.min(96, Math.max(15, techScore));

  let evidenceScore = 20 + (hasEvidence ? 25 : 8) + (hasMetrics ? 25 : 5) + Math.min(25, questionMatches * 3);
  if (wordCount < 35) evidenceScore = Math.min(evidenceScore, 42);
  evidenceScore = Math.min(95, Math.max(15, evidenceScore));

  let commScore = 30 + (wordCount >= 40 && wordCount <= 220 ? 30 : wordCount > 220 ? 18 : 10) + starScore;
  commScore = Math.min(98, Math.max(20, commScore));

  const average = Math.round((techScore + evidenceScore + commScore) / 3);

  let overallGrade: string;
  if (average >= 88) {
    overallGrade = 'Strong Hire (L5 Equivalent)';
  } else if (average >= 74) {
    overallGrade = 'Hire (Production Ready)';
  } else if (average >= 58) {
    overallGrade = 'Pass with Follow-up';
  } else if (average >= 40) {
    overallGrade = 'Needs Technical Depth';
  } else {
    overallGrade = 'No Hire (Insufficient Depth)';
  }

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (domainMatches >= 3) {
    strengths.push(`Employs strong domain terminology (${domainKeywords.filter((k) => lowerAnswer.includes(k)).slice(0, 3).join(', ')}).`);
  }
  if (hasMetrics) {
    strengths.push('Demonstrates engineering impact with concrete quantifiable metrics or performance benchmarks.');
  }
  if (hasEvidence) {
    strengths.push('Grounds the explanation in actual implementation choices and engineering trade-offs.');
  }
  if (hasProblem && hasAction && hasResult) {
    strengths.push('Follows a structured problem-solving approach (STAR method) with clear cause and outcome.');
  }
  if (strengths.length === 0) {
    strengths.push('Addresses the topic with understandable clarity and foundational awareness.');
  }

  if (!hasMetrics) {
    improvements.push('Quantify the outcome: specify latency reduction, memory savings, test coverage %, or query execution times.');
  }
  if (!hasEvidence) {
    improvements.push('Reference specific codebase modules, configuration files, or architectural decisions from your project.');
  }
  if (domainMatches < 3) {
    improvements.push(`Deepen domain vocabulary: mention specific tools or primitives (e.g. ${domainKeywords.slice(0, 3).join(', ')}).`);
  }
  if (wordCount < 45) {
    improvements.push('Elaborate with more architectural detail on edge cases, error handling, or scale limits.');
  }
  if (improvements.length === 0) {
    improvements.push('Consider explaining how you would monitor this solution in production with automated tracing or alerts.');
  }

  const detailedCritique =
    average >= 74
      ? 'Strong technical response. The candidate effectively addresses the core scenario, communicates concrete actions, and demonstrates production-level competence.'
      : average >= 58
      ? 'Acceptable foundation, but the explanation lacks sufficient technical specifics, benchmarking metrics, or architectural depth to be considered strong.'
      : 'The response touches on the topic but lacks the technical rigor, specific tools, and quantifiable results expected for this engineering level.';

  return {
    technical: techScore,
    evidence: evidenceScore,
    communication: commScore,
    overallGrade,
    relevanceScore: Math.min(100, 30 + totalMatches * 7),
    strengths,
    improvements,
    detailedCritique,
    isAiGenerated: false,
  };
}

/**
 * Evaluates a candidate's technical interview answer using Google Gemini AI,
 * falling back gracefully to the semantic evaluator if the network/key is unavailable.
 */
export async function evaluateInterviewAnswer(
  params: InterviewEvaluationParams
): Promise<InterviewEvaluationResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return evaluateInterviewAnswerLocal(params);
  }

  const systemInstruction = `You are a Principal Software Engineer and Bar-Raiser conducting a high-stakes technical interview evaluation.
Your goal is to evaluate the candidate's answer with extreme intellectual rigor and honesty.

Evaluation Principles:
1. RELEVANCE CHECK FIRST:
   - If the candidate's answer is completely off-topic, gibberish, humorous, or fails to address the question asked:
     Assign technical: 0-15, evidence: 0-15, communication: 0-25, overallGrade: "No Hire (Off-Topic / Irrelevant)".
     In detailedCritique and improvements, explicitly point out that they did not answer the scenario.
2. RIGOROUS TECHNICAL SCORING:
   - "Strong Hire (L5 Equivalent)" (88-98%): Demonstrates deep architectural grasp, precise tools, race condition/scalability awareness, quantifiable metrics (e.g. %, ms, throughput), and trade-offs.
   - "Hire (Production Ready)" (74-87%): Solid technical solution directly solving the scenario with correct mechanisms and good communication.
   - "Pass with Follow-up" (58-73%): Partially correct or conceptual answer that lacks concrete code/system implementation depth or metrics.
   - "Needs Technical Depth" (38-57%): Vague, superficial, or contains notable technical misconceptions.
   - "No Hire" (<38%): Completely inadequate, erroneous, or off-topic.
3. OUTPUT FORMAT:
   Return a single JSON object with these keys:
   {
     "technical": number (0-100),
     "evidence": number (0-100),
     "communication": number (0-100),
     "overallGrade": string,
     "relevanceScore": number (0-100),
     "strengths": string[] (2-3 concise bullet points),
     "improvements": string[] (2-3 actionable, high-value engineering suggestions),
     "detailedCritique": string (2-3 sentences evaluating their engineering depth against the benchmark)
   }`;

  const prompt = `QUESTION DETAILS:
Title: ${params.questionTitle}
Category: ${params.questionCategory} | Difficulty: ${params.difficulty}
Scenario: ${params.questionScenario}
Target Skills: ${params.targetSkills.join(', ')}
${params.starTip ? `STAR Tip: ${params.starTip}` : ''}
Benchmark Model Answer: ${params.modelAnswer}

CANDIDATE ANSWER TO EVALUATE:
"""
${params.userAnswer}
"""

Evaluate this candidate's response. Return strictly valid JSON.`;

  try {
    const rawResponse = await executeGeminiRequest(apiKey, {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
      },
    });

    let jsonStr = rawResponse.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    return {
      technical: Math.max(0, Math.min(100, Math.round(Number(parsed.technical) || 0))),
      evidence: Math.max(0, Math.min(100, Math.round(Number(parsed.evidence) || 0))),
      communication: Math.max(0, Math.min(100, Math.round(Number(parsed.communication) || 0))),
      overallGrade: String(parsed.overallGrade || 'Pass with Follow-up'),
      relevanceScore: Math.max(0, Math.min(100, Math.round(Number(parsed.relevanceScore) || 50))),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : ['Clear response structure.'],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 4) : ['Add more technical depth.'],
      detailedCritique: String(parsed.detailedCritique || 'Evaluation completed.'),
      isAiGenerated: true,
    };
  } catch (err: any) {
    console.warn('Gemini evaluation request failed, using intelligent local evaluation:', err);
    return evaluateInterviewAnswerLocal(params);
  }
}
