import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'جارفيس | مساعدك الذكي', description: 'واجهة تأسيسية لمساعدك الشخصي الذكي' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
