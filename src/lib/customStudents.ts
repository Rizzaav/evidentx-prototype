import { useState, useEffect, useCallback } from 'react';
import type { Student, Evidence } from '@/types';
import { _reloadCustomData } from '@/data/mockData';

// ============================================================
// Add/remove/update custom student profiles — persisted in localStorage.
// ============================================================

const STORAGE_KEY = 'evx_custom_students_v1';

type CustomData = {
  students: Student[];
  evidence: Evidence[];
  evidenceSkillStrength: Record<string, Record<string, number>>;
};

function loadCustom(): CustomData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { students: [], evidence: [], evidenceSkillStrength: {} };
    const parsed = JSON.parse(raw) as CustomData;
    return {
      students: parsed.students ?? [],
      evidence: parsed.evidence ?? [],
      evidenceSkillStrength: parsed.evidenceSkillStrength ?? {},
    };
  } catch {
    return { students: [], evidence: [], evidenceSkillStrength: {} };
  }
}

function saveCustom(data: CustomData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let listeners: (() => void)[] = [];
function notify() {
  _reloadCustomData();
  for (const l of listeners) l();
}

export function addCustomStudentRecord(
  student: Student,
  evidence: Evidence[] = [],
  evidenceSkillStrength: Record<string, Record<string, number>> = {}
) {
  const data = loadCustom();
  const existingIdx = data.students.findIndex((s) => s.id === student.id);
  if (existingIdx >= 0) {
    data.students[existingIdx] = student;
  } else {
    data.students.push(student);
  }
  if (evidence.length > 0) {
    data.evidence.push(...evidence);
  }
  Object.assign(data.evidenceSkillStrength, evidenceSkillStrength);
  saveCustom(data);
  notify();
}

export function updateCustomStudentRecord(student: Student) {
  const data = loadCustom();
  const existingIdx = data.students.findIndex((s) => s.id === student.id);
  if (existingIdx >= 0) {
    data.students[existingIdx] = student;
  } else {
    data.students.push(student);
  }
  saveCustom(data);
  notify();
}

export function updateEvidenceRecord(
  evidenceItem: Evidence,
  skillStrengths: Record<string, number> = {}
) {
  const data = loadCustom();
  const idx = data.evidence.findIndex((e) => e.id === evidenceItem.id);
  if (idx >= 0) {
    data.evidence[idx] = evidenceItem;
  } else {
    data.evidence.push(evidenceItem);
  }
  data.evidenceSkillStrength[evidenceItem.id] = skillStrengths;
  saveCustom(data);
  notify();
}

export function deleteEvidenceRecord(evidenceId: string) {
  const data = loadCustom();
  data.evidence = data.evidence.filter((e) => e.id !== evidenceId);
  delete data.evidenceSkillStrength[evidenceId];
  saveCustom(data);
  notify();
}

export function useCustomStudents() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  const addStudent = useCallback(
    (
      student: Student,
      evidence: Evidence[],
      evidenceSkillStrength: Record<string, Record<string, number>>
    ) => {
      addCustomStudentRecord(student, evidence, evidenceSkillStrength);
    },
    []
  );

  const updateStudent = useCallback((student: Student) => {
    updateCustomStudentRecord(student);
  }, []);

  const removeStudent = useCallback((studentId: string) => {
    const data = loadCustom();
    data.students = data.students.filter((s) => s.id !== studentId);
    const removedEvIds = new Set(data.evidence.filter((e) => e.studentId === studentId).map((e) => e.id));
    data.evidence = data.evidence.filter((e) => e.studentId !== studentId);
    for (const evId of removedEvIds) delete data.evidenceSkillStrength[evId];
    saveCustom(data);
    notify();
  }, []);

  const addEvidence = useCallback(
    (
      evidenceItem: Evidence,
      skillStrengths: Record<string, number>
    ) => {
      updateEvidenceRecord(evidenceItem, skillStrengths);
    },
    []
  );

  const updateEvidence = useCallback(
    (
      evidenceItem: Evidence,
      skillStrengths: Record<string, number>
    ) => {
      updateEvidenceRecord(evidenceItem, skillStrengths);
    },
    []
  );

  const deleteEvidence = useCallback((evidenceId: string) => {
    deleteEvidenceRecord(evidenceId);
  }, []);

  return { addStudent, updateStudent, removeStudent, addEvidence, updateEvidence, deleteEvidence };
}
