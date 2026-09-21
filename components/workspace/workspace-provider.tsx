'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { deleteCandidate as deleteCandidateRecord, deleteJob as deleteJobRecord, loadWorkspace, persistApplication, persistCandidate, persistJob, uploadCandidateFile } from '@/lib/firestore';
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
  deleteJob: (jobId: string) => Promise<void>;
  deleteCandidate: (candidateId: string) => Promise<void>;
  addCandidate: (candidate: Candidate) => Promise<void>;
  addCandidates: (candidates: Candidate[]) => Promise<void>;
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
      setSyncMessage('Offline · changes are not saved');
    });
    return () => { mounted = false; };
  }, []);

  const sync = async <T,>(operation: () => Promise<T>) => {
    if (syncStatus !== 'connected') throw new Error('Workspace is not connected to Firebase yet. Please try again in a moment.');
    try {
      return await operation();
    } catch (error) {
      console.warn('Firebase sync failed:', error);
      setSyncStatus('offline');
      setSyncMessage('Sync failed · changes not saved');
      throw new Error('Firebase could not save this change. Check your connection and try again.');
    }
  };

  const value = useMemo<WorkspaceContextValue>(() => ({
    jobs,
    candidates,
    syncStatus,
    syncMessage,
    getJob: (id) => jobs.find((job) => job.id === id),
    getCandidate: (id) => candidates.find((candidate) => candidate.id === id),
    saveJob: async (job) => {
      await sync(() => persistJob(job));
      setJobs((items) => items.map((item) => item.id === job.id ? job : item));
    },
    saveCandidate: async (candidate) => {
      await sync(() => persistCandidate(candidate));
      setCandidates((items) => items.map((item) => item.id === candidate.id ? candidate : item));
    },
    saveApplication: async (application) => {
      await sync(() => persistApplication(application));
      setCandidates((items) => items.map((candidate) => candidate.id === application.candidateId ? { ...candidate, applications: { ...candidate.applications, [application.jobId]: application } } : candidate));
    },
    addJob: async (job) => {
      await sync(() => persistJob(job));
      setJobs((items) => [job, ...items.filter((item) => item.id !== job.id)]);
    },
    deleteJob: async (jobId) => {
      await sync(() => deleteJobRecord(jobId));
      setJobs((items) => items.filter((job) => job.id !== jobId));
      setCandidates((items) => items.map((candidate) => {
        if (!candidate.applications[jobId]) return candidate;
        const { [jobId]: _removed, ...applications } = candidate.applications;
        return { ...candidate, applications };
      }));
    },
    deleteCandidate: async (candidateId) => {
      await sync(() => deleteCandidateRecord(candidateId));
      setCandidates((items) => items.filter((candidate) => candidate.id !== candidateId));
    },
    addCandidate: async (candidate) => {
      await sync(() => persistCandidate(candidate));
      setCandidates((items) => [candidate, ...items.filter((item) => item.id !== candidate.id)]);
    },
    addCandidates: async (newCandidates) => {
      if (!newCandidates.length) return;
      await sync(() => Promise.all(newCandidates.map((candidate) => persistCandidate(candidate))).then(() => undefined));
      setCandidates((items) => {
        const incoming = new Map(newCandidates.map((candidate) => [candidate.id, candidate]));
        return [...incoming.values(), ...items.filter((candidate) => !incoming.has(candidate.id))];
      });
    },
    uploadCv: async (candidate, file) => {
      const cvUrl = await sync(() => uploadCandidateFile(candidate.id, file));
      const next = { ...candidate, cvUrl, cvName: file.name };
      await sync(() => persistCandidate(next));
      setCandidates((items) => [next, ...items.filter((item) => item.id !== candidate.id)]);
    },
  }), [jobs, candidates, syncStatus, syncMessage]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return value;
}
