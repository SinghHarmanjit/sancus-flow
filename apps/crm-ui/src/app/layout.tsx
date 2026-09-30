import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sancus Flow — Legal Practice Dashboard',
  description:
    'Manage leads, cases, and client relationships for your legal practice.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
