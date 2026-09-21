'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CandidateEditModal, NoteModal } from '@/components/workspace/modals';
import { Icon } from '@/components/workspace/icons';
import { normalizePhone, stageClass } from '@/components/workspace/format';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { PIPELINE_STAGES } from '@/types/ats';

export function CandidateDetailPage({ candidateId }: { candidateId: string }) {
  const { getCandidate, getJob, saveApplication } = useWorkspace();
  const candidate = getCandidate(candidateId);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [editing, setEditing] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  if (!candidate) {
    return <div className="content"><div className="empty-state"><div><h3>Candidate not found</h3><p>This candidate may be loading or may have been removed.</p><Link className="button button-secondary" href="/jobs">Back to jobs</Link></div></div></div>;
  }

  const activeJobId = candidate.applications[selectedJobId] ? selectedJobId : Object.keys(candidate.applications)[0];
  const application = candidate.applications[activeJobId];
  const job = getJob(activeJobId);

  return <div className="content">
    <div className="page-header">
      <div><p className="eyebrow">Candidate profile</p><h1>{candidate.name}</h1><p className="page-description">{candidate.currentRole} · {candidate.location}</p></div>
      <div className="header-actions"><Link className="button button-secondary" href={`/jobs/${activeJobId}/candidates`}>Back to candidates</Link><button className="button button-primary" onClick={() => setEditing(true)}>Edit profile</button></div>
    </div>
    <div className="grid-two">
      <section className="panel">
        <div className="drawer-header">
          <div className="drawer-identity" style={{ paddingTop: 0 }}><span className="candidate-avatar" style={{ width: 51, height: 51, fontSize: 15 }}>{candidate.initials}</span><div><h2>{candidate.name}</h2><p>{candidate.currentRole} · {candidate.location}</p></div></div>
          <div className="drawer-contact"><a className="contact-chip" href={`mailto:${candidate.email}`}><Icon name="mail" size={14} /> Email</a><a className="contact-chip" href={`https://wa.me/${normalizePhone(candidate.whatsapp || candidate.phone)}`} target="_blank" rel="noopener"><Icon name="phone" size={14} /> Open WhatsApp</a><button className="contact-chip" onClick={() => navigator.clipboard?.writeText(candidate.phone)}><Icon name="copy" size={14} /> Copy number</button></div>
        </div>
        <div className="drawer-body">
          <section className="drawer-section"><h3>Application</h3><div className="drawer-grid"><div><span className="detail-label">Job</span><select className="select-input" value={activeJobId} onChange={(event) => setSelectedJobId(event.target.value)}>{Object.keys(candidate.applications).map((id) => <option value={id} key={id}>{getJob(id)?.title || id}</option>)}</select></div><div><span className="detail-label">Stage</span><select className="select-input" value={application?.stage || 'new'} onChange={(event) => { if (application) saveApplication({ ...application, stage: event.target.value }); }}>{PIPELINE_STAGES.map((stage) => <option value={stageClass(stage)} key={stage}>{stage}</option>)}</select></div><Detail label="Source" value={application?.source || 'Manual'} /><Detail label="Added" value={application?.added || 'Today'} /></div></section>
          <section className="drawer-section"><h3>Profile</h3><div className="drawer-grid"><Detail label="Email" value={candidate.email} /><Detail label="Phone" value={candidate.phone || 'Needs review'} /><Detail label="Experience" value={`${candidate.experience || '—'} years`} /><Detail label="Expected salary" value={candidate.salary ? `Rp ${candidate.salary.toLocaleString('id-ID')} / month` : 'Needs review'} /><Detail label="Availability" value={candidate.availability || 'Needs review'} /><Detail label="Desired role" value={candidate.desiredTitle || 'Needs review'} /></div></section>
          <section className="drawer-section"><h3>Summary</h3><p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>{candidate.summary || 'No professional summary yet.'}</p></section>
          <section className="drawer-section"><h3>Skills</h3><div className="skill-list">{candidate.skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div></section>
          <section className="drawer-section"><h3>Employment history</h3>{candidate.employment.map((item) => <div className="employment-item" key={`${item.company}-${item.title}`}><strong>{item.title}</strong><span>{item.company} · {item.dates}</span></div>)}</section>
          <section className="drawer-section"><h3>Associated jobs</h3><div className="skill-list">{Object.keys(candidate.applications).map((id) => <Link className="tag" href={`/jobs/${id}/candidates`} key={id}>{getJob(id)?.title || id}</Link>)}</div></section>
          <section className="drawer-section"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><h3 style={{ margin: 0 }}>Recruiter notes</h3><button className="button button-ghost" onClick={() => setNoteOpen(true)}><Icon name="plus" size={14} /> Add note</button></div>{application?.notes ? <div className="note-box" style={{ marginTop: 12 }}>{application.notes}</div> : <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>No notes for this job yet.</p>}</section>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>{candidate.cvUrl ? <a className="button button-secondary" href={candidate.cvUrl} target="_blank" rel="noopener"><Icon name="file" size={15} /> {candidate.cvName || 'View original CV'}</a> : <button className="button button-secondary" onClick={() => window.alert('The original CV will appear here after Storage is connected.')}><Icon name="file" size={15} /> {candidate.cvName || 'View original CV'}</button>}{candidate.linkedin && <a className="button button-ghost" href={`https://${candidate.linkedin}`} target="_blank" rel="noopener"><Icon name="external" size={15} /> LinkedIn</a>}</div>
        </div>
      </section>
      <section className="panel"><div className="panel-header"><h2>Activity</h2></div><div className="activity-list"><div className="activity-row"><span className="activity-avatar">{candidate.initials}</span><div className="activity-copy"><strong>{candidate.name}</strong> added to {job?.title || 'this job'}<p>{application?.added || 'Today'}</p></div></div><div className="activity-row"><span className="activity-avatar">MC</span><div className="activity-copy"><strong>Maya Chen</strong> owns this profile<p>Canonical candidate record</p></div></div></div></section>
    </div>
    {editing && <CandidateEditModal candidate={candidate} onClose={() => setEditing(false)} />}
    {noteOpen && <NoteModal candidate={candidate} jobId={activeJobId} onClose={() => setNoteOpen(false)} />}
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><span className="detail-label">{label}</span><span className="detail-value">{value}</span></div>; }
