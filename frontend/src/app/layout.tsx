import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VedaAI – Assessment Creator',
  description:
    'AI-powered assessment and question paper generator for teachers. Create professional question papers in seconds.',
  keywords: ['assessment', 'AI', 'question paper', 'education', 'teacher tools'],
  authors: [{ name: 'VedaAI' }],
  openGraph: {
    title: 'VedaAI – Assessment Creator',
    description: 'Generate professional question papers with AI in seconds.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#4338ca',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
