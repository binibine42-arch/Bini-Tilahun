import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { PortfolioProject } from '../data/portfolioData';

interface LightboxModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasMultiple: boolean;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  project,
  onClose,
  onPrev,
  onNext,
  hasMultiple,
}) => {
  const [zoomed, setZoomed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [usingThumbFallback, setUsingThumbFallback] = useState(false);
  const [activePage, setActivePage] = useState(0);

  const pages = project?.pages && project.pages.length > 0 ? project.pages : null;
  const totalPages = pages ? pages.length : 1;
  const primarySrc = pages ? pages[activePage] ?? project?.image ?? '' : project?.image ?? '';
  const activeSrc =
    usingThumbFallback && project?.thumbnail ? project.thumbnail : primarySrc;

  useEffect(() => {
    setZoomed(false);
    setImgError(false);
    setUsingThumbFallback(false);
    setActivePage(0);
  }, [project?.id]);

  useEffect(() => {
    setImgError(false);
    setUsingThumbFallback(false);
  }, [activePage]);

  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        if (pages && totalPages > 1 && activePage > 0) {
          setActivePage((p) => Math.max(0, p - 1));
        } else if (hasMultiple) {
          onPrev();
        }
      }
      if (e.key === 'ArrowRight') {
        if (pages && totalPages > 1 && activePage < totalPages - 1) {
          setActivePage((p) => Math.min(totalPages - 1, p + 1));
        } else if (hasMultiple) {
          onNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [project, onClose, onPrev, onNext, hasMultiple, pages, totalPages, activePage]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
    >
      {/* Top toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h3
            id="lightbox-title"
            className="truncate font-display text-base font-semibold text-white sm:text-lg"
          >
            {project.title}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span>{project.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{project.medium}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{project.year}</span>
            {pages && totalPages > 1 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-amber-300 tabular-nums">
                  Slide {activePage + 1} / {totalPages}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {project.pdfUrl && (
            <>
              <a
                href={project.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/35 bg-amber-400/15 px-3 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/25"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open PDF</span>
                <span className="sm:hidden">PDF</span>
              </a>
              <a
                href={project.pdfUrl}
                download
                aria-label={`Download ${project.title} PDF`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Download</span>
              </a>
            </>
          )}

          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? 'Fit image to screen' : 'Inspect full scale'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20 cursor-pointer"
          >
            {zoomed ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Fit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Zoom</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main artwork viewport */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-auto p-4 sm:p-8">
        {hasMultiple && (
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous artwork"
            className="fixed left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-slate-900/80 p-3 text-white shadow-lg transition-colors hover:bg-slate-800 sm:left-6 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {imgError ? (
          <div className="flex max-w-md flex-col items-center justify-center rounded-2xl border border-white/15 bg-slate-900 p-10 text-center text-slate-300">
            <ImageIcon className="w-10 h-10 text-slate-500" />
            <p className="mt-3 font-medium text-white">{project.title}</p>
            <p className="mt-1 text-sm text-slate-400">
              Preview unavailable while offline without cached image.
            </p>
            {project.pdfUrl && (
              <a
                href={project.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-slate-950"
              >
                <FileText className="w-4 h-4" />
                <span>Open PDF Document</span>
              </a>
            )}
          </div>
        ) : (
          <img
            src={activeSrc}
            alt={`${project.title} — ${project.subtitle}${pages && totalPages > 1 ? ` (Page ${activePage + 1} of ${totalPages})` : ''}`}
            referrerPolicy="no-referrer"
            onError={() => {
              if (!usingThumbFallback && project.thumbnail && activeSrc !== project.thumbnail) {
                setUsingThumbFallback(true);
              } else {
                setImgError(true);
              }
            }}
            onClick={() => setZoomed((z) => !z)}
            className={`rounded-lg shadow-2xl transition-transform duration-200 ${
              zoomed
                ? 'max-h-none max-w-none scale-100 cursor-zoom-out'
                : 'max-h-[66vh] max-w-full object-contain cursor-zoom-in'
            }`}
          />
        )}

        {pages && totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111116]/90 px-3 py-2">
            <button
              type="button"
              onClick={() => setActivePage((p) => Math.max(0, p - 1))}
              disabled={activePage === 0}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Prev Page
            </button>
            <div className="flex flex-wrap items-center justify-center gap-1">
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePage(idx)}
                  aria-label={`Go to page ${idx + 1}`}
                  className={`h-7 min-w-7 rounded-md px-1.5 font-mono text-xs tabular-nums transition-colors cursor-pointer ${
                    idx === activePage
                      ? 'bg-amber-400 font-semibold text-slate-950'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActivePage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={activePage === totalPages - 1}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Next Page
            </button>
          </div>
        )}

        {hasMultiple && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Next artwork"
            className="fixed right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-slate-900/80 p-3 text-white shadow-lg transition-colors hover:bg-slate-800 sm:right-6 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom caption bar */}
      <div className="border-t border-white/10 bg-slate-950/80 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
            {project.description}
          </p>
          <a
            href="#contact"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 whitespace-nowrap shrink-0"
          >
            Discuss a Similar Project
          </a>
        </div>
      </div>
    </div>
  );
};
