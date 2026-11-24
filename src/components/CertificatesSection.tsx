import React from 'react';
import { Award, Maximize2 } from 'lucide-react';
import {
  CertificateItem,
  DESIGNER_CERTIFICATES,
} from '../data/portfolioData';

interface CertificatesSectionProps {
  onInspectCertificate: (certificate: CertificateItem) => void;
}

export const CertificatesSection: React.FC<CertificatesSectionProps> = ({
  onInspectCertificate,
}) => {
  return (
    <section
      id="certificates"
      aria-label="Official Bank Certificates and Recognition"
      className="scroll-mt-20 border-t border-white/10 py-14"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-amber-400">
            Verified Credentials
          </p>
          <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white">
            Certificates &amp; Institutional Recognition
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Signed and stamped work confirmations from regional banking
            districts recognizing custom 3D clock and brand design delivery.
          </p>
        </div>
        <span className="font-mono text-xs text-slate-400 tabular-nums shrink-0">
          {DESIGNER_CERTIFICATES.length} Official Documents · Click to Inspect
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {DESIGNER_CERTIFICATES.map((cert) => (
          <article
            key={cert.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-amber-400/20 bg-[#111116]/90 shadow-xl backdrop-blur-sm transition-colors duration-200 hover:border-amber-400/45"
          >
            {/* Uncropped museum-style document stage so portrait & landscape certificates both show every seal & signature */}
            <button
              type="button"
              onClick={() => onInspectCertificate(cert)}
              aria-label={`Inspect ${cert.issuer} ${cert.title} in full screen`}
              className="relative flex h-[360px] w-full items-center justify-center overflow-hidden border-b border-white/10 bg-[#18171D] p-4 sm:h-[430px] sm:p-6 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              <img
                src={cert.image}
                alt={`${cert.issuer} — ${cert.title}`}
                loading="lazy"
                decoding="async"
                className="max-h-full max-w-full rounded-md object-contain shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/75 px-3 py-1.5 text-xs font-medium text-amber-300 backdrop-blur-sm transition-colors group-hover:border-amber-400/50 group-hover:text-amber-200">
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Full View</span>
              </span>
            </button>

            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-amber-400">
                    {cert.issuer}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{cert.district}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{cert.dateLabel}</span>
                </div>

                <h3 className="mt-2 font-display text-xl font-bold text-white">
                  {cert.title}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-amber-200/85">
                  {cert.amharicTitle}
                </p>

                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {cert.description}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
                <div className="min-w-0 text-slate-300">
                  <p className="truncate font-medium text-white">
                    {cert.signatory}
                  </p>
                  <p className="mt-0.5 font-mono text-slate-400">
                    {cert.referenceNo}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onInspectCertificate(cert)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/35 bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-400/20 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Inspect Document</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
