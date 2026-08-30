import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Three-Way Match Engine | Procurement Reconciliation',
  description: 'Automated Purchase Order, GRN, and Invoice reconciliation engine powered by Gemini API and SKU Master resolution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased min-h-screen flex">
        {children}
      </body>
    </html>
  );
}
