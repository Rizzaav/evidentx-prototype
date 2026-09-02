import { useState } from 'react';
import {
  GraduationCap,
  Shield,
  FileBadge,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  Download,
  Printer,
  Check,
  Edit3,
  Trash2,
  X,
  Plus,
  AlertTriangle,
  Building2,
  User,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import {
  PageHeader,
  Avatar,
  ProgressBar,
  VerificationPill,
  Card,
  Section,
  Chip,
  StatCard,
} from '@/components/ui';
import { useDemoStudent } from '@/lib/useDemoStudent';
import { passportSummary } from '@/lib/matchingEngine';
import { skillMap, evidenceMap, getStudentEvidence } from '@/data/mockData';
import { useCustomStudents } from '@/lib/customStudents';
import type { Student } from '@/types';

const AVATAR_GRADIENTS = [
  'from-brand-500 to-brand-700',
  'from-accent-500 to-accent-700',
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
];

const AVAILABLE_INTERESTS = [
  'Web Development',
  'Machine Learning',
  'Cloud Architecture',
  'Distributed Systems',
  'Open Source',
  'UI/UX Design',
  'Mobile Apps',
  'Cybersecurity',
  'Data Science',
  'Hackathons',
];

export function SkillPassportPage() {
  const { studentId, student, setStudentId, students } = useDemoStudent();
  const { updateStudent, removeStudent } = useCustomStudents();
  const { navigate } = useRouter();
  const [downloaded, setDownloaded] = useState(false);

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editProgram, setEditProgram] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);

  // Delete Profile Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!student) return null;

  const summary = passportSummary(studentId);
  const evidence = getStudentEvidence(studentId);

  const byType = {
    coursework: evidence.filter((e) => e.type === 'coursework').length,
    project: evidence.filter((e) => e.type === 'project').length,
    competition: evidence.filter((e) => e.type === 'competition').length,
    credential: evidence.filter((e) => e.type === 'credential').length,
  };

  const handleOpenEdit = () => {
    setEditName(student.name);
    setEditEmail(student.email);
    setEditProgram(student.program);
    setEditYear(student.year);
    setEditUniversity(student.university);
    setEditBio(student.bio);
    setEditColor(student.avatarColor || AVATAR_GRADIENTS[0]);
    setEditPhotoUrl(student.photoUrl || '');
    setEditInterests(student.interests || []);
    setShowEditModal(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setEditPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interest: string) => {
    if (editInterests.includes(interest)) {
      setEditInterests((p) => p.filter((x) => x !== interest));
    } else {
      setEditInterests((p) => [...p, interest]);
    }
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) return;

    const updated: Student = {
      ...student,
      name: editName.trim(),
      email: editEmail.trim() || student.email,
      program: editProgram.trim() || 'Computer Science',
      year: editYear.trim() || '1st Year',
      university: editUniversity.trim() || 'State University',
      bio: editBio.trim(),
      avatarColor: editColor,
      photoUrl: editPhotoUrl.trim() || undefined,
      interests: editInterests,
    };

    updateStudent(updated);
    setShowEditModal(false);
  };

  const handleDeleteProfile = () => {
    removeStudent(student.id);
    setShowDeleteModal(false);
    // Switch to first available student
    const remaining = students.filter((s) => s.id !== student.id);
    if (remaining.length > 0) {
      setStudentId(remaining[0].id);
    } else {
      navigate('/create-student');
    }
  };

  const handleExportJSON = () => {
    const data = {
      passportId: `SPP-${student.id.toUpperCase().replace('ST_', '')}-2025`,
      exportDate: new Date().toISOString(),
      student: {
        name: student.name,
        email: student.email,
        university: student.university,
        program: student.program,
        year: student.year,
        bio: student.bio,
        interests: student.interests,
      },
      verifiedMetrics: {
        totalSkills: summary.skills.length,
        avgProficiency: `${summary.avgProficiency}%`,
        verifiedEvidenceCount: summary.verifiedEvidence.length,
      },
      skills: summary.skills.map((sk) => ({
        skill: skillMap[sk.skillId]?.name,
        category: skillMap[sk.skillId]?.category,
        proficiencyScore: `${sk.proficiency}%`,
        supportingEvidence: sk.evidenceIds.map((id) => evidenceMap[id]?.title).filter(Boolean),
      })),
      evidencePortfolio: evidence.map((e) => ({
        type: e.type,
        title: e.title,
        issuer: e.issuer,
        date: e.date,
        verification: e.verification,
        strengthScore: `${e.strength}%`,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkillPassport_${student.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div>
      <PageHeader
        title="Skill Passport"
        subtitle="Your verified technical competencies backed by inspectable proof"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenEdit}
              className="btn-primary text-xs inline-flex items-center gap-1.5 shadow-2xs"
              title="Edit Skill Passport profile information"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Passport</span>
            </button>
            <button
              onClick={() => navigate(`/passport/${studentId}`)}
              className="btn-secondary text-xs inline-flex items-center gap-1.5 shadow-2xs text-brand-700 hover:text-brand-800"
              title="Open public shareable skill passport"
            >
              <Shield className="h-3.5 w-3.5 text-brand-600" />
              <span>Public Passport & QR</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="btn-secondary text-xs"
              title="Download verified JSON certification"
            >
              {downloaded ? <Check className="h-3.5 w-3.5 text-accent-600" /> : <Download className="h-3.5 w-3.5" />}
              {downloaded ? 'Downloaded' : 'Export JSON'}
            </button>
            <button
              onClick={() => window.print()}
              className="btn-secondary text-xs"
              title="Print or save as PDF"
            >
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-secondary text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-200"
              title="Delete account data"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        }
      />

      {/* Passport Certificate Card */}
      <div className="card p-6 sm:p-8 border-brand-200/90 shadow-lift bg-white relative">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={student.name} color={student.avatarColor} photoUrl={student.photoUrl} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900">{student.name}</h2>
                <Chip color="emerald" icon={<Shield className="h-3 w-3" />}>
                  Verified
                </Chip>
                <button
                  onClick={handleOpenEdit}
                  className="p-1 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-brand-50 transition"
                  title="Edit Passport Details"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1 text-xs sm:text-sm text-ink-600 font-medium">
                {student.program} · {student.year}
              </div>
              <div className="text-xs text-ink-500">{student.university}</div>
              <p className="mt-2 max-w-md text-xs text-ink-600 leading-relaxed">{student.bio}</p>

              {/* Interests tag list */}
              {student.interests && student.interests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {student.interests.map((it) => (
                    <span key={it} className="text-[10px] font-semibold bg-ink-100 text-ink-700 px-2 py-0.5 rounded-full">
                      {it}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:flex sm:flex-col">
            <PassportStat label="Skills" value={summary.skills.length} />
            <PassportStat label="Evidence" value={summary.totalEvidence} />
            <PassportStat label="Avg" value={`${summary.avgProficiency}%`} />
          </div>
        </div>

        {/* Passport ID Bar */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <FileBadge className="h-4 w-4 text-brand-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Passport ID</span>
            <span className="font-mono text-xs font-semibold text-ink-800">
              SPP-{student.id.toUpperCase().replace('ST_', '')}-2025
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/student/evidence')}
              className="text-xs font-semibold text-brand-600 hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Evidence ({evidence.length})</span>
              <ArrowRight className="h-3 w-3" />
            </button>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-700">
              <Shield className="h-3.5 w-3.5" /> {summary.verifiedEvidence.length} verified artifacts
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Coursework" value={byType.coursework} icon={<GraduationCap className="h-4 w-4" />} color="brand" />
        <StatCard label="Projects" value={byType.project} icon={<Layers className="h-4 w-4" />} color="accent" />
        <StatCard label="Competitions" value={byType.competition} icon={<Award className="h-4 w-4" />} color="amber" />
        <StatCard label="Credentials" value={byType.credential} icon={<FileBadge className="h-4 w-4" />} color="emerald" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Skills Main Column */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-ink-900">Verified Technical Competencies</h3>
              <span className="text-xs font-medium text-ink-400">{summary.skills.length} skills sorted by proficiency</span>
            </div>
            <div className="mt-5 space-y-4">
              {summary.skills.map((sk) => {
                const skill = skillMap[sk.skillId];
                const evs = sk.evidenceIds.map((id) => evidenceMap[id]).filter(Boolean);
                return (
                  <div key={sk.skillId}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-900">{skill?.name}</span>
                        <span className="text-xs text-ink-500 font-medium">({skill?.category})</span>
                      </div>
                      <span
                        className={`font-bold text-xs ${
                          sk.proficiency >= 70 ? 'text-accent-600' : sk.proficiency >= 40 ? 'text-amber-600' : 'text-rose-600'
                        }`}
                      >
                        {sk.proficiency}%
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={sk.proficiency} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {evs.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => navigate(`/student/skill/${sk.skillId}`)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200/80 bg-ink-50 px-2 py-0.5 text-xs text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition"
                        >
                          <EvidenceDot type={e.type} />
                          <span className="max-w-[200px] truncate">{e.title}</span>
                          {e.verification === 'verified' && <Shield className="h-3 w-3 text-accent-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-display text-base font-bold text-ink-900">Skill Categories</h3>
            <div className="mt-4 space-y-3">
              {summary.byCategory.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-700">{cat}</span>
                    <span className="font-bold text-ink-900">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${(count / summary.skills.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-600" />
              <h3 className="font-display text-base font-bold text-ink-900">Top Strengths</h3>
            </div>
            <div className="mt-4 space-y-2.5">
              {summary.topSkills.map((sk, i) => (
                <div key={sk.skillId} className="flex items-center gap-3">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-700">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs font-semibold text-ink-800">{skillMap[sk.skillId]?.name}</span>
                  <span className="text-xs font-bold text-accent-600">{sk.proficiency}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-brand-200/80 bg-brand-50/40">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <h3 className="mt-2 font-display text-base font-bold text-ink-900">Matched Opportunities</h3>
            <p className="mt-1 text-xs text-ink-600 leading-relaxed">
              Discover verified internship openings matched to your credential passport.
            </p>
            <button onClick={() => navigate('/student/internships')} className="mt-3 btn-primary w-full text-xs">
              Browse Matches <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Card>
        </div>
      </div>

      {/* EDIT PASSPORT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-lift max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-ink-900 text-lg">Edit Skill Passport Profile</h3>
                  <p className="text-xs text-ink-500">Update your academic information and passport metadata</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-xl text-ink-400 hover:bg-ink-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Full Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input"
                    placeholder="e.g. Alex Chen"
                  />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="input"
                    placeholder="alex@university.edu"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">University / Institution</label>
                  <input
                    type="text"
                    value={editUniversity}
                    onChange={(e) => setEditUniversity(e.target.value)}
                    className="input"
                    placeholder="e.g. Stanford University, ITER SOA"
                  />
                </div>
                <div>
                  <label className="label">Academic Program</label>
                  <input
                    type="text"
                    value={editProgram}
                    onChange={(e) => setEditProgram(e.target.value)}
                    className="input"
                    placeholder="e.g. B.Tech Computer Science"
                  />
                </div>
              </div>

              <div>
                <label className="label">Current Year</label>
                <select value={editYear} onChange={(e) => setEditYear(e.target.value)} className="input">
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                  <option value="Recent Graduate">Recent Graduate</option>
                </select>
              </div>

              <div>
                <label className="label">Professional Bio / Elevator Pitch</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder="Describe your technical focus, goals, and projects..."
                />
              </div>

              {/* Student Photograph / Headshot */}
              <div className="p-4 rounded-2xl bg-ink-50/70 border border-ink-100">
                <label className="label mb-2">Student Photograph / Headshot</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-shrink-0">
                    <Avatar
                      name={editName || 'Student'}
                      color={editColor}
                      photoUrl={editPhotoUrl || undefined}
                      size="lg"
                    />
                  </div>
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
                      {editPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setEditPhotoUrl('')}
                          className="text-xs text-rose-600 hover:underline font-semibold"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <div>
                      <input
                        type="url"
                        value={editPhotoUrl}
                        onChange={(e) => setEditPhotoUrl(e.target.value)}
                        placeholder="Or paste image URL (e.g. GitHub avatar / LinkedIn photo)"
                        className="input text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="label">Avatar Color Theme (Fallback when no photo)</label>
                <div className="flex gap-2 mt-1">
                  {AVATAR_GRADIENTS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEditColor(g)}
                      className={`h-8 w-8 rounded-xl bg-gradient-to-br ${g} transition-transform ${
                        editColor === g ? 'ring-2 ring-brand-600 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Interests Selector */}
              <div>
                <label className="label">Technical Interests & Focus Areas</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {AVAILABLE_INTERESTS.map((it) => {
                    const active = editInterests.includes(it);
                    return (
                      <button
                        key={it}
                        type="button"
                        onClick={() => toggleInterest(it)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                        }`}
                      >
                        {it}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-ink-100">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setShowDeleteModal(true);
                }}
                className="text-xs text-rose-600 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Profile
              </button>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={!editName.trim()}
                  className="btn-primary text-xs inline-flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-lift space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-ink-900 text-base">Delete Skill Passport?</h3>
                <p className="text-xs text-ink-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-ink-600 leading-relaxed">
              Are you sure you want to delete <strong>{student.name}</strong>'s skill passport? All verified evidence records, applications, and cryptographic proofs associated with this profile will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-100">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary text-xs py-2 px-3">
                Keep Passport
              </button>
              <button
                onClick={handleDeleteProfile}
                className="btn-primary text-xs py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white inline-flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PassportStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-200/80 bg-ink-50 px-3 py-2 text-center sm:text-left">
      <div className="text-lg font-bold text-brand-700">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</div>
    </div>
  );
}

function EvidenceDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    coursework: 'bg-brand-500',
    project: 'bg-accent-500',
    competition: 'bg-amber-500',
    credential: 'bg-indigo-500',
    experience: 'bg-rose-500',
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[type] ?? 'bg-ink-400'}`} />;
}
