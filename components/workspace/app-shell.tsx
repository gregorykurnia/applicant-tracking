'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { Icon } from '@/components/workspace/icons';
import { getJobCandidates } from '@/components/workspace/format';
import { useWorkspace } from '@/components/workspace/workspace-provider';

const navItems = [
  { href: '/', label: 'Overview', icon: 'grid' as const },
  { href: '/jobs', label: 'Jobs', icon: 'briefcase' as const },
  { href: '/jobs/job-1/candidates', label: 'Candidates', icon: 'users' as const },
  { href: '/settings', label: 'Settings', icon: 'settings' as const },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { jobs, candidates, syncStatus, syncMessage } = useWorkspace();
  const activeJobId = pathname.match(/^\/jobs\/([^/]+)/)?.[1] || 'job-1';
  const activeJobCandidateCount = getJobCandidates(candidates, activeJobId).length;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Icon name="sparkle" size={17} /></div><div className="brand-name">hireflow</div></div>
      <div className="workspace-label">Workspace</div>
      <button className="workspace-switcher" type="button" onClick={() => window.alert('Harbor Works is your active workspace.')}>
        <span className="workspace-avatar">HW</span><span className="workspace-switcher-text"><strong>Harbor Works</strong><span>Recruiting workspace</span></span><Icon name="down" size={14} />
      </button>
      <div className="nav-label">Workspace</div>
      <nav className="nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href.replace('/job-1/candidates', '/jobs/')) || (item.label === 'Jobs' && pathname.startsWith('/jobs'));
          const href = item.label === 'Candidates' ? `/jobs/${activeJobId}/candidates` : item.href;
          return <Link className={`nav-item ${active ? 'active' : ''}`} href={href} key={item.label}><Icon name={item.icon} size={17} /><span>{item.label}</span>{item.label === 'Candidates' && <span className="nav-badge">{activeJobCandidateCount}</span>}</Link>;
        })}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-foot"><div className="user-avatar">MC</div><div><strong>Maya Chen</strong><span>Recruiting lead</span></div><Icon name="more" size={17} /></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb"><span>Harbor Works</span><span>/</span><strong>{pathname === '/' ? 'Overview' : pathname.startsWith('/jobs') ? 'Jobs' : pathname.startsWith('/settings') ? 'Settings' : 'Candidate'}</strong></div><div className="top-actions"><span className={`sync-status sync-${syncStatus}`}><i />{syncMessage}</span><span className="top-date">18 Sep 2026</span><button className="icon-button" aria-label="Notifications" type="button"><Icon name="bell" size={18} /></button><div className="user-avatar">MC</div></div></header>
      {pathname.startsWith('/jobs/') && <div className="job-switcher-bar"><label htmlFor="active-job">Active job</label><select id="active-job" className="select-input" value={activeJobId} onChange={(event) => router.push(`/jobs/${event.target.value}/candidates`)}>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></div>}
      {children}
    </main>
  </div>;
}
