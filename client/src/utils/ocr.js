import { createWorker } from 'tesseract.js';

const KEYWORDS = ['total', 'jumlah', 'grand total', 'bayar', 'pembayaran', 'amount', 'nominal'];

const BIAYA_WORDS = ['biaya', 'fee', 'admin', 'pajak', 'charge', 'potongan'];

const SUMBER_BAYAR = [
  { label: 'Bank Mandiri', tokens: ['mandiri', 'bank mandiri'] },
  { label: 'Bank BCA', tokens: ['bca', 'bank bca'] },
  { label: 'Bank BNI', tokens: ['bni', 'bank bni'] },
  { label: 'Bank BRI', tokens: ['bri', 'bank bri'] },
  { label: 'Bank BSI', tokens: ['bsi', 'bank syariah indonesia', 'bank bsi'] },
  { label: 'CIMB Niaga', tokens: ['cimb', 'cimb niaga'] },
  { label: 'Bank Permata', tokens: ['permata', 'bank permata'] },
  { label: 'Maybank', tokens: ['maybank'] },
  { label: 'Bank Danamon', tokens: ['danamon', 'bank danamon'] },
  { label: 'SeaBank', tokens: ['seabank', 'sea bank'] },
  { label: 'Jenius', tokens: ['jenius'] },
  { label: 'Blu', tokens: ['blu by bca', 'blu digital'] },
  { label: 'GoPay', tokens: ['gopay', 'go pay', 'gopay later'] },
  { label: 'OVO', tokens: ['ovo'] },
  { label: 'DANA', tokens: ['dana'] },
  { label: 'ShopeePay', tokens: ['shopeepay', 'shopee pay', 'spay'] },
  { label: 'LinkAja', tokens: ['linkaja', 'link aja'] },
  { label: 'Cash', tokens: ['cash', 'cashier'] },
];

export function extractSumberBayar(text) {
  if (!text) return null;
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  let best = null;
  for (const p of SUMBER_BAYAR) {
    for (const t of p.tokens) {
      if (lower.includes(t)) {
        if (best === null || p.label.length > best.label.length) best = p;
        break;
      }
    }
  }
  return best ? best.label : null;
}

function parseIdNumber(raw) {
  let s = String(raw).replace(/\s/g, '').replace(/Rp\.?/gi, '').replace(/IDR/gi, '');
  if (!/^[\d.,]+$/.test(s)) return null;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // Format Indonesia: titik = ribuan, koma = desimal
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) s = s.replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (hasDot) {
    const parts = s.split('.');
    const lastLen = parts[parts.length - 1].length;
    // "1.234.567" → ribuan Indonesia
    if (parts.length > 1 && parts.slice(1).every((p) => p.length === 3)) {
      s = parts.join('');
    } else if (parts.length === 2 && lastLen >= 1 && lastLen <= 2) {
      // "25000.50" gaya Inggris → biarkan sebagai desimal
      s = `${parts[0]}.${parts[1]}`;
    } else {
      s = parts.join('');
    }
  }

  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

export function extractNominal(text) {
  if (!text) return { nominal: null, label: null };

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const candidates = [];

  // Pola baris: label + mata uang + angka
  const linePattern = /^(.*?)(?:Rp\.?\s*|IDR\s*)?([\d][\d.,]*)$/i;
  for (const line of lines) {
    const m = line.match(linePattern);
    if (!m) continue;
    const label = m[1].replace(/[^a-zA-Z\s]/g, '').trim().toLowerCase();
    const n = parseIdNumber(m[2]);
    if (n === null || n < 100) continue; // tolak nilai tidak masuk akal
    if (BIAYA_WORDS.some((w) => label.includes(w))) continue; // tolak biaya/fee/pajak

    let score = 0;
    if (KEYWORDS.some((k) => label.includes(k))) score += 2;
    if (/total|jumlah|nominal/.test(label)) score += 2;
    if (/^(nominal|total|jumlah)/.test(label)) score += 2;
    score += n < 1000 ? -2 : 0;
    candidates.push({ nominal: n, label: label || null, score });
  }

  // Pola mata uang di tengah baris
  const anyPattern = /(?:total|jumlah|bayar|pembayaran|amount)[^0-9]*?Rp\.?\s*([\d.,]+)/gi;
  let m;
  while ((m = anyPattern.exec(text)) !== null) {
    const n = parseIdNumber(m[1]);
    if (n !== null && n >= 100) {
      candidates.push({ nominal: n, label: 'total', score: 4 });
    }
  }

  if (candidates.length === 0) {
    const currencyOnly = [...text.matchAll(/\bRp\.?\s*([\d][\d.,]*)/gi)];
    for (const cm of currencyOnly) {
      const n = parseIdNumber(cm[1]);
      if (n !== null && n >= 100) {
        candidates.push({ nominal: n, label: null, score: 1 });
      }
    }
  }

  if (candidates.length === 0) return { nominal: null, label: null };

  candidates.sort((a, b) => b.score - a.score);
  return { nominal: candidates[0].nominal, label: candidates[0].label };
}

export async function runOcr(image, onProgress) {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof onProgress === 'function') {
        onProgress(m.progress);
      }
    },
  });
  try {
    const { data } = await worker.recognize(image);
    const text = data.text || '';
    const extracted = extractNominal(text);
    return {
      text: text.trim(),
      nominal: extracted.nominal,
      detectedLabel: extracted.label,
      sumberBayar: extractSumberBayar(text),
    };
  } finally {
    await worker.terminate();
  }
}