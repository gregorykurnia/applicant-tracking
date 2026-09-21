'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/workspace/icons';
import { formatIdr, getJobCandidates, jobCounts, jobInitials } from '@/components/workspace/format';
import { JobFormModal } from '@/components/workspace/modals';
import { useWorkspace } from '@/components/workspace/workspace-provider';

export function JobsPage() {
  const { jobs, candidates } = useWorkspace();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const filtered = useMemo(() => jobs.filter((job) => `${job.title} ${job.department} ${job.location}`.toLowerCase().includes(query.toLowerCase()) && (status === 'all' || job.status === status)), [jobs, query, status]);
  return <div className="content"><div className="page-header"><div><p className="eyebrow">Workspace / hiring</p><h1>Jobs</h1><p className="page-description">Keep each opening focused, with its own candidate pipeline.</p></div><div className="header-actions"><button className="button button-primary" onClick={() => setShowForm(true)}><Icon name="plus" size={16} /> New job</button></div></div><div className="toolbar"><div className="search-wrap"><Icon name="search" size={16} /><input className="search-input" placeholder="Search jobs by title, team, or location" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className="select-input filter-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="Open">Open</option><option value="Paused">Paused</option><option value="Closed">Closed</option></select></div>{filtered.length ? <div className="job-grid">{filtered.map((job) => <JobCard key={job.id} job={job} candidateCount={getJobCandidates(candidates, job.id).length} counts={jobCounts(candidates, job)} />)}</div> : <div className="empty-state"><div><div className="empty-icon" style={{ margin: '0 auto 12px' }}><Icon name="briefcase" size={19} /></div><h3>No jobs found</h3><p>Try a different search or create a new job position.</p><button className="button button-secondary" onClick={() => setShowForm(true)}>Create a job</button></div></div>}{showForm && <JobFormModal onClose={() => setShowForm(false)} />}</div>;
}

function JobCard({ job, candidateCount, counts }: { job: import('@/types/ats').Job; candidateCount: number; counts: number[] }) { const total = Math.max(candidateCount, 1); return <Link className="job-card" href={`/jobs/${job.id}`}><div className="job-card-head"><span className="job-mark">{jobInitials(job.title)}</span><div><h3>{job.title}</h3><span className="muted">{job.department}</span></div><span className={`status-badge ${job.status === 'Open' ? 'status-open' : job.status === 'Paused' ? 'status-paused' : 'status-closed'}`}><i className="dot" />{job.status}</span></div><div className="job-card-details"><span className="job-card-detail"><Icon name="location" size={14} /> {job.location}</span><span className="job-card-detail"><Icon name="users" size={14} /> {candidateCount} candidates</span></div><div className="progress-label"><span>Pipeline progress</span><span>{counts[4]} hired</span></div><div className="progress-track">{counts.map((value, index) => <span className="progress-segment" key={index} style={{ width: `${Math.max(value / total * 100, value ? 5 : 0)}%`, background: ['#7888e2','#5fb194','#dfaa62','#9e80d4','#43a777','#d58e98'][index] }} />)}</div><div className="job-card-foot"><span>Hiring manager</span><strong>{job.manager}</strong></div></Link>; }
