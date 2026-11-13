import React, { useState } from 'react';
import { Lock, Phone, RefreshCw, X } from 'lucide-react';

interface VisitorLead {
  id: string;
  phone: string;
  name: string;
  note: string;
  createdAt: string;
}

interface OwnerInboxModalProps {
  open: boolean;
  onClose: () => void;
}

export const OwnerInboxModal: React.FC<OwnerInboxModalProps> = ({
  open,
  onClose,
}) => {
  const [ownerKey, setOwnerKey] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [leads, setLeads] = useState<VisitorLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const fetchLeads = async (keyToUse: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/leads', {
        headers: { 'x-owner-key': keyToUse },
      });
      if (!res.ok) {
        throw new Error('Incorrect verification key.');
      }
      const data = (await res.json()) as { leads: VisitorLead[] };
      setLeads(data.leads || []);
      setUnlocked(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load received numbers.'
      );
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(ownerKey);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-inbox-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-amber-400/25 bg-[#111116] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="owner-inbox-title"
              className="font-display text-lg font-semibold text-white"
            >
              Received Visitor Phone Numbers
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Private inbox for Biniyam Tilahun
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close owner inbox"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!unlocked ? (
          <form onSubmit={handleUnlock} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="owner-key-input"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                Enter your phone number or last 4 digits to unlock
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400"
                  aria-hidden="true"
                />
                <input
                  id="owner-key-input"
                  type="password"
                  required
                  value={ownerKey}
                  onChange={(e) => setOwnerKey(e.target.value)}
                  placeholder="Last 4 digits (e.g. 7669)"
                  className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-4 font-mono text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Verifying...' : 'View Received Numbers'}
            </button>
          </form>
        ) : (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 tabular-nums">
                {leads.length} {leads.length === 1 ? 'submission' : 'submissions'}
              </span>
              <button
                type="button"
                onClick={() => fetchLeads(ownerKey)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            {leads.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-6 text-center text-sm text-slate-400">
                No visitor phone numbers submitted yet.
              </div>
            ) : (
              <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/50 p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-amber-300 tabular-nums">
                        {lead.phone}
                      </p>
                      <p className="text-xs font-medium text-white">
                        {lead.name}
                      </p>
                      {lead.note && (
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {lead.note}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-500">
                        {new Date(lead.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <a
                      href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 shrink-0"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Call
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
