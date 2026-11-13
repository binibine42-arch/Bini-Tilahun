import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Image as ImageIcon, Search } from 'lucide-react';
import {
  CATEGORY_FILTERS,
  PORTFOLIO_PROJECTS,
  PortfolioProject,
  ProjectCategory,
} from '../data/portfolioData';

interface PortfolioGalleryProps {
  onSelectProject: (
    project: PortfolioProject,
    visibleProjects: PortfolioProject[]
  ) => void;
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  onSelectProject,
}) => {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const categoryCounts = useMemo(() => {
    const counts: Record<ProjectCategory, number> = {
      all: PORTFOLIO_PROJECTS.length,
      'book-covers': 0,
      posters: 0,
      branding: 0,
      'print-merch': 0,
    };
    for (const p of PORTFOLIO_PROJECTS) {
      counts[p.category] += 1;
    }
    return counts;
  }, []);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PORTFOLIO_PROJECTS.filter((project) => {
      const matchesCat =
        activeCategory === 'all' || project.category === activeCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        project.title.toLowerCase().includes(q) ||
        project.subtitle.toLowerCase().includes(q) ||
        project.categoryLabel.toLowerCase().includes(q) ||
        project.medium.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  const markImageFailed = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section id="work" className="scroll-mt-20 py-14 sm:py-18">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-amber-400">Selected Works</p>
          <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Creative Projects & Commissions
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-300">
            Explore full-wrap book covers, Ethiopian and international campaign
            posters, custom brand emblems, business cards, and branded corporate
            merchandise. Select any piece to inspect it in high resolution.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            aria-label="Search portfolio projects"
            className="w-full rounded-xl border border-white/15 bg-[#111116]/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 shadow-2xs transition-colors focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Category segmented filter buttons */}
      <div
        role="tablist"
        aria-label="Filter projects by category"
        className="mt-8 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#111116]/90 p-1.5 w-fit"
      >
        {CATEGORY_FILTERS.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer sm:text-sm ${
                isActive
                  ? 'bg-amber-400 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`font-mono text-xs tabular-nums ${
                  isActive ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {categoryCounts[cat.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredProjects.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 bg-[#111116]/90 p-12 text-center">
          <p className="font-display text-lg font-semibold text-white">
            No matching projects found
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Try clearing your search or switching back to all works.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="mt-4 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Interactive Bento-inspired Grid */
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, index) => {
            const isHeroSpan =
              activeCategory === 'all' &&
              !searchQuery &&
              project.featured &&
              index === 0;

            return (
              <article
                key={project.id}
                className={`group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111116]/92 shadow-md transition-all duration-200 hover:border-amber-400/40 ${
                  isHeroSpan ? 'sm:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectProject(project, filteredProjects)}
                  className="relative block w-full overflow-hidden bg-[#18181F] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 cursor-pointer"
                  aria-label={`Inspect ${project.title}`}
                >
                  <div
                    className={`flex w-full items-center justify-center p-4 sm:p-5 ${
                      isHeroSpan ? 'aspect-[16/10]' : 'aspect-[4/3]'
                    }`}
                  >
                    {failedImages[project.id] ? (
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-slate-900 p-6 text-center">
                        <ImageIcon className="h-8 w-8 text-slate-500" />
                        <span className="mt-2 font-display text-sm font-semibold text-slate-300">
                          {project.title}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={project.thumbnail ?? project.image}
                        alt={`${project.title} — ${project.subtitle}`}
                        loading={index < 3 ? 'eager' : 'lazy'}
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={() => markImageFailed(project.id)}
                        className="h-full w-full rounded-lg object-contain transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                      />
                    )}
                  </div>
                </button>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    {/* Zero-pill clean unboxed metadata */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-medium text-amber-400">
                        {project.categoryLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{project.medium}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{project.year}</span>
                    </div>

                    <div className="mt-2 flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-semibold leading-snug text-white">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectProject(project, filteredProjects)
                          }
                          className="text-left hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          {project.title}
                        </button>
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          onSelectProject(project, filteredProjects)
                        }
                        aria-label={`Open ${project.title} preview`}
                        className="mt-0.5 rounded-lg p-1.5 text-slate-400 transition-colors group-hover:bg-white/10 group-hover:text-amber-400 cursor-pointer shrink-0"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                      {project.subtitle}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
                      {project.description}
                    </p>
                  </div>

                  {project.pdfUrl && (
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectProject(project, filteredProjects)
                        }
                        className="font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        {project.pages && project.pages.length > 1
                          ? `Browse ${project.pages.length} Slides`
                          : 'Inspect Artwork'}
                      </button>
                      <a
                        href={project.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-white hover:decoration-amber-400 transition-colors"
                      >
                        Open PDF ↗
                      </a>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
