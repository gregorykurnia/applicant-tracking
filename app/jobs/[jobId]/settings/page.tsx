import { JobSettingsPage } from '@/components/workspace/job-settings-page';
import { demoJobs } from '@/lib/mock-data';

export function generateStaticParams() { return demoJobs.map((job) => ({ jobId: job.id })); }

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  return <JobSettingsPage jobId={(await params).jobId} />;
}
