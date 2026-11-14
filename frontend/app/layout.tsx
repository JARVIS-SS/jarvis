import './globals.css';
import './navigation.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'جارفيس | مساعدك الذكي',
  description: 'مساعدك الشخصي للمحادثات والمهام والذاكرة',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <nav className="app-navigation" aria-label="التنقل الرئيسي">
          <a className="app-navigation-brand" href="/">جارفيس</a>
          <a className="app-navigation-memory" href="/memory">ذاكرتي</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
