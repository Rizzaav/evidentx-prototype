import { useState, useEffect, useCallback } from 'react';
import type { Opportunity } from '@/types';
import { _reloadCustomData, addCustomOpportunity, removeCustomOpportunity, getAllOpportunities } from '@/data/mockData';

let listeners: (() => void)[] = [];
function notify() {
  _reloadCustomData();
  for (const l of listeners) l();
}

export function useCustomOpportunities() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  const opportunities = getAllOpportunities();

  const addOpportunity = useCallback((opp: Opportunity) => {
    addCustomOpportunity(opp);
    notify();
  }, []);

  const removeOpportunity = useCallback((id: string) => {
    removeCustomOpportunity(id);
    notify();
  }, []);

  return { opportunities, addOpportunity, removeOpportunity };
}
