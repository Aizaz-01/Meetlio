import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meetlio — Effortless Meeting & Appointment Scheduling',
  description:
    'Meetlio is a modern, original appointment and meeting scheduling platform for professionals and teams.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
