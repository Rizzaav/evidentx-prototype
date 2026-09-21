import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  RefreshCw,
  Copy,
  Check,
  Key,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  generateCandidateSummary,
  askCandidateQuestion,
  hasGeminiApiKey,
  getGeminiApiKey,
  setGeminiApiKey,
} from '@/lib/gemini';
import type { Opportunity, Student } from '@/types';

interface CandidateAiDossierProps {
  student: Student;
  opportunity?: Opportunity;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export function CandidateAiDossier({ student, opportunity }: CandidateAiDossierProps) {
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loadingChat, setLoadingChat] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Key configuration modal / inline drawer
  const [hasKey, setHasKey] = useState<boolean>(hasGeminiApiKey());
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');
  const [keySavedSuccess, setKeySavedSuccess] = useState<boolean>(false);

  // Quick Prompt Suggestions
  const quickPrompts = [
    `What are ${student.name.split(' ')[0]}'s strongest verified projects?`,
    `How does their code prove proficiency for ${opportunity ? opportunity.title : 'this role'}?`,
    `Are there any critical skill gaps or missing credentials?`,
    `Explain the cryptographic SHA-256 integrity of their evidence.`,
  ];

  // Auto-generate candidate summary on load or when student changes
  useEffect(() => {
    let isMounted = true;
    async function fetchSummary() {
      setLoadingSummary(true);
      setSummaryError(null);
      try {
        const res = await generateCandidateSummary(student.id, opportunity);
        if (isMounted) {
          setSummary(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setSummaryError(err.message || 'Failed to generate AI summary.');
        }
      } finally {
        if (isMounted) {
          setLoadingSummary(false);
        }
      }
    }

    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, [student.id, opportunity?.id]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingChat]);

  const handleRegenerateSummary = async () => {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const res = await generateCandidateSummary(student.id, opportunity);
      setSummary(res);
    } catch (err: any) {
      setSummaryError(err.message || 'Failed to generate AI summary.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loadingChat) return;

    setInputText('');
    setChatError(null);

    const userMessage: ChatMessage = {
      role: 'user',
      text: query,
      timestamp: new Date(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setLoadingChat(true);

    try {
      const historyForApi = messages.map((m) => ({ role: m.role, text: m.text }));
      const responseText = await askCandidateQuestion(
        student.id,
        opportunity,
        query,
        historyForApi
      );

      const aiMessage: ChatMessage = {
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages([...newHistory, aiMessage]);
    } catch (err: any) {
      setChatError(err.message || 'Failed to get answer from Gemini AI.');
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    setGeminiApiKey(inputKey.trim());
    setHasKey(true);
    setKeySavedSuccess(true);
    setInputKey('');
    setTimeout(() => {
      setKeySavedSuccess(false);
      setShowKeyConfig(false);
      handleRegenerateSummary();
    }, 1200);
  };

  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 via-white to-indigo-50/20 shadow-soft">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-brand-600 text-white shadow-soft">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-indigo-950">
                AI Candidate Dossier & Evaluator
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100/90 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-indigo-800 border border-indigo-200/70">
                <Bot className="h-3 w-3" /> Gemini AI
              </span>
            </div>
            <p className="text-xs text-indigo-700">
              Deterministic evidence synthesis and interactive technical interrogation
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            disabled={!summary || loadingSummary}
            className="btn-secondary text-xs py-1.5 px-3 bg-white/90 border-indigo-200 text-indigo-800 hover:bg-indigo-50"
            title="Copy AI summary"
          >
            {copiedSummary ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleRegenerateSummary}
            disabled={loadingSummary}
            className="btn-secondary text-xs py-1.5 px-3 bg-white/90 border-indigo-200 text-indigo-800 hover:bg-indigo-50"
            title="Regenerate summary"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="btn-ghost text-xs py-1.5 px-2.5 text-indigo-700 hover:bg-indigo-100/60"
            title="Configure Gemini API Key"
          >
            <Key className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{hasKey ? 'Key Configured' : 'Setup Key'}</span>
            {showKeyConfig ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Inline API Key configuration bar if toggled */}
      {showKeyConfig && (
        <div className="border-b border-indigo-100 bg-white p-4 animate-fade-in">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 mb-1">
              <Key className="h-3.5 w-3.5 text-indigo-600" />
              <span>Gemini API Key Configuration</span>
            </div>
            <p className="text-[11px] text-ink-600 mb-2">
              Gemini key is auto-loaded from <code className="bg-ink-100 text-ink-800 px-1 py-0.5 rounded font-mono">GEMINI_KEY</code> in your <code className="bg-ink-100 text-ink-800 px-1 py-0.5 rounded font-mono">.env</code> file. You can also paste an override below for live evaluation:
            </p>

            <form onSubmit={handleSaveCustomKey} className="flex gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="input text-xs flex-1 py-1.5"
              />
              <button type="submit" className="btn-primary text-xs py-1.5 px-3">
                Save Key
              </button>
            </form>

            {keySavedSuccess && (
              <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Key updated and verified! Regenerating summary...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="p-6 space-y-6">
        {/* Executive Summary Block */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              Executive Candidate Summary
            </span>
            <span className="text-[11px] font-medium text-ink-500">
              Verified Skills & Cryptographic Evidence Synthesis
            </span>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-2xs relative">
            {loadingSummary ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-indigo-600">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs font-medium text-ink-600">
                  Synthesizing verified repositories, credentials, and match alignment via Gemini...
                </span>
              </div>
            ) : summaryError ? (
              <div className="flex items-start gap-2.5 text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Summary generation notice:</div>
                  <div>{summaryError}</div>
                  <div className="mt-1 text-[11px] text-rose-600">
                    Verify that <code className="font-mono">GEMINI_KEY</code> is set in your <code className="font-mono">.env</code> file.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-ink-800 font-normal">
                  {summary}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-ink-100 text-[11px] text-ink-500">
                  <span className="font-semibold text-indigo-900">Evaluation Pillars:</span>
                  <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md font-medium">Code Artifacts</span>
                  <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md font-medium">Issuer Integrity</span>
                  <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md font-medium">SHA-256 Non-Repudiation</span>
                  {opportunity && (
                    <span className="bg-brand-50 text-brand-800 px-2 py-0.5 rounded-md font-medium ml-auto">
                      Aligned for {opportunity.title}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Recruiter Interrogation Chat */}
        <div className="border-t border-indigo-100 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <h4 className="font-display text-sm font-bold text-indigo-950">
                Ask Gemini About {student.name}
              </h4>
            </div>
            <span className="text-[11px] text-ink-500">
              Live technical verification Q&A
            </span>
          </div>

          {/* Quick Prompt suggestions */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loadingChat}
                className="rounded-xl border border-indigo-200/90 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-900 hover:bg-indigo-50 transition shadow-2xs active:scale-[0.98]"
              >
                💬 {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          {messages.length > 0 && (
            <div className="mb-3 max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-indigo-100 bg-white/80 p-4 shadow-2xs">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'model' && (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs text-xs">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-50/70 border border-indigo-100 text-ink-900 shadow-2xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div
                      className={`mt-1 text-[9px] ${
                        msg.role === 'user' ? 'text-indigo-200' : 'text-ink-400'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {loadingChat && (
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white text-xs">
                    <Bot className="h-3.5 w-3.5 animate-spin" />
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs text-ink-600 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    <span>Auditing candidate dossier and verified evidence...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {chatError && (
            <div className="mb-3 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{chatError}</span>
            </div>
          )}

          {/* Chat input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Ask any question about ${student.name.split(' ')[0]}'s code, credentials, or suitability...`}
                disabled={loadingChat}
                className="input text-xs w-full py-2.5 pr-10 shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || loadingChat}
              className="btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-1.5 shadow-soft flex-shrink-0"
            >
              {loadingChat ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ask AI</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
