'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { loadWorkspace, persistApplication, persistCandidate, persistJob, uploadCandidateFile } from '@/lib/firestore';
import { demoCandidates, demoJobs } from '@/lib/mock-data';
import { Application, Candidate, Job, SyncStatus } from '@/types/ats';

type WorkspaceContextValue = {
  jobs: Job[];
  candidates: Candidate[];
  syncStatus: SyncStatus;
  syncMessage: string;
  getJob: (id: string) => Job | undefined;
  getCandidate: (id: string) => Candidate | undefined;
  saveJob: (job: Job) => Promise<void>;
  saveCandidate: (candidate: Candidate) => Promise<void>;
  saveApplication: (application: Application) => Promise<void>;
  addJob: (job: Job) => Promise<void>;
  addCandidate: (candidate: Candidate) => Promise<void>;
  uploadCv: (candidate: Candidate, file: File) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(demoJobs);
  const [candidates, setCandidates] = useState<Candidate[]>(demoCandidates);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [syncMessage, setSyncMessage] = useState('Connecting to Firebase…');

  useEffect(() => {
    let mounted = true;
    loadWorkspace().then((workspace) => {
      if (!mounted) return;
      setJobs(workspace.jobs);
      setCandidates(workspace.candidates);
      setSyncStatus('connected');
      setSyncMessage('Synced to Firebase');
    }).catch((error) => {
      console.warn('Firebase sync unavailable:', error);
      if (!mounted) return;
      setSyncStatus('offline');
      setSyncMessage('Demo data · offline');
    });
    return () => { mounted = false; };
  }, []);

  const safeSync = async (operation: () => Promise<void>) => {
    if (syncStatus !== 'connected') return;
    try { await operation(); } catch (error) { console.warn('Firebase sync failed:', error); setSyncStatus('offline'); setSyncMessage('Demo data · offline'); }
  };

  const value = useMemo<WorkspaceContextValue>(() => ({
    jobs,
    candidates,
    syncStatus,
    syncMessage,
    getJob: (id) => jobs.find((job) => job.id === id),
    getCandidate: (id) => candidates.find((candidate) => candidate.id === id),
    saveJob: async (job) => { setJobs((items) => items.map((item) => item.id === job.id ? job : item)); await safeSync(() => persistJob(job)); },
    saveCandidate: async (candidate) => { setCandidates((items) => items.map((item) => item.id === candidate.id ? candidate : item)); await safeSync(() => persistCandidate(candidate)); },
    saveApplication: async (application) => {
      setCandidates((items) => items.map((candidate) => candidate.id === application.candidateId ? { ...candidate, applications: { ...candidate.applications, [application.jobId]: application } } : candidate));
      await safeSync(() => persistApplication(application));
    },
    addJob: async (job) => { setJobs((items) => [job, ...items]); await safeSync(() => persistJob(job)); },
    addCandidate: async (candidate) => { setCandidates((items) => [candidate, ...items]); await safeSync(() => persistCandidate(candidate)); },
    uploadCv: async (candidate, file) => {
      if (syncStatus !== 'connected') return;
      const cvUrl = await uploadCandidateFile(candidate.id, file);
      const next = { ...candidate, cvUrl, cvName: file.name };
      setCandidates((items) => items.map((item) => item.id === candidate.id ? next : item));
      await safeSync(() => persistCandidate(next));
    },
  }), [jobs, candidates, syncStatus, syncMessage]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return value;
}
