import type { Metadata } from 'next';
import { AppShell } from '@/components/workspace/app-shell';
import { WorkspaceProvider } from '@/components/workspace/workspace-provider';

export const metadata: Metadata = {
  title: 'Hireflow · Applicant tracking',
  description: 'A calm, focused workspace for managing candidates across open roles.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="stylesheet" href="/styles.css" /></head><body><WorkspaceProvider><AppShell>{children}</AppShell></WorkspaceProvider></body></html>;
}
