import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllStudents, getAllStudentMap } from '@/data/mockData';
import { useCustomStudents } from '@/lib/customStudents';
import { useAuth } from '@/lib/authContext';
import type { Student } from '@/types';

const KEY = 'evx_demo_student_id';

export function useDemoStudent() {
  const { profile, setDemoUser } = useAuth();
  const { addStudent, removeStudent } = useCustomStudents();

  // Determine initial active ID from auth profile or localStorage or default
  const [studentId, setStudentIdState] = useState<string>(() => {
    if (profile && profile.role === 'student' && profile.id) {
      return profile.id;
    }
    const saved = localStorage.getItem(KEY);
    return saved && getAllStudentMap()[saved] ? saved : 'st_aarav';
  });

  // Whenever profile changes in authContext, sync studentId immediately!
  useEffect(() => {
    if (profile && profile.role === 'student' && profile.id && profile.id !== studentId) {
      setStudentIdState(profile.id);
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(KEY, studentId);
  }, [studentId]);

  const allMap = getAllStudentMap();
  const allList = getAllStudents();

  // If student is a newly created authenticated profile, resolve dynamically:
  const student: Student = useMemo(() => {
    if (allMap[studentId]) {
      return allMap[studentId];
    }
    if (profile && profile.id === studentId) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        program: profile.program || 'Computer Science',
        year: '1st Year',
        university: profile.university || 'State University',
        bio: 'Self-motivated student building verified skills on EvidentX.',
        avatarColor: profile.avatarColor || 'from-brand-500 to-brand-700',
        interests: ['Software Engineering', 'Web Development'],
      };
    }
    return allList[0];
  }, [studentId, allMap, allList, profile]);

  const students = useMemo(() => {
    if (student && !allList.some((s) => s.id === student.id)) {
      return [student, ...allList];
    }
    return allList;
  }, [allList, student]);

  const setStudentId = useCallback(
    (newId: string) => {
      setStudentIdState(newId);
      const target = allMap[newId];
      if (target) {
        setDemoUser({
          id: target.id,
          name: target.name,
          email: target.email,
          role: 'student',
          university: target.university,
          program: target.program,
          avatarColor: target.avatarColor,
        });
      }
    },
    [allMap, setDemoUser]
  );

  return {
    studentId,
    student,
    setStudentId,
    students,
    addStudent,
    removeStudent,
  };
}
