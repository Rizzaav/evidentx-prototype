import { useState } from 'react';
import {
  Webhook,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Server,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  LMS_PROVIDERS,
  LMS_SIMULATION_PRESETS,
  processLmsWebhook,
  getWebhookLogs,
  type LmsProvider,
  type LmsWebhookPayload,
  type IngestedWebhookLog,
} from '@/lib/lmsSync';
import { useToast } from '@/lib/toast';

interface LmsWebhookSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudentId?: string;
  onEvidenceAdded?: () => void;
}

export function LmsWebhookSimulatorModal({
  isOpen,
  onClose,
  activeStudentId,
  onEvidenceAdded,
}: LmsWebhookSimulatorModalProps) {
  const { toast } = useToast();
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [customPayloadJson, setCustomPayloadJson] = useState<string>(
    JSON.stringify(LMS_SIMULATION_PRESETS[0].payload, null, 2)
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    digest: string;
    courseTitle: string;
    provider: LmsProvider;
  } | null>(null);
  const [logs, setLogs] = useState<IngestedWebhookLog[]>(() => getWebhookLogs());
  const [activeTab, setActiveTab] = useState<'simulator' | 'providers' | 'logs'>('simulator');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPreset = LMS_SIMULATION_PRESETS[selectedPresetIdx];

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIdx(idx);
    setCustomPayloadJson(JSON.stringify(LMS_SIMULATION_PRESETS[idx].payload, null, 2));
    setLastReceipt(null);
  };

  const handleSendWebhook = async () => {
    try {
      setIsProcessing(true);
      const parsed: LmsWebhookPayload = JSON.parse(customPayloadJson);
      parsed.timestamp = new Date().toISOString();
      parsed.eventId = `evt_${parsed.provider}_${Date.now()}`;

      const res = await processLmsWebhook(parsed, activeStudentId);

      setLastReceipt({
        digest: res.digest,
        courseTitle: res.evidence.title,
        provider: parsed.provider,
      });

      setLogs(getWebhookLogs());
      toast.success(
        `LMS Webhook Ingested! "${res.evidence.title}" verified via ${LMS_PROVIDERS[parsed.provider].name}`
      );

      if (onEvidenceAdded) {
        onEvidenceAdded();
      }
    } catch {
      toast.error('Failed to parse webhook JSON payload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyEndpoint = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('Webhook endpoint URL copied');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-lift overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 dark:border-[#30363d] p-4 sm:p-5 bg-ink-50/50 dark:bg-[#0d1117]/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Webhook className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-ink-900 dark:text-white text-base sm:text-lg">
                  Automated LMS & Webhook Credential Ingestion
                </h3>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  HMAC Active
                </span>
              </div>
              <p className="text-xs text-ink-500 dark:text-[#8b949e]">
                Instant verifiable sync from NPTEL / SWAYAM, Canvas, Coursera, edX, and GitHub Classroom
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-ink-100 dark:border-[#30363d] px-4 sm:px-6 gap-2 bg-white dark:bg-[#161b22] overflow-x-auto text-xs font-bold pt-2">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>Webhook Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
              activeTab === 'providers'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
            }`}
          >
            <Server className="h-3.5 w-3.5 text-blue-500" />
            <span>Connected Connectors (5)</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-purple-500" />
            <span>Event Journal ({logs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* TAB 1: SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              {/* Presets Grid */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-[#8b949e]">
                  Select Pre-Configured Webhook Scenario
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {LMS_SIMULATION_PRESETS.map((preset, idx) => {
                    const isSelected = selectedPresetIdx === idx;
                    const meta = LMS_PROVIDERS[preset.provider];
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(idx)}
                        className={`p-3 rounded-2xl text-left border transition ${
                          isSelected
                            ? 'bg-brand-50/70 dark:bg-brand-950/50 border-brand-500 text-brand-900 dark:text-brand-200 shadow-sm'
                            : 'bg-white dark:bg-[#0d1117] border-ink-200 dark:border-[#30363d] text-ink-700 dark:text-[#c9d1d9] hover:border-brand-300 dark:hover:border-[#58a6ff]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${meta.badgeColor}`}
                          >
                            {meta.name.split('(')[0]}
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                        </div>
                        <div className="font-bold text-xs truncate text-ink-900 dark:text-white">
                          {preset.name.split(':')[1] || preset.name}
                        </div>
                        <div className="text-[10px] text-ink-500 dark:text-[#8b949e] mt-1 line-clamp-2">
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payload Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-[#8b949e]">
                    Incoming Webhook Payload JSON (HMAC-SHA256 Signed)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(customPayloadJson);
                      toast.success('Payload copied');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy JSON</span>
                  </button>
                </div>
                <textarea
                  value={customPayloadJson}
                  onChange={(e) => setCustomPayloadJson(e.target.value)}
                  rows={8}
                  className="w-full rounded-2xl bg-ink-950 dark:bg-[#0d1117] border border-ink-800 dark:border-[#30363d] p-3 text-ink-100 font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Action Trigger */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-ink-500 dark:text-[#8b949e] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Automatically computes SHA-256 seal and awards verified skill points</span>
                </div>
                <button
                  onClick={handleSendWebhook}
                  disabled={isProcessing}
                  className="w-full sm:w-auto btn-primary text-xs py-2 px-5 inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isProcessing ? 'Processing Ingestion...' : 'Simulate Incoming Webhook'}</span>
                </button>
              </div>

              {/* Ingestion Receipt Banner */}
              {lastReceipt && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 animate-fade-in space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Credential Ingestion Receipt (HTTP 200 OK)</span>
                  </div>
                  <div className="text-[11px] opacity-90">
                    Successfully committed <strong>"{lastReceipt.courseTitle}"</strong> into the student's immutable evidence portfolio.
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-[#0d1117]/80 border border-emerald-300 dark:border-emerald-800/80 font-mono text-[10px] text-emerald-800 dark:text-emerald-300 break-all">
                    SHA-256 Seal: {lastReceipt.digest}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONNECTED PROVIDERS */}
          {activeTab === 'providers' && (
            <div className="space-y-3">
              <p className="text-ink-600 dark:text-[#8b949e]">
                Pre-authorized academic connectors listening for webhook events:
              </p>
              <div className="space-y-2.5">
                {Object.values(LMS_PROVIDERS).map((prov) => (
                  <div
                    key={prov.id}
                    className="p-3.5 rounded-2xl bg-ink-50 dark:bg-[#0d1117] border border-ink-200 dark:border-[#30363d] space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-ink-900 dark:text-white">{prov.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${prov.badgeColor}`}>
                          {prov.category}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Listening
                      </span>
                    </div>

                    <p className="text-[11px] text-ink-600 dark:text-[#8b949e]">{prov.description}</p>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-ink-100/70 dark:bg-[#161b22] border border-ink-200/60 dark:border-[#30363d] text-[10px]">
                      <span className="font-mono text-ink-600 dark:text-[#8b949e] truncate max-w-[340px]">
                        {prov.endpointUrl}
                      </span>
                      <button
                        onClick={() => handleCopyEndpoint(prov.endpointUrl)}
                        className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline ml-2"
                      >
                        {copiedUrl === prov.endpointUrl ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copiedUrl === prov.endpointUrl ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-[#8b949e]">
                  Live Ingestion Audit Journal
                </span>
                <span className="text-[10px] text-ink-400 font-mono">{logs.length} Total Events Logged</span>
              </div>

              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-ink-50 dark:bg-[#0d1117] border border-ink-200 dark:border-[#30363d] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                          HTTP {log.httpStatus}
                        </span>
                        <span className="font-bold text-xs text-ink-900 dark:text-white truncate max-w-[240px]">
                          {log.courseTitle}
                        </span>
                      </div>
                      <div className="text-[10px] text-ink-500 dark:text-[#8b949e] mt-0.5">
                        Provider: <strong>{log.provider.toUpperCase()}</strong> · Grade: {log.gradeScore} · Evidence:{' '}
                        <code className="font-mono">{log.evidenceId}</code>
                      </div>
                      <div className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 truncate max-w-[320px] mt-0.5">
                        SHA256: {log.sha256Digest}
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-ink-400 font-mono whitespace-nowrap">
                      {log.timestamp.slice(0, 10)} {log.timestamp.slice(11, 16)} UTC
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-ink-100 dark:border-[#30363d] bg-ink-50/50 dark:bg-[#0d1117]/60 flex items-center justify-between">
          <div className="text-[11px] text-ink-500 dark:text-[#8b949e]">
            Protocol: <span className="font-mono font-semibold text-ink-800 dark:text-ink-200">HMAC-SHA256 / LTI 1.3</span>
          </div>
          <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
