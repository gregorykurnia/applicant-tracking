'use client';

import { FormEvent, useState } from 'react';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { Icon } from '@/components/workspace/icons';
import { initials, normalizePhone } from '@/components/workspace/format';
import { Candidate, Job } from '@/types/ats';

function Modal({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className="modal-backdrop"><section className={`modal ${wide ? 'large' : ''}`} role="dialog" aria-modal="true">{children}</section></div>;
}

export function JobFormModal({ job, onClose }: { job?: Job; onClose: () => void }) {
  const { addJob, saveJob } = useWorkspace();
  const [form, setForm] = useState({ title: job?.title || '', department: job?.department || '', location: job?.location || '', arrangement: job?.arrangement || 'Hybrid', type: job?.type || 'Full-time', manager: job?.manager || 'Maya Chen', description: job?.description || '', minSalary: String(job?.salary?.[0] || ''), maxSalary: String(job?.salary?.[1] || '') });
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;
    const next: Job = { id: job?.id || `job-${Date.now()}`, title: form.title.trim(), department: form.department || 'General', location: form.location || 'Needs review', arrangement: form.arrangement, type: form.type, manager: form.manager || 'Maya Chen', status: job?.status || 'Open', salary: [Number(form.minSalary) || 0, Number(form.maxSalary) || 0], created: job?.created || 'Sep 18, 2026', target: job?.target || '—', description: form.description || 'A new opportunity at Harbor Works.' };
    if (job) await saveJob(next); else await addJob(next);
    onClose();
  }
  return <Modal wide><form onSubmit={submit}><div className="modal-header"><div><h2>{job ? 'Edit job' : 'Create a new job'}</h2><p>Give your team a clear workspace for this opening.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><div className="field-grid">{[['title','Job title','e.g. Senior Product Designer'],['department','Department','Product & Design'],['location','Location','Jakarta'],['manager','Hiring manager','Name']].map(([key,label,placeholder]) => <div className="field" key={key}><label htmlFor={`job-${key}`}>{label}</label><input required={key === 'title'} className="text-input" id={`job-${key}`} value={form[key as keyof typeof form]} placeholder={placeholder} onChange={(event) => update(key, event.target.value)} /></div>)}<div className="field"><label htmlFor="job-arrangement">Work arrangement</label><select className="select-input" id="job-arrangement" value={form.arrangement} onChange={(event) => update('arrangement', event.target.value)}><option>Hybrid</option><option>Remote</option><option>On-site</option></select></div><div className="field"><label htmlFor="job-type">Employment type</label><select className="select-input" id="job-type" value={form.type} onChange={(event) => update('type', event.target.value)}><option>Full-time</option><option>Part-time</option><option>Contract</option></select></div></div><div className="field" style={{ marginTop: 14 }}><label htmlFor="job-description">Job description</label><textarea className="textarea-input" id="job-description" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="What will this person help the team do?" /></div><div className="field-grid" style={{ marginTop: 14 }}><div className="field"><label htmlFor="min-salary">Minimum salary / month</label><input type="number" className="text-input" id="min-salary" value={form.minSalary} onChange={(event) => update('minSalary', event.target.value)} /></div><div className="field"><label htmlFor="max-salary">Maximum salary / month</label><input type="number" className="text-input" id="max-salary" value={form.maxSalary} onChange={(event) => update('maxSalary', event.target.value)} /></div></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">{job ? 'Save changes' : 'Create job'}</button></div></form></Modal>;
}

export function CandidateFormModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { addCandidate, candidates, getJob } = useWorkspace();
  const [form, setForm] = useState({ name: '', currentRole: '', email: '', phone: '', location: '', salary: '', summary: '', skills: '' });
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    const duplicate = candidates.find((candidate) => candidate.email.toLowerCase() === form.email.toLowerCase() || (form.phone && normalizePhone(candidate.phone) === normalizePhone(form.phone)));
    if (duplicate) {
      const application = duplicate.applications[jobId] || { candidateId: duplicate.id, jobId, stage: 'new', source: 'Manual', added: 'Sep 18, 2026', needsReview: true, notes: '' };
      await addCandidate({ ...duplicate, applications: { ...duplicate.applications, [jobId]: application } });
      onClose();
      return;
    }
    const name = form.name.trim();
    const candidate: Candidate = { id: `candidate-${Date.now()}`, name, initials: initials(name), currentRole: form.currentRole || 'Not specified', location: form.location || 'Needs review', email: form.email, phone: form.phone || 'Needs review', whatsapp: normalizePhone(form.phone), summary: form.summary, skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean), experience: 0, desiredTitle: getJob(jobId)?.title || '', salary: Number(form.salary) || 0, availability: 'Needs review', linkedin: '', portfolio: '', cvName: '', education: '', certifications: [], employment: [], applications: { [jobId]: { candidateId: `candidate-${Date.now()}`, jobId, stage: 'new', source: 'Manual', added: 'Sep 18, 2026', needsReview: true, notes: '' } } };
    candidate.applications[jobId].candidateId = candidate.id;
    await addCandidate(candidate);
    onClose();
  }
  return <Modal wide><form onSubmit={submit}><div className="modal-header"><div><h2>Add a candidate</h2><p>Add a candidate directly to {getJob(jobId)?.title || 'this job'}.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><div className="field-grid">{[['name','Full name','e.g. Rina Pratama','text'],['currentRole','Current job title','e.g. Product Designer','text'],['email','Email address','name@email.com','email'],['phone','Phone / WhatsApp','+62 812 0000 0000','text'],['location','Current location','Jakarta','text'],['salary','Expected salary / month','18000000','number']].map(([key,label,placeholder,type]) => <div className="field" key={key}><label htmlFor={`candidate-${key}`}>{label}</label><input required={key === 'name' || key === 'email'} type={type} className="text-input" id={`candidate-${key}`} value={form[key as keyof typeof form]} placeholder={placeholder} onChange={(event) => update(key, event.target.value)} /></div>)}</div><div className="field" style={{ marginTop: 14 }}><label htmlFor="candidate-summary">Professional summary</label><textarea className="textarea-input" id="candidate-summary" value={form.summary} onChange={(event) => update('summary', event.target.value)} /></div><div className="field" style={{ marginTop: 14 }}><label htmlFor="candidate-skills">Skills <span style={{ color: 'var(--subtle)', fontWeight: 500 }}>(comma separated)</span></label><input className="text-input" id="candidate-skills" value={form.skills} onChange={(event) => update('skills', event.target.value)} placeholder="Product design, Figma, Research" /></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">Add candidate</button></div></form></Modal>;
}

export function UploadCvModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { addCandidate, candidates, getJob, uploadCv } = useWorkspace();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'review'>('idle');
  function pick(next: File | undefined) { if (!next || !/\.(pdf|docx)$/i.test(next.name)) return; setFile(next); setStatus('parsing'); window.setTimeout(() => setStatus('review'), 900); }
  async function save() {
    if (!file) return;
    const candidate: Candidate = { id: `candidate-${Date.now()}`, name: 'Rina Pratama', initials: 'RP', currentRole: 'Product Designer', location: 'Jakarta', email: 'rina.pratama@email.com', phone: '+62 813 9910 4421', whatsapp: '6281399104421', summary: 'Product designer with experience simplifying complex workflows into approachable product experiences.', skills: ['Product design', 'Figma', 'Design systems'], experience: 4, desiredTitle: getJob(jobId)?.title || '', salary: 20000000, availability: '30 days', linkedin: '', portfolio: '', cvName: file.name, education: 'B.A. Visual Communication Design', certifications: [], employment: [], applications: { [jobId]: { candidateId: `candidate-${Date.now()}`, jobId, stage: 'new', source: 'CV upload', added: 'Sep 18, 2026', needsReview: true, notes: '' } } };
    candidate.applications[jobId].candidateId = candidate.id;
    const duplicate = candidates.find((item) => item.email === candidate.email || normalizePhone(item.phone) === normalizePhone(candidate.phone));
    if (duplicate) { await addCandidate({ ...duplicate, applications: { ...duplicate.applications, [jobId]: candidate.applications[jobId] } }); onClose(); return; }
    await addCandidate(candidate);
    try { await uploadCv(candidate, file); } catch (error) { console.warn('CV upload failed:', error); }
    onClose();
  }
  if (status === 'parsing') return <Modal><div className="modal-header"><div><h2>Reading your CV</h2><p>We’re extracting the details into an editable profile.</p></div></div><div className="modal-body"><div className="parsing-state"><div className="spinner" /><strong>Parsing {file?.name}</strong><span style={{ color: 'var(--muted)', fontSize: 13, marginTop: 5 }}>This usually takes a few seconds.</span><div className="progress-bar"><span /></div></div></div></Modal>;
  if (status === 'review') return <Modal><div className="modal-header"><div><h2>Review extracted profile</h2><p>Check the details before adding this candidate to {getJob(jobId)?.title}.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><div className="review-summary"><strong>Rina Pratama</strong><span>Product Designer · Jakarta · rina.pratama@email.com</span><div className="review-flags"><span className="tag">Product design</span><span className="tag">Figma</span><span className="tag tag-review">Needs review · WhatsApp</span></div></div><p style={{ color: 'var(--muted)', fontSize: 12, margin: '15px 0 0' }}>All extracted fields will stay editable from the candidate profile.</p></div><div className="modal-footer"><button className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" onClick={save}>Add candidate</button></div></Modal>;
  return <Modal><div className="modal-header"><div><h2>Upload a CV</h2><p>Add a candidate to {getJob(jobId)?.title || 'a job'} and review the extracted profile.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><div className="drop-zone"><Icon name="upload" size={26} /><div><h3>Drop a PDF or DOCX here</h3><p>or choose a file from your computer</p><label className="button button-secondary" htmlFor="cv-file">Choose file</label><input className="file-input" id="cv-file" type="file" accept=".pdf,.docx" onChange={(event) => pick(event.target.files?.[0])} /><small>Maximum file size 10 MB</small></div></div></div><div className="modal-footer"><button className="button button-secondary" onClick={onClose}>Cancel</button></div></Modal>;
}

export function CandidateEditModal({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  const { saveCandidate } = useWorkspace();
  const [form, setForm] = useState({ name: candidate.name, currentRole: candidate.currentRole, email: candidate.email, phone: candidate.phone, location: candidate.location, salary: String(candidate.salary || ''), summary: candidate.summary, skills: candidate.skills.join(', ') });
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) { event.preventDefault(); await saveCandidate({ ...candidate, name: form.name, initials: initials(form.name), currentRole: form.currentRole, email: form.email, phone: form.phone, whatsapp: normalizePhone(form.phone), location: form.location, salary: Number(form.salary) || 0, summary: form.summary, skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean) }); onClose(); }
  return <Modal wide><form onSubmit={submit}><div className="modal-header"><div><h2>Edit candidate profile</h2><p>Keep the canonical profile up to date across every job.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><div className="field-grid">{[['name','Full name','text'],['currentRole','Current job title','text'],['email','Email address','email'],['phone','Phone / WhatsApp','text'],['location','Current location','text'],['salary','Expected salary / month','number']].map(([key,label,type]) => <div className="field" key={key}><label htmlFor={`edit-${key}`}>{label}</label><input className="text-input" id={`edit-${key}`} type={type} value={form[key as keyof typeof form]} onChange={(event) => update(key, event.target.value)} /></div>)}</div><div className="field" style={{ marginTop: 14 }}><label htmlFor="edit-summary">Professional summary</label><textarea className="textarea-input" id="edit-summary" value={form.summary} onChange={(event) => update('summary', event.target.value)} /></div><div className="field" style={{ marginTop: 14 }}><label htmlFor="edit-skills">Skills</label><input className="text-input" id="edit-skills" value={form.skills} onChange={(event) => update('skills', event.target.value)} /></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">Save changes</button></div></form></Modal>;
}

export function NoteModal({ candidate, jobId, onClose }: { candidate: Candidate; jobId: string; onClose: () => void }) {
  const { saveApplication } = useWorkspace();
  const application = candidate.applications[jobId];
  const [note, setNote] = useState(application?.notes || '');
  async function submit(event: FormEvent) { event.preventDefault(); if (application) await saveApplication({ ...application, notes: note }); onClose(); }
  return <Modal><form onSubmit={submit}><div className="modal-header"><div><h2>Add a job note</h2><p>This note is only visible on this application.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><div className="field"><label htmlFor="candidate-note">Note for {candidate.name}</label><textarea required className="textarea-input" id="candidate-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context for your hiring team" /></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">Save note</button></div></form></Modal>;
}
