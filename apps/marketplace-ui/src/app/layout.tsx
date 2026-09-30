import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sancus Flow — Legal Services Marketplace',
  description:
    'Find trusted solicitors for wills, estate planning, and legal services across England & Wales.',
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
