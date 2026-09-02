import { useState, useEffect, useCallback } from 'react';
import type { TeamRequirement } from '@/types';
import { _reloadCustomData, addCustomTeam, removeCustomTeam, getAllTeams } from '@/data/mockData';

let listeners: (() => void)[] = [];
function notify() {
  _reloadCustomData();
  for (const l of listeners) l();
}

export function useCustomTeams() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  const teams = getAllTeams();

  const addTeam = useCallback((team: TeamRequirement) => {
    addCustomTeam(team);
    notify();
  }, []);

  const removeTeam = useCallback((id: string) => {
    removeCustomTeam(id);
    notify();
  }, []);

  return { teams, addTeam, removeTeam };
}
