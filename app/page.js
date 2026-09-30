'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const MS = ['Running', 'Stop', 'Alarm', 'Maintenance'];
const AS = ['Open', 'In Progress', 'Closed'];
const XS = ['Planned', 'In Progress', 'Waiting Part', 'Done'];
const inp = 'border rounded px-3 py-2 w-full';
const btn = 'px-4 py-2 rounded bg-slate-800 text-white text-sm font-medium';
const TONE = { Running: 'green', Stop: 'gray', Alarm: 'red', Maintenance: 'amber', Open: 'red', 'In Progress': 'amber', Closed: 'green', Planned: 'blue', 'Waiting Part': 'orange', Done: 'green', admin: 'blue', technician: 'green', viewer: 'gray' };
const COL = { Running: '#16a34a', Stop: '#64748b', Alarm: '#dc2626', Maintenance: '#d97706' };
const Badge = ({ s }) => <span className={`badge b-${TONE[s] || 'gray'}`}>{s}</span>;

function NewPassword({ onDone }) {
  const [p, setP] = useState(''), [p2, setP2] = useState(''), [m, setM] = useState(''), [busy, setBusy] = useState(false);
  const go = async () => {
    if (p.length < 6) return setM('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    if (p !== p2) return setM('รหัสผ่านสองช่องไม่ตรงกัน');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: p });
    setBusy(false);
    if (error) return setM(error.message);
    onDone();
  };
  return (<div className="min-h-screen flex items-center justify-center p-6"><div className="w-full max-w-sm bg-white rounded shadow p-8 space-y-4">
    <div><h2 className="text-2xl font-bold">ตั้งรหัสผ่านใหม่</h2><p className="text-sm text-slate-500">กรอกรหัสผ่านใหม่ที่ต้องการใช้</p></div>
    <label className="block text-sm font-medium">รหัสผ่านใหม่<input className={inp + ' mt-1'} type="password" value={p} onChange={(x) => setP(x.target.value)} /></label>
    <label className="block text-sm font-medium">ยืนยันรหัสผ่านใหม่<input className={inp + ' mt-1'} type="password" value={p2} onChange={(x) => setP2(x.target.value)} onKeyDown={(k) => k.key === 'Enter' && go()} /></label>
    {m && <p className="text-sm rounded px-3 py-2 bg-red-100 text-red-800">{m}</p>}
    <button className={btn + ' w-full'} disabled={busy} onClick={go}>{busy ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}</button></div></div>);
}

function Login() {
  const [mode, setMode] = useState('in'), [e, setE] = useState(''), [p, setP] = useState(''), [p2, setP2] = useState('');
  const [show, setShow] = useState(false), [busy, setBusy] = useState(false), [m, setM] = useState(null);
  const up = mode === 'up', rs = mode === 'reset';
  const go = async () => {
    setM(null);
    if (!e || (!rs && !p)) return setM({ t: 'err', s: rs ? 'กรุณากรอกอีเมล' : 'กรุณากรอกอีเมลและรหัสผ่าน' });
    if (!/^\S+@\S+\.\S+$/.test(e)) return setM({ t: 'err', s: 'รูปแบบอีเมลไม่ถูกต้อง' });
    if (up && p.length < 6) return setM({ t: 'err', s: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    if (up && p !== p2) return setM({ t: 'err', s: 'รหัสผ่านสองช่องไม่ตรงกัน' });
    setBusy(true);
    const a = { email: e, password: p };
    let error;
    if (rs) ({ error } = await supabase.auth.resetPasswordForEmail(e, { redirectTo: window.location.origin }));
    else ({ error } = up ? await supabase.auth.signUp(a) : await supabase.auth.signInWithPassword(a));
    setBusy(false);
    if (error) setM({ t: 'err', s: error.message.includes('Invalid login') ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : /rate limit/i.test(error.message) ? 'ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' : error.message });
    else if (rs) setM({ t: 'ok', s: 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว โปรดตรวจสอบกล่องจดหมาย (รวมถึงสแปม)' });
    else if (up) setM({ t: 'ok', s: 'สมัครสำเร็จ กำลังเข้าสู่ระบบ...' });
  };
  const key = (k) => k.key === 'Enter' && go();
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-center p-12 text-white login-hero">
        <div className="text-5xl mb-4">⚙️</div>
        <h1 className="text-3xl font-bold mb-2">Alarm & Maintenance</h1>
        <p className="opacity-90 mb-8">ระบบจัดการ Alarm และงานซ่อมบำรุงเครื่องจักรในโรงงาน</p>
        {['ติดตามสถานะเครื่องจักรได้ในหน้าเดียว', 'บันทึกและปิดงาน Alarm ได้ทันที', 'ประวัติงานซ่อมบำรุงครบทุกเครื่อง', 'ควบคุมสิทธิ์ตามบทบาทผู้ใช้'].map((x) => <div key={x} className="mb-2">✓ {x}</div>)}
      </div>
      <div className="flex flex-col items-center justify-center p-6 gap-4">
        <div className="md:hidden text-5xl">⚙️</div>
        <div className="w-full max-w-sm bg-white rounded shadow p-8 space-y-4">
          <div><h2 className="text-2xl font-bold">{rs ? 'ลืมรหัสผ่าน' : up ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</h2>
            <p className="text-sm text-slate-500">{rs ? 'กรอกอีเมล เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้' : up ? 'สร้างบัญชีใหม่ (เริ่มต้นเป็นช่างเทคนิค)' : 'ยินดีต้อนรับกลับมา'}</p></div>
          <label className="block text-sm font-medium">อีเมล<input className={inp + ' mt-1'} type="email" placeholder="you@example.com" value={e} onChange={(x) => setE(x.target.value)} onKeyDown={key} /></label>
          {!rs && <label className="block text-sm font-medium">รหัสผ่าน
            <div className="relative mt-1"><input className={inp} type={show ? 'text' : 'password'} placeholder="อย่างน้อย 6 ตัวอักษร" value={p} onChange={(x) => setP(x.target.value)} onKeyDown={key} />
              <button type="button" className="absolute right-3 top-2 text-xs text-slate-500" onClick={() => setShow(!show)}>{show ? 'ซ่อน' : 'แสดง'}</button></div></label>}
          {mode === 'in' && <div className="text-right -mt-2"><button className="text-sm text-blue-600" onClick={() => { setMode('reset'); setM(null); }}>ลืมรหัสผ่าน?</button></div>}
          {up && <label className="block text-sm font-medium">ยืนยันรหัสผ่าน<input className={inp + ' mt-1'} type={show ? 'text' : 'password'} value={p2} onChange={(x) => setP2(x.target.value)} onKeyDown={key} /></label>}
          {m && <p className={`text-sm rounded px-3 py-2 ${m.t === 'err' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{m.s}</p>}
          <button className={btn + ' w-full'} disabled={busy} onClick={go}>{busy ? 'กำลังดำเนินการ...' : rs ? 'ส่งลิงก์ตั้งรหัสผ่านใหม่' : up ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</button>
          <p className="text-sm text-center text-slate-500">{rs ? '' : up ? 'มีบัญชีแล้ว?' : 'ยังไม่มีบัญชี?'}{' '}
            <button className="text-blue-600 font-medium" onClick={() => { setMode(rs || up ? 'in' : 'up'); setM(null); }}>{rs ? '← กลับไปเข้าสู่ระบบ' : up ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button></p>
        </div>
      </div>
    </div>);
}

const SC = { Open: '#dc2626', 'In Progress': '#d97706', Closed: '#16a34a', Planned: '#2563eb', 'Waiting Part': '#ea580c', Done: '#16a34a' };
function Rows({ t, e }) {
  const mx = Math.max(1, ...e.map((x) => x[1]));
  return (<div className="bg-white rounded p-4 shadow"><h3 className="font-semibold mb-3">{t}</h3>
    {e.some((x) => x[1] > 0) ? (<div className="flex items-end gap-2 h-44 border-b">
      {e.map(([k, v]) => (<div key={k} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-1">
        <span className="text-xs font-semibold">{v}</span>
        <div className="w-full rounded-t vbar" style={{ maxWidth: 44, height: `${(v / mx) * 85}%`, minHeight: v ? 4 : 0, background: SC[k] || COL[k] || 'var(--brand)' }} /></div>))}</div>
    ) : <p className="text-sm text-slate-500">ไม่มีข้อมูล</p>}
    <div className="flex gap-2 mt-1">{e.map(([k]) => <span key={k} className="flex-1 min-w-0 text-center text-xs text-slate-500 truncate" title={k}>{k}</span>)}</div></div>);
}

function History({ m, onClose }) {
  const [a, setA] = useState([]), [x, setX] = useState([]);
  useEffect(() => { (async () => {
    setA((await supabase.from('alarms').select('*').eq('machine_ref', m.id).order('occurred_at', { ascending: false })).data || []);
    setX((await supabase.from('maintenance_records').select('*').eq('machine_ref', m.id).order('maint_date', { ascending: false })).data || []);
  })(); }, [m.id]);
  return (<div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center p-4"><div className="bg-white rounded p-5 w-full max-w-2xl max-h-full overflow-auto space-y-2">
    <h2 className="font-bold">History: {m.machine_id} - {m.name}</h2>
    <h3 className="font-semibold text-sm">Alarms ({a.length})</h3>
    {a.map((r) => <div key={r.id} className="text-sm border-b py-1">{(r.occurred_at || '').slice(0, 16).replace('T', ' ')} | {r.alarm_code} | {r.description} | {r.status}</div>)}
    <h3 className="font-semibold text-sm pt-2">Maintenance ({x.length})</h3>
    {x.map((r) => <div key={r.id} className="text-sm border-b py-1">{r.maint_date} | {r.maintenance_type} | {r.problem} | {r.technician} | {r.status}</div>)}
    <button className={btn} onClick={onClose}>Close</button></div></div>);
}

function Users({ me }) {
  const [rows, setRows] = useState([]), [q, setQ] = useState(''), [msg, setMsg] = useState('');
  const load = useCallback(async () => { const { data } = await supabase.from('profiles').select('*').order('full_name'); setRows(data || []); }, []);
  useEffect(() => { load(); }, [load]);
  const save = async (u, patch) => {
    const { error } = await supabase.from('profiles').update(patch).eq('id', u.id);
    setMsg(error ? error.message : 'บันทึกแล้ว'); setTimeout(() => setMsg(''), 2000); load();
  };
  const view = rows.filter((u) => !q || `${u.full_name} ${u.role}`.toLowerCase().includes(q.toLowerCase()));
  const C = { admin: '#2563eb', technician: '#16a34a', viewer: '#64748b' };
  return (<div className="space-y-3">
    <div className="grid grid-cols-3 gap-3">{Object.keys(C).map((r) => (<div key={r} className="bg-white rounded p-4 shadow stat" style={{ '--c': C[r] }}>
      <div className="text-3xl font-bold">{rows.filter((u) => u.role === r).length}</div><div className="text-sm text-slate-500">{r}</div></div>))}</div>
    <div className="flex flex-wrap gap-2 items-center"><input className="border rounded px-3 py-2" placeholder="ค้นหาผู้ใช้..." value={q} onChange={(e) => setQ(e.target.value)} />
      <span className="text-sm text-slate-500">ผู้ใช้ใหม่สมัครเองที่หน้า Login แล้วกำหนดบทบาทที่นี่</span></div>
    <div className="bg-white rounded shadow overflow-x-auto"><table className="w-full text-sm">
      <thead className="bg-slate-200"><tr><th className="p-2 text-left">ผู้ใช้</th><th className="p-2 text-left">ชื่อที่แสดง</th><th className="p-2 text-left">บทบาท</th></tr></thead>
      <tbody>{view.map((u) => (<tr key={u.id} className="border-t">
        <td className="p-2"><span className="avatar mr-2">{(u.full_name || '?')[0].toUpperCase()}</span>{u.full_name}{u.id === me.id && <span className="badge b-blue ml-2">คุณ</span>}</td>
        <td className="p-2"><input key={u.full_name} className="border rounded px-2 py-1" defaultValue={u.full_name || ''} onBlur={(e) => e.target.value.trim() && e.target.value !== u.full_name && save(u, { full_name: e.target.value.trim() })} /></td>
        <td className="p-2"><select className="border rounded px-2 py-1" value={u.role} disabled={u.id === me.id} title={u.id === me.id ? 'ไม่สามารถเปลี่ยนบทบาทของตัวเองได้' : ''}
          onChange={(e) => confirm(`เปลี่ยนบทบาทของ ${u.full_name} เป็น ${e.target.value}?`) && save(u, { role: e.target.value })}>
          {['admin', 'technician', 'viewer'].map((r) => <option key={r}>{r}</option>)}</select></td></tr>))}
        {!view.length && <tr><td className="p-4 text-slate-500" colSpan={3}>ไม่พบผู้ใช้</td></tr>}</tbody></table></div>
    {msg && <div className="fixed bottom-4 right-4 z-30 bg-green-600 text-white px-4 py-2 rounded shadow">{msg}</div>}
  </div>);
}

const TL = { machines: 'เครื่องจักร', alarms: 'Alarm', maintenance_records: 'งานซ่อมบำรุง' };
const AC = { INSERT: ['เพิ่ม', 'green'], UPDATE: ['แก้ไข', 'amber'], DELETE: ['ลบ', 'red'] };
function Audit() {
  const [r, setR] = useState([]), [mm, setMm] = useState({});
  useEffect(() => { (async () => {
    setR((await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100)).data || []);
    setMm(Object.fromEntries(((await supabase.from('machines').select('id,machine_id')).data || []).map((m) => [m.id, m.machine_id])));
  })(); }, []);
  const sum = (x) => {
    const d = x.detail || {}, mc = mm[d.machine_ref] || '?';
    if (x.table_name === 'machines') return `เครื่อง ${d.machine_id} (${d.name}) · สถานะ: ${d.status}`;
    if (x.table_name === 'alarms') return `Alarm ${d.alarm_code} ของเครื่อง ${mc}: ${d.description} · สถานะ: ${d.status}`;
    return `${d.maintenance_type} เครื่อง ${mc}: ${d.problem} · ช่าง: ${d.technician} · สถานะ: ${d.status}`;
  };
  return (<div className="bg-white rounded shadow overflow-x-auto"><table className="w-full text-sm">
    <thead className="bg-slate-200"><tr>{['เวลา (ไทย)', 'ผู้ใช้', 'ตาราง', 'การกระทำ', 'รายละเอียด'].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
    <tbody>{r.map((x) => { const [lb, tn] = AC[x.action] || [x.action, 'gray']; return (<tr key={x.id} className="border-t">
      <td className="p-2 whitespace-nowrap">{new Date(x.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}</td>
      <td className="p-2">{x.changed_by_email}</td><td className="p-2">{TL[x.table_name] || x.table_name}</td>
      <td className="p-2"><span className={`badge b-${tn}`}>{lb}</span></td><td className="p-2">{sum(x)}</td></tr>); })}
      {!r.length && <tr><td className="p-4 text-slate-500" colSpan={5}>ยังไม่มีบันทึก</td></tr>}</tbody></table></div>);
}

function Dash() {
  const [d, setD] = useState(null);
  useEffect(() => { (async () => {
    const r = await Promise.all(['machines', 'alarms', 'maintenance_records'].map((t) => supabase.from(t).select(t === 'alarms' ? 'status,occurred_at,machines(machine_id)' : 'status')));
    setD(r.map((x) => x.data || []));
  })(); }, []);
  if (!d) return <p>Loading...</p>;
  const c = (a, s) => a.filter((r) => r.status === s).length;
  const Card = ({ t, n, c = '#64748b' }) => (<div className="bg-white rounded p-4 shadow stat" style={{ '--c': c }}><div className="text-3xl font-bold">{n}</div><div className="text-sm text-slate-500">{t}</div></div>);
  const Bars = ({ t, arr, keys }) => <Rows t={t} e={keys.map((k) => [k, c(arr, k)])} />;
  return (<div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card t="Total machines" n={d[0].length} c="#2563eb" />
      {MS.map((s) => <Card key={s} t={s} n={c(d[0], s)} c={COL[s]} />)}
      <Card t="Alarms" n={d[1].length} c="#dc2626" /><Card t="Open alarms" n={c(d[1], 'Open')} c="#dc2626" />
      <Card t="Maintenance jobs" n={d[2].length} c="#2563eb" />
    </div>
    <div className="grid md:grid-cols-3 gap-3"><Bars t="Machines by status" arr={d[0]} keys={MS} /><Bars t="Alarms by status" arr={d[1]} keys={AS} /><Bars t="Maintenance by status" arr={d[2]} keys={XS} /></div>
    <div className="grid md:grid-cols-2 gap-3">
      <Rows t="Alarms by machine" e={Object.entries(d[1].reduce((o, a) => { const k = a.machines?.machine_id || '?'; o[k] = (o[k] || 0) + 1; return o; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6)} />
      <Rows t="Alarms last 7 days" e={[...Array(7)].map((_, i) => { const t = new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10); return [t.slice(5), d[1].filter((a) => (a.occurred_at || '').slice(0, 10) === t).length]; })} />
    </div>
  </div>);
}

function Crud({ table, select = '*', fields, statuses, role, add, edit, del, refs = [], defaults = {}, extra }) {
  const [rows, setRows] = useState([]), [q, setQ] = useState(''), [st, setSt] = useState('');
  const [form, setForm] = useState(null), [err, setErr] = useState(''), [df, setDf] = useState(''), [dt, setDt] = useState(''), [ok, setOk] = useState('');
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
    setForm(null); setErr(''); load(); setOk('บันทึกสำเร็จ'); setTimeout(() => setOk(''), 2000);
  };
  const csv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const t = [fields.map((f) => esc(f.label)).join(','), ...view.map((r) => fields.map((f) => esc(val(r, f))).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + t], { type: 'text/csv' }));
    a.download = `${table}.csv`; a.click();
  };
  const remove = async (id) => { if (confirm('ยืนยันการลบ?')) { await supabase.from(table).delete().eq('id', id); load(); setOk('ลบข้อมูลแล้ว'); setTimeout(() => setOk(''), 2000); } };
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
      <span className="text-sm text-slate-500 self-center ml-auto">{view.length} รายการ</span>
      {add && <button className={btn} onClick={() => setForm({ ...defaults })}>+ เพิ่มข้อมูล</button>}
    </div>
    <div className="bg-white rounded shadow overflow-x-auto"><table className="w-full text-sm">
      <thead className="bg-slate-200"><tr>{fields.map((f) => <th key={f.k} className="p-2 text-left">{f.label}</th>)}<th /></tr></thead>
      <tbody>{view.map((r) => (<tr key={r.id} className="border-t">
        {fields.map((f) => <td key={f.k} className="p-2">{f.k === 'status' ? <Badge s={r.status} /> : String(val(r, f) ?? '')}</td>)}
        <td className="p-2 whitespace-nowrap">{extra && extra(r)}{edit && <button className="mr-2 underline" onClick={() => setForm(r)}>Edit</button>}
          {del && <button className="text-red-600 underline" onClick={() => remove(r.id)}>Delete</button>}</td></tr>))}
        {!view.length && <tr><td className="p-4 text-slate-500" colSpan={fields.length + 1}>ไม่พบข้อมูล</td></tr>}</tbody></table></div>
    {ok && <div className="fixed bottom-4 right-4 z-30 bg-green-600 text-white px-4 py-2 rounded shadow">{ok}</div>}
    {form && (<div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center p-4"><div className="bg-white rounded p-6 w-full max-w-md space-y-2 max-h-full overflow-auto"><h2 className="font-bold text-lg">{form.id ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูล'}</h2>
      {fields.map((f) => (<label key={f.k} className="block text-sm font-medium mt-2">{f.label}{f.req && ' *'}{input(f)}</label>))}
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-2 pt-2"><button className={btn} onClick={save}>Save</button>
        <button className="px-3 py-1 border rounded text-sm" onClick={() => { setForm(null); setErr(''); }}>Cancel</button></div></div></div>)}
  </div>);
}

export default function Home() {
  const [ses, setSes] = useState(undefined), [prof, setProf] = useState(null), [tab, setTab] = useState('Dashboard'), [machines, setMachines] = useState([]), [hist, setHist] = useState(null), [openN, setOpenN] = useState(0), [dark, setDark] = useState(false), [rec, setRec] = useState(false), [menu, setMenu] = useState(false);
  useEffect(() => {
    if (window.location.href.includes('type=recovery')) setRec(true);
    supabase.auth.getSession().then(({ data }) => setSes(data.session));
    const { data } = supabase.auth.onAuthStateChange((ev, s) => { setSes(s); if (ev === 'PASSWORD_RECOVERY') setRec(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!ses) return setProf(null);
    supabase.from('profiles').select('*').eq('id', ses.user.id).single().then(({ data }) => setProf(data));
    supabase.from('machines').select('id,machine_id,name').then(({ data }) => setMachines(data || []));
    supabase.from('alarms').select('id', { count: 'exact', head: true }).eq('status', 'Open').then(({ count }) => setOpenN(count || 0));
  }, [ses, tab]);
  useEffect(() => { try { const d = localStorage.getItem('dark') === '1'; setDark(d); document.documentElement.classList.toggle('dark', d); } catch (e) {} }, []);
  const flip = () => { const d = !dark; setDark(d); document.documentElement.classList.toggle('dark', d); try { localStorage.setItem('dark', d ? '1' : '0'); } catch (e) {} };
  if (ses === undefined) return <p className="p-6">Loading...</p>;
  if (rec && ses) return <NewPassword onDone={() => { setRec(false); window.history.replaceState(null, '', window.location.pathname); }} />;
  if (!ses) return <Login />;
  const role = prof?.role || 'viewer', admin = role === 'admin', tech = role !== 'viewer';
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
    Machines: <Crud key="m" table="machines" fields={F.Machines} statuses={MS} role={role} add={admin} edit={admin} del={admin} defaults={{ status: 'Stop' }} extra={(r) => <button className="mr-2 underline" onClick={() => setHist(r)}>History</button>} />,
    Alarms: <Crud key="a" table="alarms" select="*, machines(machine_id)" fields={F.Alarms} statuses={AS} role={role} refs={machines} add={admin} edit={tech} del={admin} defaults={{ status: 'Open', occurred_at: now }} />,
    Maintenance: <Crud key="x" table="maintenance_records" select="*, machines(machine_id)" fields={F.Maintenance} statuses={XS} role={role} refs={machines} add={tech} edit={tech} del={admin} defaults={{ status: 'Planned', technician: prof?.full_name || '', maint_date: now.slice(0, 10) }} />,
  };
  const items = [['Dashboard', '📊', 'แดชบอร์ด'], ['Machines', '🏭', 'เครื่องจักร'], ['Alarms', '🚨', 'Alarm'], ['Maintenance', '🛠️', 'งานซ่อมบำรุง'], ...(admin ? [['Users', '👥', 'จัดการผู้ใช้'], ['Audit', '📜', 'Audit Log']] : [])];
  const cur = items.find((x) => x[0] === tab) || items[0];
  const pick = (t) => { setTab(t); setMenu(false); };
  return (<div className="min-h-screen md:flex">
    {menu && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMenu(false)} />}
    <aside className={`side fixed md:sticky top-0 z-40 md:z-10 h-screen w-64 shrink-0 flex flex-col p-4 transition-transform ${menu ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="font-bold text-lg mb-6 px-2">⚙️ Alarm & Maintenance</div>
      <nav className="flex-1 space-y-1 overflow-y-auto">{items.map(([k, ic, lb]) => (
        <button key={k} onClick={() => pick(k)} className={`nav-i ${tab === k ? 'on' : ''}`}><span>{ic}</span>{lb}{k === 'Alarms' && openN > 0 && <span className="badge b-red ml-auto">{openN}</span>}</button>))}</nav>
      <div className="border-t pt-3 space-y-3 text-sm">
        <div className="flex items-center gap-2"><span className="avatar">{(ses.user.email || '?')[0].toUpperCase()}</span>
          <div className="min-w-0"><div className="truncate">{ses.user.email}</div><span className="badge b-blue">{role}</span></div></div>
        <div className="flex gap-2"><button className="side-btn" onClick={flip}>{dark ? '☀️ Light' : '🌙 Dark'}</button>
          <button className="side-btn" onClick={() => supabase.auth.signOut()}>Logout</button></div>
      </div>
    </aside>
    <main className="flex-1 min-w-0 max-w-6xl p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3"><button className="md:hidden px-3 py-2 rounded bg-white border" onClick={() => setMenu(true)}>☰</button>
        <h1 className="text-2xl font-bold">{cur[1]} {cur[2]}</h1></div>
      {openN > 0 && <div className="bg-red-100 text-red-800 rounded px-3 py-2 text-sm">แจ้งเตือน: มี Alarm ที่ยังเปิดอยู่ {openN} รายการ</div>}
      {tab === 'Audit' ? <Audit /> : tab === 'Users' ? <Users me={ses.user} /> : body[tab]}
      {hist && <History m={hist} onClose={() => setHist(null)} />}
    </main></div>);
}