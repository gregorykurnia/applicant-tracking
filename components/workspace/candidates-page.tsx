'use client';

import Link from 'next/link';
import { DragEvent, useMemo, useState } from 'react';
import { CandidateFormModal, UploadCvModal } from '@/components/workspace/modals';
import { Icon } from '@/components/workspace/icons';
import { getApplication, getJobCandidates, stageClass } from '@/components/workspace/format';
import { JobHeader } from '@/components/workspace/job-overview-page';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { PIPELINE_STAGES } from '@/types/ats';

export function CandidatesPage({ jobId, view = 'list' }: { jobId: string; view?: 'list' | 'board' }) {
  const { getJob, candidates, saveApplication } = useWorkspace();
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('all');
  const [location, setLocation] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const job = getJob(jobId);
  const filtered = useMemo(() => getJobCandidates(candidates, jobId).filter((candidate) => { const application = getApplication(candidate, jobId); const haystack = `${candidate.name} ${candidate.currentRole} ${candidate.location} ${candidate.skills.join(' ')}`.toLowerCase(); return (!query || haystack.includes(query.toLowerCase())) && (stage === 'all' || application?.stage === stage) && (location === 'all' || candidate.location === location); }), [candidates, jobId, query, stage, location]);
  if (!job) return <div className="content"><div className="empty-state"><div><h3>Job not found</h3><p>This job may have been removed or is still loading.</p></div></div></div>;
  const locations = [...new Set(getJobCandidates(candidates, jobId).map((candidate) => candidate.location))];
  return <div className="content"><JobHeader jobId={job.id} jobTitle={job.title} department={job.department} location={job.location} arrangement={job.arrangement} status={job.status} active={view === 'board' ? 'pipeline' : 'candidates'} /><div className="toolbar"><div className="search-wrap"><Icon name="search" size={16} /><input className="search-input" placeholder="Search candidates, roles, or skills" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="filter-row"><select className="select-input filter-select" value={stage} onChange={(event) => setStage(event.target.value)}><option value="all">All stages</option>{PIPELINE_STAGES.map((item) => <option value={stageClass(item)} key={item}>{item}</option>)}</select><select className="select-input filter-select" value={location} onChange={(event) => setLocation(event.target.value)}><option value="all">All locations</option>{locations.map((item) => <option value={item} key={item}>{item}</option>)}</select>{(query || stage !== 'all' || location !== 'all') && <button className="clear-filters" onClick={() => { setQuery(''); setStage('all'); setLocation('all'); }}>Clear filters</button>}</div><div className="view-switch"><Link className={`view-button ${view === 'list' ? 'active' : ''}`} href={`/jobs/${jobId}/candidates`}><Icon name="list" size={14} /> List</Link><Link className={`view-button ${view === 'board' ? 'active' : ''}`} href={`/jobs/${jobId}/pipeline`}><Icon name="columns" size={14} /> Board</Link></div><button className="button button-secondary" onClick={() => setShowAdd(true)}>Add candidate</button><button className="button button-primary" onClick={() => setShowUpload(true)}><Icon name="upload" size={16} /> Import CSV</button></div>{view === 'board' ? <Board candidates={filtered} jobId={jobId} saveApplication={saveApplication} /> : <section className="panel"><CandidateTable candidates={filtered} jobId={jobId} /></section>}{showAdd && <CandidateFormModal jobId={jobId} onClose={() => setShowAdd(false)} />}{showUpload && <UploadCvModal jobId={jobId} onClose={() => setShowUpload(false)} />}</div>;
}

function CandidateTable({ candidates, jobId }: { candidates: import('@/types/ats').Candidate[]; jobId: string }) { return candidates.length ? <div className="candidate-table-wrap"><table className="candidate-table"><thead><tr><th>Candidate</th><th>Current role</th><th>Location</th><th>Stage</th><th>Source</th><th>Added</th></tr></thead><tbody>{candidates.map((candidate) => { const application = getApplication(candidate, jobId)!; return <tr key={candidate.id}><td><Link className="candidate-cell" href={`/candidates/${candidate.id}`}><span className="candidate-avatar">{candidate.initials}</span><span><strong>{candidate.name}{application.needsReview && <span className="needs-review"><i />Needs review</span>}</strong><span>{candidate.email}</span></span></Link></td><td>{candidate.currentRole}</td><td>{candidate.location}</td><td><span className={`stage-badge stage-${stageClass(application.stage)}`}>{PIPELINE_STAGES.find((item) => stageClass(item) === application.stage) || application.stage}</span></td><td>{application.source}</td><td>{application.added.replace(', 2026', '')}</td></tr>; })}</tbody></table></div> : <div className="empty-state"><div><div className="empty-icon" style={{ margin: '0 auto 12px' }}><Icon name="users" size={19} /></div><h3>No candidates match these filters</h3><p>Try clearing a filter or add a new candidate to this job.</p></div></div>; }

function Board({ candidates, jobId, saveApplication }: { candidates: import('@/types/ats').Candidate[]; jobId: string; saveApplication: (application: import('@/types/ats').Application) => Promise<void> }) {
  const [dragStage, setDragStage] = useState<string | null>(null);
  const [error, setError] = useState('');
  async function onDrop(event: DragEvent<HTMLElement>, nextStage: string) {
    event.preventDefault();
    const candidateId = event.dataTransfer.getData('candidateId');
    const candidate = candidates.find((item) => item.id === candidateId);
    const application = candidate?.applications[jobId];
    setDragStage(null);
    if (!application) return;
    setError('');
    try {
      await saveApplication({ ...application, stage: nextStage });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Stage could not be saved.');
    }
  }
  return <><div className="board-error">{error && <p className="form-error" role="alert">{error}</p>}</div><div className="board">{PIPELINE_STAGES.map((stage) => { const key = stageClass(stage); const items = candidates.filter((candidate) => candidate.applications[jobId]?.stage === key); return <section className={`stage-column ${dragStage === key ? 'drag-target' : ''}`} key={stage} onDragOver={(event) => { event.preventDefault(); setDragStage(key); }} onDragLeave={() => setDragStage(null)} onDrop={(event) => { void onDrop(event, key); }}><div className="stage-heading"><h3>{stage}</h3><span className="stage-count">{items.length}</span></div><div className="stage-cards">{items.length ? items.map((candidate) => <article className="candidate-card" draggable key={candidate.id} onDragStart={(event) => event.dataTransfer.setData('candidateId', candidate.id)}><div className="card-top"><span className="candidate-avatar">{candidate.initials}</span><div><Link href={`/candidates/${candidate.id}`}><strong>{candidate.name}</strong></Link><span className="role">{candidate.currentRole}</span></div><span className="card-menu"><Icon name="more" size={15} /></span></div><div className="card-tags">{candidate.skills.slice(0, 2).map((skill) => <span className="tag" key={skill}>{skill}</span>)}{candidate.applications[jobId]?.needsReview && <span className="tag tag-review">Review</span>}</div><div className="card-foot"><span>{candidate.location}</span><span>{candidate.applications[jobId]?.added.replace(', 2026', '')}</span></div></article>) : <div style={{ color: 'var(--subtle)', fontSize: 12, textAlign: 'center', padding: '28px 7px' }}>Drop candidates here</div>}</div></section>; })}</div></>;
}
