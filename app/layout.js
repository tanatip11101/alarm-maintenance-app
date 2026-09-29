import './globals.css';
export const metadata = { title: 'Alarm & Maintenance System' };
export default function RootLayout({ children }) {
  return (<html lang="th"><body className="bg-slate-100 text-slate-800">{children}</body></html>);
}
