import { useState, useMemo } from 'react';
import { Search, MapPin, Clock, Wallet, Building2, ArrowRight, SlidersHorizontal } from 'lucide-react';
import {
  PageHeader,
  Chip,
  SkillBadge,
  EmptyState,
} from '@/components/ui';
import { useDemoStudent } from '@/lib/useDemoStudent';
import { rankOpportunitiesForStudent } from '@/lib/matchingEngine';
import { skillMap } from '@/data/mockData';
import { useCustomOpportunities } from '@/lib/customOpportunities';
import { useApplications } from '@/lib/applications';
import { useDebounce } from '@/lib/useDebounce';
import { useRouter } from '@/lib/router';
import type { Opportunity } from '@/types';

export function InternshipDiscoveryPage() {
  const { studentId, student } = useDemoStudent();
  const { navigate } = useRouter();
  const { opportunities } = useCustomOpportunities();
  const { hasApplied, getApplication } = useApplications();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 180);
  const [sort, setSort] = useState<'match' | 'recent'>('match');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const ranked = useMemo(
    () => (studentId ? rankOpportunitiesForStudent(studentId, opportunities) : []),
    [studentId, opportunities]
  );

  const list = useMemo(() => {
    let items = ranked
      .map((r) => ({ result: r, opp: opportunities.find((o) => o.id === r.targetId)! }))
      .filter((x) => !!x.opp);

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      items = items.filter(
        ({ opp }) =>
          opp.title.toLowerCase().includes(q) ||
          opp.organization.toLowerCase().includes(q) ||
          opp.description.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') {
      items = items.filter(({ opp }) => opp.type === typeFilter);
    }
    if (sort === 'recent') {
      items = [...items].sort((a, b) => +new Date(b.opp.postedDate) - +new Date(a.opp.postedDate));
    }
    return items;
  }, [ranked, opportunities, debouncedQuery, typeFilter, sort]);

  if (!student) return null;

  const types = ['all', ...Array.from(new Set(opportunities.map((o) => o.type)))];

  return (
    <div>
      <PageHeader
        title="Internship Discovery"
        subtitle="Opportunities matched to your verified skills"
      />

      {/* Search + filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, organization, keyword…"
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-ink-400" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input py-2">
            {types.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as 'match' | 'recent')} className="input py-2">
            <option value="match">Sort: Best match</option>
            <option value="recent">Sort: Most recent</option>
          </select>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState title="No opportunities found" description="Try adjusting your search or filters." icon={<Search className="h-10 w-10" />} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map(({ result, opp }) => {
            const isApplied = hasApplied(studentId, opp.id);
            const app = getApplication(studentId, opp.id);
            return (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                matchScore={result.matchScore}
                matchedCount={result.matchedSkills.length}
                missingCount={result.missingSkills.length}
                appliedStatus={isApplied ? app?.status ?? 'Applied' : undefined}
                onClick={() => navigate(`/student/internships/${opp.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OpportunityCard({
  opp,
  matchScore,
  matchedCount,
  missingCount,
  appliedStatus,
  onClick,
}: {
  opp: Opportunity;
  matchScore: number;
  matchedCount: number;
  missingCount: number;
  appliedStatus?: string;
  onClick: () => void;
}) {
  const color = matchScore >= 75 ? 'from-accent-500 to-accent-700' : matchScore >= 50 ? 'from-amber-500 to-amber-600' : 'from-rose-500 to-rose-600';
  return (
    <button onClick={onClick} className="card p-5 text-left hover:shadow-lift hover:border-brand-200 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
              <Building2 className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-ink-900 leading-tight truncate">{opp.title}</h3>
                {appliedStatus && <Chip color="emerald"><span className="text-emerald-700 font-bold">{appliedStatus}</span></Chip>}
              </div>
              <div className="text-xs text-ink-500 truncate">{opp.organization}</div>
            </div>
          </div>
        </div>
        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white font-extrabold shadow-soft`}>
          {matchScore}%
        </div>
      </div>

      <p className="mt-3 text-sm text-ink-600 line-clamp-2">{opp.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {opp.location}</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {opp.duration}</span>
        <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> {opp.stipend}</span>
        <Chip color="brand">{opp.type}</Chip>
      </div>

      <div className="mt-3 border-t border-ink-100 pt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {opp.requiredSkills.slice(0, 4).map((skId) => (
            <SkillBadge key={skId} name={skillMap[skId]?.name ?? skId} size="sm" />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Chip color="emerald">{matchedCount} matched</Chip>
          {missingCount > 0 && <Chip color="rose">{missingCount} missing</Chip>}
          <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-brand-600 transition" />
        </div>
      </div>
    </button>
  );
}
