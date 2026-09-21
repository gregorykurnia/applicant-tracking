import { signInAnonymously } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { demoCandidates, demoJobs } from '@/lib/mock-data';
import { Application, Candidate, Job } from '@/types/ats';

export type WorkspaceSnapshot = { jobs: Job[]; candidates: Candidate[]; seeded: boolean };

function cleanRecord<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cleanRecord) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as object).filter(([, item]) => item !== undefined).map(([key, item]) => [key, cleanRecord(item)])) as T;
  return value;
}

export async function persistJob(job: Job) {
  await setDoc(doc(db, 'jobs', job.id), cleanRecord(job), { merge: true });
}

export async function deleteJob(jobId: string) {
  const applications = await getDocs(query(collection(db, 'applications'), where('jobId', '==', jobId)));
  await Promise.all([
    deleteDoc(doc(db, 'jobs', jobId)),
    ...applications.docs.map((application) => deleteDoc(application.ref)),
  ]);
}

export async function persistApplication(application: Application) {
  await setDoc(doc(db, 'applications', `${application.candidateId}__${application.jobId}`), cleanRecord(application), { merge: true });
}

export async function persistCandidate(candidate: Candidate) {
  const { applications, ...profile } = candidate;
  await setDoc(doc(db, 'candidates', candidate.id), cleanRecord(profile), { merge: true });
  await Promise.all(Object.values(applications).map(persistApplication));
}

export async function uploadCandidateFile(candidateId: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const snapshot = await uploadBytes(ref(storage, `cvs/${candidateId}/${safeName}`), file);
  return getDownloadURL(snapshot.ref);
}

async function seedWorkspace() {
  await Promise.all([
    ...demoJobs.map((job) => persistJob(job)),
    ...demoCandidates.map((candidate) => persistCandidate(candidate)),
  ]);
  return { jobs: demoJobs, candidates: demoCandidates, seeded: true } satisfies WorkspaceSnapshot;
}

export async function loadWorkspace(): Promise<WorkspaceSnapshot> {
  await signInAnonymously(auth);
  const [jobSnapshot, candidateSnapshot, applicationSnapshot] = await Promise.all([
    getDocs(collection(db, 'jobs')),
    getDocs(collection(db, 'candidates')),
    getDocs(collection(db, 'applications')),
  ]);

  if (jobSnapshot.empty && candidateSnapshot.empty) return seedWorkspace();

  const jobs = jobSnapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Job));
  const candidates = candidateSnapshot.docs.map((item) => ({ id: item.id, applications: {}, ...item.data() } as Candidate));
  applicationSnapshot.docs.forEach((item) => {
    const application = item.data() as Application;
    const candidate = candidates.find((entry) => entry.id === application.candidateId);
    if (candidate && application.jobId) candidate.applications[application.jobId] = application;
  });
  return { jobs, candidates, seeded: false };
}
