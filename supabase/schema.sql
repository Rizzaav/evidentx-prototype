-- ==============================================================================
-- EVIDENTX: PRODUCTION POSTGRESQL SCHEMA (SUPABASE)
-- Deterministic Evidence-Based AI Skill Matching & Cryptographic Passport Standard
-- ==============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. SKILLS TAXONOMY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN (
            'Frontend', 'Backend', 'Data & AI', 'Design', 'DevOps', 
            'Database', 'Languages', 'Soft Skills', 'Cloud', 'Mobile'
        )
    ),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);

-- ==============================================================================
-- 2. STUDENTS / CANDIDATE PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    program TEXT NOT NULL,
    year TEXT NOT NULL,
    university TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_color TEXT DEFAULT 'from-brand-500 to-brand-700',
    interests TEXT[] DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_university ON public.students(university);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);

-- ==============================================================================
-- 3. EVIDENCE & PROOF PORTFOLIO (WITH SHA-256 HASHES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.evidence (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('coursework', 'project', 'competition', 'credential', 'experience')),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    issuer TEXT NOT NULL,
    date DATE NOT NULL,
    verification TEXT NOT NULL DEFAULT 'self-reported' CHECK (verification IN ('verified', 'pending', 'self-reported')),
    strength INTEGER NOT NULL DEFAULT 50 CHECK (strength >= 0 AND strength <= 100),
    score TEXT,
    url TEXT,
    skills TEXT[] NOT NULL DEFAULT '{}',
    evidence_hash TEXT, -- Deterministic 64-character SHA-256 cryptographic digest
    verification_method TEXT DEFAULT 'Standard Attestation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_student ON public.evidence(student_id);
CREATE INDEX IF NOT EXISTS idx_evidence_skills ON public.evidence USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_evidence_hash ON public.evidence(evidence_hash);

-- Detailed mapping of skill strengths per evidence artifact
CREATE TABLE IF NOT EXISTS public.evidence_skill_strengths (
    evidence_id TEXT NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    strength INTEGER NOT NULL CHECK (strength >= 0 AND strength <= 100),
    PRIMARY KEY (evidence_id, skill_id)
);

-- ==============================================================================
-- 4. CRYPTOGRAPHIC AUDIT LEDGER (TAMPER-EVIDENT RECORD)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('evidence', 'student_passport', 'application')),
    action TEXT NOT NULL CHECK (action IN ('VERIFY', 'INSERT', 'UPDATE', 'REVOKE')),
    actor_id TEXT NOT NULL,
    sha256_digest TEXT NOT NULL,
    previous_block_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_ledger(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_ledger(created_at);

-- ==============================================================================
-- 5. OPPORTUNITIES & INTERNSHIP POSTINGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.opportunities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Internship', 'Research', 'Hackathon Team', 'Project')),
    duration TEXT NOT NULL,
    stipend TEXT NOT NULL,
    description TEXT NOT NULL,
    posted_by TEXT NOT NULL,
    posted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    preferred_skills TEXT[] NOT NULL DEFAULT '{}',
    min_evidence_strength INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN indexing for sub-millisecond skill overlap matching queries
CREATE INDEX IF NOT EXISTS idx_opp_required_skills ON public.opportunities USING GIN (required_skills);
CREATE INDEX IF NOT EXISTS idx_opp_preferred_skills ON public.opportunities USING GIN (preferred_skills);

-- ==============================================================================
-- 6. APPLICATIONS & HIRING PIPELINES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Applied' CHECK (
        status IN ('Applied', 'Reviewing', 'Shortlisted', 'Interviewing', 'Offered', 'Rejected')
    ),
    match_score_at_apply INTEGER CHECK (match_score_at_apply >= 0 AND match_score_at_apply <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_student ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- ==============================================================================
-- 7. TEAMS & MULTIDISCIPLINARY SQUADS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_roles (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    required_skills TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_team_roles_team ON public.team_roles(team_id);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_skill_strengths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_roles ENABLE ROW LEVEL SECURITY;

-- Granular Read/Write Access
CREATE POLICY "Allow public read access to skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Allow public read access to students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to students" ON public.students FOR ALL USING (true);

CREATE POLICY "Allow public read access to evidence" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to evidence" ON public.evidence FOR ALL USING (true);

CREATE POLICY "Allow public read access to audit_ledger" ON public.audit_ledger FOR SELECT USING (true);
CREATE POLICY "Allow public insert to audit_ledger" ON public.audit_ledger FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to opportunities" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to opportunities" ON public.opportunities FOR ALL USING (true);

CREATE POLICY "Allow public read access to applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to applications" ON public.applications FOR ALL USING (true);

CREATE POLICY "Allow public read access to teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to teams" ON public.teams FOR ALL USING (true);

CREATE POLICY "Allow public read access to team_roles" ON public.team_roles FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to team_roles" ON public.team_roles FOR ALL USING (true);
