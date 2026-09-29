import './globals.css';
import { Noto_Sans_Thai } from 'next/font/google';
const f = Noto_Sans_Thai({ subsets: ['thai', 'latin'], weight: ['400', '500', '600', '700'], display: 'swap' });
export const metadata = { title: 'Alarm & Maintenance System' };
export default function RootLayout({ children }) {
  return (<html lang="th"><body className={f.className}>{children}</body></html>);
}
