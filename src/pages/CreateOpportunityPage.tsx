import { useState } from 'react';
import {
  PlusCircle,
  Check,
  ArrowRight,
  Briefcase,
  X,
  Sparkles,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import {
  PageHeader,
  Card,
  Section,
  Chip,
  SkillBadge,
} from '@/components/ui';
import { SKILLS, skillMap } from '@/data/mockData';
import { useCustomOpportunities } from '@/lib/customOpportunities';
import type { Opportunity } from '@/types';

export function CreateOpportunityPage() {
  const { navigate } = useRouter();
  const { opportunities, addOpportunity } = useCustomOpportunities();

  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<Opportunity['type']>('Internship');
  const [duration, setDuration] = useState('');
  const [stipend, setStipend] = useState('');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [createdOppId, setCreatedOppId] = useState<string | null>(null);

  const filteredSkills = SKILLS.filter(
    (s) =>
      s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !requiredSkills.includes(s.id) &&
      !preferredSkills.includes(s.id)
  );

  const addRequired = (id: string) => setRequiredSkills((p) => [...p, id]);
  const addPreferred = (id: string) => setPreferredSkills((p) => [...p, id]);
  const removeRequired = (id: string) => setRequiredSkills((p) => p.filter((x) => x !== id));
  const removePreferred = (id: string) => setPreferredSkills((p) => p.filter((x) => x !== id));

  const valid = title && organization && requiredSkills.length > 0;

  const handleCreate = () => {
    if (!valid) return;
    const newId = `op_cust_${Date.now()}`;
    const newOpp: Opportunity = {
      id: newId,
      title: title.trim(),
      organization: organization.trim(),
      location: location.trim() || 'Remote',
      type,
      duration: duration.trim() || '3 months',
      stipend: stipend.trim() || 'Competitive',
      description: description.trim() || `Exciting ${type} opportunity at ${organization.trim()}.`,
      postedBy: organization.trim(),
      postedDate: new Date().toISOString().split('T')[0],
      requiredSkills,
      preferredSkills,
    };
    addOpportunity(newOpp);
    setCreatedOppId(newId);
  };

  if (createdOppId) {
    return (
      <div>
        <PageHeader title="Create Opportunity" backTo="/org/dashboard" onBack={() => navigate('/org/dashboard')} />
        <Card className="p-8 text-center max-w-lg mx-auto shadow-lift">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-600">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-ink-900">Opportunity created</h2>
          <p className="mt-2 text-sm text-ink-600">
            <strong>{title}</strong> at {organization} is now live with {requiredSkills.length} required
            and {preferredSkills.length} preferred skills.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => navigate(`/org/candidates/${createdOppId}`)} className="btn-primary">
              View Candidate Matches <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => navigate('/org/dashboard')} className="btn-secondary">Back to dashboard</button>
          </div>
        </Card>
      </div>
    );
  }


  return (
    <div>
      <PageHeader
        title="Create Opportunity"
        subtitle="Define required and preferred skills for explainable matching"
        backTo="/org/dashboard"
        onBack={() => navigate('/org/dashboard')}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-ink-900">Opportunity details</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Title <span className="text-rose-500">*</span></label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend Developer Intern" className="input" />
              </div>
              <div>
                <label className="label">Organization <span className="text-rose-500">*</span></label>
                <input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. TechFlow Labs" className="input" />
              </div>
              <div>
                <label className="label">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru (Hybrid)" className="input" />
              </div>
              <div>
                <label className="label">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as Opportunity['type'])} className="input">
                  <option>Internship</option>
                  <option>Research</option>
                  <option>Hackathon Team</option>
                  <option>Project</option>
                </select>
              </div>
              <div>
                <label className="label">Duration</label>
                <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 6 months" className="input" />
              </div>
              <div>
                <label className="label">Stipend</label>
                <input value={stipend} onChange={(e) => setStipend(e.target.value)} placeholder="e.g. ₹35,000/mo" className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role and responsibilities…" rows={3} className="input resize-none" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-ink-900">Skills</h3>
            <p className="text-xs text-ink-500 mt-0.5">Required skills carry 2× the weight of preferred skills in matching.</p>

            {/* Skill search */}
            <div className="mt-4 relative">
              <input
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills to add…"
                className="input"
              />
              {skillSearch && filteredSkills.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-ink-100 bg-white p-2 shadow-lift max-h-56 overflow-y-auto">
                  {filteredSkills.slice(0, 8).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-ink-50">
                      <div className="text-sm">
                        <span className="font-semibold text-ink-800">{s.name}</span>
                        <span className="ml-2 text-xs text-ink-400">{s.category}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { addRequired(s.id); setSkillSearch(''); }} className="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600 hover:bg-rose-100">Required</button>
                        <button onClick={() => { addPreferred(s.id); setSkillSearch(''); }} className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600 hover:bg-amber-100">Preferred</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Required */}
            <div className="mt-4">
              <div className="text-xs font-bold uppercase tracking-wide text-rose-600">Required skills ({requiredSkills.length})</div>
              <div className="mt-2 flex flex-wrap gap-2 min-h-[2.5rem]">
                {requiredSkills.length === 0 ? (
                  <span className="text-sm text-ink-400">No required skills added yet.</span>
                ) : (
                  requiredSkills.map((id) => (
                    <span key={id} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-sm font-semibold text-rose-700">
                      {skillMap[id]?.name}
                      <button onClick={() => removeRequired(id)}><X className="h-3 w-3" /></button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Preferred */}
            <div className="mt-4">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-600">Preferred skills ({preferredSkills.length})</div>
              <div className="mt-2 flex flex-wrap gap-2 min-h-[2.5rem]">
                {preferredSkills.length === 0 ? (
                  <span className="text-sm text-ink-400">No preferred skills added yet.</span>
                ) : (
                  preferredSkills.map((id) => (
                    <span key={id} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
                      {skillMap[id]?.name}
                      <button onClick={() => removePreferred(id)}><X className="h-3 w-3" /></button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Side: preview */}
        <div className="space-y-6">
          <Card className="p-5 sticky top-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent-600" />
              <h3 className="font-semibold text-ink-900">Live preview</h3>
            </div>
            <div className="mt-3 rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                  <Briefcase className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-ink-900 truncate">{title || 'Opportunity title'}</div>
                  <div className="text-xs text-ink-500 truncate">{organization || 'Organization'} · {location || 'Location'}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-ink-500">
                <Chip color="brand">{type}</Chip>
                {duration && <span>{duration}</span>}
                {stipend && <span>· {stipend}</span>}
              </div>
              {description && <p className="mt-2 text-sm text-ink-600 line-clamp-3">{description}</p>}
              <div className="mt-3 border-t border-ink-100 pt-3">
                <div className="text-[11px] font-bold uppercase text-rose-500">Required</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {requiredSkills.length === 0 ? <span className="text-xs text-ink-400">None</span> : requiredSkills.map((id) => <SkillBadge key={id} name={skillMap[id]?.name ?? id} size="sm" />)}
                </div>
                <div className="mt-2 text-[11px] font-bold uppercase text-amber-500">Preferred</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {preferredSkills.length === 0 ? <span className="text-xs text-ink-400">None</span> : preferredSkills.map((id) => <SkillBadge key={id} name={skillMap[id]?.name ?? id} size="sm" />)}
                </div>
              </div>
            </div>
            <button onClick={handleCreate} disabled={!valid} className="mt-4 btn-primary w-full">
              <PlusCircle className="h-4 w-4" /> Create opportunity
            </button>
            {!valid && <p className="mt-2 text-xs text-ink-400">Title, organization and at least one required skill are needed.</p>}
          </Card>
        </div>
      </div>

      {/* Existing opportunities reference */}
      <Section title="All active opportunities">
        <div className="grid gap-3 sm:grid-cols-2">
          {opportunities.map((o) => (
            <button key={o.id} onClick={() => navigate(`/org/candidates/${o.id}`)} className="card p-3 text-left hover:shadow-lift transition flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-ink-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink-900 truncate">{o.title}</div>
                <div className="text-xs text-ink-500">{o.organization} · {o.requiredSkills.length} req · {o.preferredSkills.length} pref</div>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-400 ml-auto" />
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
