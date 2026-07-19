import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HouseERP',
  description: 'Server-rendered ERP for duck egg and salted egg operations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
