import { Link } from 'react-router-dom';
import { formatIDR, formatDate, TIPE_LABEL, STATUS_LABEL, STATUS_BADGE, TIPE_BADGE } from '../utils/format.js';

const KATEGORI_COLOR = {
  'Makanan & Minuman': 'text-volt border-volt/40 bg-volt/10',
  'Transportasi': 'text-neon border-neon/40 bg-neon/10',
  'Belanja': 'text-mag border-mag/40 bg-mag/10',
  'Online / QRIS': 'text-neon border-neon/40 bg-neon/10',
  'Hiburan': 'text-mag border-mag/40 bg-mag/10',
  'Kesehatan': 'text-blood border-blood/40 bg-blood/10',
  'Lainnya': 'text-dim border-edge bg-panel',
};

export default function BillCard({ bill }) {
  return (
    <Link
      to={`/bills/${bill.id}`}
      className="group flex gap-4 rounded-xl border border-line bg-panel p-3.5 shadow-panel transition-all hover:border-neon/60 hover:shadow-neon-sm active:scale-[0.995]"
    >
      {bill.file_path ? (
        <img
          src={bill.file_path}
          alt="Nota"
          className="h-20 w-20 shrink-0 rounded-lg border border-edge object-cover"
          loading="lazy"
        />
      ) : (
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-volt/40 bg-volt/10 font-mono text-[10px] font-bold tracking-[0.12em] text-volt">
          NO
          <br />
          NOTA
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-brk group-hover:text-neon">
            {bill.catatan || (bill.kategori === 'Lainnya' ? 'Nota tanpa catatan' : bill.kategori)}
          </p>
          <p className="tabular neon-text shrink-0 font-mono text-base font-bold">
            {formatIDR(bill.nominal)}
          </p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={`chip border ${KATEGORI_COLOR[bill.kategori] || KATEGORI_COLOR['Lainnya']}`}>
            {bill.kategori}
          </span>
          <span className={`chip border ${TIPE_BADGE[bill.tipe]}`}>
            {TIPE_LABEL[bill.tipe]}
          </span>
          {bill.sumber_bayar && bill.sumber_bayar !== 'Lainnya' && (
            <span className="chip border border-mag/40 bg-mag/10 text-mag">
              {bill.sumber_bayar}
            </span>
          )}
          <span className={`chip border ${STATUS_BADGE[bill.status]}`}>
            {STATUS_LABEL[bill.status]}
          </span>
        </div>
        <p className="mt-1.5 font-mono text-xs text-dim">{formatDate(bill.tanggal)}</p>
      </div>
    </Link>
  );
}