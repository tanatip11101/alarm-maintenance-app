'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const MS = ['Running', 'Stop', 'Alarm', 'Maintenance'];
const AS = ['Open', 'In Progress', 'Closed'];
const XS = ['Planned', 'In Progress', 'Done'];
const inp = 'border rounded px-2 py-1 w-full';
const btn = 'px-3 py-1 rounded bg-slate-800 text-white text-sm';

function Login() {
  const [e, setE] = useState(''), [p, setP] = useState(''), [m, setM] = useState('');
  const go = async (up) => {
    setM('');
    if (!e || !p) return setM('กรุณากรอกอีเมลและรหัสผ่าน');
    if (p.length < 6) return setM('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    const a = { email: e, password: p };
    const { error } = up ? await supabase.auth.signUp(a) : await supabase.auth.signInWithPassword(a);
    setM(error ? error.message : up ? 'สมัครสำเร็จ (ถ้าเปิด confirm email ให้ยืนยันอีเมลก่อน)' : '');
  };
  return (
    <div className="max-w-sm mx-auto mt-24 p-6 bg-white rounded shadow space-y-3">
      <h1 className="text-xl font-bold">Alarm & Maintenance</h1>
      <input className={inp} placeholder="Email" value={e} onChange={(x) => setE(x.target.value)} />
      <input className={inp} type="password" placeholder="Password" value={p} onChange={(x) => setP(x.target.value)} />
      {m && <p className="text-sm text-red-600">{m}</p>}
      <div className="flex gap-2"><button className={btn} onClick={() => go(false)}>Login</button>
        <button className="px-3 py-1 rounded border text-sm" onClick={() => go(true)}>Sign up</button></div>
    </div>);
}

function Dash() {
  const [d, setD] = useState(null);
  useEffect(() => { (async () => {
    const r = await Promise.all(['machines', 'alarms', 'maintenance_records'].map((t) => supabase.from(t).select('status')));
    setD(r.map((x) => x.data || []));
  })(); }, []);
  if (!d) return <p>Loading...</p>;
  const c = (a, s) => a.filter((r) => r.status === s).length;
  const Card = ({ t, n }) => (<div className="bg-white rounded p-4 shadow"><div className="text-3xl font-bold">{n}</div><div className="text-sm text-slate-500">{t}</div></div>);
  const Bars = ({ t, arr, keys }) => (<div className="bg-white rounded p-4 shadow"><h3 className="font-semibold mb-2">{t}</h3>
    {keys.map((k) => (<div key={k} className="flex items-center gap-2 text-sm mb-1"><span className="w-24">{k}</span>
      <div className="bg-slate-800 h-3 rounded" style={{ width: `${c(arr, k) * 20 + 2}px` }} /><span>{c(arr, k)}</span></div>))}</div>);
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card t="Total machines" n={d[0].length} />
      {MS.map((s) => <Card key={s} t={s} n={c(d[0], s)} />)}
      <Card t="Alarms" n={d[1].length} /><Card t="Open alarms" n={c(d[1], 'Open')} />
      <Card t="Maintenance jobs" n={d[2].length} />
    </div>
    <div className="grid md:grid-cols-2 gap-3"><Bars t="Alarms by status" arr={d[1]} keys={AS} /><Bars t="Maintenance by status" arr={d[2]} keys={XS} /></div>
  </div>);
}

function Crud({ table, select = '*', fields, statuses, role, add, edit, del, refs = [], defaults = {} }) {
  const [rows, setRows] = useState([]), [q, setQ] = useState(''), [st, setSt] = useState('');
  const [form, setForm] = useState(null), [err, setErr] = useState(''), [df, setDf] = useState(''), [dt, setDt] = useState('');
  const load = useCallback(async () => {
    const { data } = await supabase.from(table).select(select).order('created_at', { ascending: false });
    setRows(data || []);
  }, [table, select]);
  useEffect(() => { load(); }, [load]);
  const val = (r, f) => (f.type === 'ref' ? r.machines?.machine_id : r[f.k]);
  const dd = (r) => (r.occurred_at || r.maint_date || r.created_at || '').slice(0, 10);
  const view = rows.filter((r) => (!st || r.status === st) && (!df || dd(r) >= df) && (!dt || dd(r) <= dt) &&
    (!q || fields.map((f) => val(r, f) ?? '').join(' ').toLowerCase().includes(q.toLowerCase())));
  const save = async () => {
    for (const f of fields) {
      const v = String(form[f.k] ?? '').trim();
      if (f.req && !v) return setErr(`กรุณากรอก ${f.label}`);
      if (f.re && v && !f.re.test(v)) return setErr(`${f.label} ไม่ถูกต้อง: ${f.hint}`);
    }
    const { id, created_at, machines, ...body } = form;
    Object.keys(body).forEach((k) => { if (body[k] === '') body[k] = null; });
    const { error } = id ? await supabase.from(table).update(body).eq('id', id) : await supabase.from(table).insert(body);
    if (error) return setErr(error.code === '23505' ? 'Machine ID ซ้ำ ไม่สามารถบันทึกได้' : error.message);
    setForm(null); setErr(''); load();
  };
  const csv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const t = [fields.map((f) => esc(f.label)).join(','), ...view.map((r) => fields.map((f) => esc(val(r, f))).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + t], { type: 'text/csv' }));
    a.download = `${table}.csv`; a.click();
  };
  const remove = async (id) => { if (confirm('ยืนยันการลบ?')) { await supabase.from(table).delete().eq('id', id); load(); } };
  const input = (f) => {
    const dis = !!form.id && f.adminOnly && role !== 'admin';
    const on = (x) => setForm({ ...form, [f.k]: x.target.value });
    if (f.type === 'ref') return (<select className={inp} disabled={dis} value={form[f.k] || ''} onChange={on}><option value="">-- เลือก --</option>{refs.map((m) => <option key={m.id} value={m.id}>{m.machine_id} - {m.name}</option>)}</select>);
    if (f.opts) return (<select className={inp} disabled={dis} value={form[f.k] || ''} onChange={on}>{f.opts.map((o) => <option key={o}>{o}</option>)}</select>);
    return <input className={inp} disabled={dis || (f.lockEdit && !!form.id)} type={f.type || 'text'} value={form[f.k] ?? ''} onChange={on} />;
  };
  return (<div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      <input className="border rounded px-2 py-1" placeholder="ค้นหา..." value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="border rounded px-2 py-1" value={st} onChange={(e) => setSt(e.target.value)}><option value="">All status</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
      <input type="date" className="border rounded px-2 py-1" title="From" value={df} onChange={(e) => setDf(e.target.value)} />
      <input type="date" className="border rounded px-2 py-1" title="To" value={dt} onChange={(e) => setDt(e.target.value)} />
      <button className="px-3 py-1 rounded border text-sm bg-white" onClick={csv}>Export CSV</button>
      {add && <button className={btn} onClick={() => setForm({ ...defaults })}>+ Add</button>}
    </div>
    <div className="bg-white rounded shadow overflow-x-auto"><table className="w-full text-sm">
      <thead className="bg-slate-200"><tr>{fields.map((f) => <th key={f.k} className="p-2 text-left">{f.label}</th>)}<th /></tr></thead>
      <tbody>{view.map((r) => (<tr key={r.id} className="border-t">
        {fields.map((f) => <td key={f.k} className="p-2">{String(val(r, f) ?? '')}</td>)}
        <td className="p-2 whitespace-nowrap">{edit && <button className="mr-2 underline" onClick={() => setForm(r)}>Edit</button>}
          {del && <button className="text-red-600 underline" onClick={() => remove(r.id)}>Delete</button>}</td></tr>))}
        {!view.length && <tr><td className="p-4 text-slate-500" colSpan={fields.length + 1}>ไม่พบข้อมูล</td></tr>}</tbody></table></div>
    {form && (<div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"><div className="bg-white rounded p-5 w-full max-w-md space-y-2 max-h-full overflow-auto">
      {fields.map((f) => (<label key={f.k} className="block text-sm">{f.label}{f.req && ' *'}{input(f)}</label>))}
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-2 pt-2"><button className={btn} onClick={save}>Save</button>
        <button className="px-3 py-1 border rounded text-sm" onClick={() => { setForm(null); setErr(''); }}>Cancel</button></div></div></div>)}
  </div>);
}

export default function Home() {
  const [ses, setSes] = useState(undefined), [prof, setProf] = useState(null), [tab, setTab] = useState('Dashboard'), [machines, setMachines] = useState([]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSes(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSes(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!ses) return setProf(null);
    supabase.from('profiles').select('*').eq('id', ses.user.id).single().then(({ data }) => setProf(data));
    supabase.from('machines').select('id,machine_id,name').then(({ data }) => setMachines(data || []));
  }, [ses, tab]);
  if (ses === undefined) return <p className="p-6">Loading...</p>;
  if (!ses) return <Login />;
  const role = prof?.role || 'technician', admin = role === 'admin';
  const mref = { k: 'machine_ref', label: 'Machine', type: 'ref', req: true, adminOnly: true, show: 1 };
  const F = {
    Machines: [
      { k: 'machine_id', label: 'Machine ID', req: true, re: /^[A-Za-z0-9_-]{2,20}$/, hint: 'A-Z 0-9 _ - ยาว 2-20 ตัว' },
      { k: 'name', label: 'Name', req: true }, { k: 'type', label: 'Type', req: true }, { k: 'location', label: 'Location', req: true },
      { k: 'status', label: 'Status', opts: MS }],
    Alarms: [mref,
      { k: 'alarm_code', label: 'Alarm Code', req: true, adminOnly: true, re: /^[A-Za-z0-9_-]{1,20}$/, hint: 'A-Z 0-9 _ -' },
      { k: 'description', label: 'Description', req: true, adminOnly: true },
      { k: 'occurred_at', label: 'Date/Time', type: 'datetime-local', req: true, adminOnly: true },
      { k: 'cause', label: 'Cause', adminOnly: true }, { k: 'status', label: 'Status', opts: AS }],
    Maintenance: [mref,
      { k: 'maintenance_type', label: 'Type', req: true }, { k: 'problem', label: 'Problem', req: true },
      { k: 'action_taken', label: 'Action Taken' }, { k: 'technician', label: 'Technician', req: true },
      { k: 'maint_date', label: 'Date', type: 'date', req: true }, { k: 'status', label: 'Status', opts: XS }],
  };
  const now = new Date().toISOString().slice(0, 16);
  const body = {
    Dashboard: <Dash />,
    Machines: <Crud key="m" table="machines" fields={F.Machines} statuses={MS} role={role} add={admin} edit={admin} del={admin} defaults={{ status: 'Stop' }} />,
    Alarms: <Crud key="a" table="alarms" select="*, machines(machine_id)" fields={F.Alarms} statuses={AS} role={role} refs={machines} add={admin} edit del={admin} defaults={{ status: 'Open', occurred_at: now }} />,
    Maintenance: <Crud key="x" table="maintenance_records" select="*, machines(machine_id)" fields={F.Maintenance} statuses={XS} role={role} refs={machines} add edit del={admin} defaults={{ status: 'Planned', technician: prof?.full_name || '', maint_date: now.slice(0, 10) }} />,
  };
  return (<div className="max-w-6xl mx-auto p-4 space-y-4">
    <header className="flex flex-wrap items-center gap-2 justify-between">
      <nav className="flex gap-1">{Object.keys(body).map((t) => (<button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded text-sm ${tab === t ? 'bg-slate-800 text-white' : 'bg-white'}`}>{t}</button>))}</nav>
      <div className="text-sm">{ses.user.email} <span className="px-2 py-0.5 rounded bg-slate-200">{role}</span> <button className="underline ml-2" onClick={() => supabase.auth.signOut()}>Logout</button></div>
    </header>{body[tab]}</div>);
}
