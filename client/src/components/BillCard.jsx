import { Link } from 'react-router-dom';
import { formatIDR, formatDate, STATUS_LABEL, STATUS_BADGE } from '../utils/format.js';

const KATEGORI_COLOR = {
  'Makanan & Minuman': 'text-warning border-warning/40 bg-warning/10',
  'Transportasi': 'text-primary border-primary/40 bg-primary/10',
  'Belanja': 'text-accent border-accent/40 bg-accent/10',
  'Online / QRIS': 'text-primary border-primary/40 bg-primary/10',
  'Hiburan': 'text-accent border-accent/40 bg-accent/10',
  'Kesehatan': 'text-danger border-danger/40 bg-danger/10',
  'Lainnya': 'text-muted border-line bg-surface',
};

export default function BillCard({ bill }) {
  return (
    <Link
      to={`/bills/${bill.id}`}
      className="group flex gap-4 rounded-lg border border-line bg-surface p-3.5 shadow-card transition-all hover:border-primary/40 hover:shadow-cardHover active:scale-[0.995]"
    >
      {bill.file_path ? (
        <img
          src={bill.file_path}
          alt="Nota"
          className="h-20 w-20 shrink-0 rounded-lg border border-line object-cover"
          loading="lazy"
        />
      ) : (
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-warning/40 bg-warning/10  text-[10px] font-bold tracking-[0.12em] text-warning">
          NO
          <br />
          NOTA
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-ink group-hover:text-primary">
            {bill.catatan || (bill.kategori === 'Lainnya' ? 'Nota tanpa catatan' : bill.kategori)}
          </p>
          <p className="tabular amount shrink-0  text-base font-bold">
            {formatIDR(bill.nominal)}
          </p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={`chip border ${KATEGORI_COLOR[bill.kategori] || KATEGORI_COLOR['Lainnya']}`}>
            {bill.kategori}
          </span>
          {bill.sumber_bayar && bill.sumber_bayar !== 'Lainnya' && (
            <span className="chip border border-accent/40 bg-accent/10 text-accent">
              {bill.sumber_bayar}
            </span>
          )}
          <span className={`chip border ${STATUS_BADGE[bill.status]}`}>
            {STATUS_LABEL[bill.status]}
          </span>
        </div>
        <p className="mt-1.5  text-xs text-muted">{formatDate(bill.tanggal)}</p>
      </div>
    </Link>
  );
}