import { supabase } from './lib/supabase.js';
import { todayLocal } from './utils/date.js';

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sesi habis. Silakan masuk kembali.');
  return user;
}

function parseQuery(qs) {
  const p = new URLSearchParams(qs);
  const f = {};
  for (const [k, v] of p) if (v) f[k] = v;
  return f;
}

function applyFilters(query, f) {
  if (f.q) query = query.or(`catatan.ilike.%${f.q}%,kategori.ilike.%${f.q}%,ocr_text.ilike.%${f.q}%`);
  if (f.kategori) query = query.eq('kategori', f.kategori);
  if (f.status) query = query.eq('status', f.status);
  if (f.from) query = query.gte('tanggal', f.from);
  if (f.to) query = query.lte('tanggal', f.to);
  return query;
}

function computeStats(bills) {
  const total = bills.reduce((s, b) => s + (Number(b.nominal) || 0), 0);
  const count = bills.length;

  const kategoriMap = {};
  bills.forEach((b) => {
    const k = b.kategori || 'Lainnya';
    if (!kategoriMap[k]) kategoriMap[k] = { total: 0, jumlah: 0 };
    kategoriMap[k].total += Number(b.nominal) || 0;
    kategoriMap[k].jumlah += 1;
  });
  const byKategori = Object.entries(kategoriMap)
    .map(([kategori, v]) => ({ kategori, ...v }))
    .sort((a, b) => b.total - a.total);

  const tanggalMap = {};
  bills.forEach((b) => {
    const t = b.tanggal;
    if (!t) return;
    if (!tanggalMap[t]) tanggalMap[t] = 0;
    tanggalMap[t] += Number(b.nominal) || 0;
  });
  const byTanggal = Object.entries(tanggalMap)
    .map(([tanggal, total]) => ({ tanggal, total }))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  return { total, count, byKategori, byTanggal };
}

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const user = await getUser();

  // POST /bills (FormData)
  if (path === '/bills' && method === 'POST') {
    let filePath = null;
    const d = {};
    if (body instanceof FormData) {
      const file = body.get('foto');
      if (file && file.size > 0) {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}.${ext}`;
        const storagePath = `${user.id}/${fileName}`;
        const { error: upErr } = await supabase.storage
          .from('notas')
          .upload(storagePath, file, { contentType: file.type });
        if (upErr) throw new Error('Gagal unggah foto: ' + upErr.message);
        const { data: urlData } = supabase.storage.from('notas').getPublicUrl(storagePath);
        filePath = urlData.publicUrl;
      }
      for (const [k, v] of body.entries()) if (k !== 'foto') d[k] = v;
    } else {
      Object.assign(d, body || {});
    }
    const { data, error } = await supabase
      .from('bills')
      .insert({
        file_path: filePath,
        nominal: Number(d.nominal) || 0,
        kategori: d.kategori || 'Lainnya',
        tipe: 'offline',
        sumber_bayar: d.sumber_bayar || 'Lainnya',
        tanggal: d.tanggal || todayLocal(),
        catatan: d.catatan || '',
        ocr_text: d.ocr_text || '',
        status: d.status || 'pending',
      })
      .select()
      .single();
    if (error) throw new Error('Gagal simpan nota: ' + error.message);
    return { bill: data };
  }

  const billId = path.match(/^\/bills\/([0-9a-f-]+)$/);

  // GET /bills/:id
  if (billId && method === 'GET') {
    const { data, error } = await supabase
      .from('bills').select('*')
      .eq('id', billId[1]).eq('user_id', user.id).single();
    if (error) throw new Error('Nota tidak ditemukan.');
    return { bill: data };
  }

  // PUT /bills/:id
  if (billId && method === 'PUT') {
    const { data, error } = await supabase
      .from('bills')
      .update({
        nominal: Number(body.nominal) || 0,
        kategori: body.kategori,
        sumber_bayar: body.sumber_bayar,
        tanggal: body.tanggal,
        catatan: body.catatan,
        status: body.status,
      })
      .eq('id', billId[1]).eq('user_id', user.id)
      .select().single();
    if (error) throw new Error('Gagal perbarui: ' + error.message);
    return { bill: data };
  }

  // DELETE /bills/:id
  if (billId && method === 'DELETE') {
    const { data: bill } = await supabase
      .from('bills').select('file_path')
      .eq('id', billId[1]).eq('user_id', user.id).single();
    if (bill?.file_path) {
      const path = bill.file_path.split('/notas/')[1];
      if (path) await supabase.storage.from('notas').remove([path]);
    }
    const { error } = await supabase
      .from('bills').delete()
      .eq('id', billId[1]).eq('user_id', user.id);
    if (error) throw new Error('Gagal hapus: ' + error.message);
    return { message: 'Nota dihapus.' };
  }

  // GET /bills (list)
  if (path.startsWith('/bills') && method === 'GET') {
    const qs = path.replace('/bills', '') || '';
    const filters = parseQuery(qs);
    let q = supabase.from('bills').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    q = applyFilters(q, filters);
    const { data, error } = await q;
    if (error) throw new Error('Gagal muat nota: ' + error.message);
    return { bills: data };
  }

  // GET /stats/summary
  if (path.startsWith('/stats/summary') && method === 'GET') {
    const qs = path.replace('/stats/summary', '') || '';
    const filters = parseQuery(qs);
    let q = supabase.from('bills').select('*').eq('user_id', user.id);
    q = applyFilters(q, filters);
    const { data, error } = await q;
    if (error) throw new Error('Gagal muat statistik: ' + error.message);
    return computeStats(data);
  }

  // GET /kategori
  if (path === '/kategori') {
    return {
      kategori: ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Online / QRIS', 'Hiburan', 'Kesehatan', 'Lainnya'],
    };
  }

  throw new Error('Endpoint tidak dikenali: ' + path);
}

export async function downloadExport(query = '') {
  const user = await getUser();
  const filters = parseQuery(query);
  let q = supabase.from('bills').select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  q = applyFilters(q, filters);
  const { data: bills, error } = await q;
  if (error) throw new Error('Gagal unduh: ' + error.message);
  const header = ['Tanggal', 'Kategori', 'Sumber Bayar', 'Nominal', 'Status', 'Catatan'];
  const rows = bills.map((b) => [
    b.tanggal, b.kategori, b.sumber_bayar, b.nominal, b.status,
    `"${(b.catatan || '').replace(/"/g, '""')}"`,
  ]);
  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sumbill-export.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const TOKEN_COLUMNS = 'id, label, created_at';

export async function listTokens() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('api_tokens')
    .select(TOKEN_COLUMNS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Gagal muat token: ' + error.message);
  return { tokens: data };
}

export async function createToken(label, tokenHash) {
  const user = await getUser();
  const { data, error } = await supabase
    .from('api_tokens')
    .insert({ label: label || null, token_hash: tokenHash, user_id: user.id })
    .select(TOKEN_COLUMNS)
    .single();
  if (error) throw new Error('Gagal membuat token: ' + error.message);
  return { token: data };
}

export async function deleteToken(id) {
  const user = await getUser();
  const { error } = await supabase
    .from('api_tokens')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw new Error('Gagal menghapus token: ' + error.message);
  return { message: 'Token dicabut' };
}