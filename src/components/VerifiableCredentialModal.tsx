import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  X,
  Copy,
  Download,
  Check,
  AlertTriangle,
  FileCode2,
  FileBadge,
  Sparkles,
  ExternalLink,
  Lock,
  RefreshCw,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import type { Student, StudentSkill, Evidence } from '@/types';
import {
  generateW3CVerifiableCredential,
  verifyW3CVerifiableCredential,
  exportToDigiLockerXml,
  type W3CVerifiableCredential,
  type VCVerificationAuditResult,
} from '@/lib/verifiableCredentials';
import { useToast } from '@/lib/toast';

interface VerifiableCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  studentSkills: StudentSkill[];
  evidenceList: Evidence[];
}

export function VerifiableCredentialModal({
  isOpen,
  onClose,
  student,
  studentSkills,
  evidenceList,
}: VerifiableCredentialModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'jsonld' | 'audit' | 'digilocker' | 'sandbox'>('jsonld');
  const [vc, setVc] = useState<W3CVerifiableCredential | null>(null);
  const [auditResult, setAuditResult] = useState<VCVerificationAuditResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  // Tamper Sandbox State
  const [tamperedPayloadJson, setTamperedPayloadJson] = useState<string>('');
  const [sandboxAuditResult, setSandboxAuditResult] = useState<VCVerificationAuditResult | null>(null);

  // Initialize VC
  useEffect(() => {
    if (isOpen && student) {
      generateW3CVerifiableCredential(student, studentSkills, evidenceList).then((generated) => {
        setVc(generated);
        setTamperedPayloadJson(JSON.stringify(generated, null, 2));
        verifyW3CVerifiableCredential(generated).then(setAuditResult);
      });
    }
  }, [isOpen, student, studentSkills, evidenceList]);

  if (!isOpen || !vc) return null;

  const jsonString = JSON.stringify(vc, null, 2);
  const xmlString = exportToDigiLockerXml(vc);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    toast.success('W3C JSON-LD copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidentx-vc-${student.id}.jsonld`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded W3C Verifiable Credential (.jsonld)');
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xmlString], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digilocker-abc-${student.id}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded DigiLocker / ABC XML payload');
  };

  const handleRunSandboxAudit = async () => {
    try {
      setIsAuditing(true);
      const parsed = JSON.parse(tamperedPayloadJson);
      const result = await verifyW3CVerifiableCredential(parsed);
      setSandboxAuditResult(result);
      if (result.isValid) {
        toast.success('Signature Validated: Credential intact');
      } else {
        toast.error('Cryptographic signature failed: Tampering detected');
      }
    } catch {
      toast.error('Invalid JSON syntax in sandbox editor');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleInjectTamper = () => {
    try {
      const parsed = JSON.parse(tamperedPayloadJson) as W3CVerifiableCredential;
      // Change student name or a competency score
      if (parsed.credentialSubject.verifiedCompetencies.length > 0) {
        parsed.credentialSubject.verifiedCompetencies[0].proficiencyScore = 100;
        parsed.credentialSubject.verifiedCompetencies[0].skillName += ' (Tampered by Adversary)';
      }
      const updated = JSON.stringify(parsed, null, 2);
      setTamperedPayloadJson(updated);
      toast.info('Adversarial byte modification injected. Click "Run Cryptographic Audit" to test detection.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetSandbox = () => {
    setTamperedPayloadJson(jsonString);
    setSandboxAuditResult(null);
    toast.info('Sandbox restored to original valid credential');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-lift overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 dark:border-[#30363d] p-4 sm:p-5 bg-ink-50/50 dark:bg-[#0d1117]/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-ink-900 dark:text-white text-base sm:text-lg">
                  W3C Verifiable Credential (VC)
                </h3>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  Ed25519 Signed
                </span>
              </div>
              <p className="text-xs text-ink-500 dark:text-[#8b949e]">
                Decentralized Identifiers (DIDs) · JSON-LD 1.1 · NEP 2020 / DigiLocker Compliant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-400 hover:bg-ink-100 dark:hover:bg-[#21262d] dark:hover:text-[#c9d1d9] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-ink-100 dark:border-[#30363d] px-4 sm:px-6 gap-2 bg-white dark:bg-[#161b22] overflow-x-auto text-xs font-bold pt-2">
          <button
            onClick={() => setActiveTab('jsonld')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
              activeTab === 'jsonld'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>Standard JSON-LD</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Cryptographic Audit Checklist</span>
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
              activeTab === 'sandbox'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" />
            <span>Tamper Detection Sandbox</span>
          </button>
          <button
            onClick={() => setActiveTab('digilocker')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
              activeTab === 'digilocker'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
            }`}
          >
            <FileBadge className="h-3.5 w-3.5 text-blue-500" />
            <span>DigiLocker / ABC XML</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* TAB 1: JSON-LD */}
          {activeTab === 'jsonld' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-ink-600 dark:text-[#8b949e]">
                  Official W3C Verifiable Credential standard format with cryptographic Ed25519 digital signature:
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy JSON-LD'}</span>
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download (.jsonld)</span>
                  </button>
                </div>
              </div>

              {/* Code viewer */}
              <div className="relative rounded-2xl bg-ink-950 dark:bg-[#0d1117] border border-ink-800 dark:border-[#30363d] p-4 text-ink-100 font-mono text-[11px] leading-relaxed max-h-[420px] overflow-y-auto select-all">
                <pre>{jsonString}</pre>
              </div>

              {/* Fast DID Summary Footer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-3 rounded-xl bg-ink-50 dark:bg-[#0d1117] border border-ink-200 dark:border-[#30363d]">
                  <span className="font-bold text-ink-500 dark:text-[#8b949e] uppercase text-[10px] block">
                    Issuer Authority DID
                  </span>
                  <span className="font-mono text-ink-800 dark:text-emerald-400 break-all font-semibold">
                    {vc.issuer.id}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-ink-50 dark:bg-[#0d1117] border border-ink-200 dark:border-[#30363d]">
                  <span className="font-bold text-ink-500 dark:text-[#8b949e] uppercase text-[10px] block">
                    Subject Sovereign DID
                  </span>
                  <span className="font-mono text-ink-800 dark:text-brand-400 break-all font-semibold">
                    {vc.credentialSubject.id}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT CHECKLIST */}
          {activeTab === 'audit' && auditResult && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  auditResult.isValid
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#161b22] flex items-center justify-center shadow-sm">
                    {auditResult.isValid ? (
                      <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {auditResult.isValid
                        ? 'Cryptographic Verification Succeeded'
                        : 'Verification Failed: Integrity Compromised'}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">
                      {auditResult.isValid
                        ? 'This credential is authentic, unmodified, and certified by EvidentX National Trust Root.'
                        : auditResult.tamperReason || 'The signature does not match the payload digest.'}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[10px] opacity-75 hidden sm:inline">
                  {auditResult.checkedAt.slice(11, 19)} UTC
                </span>
              </div>

              {/* Step-by-step checklist */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-[#8b949e]">
                  Automated Cryptographic Inspection Pipeline
                </div>
                <div className="space-y-2">
                  {auditResult.auditChecks.map((chk, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-ink-50 dark:bg-[#0d1117] border border-ink-200/80 dark:border-[#30363d] flex items-start gap-3"
                    >
                      <div className="mt-0.5">
                        {chk.status === 'pass' ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                            <X className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-ink-900 dark:text-white text-xs">{chk.label}</div>
                        <div className="text-[11px] text-ink-600 dark:text-[#8b949e] mt-0.5">{chk.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature inspection block */}
              <div className="p-4 rounded-2xl bg-ink-900 dark:bg-[#0d1117] border border-ink-800 dark:border-[#30363d] text-ink-300 font-mono text-[11px] space-y-2">
                <div className="text-white font-bold text-xs">Asymmetric Proof Verification Block</div>
                <div>
                  <span className="text-ink-500 block">Suite:</span>
                  <span className="text-emerald-400">{vc.proof.type}</span>
                </div>
                <div>
                  <span className="text-ink-500 block">JWS Assertion Signature:</span>
                  <span className="text-ink-200 break-all">{vc.proof.jws}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TAMPER SANDBOX */}
          {activeTab === 'sandbox' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <SlidersHorizontal className="h-4 w-4 text-amber-600" />
                  <span>Interactive Adversarial Tamper Testing Sandbox</span>
                </div>
                <p className="text-[11px] opacity-90 mt-1">
                  Test the mathematical tamper-proofing. Modify any character in the JSON below (e.g. change proficiency scores, student name, or skills) and click <strong>"Run Cryptographic Signature Audit"</strong>. The Ed25519 signature algorithm will immediately detect the byte alteration.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleInjectTamper}
                  className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:border-amber-400"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Inject Adversarial Modification</span>
                </button>
                <button
                  onClick={handleResetSandbox}
                  className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset to Valid Original</span>
                </button>
                <button
                  onClick={handleRunSandboxAudit}
                  disabled={isAuditing}
                  className="btn-primary text-xs py-1.5 px-4 ml-auto inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{isAuditing ? 'Recalculating...' : 'Run Cryptographic Audit'}</span>
                </button>
              </div>

              {/* Interactive JSON Editor */}
              <div className="relative">
                <textarea
                  value={tamperedPayloadJson}
                  onChange={(e) => setTamperedPayloadJson(e.target.value)}
                  rows={12}
                  className="w-full rounded-2xl bg-ink-950 dark:bg-[#0d1117] border border-ink-800 dark:border-[#30363d] p-4 text-ink-100 font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Sandbox Audit Outcome */}
              {sandboxAuditResult && (
                <div
                  className={`p-4 rounded-2xl border ${
                    sandboxAuditResult.isValid
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {sandboxAuditResult.isValid ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                    <span>
                      {sandboxAuditResult.isValid
                        ? 'Signature Valid: Payload Has Not Been Altered'
                        : 'TAMPER DETECTED: Cryptographic Signature Mismatch'}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-90 mt-1 font-mono">
                    {sandboxAuditResult.isValid
                      ? 'The Ed25519 digital signature matches the SHA-256 canonical digest perfectly.'
                      : `Expected: ${sandboxAuditResult.expectedSignature.slice(0, 36)}... | Computed: ${sandboxAuditResult.computedSignature.slice(0, 36)}...`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DIGILOCKER / ABC XML */}
          {activeTab === 'digilocker' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-ink-600 dark:text-[#8b949e]">
                  National Academic Bank of Credits (ABC) & DigiLocker XML Interoperability Schema:
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(xmlString);
                      toast.success('DigiLocker XML copied');
                    }}
                    className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy XML</span>
                  </button>
                  <button
                    onClick={handleDownloadXml}
                    className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download (.xml)</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-ink-950 dark:bg-[#0d1117] border border-ink-800 dark:border-[#30363d] p-4 text-ink-100 font-mono text-[11px] leading-relaxed max-h-[380px] overflow-y-auto select-all">
                <pre>{xmlString}</pre>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <FileBadge className="h-4 w-4 text-blue-600" />
                  <span>National Credit Framework (NCrF) NEP 2020 Compliance</span>
                </div>
                <div className="text-[11px] opacity-90 mt-1">
                  Transcripts exported through this gateway conform directly to Ministry of Education guidelines, enabling automatic credit transfer into the Academic Bank of Credits linked to the student's APAAR ID.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-ink-100 dark:border-[#30363d] bg-ink-50/50 dark:bg-[#0d1117]/60 flex items-center justify-between">
          <div className="text-[11px] text-ink-500 dark:text-[#8b949e]">
            Certified by <span className="font-semibold text-ink-800 dark:text-ink-200">EvidentX Sovereign Identity Layer</span>
          </div>
          <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
