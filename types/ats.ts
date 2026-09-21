export const PIPELINE_STAGES = ['New', 'Shortlist', 'Interview', 'User Interview', 'Hired', 'Rejected'] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export type JobStatus = 'Open' | 'Paused' | 'Closed';

export type Application = {
  candidateId: string;
  jobId: string;
  stage: string;
  source: string;
  added: string;
  needsReview: boolean;
  notes: string;
};

export type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  arrangement: string;
  type: string;
  manager: string;
  status: JobStatus;
  salary: [number, number];
  created: string;
  target: string;
  description: string;
};

export type Candidate = {
  id: string;
  name: string;
  initials: string;
  currentRole: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  summary: string;
  skills: string[];
  experience: number;
  desiredTitle: string;
  salary: number;
  availability: string;
  linkedin: string;
  portfolio: string;
  cvName: string;
  cvUrl?: string;
  education: string;
  certifications: string[];
  employment: { company: string; title: string; dates: string }[];
  applications: Record<string, Application>;
};

export type SyncStatus = 'connecting' | 'connected' | 'offline';
