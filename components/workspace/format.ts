import { Candidate, Job, PIPELINE_STAGES } from '@/types/ats';

export function formatIdr(amount: number) { return `Rp ${Number(amount || 0).toLocaleString('id-ID')}`; }
export function formatSalary(range: [number, number]) { return `${formatIdr(range[0])} – ${formatIdr(range[1])}`; }
export function stageClass(stage: string) { return stage.toLowerCase().replace(/\s+/g, '-'); }
export function initials(name: string) { return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(); }
export function jobInitials(title: string) { return title.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(); }
export function normalizePhone(phone = '') { return phone.replace(/\D/g, '').replace(/^0/, '62'); }
export function getApplication(candidate: Candidate, jobId: string) { return candidate.applications[jobId]; }
export function getJobCandidates(candidates: Candidate[], jobId: string) { return candidates.filter((candidate) => Boolean(getApplication(candidate, jobId))); }
export function countStage(candidates: Candidate[], jobId: string, stage: string) { return getJobCandidates(candidates, jobId).filter((candidate) => getApplication(candidate, jobId)?.stage === stageClass(stage)).length; }
export function jobCounts(candidates: Candidate[], job: Job) { return PIPELINE_STAGES.map((stage) => countStage(candidates, job.id, stage)); }
