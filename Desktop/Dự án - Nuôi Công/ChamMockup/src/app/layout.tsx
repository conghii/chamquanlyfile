import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ChamMockup — Seasonal Apparel Mockup Generator',
  description:
    'AI-powered seasonal apparel mockups for Etsy and print-on-demand sellers. Create stunning t-shirt, hoodie and sweatshirt mockups for every season.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.variable} font-sans antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
