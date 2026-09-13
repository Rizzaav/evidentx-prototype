import { SKILLS, skillMap } from '@/data/mockData';

export interface GithubLanguageBreakdown {
  language: string;
  bytes: number;
  percentage: number;
}

export interface GithubScanResult {
  repoName: string;
  fullName: string;
  owner: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  defaultBranch: string;
  pushedAt: string;
  languages: GithubLanguageBreakdown[];
  topics: string[];
  detectedSkills: string[];
  skillStrengths: Record<string, number>;
  meanStrength: number;
  commitCountSummary: string;
  license?: string;
  isRealApiResult: boolean;
  statusMessage: string;
  // Fork & Contribution Integrity Verification
  isFork: boolean;
  parentRepo?: string;
  authorCommitCount: number;
  isForkWithoutContributions: boolean;
  contributionType: 'original' | 'open_source_contributor' | 'unmodified_fork';
}

// Map GitHub language names and keywords to EvidentX Skill IDs
const LANGUAGE_TO_SKILL: Record<string, string[]> = {
  typescript: ['s_ts', 's_js'],
  javascript: ['s_js'],
  python: ['s_python'],
  'jupyter notebook': ['s_python', 's_pandas', 's_ml'],
  html: ['s_react', 's_js'],
  css: ['s_uiux'],
  'c++': ['s_cpp', 's_ds', 's_algo'],
  c: ['s_cpp', 's_ds'],
  java: ['s_java', 's_ds'],
  dart: ['s_flutter', 's_mobile'],
  kotlin: ['s_android', 's_mobile'],
  swift: ['s_mobile'],
  go: ['s_node', 's_docker'],
  rust: ['s_ds', 's_algo'],
  dockerfile: ['s_docker', 's_aws'],
  shell: ['s_docker', 's_git'],
  sql: ['s_sql', 's_database'],
};

/**
 * Strictly parses and validates a GitHub repository string or URL.
 * Throws explicit descriptive errors if the input is not a GitHub repository.
 */
export function parseGithubRepoInput(rawInput: string): {
  owner: string;
  repo: string;
  fullName: string;
  repoUrl: string;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Please enter a GitHub repository URL or username/repository path.');
  }

  let pathCandidate = trimmed;

  // Check if a full URL with scheme is provided
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsedUrl = new URL(trimmed);
      const hostname = parsedUrl.hostname.toLowerCase();

      // STRICT CHECK: Reject any non-github.com domain
      if (hostname !== 'github.com' && hostname !== 'www.github.com') {
        throw new Error(
          `Invalid domain "${parsedUrl.hostname}". EvidentX only verifies public repositories hosted on github.com.`
        );
      }

      pathCandidate = parsedUrl.pathname;
    } catch (e: any) {
      if (e.message?.includes('EvidentX only verifies')) {
        throw e;
      }
      throw new Error(`Malformed URL provided: "${trimmed}". Please enter a valid GitHub repository URL.`);
    }
  } else if (/^github\.com\//i.test(trimmed)) {
    pathCandidate = trimmed.replace(/^github\.com\//i, '');
  }

  // Strip leading/trailing slashes and optional .git suffix
  const cleanedPath = pathCandidate
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.git$/i, '');

  const parts = cleanedPath.split('/').filter(Boolean);

  if (parts.length < 2) {
    throw new Error(
      `Incomplete repository path. Please provide both the owner and repository name (e.g. facebook/react or https://github.com/facebook/react).`
    );
  }

  const owner = parts[0].trim();
  const repo = parts[1].trim();

  // Validate GitHub username and repository naming conventions
  const ownerRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  const repoRegex = /^[a-z\d_.-]{1,100}$/i;

  if (!ownerRegex.test(owner)) {
    throw new Error(`Invalid GitHub account or organization name "${owner}".`);
  }

  if (!repoRegex.test(repo)) {
    throw new Error(`Invalid GitHub repository name "${repo}".`);
  }

  const fullName = `${owner}/${repo}`;
  const repoUrl = `https://github.com/${fullName}`;

  return { owner, repo, fullName, repoUrl };
}

export async function scanGithubRepository(rawInput: string): Promise<GithubScanResult> {
  // Step 1: Validate URL & path syntax strictly
  const { owner, repo, fullName, repoUrl } = parseGithubRepoInput(rawInput);

  // Check optional GitHub token for elevated rate limits if configured
  const githubToken =
    (import.meta.env.VITE_GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN || '') as string;
  const authHeaders: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (githubToken && githubToken.trim().length > 0) {
    authHeaders['Authorization'] = `token ${githubToken.trim()}`;
  }

  // Step 2: Fetch Repository Info from GitHub REST API
  let repoRes: Response;
  try {
    repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: authHeaders,
    });
  } catch (networkErr: any) {
    throw new Error(
      `Network connection failed while contacting GitHub API. Please check your internet connectivity.`
    );
  }

  // Step 3: Strictly enforce existence checks
  if (repoRes.status === 404) {
    throw new Error(
      `GitHub repository "${fullName}" was not found (HTTP 404). Please verify that the repository exists and is public.`
    );
  }

  if (repoRes.status === 403) {
    const rateLimitRemaining = repoRes.headers.get('x-ratelimit-remaining');
    if (rateLimitRemaining === '0') {
      const resetTimestamp = repoRes.headers.get('x-ratelimit-reset');
      const resetTime = resetTimestamp
        ? new Date(parseInt(resetTimestamp, 10) * 1000).toLocaleTimeString()
        : 'shortly';
      throw new Error(
        `GitHub API rate limit exceeded (60 req/hr for unauthenticated IP). Resets at ${resetTime}.`
      );
    }
    throw new Error(`GitHub API returned HTTP 403 Forbidden. Access to "${fullName}" is restricted.`);
  }

  if (!repoRes.ok) {
    throw new Error(
      `GitHub API request failed with HTTP ${repoRes.status}: ${repoRes.statusText || 'Unable to fetch repository'}`
    );
  }

  const repoData = await repoRes.json();

  // Step 4: Fetch Language Breakdown
  let languages: GithubLanguageBreakdown[] = [];
  try {
    const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: authHeaders,
    });
    if (langRes.ok) {
      const langData: Record<string, number> = await langRes.json();
      const totalBytes = Object.values(langData).reduce((a, b) => a + b, 0) || 1;
      languages = Object.entries(langData)
        .map(([lang, bytes]) => ({
          language: lang,
          bytes,
          percentage: Math.round((bytes / totalBytes) * 100),
        }))
        .sort((a, b) => b.bytes - a.bytes);
    }
  } catch {
    // Gracefully handle secondary language breakdown fetch failure
  }

  // Step 5: Fork Detection & Author Commit Verification
  const isFork = Boolean(repoData.fork);
  const parentRepo: string | undefined = repoData.parent?.full_name || repoData.source?.full_name;
  let authorCommitCount = 0;
  let commitSummary = 'Verified commit activity';

  if (isFork) {
    // For forked repos, strictly verify whether this specific user authored commits
    try {
      const authorCommitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?author=${owner}&per_page=10`,
        { headers: authHeaders }
      );
      if (authorCommitRes.ok) {
        const authorCommits = await authorCommitRes.json();
        if (Array.isArray(authorCommits)) {
          authorCommitCount = authorCommits.length;
        }
      }
    } catch {
      // Gracefully handle commit author check failure
    }

    // Fallback: If ?author query returned 0, inspect recent commits directly to catch username/login matching
    if (authorCommitCount === 0) {
      try {
        const recentRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`,
          { headers: authHeaders }
        );
        if (recentRes.ok) {
          const recentList = await recentRes.json();
          if (Array.isArray(recentList)) {
            const lowOwner = owner.toLowerCase();
            const matching = recentList.filter(
              (c: any) =>
                c.author?.login?.toLowerCase() === lowOwner ||
                c.committer?.login?.toLowerCase() === lowOwner ||
                c.commit?.author?.name?.toLowerCase() === lowOwner
            );
            if (matching.length > 0) {
              authorCommitCount = matching.length;
            }
          }
        }
      } catch {
        // Ignore fallback error
      }
    }

    if (authorCommitCount === 0) {

      commitSummary = `0 commits by ${owner} (Unmodified fork of ${parentRepo || 'upstream repository'})`;
    } else {
      commitSummary = `${authorCommitCount}+ verified open source contribution(s) by ${owner}`;
    }
  } else {
    // For original repos, fetch recent commits
    try {
      const commitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`,
        { headers: authHeaders }
      );
      if (commitRes.ok) {
        const commits = await commitRes.json();
        if (Array.isArray(commits) && commits.length > 0) {
          authorCommitCount = commits.length;
          commitSummary = `${commits.length}+ recent verified commits by ${
            commits[0]?.commit?.author?.name || owner
          }`;
        }
      }
    } catch {
      // Gracefully handle secondary commit fetch failure
    }
  }

  const isForkWithoutContributions = isFork && authorCommitCount === 0;
  const contributionType: 'original' | 'open_source_contributor' | 'unmodified_fork' =
    !isFork
      ? 'original'
      : isForkWithoutContributions
      ? 'unmodified_fork'
      : 'open_source_contributor';

  // If this is an unmodified fork, IMMEDIATELY return with 0 skills to prevent unearned credit
  if (isForkWithoutContributions) {
    return {
      repoName: repoData.name,
      fullName: repoData.full_name,
      owner: repoData.owner?.login || owner,
      url: repoData.html_url || repoUrl,
      description:
        repoData.description || `Forked repository from ${parentRepo || 'upstream repository'}.`,
      stars: repoData.stargazers_count ?? 0,
      forks: repoData.forks_count ?? 0,
      defaultBranch: repoData.default_branch || 'main',
      pushedAt: repoData.pushed_at || new Date().toISOString(),
      languages,
      topics: repoData.topics || [],
      detectedSkills: [], // ZERO skills awarded!
      skillStrengths: {},
      meanStrength: 0,
      commitCountSummary: commitSummary,
      license: repoData.license?.spdx_id || repoData.license?.name,
      isRealApiResult: true,
      statusMessage: `🚨 Unmodified Fork Detected: "${repoData.full_name}" was forked from "${parentRepo || 'upstream'}", but has 0 verified commits authored by ${owner}. To maintain verification integrity, unmodified forks are excluded from awarding skill points.`,
      isFork: true,
      parentRepo,
      authorCommitCount: 0,
      isForkWithoutContributions: true,
      contributionType: 'unmodified_fork',
    };
  }

  // Step 6: Competency mapping based on real GitHub data
  const detectedSkillSet = new Set<string>();
  const strengths: Record<string, number> = {};

  // Always detect Git for verified GitHub repositories
  detectedSkillSet.add('s_git');
  strengths['s_git'] = Math.min(98, 85 + Math.min(repoData.stargazers_count ?? 0, 10));

  // Map detected languages
  for (const langItem of languages) {
    const lowLang = langItem.language.toLowerCase();
    const mappedSkills = LANGUAGE_TO_SKILL[lowLang] || [];
    for (const sk of mappedSkills) {
      if (skillMap[sk]) {
        detectedSkillSet.add(sk);
        const base = 82;
        const shareBonus = Math.min(14, Math.round(langItem.percentage / 7));
        strengths[sk] = Math.min(96, base + shareBonus);
      }
    }
  }

  // Text analysis on description + topics
  const textBlob = `${repoData.description || ''} ${(repoData.topics || []).join(' ')} ${
    repoData.name
  }`.toLowerCase();

  if (textBlob.includes('react') || textBlob.includes('frontend') || textBlob.includes('next')) {
    detectedSkillSet.add('s_react');
    strengths['s_react'] = Math.max(strengths['s_react'] || 0, 90);
  }
  if (
    textBlob.includes('node') ||
    textBlob.includes('express') ||
    textBlob.includes('backend') ||
    textBlob.includes('api')
  ) {
    detectedSkillSet.add('s_node');
    strengths['s_node'] = Math.max(strengths['s_node'] || 0, 88);
  }
  if (
    textBlob.includes('docker') ||
    textBlob.includes('kubernetes') ||
    textBlob.includes('ci/cd')
  ) {
    detectedSkillSet.add('s_docker');
    strengths['s_docker'] = Math.max(strengths['s_docker'] || 0, 86);
  }
  if (
    textBlob.includes('aws') ||
    textBlob.includes('cloud') ||
    textBlob.includes('s3') ||
    textBlob.includes('serverless')
  ) {
    detectedSkillSet.add('s_aws');
    strengths['s_aws'] = Math.max(strengths['s_aws'] || 0, 85);
  }
  if (
    textBlob.includes('sql') ||
    textBlob.includes('postgres') ||
    textBlob.includes('prisma') ||
    textBlob.includes('database')
  ) {
    detectedSkillSet.add('s_sql');
    strengths['s_sql'] = Math.max(strengths['s_sql'] || 0, 88);
  }
  if (
    textBlob.includes('ml') ||
    textBlob.includes('machine learning') ||
    textBlob.includes('ai') ||
    textBlob.includes('pytorch') ||
    textBlob.includes('tensorflow')
  ) {
    detectedSkillSet.add('s_ml');
    strengths['s_ml'] = Math.max(strengths['s_ml'] || 0, 91);
  }
  if (
    textBlob.includes('figma') ||
    textBlob.includes('ui') ||
    textBlob.includes('design') ||
    textBlob.includes('tailwind')
  ) {
    detectedSkillSet.add('s_uiux');
    strengths['s_uiux'] = Math.max(strengths['s_uiux'] || 0, 87);
  }

  if (detectedSkillSet.size === 1) {
    // If only Git, add problem solving
    detectedSkillSet.add('s_problem');
    strengths['s_problem'] = 84;
  }

  const detectedSkills = Array.from(detectedSkillSet);
  const meanStrength = Math.round(
    Object.values(strengths).reduce((a, b) => a + b, 0) / (Object.values(strengths).length || 1)
  );

  return {
    repoName: repoData.name,
    fullName: repoData.full_name,
    owner: repoData.owner?.login || owner,
    url: repoData.html_url || repoUrl,
    description:
      repoData.description || `Production repository '${repoData.name}' verified via GitHub API.`,
    stars: repoData.stargazers_count ?? 0,
    forks: repoData.forks_count ?? 0,
    defaultBranch: repoData.default_branch || 'main',
    pushedAt: repoData.pushed_at || new Date().toISOString(),
    languages,
    topics: repoData.topics || [],
    detectedSkills,
    skillStrengths: strengths,
    meanStrength,
    commitCountSummary: commitSummary,
    license: repoData.license?.spdx_id || repoData.license?.name,
    isRealApiResult: true,
    isFork,
    parentRepo,
    authorCommitCount,
    isForkWithoutContributions: false,
    contributionType,
    statusMessage: isFork
      ? `Live GitHub REST API: Verified Open Source Contributions in '${repoData.full_name}' (forked from ${parentRepo || 'upstream'}) with ${authorCommitCount}+ commits authored by ${owner}.`
      : `Live GitHub REST API: Verified '${repoData.full_name}' with ${languages.length} languages and ${detectedSkills.length} demonstrated competencies.`,
  };
}

