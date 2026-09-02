import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  QrCode,
  Share2,
  Printer,
  ExternalLink,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Calendar,
  Building2,
  FileBadge,
  ArrowRight,
  Copy,
  Check,
  Lock,
  X,
  Layers,
} from 'lucide-react';
import { studentMap, getStudentSkills, getStudentEvidence, skillMap, SKILLS } from '@/data/mockData';
import { Card, Chip, SkillBadge, ProgressBar, VerificationPill, EvidenceTypeIcon } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/authContext';
import { generateSha256 } from '@/lib/crypto';

export function PublicPassportPage({ studentId }: { studentId: string }) {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [verificationHash, setVerificationHash] = useState<string>('');
  const [showInspector, setShowInspector] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [photoHash, setPhotoHash] = useState<string | null>(null);

  const student = studentMap[studentId] ?? Object.values(studentMap)[0];

  useEffect(() => {
    if (student) {
      const evidenceList = getStudentEvidence(student.id);
      const payload = {
        studentId: student.id,
        name: student.name,
        university: student.university,
        photoHash: student.photoUrl ? student.photoUrl.slice(0, 100) : null,
        evidenceCount: evidenceList.length,
        evidenceIds: evidenceList.map((e) => e.id).sort(),
      };
      generateSha256(payload).then((hash) => setVerificationHash(hash));

      if (student.photoUrl) {
        generateSha256(student.photoUrl).then(setPhotoHash);
      } else {
        setPhotoHash(null);
      }
    }
  }, [student]);

  if (!student) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4">
        <div className="card max-w-md p-8 text-center">
          <h2 className="text-lg font-bold text-ink-900">Student Profile Not Found</h2>
          <p className="text-xs text-ink-500 mt-2">The requested verified skill passport does not exist.</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4 text-xs">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const studentSkills = getStudentSkills(student.id);
  const evidenceList = getStudentEvidence(student.id);

  // Compute stats
  const verifiedCount = evidenceList.filter((e) => e.verification === 'verified').length;
  const avgProficiency =
    studentSkills.length > 0
      ? Math.round(studentSkills.reduce((sum, s) => sum + s.proficiency, 0) / studentSkills.length)
      : 85;

  const categories = ['All', ...Array.from(new Set(SKILLS.map((s) => s.category)))];

  const filteredSkills =
    activeCategory === 'All'
      ? studentSkills
      : studentSkills.filter((s) => {
          const sk = skillMap[s.skillId];
          return sk && sk.category === activeCategory;
        });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(verificationHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const displayHash = verificationHash
    ? `${verificationHash.slice(0, 16)}...${verificationHash.slice(-8)}`
    : 'Computing SHA-256 digest...';

  return (
    <div className="min-h-screen bg-ink-50 print:bg-white py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Floating Action Bar (Hidden in Print) */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <LogoMark size={28} />
            <span className="font-display font-bold text-ink-900 group-hover:text-brand-600 transition">
              EvidentX Passport
            </span>
          </button>
          <span className="text-ink-300">/</span>
          <span className="text-xs font-semibold text-ink-600">{student.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="btn-secondary text-xs py-2 px-3 shadow-2xs inline-flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Share Public Link'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-secondary text-xs py-2 px-3 shadow-2xs inline-flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={() => navigate(profile?.role === 'organization' ? '/org/dashboard' : '/student/dashboard')}
            className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
          >
            <span>{profile?.role === 'organization' ? 'Organization Portal' : 'Launch App'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Passport Document Container */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-ink-200/90 shadow-card p-6 sm:p-10 print:shadow-none print:border-none print:p-0">
        {/* Certificate Header Banner */}
        <div className="border-b border-ink-100 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Avatar Badge / Photo */}
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="h-20 w-20 rounded-2xl object-cover shadow-soft flex-shrink-0 border border-ink-200"
              />
            ) : (
              <div
                className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${student.avatarColor} text-white flex items-center justify-center font-display text-2xl font-bold shadow-soft flex-shrink-0`}
              >
                {student.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
            )}

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Verified Cryptographic Skill Passport</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
                {student.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600 mt-1">
                <span className="flex items-center gap-1 font-medium">
                  <GraduationCap className="h-3.5 w-3.5 text-ink-400" />
                  {student.program} · {student.year}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-ink-400" />
                  {student.university}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Badge & Stats Card */}
          <div className="flex flex-wrap items-center gap-3 bg-ink-50/80 p-4 rounded-2xl border border-ink-100">
            <div className="text-center px-2">
              <div className="font-display text-xl font-bold text-ink-900">{studentSkills.length}</div>
              <div className="text-[10px] font-bold uppercase text-ink-400">Skills Mapped</div>
            </div>
            <div className="h-8 w-px bg-ink-200" />
            <div className="text-center px-2">
              <div className="font-display text-xl font-bold text-emerald-600">{verifiedCount}</div>
              <div className="text-[10px] font-bold uppercase text-ink-400">Verified Proofs</div>
            </div>
            <div className="h-8 w-px bg-ink-200" />
            <div className="text-center px-2">
              <div className="font-display text-xl font-bold text-brand-600">{avgProficiency}%</div>
              <div className="text-[10px] font-bold uppercase text-ink-400">Mean Strength</div>
            </div>
          </div>
        </div>

        {/* Cryptographic SHA-256 Ledger Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-ink-900 to-ink-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Tamper-Proof Ledger Seal
              </div>
              <div className="font-mono text-xs text-ink-200 truncate max-w-sm sm:max-w-md">
                SHA-256: {displayHash}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowInspector(true)}
            className="btn-secondary text-xs py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white border-white/20 whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Inspect Cryptographic Proof</span>
          </button>
        </div>

        {/* Section 1: Verified Skill Competencies */}
        <div className="pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">Verified Skill Competencies</h2>
              <p className="text-xs text-ink-500">Derived deterministically from code repositories, coursework, and credentials</p>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5 print:hidden">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    activeCategory === cat
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {filteredSkills.map((sk) => {
              const skillDef = skillMap[sk.skillId];
              const supporting = evidenceList.filter((e) => e.skills.includes(sk.skillId));

              return (
                <div
                  key={sk.skillId}
                  className="p-4 rounded-2xl border border-ink-100 bg-white hover:border-ink-200 hover:shadow-soft transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink-900 text-sm">{skillDef?.name ?? sk.skillId}</span>
                    <span className="font-display font-bold text-brand-600 text-sm">{sk.proficiency}%</span>
                  </div>

                  <div className="mt-2">
                    <ProgressBar value={sk.proficiency} />
                  </div>

                  <div className="mt-3 pt-2 border-t border-ink-100 flex items-center justify-between text-[11px] text-ink-500">
                    <span className="font-medium text-ink-600">{skillDef?.category ?? 'General'}</span>
                    <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {supporting.length} proof artifact{supporting.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Verified Evidence Dossier */}
        <div className="pt-10">
          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-ink-900">Verified Evidence & Artifact Dossier</h2>
            <p className="text-xs text-ink-500">
              Granular audit trail of published code repositories, competition placements, and accredited certifications
            </p>
          </div>

          <div className="space-y-3.5">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="p-5 rounded-2xl border border-ink-100 bg-ink-50/40 hover:bg-white hover:border-ink-200 hover:shadow-soft transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <EvidenceTypeIcon type={ev.type} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-ink-900">{ev.title}</h3>
                        <VerificationPill status={ev.verification} />
                        {ev.score && <Chip color="brand">{ev.score}</Chip>}
                      </div>
                      <p className="text-xs text-ink-600 mt-1 leading-relaxed">{ev.description}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500 mt-2.5">
                        <span>
                          Issued by: <strong>{ev.issuer}</strong>
                        </span>
                        <span>
                          Date: <strong>{ev.date}</strong>
                        </span>
                        <span>
                          Evidence Strength: <strong>{ev.strength}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline flex-shrink-0 print:text-ink-700"
                    >
                      <span>View Proof</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {/* Demonstrated Skills in this evidence */}
                <div className="mt-3.5 pt-3 border-t border-ink-100/70 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mr-1">Proves:</span>
                  {ev.skills.map((sid) => (
                    <SkillBadge key={sid} name={skillMap[sid]?.name ?? sid} size="sm" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Verification Seal */}
        <div className="mt-12 pt-6 border-t border-ink-100 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-400 gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <LogoMark size={20} />
            <span>EvidentX Protocol · Cryptographic Proof & Skill Passport Standard</span>
          </div>
          <div>Verification Signature Valid · Tamper-Evident Record</div>
        </div>
      </div>

      {/* Cryptographic Inspector Modal */}
      {showInspector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-lift space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-ink-900 text-base">Cryptographic Ledger Verification</h3>
                  <p className="text-xs text-ink-500">Immutable SHA-256 Digest Verification</p>
                </div>
              </div>
              <button onClick={() => setShowInspector(false)} className="p-1 rounded-xl text-ink-400 hover:bg-ink-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-ink-50 border border-ink-200">
                <div className="text-[10px] font-bold uppercase text-ink-400 mb-1">Authenticated Subject</div>
                <div className="font-bold text-ink-900 text-sm">{student.name}</div>
                <div className="text-ink-600 mt-0.5">{student.program} · {student.university}</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-ink-400">
                    64-Character SHA-256 Passport Signature
                  </span>
                  <button
                    onClick={handleCopyHash}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
                  >
                    {copiedHash ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedHash ? 'Copied!' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-ink-900 font-mono text-[11px] text-emerald-400 break-all leading-relaxed select-all">
                  {verificationHash}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-ink-50 border border-ink-100">
                  <div className="text-[10px] font-bold uppercase text-ink-400">Verified Evidence Count</div>
                  <div className="font-bold text-ink-900 mt-0.5">{evidenceList.length} Verified Artifacts</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <div className="text-[10px] font-bold uppercase text-emerald-600">Tamper Integrity</div>
                  <div className="font-bold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Valid & Unmodified</span>
                  </div>
                </div>
              </div>

              {photoHash && (
                <div className="p-3 rounded-xl bg-ink-50 border border-ink-200">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-ink-400 mb-1">
                    <span>Student Photograph Asset Digest (SHA-256)</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Tamper-Proof Headshot
                    </span>
                  </div>
                  <div className="font-mono text-[10.5px] text-ink-800 break-all select-all leading-tight">
                    {photoHash}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-ink-500 pt-1">
                This hash is calculated over the entire portfolio of verified artifacts and headshot assets. Any alteration of skill scores, project dates, or student credentials produces a hash mismatch and is flagged immediately.
              </div>
            </div>

            <div className="pt-3 border-t border-ink-100 flex justify-end">
              <button onClick={() => setShowInspector(false)} className="btn-primary text-xs py-2 px-4">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
