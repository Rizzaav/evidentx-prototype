import { useState } from 'react';
import {
  UserPlus,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  FolderGit2,
  Award,
  Trophy,
  FileBadge,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import { PageHeader, Card, Avatar, Chip, EmptyState } from '@/components/ui';
import { SKILLS, skillMap } from '@/data/mockData';
import { useCustomStudents } from '@/lib/customStudents';
import type { Student, Evidence, EvidenceType, VerificationStatus } from '@/types';

type SkillEntry = { skillId: string; proficiency: number };
type EvidenceEntry = {
  type: EvidenceType;
  title: string;
  description: string;
  issuer: string;
  date: string;
  score: string;
  verification: VerificationStatus;
  skillIds: string[];
};

const AVATAR_COLORS = [
  'from-brand-500 to-brand-700',
  'from-accent-500 to-accent-700',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
];

const EVIDENCE_TYPES: { value: EvidenceType; label: string; icon: React.ReactNode }[] = [
  { value: 'project', label: 'Project', icon: <FolderGit2 className="h-4 w-4" /> },
  { value: 'coursework', label: 'Coursework', icon: <GraduationCap className="h-4 w-4" /> },
  { value: 'competition', label: 'Competition', icon: <Trophy className="h-4 w-4" /> },
  { value: 'credential', label: 'Certification', icon: <FileBadge className="h-4 w-4" /> },
];

const VERIFICATION_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: 'self-reported', label: 'Self-reported' },
  { value: 'pending', label: 'Pending verification' },
  { value: 'verified', label: 'Verified' },
];

export function CreateStudentPage() {
  const { navigate } = useRouter();
  const { addStudent } = useCustomStudents();

  // ---- basic fields ----
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('');
  const [year, setYear] = useState('');
  const [university, setUniversity] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ---- skills ----
  const [skills, setSkills] = useState<SkillEntry[]>([{ skillId: '', proficiency: 60 }]);

  // ---- evidence ----
  const [evidence, setEvidence] = useState<EvidenceEntry[]>([]);

  // ---- validation ----
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address';
    if (!program.trim()) e.program = 'Course/branch is required';
    if (!year.trim()) e.year = 'Year is required';

    const validSkills = skills.filter((s) => s.skillId);
    if (validSkills.length === 0) e.skills = 'Add at least one skill';
    const skillIds = validSkills.map((s) => s.skillId);
    if (new Set(skillIds).size !== skillIds.length) e.skills = 'Duplicate skills are not allowed';

    // validate evidence entries that have a title
    evidence.forEach((ev, i) => {
      if (ev.title.trim() && !ev.issuer.trim()) e[`ev_${i}_issuer`] = 'Issuer is required';
      if (ev.title.trim() && !ev.date) e[`ev_${i}_date`] = 'Date is required';
      if (ev.title.trim() && ev.skillIds.length === 0) e[`ev_${i}_skills`] = 'Link at least one skill';
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleAddSkill() {
    setSkills([...skills, { skillId: '', proficiency: 60 }]);
  }
  function handleRemoveSkill(idx: number) {
    setSkills(skills.filter((_, i) => i !== idx));
  }
  function handleSkillChange(idx: number, field: keyof SkillEntry, value: string | number) {
    setSkills(skills.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function handleAddEvidence() {
    setEvidence([
      ...evidence,
      {
        type: 'project',
        title: '',
        description: '',
        issuer: '',
        date: new Date().toISOString().slice(0, 10),
        score: '',
        verification: 'self-reported',
        skillIds: [],
      },
    ]);
  }
  function handleRemoveEvidence(idx: number) {
    setEvidence(evidence.filter((_, i) => i !== idx));
  }
  function handleEvidenceChange(idx: number, field: keyof EvidenceEntry, value: string | string[]) {
    setEvidence(evidence.map((ev, i) => (i === idx ? { ...ev, [field]: value } : ev)));
  }
  function handleEvidenceSkillToggle(idx: number, skillId: string) {
    setEvidence(
      evidence.map((ev, i) => {
        if (i !== idx) return ev;
        const has = ev.skillIds.includes(skillId);
        return {
          ...ev,
          skillIds: has ? ev.skillIds.filter((s) => s !== skillId) : [...ev.skillIds, skillId],
        };
      })
    );
  }

  function handleSubmit() {
    if (!validate()) return;

    const studentId = 'st_custom_' + Date.now().toString(36);
    const validSkills = skills.filter((s) => s.skillId);
    const validEvidence = evidence.filter((ev) => ev.title.trim());

    // Determine which skills are backed by evidence
    const skillsWithEvidence = new Set<string>();
    validEvidence.forEach((ev) => ev.skillIds.forEach((sid) => skillsWithEvidence.add(sid)));

    // Pick avatar color deterministically from name
    const colorIdx = name.charCodeAt(0) % AVATAR_COLORS.length;

    const student: Student = {
      id: studentId,
      name: name.trim(),
      email: email.trim(),
      program: program.trim(),
      year: year.trim(),
      university: university.trim() || '—',
      bio: bio.trim() || `${program.trim()} student.`,
      avatarColor: AVATAR_COLORS[colorIdx],
      photoUrl: photoUrl.trim() || undefined,
      interests: interests
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean),
    };

    // Build evidence rows + per-evidence skill strength map
    const evidenceRows: Evidence[] = [];
    const evidenceSkillStrength: Record<string, Record<string, number>> = {};

    validEvidence.forEach((ev, i) => {
      const evId = `${studentId}_ev_${i}`;
      // Strength for each linked skill = proficiency the user assigned to that skill
      const strengthMap: Record<string, number> = {};
      for (const sid of ev.skillIds) {
        const se = validSkills.find((s) => s.skillId === sid);
        strengthMap[sid] = se ? se.proficiency : 50;
      }
      evidenceSkillStrength[evId] = strengthMap;

      evidenceRows.push({
        id: evId,
        studentId,
        type: ev.type,
        title: ev.title.trim(),
        description: ev.description.trim() || '—',
        issuer: ev.issuer.trim(),
        date: ev.date,
        skills: ev.skillIds,
        verification: ev.verification,
        strength: Math.max(...Object.values(strengthMap), 50),
        score: ev.score.trim() || undefined,
      });
    });

    // For skills that have NO evidence, create a self-reported evidence stub
    // so the matching engine can still derive proficiency.
    const skillsWithoutEvidence = validSkills.filter((s) => !skillsWithEvidence.has(s.skillId));
    skillsWithoutEvidence.forEach((se, i) => {
      const evId = `${studentId}_auto_${i}`;
      evidenceSkillStrength[evId] = { [se.skillId]: se.proficiency };
      evidenceRows.push({
        id: evId,
        studentId,
        type: 'experience',
        title: `${skillMap[se.skillId]?.name ?? se.skillId} — self-assessed`,
        description: `Self-reported proficiency: ${se.proficiency}%`,
        issuer: student.name,
        date: new Date().toISOString().slice(0, 10),
        skills: [se.skillId],
        verification: 'self-reported',
        strength: se.proficiency,
      });
    });

    addStudent(student, evidenceRows, evidenceSkillStrength);
    setCreatedId(studentId);
    setSubmitted(true);
  }

  // ---- Success state ----
  if (submitted && createdId) {
    return (
      <div>
        <PageHeader title="Student Profile Created" />
        <Card className="p-8 text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-extrabold text-ink-900">Profile created successfully!</h2>
          <p className="mt-2 text-sm text-ink-600">
            <strong>{name}</strong> has been added and is now available across the platform — Skill Passport,
            internship matching, team matching, and skill-gap analysis all work with the existing engine.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => navigate('/student/passport')} className="btn-primary">
              <GraduationCap className="h-4 w-4" /> View Skill Passport
            </button>
            <button onClick={() => navigate('/student/internships')} className="btn-secondary">
              See Internship Matches
            </button>
            <button onClick={() => navigate('/student/teams')} className="btn-secondary">
              See Team Matches
            </button>
            <button onClick={() => navigate('/student/dashboard')} className="btn-ghost">
              Back to Dashboard
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const validSkillsForLinking = skills.filter((s) => s.skillId);

  return (
    <div>
      <PageHeader
        title="Create Student Profile"
        subtitle="Add a new student with skills and evidence — fully usable by the matching engine"
        backTo="/student/dashboard"
        onBack={() => navigate('/student/dashboard')}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand-600" />
              <h3 className="font-display text-lg font-bold text-ink-900">Basic Information</h3>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name} required>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Nair"
                />
              </Field>
              <Field label="Email" error={errors.email} required>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya.n@university.edu"
                />
              </Field>
              <Field label="Course / Branch" error={errors.program} required>
                <input
                  className="input"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                />
              </Field>
              <Field label="Year" error={errors.year} required>
                <select className="input" value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                </select>
              </Field>
              <Field label="University / Institute">
                <input
                  className="input"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. VIT Vellore"
                />
              </Field>
              <Field label="Interests (comma-separated)">
                <input
                  className="input"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="Web Development, AI, Robotics"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Bio">
                  <textarea
                    className="input min-h-[80px]"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A short bio describing the student's focus and goals..."
                  />
                </Field>
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl bg-ink-50/80 border border-ink-100">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-500 block mb-2">
                  Student Photograph / Headshot (Optional)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Avatar
                    name={name || 'Student'}
                    color={AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length || 0]}
                    photoUrl={photoUrl || undefined}
                    size="lg"
                  />
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
                        <span>Upload Photo File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="text-xs text-rose-600 hover:underline font-semibold"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="Or paste headshot image URL (e.g. GitHub / LinkedIn avatar)"
                      className="input text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Skills */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-ink-900">Skills</h3>
                {errors.skills && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.skills}
                  </span>
                )}
              </div>
              <button onClick={handleAddSkill} className="btn-ghost text-xs">
                <Plus className="h-3.5 w-3.5" /> Add skill
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {skills.map((sk, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 p-3">
                  <select
                    className="input flex-1"
                    value={sk.skillId}
                    onChange={(e) => handleSkillChange(idx, 'skillId', e.target.value)}
                  >
                    <option value="">Select a skill...</option>
                    {SKILLS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.category}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sk.proficiency}
                      onChange={(e) => handleSkillChange(idx, 'proficiency', Number(e.target.value))}
                      className="w-24 accent-brand-600"
                    />
                    <span className="w-10 text-right text-sm font-bold text-ink-900">{sk.proficiency}%</span>
                  </div>
                  {skills.length > 1 && (
                    <button onClick={() => handleRemoveSkill(idx)} className="btn-ghost p-1.5 text-ink-400 hover:text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-400">
              Proficiency is derived from linked evidence. For skills without evidence, your self-assessed
              proficiency is used as self-reported.
            </p>
          </Card>

          {/* Evidence */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink-900">Evidence</h3>
              <button onClick={handleAddEvidence} className="btn-ghost text-xs">
                <Plus className="h-3.5 w-3.5" /> Add evidence
              </button>
            </div>

            {evidence.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No evidence added yet"
                  description="Add projects, coursework, competitions, or certifications. Evidence-linked skills get higher proficiency in matching."
                  icon={<FolderGit2 className="h-8 w-8" />}
                  action={
                    <button onClick={handleAddEvidence} className="btn-primary text-xs">
                      <Plus className="h-3.5 w-3.5" /> Add first evidence
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {evidence.map((ev, idx) => (
                  <div key={idx} className="rounded-xl border border-ink-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {EVIDENCE_TYPES.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => handleEvidenceChange(idx, 'type', t.value)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                              ev.type === t.value
                                ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                                : 'text-ink-500 hover:bg-ink-50'
                            }`}
                          >
                            {t.icon} {t.label}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => handleRemoveEvidence(idx)} className="btn-ghost p-1.5 text-ink-400 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field label="Title" error={errors[`ev_${idx}_title`]}>
                        <input
                          className="input"
                          value={ev.title}
                          onChange={(e) => handleEvidenceChange(idx, 'title', e.target.value)}
                          placeholder="e.g. Weather Forecast App"
                        />
                      </Field>
                      <Field label="Issuer / Organization" error={errors[`ev_${idx}_issuer`]}>
                        <input
                          className="input"
                          value={ev.issuer}
                          onChange={(e) => handleEvidenceChange(idx, 'issuer', e.target.value)}
                          placeholder="e.g. University, Hackathon, Coursera"
                        />
                      </Field>
                      <Field label="Date" error={errors[`ev_${idx}_date`]}>
                        <input
                          type="date"
                          className="input"
                          value={ev.date}
                          onChange={(e) => handleEvidenceChange(idx, 'date', e.target.value)}
                        />
                      </Field>
                      <Field label="Score / Grade (optional)">
                        <input
                          className="input"
                          value={ev.score}
                          onChange={(e) => handleEvidenceChange(idx, 'score', e.target.value)}
                          placeholder="e.g. A (90/100), 1st Place"
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Description">
                          <textarea
                            className="input min-h-[60px]"
                            value={ev.description}
                            onChange={(e) => handleEvidenceChange(idx, 'description', e.target.value)}
                            placeholder="What was done? What skills were demonstrated?"
                          />
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <Field label="Verification status">
                          <select
                            className="input"
                            value={ev.verification}
                            onChange={(e) => handleEvidenceChange(idx, 'verification', e.target.value)}
                          >
                            {VERIFICATION_OPTIONS.map((v) => (
                              <option key={v.value} value={v.value}>{v.label}</option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </div>

                    {/* Link skills to this evidence */}
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-ink-500">Linked skills</span>
                        {errors[`ev_${idx}_skills`] && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                            <AlertCircle className="h-3 w-3" /> {errors[`ev_${idx}_skills`]}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {validSkillsForLinking.length === 0 ? (
                          <span className="text-xs text-ink-400">Select a skill above first.</span>
                        ) : (
                          validSkillsForLinking.map((sk) => {
                            const active = ev.skillIds.includes(sk.skillId);
                            return (
                              <button
                                key={sk.skillId}
                                onClick={() => handleEvidenceSkillToggle(idx, sk.skillId)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                                  active
                                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                                    : 'border-ink-200 bg-white text-ink-500 hover:bg-ink-50'
                                }`}
                              >
                                {skillMap[sk.skillId]?.name}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={handleSubmit} className="btn-primary">
              <CheckCircle2 className="h-4 w-4" /> Create Profile
            </button>
            <button onClick={() => navigate('/student/dashboard')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>

        {/* Preview sidebar */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-8">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-500">Live Preview</h3>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={name || 'New Student'} color={AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]} size="lg" />
              <div className="min-w-0">
                <div className="font-display font-bold text-ink-900 truncate">{name || 'New Student'}</div>
                <div className="text-xs text-ink-500 truncate">{program || 'Course'} · {year || 'Year'}</div>
                <div className="text-xs text-ink-400 truncate">{university || 'University'}</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">Skills</span>
                <span className="font-bold text-ink-900">{skills.filter((s) => s.skillId).length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">Evidence items</span>
                <span className="font-bold text-ink-900">{evidence.filter((e) => e.title.trim()).length}</span>
              </div>
            </div>

            {skills.filter((s) => s.skillId).length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-wide text-ink-400 mb-2">Selected skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.filter((s) => s.skillId).map((sk) => (
                    <Chip key={sk.skillId} color="brand">
                      {skillMap[sk.skillId]?.name} {sk.proficiency}%
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {evidence.filter((e) => e.title.trim()).length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-wide text-ink-400 mb-2">Evidence</div>
                <div className="space-y-1.5">
                  {evidence.filter((e) => e.title.trim()).map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-ink-600">
                      {ev.type === 'project' && <FolderGit2 className="h-3.5 w-3.5 text-accent-600" />}
                      {ev.type === 'coursework' && <GraduationCap className="h-3.5 w-3.5 text-brand-600" />}
                      {ev.type === 'competition' && <Trophy className="h-3.5 w-3.5 text-amber-600" />}
                      {ev.type === 'credential' && <Award className="h-3.5 w-3.5 text-emerald-600" />}
                      {ev.type === 'experience' && <FileBadge className="h-3.5 w-3.5 text-rose-600" />}
                      <span className="truncate">{ev.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-ink-500">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error && (
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
          <AlertCircle className="h-3 w-3" /> {error}
        </span>
      )}
    </label>
  );
}
