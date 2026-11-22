import React from 'react';
import { Mail, MapPin, Phone, Printer, X } from 'lucide-react';
import { DESIGNER_PROFILE, PortfolioProject } from '../data/portfolioData';

interface PortfolioPdfModalProps {
  open: boolean;
  onClose: () => void;
  projects: PortfolioProject[];
}

export const PortfolioPdfModal: React.FC<PortfolioPdfModalProps> = ({
  open,
  onClose,
  projects,
}) => {
  if (!open) return null;

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 backdrop-blur-lg sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-pdf-title"
    >
      <div className="relative w-full max-w-5xl max-h-[95vh] flex flex-col rounded-2xl border border-amber-400/40 bg-[#09090D] shadow-2xl overflow-hidden">
        {/* Modal Top Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between border-b border-white/10 bg-black/80 px-6 py-4 no-print">
          <div>
            <h3
              id="portfolio-pdf-title"
              className="font-display text-base font-bold text-white sm:text-lg"
            >
              Professional Portfolio PDF Document
            </h3>
            <p className="text-xs text-slate-400">
              High-resolution layout optimized for client presentation and PDF export.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-300 cursor-pointer shadow-lg"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close PDF view"
              className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable PDF Sheet Content */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-14 bg-slate-950 text-slate-100 print:bg-white print:text-slate-900 print:p-0">
          {/* Cover Header Section */}
          <div className="border-b-2 border-amber-400/40 pb-10 flex flex-col md:flex-row items-center gap-8 print:border-slate-800">
            <img
              src={DESIGNER_PROFILE.avatar}
              alt={DESIGNER_PROFILE.name}
              className="h-32 w-32 rounded-2xl object-cover border-2 border-amber-400 shadow-xl print:border-amber-700"
            />
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3.5 py-1 text-xs font-semibold text-amber-300 mb-3 print:bg-amber-100 print:text-amber-900">
                <span>{DESIGNER_PROFILE.role}</span>
                <span>·</span>
                <span>Bahir Dar, Ethiopia</span>
              </div>
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-white print:text-slate-900">
                {DESIGNER_PROFILE.name}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 print:text-slate-700 max-w-2xl">
                {DESIGNER_PROFILE.bio}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs text-slate-200 print:text-slate-800 font-medium">
                <span className="inline-flex items-center gap-2 font-mono">
                  <Phone className="h-4 w-4 text-amber-400 print:text-amber-700" />
                  {DESIGNER_PROFILE.phoneDisplay}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-amber-400 print:text-amber-700" />
                  {DESIGNER_PROFILE.email}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-400 print:text-amber-700" />
                  {DESIGNER_PROFILE.location}
                </span>
              </div>
            </div>
          </div>

          {/* Masterpiece Gallery Showcase */}
          <div className="mt-12">
            <div className="mb-8 flex items-center justify-between border-b border-white/10 print:border-slate-300 pb-3">
              <h2 className="font-display text-2xl font-bold text-amber-400 print:text-slate-900">
                Featured Portfolio Works
              </h2>
              <span className="font-mono text-xs text-slate-400 print:text-slate-600">
                {projects.length} High-Resolution Projects
              </span>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              {projects.map((project, idx) => (
                <div
                  key={project.id || idx}
                  className="flex flex-col rounded-2xl border border-white/15 bg-black/60 p-5 print:border-slate-300 print:bg-slate-50 print:shadow-none break-inside-avoid shadow-xl"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-900 print:bg-slate-200 border border-white/10 print:border-slate-300 shadow-inner">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="h-full w-full object-cover object-center transition-transform hover:scale-105 duration-300"
                    />
                  </div>
                  <div className="mt-5 flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-400 print:text-amber-800">
                        <span className="uppercase tracking-wider">
                          {project.categoryLabel}
                        </span>
                        <span className="font-mono text-slate-300 print:text-slate-600">
                          {project.year} · {project.medium}
                        </span>
                      </div>
                      <h3 className="mt-1.5 font-display text-lg font-bold text-white print:text-slate-900">
                        {project.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-amber-200/90 print:text-amber-900 font-semibold">
                        {project.subtitle}
                      </p>
                      <p className="mt-3 text-xs leading-relaxed text-slate-300 print:text-slate-700">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PDF Footer Document Info */}
          <div className="mt-20 border-t border-white/10 print:border-slate-300 pt-8 text-center text-xs text-slate-400 print:text-slate-600">
            <p className="font-semibold text-slate-200 print:text-slate-900">
              {DESIGNER_PROFILE.name} · Professional Graphic Design Portfolio
            </p>
            <p className="mt-1">
              Bahir Dar, Ethiopia · Tel: {DESIGNER_PROFILE.phoneDisplay} · Email: {DESIGNER_PROFILE.email} · Telegram: {DESIGNER_PROFILE.telegramHandle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
