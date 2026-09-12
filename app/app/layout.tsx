import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardShell
      user={{
        name: user.name,
        email: user.email,
        username: user.username,
      }}
    >
      {children}
    </DashboardShell>
  );
}
