import React, { useEffect, useState } from 'react';
import { CheckCircle2, Mail, MessageSquare, Phone, Send } from 'lucide-react';
import { DESIGNER_PROFILE } from '../data/portfolioData';
import { TelegramIcon } from './SocialIcons';

const OFFLINE_QUEUE_KEY = 'biniyam_pending_phone_leads_v1';

interface PendingLead {
  phone: string;
  name: string;
  note: string;
  sourceUrl: string;
  createdAt: string;
}

interface VisitorPhoneCardProps {
  onSubmittedToast: (message: string) => void;
}

export const VisitorPhoneCard: React.FC<VisitorPhoneCardProps> = ({
  onSubmittedToast,
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedLead, setSubmittedLead] = useState<PendingLead | null>(null);

  // Sync any queued offline phone submissions once back online
  useEffect(() => {
    const flushQueue = async () => {
      try {
        const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (!raw) return;
        const queue = JSON.parse(raw) as PendingLead[];
        if (!Array.isArray(queue) || queue.length === 0) return;

        const remaining: PendingLead[] = [];
        for (const item of queue) {
          try {
            const res = await fetch('/api/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            });
            if (!res.ok) remaining.push(item);
          } catch {
            remaining.push(item);
          }
        }
        window.localStorage.setItem(
          OFFLINE_QUEUE_KEY,
          JSON.stringify(remaining)
        );
      } catch {
        // Ignore storage errors
      }
    };

    if (navigator.onLine) {
      flushQueue();
    }
    window.addEventListener('online', flushQueue);
    return () => window.removeEventListener('online', flushQueue);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleaned = phone.trim();
    const digits = cleaned.replace(/[^0-9+]/g, '');
    if (digits.length < 7 || digits.length > 20) {
      setErrorMsg('Please enter a valid phone number (e.g., 09-12-345-678).');
      return;
    }

    const payload: PendingLead = {
      phone: cleaned,
      name: name.trim(),
      note: note.trim(),
      sourceUrl: window.location.href,
      createdAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errData.error || 'Could not send phone number.');
      }
      setSubmittedLead(payload);
      setPhone('');
      setName('');
      setNote('');
      onSubmittedToast('Your phone number has been sent to Biniyam Tilahun.');
    } catch {
      // Save offline so it sends automatically when connection returns
      try {
        const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
        const queue = raw ? (JSON.parse(raw) as PendingLead[]) : [];
        queue.push(payload);
        window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        setSubmittedLead(payload);
        setPhone('');
        setName('');
        setNote('');
        onSubmittedToast(
          'Saved offline — your number will sync automatically when connected.'
        );
      } catch {
        setErrorMsg(
          'Unable to save right now. Use Telegram or SMS below to send your number directly.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const quickMessageText = submittedLead
    ? `Hello Biniyam, I visited your portfolio. Please call me back at ${submittedLead.phone}${
        submittedLead.name ? ` (${submittedLead.name})` : ''
      }${submittedLead.note ? ` — ${submittedLead.note}` : ''}.`
    : '';

  return (
    <section
      id="send-number"
      aria-label="Send your phone number to Biniyam"
      className="scroll-mt-24 rounded-2xl border border-amber-400/25 bg-[#111116]/90 p-6 shadow-xl backdrop-blur-sm sm:p-8"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <p className="text-xs font-semibold tracking-wider text-amber-400">
            Quick Callback Request
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-bold text-white">
            Send Your Phone Number to Biniyam
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Opened this portfolio link? Leave your phone number below so{' '}
            <span className="font-medium text-white">
              {DESIGNER_PROFILE.name}
            </span>{' '}
            receives your contact directly and can call you back right away.
          </p>
        </div>

        <div className="lg:col-span-7">
          {submittedLead ? (
            <div className="rounded-xl border border-amber-400/35 bg-black/50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold text-white">
                    Number received: {submittedLead.phone}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Your phone number is saved for Biniyam. You can also send it
                    directly via SMS, Telegram, or Email in one tap:
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <a
                      href={`sms:${DESIGNER_PROFILE.phoneTel}?body=${encodeURIComponent(
                        quickMessageText
                      )}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-300 whitespace-nowrap shrink-0"
                    >
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      Send via SMS
                    </a>

                    <a
                      href={DESIGNER_PROFILE.telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:border-amber-400/40 hover:bg-white/10 whitespace-nowrap shrink-0"
                    >
                      <TelegramIcon className="h-3.5 w-3.5 text-amber-400" />
                      Message on Telegram
                    </a>

                    <a
                      href={`mailto:${DESIGNER_PROFILE.email}?subject=${encodeURIComponent(
                        `Portfolio Callback Request (${submittedLead.phone})`
                      )}&body=${encodeURIComponent(quickMessageText)}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:border-amber-400/40 hover:bg-white/10 whitespace-nowrap shrink-0"
                    >
                      <Mail className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                      Send via Email
                    </a>

                    <button
                      type="button"
                      onClick={() => setSubmittedLead(null)}
                      className="ml-auto text-xs font-medium text-slate-400 underline underline-offset-4 hover:text-white cursor-pointer"
                    >
                      Send another number
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="visitor-phone"
                    className="mb-1.5 block text-xs font-medium text-slate-300"
                  >
                    Your Phone Number <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400/80"
                      aria-hidden="true"
                    />
                    <input
                      id="visitor-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 09-12-345-678"
                      className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 pl-10 pr-4 font-mono text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="visitor-name"
                    className="mb-1.5 block text-xs font-medium text-slate-300"
                  >
                    Your Name (Optional)
                  </label>
                  <input
                    id="visitor-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name or business"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label
                    htmlFor="visitor-note"
                    className="mb-1.5 block text-xs font-medium text-slate-300"
                  >
                    Project Note (Optional)
                  </label>
                  <input
                    id="visitor-note"
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Book cover, logo, poster, or business card..."
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-amber-300 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>{submitting ? 'Sending...' : 'Send My Number'}</span>
                </button>
              </div>

              {errorMsg && (
                <p role="alert" className="text-xs font-medium text-rose-400">
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
