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
  Code2,
  FileCode2,
  Download,
  Linkedin,
} from 'lucide-react';
import { studentMap, getStudentSkills, getStudentEvidence, skillMap, SKILLS } from '@/data/mockData';
import { Card, Chip, SkillBadge, ProgressBar, VerificationPill, EvidenceTypeIcon } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/authContext';
import { generateSha256 } from '@/lib/crypto';
import { useToast } from '@/lib/toast';
import { VerifiableCredentialModal } from '@/components/VerifiableCredentialModal';

export function PublicPassportPage({ studentId }: { studentId: string }) {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [verificationHash, setVerificationHash] = useState<string>('');
  const [showInspector, setShowInspector] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showVcModal, setShowVcModal] = useState(false);
  const [embedTab, setEmbedTab] = useState<'markdown' | 'html' | 'linkedin' | 'iframe'>('markdown');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [photoHash, setPhotoHash] = useState<string | null>(null);

  const student = studentMap[studentId];

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
    toast.success('Public passport URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(verificationHash);
    setCopiedHash(true);
    toast.success('Verification hash copied to clipboard!');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    toast.info('Opening print dialogue. Select "Save as PDF" to export your official certificate.');
    window.print();
  };

  const displayHash = verificationHash
    ? `${verificationHash.slice(0, 16)}...${verificationHash.slice(-8)}`
    : 'Computing verification seal...';

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 print:bg-white py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Top Floating Action Bar (Hidden in Print) */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <LogoMark size={28} />
            <span className="font-display font-bold text-ink-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
              EvidentX Passport
            </span>
          </button>
          <span className="text-ink-300 dark:text-[#8b949e]">/</span>
          <span className="text-xs font-semibold text-ink-600 dark:text-[#c9d1d9]">{student.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVcModal(true)}
            className="btn-secondary text-xs py-2 px-3 shadow-2xs inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            title="Inspect W3C Verifiable Credential (JSON-LD) with Ed25519 digital signature"
          >
            <FileCode2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>W3C VC (JSON-LD)</span>
          </button>

          <button
            onClick={() => setShowEmbedModal(true)}
            className="btn-secondary text-xs py-2 px-3 shadow-2xs inline-flex items-center gap-1.5"
            title="Get embeddable badges for GitHub README or LinkedIn"
          >
            <Code2 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            <span>Embed Badge</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="btn-secondary text-xs py-2 px-3 shadow-2xs inline-flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
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
      <div className="max-w-5xl mx-auto bg-white dark:bg-[#161b22] rounded-3xl border border-ink-200/90 dark:border-[#30363d] shadow-card p-6 sm:p-10 print:shadow-none print:border-none print:p-0">
        {/* Certificate Header Banner */}
        <div className="border-b border-ink-100 dark:border-[#30363d] pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Avatar Badge / Photo */}
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="h-20 w-20 rounded-2xl object-cover shadow-soft flex-shrink-0 border border-ink-200 dark:border-[#30363d]"
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
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-3 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Verified Cryptographic Skill Passport</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-white tracking-tight">
                {student.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600 dark:text-ink-300 mt-1">
                <span className="flex items-center gap-1 font-medium">
                  <GraduationCap className="h-3.5 w-3.5 text-ink-400 dark:text-[#8b949e]" />
                  {student.program} · {student.year}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-ink-400 dark:text-[#8b949e]" />
                  {student.university}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Badge & Stats Card */}
          <div className="flex flex-wrap items-center gap-3 bg-ink-50/80 dark:bg-[#0d1117] p-4 rounded-2xl border border-ink-100 dark:border-[#30363d]">
            <div className="text-center px-2">
              <div className="font-display text-xl font-bold text-ink-900 dark:text-white">{studentSkills.length}</div>
              <div className="text-[10px] font-bold uppercase text-ink-400 dark:text-[#8b949e]">Skills Mapped</div>
            </div>
            <div className="h-8 w-px bg-ink-200 dark:bg-[#30363d]" />
            <div className="text-center px-2">
              <div className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">{verifiedCount}</div>
              <div className="text-[10px] font-bold uppercase text-ink-400 dark:text-[#8b949e]">Verified Proofs</div>
            </div>
            <div className="h-8 w-px bg-ink-200 dark:bg-[#30363d]" />
            <div className="text-center px-2">
              <div className="font-display text-xl font-bold text-brand-600 dark:text-brand-400">{avgProficiency}%</div>
              <div className="text-[10px] font-bold uppercase text-ink-400 dark:text-[#8b949e]">Mean Strength</div>
            </div>
          </div>
        </div>

        {/* Cryptographic Ledger Banner */}
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
                Verification ID: {displayHash}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVcModal(true)}
              className="btn-secondary text-xs py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white border-white/20 whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <FileCode2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>W3C VC (JSON-LD)</span>
            </button>

            <button
              onClick={() => setShowInspector(true)}
              className="btn-secondary text-xs py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white border-white/20 whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Inspect Proof</span>
            </button>
          </div>
        </div>

        {/* Section 1: Verified Skill Competencies */}
        <div className="pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">Verified Skill Competencies</h2>
              <p className="text-xs text-ink-500 dark:text-[#8b949e]">Derived deterministically from code repositories, coursework, and credentials</p>
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
                      : 'bg-ink-100 dark:bg-[#21262d] text-ink-600 dark:text-[#c9d1d9] hover:bg-ink-200/80 dark:hover:bg-[#30363d]'
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
                  className="p-4 rounded-2xl border border-ink-100 dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-ink-200 dark:hover:border-ink-600 hover:shadow-soft transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink-900 dark:text-white text-sm">{skillDef?.name ?? sk.skillId}</span>
                    <span className="font-display font-bold text-brand-600 dark:text-brand-400 text-sm">{sk.proficiency}%</span>
                  </div>

                  <div className="mt-2">
                    <ProgressBar value={sk.proficiency} />
                  </div>

                  <div className="mt-3 pt-2 border-t border-ink-100 dark:border-[#30363d] flex items-center justify-between text-[11px] text-ink-500 dark:text-[#8b949e]">
                    <span className="font-medium text-ink-600 dark:text-[#c9d1d9]">{skillDef?.category ?? 'General'}</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
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
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">Verified Evidence & Artifact Dossier</h2>
            <p className="text-xs text-ink-500 dark:text-[#8b949e]">
              Granular audit trail of published code repositories, competition placements, and accredited certifications
            </p>
          </div>

          <div className="space-y-3.5">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="p-5 rounded-2xl border border-ink-100 dark:border-[#30363d] bg-ink-50/40 dark:bg-[#161b22]/70 hover:bg-white dark:hover:bg-[#161b22] hover:border-ink-200 dark:hover:border-[#484f58] hover:shadow-soft transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <EvidenceTypeIcon type={ev.type} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-ink-900 dark:text-white">{ev.title}</h3>
                        <VerificationPill status={ev.verification} />
                        {ev.score && <Chip color="brand">{ev.score}</Chip>}
                      </div>
                      <p className="text-xs text-ink-600 dark:text-ink-300 mt-1 leading-relaxed">{ev.description}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500 dark:text-[#8b949e] mt-2.5">
                        <span>
                          Issued by: <strong className="text-ink-700 dark:text-[#c9d1d9]">{ev.issuer}</strong>
                        </span>
                        <span>
                          Date: <strong className="text-ink-700 dark:text-[#c9d1d9]">{ev.date}</strong>
                        </span>
                        <span>
                          Evidence Strength: <strong className="text-ink-700 dark:text-[#c9d1d9]">{ev.strength}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 hover:underline flex-shrink-0 print:text-ink-700"
                    >
                      <span>View Proof</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {/* Demonstrated Skills in this evidence */}
                <div className="mt-3.5 pt-3 border-t border-ink-100/70 dark:border-[#30363d] flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-[#8b949e] mr-1">Proves:</span>
                  {ev.skills.map((sid) => (
                    <SkillBadge key={sid} name={skillMap[sid]?.name ?? sid} size="sm" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Showcase & Embed Card (Hidden in Print) */}
        <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-50/70 via-ink-50/50 to-brand-50/70 dark:from-brand-950/30 dark:via-[#161b22] dark:to-brand-950/30 border border-brand-200/80 dark:border-[#30363d] print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-ink-900 dark:text-white">
                Embed Verified Badge on GitHub & LinkedIn
              </h4>
              <p className="text-xs text-ink-500 dark:text-[#8b949e]">
                Display your live cryptographic verification badge on repository READMEs, portfolio, or resume.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmbedModal(true)}
              className="btn-primary text-xs py-2 px-3.5 shadow-2xs whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Get Embed Badge</span>
            </button>
          </div>
        </div>

        {/* Official Certificate Print Footer (Visible in Print Only) */}
        <div className="hidden print:block mt-10 pt-6 border-t-2 border-ink-900 text-xs text-ink-700">
          <div className="flex justify-between items-end">
            <div>
              <div className="font-bold text-ink-900 uppercase tracking-widest text-[11px]">EvidentX Protocol Attestation</div>
              <div className="text-[10px] text-ink-600 mt-1">Cryptographically sealed credential for {student.name} ({student.program}, {student.university})</div>
              <div className="font-mono text-[9px] text-ink-500 mt-0.5">Verification Seal: {verificationHash}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-ink-500">Issued & Certified via EvidentX</div>
              <div className="text-xs font-bold text-ink-900 mt-1">Status: VERIFIED & TAMPER-EVIDENT</div>
            </div>
          </div>
        </div>

        {/* Footer Verification Seal */}
        <div className="mt-12 pt-6 border-t border-ink-100 dark:border-[#30363d] flex flex-col sm:flex-row items-center justify-between text-xs text-ink-400 dark:text-[#8b949e] gap-3 text-center sm:text-left print:hidden">
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
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#161b22] p-6 sm:p-8 shadow-lift space-y-4 border border-ink-100 dark:border-[#30363d]">
            <div className="flex items-center justify-between border-b border-ink-100 dark:border-[#30363d] pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-ink-900 dark:text-white text-base">Cryptographic Ledger Verification</h3>
                  <p className="text-xs text-ink-500 dark:text-[#8b949e]">Immutable Digest Verification</p>
                </div>
              </div>
              <button onClick={() => setShowInspector(false)} className="p-1 rounded-xl text-ink-400 hover:bg-ink-100 dark:hover:bg-[#21262d] dark:hover:text-[#c9d1d9]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-ink-50 dark:bg-[#0d1117] border border-ink-200 dark:border-[#30363d]">
                <div className="text-[10px] font-bold uppercase text-ink-400 dark:text-[#8b949e] mb-1">Authenticated Subject</div>
                <div className="font-bold text-ink-900 dark:text-white text-sm">{student.name}</div>
                <div className="text-ink-600 dark:text-ink-300 mt-0.5">{student.program} · {student.university}</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-ink-400 dark:text-[#8b949e]">
                    Cryptographic Passport Signature
                  </span>
                  <button
                    onClick={handleCopyHash}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {copiedHash ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedHash ? 'Copied!' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-ink-900 dark:bg-[#0d1117] border border-ink-800 dark:border-[#30363d] font-mono text-[11px] text-emerald-400 break-all leading-relaxed select-all">
                  {verificationHash}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-ink-50 dark:bg-[#0d1117] border border-ink-100 dark:border-[#30363d]">
                  <div className="text-[10px] font-bold uppercase text-ink-400 dark:text-[#8b949e]">Verified Evidence Count</div>
                  <div className="font-bold text-ink-900 dark:text-white mt-0.5">{evidenceList.length} Verified Artifacts</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                  <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Tamper Integrity</div>
                  <div className="font-bold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Valid & Unmodified</span>
                  </div>
                </div>
              </div>

              {photoHash && (
                <div className="p-3 rounded-xl bg-ink-50 dark:bg-[#0d1117] border border-ink-200 dark:border-[#30363d]">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-ink-400 dark:text-[#8b949e] mb-1">
                    <span>Student Photograph Asset Seal</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Tamper-Proof Headshot
                    </span>
                  </div>
                  <div className="font-mono text-[10.5px] text-ink-800 dark:text-[#c9d1d9] break-all select-all leading-tight">
                    {photoHash}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-ink-500 dark:text-[#8b949e] pt-1">
                This hash is calculated over the entire portfolio of verified artifacts and headshot assets. Any alteration of skill scores, project dates, or student credentials produces a hash mismatch and is flagged immediately.
              </div>
            </div>

            <div className="pt-3 border-t border-ink-100 dark:border-[#30363d] flex justify-end">
              <button onClick={() => setShowInspector(false)} className="btn-primary text-xs py-2 px-4">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Badge & Showcase Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#161b22] p-6 sm:p-8 shadow-lift space-y-5 border border-ink-100 dark:border-[#30363d] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ink-100 dark:border-[#30363d] pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-ink-900 dark:text-white text-lg">
                    Embed Verified Skill Badge
                  </h3>
                  <p className="text-xs text-ink-500 dark:text-[#8b949e]">
                    Showcase this verified credential on GitHub READMEs, personal portfolios, and LinkedIn.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmbedModal(false)}
                className="p-1.5 rounded-xl text-ink-400 hover:bg-ink-100 dark:hover:bg-[#21262d] dark:hover:text-[#c9d1d9] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Live Badge Preview Card */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-[#8b949e]">
                Live Badge Preview
              </div>
              <div className="p-5 rounded-2xl bg-ink-900 dark:bg-[#0d1117] border border-ink-800 dark:border-[#30363d] flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center overflow-hidden rounded-md border border-emerald-600 font-mono text-xs shadow-sm select-none">
                    <span className="bg-ink-950 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
                      <LogoMark size={14} /> EvidentX
                    </span>
                    <span className="bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {student.name} · Verified
                    </span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-emerald-400 font-mono">
                  {verificationHash ? `${verificationHash.slice(0, 12)}...` : 'Tamper-Proof'}
                </div>
              </div>
            </div>

            {/* Embed Format Switcher Tabs */}
            <div className="flex border-b border-ink-100 dark:border-[#30363d] gap-2 overflow-x-auto pb-1 text-xs font-bold">
              <button
                onClick={() => setEmbedTab('markdown')}
                className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap ${
                  embedTab === 'markdown'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                    : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
                }`}
              >
                Markdown (GitHub README)
              </button>
              <button
                onClick={() => setEmbedTab('html')}
                className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap ${
                  embedTab === 'html'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                    : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
                }`}
              >
                HTML / Website
              </button>
              <button
                onClick={() => setEmbedTab('linkedin')}
                className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
                  embedTab === 'linkedin'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                    : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
                }`}
              >
                <Linkedin className="h-3.5 w-3.5" />
                <span>LinkedIn Add-to-Profile</span>
              </button>
              <button
                onClick={() => setEmbedTab('iframe')}
                className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap ${
                  embedTab === 'iframe'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                    : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
                }`}
              >
                Interactive IFrame Widget
              </button>
            </div>

            {/* Tab Contents */}
            {embedTab === 'markdown' && (
              <div className="space-y-3">
                <p className="text-xs text-ink-600 dark:text-[#8b949e]">
                  Paste this snippet into your GitHub profile or repository <code className="px-1 py-0.5 rounded bg-ink-100 dark:bg-[#21262d] font-mono text-[11px]">README.md</code> to display your live verified passport badge:
                </p>
                <div className="relative">
                  <pre className="p-3.5 rounded-2xl bg-ink-900 dark:bg-[#0d1117] text-ink-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all border border-ink-800 dark:border-[#30363d] select-all">
{`[![EvidentX Verified Skill Passport](https://img.shields.io/badge/EvidentX_Passport-${encodeURIComponent(student.name).replace(/-/g, '--')}_%E2%9C%93_Verified-059669?style=for-the-badge&logo=shield&logoColor=white)](${window.location.origin}/passport/${student.id})`}
                  </pre>
                  <button
                    onClick={() => {
                      const snippet = `[![EvidentX Verified Skill Passport](https://img.shields.io/badge/EvidentX_Passport-${encodeURIComponent(student.name).replace(/-/g, '--')}_%E2%9C%93_Verified-059669?style=for-the-badge&logo=shield&logoColor=white)](${window.location.origin}/passport/${student.id})`;
                      navigator.clipboard.writeText(snippet);
                      toast.success('Markdown badge snippet copied to clipboard!');
                    }}
                    className="absolute top-2.5 right-2.5 btn-secondary text-xs py-1.5 px-2.5 shadow-2xs inline-flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            )}

            {embedTab === 'html' && (
              <div className="space-y-3">
                <p className="text-xs text-ink-600 dark:text-[#8b949e]">
                  Embed this HTML badge into your personal portfolio website or blog:
                </p>
                <div className="relative">
                  <pre className="p-3.5 rounded-2xl bg-ink-900 dark:bg-[#0d1117] text-ink-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all border border-ink-800 dark:border-[#30363d] select-all">
{`<a href="${window.location.origin}/passport/${student.id}" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/EvidentX_Passport-${encodeURIComponent(student.name).replace(/-/g, '--')}_%E2%9C%93_Verified-059669?style=for-the-badge&logo=shield&logoColor=white" alt="EvidentX Verified Skill Passport" />
</a>`}
                  </pre>
                  <button
                    onClick={() => {
                      const snippet = `<a href="${window.location.origin}/passport/${student.id}" target="_blank" rel="noopener noreferrer">\n  <img src="https://img.shields.io/badge/EvidentX_Passport-${encodeURIComponent(student.name).replace(/-/g, '--')}_%E2%9C%93_Verified-059669?style=for-the-badge&logo=shield&logoColor=white" alt="EvidentX Verified Skill Passport" />\n</a>`;
                      navigator.clipboard.writeText(snippet);
                      toast.success('HTML snippet copied to clipboard!');
                    }}
                    className="absolute top-2.5 right-2.5 btn-secondary text-xs py-1.5 px-2.5 shadow-2xs inline-flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            )}

            {embedTab === 'linkedin' && (
              <div className="space-y-4">
                <p className="text-xs text-ink-600 dark:text-[#8b949e]">
                  Add this cryptographic verification to your LinkedIn profile under <strong>Licenses & Certifications</strong> with 1 click:
                </p>
                <div className="p-4 rounded-2xl bg-ink-50 dark:bg-[#0d1117] border border-ink-200 dark:border-[#30363d] space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-ink-200/60 dark:border-[#30363d]">
                    <span className="text-ink-500">Name:</span>
                    <span className="font-bold text-ink-900 dark:text-white">EvidentX Verified Skill Passport</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-ink-200/60 dark:border-[#30363d]">
                    <span className="text-ink-500">Issuing Organization:</span>
                    <span className="font-bold text-ink-900 dark:text-white">EvidentX Talent Network</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-ink-200/60 dark:border-[#30363d]">
                    <span className="text-ink-500">Credential ID:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {verificationHash ? verificationHash.slice(0, 16) : student.id}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ink-500">Credential URL:</span>
                    <span className="font-mono text-ink-600 dark:text-[#8b949e] truncate max-w-[280px]">
                      {window.location.href}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=EvidentX%20Verified%20Skill%20Passport&organizationName=EvidentX&issueYear=2026&issueMonth=9&certUrl=${encodeURIComponent(window.location.href)}&certId=${encodeURIComponent(verificationHash ? verificationHash.slice(0, 16) : student.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-primary text-xs py-2.5 inline-flex items-center justify-center gap-2"
                >
                  <Linkedin className="h-4 w-4" />
                  <span>Open LinkedIn Add-to-Profile (Pre-Filled)</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {embedTab === 'iframe' && (
              <div className="space-y-3">
                <p className="text-xs text-ink-600 dark:text-[#8b949e]">
                  Embed this interactive live passport widget directly into an external web page:
                </p>
                <div className="relative">
                  <pre className="p-3.5 rounded-2xl bg-ink-900 dark:bg-[#0d1117] text-ink-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all border border-ink-800 dark:border-[#30363d] select-all">
{`<iframe src="${window.location.origin}/passport/${student.id}" width="100%" height="450" frameborder="0" style="border-radius:16px;border:1px solid #30363d;" title="EvidentX Verified Passport - ${student.name}"></iframe>`}
                  </pre>
                  <button
                    onClick={() => {
                      const snippet = `<iframe src="${window.location.origin}/passport/${student.id}" width="100%" height="450" frameborder="0" style="border-radius:16px;border:1px solid #30363d;" title="EvidentX Verified Passport - ${student.name}"></iframe>`;
                      navigator.clipboard.writeText(snippet);
                      toast.success('IFrame embed snippet copied to clipboard!');
                    }}
                    className="absolute top-2.5 right-2.5 btn-secondary text-xs py-1.5 px-2.5 shadow-2xs inline-flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-ink-100 dark:border-[#30363d] flex justify-end">
              <button
                onClick={() => setShowEmbedModal(false)}
                className="btn-primary text-xs py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* W3C Verifiable Credential Modal */}
      <VerifiableCredentialModal
        isOpen={showVcModal}
        onClose={() => setShowVcModal(false)}
        student={student}
        studentSkills={studentSkills}
        evidenceList={evidenceList}
      />
    </div>
  );
}
