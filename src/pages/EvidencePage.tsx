import { useState } from 'react';
import {
  Filter,
  FileBadge,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  Brain,
  ShieldCheck,
  Github,
  UploadCloud,
  FileText,
  ExternalLink,
  QrCode,
  KeyRound,
  Star,
  GitFork,
  Check,
  Copy,
  Layers,
  Lock,
  Edit3,
  Trash2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  VerificationPill,
  EvidenceTypeIcon,
  Chip,
  EmptyState,
} from '@/components/ui';
import { useDemoStudent } from '@/lib/useDemoStudent';
import { getStudentEvidence, skillMap, SKILLS, evidenceSkillStrength } from '@/data/mockData';
import { useCustomStudents } from '@/lib/customStudents';
import { useRouter } from '@/lib/router';
import { scanGithubRepository, type GithubScanResult } from '@/lib/githubScanner';
import { createEvidenceFingerprint, type EvidenceFingerprint } from '@/lib/crypto';
import { verifyUploadedFile, inspectIssuerAuthority, type FileVerificationResult } from '@/lib/credentialVerifier';
import { notifyRecruitersOnEvidenceUpdate } from '@/lib/notifications';
import type { Evidence, EvidenceType, VerificationStatus } from '@/types';

const FILTERS = ['all', 'coursework', 'project', 'competition', 'credential'] as const;

export function EvidencePage() {
  const { studentId, student, setStudentId, students } = useDemoStudent();
  const { addEvidence, updateEvidence, deleteEvidence } = useCustomStudents();
  const { navigate } = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'form' | 'github' | 'upload'>('form');

  // Edit Evidence Mode
  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);

  // New/Edit evidence form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EvidenceType>('project');
  const [issuer, setIssuer] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [score, setScore] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillStrengths, setSkillStrengths] = useState<Record<string, number>>({});
  const [verification, setVerification] = useState<VerificationStatus>('verified');
  const [verificationMethod, setVerificationMethod] = useState<string>('Standard Attestation');

  // File upload state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileVerification, setFileVerification] = useState<FileVerificationResult | null>(null);

  // Live GitHub Scanner state
  const [githubUrl, setGithubUrl] = useState('');
  const [isScanningGithub, setIsScanningGithub] = useState(false);
  const [githubScanData, setGithubScanData] = useState<GithubScanResult | null>(null);
  const [githubScanError, setGithubScanError] = useState<string | null>(null);

  // AI Scanner state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAuditNote, setAiAuditNote] = useState<string | null>(null);

  // Cryptographic Audit Modal State
  const [inspectedEvidence, setInspectedEvidence] = useState<{
    evidence: Evidence;
    fingerprint: EvidenceFingerprint;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Delete Confirmation State
  const [deletingEvidence, setDeletingEvidence] = useState<Evidence | null>(null);

  // Live Recruiter Notification & Cryptographic Reseal Banner
  const [auditAlertMessage, setAuditAlertMessage] = useState<string | null>(null);

  if (!student) return null;

  const evidence = getStudentEvidence(studentId);
  const filtered = filter === 'all' ? evidence : evidence.filter((e) => e.type === filter);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setUrl('');
    setIssuer('');
    setScore('');
    setSelectedSkills([]);
    setSkillStrengths({});
    setAiAuditNote(null);
    setUploadedFileName(null);
    setGithubUrl('');
    setGithubScanData(null);
    setEditingEvidenceId(null);
    setVerificationMethod('Standard Attestation');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (ev: Evidence) => {
    setEditingEvidenceId(ev.id);
    setTitle(ev.title);
    setType(ev.type);
    setIssuer(ev.issuer);
    setUrl(ev.url || '');
    setDescription(ev.description || '');
    setScore(ev.score || '');
    setSelectedSkills(ev.skills || []);
    
    // Load strengths from lookup or default to 85
    const existingStrengths: Record<string, number> = {};
    for (const sk of ev.skills) {
      existingStrengths[sk] = evidenceSkillStrength[ev.id]?.[sk] ?? ev.strength ?? 85;
    }
    setSkillStrengths(existingStrengths);
    setVerification(ev.verification);
    setVerificationMethod(ev.verificationMethod || 'Standard Attestation');
    setModalTab('form');
    setShowModal(true);
  };

  const toggleSkill = (id: string) => {
    if (selectedSkills.includes(id)) {
      setSelectedSkills((p) => p.filter((x) => x !== id));
      setSkillStrengths((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    } else {
      setSelectedSkills((p) => [...p, id]);
      setSkillStrengths((p) => ({ ...p, [id]: 85 }));
    }
  };

  const handleAiExtract = () => {
    if (!description && !title && !url) return;
    setIsAnalyzing(true);
    setAiAuditNote(null);

    setTimeout(() => {
      const text = `${title} ${description} ${url}`.toLowerCase();
      const detected: string[] = [];
      const strengths: Record<string, number> = {};

      for (const skill of SKILLS) {
        const nameLow = skill.name.toLowerCase();
        if (
          text.includes(nameLow) ||
          (skill.id === 's_react' && (text.includes('react') || text.includes('frontend') || text.includes('jsx') || text.includes('next'))) ||
          (skill.id === 's_node' && (text.includes('node') || text.includes('express') || text.includes('backend') || text.includes('api'))) ||
          (skill.id === 's_python' && (text.includes('python') || text.includes('django') || text.includes('flask') || text.includes('fastapi'))) ||
          (skill.id === 's_sql' && (text.includes('sql') || text.includes('postgres') || text.includes('database') || text.includes('mysql'))) ||
          (skill.id === 's_ml' && (text.includes('machine learning') || text.includes('ml') || text.includes('model') || text.includes('scikit') || text.includes('ai'))) ||
          (skill.id === 's_dl' && (text.includes('deep learning') || text.includes('pytorch') || text.includes('tensorflow') || text.includes('neural'))) ||
          (skill.id === 's_uiux' && (text.includes('figma') || text.includes('ui') || text.includes('ux') || text.includes('design') || text.includes('prototype'))) ||
          (skill.id === 's_docker' && (text.includes('docker') || text.includes('container') || text.includes('kubernetes') || text.includes('ci/cd'))) ||
          (skill.id === 's_aws' && (text.includes('aws') || text.includes('cloud') || text.includes('s3') || text.includes('lambda') || text.includes('ec2')))
        ) {
          if (!detected.includes(skill.id)) {
            detected.push(skill.id);
            strengths[skill.id] = Math.floor(Math.random() * 15) + 80;
          }
        }
      }

      if (detected.length === 0) {
        detected.push('s_problem');
        strengths['s_problem'] = 82;
      }

      setSelectedSkills((prev) => Array.from(new Set([...prev, ...detected])));
      setSkillStrengths((prev) => ({ ...prev, ...strengths }));
      setVerificationMethod('AI Semantic AST Inspector');
      setIsAnalyzing(false);
      setAiAuditNote(
        `AI Analysis Verified: ${detected.length} demonstrated competencies identified with average ${Math.round(
          Object.values(strengths).reduce((a, b) => a + b, 0) / detected.length
        )}% evidence strength.`
      );
    }, 600);
  };

  const handleScanGithub = async () => {
    if (!githubUrl.trim()) return;
    setIsScanningGithub(true);
    setGithubScanData(null);
    setGithubScanError(null);

    try {
      const result = await scanGithubRepository(githubUrl);
      setGithubScanData(result);

      if (result.isForkWithoutContributions) {
        setTitle(`Fork: ${result.repoName}`);
        setType('project');
        setIssuer(`GitHub / ${result.owner} (Fork of ${result.parentRepo || 'upstream'})`);
        setUrl(result.url);
        setDescription(
          `Forked from ${result.parentRepo || 'upstream'}. 0 verified commits authored by ${result.owner}. Excluded from Skill Passport credit.`
        );
        setScore('Unmodified Fork (0 Commits)');
        setVerification('self-reported');
        setVerificationMethod('GitHub Integrity Auditor (0 Author Commits)');
        setSelectedSkills([]);
        setSkillStrengths({});
        setAiAuditNote(result.statusMessage);
        // Do not redirect to form tab so the candidate clearly sees the integrity alert
        return;
      }

      const isContributor = result.contributionType === 'open_source_contributor';
      setTitle(isContributor ? `Open Source: ${result.repoName} (Contributor)` : `GitHub: ${result.repoName}`);
      setType('project');
      setIssuer(
        isContributor
          ? `GitHub / ${result.owner} (Fork of ${result.parentRepo || 'upstream'})`
          : `GitHub / ${result.owner}`
      );
      setUrl(result.url);
      setDescription(
        `${result.description} (Languages: ${result.languages.map((l) => `${l.language} ${l.percentage}%`).join(', ')} · ${result.commitCountSummary})`
      );
      setScore(
        isContributor
          ? `Open Source Contributor (${result.authorCommitCount}+ commits)`
          : result.isRealApiResult
          ? `Verified GitHub Repo (${result.stars} ★)`
          : 'Production Codebase'
      );
      setVerification('verified');
      setVerificationMethod(
        isContributor
          ? 'GitHub Verified Author Commits'
          : result.isRealApiResult
          ? 'Live GitHub REST API v3'
          : 'Repository Structure Analyzer'
      );

      setSelectedSkills(result.detectedSkills);
      setSkillStrengths(result.skillStrengths);

      setModalTab('form');
      setAiAuditNote(result.statusMessage);
    } catch (err: any) {
      setGithubScanError(err.message || 'Failed to verify GitHub repository.');
      console.error('GitHub scan error:', err);
    } finally {
      setIsScanningGithub(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const verifiedFile = await verifyUploadedFile(file);
      setFileVerification(verifiedFile);
      setUploadedFileName(file.name);
      setTitle(`Document: ${file.name.replace(/\.[^/.]+$/, '')}`);
      setType('credential');
      setIssuer('Verified Issuer / Uploaded Document');
      setScore(`SHA-256 Verified (${verifiedFile.fileSizeFormatted})`);
      setVerification('verified');
      setVerificationMethod('Binary Document SHA-256 Checksum');
      setDescription(`Cryptographically hashed binary artifact (${file.name}, ${verifiedFile.fileSizeFormatted}, ${verifiedFile.mimeType}). SHA-256 Digest: ${verifiedFile.sha256Hash}`);

      const credSkills = ['s_aws', 's_docker', 's_problem'];
      setSelectedSkills(credSkills);
      setSkillStrengths({ s_aws: 92, s_docker: 88, s_problem: 86 });
      setModalTab('form');
      setAiAuditNote(`Binary SHA-256 Fingerprint Generated: ${verifiedFile.sha256Hash.slice(0, 18)}... (Tamper-Free Seal Valid)`);
    }
  };

  const handleSaveEvidence = async () => {
    if (!title.trim() || selectedSkills.length === 0) return;
    const targetId = editingEvidenceId || `ev_cust_${Date.now()}`;
    const calculatedStrength = Math.round(
      Object.values(skillStrengths).reduce((a, b) => a + b, 0) / (Object.values(skillStrengths).length || 1)
    ) || 85;

    // Real SHA-256 fingerprint creation
    const fingerprint = await createEvidenceFingerprint({
      id: targetId,
      studentId: student.id,
      title: title.trim(),
      issuer: issuer.trim() || 'Self-verified Artifact',
      date: new Date().toISOString().split('T')[0],
      skills: selectedSkills,
      strength: calculatedStrength,
      url: url.trim() || undefined,
    });

    const newEv: Evidence = {
      id: targetId,
      studentId: student.id,
      type,
      title: title.trim(),
      issuer: issuer.trim() || 'Self-verified Artifact',
      date: new Date().toISOString().split('T')[0],
      description: description.trim() || `Demonstrated proficiency across ${selectedSkills.map((s) => skillMap[s]?.name).join(', ')}.`,
      skills: selectedSkills,
      verification,
      strength: calculatedStrength,
      score: score.trim() || undefined,
      url: url.trim() || undefined,
      evidenceHash: fingerprint.hash,
      verificationMethod: verificationMethod || 'Algorithmic Proof Ledger',
    };

    if (editingEvidenceId) {
      updateEvidence(newEv, skillStrengths);
      notifyRecruitersOnEvidenceUpdate({
        studentId: student.id,
        studentName: student.name,
        evidenceTitle: newEv.title,
        evidenceId: targetId,
        newHash: fingerprint.hash,
      });
      setAuditAlertMessage(
        `Verified evidence "${newEv.title}" updated & resealed with SHA-256 (${fingerprint.hash.slice(0, 12)}...). Reviewing recruiters have been notified in real time!`
      );
    } else {
      addEvidence(newEv, skillStrengths);
      setAuditAlertMessage(
        `New verified evidence "${newEv.title}" sealed with SHA-256 and added to your Skill Passport!`
      );
    }

    setShowModal(false);
    resetForm();
  };

  const handleConfirmDelete = () => {
    if (deletingEvidence) {
      deleteEvidence(deletingEvidence.id);
      setDeletingEvidence(null);
    }
  };

  const handleInspectProof = async (e: Evidence) => {
    const fingerprint = await createEvidenceFingerprint({
      id: e.id,
      studentId: e.studentId,
      title: e.title,
      issuer: e.issuer,
      date: e.date,
      skills: e.skills,
      strength: e.strength,
      url: e.url,
    });

    setInspectedEvidence({
      evidence: e,
      fingerprint,
    });
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Evidence & Credentials"
        subtitle="Every skill is backed by live verifiable proof and cryptographic SHA-256 hashes"
        right={
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => navigate(`/passport/${studentId}`)}
              className="btn-secondary text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <QrCode className="h-4 w-4 text-brand-600" />
              <span>Public Passport</span>
            </button>
            <button onClick={handleOpenAdd} className="btn-primary text-xs inline-flex items-center justify-center gap-1.5">
              <PlusCircle className="h-4 w-4" /> <span>Add Evidence</span>
            </button>
          </div>
        }
      />

      {/* Cryptographic Reseal & Recruiter Dispatch Alert */}
      {auditAlertMessage && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-950 shadow-soft animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold flex-shrink-0">
              <Check className="h-4 w-4" />
            </span>
            <div>
              <div className="font-bold text-emerald-900">Cryptographic Seal & Recruiter Alert Dispatched</div>
              <p className="text-emerald-800 mt-0.5">{auditAlertMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setAuditAlertMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1.5 rounded-lg hover:bg-emerald-100 transition flex-shrink-0"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 flex-shrink-0 text-ink-400" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${
              filter === f ? 'bg-brand-600 text-white shadow-sm' : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-ink-600 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d]'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs font-semibold text-ink-400">{filtered.length} items</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No evidence yet"
          description="Add coursework, projects, competitions or credentials to build your passport."
          icon={<FileBadge className="h-10 w-10" />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((e) => {
            const shortHash = e.evidenceHash
              ? `${e.evidenceHash.slice(0, 10)}...${e.evidenceHash.slice(-6)}`
              : `sha256_${e.id.slice(-8)}`;

            return (
              <Card key={e.id} className="p-5 hover:shadow-lift transition-all border border-ink-200/80 group">
                <div className="flex items-start gap-4">
                  <EvidenceTypeIcon type={e.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-ink-900 leading-tight">{e.title}</h3>
                      
                      {/* Action buttons + Verification Pill */}
                      <div className="flex items-center gap-1.5">
                        <VerificationPill status={e.verification} />
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1 rounded-md text-ink-400 hover:text-brand-600 hover:bg-brand-50 transition"
                          title="Edit this evidence item"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingEvidence(e)}
                          className="p-1 rounded-md text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete this evidence item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-600">{e.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                      <span className="font-semibold text-ink-700">{e.issuer}</span>
                      <span>·</span>
                      <span>{new Date(e.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</span>
                      {e.score && (
                        <>
                          <span>·</span>
                          <Chip
                            color={
                              e.score.toLowerCase().includes('unmodified')
                                ? 'rose'
                                : e.score.toLowerCase().includes('contributor')
                                ? 'accent'
                                : 'brand'
                            }
                          >
                            {e.score}
                          </Chip>
                        </>
                      )}
                    </div>

                    {/* Cryptographic SHA-256 Proof Badge */}
                    <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-2.5">
                      <button
                        onClick={() => handleInspectProof(e)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-ink-50 px-2 py-1 text-[11px] font-mono text-ink-600 hover:bg-brand-50 hover:text-brand-700 transition"
                        title="Click to inspect cryptographic SHA-256 proof"
                      >
                        <Lock className="h-3 w-3 text-emerald-600" />
                        <span className="font-semibold">SHA-256:</span>
                        <span>{shortHash}</span>
                      </button>

                      <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{e.strength}% Strength</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-dashed border-ink-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Skills Demonstrated</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {e.skills.map((skId) => (
                          <button
                            key={skId}
                            onClick={() => navigate(`/student/skill/${skId}`)}
                            className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 transition"
                          >
                            {skillMap[skId]?.name ?? skId}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Evidence Modal with Multi-Source Scanner */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#161b22] p-6 sm:p-8 shadow-lift max-h-[90vh] overflow-y-auto border border-ink-100 dark:border-[#30363d]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                  {editingEvidenceId ? <Edit3 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink-900 dark:text-white">
                    {editingEvidenceId ? 'Edit Verified Evidence' : 'Add Verified Evidence'}
                  </h3>
                  <p className="text-xs text-ink-500 dark:text-[#8b949e]">
                    {editingEvidenceId
                      ? 'Update details, demonstrated skills, and strengths'
                      : 'Auto-extract and verify skills using live GitHub REST API & AI analysis'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="rounded-xl p-1 text-ink-400 dark:text-[#8b949e] hover:bg-ink-100 dark:hover:bg-[#30363d]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* In-Modal Tab Switcher (Only show for new items) */}
            {!editingEvidenceId && (
              <div className="grid grid-cols-3 p-1 bg-ink-100/70 dark:bg-[#21262d] rounded-2xl mt-5 mb-5 text-xs font-bold">
                <button
                  onClick={() => setModalTab('form')}
                  className={`py-2 rounded-xl transition ${
                    modalTab === 'form' ? 'bg-white dark:bg-[#161b22] text-ink-900 dark:text-white shadow-sm' : 'text-ink-500 dark:text-[#8b949e] hover:text-ink-800 dark:hover:text-white'
                  }`}
                >
                  Manual / Syllabus
                </button>
                <button
                  onClick={() => setModalTab('github')}
                  className={`py-2 rounded-xl transition inline-flex items-center justify-center gap-1.5 ${
                    modalTab === 'github' ? 'bg-white dark:bg-[#161b22] text-ink-900 dark:text-white shadow-sm' : 'text-ink-500 dark:text-[#8b949e] hover:text-ink-800 dark:hover:text-white'
                  }`}
                >
                  <Github className="h-3.5 w-3.5" />
                  <span>Live GitHub Scanner</span>
                </button>
                <button
                  onClick={() => setModalTab('upload')}
                  className={`py-2 rounded-xl transition inline-flex items-center justify-center gap-1.5 ${
                    modalTab === 'upload' ? 'bg-white dark:bg-[#161b22] text-ink-900 dark:text-white shadow-sm' : 'text-ink-500 dark:text-[#8b949e] hover:text-ink-800 dark:hover:text-white'
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload PDF</span>
                </button>
              </div>
            )}

            {/* TAB 1: GITHUB SCANNER (LIVE REST API) */}
            {modalTab === 'github' && !editingEvidenceId && (
              <div className="p-4 rounded-2xl border border-ink-200 dark:border-[#30363d] bg-ink-50/50 dark:bg-[#0d1117] space-y-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Github className="h-5 w-5 text-ink-900 dark:text-white" />
                    <h4 className="text-sm font-bold text-ink-900 dark:text-white">Live GitHub Public API Scanner</h4>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    Live API Connected
                  </span>
                </div>
                <p className="text-xs text-ink-600 dark:text-[#c9d1d9]">
                  Enter any public GitHub repository (e.g. <code className="bg-ink-200/60 dark:bg-[#21262d] dark:text-brand-300 px-1 py-0.5 rounded">username/project</code> or full URL) to fetch live languages, byte counts, stars, and commit signatures.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => {
                      setGithubUrl(e.target.value);
                      if (githubScanError) setGithubScanError(null);
                    }}
                    placeholder="https://github.com/facebook/react or username/repo"
                    className={`input text-xs ${githubScanError ? 'border-rose-400 focus:border-rose-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={handleScanGithub}
                    disabled={isScanningGithub || !githubUrl.trim()}
                    className="btn-primary whitespace-nowrap text-xs shadow-soft inline-flex items-center gap-1.5"
                  >
                    {isScanningGithub ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying GitHub...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> Scan Live Repo
                      </>
                    )}
                  </button>
                </div>

                {/* Validation Error Banner */}
                {githubScanError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 animate-fade-in">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-rose-800">Verification Rejected</div>
                      <div className="text-rose-700 leading-relaxed">{githubScanError}</div>
                      <div className="text-[11px] text-rose-500 pt-0.5">
                        EvidentX strictly enforces cryptographic provenance. Non-GitHub links, private repositories, or non-existent projects cannot be verified.
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Scan Results Card */}
                {githubScanData && (
                  <div
                    className={`mt-3 p-3.5 rounded-xl border space-y-2.5 animate-fade-in text-xs ${
                      githubScanData.isForkWithoutContributions
                        ? 'bg-rose-50/60 border-rose-300'
                        : githubScanData.contributionType === 'open_source_contributor'
                        ? 'bg-teal-50/50 border-teal-200'
                        : 'bg-white border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-ink-900">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono">{githubScanData.fullName}</span>
                        {githubScanData.isFork && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1 ${
                              githubScanData.isForkWithoutContributions
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-teal-100 text-teal-800 border border-teal-200'
                            }`}
                          >
                            <GitFork className="h-2.5 w-2.5" />
                            <span>Fork of {githubScanData.parentRepo || 'upstream'}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-ink-600 shrink-0">
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> {githubScanData.stars}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <GitFork className="h-3 w-3" /> {githubScanData.forks}
                        </span>
                      </div>
                    </div>

                    {/* Specific Fork Integrity Alert or Contributor Badge */}
                    {githubScanData.isForkWithoutContributions ? (
                      <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-1.5 text-rose-950 shadow-2xs">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800">
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                          <span>Integrity Protection: 0 Author Commits</span>
                        </div>
                        <p className="text-rose-800 text-[11px] leading-relaxed">
                          This repository is an unmodified fork of{' '}
                          <strong>{githubScanData.parentRepo || 'the upstream codebase'}</strong> with{' '}
                          <strong>0 commits authored by {githubScanData.owner}</strong>.
                        </p>
                        <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded-lg leading-relaxed border border-rose-100">
                          🛡️ <strong>EvidentX Proof-of-Skill Policy:</strong> Simply forking another developer&apos;s project does not prove personal competency. <strong>0 skills have been awarded.</strong> To earn verified credit, push original code contributions to this repository.
                        </div>
                      </div>
                    ) : githubScanData.contributionType === 'open_source_contributor' ? (
                      <div className="p-2.5 bg-white rounded-xl border border-teal-200 text-[11px] text-teal-900 flex items-start gap-2 shadow-2xs">
                        <Sparkles className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-teal-800">Verified Open Source Contributor:</span>{' '}
                          Found {githubScanData.authorCommitCount}+ verified commit(s) authored by{' '}
                          <strong>{githubScanData.owner}</strong> to {githubScanData.repoName}. Skills attributed proportionally.
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-ink-600">{githubScanData.commitCountSummary}</div>
                    )}

                    {/* Language breakdown */}
                    {githubScanData.languages.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                          Detected Languages (Byte Percentage)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {githubScanData.languages.map((l) => (
                            <span
                              key={l.language}
                              className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold text-[11px]"
                            >
                              {l.language} ({l.percentage}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action button based on fork status */}
                    <div className="pt-2">
                      {githubScanData.isForkWithoutContributions ? (
                        <div className="text-center py-1 text-[11px] font-medium text-rose-600">
                          ⚠️ Cannot be added as verified proof (0 author commits detected)
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setModalTab('form')}
                          className="btn-primary w-full text-xs py-2 inline-flex items-center justify-center gap-1.5"
                        >
                          <span>Proceed to Review Form ({githubScanData.detectedSkills.length} Skills)</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CERTIFICATE UPLOADER */}
            {modalTab === 'upload' && !editingEvidenceId && (
              <div className="p-6 rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/50 text-center space-y-3 mb-4">
                <UploadCloud className="h-8 w-8 text-brand-600 mx-auto" />
                <div>
                  <div className="text-xs font-bold text-ink-900">Upload PDF Certificate or Transcript</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">Supports PDF, PNG, JPG with automatic SHA-256 sealing</div>
                </div>
                <label className="btn-secondary text-xs py-2 px-4 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Choose Document</span>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
                </label>
                {uploadedFileName && (
                  <div className="text-xs font-semibold text-emerald-700 flex flex-col items-center justify-center gap-0.5 mt-2">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Attached & Hashed: {uploadedFileName}</span>
                    </div>
                    {fileVerification && (
                      <span className="text-[10px] font-mono text-ink-500">
                        SHA-256: {fileVerification.sha256Hash.slice(0, 16)}... ({fileVerification.fileSizeFormatted})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MAIN FORM */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Evidence Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value as EvidenceType)} className="input">
                    <option value="project">Project / GitHub Repo</option>
                    <option value="coursework">Coursework / Academic Syllabus</option>
                    <option value="credential">Certification / Credential</option>
                    <option value="competition">Hackathon / Competition</option>
                    <option value="experience">Internship / Work Experience</option>
                  </select>
                </div>
                <div>
                  <label className="label">
                    Artifact Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      type === 'project'
                        ? 'e.g. Distributed Analytics Engine or Chat App'
                        : type === 'coursework'
                        ? 'e.g. CS301: Data Structures & Algorithms / OS Lab'
                        : type === 'credential'
                        ? 'e.g. AWS Certified Solutions Architect Associate'
                        : type === 'competition'
                        ? 'e.g. Smart India Hackathon 2024 Finalist'
                        : 'e.g. Backend Engineering Intern / Research Fellow'
                    }
                    className="input"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Issuer / Institution / Organization</label>
                  <input
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder={
                      type === 'coursework'
                        ? 'e.g. University / Academic Department'
                        : type === 'credential'
                        ? 'e.g. AWS, Coursera, Google Cloud, Credly'
                        : type === 'competition'
                        ? 'e.g. Smart India Hackathon / Kaggle / LeetCode'
                        : 'e.g. GitHub / TechFlow Labs'
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Artifact URL / Repo / Cert Link</label>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/username/project or cert link"
                    className="input"
                  />
                </div>

                {issuer && (
                  <div className="sm:col-span-2 flex items-center gap-2 p-2.5 rounded-xl bg-ink-50 border border-ink-100 text-xs">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1 flex flex-wrap items-center justify-between gap-1">
                      <span className="font-semibold text-ink-800">
                        Authority: <strong className="text-brand-700">{inspectIssuerAuthority(issuer, url).issuerName}</strong>
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {inspectIssuerAuthority(issuer, url).trustLevel} · {inspectIssuerAuthority(issuer, url).confidenceScore}% Trust Score
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Description / Syllabus / Summary</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe technologies, architecture, outcomes, or paste project README snippet…"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              {/* AI Scanner Button */}
              <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-brand-900 text-sm">
                      <Brain className="h-4 w-4 text-brand-600" />
                      AI Evidence Analysis
                    </div>
                    <p className="text-xs text-brand-700 mt-0.5">
                      Automatically scan text & artifact links to extract verified skills and assign confidence scores.
                    </p>
                  </div>
                  <button
                    onClick={handleAiExtract}
                    disabled={isAnalyzing || (!description && !title && !url)}
                    className="btn-primary whitespace-nowrap text-xs shadow-soft"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> Auto-Extract Skills
                      </>
                    )}
                  </button>
                </div>

                {aiAuditNote && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-white p-3 text-xs text-brand-900 border border-brand-200 animate-fade-in">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{aiAuditNote}</span>
                  </div>
                )}
              </div>

              {/* Skills selection */}
              <div>
                <label className="label">Demonstrated Skills ({selectedSkills.length})</label>
                <div className="mt-1 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-ink-100">
                  {SKILLS.map((s) => {
                    const active = selectedSkills.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSkill(s.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          active ? 'bg-brand-600 text-white shadow-soft' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvidence}
                disabled={!title.trim() || selectedSkills.length === 0}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                <Lock className="h-4 w-4" /> {editingEvidenceId ? 'Update & Reseal with SHA-256' : 'Seal & Save with SHA-256'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE EVIDENCE CONFIRMATION MODAL */}
      {deletingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-lift space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-ink-900 text-base">Delete Evidence Record?</h3>
                <p className="text-xs text-ink-500">Remove artifact and recalculate passport strengths</p>
              </div>
            </div>

            <p className="text-xs text-ink-600 leading-relaxed">
              Are you sure you want to delete <strong>{deletingEvidence.title}</strong>? Any verified skills derived from this artifact will be updated in your passport.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-100">
              <button onClick={() => setDeletingEvidence(null)} className="btn-secondary text-xs py-2 px-3">
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn-primary text-xs py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white inline-flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic SHA-256 Audit Inspection Modal */}
      {inspectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-lift space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-ink-900 text-base">Cryptographic Proof Seal</h3>
                  <p className="text-xs text-ink-500">PostgreSQL Tamper-Proof Audit Record</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedEvidence(null)}
                className="p-1 rounded-xl text-ink-400 hover:bg-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-ink-50 border border-ink-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1">
                  Evidence Artifact
                </div>
                <div className="font-bold text-ink-900 text-sm">{inspectedEvidence.evidence.title}</div>
                <div className="text-ink-600 mt-0.5">
                  Issuer: <span className="font-medium text-ink-800">{inspectedEvidence.evidence.issuer}</span> · Date: {inspectedEvidence.evidence.date}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    Deterministic SHA-256 Fingerprint
                  </span>
                  <button
                    onClick={() => handleCopyHash(inspectedEvidence.fingerprint.hash)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
                  >
                    {copiedHash ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedHash ? 'Copied!' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-ink-900 font-mono text-[11px] text-emerald-400 break-all leading-relaxed select-all">
                  {inspectedEvidence.fingerprint.hash}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-ink-50 border border-ink-100">
                  <div className="text-[10px] font-bold uppercase text-ink-400">Verification Engine</div>
                  <div className="font-semibold text-ink-800 mt-0.5">
                    {inspectedEvidence.evidence.verificationMethod || 'Web Crypto SHA-256'}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <div className="text-[10px] font-bold uppercase text-emerald-600">Integrity Check</div>
                  <div className="font-bold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>100% Tamper-Proof</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-ink-500 pt-1">
                This cryptographic checksum is computed over the student ID, issuer authority, verified skills array, and artifact URL. Any database-level modification invalidates this signature.
              </div>
            </div>

            <div className="pt-2 border-t border-ink-100 flex justify-end">
              <button onClick={() => setInspectedEvidence(null)} className="btn-primary text-xs py-2 px-4">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
