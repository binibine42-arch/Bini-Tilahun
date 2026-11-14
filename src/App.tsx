import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Mail,
  MapPin,
  Phone,
  Share2,
  User,
  UserPlus,
} from 'lucide-react';
import { BlackGoldMotionBackground } from './components/BlackGoldMotionBackground';
import { Header } from './components/Header';
import { LightboxModal } from './components/LightboxModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OwnerInboxModal } from './components/OwnerInboxModal';
import { PortfolioGallery } from './components/PortfolioGallery';
import { PWAInstallButton } from './components/PWAInstallButton';
import { TelegramIcon, TikTokIcon } from './components/SocialIcons';
import { VisitorPhoneCard } from './components/VisitorPhoneCard';
import {
  DESIGNER_PROFILE,
  downloadVCard,
  persistContactOffline,
  PORTFOLIO_PROJECTS,
  PortfolioProject,
} from './data/portfolioData';
import {
  fetchDynamicPortfolioItems,
  recordPageVisit,
} from './services/analyticsService';

const SPECIALTIES = [
  {
    number: '01.',
    title: 'Book Covers & Print Wraps',
    description:
      'Complete front, spine, and back cover systems in both Amharic (Ge’ez) and English typography, calibrated for print production.',
  },
  {
    number: '02.',
    title: 'Brand Identity & Vector Logos',
    description:
      'Distinctive pictorial emblems, wordmarks, and cohesive color palettes built to scale from business cards to signage.',
  },
  {
    number: '03.',
    title: 'Event & Campaign Posters',
    description:
      'High-impact visual storytelling for universities, commercial brands, social advocacy, and public campaigns.',
  },
  {
    number: '04.',
    title: 'Stationery & Custom Merch',
    description:
      'QR-enabled business cards and custom-printed corporate merchandise including branded wall clocks and institutional gifts.',
  },
];

export default function App() {
  const [lightboxState, setLightboxState] = useState<{
    project: PortfolioProject;
    list: PortfolioProject[];
  } | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [ownerInboxOpen, setOwnerInboxOpen] = useState(false);
  const [dynamicProjects, setDynamicProjects] = useState<PortfolioProject[]>([]);

  // Persist contact card locally, record page visit, and load MongoDB portfolio items
  useEffect(() => {
    let active = true;
    persistContactOffline();
    void recordPageVisit();
    void fetchDynamicPortfolioItems().then((items) => {
      if (active) setDynamicProjects(items);
    });
    return () => {
      active = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3400);
  };

  const handleSaveContact = () => {
    downloadVCard();
    showToast('Contact card saved (.vcf) and cached for offline access.');
  };

  const handleCopyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      showToast(`${label} copied to clipboard.`);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      showToast(`${label}: ${value}`);
    }
  };

  const handleShareLink = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${DESIGNER_PROFILE.name} — ${DESIGNER_PROFILE.role}`,
          text: `View ${DESIGNER_PROFILE.name}'s graphic design portfolio and contact card.`,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share unsupported, fall back to copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      showToast('Portfolio link copied — ready to share.');
      window.setTimeout(() => setShareCopied(false), 2500);
    } catch {
      showToast('Copy the browser URL above to share this portfolio.');
    }
  };

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(
          keys
            .filter((key) => !key.startsWith('workbox-precache'))
            .map((key) => window.caches.delete(key))
        );
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.update()));
      }
      showToast('Cached media cleared — offline contact card stays ready.');
    } catch {
      showToast('Cache refreshed.');
    }
  };

  const handleNavigateLightbox = (direction: 'prev' | 'next') => {
    if (!lightboxState) return;
    const { project, list } = lightboxState;
    const idx = list.findIndex((item) => item.id === project.id);
    if (idx === -1 || list.length <= 1) return;
    const nextIdx =
      direction === 'next'
        ? (idx + 1) % list.length
        : (idx - 1 + list.length) % list.length;
    setLightboxState({ project: list[nextIdx], list });
  };

  return (
    <div id="top" className="relative min-h-screen text-slate-100">
      <BlackGoldMotionBackground />

      <Header
        onSaveContact={handleSaveContact}
        onOpenAdmin={() => setOwnerInboxOpen(true)}
      />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        {/* Hero Split Section */}
        <section
          aria-label="Designer profile introduction"
          className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12"
        >
          {/* Left Column: Circular Profile Photo + Identity + Social & Save Contact */}
          <div className="flex flex-col justify-between rounded-2xl border border-amber-400/20 bg-[#111116]/90 p-6 shadow-xl backdrop-blur-sm sm:p-8 lg:col-span-7">
            <div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {/* Circular Profile Portrait */}
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-amber-400/70 bg-slate-900 shadow-lg ring-4 ring-amber-400/15 sm:h-32 sm:w-32">
                  {avatarError ? (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
                      <User className="h-12 w-12" />
                    </div>
                  ) : (
                    <img
                      src={DESIGNER_PROFILE.avatar}
                      alt={`${DESIGNER_PROFILE.name}, ${DESIGNER_PROFILE.role}`}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="h-full w-full object-cover object-top"
                    />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-amber-400">
                    {DESIGNER_PROFILE.role}
                  </p>
                  <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
                    {DESIGNER_PROFILE.name}
                  </h1>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin
                        className="h-4 w-4 text-amber-400"
                        aria-hidden="true"
                      />
                      {DESIGNER_PROFILE.location}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                    <a
                      href={`tel:${DESIGNER_PROFILE.phoneTel}`}
                      className="font-mono text-sm font-medium text-amber-300 hover:text-amber-200 tabular-nums"
                    >
                      {DESIGNER_PROFILE.phoneDisplay}
                    </a>
                  </div>
                </div>
              </div>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300">
                {DESIGNER_PROFILE.bio}
              </p>

              {/* Clickable Social Media Icons + Quick Contact Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={DESIGNER_PROFILE.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Biniyam Tilahun Telegram page"
                  className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-amber-400/50 hover:bg-white/10 whitespace-nowrap shrink-0"
                >
                  <TelegramIcon className="h-5 w-5 text-[#38BDF8]" />
                  <span>Telegram</span>
                  <span className="text-xs text-slate-400">
                    {DESIGNER_PROFILE.telegramHandle}
                  </span>
                </a>

                <a
                  href={DESIGNER_PROFILE.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Biniyam Tilahun TikTok page"
                  className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-amber-400/50 hover:bg-white/10 whitespace-nowrap shrink-0"
                >
                  <TikTokIcon className="h-5 w-5 text-amber-400" />
                  <span>TikTok</span>
                  <span className="text-xs text-slate-400">
                    {DESIGNER_PROFILE.tiktokHandle}
                  </span>
                </a>

                <a
                  href={`mailto:${DESIGNER_PROFILE.email}`}
                  aria-label="Send email to Biniyam Tilahun"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-amber-400/50 hover:bg-white/10 whitespace-nowrap shrink-0"
                >
                  <Mail
                    className="h-4 w-4 text-amber-400"
                    aria-hidden="true"
                  />
                  <span>Email</span>
                </a>
              </div>
            </div>

            {/* Primary Hero Action Bar */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={handleSaveContact}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Save Contact Details
              </button>

              <a
                href="#send-number"
                className="inline-flex items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-400/20 whitespace-nowrap shrink-0"
              >
                Send Your Phone Number
              </a>

              <PWAInstallButton />
            </div>
          </div>

          {/* Right Column: Featured Visual Showcase Stack */}
          <div className="flex flex-col justify-between rounded-2xl border border-amber-400/20 bg-[#111116]/90 p-5 shadow-xl backdrop-blur-sm sm:p-6 lg:col-span-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-amber-300/90">
                Featured Portfolio Preview
              </p>
              <button
                type="button"
                onClick={handleShareLink}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{shareCopied ? 'Copied' : 'Share Portfolio'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setLightboxState({
                  project: {
                    id: 'eternal-summits',
                    title: 'Eternal Summits',
                    subtitle: 'A Journey Through The Night',
                    category: 'book-covers',
                    categoryLabel: 'Book Cover',
                    year: '2026',
                    medium: 'Full Wrap Print Jacket',
                    description:
                      'Atmospheric dark-slate wrap cover pairing gold botanical accents, layered mountain silhouettes, and structured serif typography across front, spine, and back.',
                    image:
                      '/assets/aistudio/book_cover_Enternal_summits_1_52876ddb.png',
                  },
                  list: [],
                })
              }
              className="group mt-3 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#18181F] p-3 text-left transition-colors hover:border-amber-400/50 cursor-pointer"
            >
              <img
                src="/assets/thumbs/book_cover_Enternal_summits_1_52876ddb.webp"
                alt="Eternal Summits full wrap book cover design by Biniyam Tilahun"
                decoding="async"
                referrerPolicy="no-referrer"
                className="h-56 w-full rounded-lg object-contain transition-transform duration-200 group-hover:scale-[1.02] sm:h-64"
              />
              <div className="mt-3 flex items-center justify-between gap-2 px-1">
                <div>
                  <p className="font-display text-sm font-semibold text-white">
                    Eternal Summits — Full Wrap
                  </p>
                  <p className="text-xs text-slate-400">
                    Editorial Book Cover · 2026
                  </p>
                </div>
                <span className="text-xs font-medium text-amber-400 group-hover:underline">
                  Inspect
                </span>
              </div>
            </button>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181F] p-2">
                <img
                  src="/assets/thumbs/Logo_wede_ad7070ae.webp"
                  alt="WUDE Coffee logo design"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-24 w-full object-contain"
                />
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181F] p-2">
                <img
                  src="/assets/thumbs/IMG_20251204_192153_984_ee5f02c0.webp"
                  alt="Amhara Bank Ge'ez numeral wall clock design"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-24 w-full rounded-md object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width Key Overview Strip Below Hero Split */}
        <section
          aria-label="Portfolio highlights"
          className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <div className="rounded-xl border border-white/10 bg-[#111116]/90 px-4 py-4 backdrop-blur-sm">
            <p className="font-display text-2xl font-bold text-amber-400 tabular-nums">
              {PORTFOLIO_PROJECTS.length + dynamicProjects.length}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-300">
              Showcased Artworks
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111116]/90 px-4 py-4 backdrop-blur-sm">
            <p className="font-display text-2xl font-bold text-amber-400 tabular-nums">
              4
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-300">
              Core Design Disciplines
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111116]/90 px-4 py-4 backdrop-blur-sm">
            <p className="font-display text-2xl font-bold text-white">
              Amharic & English
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-300">
              Bilingual Typography
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111116]/90 px-4 py-4 backdrop-blur-sm">
            <p className="font-display text-2xl font-bold text-white">
              Offline Ready
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-300">
              Saved Contact & Cache
            </p>
          </div>
        </section>

        {/* Visitor Phone Number Callback Card (replaces removed countdown section) */}
        <div className="mt-6">
          <VisitorPhoneCard onSubmittedToast={showToast} />
        </div>

        {/* Interactive Creative Projects Gallery */}
        <PortfolioGallery
          dynamicProjects={dynamicProjects}
          onSelectProject={(project, list) =>
            setLightboxState({ project, list })
          }
        />

        {/* Design Specialties */}
        <section
          id="specialties"
          className="scroll-mt-20 border-t border-white/10 py-14"
        >
          <p className="text-sm font-medium text-amber-400">Design Practice</p>
          <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white">
            Visual Disciplines
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SPECIALTIES.map((item) => (
              <div
                key={item.number}
                className="rounded-2xl border border-white/10 bg-[#111116]/90 p-6 shadow-md backdrop-blur-sm"
              >
                <span className="font-mono text-sm font-semibold text-amber-400 tabular-nums">
                  {item.number}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* About & Offline Contact Card */}
        <section
          id="contact"
          aria-label="About and offline contact card"
          className="scroll-mt-20 border-t border-white/10 pt-14"
        >
          <div
            id="about"
            className="scroll-mt-20 rounded-2xl border border-amber-400/20 bg-[#111116]/95 p-6 shadow-xl backdrop-blur-sm sm:p-10"
          >
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              {/* Left: Bio & Quick Save */}
              <div className="lg:col-span-5">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-amber-400/70 bg-slate-900">
                    {avatarError ? (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <User className="h-8 w-8" />
                      </div>
                    ) : (
                      <img
                        src={DESIGNER_PROFILE.avatar}
                        alt={DESIGNER_PROFILE.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-top"
                      />
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      {DESIGNER_PROFILE.name}
                    </h2>
                    <p className="text-sm font-medium text-amber-400">
                      {DESIGNER_PROFILE.role}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-300">
                      {DESIGNER_PROFILE.location}
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-relaxed text-slate-300 sm:text-base">
                  Available for book cover commissions, brand logo systems,
                  event posters, and print-ready stationery in Bahir Dar and
                  across Ethiopia or remotely worldwide. Save this card once to
                  keep all contact details accessible offline anytime.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveContact}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-xs transition-colors hover:bg-amber-300 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Save Contact Details
                  </button>
                  <PWAInstallButton />
                </div>
              </div>

              {/* Right: Direct Contact Details & Social Channels */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
                {/* Phone */}
                <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <Phone
                        className="h-4 w-4 text-amber-400"
                        aria-hidden="true"
                      />
                      Phone
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          'Phone number',
                          DESIGNER_PROFILE.phoneDisplay
                        )
                      }
                      aria-label="Copy phone number"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                    >
                      {copiedField === 'Phone number' ? (
                        <Check className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <a
                    href={`tel:${DESIGNER_PROFILE.phoneTel}`}
                    className="mt-3 font-mono text-lg font-semibold text-amber-300 hover:text-amber-200 tabular-nums"
                  >
                    {DESIGNER_PROFILE.phoneDisplay}
                  </a>
                </div>

                {/* Email */}
                <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <Mail
                        className="h-4 w-4 text-amber-400"
                        aria-hidden="true"
                      />
                      Email
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText('Email', DESIGNER_PROFILE.email)
                      }
                      aria-label="Copy email address"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                    >
                      {copiedField === 'Email' ? (
                        <Check className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <a
                    href={`mailto:${DESIGNER_PROFILE.email}`}
                    className="mt-3 break-all text-sm font-semibold text-white hover:text-amber-300 sm:text-base"
                  >
                    {DESIGNER_PROFILE.email}
                  </a>
                </div>

                {/* Telegram */}
                <a
                  href={DESIGNER_PROFILE.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 p-4 transition-colors hover:border-amber-400/50 hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#111116]">
                      <TelegramIcon className="h-5 w-5 text-[#38BDF8]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Telegram
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {DESIGNER_PROFILE.telegramHandle}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-amber-400">
                    Open Page →
                  </span>
                </a>

                {/* TikTok */}
                <a
                  href={DESIGNER_PROFILE.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 p-4 transition-colors hover:border-amber-400/50 hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#111116]">
                      <TikTokIcon className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        TikTok
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {DESIGNER_PROFILE.tiktokHandle}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-amber-400">
                    Open Page →
                  </span>
                </a>

                {/* Location */}
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/50 p-4 sm:col-span-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#111116]">
                    <MapPin
                      className="h-5 w-5 text-amber-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Studio Location
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {DESIGNER_PROFILE.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#09090D]/85 py-8 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © 2026 {DESIGNER_PROFILE.name} · {DESIGNER_PROFILE.location}
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <a
              href={DESIGNER_PROFILE.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400"
            >
              Telegram
            </a>
            <a
              href={DESIGNER_PROFILE.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400"
            >
              TikTok
            </a>
            <a
              href={`tel:${DESIGNER_PROFILE.phoneTel}`}
              className="font-mono tabular-nums hover:text-amber-400"
            >
              {DESIGNER_PROFILE.phoneDisplay}
            </a>
            <button
              type="button"
              onClick={handleClearCache}
              className="text-xs text-slate-500 underline underline-offset-4 hover:text-amber-400 cursor-pointer"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 rounded-xl border border-amber-400/40 bg-[#111116] px-4 py-3 text-sm font-medium text-amber-200 shadow-xl"
        >
          {toastMessage}
        </div>
      )}

      <OfflineIndicator />

      <OwnerInboxModal
        open={ownerInboxOpen}
        onClose={() => setOwnerInboxOpen(false)}
        onProjectUploaded={(project) => {
          setDynamicProjects((prev) => [project, ...prev]);
          showToast('Artwork published via Cloudinary & MongoDB.');
        }}
      />

      <LightboxModal
        project={lightboxState?.project ?? null}
        onClose={() => setLightboxState(null)}
        onPrev={() => handleNavigateLightbox('prev')}
        onNext={() => handleNavigateLightbox('next')}
        hasMultiple={(lightboxState?.list.length ?? 0) > 1}
      />
    </div>
  );
}
