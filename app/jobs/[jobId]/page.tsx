import { JobOverviewPage } from '@/components/workspace/job-overview-page';
import { demoJobs } from '@/lib/mock-data';

export function generateStaticParams() { return demoJobs.map((job) => ({ jobId: job.id })); }

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  return <JobOverviewPage jobId={(await params).jobId} />;
}
