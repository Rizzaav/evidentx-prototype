import { useState } from 'react';
import { PlusCircle, Check, ArrowRight, X, Users, Sparkles, Crown } from 'lucide-react';
import { useRouter } from '@/lib/router';
import {
  PageHeader,
  Card,
  Chip,
  SkillBadge,
  Section,
} from '@/components/ui';
import { SKILLS, skillMap } from '@/data/mockData';
import { useCustomTeams } from '@/lib/customTeams';
import type { TeamRequirement } from '@/types';

interface RoleDraft {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
}

export function CreateTeamPage() {
  const { navigate } = useRouter();
  const { teams, addTeam } = useCustomTeams();

  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [description, setDescription] = useState('');
  const [teamSkills, setTeamSkills] = useState<string[]>([]);
  const [roles, setRoles] = useState<RoleDraft[]>([
    { id: 'r1', name: '', description: '', requiredSkills: [] },
    { id: 'r2', name: '', description: '', requiredSkills: [] },
  ]);
  const [skillSearch, setSkillSearch] = useState('');
  const [activeRoleIdx, setActiveRoleIdx] = useState(0);
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);

  const filteredSkills = SKILLS.filter(
    (s) =>
      s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !teamSkills.includes(s.id) &&
      !roles[activeRoleIdx]?.requiredSkills.includes(s.id)
  );

  const addTeamSkill = (id: string) => setTeamSkills((p) => [...p, id]);
  const removeTeamSkill = (id: string) => setTeamSkills((p) => p.filter((x) => x !== id));
  const addRoleSkill = (roleId: string, skillId: string) =>
    setRoles((p) => p.map((r) => (r.id === roleId ? { ...r, requiredSkills: [...r.requiredSkills, skillId] } : r)));
  const removeRoleSkill = (roleId: string, skillId: string) =>
    setRoles((p) => p.map((r) => (r.id === roleId ? { ...r, requiredSkills: r.requiredSkills.filter((x) => x !== skillId) } : r)));

  const updateRole = (id: string, field: 'name' | 'description', value: string) =>
    setRoles((p) => p.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const addRole = () =>
    setRoles((p) => [...p, { id: `r${p.length + 1}`, name: '', description: '', requiredSkills: [] }]);

  const removeRole = (id: string) => setRoles((p) => p.filter((r) => r.id !== id));

  const validRoles = roles.filter((r) => r.name && r.requiredSkills.length > 0);
  const valid = title && organization && validRoles.length >= 2 && teamSkills.length > 0;

  const handleCreate = () => {
    if (!valid) return;
    const newId = `team_cust_${Date.now()}`;
    const newTeam: TeamRequirement = {
      id: newId,
      title: title.trim(),
      organization: organization.trim(),
      description: description.trim() || `Multidisciplinary innovation squad at ${organization.trim()}.`,
      createdDate: new Date().toISOString().split('T')[0],
      requiredSkills: teamSkills,
      roles: validRoles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || `Responsible for ${r.name} tasks.`,
        requiredSkills: r.requiredSkills,
      })),
    };
    addTeam(newTeam);
    setCreatedTeamId(newId);
  };

  if (createdTeamId) {
    return (
      <div>
        <PageHeader title="Create Team" backTo="/team/matching" onBack={() => navigate('/team/matching')} />
        <Card className="p-8 text-center max-w-lg mx-auto shadow-lift">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-ink-900">Team requirement created</h2>
          <p className="mt-2 text-sm text-ink-600">
            <strong>{title}</strong> has {validRoles.length} roles and {teamSkills.length} required skills.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => navigate(`/team/matching/${createdTeamId}`)} className="btn-primary">
              Build Team Composition <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => navigate('/team/create')} className="btn-secondary">Create another</button>
          </div>
        </Card>
      </div>
    );
  }


  return (
    <div>
      <PageHeader
        title="Create Team"
        subtitle="Define roles and required skills for a multidisciplinary team"
        backTo="/team/matching"
        onBack={() => navigate('/team/matching')}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-ink-900">Team details</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Team title <span className="text-rose-500">*</span></label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI Healthcare Innovation Team" className="input" />
              </div>
              <div>
                <label className="label">Organization <span className="text-rose-500">*</span></label>
                <input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. SIH Grand Challenge" className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will this team build?" rows={2} className="input resize-none" />
              </div>
            </div>
          </Card>

          {/* Team skills */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-ink-900">Team required skills</h3>
            <p className="text-xs text-ink-500 mt-0.5">Overall skills the combined team must cover</p>
            <div className="mt-3 relative">
              <input value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} placeholder="Search skills to add to team…" className="input" />
              {skillSearch && filteredSkills.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-ink-100 bg-white p-2 shadow-lift max-h-48 overflow-y-auto">
                  {filteredSkills.slice(0, 6).map((s) => (
                    <button key={s.id} onClick={() => { addTeamSkill(s.id); setSkillSearch(''); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-ink-50">
                      <span className="text-sm font-semibold text-ink-800">{s.name}</span>
                      <span className="text-xs text-ink-400">{s.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 min-h-[2.5rem]">
              {teamSkills.length === 0 ? (
                <span className="text-sm text-ink-400">Add the skills the team needs overall.</span>
              ) : (
                teamSkills.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-700">
                    {skillMap[id]?.name}
                    <button onClick={() => removeTeamSkill(id)}><X className="h-3 w-3" /></button>
                  </span>
                ))
              )}
            </div>
          </Card>

          {/* Roles */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink-900">Roles</h3>
              <button onClick={addRole} className="btn-ghost text-xs"><PlusCircle className="h-3.5 w-3.5" /> Add role</button>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">Define each role and the skills it requires</p>

            <div className="mt-4 space-y-4">
              {roles.map((role, idx) => (
                <div key={role.id} className={`rounded-xl border p-4 ${activeRoleIdx === idx ? 'border-amber-200 bg-amber-50/30' : 'border-ink-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-ink-700">
                      <Crown className="h-4 w-4 text-amber-500" /> Role {idx + 1}
                    </span>
                    {roles.length > 1 && (
                      <button onClick={() => removeRole(role.id)} className="text-rose-400 hover:text-rose-600 text-xs">Remove</button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      value={role.name}
                      onChange={(e) => updateRole(role.id, 'name', e.target.value)}
                      onFocus={() => setActiveRoleIdx(idx)}
                      placeholder="Role name (e.g. Frontend Developer)"
                      className="input"
                    />
                    <input
                      value={role.description}
                      onChange={(e) => updateRole(role.id, 'description', e.target.value)}
                      onFocus={() => setActiveRoleIdx(idx)}
                      placeholder="What this role does"
                      className="input"
                    />
                  </div>
                  <div className="mt-3">
                    <div className="text-[11px] font-bold uppercase text-ink-400">Role skills</div>
                    <div className="mt-1.5 flex flex-wrap gap-2 min-h-[2rem]">
                      {role.requiredSkills.length === 0 ? (
                        <span className="text-xs text-ink-400">Add skills from the search above (click the role first).</span>
                      ) : (
                        role.requiredSkills.map((id) => (
                          <span key={id} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-ink-50 px-2 py-0.5 text-xs font-semibold text-ink-700">
                            {skillMap[id]?.name}
                            <button onClick={() => removeRoleSkill(role.id, id)}><X className="h-3 w-3" /></button>
                          </span>
                        ))
                      )}
                    </div>
                    {/* quick add from team skills */}
                    {teamSkills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-[10px] text-ink-400">Quick add:</span>
                        {teamSkills.filter((id) => !role.requiredSkills.includes(id)).map((id) => (
                          <button key={id} onClick={() => addRoleSkill(role.id, id)} className="text-[11px] rounded bg-ink-50 px-1.5 py-0.5 text-ink-600 hover:bg-brand-50 hover:text-brand-700">
                            + {skillMap[id]?.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Preview side */}
        <div className="space-y-6">
          <Card className="p-5 sticky top-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-ink-900">Live preview</h3>
            </div>
            <div className="mt-3 rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Users className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-ink-900 truncate">{title || 'Team title'}</div>
                  <div className="text-xs text-ink-500 truncate">{organization || 'Organization'}</div>
                </div>
              </div>
              {description && <p className="mt-2 text-sm text-ink-600 line-clamp-2">{description}</p>}
              <div className="mt-3 border-t border-ink-100 pt-3">
                <div className="text-[11px] font-bold uppercase text-brand-500">Team skills ({teamSkills.length})</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {teamSkills.length === 0 ? <span className="text-xs text-ink-400">None</span> : teamSkills.map((id) => <SkillBadge key={id} name={skillMap[id]?.name ?? id} size="sm" />)}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-[11px] font-bold uppercase text-amber-500">Roles ({validRoles.length})</div>
                <div className="mt-1 space-y-1.5">
                  {validRoles.length === 0 ? (
                    <span className="text-xs text-ink-400">Add at least 2 roles with skills.</span>
                  ) : (
                    validRoles.map((r) => (
                      <div key={r.id} className="rounded-lg bg-ink-50 p-2">
                        <div className="text-sm font-semibold text-ink-800">{r.name}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {r.requiredSkills.map((id) => <span key={id} className="text-[11px] rounded bg-white px-1.5 py-0.5 text-ink-600">{skillMap[id]?.name}</span>)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleCreate} disabled={!valid} className="mt-4 btn-primary w-full">
              <PlusCircle className="h-4 w-4" /> Create team
            </button>
            {!valid && <p className="mt-2 text-xs text-ink-400">Need a title, organization, team skills and at least 2 valid roles.</p>}
          </Card>
        </div>
      </div>

      {/* Active teams */}
      <Section title="All active team requirements">
        <div className="grid gap-3 sm:grid-cols-3">
          {teams.map((t) => (
            <button key={t.id} onClick={() => navigate(`/team/matching/${t.id}`)} className="card p-3 text-left hover:shadow-lift transition flex items-center gap-3">
              <Users className="h-4 w-4 text-ink-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink-900 truncate">{t.title}</div>
                <div className="text-xs text-ink-500">{t.organization} · {t.roles.length} roles</div>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-400 ml-auto" />
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

