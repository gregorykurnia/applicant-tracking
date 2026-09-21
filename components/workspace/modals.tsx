'use client';

import { FormEvent, useState } from 'react';
import { useWorkspace } from '@/components/workspace/workspace-provider';
import { Icon } from '@/components/workspace/icons';
import { initials, normalizePhone } from '@/components/workspace/format';
import { parseCandidateCsv, ParsedCandidate } from '@/lib/csv';
import { Candidate, Job } from '@/types/ats';

function Modal({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className="modal-backdrop"><section className={`modal ${wide ? 'large' : ''}`} role="dialog" aria-modal="true">{children}</section></div>;
}

function FormError({ message }: { message: string }) {
  return message ? <p className="form-error" role="alert">{message}</p> : null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function sameCandidate(left: Candidate, right: Candidate) {
  const leftEmail = left.email.trim().toLowerCase();
  const rightEmail = right.email.trim().toLowerCase();
  const leftPhone = normalizePhone(left.phone);
  const rightPhone = normalizePhone(right.phone);
  return Boolean((leftEmail && rightEmail && leftEmail === rightEmail) || (leftPhone && rightPhone && leftPhone === rightPhone));
}

export function JobFormModal({ job, onClose }: { job?: Job; onClose: () => void }) {
  const { addJob, saveJob } = useWorkspace();
  const [form, setForm] = useState({ title: job?.title || '', department: job?.department || '', location: job?.location || '', arrangement: job?.arrangement || 'Hybrid', type: job?.type || 'Full-time', manager: job?.manager || 'Maya Chen', description: job?.description || '', minSalary: String(job?.salary?.[0] || ''), maxSalary: String(job?.salary?.[1] || '') });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setError('');
    setSaving(true);
    const next: Job = { id: job?.id || `job-${Date.now()}`, title: form.title.trim(), department: form.department || 'General', location: form.location || 'Needs review', arrangement: form.arrangement, type: form.type, manager: form.manager || 'Maya Chen', status: job?.status || 'Open', salary: [Number(form.minSalary) || 0, Number(form.maxSalary) || 0], created: job?.created || 'Sep 18, 2026', target: job?.target || '—', description: form.description || 'A new opportunity at Harbor Works.' };
    try {
      if (job) await saveJob(next); else await addJob(next);
      onClose();
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }
  return <Modal wide><form onSubmit={submit}><div className="modal-header"><div><h2>{job ? 'Edit job' : 'Create a new job'}</h2><p>Give your team a clear workspace for this opening.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><FormError message={error} /><div className="field-grid">{[['title','Job title','e.g. Senior Product Designer'],['department','Department','Product & Design'],['location','Location','Jakarta'],['manager','Hiring manager','Name']].map(([key,label,placeholder]) => <div className="field" key={key}><label htmlFor={`job-${key}`}>{label}</label><input required={key === 'title'} className="text-input" id={`job-${key}`} value={form[key as keyof typeof form]} placeholder={placeholder} onChange={(event) => update(key, event.target.value)} /></div>)}<div className="field"><label htmlFor="job-arrangement">Work arrangement</label><select className="select-input" id="job-arrangement" value={form.arrangement} onChange={(event) => update('arrangement', event.target.value)}><option>Hybrid</option><option>Remote</option><option>On-site</option></select></div><div className="field"><label htmlFor="job-type">Employment type</label><select className="select-input" id="job-type" value={form.type} onChange={(event) => update('type', event.target.value)}><option>Full-time</option><option>Part-time</option><option>Contract</option></select></div></div><div className="field" style={{ marginTop: 14 }}><label htmlFor="job-description">Job description</label><textarea className="textarea-input" id="job-description" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="What will this person help the team do?" /></div><div className="field-grid" style={{ marginTop: 14 }}><div className="field"><label htmlFor="min-salary">Minimum salary / month</label><input type="number" className="text-input" id="min-salary" value={form.minSalary} onChange={(event) => update('minSalary', event.target.value)} /></div><div className="field"><label htmlFor="max-salary">Maximum salary / month</label><input type="number" className="text-input" id="max-salary" value={form.maxSalary} onChange={(event) => update('maxSalary', event.target.value)} /></div></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : job ? 'Save changes' : 'Create a job'}</button></div></form></Modal>;
}

export function CandidateFormModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { addCandidate, candidates, getJob } = useWorkspace();
  const [form, setForm] = useState({ name: '', currentRole: '', email: '', phone: '', location: '', salary: '', summary: '', skills: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const email = form.email.trim().toLowerCase();
      const phone = normalizePhone(form.phone);
      const duplicate = candidates.find((candidate) => (email && candidate.email.trim().toLowerCase() === email) || (phone && normalizePhone(candidate.phone) === phone));
      if (duplicate) {
        const application = duplicate.applications[jobId] || { candidateId: duplicate.id, jobId, stage: 'new', source: 'Manual', added: 'Sep 18, 2026', needsReview: true, notes: '' };
        await addCandidate({ ...duplicate, applications: { ...duplicate.applications, [jobId]: application } });
        onClose();
        return;
      }
      const name = form.name.trim();
      const id = `candidate-${Date.now()}`;
      const candidate: Candidate = { id, name, initials: initials(name), currentRole: form.currentRole || 'Not specified', location: form.location || 'Needs review', email: form.email.trim(), phone: form.phone || 'Needs review', whatsapp: normalizePhone(form.phone), summary: form.summary, skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean), experience: 0, desiredTitle: getJob(jobId)?.title || '', salary: Number(form.salary) || 0, availability: 'Needs review', linkedin: '', portfolio: '', cvName: '', education: '', certifications: [], employment: [], applications: { [jobId]: { candidateId: id, jobId, stage: 'new', source: 'Manual', added: 'Sep 18, 2026', needsReview: true, notes: '' } } };
      await addCandidate(candidate);
      onClose();
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }
  return <Modal wide><form onSubmit={submit}><div className="modal-header"><div><h2>Add a candidate</h2><p>Add a candidate directly to {getJob(jobId)?.title || 'this job'}.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><FormError message={error} /><div className="field-grid">{[['name','Full name','e.g. Rina Pratama','text'],['currentRole','Current job title','e.g. Product Designer','text'],['email','Email address','name@email.com','email'],['phone','Phone / WhatsApp','+62 812 0000 0000','text'],['location','Current location','Jakarta','text'],['salary','Expected salary / month','18000000','number']].map(([key,label,placeholder,type]) => <div className="field" key={key}><label htmlFor={`candidate-${key}`}>{label}</label><input required={key === 'name' || key === 'email'} type={type} className="text-input" id={`candidate-${key}`} value={form[key as keyof typeof form]} placeholder={placeholder} onChange={(event) => update(key, event.target.value)} /></div>)}</div><div className="field" style={{ marginTop: 14 }}><label htmlFor="candidate-summary">Professional summary</label><textarea className="textarea-input" id="candidate-summary" value={form.summary} onChange={(event) => update('summary', event.target.value)} /></div><div className="field" style={{ marginTop: 14 }}><label htmlFor="candidate-skills">Skills <span style={{ color: 'var(--subtle)', fontWeight: 500 }}>(comma separated)</span></label><input className="text-input" id="candidate-skills" value={form.skills} onChange={(event) => update('skills', event.target.value)} placeholder="Product design, Figma, Research" /></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add candidate'}</button></div></form></Modal>;
}

type UploadStatus = 'idle' | 'parsing' | 'review' | 'saving' | 'error';

export function UploadCvModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { addCandidates, candidates, getJob } = useWorkspace();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [parsedRows, setParsedRows] = useState<ParsedCandidate[]>([]);
  const [skippedRows, setSkippedRows] = useState(0);
  const [parseNotes, setParseNotes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  async function pick(next: File | undefined) {
    if (!next) return;
    setFile(next);
    setError('');
    setParseNotes([]);
    setParsedRows([]);
    if (next.size > 10 * 1024 * 1024) {
      setStatus('error');
      setError('This CSV is larger than the 10 MB limit.');
      return;
    }
    if (!/\.csv$/i.test(next.name)) {
      setStatus('error');
      setError('This importer accepts CSV files. CSV is structured data, so it is parsed directly instead of pretending to OCR it.');
      return;
    }
    setStatus('parsing');
    try {
      const result = parseCandidateCsv(await next.text(), jobId, getJob(jobId)?.title || '');
      setParsedRows(result.rows);
      setSkippedRows(result.skippedRows);
      setParseNotes(result.errors);
      setStatus('review');
    } catch (parseError) {
      setStatus('error');
      setError(errorMessage(parseError));
    }
  }

  function pendingCandidates() {
    const pending = new Map<string, Candidate>();
    parsedRows.forEach(({ candidate }) => {
      const existing = [...pending.values(), ...candidates].find((item) => sameCandidate(item, candidate));
      if (!existing) {
        pending.set(candidate.id, candidate);
        return;
      }
      const application = existing.applications[jobId] || { ...candidate.applications[jobId], candidateId: existing.id };
      pending.set(existing.id, { ...existing, applications: { ...existing.applications, [jobId]: application } });
    });
    return [...pending.values()];
  }

  async function save() {
    const nextCandidates = pendingCandidates();
    if (!nextCandidates.length) return;
    setStatus('saving');
    setError('');
    try {
      await addCandidates(nextCandidates);
      onClose();
    } catch (saveError) {
      setStatus('review');
      setError(errorMessage(saveError));
    }
  }

  if (status === 'parsing') return <Modal><div className="modal-header"><div><h2>Reading CSV</h2><p>Mapping each row into an editable candidate profile.</p></div></div><div className="modal-body"><div className="parsing-state"><div className="spinner" /><strong>Parsing {file?.name}</strong><span style={{ color: 'var(--muted)', fontSize: 13, marginTop: 5 }}>This usually takes a few seconds.</span><div className="progress-bar"><span /></div></div></div></Modal>;
  if (status === 'saving') return <Modal><div className="modal-header"><div><h2>Saving candidates</h2><p>Writing the import to the workspace.</p></div></div><div className="modal-body"><div className="parsing-state"><div className="spinner" /><strong>Saving {parsedRows.length} candidate{parsedRows.length === 1 ? '' : 's'}</strong></div></div></Modal>;
  if (status === 'review') return <Modal wide><div className="modal-header"><div><h2>Review CSV import</h2><p>{file?.name} · {parsedRows.length} candidate{parsedRows.length === 1 ? '' : 's'} ready for {getJob(jobId)?.title || 'this job'}.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><FormError message={error} /><div className="review-summary"><strong>{parsedRows.length} candidate{parsedRows.length === 1 ? '' : 's'} ready</strong><span>Existing candidates with the same email or phone will be attached to this job instead of duplicated.</span>{skippedRows > 0 && <span className="tag tag-review" style={{ marginTop: 10 }}>Skipped {skippedRows} incomplete row{skippedRows === 1 ? '' : 's'}</span>}</div>{parseNotes.length > 0 && <div className="import-notes"><strong>Import notes</strong>{parseNotes.slice(0, 3).map((note) => <span key={note}>{note}</span>)}{parseNotes.length > 3 && <span>…and {parseNotes.length - 3} more.</span>}</div>}<div className="candidate-table-wrap import-preview"><table className="candidate-table"><thead><tr><th>Candidate</th><th>Email</th><th>Role</th><th>Location</th><th>Review</th></tr></thead><tbody>{parsedRows.slice(0, 12).map(({ candidate, rowNumber, missingFields }) => <tr key={`${candidate.id}-${rowNumber}`}><td><strong>{candidate.name}</strong><span className="muted">Row {rowNumber}</span></td><td>{candidate.email || 'Needs review'}</td><td>{candidate.currentRole}</td><td>{candidate.location}</td><td>{missingFields.length ? <span className="tag tag-review">{missingFields.join(', ')}</span> : <span className="tag">Ready</span>}</td></tr>)}</tbody></table></div>{parsedRows.length > 12 && <p className="import-more">Showing the first 12 rows.</p>}</div><div className="modal-footer"><button className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" onClick={save}>Import {parsedRows.length} candidate{parsedRows.length === 1 ? '' : 's'}</button></div></Modal>;
  return <Modal><div className="modal-header"><div><h2>Import candidates from CSV</h2><p>Add one candidate per row to {getJob(jobId)?.title || 'this job'}.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><FormError message={error} /><div className={`drop-zone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void pick(event.dataTransfer.files?.[0]); }}><Icon name="upload" size={26} /><div><h3>Drop a CSV here</h3><p>or choose a file from your computer</p><label className="button button-secondary" htmlFor="csv-file">Choose file</label><input className="file-input" id="csv-file" type="file" accept=".csv,text/csv" onChange={(event) => { void pick(event.target.files?.[0]); }} /><small>Maximum file size 10 MB · headers such as name, email, phone, role, and location are supported</small></div></div></div><div className="modal-footer"><button className="button button-secondary" onClick={onClose}>Cancel</button></div></Modal>;
}

export function CandidateEditModal({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  const { saveCandidate } = useWorkspace();
  const [form, setForm] = useState({ name: candidate.name, currentRole: candidate.currentRole, email: candidate.email, phone: candidate.phone, location: candidate.location, salary: String(candidate.salary || ''), summary: candidate.summary, skills: candidate.skills.join(', ') });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await saveCandidate({ ...candidate, name: form.name, initials: initials(form.name), currentRole: form.currentRole, email: form.email, phone: form.phone, whatsapp: normalizePhone(form.phone), location: form.location, salary: Number(form.salary) || 0, summary: form.summary, skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean) });
      onClose();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }
  return <Modal wide><form onSubmit={submit}><div className="modal-header"><div><h2>Edit candidate profile</h2><p>Keep the canonical profile up to date across every job.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><FormError message={error} /><div className="field-grid">{[['name','Full name','text'],['currentRole','Current job title','text'],['email','Email address','email'],['phone','Phone / WhatsApp','text'],['location','Current location','text'],['salary','Expected salary / month','number']].map(([key,label,type]) => <div className="field" key={key}><label htmlFor={`edit-${key}`}>{label}</label><input className="text-input" id={`edit-${key}`} type={type} value={form[key as keyof typeof form]} onChange={(event) => update(key, event.target.value)} /></div>)}</div><div className="field" style={{ marginTop: 14 }}><label htmlFor="edit-summary">Professional summary</label><textarea className="textarea-input" id="edit-summary" value={form.summary} onChange={(event) => update('summary', event.target.value)} /></div><div className="field" style={{ marginTop: 14 }}><label htmlFor="edit-skills">Skills</label><input className="text-input" id="edit-skills" value={form.skills} onChange={(event) => update('skills', event.target.value)} /></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div></form></Modal>;
}

export function NoteModal({ candidate, jobId, onClose }: { candidate: Candidate; jobId: string; onClose: () => void }) {
  const { saveApplication } = useWorkspace();
  const application = candidate.applications[jobId];
  const [note, setNote] = useState(application?.notes || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!application) return;
    setError('');
    setSaving(true);
    try {
      await saveApplication({ ...application, notes: note });
      onClose();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }
  return <Modal><form onSubmit={submit}><div className="modal-header"><div><h2>Add a job note</h2><p>This note is only visible on this application.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></div><div className="modal-body"><FormError message={error} /><div className="field"><label htmlFor="candidate-note">Note for {candidate.name}</label><textarea required className="textarea-input" id="candidate-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context for your hiring team" /></div></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save note'}</button></div></form></Modal>;
}
