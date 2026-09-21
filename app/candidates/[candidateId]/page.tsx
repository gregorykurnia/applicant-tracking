import { CandidateDetailPage } from '@/components/workspace/candidate-detail-page';
import { demoCandidates } from '@/lib/mock-data';

export function generateStaticParams() { return demoCandidates.map((candidate) => ({ candidateId: candidate.id })); }

export default async function Page({ params }: { params: Promise<{ candidateId: string }> }) {
  return <CandidateDetailPage candidateId={(await params).candidateId} />;
}
