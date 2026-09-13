import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Student,
  Opportunity,
  Application,
  Evidence,
  TeamRequirement,
  ApplicationStatus,
} from '@/types';
import {
  getAllStudents,
  getAllOpportunities,
  getAllTeams,
  getStudentEvidence,
} from '@/data/mockData';

// ============================================================
// Asynchronous Supabase Data Layer with Local Mock Fallback
// ============================================================

/**
 * Fetch all students from Supabase (or fallback to local dataset)
 */
export async function dbFetchStudents(): Promise<Student[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return getAllStudents();
  }

  const { data, error } = await supabase.from('students').select('*');
  if (error || !data || data.length === 0) {
    console.warn('Falling back to local students:', error?.message);
    return getAllStudents();
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    program: row.program,
    year: row.year,
    university: row.university,
    bio: row.bio ?? '',
    avatarColor: row.avatar_color ?? 'from-brand-500 to-brand-700',
    interests: row.interests ?? [],
  }));
}

/**
 * Save new student profile to Supabase
 */
export async function dbCreateStudent(student: Student): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  const { error } = await supabase.from('students').upsert(
    {
      id: student.id,
      name: student.name,
      email: student.email,
      program: student.program,
      year: student.year,
      university: student.university,
      bio: student.bio,
      avatar_color: student.avatarColor,
      interests: student.interests,
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Failed to create/upsert student in Supabase:', error.message);
    return false;
  }
  return true;
}

/**
 * Fetch all opportunities from Supabase
 */
export async function dbFetchOpportunities(): Promise<Opportunity[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return getAllOpportunities();
  }

  const { data, error } = await supabase.from('opportunities').select('*');
  if (error || !data || data.length === 0) {
    console.warn('Falling back to local opportunities:', error?.message);
    return getAllOpportunities();
  }

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    organization: row.organization,
    location: row.location,
    type: row.type as Opportunity['type'],
    duration: row.duration,
    stipend: row.stipend,
    description: row.description,
    postedBy: row.posted_by,
    postedDate: row.posted_date,
    requiredSkills: row.required_skills,
    preferredSkills: row.preferred_skills,
    minEvidenceStrength: row.min_evidence_strength ?? undefined,
  }));
}

/**
 * Create new opportunity in Supabase
 */
export async function dbCreateOpportunity(opp: Opportunity): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  const { error } = await supabase.from('opportunities').insert({
    id: opp.id,
    title: opp.title,
    organization: opp.organization,
    location: opp.location,
    type: opp.type,
    duration: opp.duration,
    stipend: opp.stipend,
    description: opp.description,
    posted_by: opp.postedBy,
    posted_date: opp.postedDate,
    required_skills: opp.requiredSkills,
    preferred_skills: opp.preferredSkills,
    min_evidence_strength: opp.minEvidenceStrength ?? 0,
  });

  if (error) {
    console.error('Failed to create opportunity in Supabase:', error.message);
    return false;
  }
  return true;
}

/**
 * Fetch applications from Supabase
 */
export async function dbFetchApplications(): Promise<Application[]> {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await supabase.from('applications').select('*');
  if (error || !data) {
    console.warn('Error fetching applications from Supabase:', error?.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    opportunityId: row.opportunity_id,
    appliedDate: row.applied_date,
    status: row.status as ApplicationStatus,
    matchScoreAtApply: row.match_score_at_apply ?? undefined,
    notes: row.notes ?? undefined,
  }));
}

/**
 * Submit or update application in Supabase
 */
export async function dbUpsertApplication(app: Application): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  const { error } = await supabase.from('applications').upsert(
    {
      id: app.id,
      student_id: app.studentId,
      opportunity_id: app.opportunityId,
      applied_date: app.appliedDate,
      status: app.status,
      match_score_at_apply: app.matchScoreAtApply ?? null,
      notes: app.notes ?? null,
    },
    { onConflict: 'student_id,opportunity_id' }
  );

  if (error) {
    console.error('Failed to upsert application in Supabase:', error.message);
    return false;
  }
  return true;
}

/**
 * Save evidence artifact to Supabase
 */
export async function dbCreateEvidence(evidence: Evidence): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  const { error } = await supabase.from('evidence').upsert(
    {
      id: evidence.id,
      student_id: evidence.studentId,
      type: evidence.type,
      title: evidence.title,
      description: evidence.description,
      issuer: evidence.issuer,
      date: evidence.date,
      verification: evidence.verification,
      strength: evidence.strength,
      score: evidence.score ?? null,
      url: evidence.url ?? null,
      skills: evidence.skills,
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Failed to create/upsert evidence in Supabase:', error.message);
    return false;
  }
  return true;
}

/**
 * Delete evidence artifact from Supabase
 */
export async function dbDeleteEvidence(evidenceId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  const { error } = await supabase.from('evidence').delete().eq('id', evidenceId);
  if (error) {
    console.error('Failed to delete evidence from Supabase:', error.message);
    return false;
  }
  return true;
}
