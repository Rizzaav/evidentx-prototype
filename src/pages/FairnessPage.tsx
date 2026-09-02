import {
  Shield,
  CheckCircle2,
  XCircle,
  Scale,
  Eye,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import { PageHeader, Card, Section } from '@/components/ui';

export function FairnessPage() {
  const { navigate } = useRouter();

  const used = [
    'Demonstrated technical skills',
    'Verified evidence (coursework, projects, competitions, credentials)',
    'Proficiency and competency strength scores',
    'Evidence verification status (verified, pending, self-reported)',
    'Inspectable artifact quality and repository proofs',
    'Role-specific required and preferred skills',
    'Relevant technical portfolio artifacts',
  ];

  const excluded = [
    'Gender and demographic data',
    'Religion and caste',
    'Race, ethnicity, and nationality',
    'Disability status and medical history',
    'Political and personal affiliations',
    'Photograph, appearance, and physical traits',
    'Family income and socioeconomic background',
    'Institution prestige (name used strictly for display, zero weight in algorithm)',
    'All protected non-competency attributes',
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={() => navigate('/')} className="btn-ghost mb-4 -ml-2 text-xs font-semibold text-ink-600">
        <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Back to Home
      </button>

      <div className="rounded-3xl bg-ink-950 p-8 sm:p-10 text-white shadow-lift border border-ink-800">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-accent-300">
          <Shield className="h-3.5 w-3.5" /> Deterministic Fairness Policy
        </div>
        <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight">Fair and Explainable Matching</h1>
        <p className="mt-3 max-w-2xl text-ink-300 text-sm leading-relaxed">
          The recommendation engine is deterministic, auditable, and transparent. It operates solely on demonstrated technical competencies and verified evidence, and explicitly excludes all protected or demographic characteristics.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent-600 flex-shrink-0" />
            <h2 className="font-display text-base font-bold text-ink-900">What the algorithm uses</h2>
          </div>
          <ul className="mt-4 space-y-2.5">
            {used.map((u) => (
              <li key={u} className="flex items-start gap-2.5 text-xs text-ink-700">
                <CheckCircle2 className="h-4 w-4 text-accent-600 flex-shrink-0 mt-0.5" />
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <h2 className="font-display text-base font-bold text-ink-900">What the algorithm excludes</h2>
          </div>
          <ul className="mt-4 space-y-2.5">
            {excluded.map((u) => (
              <li key={u} className="flex items-start gap-2.5 text-xs text-ink-700">
                <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-8">
        <Section title="Mathematical Matching Formulation">
          <Card className="p-6">
            <ol className="space-y-4">
              <Step
                n={1}
                title="Aggregate Verified Student Evidence"
                desc="Each skill competency score is computed from supporting evidence artifacts, weighted by verification status: verified (1.0), pending (0.8), self-reported (0.6)."
              />
              <Step
                n={2}
                title="Classify Role Requirements"
                desc="For each target opportunity: proficiency ≥ 70% is fully matched, 40% to 69% is partially matched, and < 40% is classified as missing."
              />
              <Step
                n={3}
                title="Compute Weighted Requirement Score"
                desc="Required competencies carry 2.0x weight relative to preferred skills. Matched skills receive full credit, partial skills receive scaled credit, and missing required skills apply a proportional penalty."
              />
              <Step
                n={4}
                title="Evidence Strength Factor"
                desc="Average strength of verified supporting artifacts contributes a precision quality adjustment, rewarding rigorous project and coursework validation."
              />
              <Step
                n={5}
                title="Generate Explainable Audit Log"
                desc="Every calculation outputs exact matched, partial, and missing skills with linked supporting artifacts and clear natural-language rationale."
              />
            </ol>
          </Card>
        </Section>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <PrincipleCard icon={<Scale className="h-5 w-5 text-brand-600" />} title="Deterministic" desc="Zero stochastic randomness. Identical student evidence and opportunity requirements always yield the exact same score." />
        <PrincipleCard icon={<Eye className="h-5 w-5 text-accent-600" />} title="Auditable" desc="Every score is fully decomposable into individual skill proficiencies, artifact weights, and scoring rules." />
        <PrincipleCard icon={<Lightbulb className="h-5 w-5 text-amber-600" />} title="Actionable" desc="Deficit skills are paired with development roadmaps and targeted learning recommendations." />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={() => navigate('/student/dashboard')} className="btn-primary text-xs">
          Open Demo Platform <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => navigate('/')} className="btn-secondary text-xs">
          Back to Home
        </button>
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <li className="flex gap-4">
      <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-card">
        {n}
      </span>
      <div>
        <div className="font-semibold text-ink-900 text-sm">{title}</div>
        <div className="text-xs text-ink-600 mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </li>
  );
}

function PrincipleCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="p-5">
      <div className="mb-2">{icon}</div>
      <h3 className="font-semibold text-ink-900 text-sm">{title}</h3>
      <p className="mt-1 text-xs text-ink-600 leading-relaxed">{desc}</p>
    </Card>
  );
}
