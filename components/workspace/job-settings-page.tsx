'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobFormModal } from '@/components/workspace/modals';
import { JobHeader } from '@/components/workspace/job-overview-page';
import { useWorkspace } from '@/components/workspace/workspace-provider';

export function JobSettingsPage({ jobId }: { jobId: string }) {
  const { getJob, deleteJob } = useWorkspace();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const job = getJob(jobId);
  if (!job) return <div className="content"><div className="empty-state"><div><h3>Job not found</h3><p>This job may have been removed or is still loading.</p></div></div></div>;
  async function confirmDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteJob(jobId);
      router.push('/jobs');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Job could not be deleted.');
      setDeleting(false);
    }
  }
  return <div className="content"><JobHeader jobId={job.id} jobTitle={job.title} department={job.department} location={job.location} arrangement={job.arrangement} status={job.status} active="settings" />{deleteError && <p className="form-error" role="alert">{deleteError}</p>}<section className="panel"><div className="settings-panel"><div className="page-header" style={{ marginBottom: 22 }}><div><h2>Job settings</h2><p className="settings-intro" style={{ margin: 0 }}>Update the details recruiters see when working on this role.</p></div><button className="button button-primary" onClick={() => setEditing(true)}>Edit job</button></div><div className="settings-form"><div className="field-grid"><Detail label="Department" value={job.department} /><Detail label="Hiring manager" value={job.manager} /><Detail label="Work arrangement" value={job.arrangement} /><Detail label="Employment type" value={job.type} /></div><div className="settings-divider" /><div className="field"><span className="detail-label">Job description</span><div className="note-box" style={{ background: '#fafbff', borderColor: 'var(--line)', color: 'var(--muted)' }}>{job.description}</div></div></div><div className="settings-divider" /><div className="danger-zone"><div><h3>Delete this job</h3><p>Remove this job and its candidate applications. Candidate profiles will stay in your workspace.</p></div>{confirmingDelete ? <div className="danger-confirm"><span>Delete “{job.title}” permanently?</span><div className="header-actions"><button className="button button-secondary" onClick={() => setConfirmingDelete(false)} disabled={deleting}>Cancel</button><button className="button button-danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete permanently'}</button></div></div> : <button className="button button-danger" onClick={() => setConfirmingDelete(true)}>Delete job</button>}</div></div></section>{editing && <JobFormModal job={job} onClose={() => setEditing(false)} />}</div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><span className="detail-label">{label}</span><span className="detail-value">{value}</span></div>; }
