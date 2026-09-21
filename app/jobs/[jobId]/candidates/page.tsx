import { CandidatesPage } from '@/components/workspace/candidates-page';
import { demoJobs } from '@/lib/mock-data';

export function generateStaticParams() { return demoJobs.map((job) => ({ jobId: job.id })); }

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  return <CandidatesPage jobId={(await params).jobId} />;
}
