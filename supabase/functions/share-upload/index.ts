// Supabase Edge Function: share-upload
// Menerima foto nota dari iOS Shortcuts (multipart/form-data, field "foto"),
// menyimpannya ke bucket `notas`, lalu membuat baris baru di tabel `bills`.
// Autentikasi memakai Bearer token yang di-generate di halaman "Token akses".
//
// Deploy:
//   supabase functions deploy share-upload --no-verify-jwt
//
// Secret yang dibutuhkan tersedia otomatis di Edge Function:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUCKET = 'notas';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isFile(value: unknown): value is File {
  return !!value && typeof value === 'object' && 'arrayBuffer' in value && 'size' in value;
}

function extFor(file: File): string {
  const fromName = file.name && file.name.includes('.') ? file.name.split('.').pop()! : '';
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const type = file.type || '';
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('heic')) return 'heic';
  return 'jpg';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ message: 'Metode tidak didukung' }, 405);

  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!token) return json({ message: 'Token akses wajib diisi' }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const tokenHash = await sha256Hex(token);
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('api_tokens')
    .select('user_id')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (tokenErr) return json({ message: 'Gagal verifikasi token' }, 500);
  if (!tokenRow) return json({ message: 'Token tidak valid' }, 401);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return json({ message: 'Format data tidak valid (harus multipart/form-data)' }, 400);
  }

  const file = formData.getAll('foto').find(isFile);
  if (!file || file.size === 0) return json({ message: 'Foto tidak ditemukan' }, 400);

  const ext = extFor(file);
  const path = `${tokenRow.user_id}/${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type || 'image/jpeg', upsert: false });
  if (upErr) return json({ message: 'Gagal unggah foto: ' + upErr.message }, 500);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const today = new Date().toISOString().slice(0, 10);

  const { data: bill, error: insErr } = await supabase
    .from('bills')
    .insert({
      user_id: tokenRow.user_id,
      file_path: urlData.publicUrl,
      nominal: null,
      kategori: 'Lainnya',
      tipe: 'offline',
      sumber_bayar: 'Lainnya',
      tanggal: today,
      catatan: 'Dari Shortcut iOS',
      ocr_text: '',
      status: 'pending',
    })
    .select()
    .single();

  if (insErr) return json({ message: 'Gagal simpan nota: ' + insErr.message }, 500);

  return json({ ok: true, bill });
});
