import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Cloud,
  Database,
  Eye,
  ImagePlus,
  Lock,
  LogOut,
  Monitor,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { CATEGORY_FILTERS, PortfolioProject } from '../data/portfolioData';
import {
  AnalyticsSnapshot,
  clearSavedOwnerKey,
  fetchAdminAnalytics,
  fetchAdminLeads,
  fetchMongoStatus,
  getSavedOwnerKey,
  LeadRecordItem,
  MongoStatus,
  saveCloudinaryPortfolioItem,
  verifyOwnerPasscode,
} from '../services/analyticsService';

interface OwnerInboxModalProps {
  open: boolean;
  onClose: () => void;
  onProjectUploaded?: (project: PortfolioProject) => void;
}

type ModalTab = 'analytics' | 'leads' | 'cloudinary';

function BreakdownCard({
  title,
  counts,
  total,
}: {
  title: string;
  counts: Record<string, number>;
  total: number;
}) {
  const entries = useMemo(
    () => Object.entries(counts).sort((a, b) => b[1] - a[1]),
    [counts]
  );
  const safeTotal = Math.max(total, 1);

  return (
    <div className="rounded-xl border border-white/10 bg-black/45 p-4">
      <h4 className="font-display text-sm font-semibold text-white">{title}</h4>
      {entries.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">No visits recorded yet.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {entries.map(([label, count]) => {
            const pct = Math.round((count / safeTotal) * 100);
            return (
              <div key={label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-slate-200">
                    {label}
                  </span>
                  <span className="ml-2 font-mono text-amber-300 tabular-nums shrink-0">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const OwnerInboxModal: React.FC<OwnerInboxModalProps> = ({
  open,
  onClose,
  onProjectUploaded,
}) => {
  const [ownerKey, setOwnerKey] = useState<string | null>(() =>
    getSavedOwnerKey()
  );
  const [passcodeInput, setPasscodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<ModalTab>('analytics');
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [leads, setLeads] = useState<LeadRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MongoDB & Cloudinary status & upload form state
  const [mongoStatus, setMongoStatus] = useState<MongoStatus | null>(null);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<{
    configured: boolean;
    cloudName: string | null;
  } | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubtitle, setUploadSubtitle] = useState('');
  const [uploadCategory, setUploadCategory] =
    useState<PortfolioProject['category']>('branding');
  const [uploadMedium, setUploadMedium] = useState('Digital Graphic Design');
  const [uploadYear, setUploadYear] = useState('2026');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadDataUrl, setUploadDataUrl] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const isAuthorizedAdmin = Boolean(ownerKey);

  const loadDashboardData = useCallback(async () => {
    if (!getSavedOwnerKey()) return;
    setLoading(true);
    setError(null);
    try {
      const [statsData, leadsData, mongoRes, cloudRes] = await Promise.all([
        fetchAdminAnalytics(),
        fetchAdminLeads(),
        fetchMongoStatus(),
        fetch('/api/cloudinary/status')
          .then((r) => r.json())
          .catch(() => ({ configured: false, cloudName: null })),
      ]);
      setAnalytics(statsData);
      setLeads(leadsData);
      setMongoStatus(mongoRes);
      setCloudinaryStatus(cloudRes);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load MongoDB analytics data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && isAuthorizedAdmin) {
      void loadDashboardData();
    }
  }, [open, isAuthorizedAdmin, loadDashboardData]);

  const maxDailyViews = useMemo(() => {
    if (!analytics?.dailyStats.length) return 1;
    return Math.max(...analytics.dailyStats.map((d) => d.views), 1);
  }, [analytics]);

  const totalTypedVisits = useMemo(() => {
    if (!analytics) return 0;
    return Object.values(analytics.visitorTypeCounts).reduce((a, b) => a + b, 0);
  }, [analytics]);

  if (!open) return null;

  const handleUnlockDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      const verifiedKey = await verifyOwnerPasscode(passcodeInput);
      setOwnerKey(verifiedKey);
      setPasscodeInput('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to verify owner passcode.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    clearSavedOwnerKey();
    setOwnerKey(null);
    setAnalytics(null);
    setLeads([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCloudinaryUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadMessage(null);

    if (!uploadDataUrl) {
      setError('Please choose an artwork image file first.');
      return;
    }
    const currentKey = getSavedOwnerKey();
    if (!currentKey) {
      setError('Please unlock the owner dashboard first.');
      return;
    }

    setUploading(true);
    try {
      const uploadResp = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-key': currentKey,
        },
        body: JSON.stringify({
          imageDataUrl: uploadDataUrl,
          filename: uploadFileName,
        }),
      });

      const uploadJson = (await uploadResp.json()) as {
        secureUrl?: string;
        thumbnailUrl?: string;
        publicId?: string;
        error?: string;
      };

      if (!uploadResp.ok || !uploadJson.secureUrl || !uploadJson.publicId) {
        throw new Error(uploadJson.error || 'Cloudinary upload failed.');
      }

      const categoryFilter = CATEGORY_FILTERS.find(
        (c) => c.id === uploadCategory
      );
      const savedProject = await saveCloudinaryPortfolioItem({
        title: uploadTitle.trim(),
        subtitle: uploadSubtitle.trim(),
        category: uploadCategory,
        categoryLabel: categoryFilter?.label || 'Design',
        year: uploadYear.trim() || '2026',
        medium: uploadMedium.trim() || 'Digital Graphic Design',
        description: uploadDescription.trim(),
        image: uploadJson.secureUrl,
        thumbnail: uploadJson.thumbnailUrl || uploadJson.secureUrl,
        cloudinaryPublicId: uploadJson.publicId,
      });

      onProjectUploaded?.(savedProject);
      setUploadTitle('');
      setUploadSubtitle('');
      setUploadDescription('');
      setUploadDataUrl(null);
      setUploadFileName('');
      setUploadMessage(
        'Uploaded to Cloudinary CDN and saved to MongoDB!'
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to upload portfolio item.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-insights-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-amber-400/25 bg-[#111116] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <h3
              id="owner-insights-title"
              className="font-display text-lg font-bold text-white sm:text-xl"
            >
              Owner Insights, Leads & Cloudinary Studio
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              MongoDB Analytics &amp; Cloudinary Media Manager for Biniyam Tilahun
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthorizedAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => void loadDashboardData()}
                  disabled={loading}
                  aria-label="Refresh analytics"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-white/10 cursor-pointer"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dashboard"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {!isAuthorizedAdmin ? (
            <form
              onSubmit={handleUnlockDashboard}
              className="mx-auto max-w-md py-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="mt-4 font-display text-lg font-semibold text-white">
                Admin Access Required
              </h4>
              <p className="mt-2 text-sm text-slate-300">
                Enter your admin password to unlock daily &amp; total viewers,
                visitor types, callback leads, and Cloudinary uploads.
              </p>

              <div className="mt-5 text-left">
                <label
                  htmlFor="owner-passcode"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Admin Password
                </label>
                <input
                  id="owner-passcode"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-60 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {authLoading ? 'Verifying...' : 'Unlock Owner Studio'}
                </span>
              </button>
            </form>
          ) : (
            <div>
              {/* Navigation Tabs */}
              <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/50 p-1.5 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer sm:text-sm ${
                    activeTab === 'analytics'
                      ? 'bg-amber-400 font-semibold text-slate-950'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Page Viewers & Types</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('leads')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer sm:text-sm ${
                    activeTab === 'leads'
                      ? 'bg-amber-400 font-semibold text-slate-950'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  <span>Received Numbers ({leads.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cloudinary')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer sm:text-sm ${
                    activeTab === 'cloudinary'
                      ? 'bg-amber-400 font-semibold text-slate-950'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Cloud className="h-4 w-4" />
                  <span>Cloudinary Upload</span>
                </button>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200"
                >
                  {error}
                </p>
              )}

              {/* TAB 1: ANALYTICS */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* MongoDB Connection Status */}
                  <div className="rounded-xl border border-white/10 bg-black/45 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Database className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="font-display text-sm font-semibold text-white">
                            MongoDB Database Connection
                          </p>
                          <p className="text-xs text-slate-400">
                            {mongoStatus?.connected
                              ? `Connected to database "${mongoStatus.database}"`
                              : mongoStatus?.configured
                                ? mongoStatus.error ||
                                  'Configured — unable to reach MongoDB cluster'
                                : 'Waiting for MONGODB_URI environment secret'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          mongoStatus?.connected
                            ? 'text-emerald-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {mongoStatus?.connected ? 'CONNECTED' : 'URI NEEDED'}
                      </span>
                    </div>

                    {!mongoStatus?.connected && (
                      <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                        Add <code className="text-amber-300">MONGODB_URI</code>{' '}
                        (e.g. your MongoDB Atlas connection string) in your{' '}
                        <code className="text-amber-300">.env</code> file or AI
                        Studio Secrets panel to persist daily viewers, visitor
                        types, leads, and Cloudinary artworks in MongoDB.
                      </p>
                    )}
                  </div>

                  {/* Top KPI Summary */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-amber-400/25 bg-black/55 p-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Eye className="h-3.5 w-3.5 text-amber-400" />
                        <span>Total Viewers</span>
                      </div>
                      <p className="mt-2 font-display text-2xl font-bold text-amber-400 tabular-nums">
                        {analytics?.totalViews ?? 0}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/55 p-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                        <span>Today’s Viewers</span>
                      </div>
                      <p className="mt-2 font-display text-2xl font-bold text-white tabular-nums">
                        {analytics?.todayViews ?? 0}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/55 p-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Users className="h-3.5 w-3.5 text-amber-400" />
                        <span>Unique Today</span>
                      </div>
                      <p className="mt-2 font-display text-2xl font-bold text-white tabular-nums">
                        {analytics?.todayUniqueVisitors ?? 0}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/55 p-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Phone className="h-3.5 w-3.5 text-amber-400" />
                        <span>Phone Leads</span>
                      </div>
                      <p className="mt-2 font-display text-2xl font-bold text-white tabular-nums">
                        {leads.length}
                      </p>
                    </div>
                  </div>

                  {/* Daily Viewers Breakdown */}
                  <div className="rounded-xl border border-white/10 bg-black/45 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-sm font-semibold text-white">
                        Daily Viewers (Last 14 Days)
                      </h4>
                      <span className="font-mono text-xs text-slate-400">
                        Total Unique: {analytics?.totalUniqueVisitors ?? 0}
                      </span>
                    </div>
                    {!analytics?.dailyStats.length ? (
                      <p className="mt-3 text-xs text-slate-400">
                        Daily viewer records will appear here as visitors open
                        your portfolio.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-2.5">
                        {analytics.dailyStats.map((day) => {
                          const widthPct = Math.round(
                            (day.views / maxDailyViews) * 100
                          );
                          return (
                            <div
                              key={day.dateKey}
                              className="grid grid-cols-12 items-center gap-3 text-xs"
                            >
                              <span className="col-span-4 font-mono text-slate-300 tabular-nums sm:col-span-3">
                                {day.dateKey}
                              </span>
                              <div className="col-span-5 h-2.5 overflow-hidden rounded-full bg-white/10 sm:col-span-6">
                                <div
                                  className="h-full rounded-full bg-amber-400"
                                  style={{ width: `${Math.max(5, widthPct)}%` }}
                                />
                              </div>
                              <span className="col-span-3 text-right font-mono text-amber-300 tabular-nums">
                                {day.views} views ({day.uniqueVisitors} uniq)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* What Type of Person Sees My Page */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <BreakdownCard
                      title="What Type of Person Visits"
                      counts={analytics?.visitorTypeCounts ?? {}}
                      total={totalTypedVisits}
                    />
                    <BreakdownCard
                      title="Traffic Sources"
                      counts={analytics?.sourceCounts ?? {}}
                      total={totalTypedVisits}
                    />
                    <BreakdownCard
                      title="Device Types"
                      counts={analytics?.deviceCounts ?? {}}
                      total={totalTypedVisits}
                    />
                    <BreakdownCard
                      title="Portfolio Interests"
                      counts={analytics?.interestCounts ?? {}}
                      total={totalTypedVisits}
                    />
                  </div>

                  {/* Recent Visitor Feed */}
                  <div className="rounded-xl border border-white/10 bg-black/45 p-4">
                    <h4 className="font-display text-sm font-semibold text-white">
                      Recent Visitors
                    </h4>
                    {!analytics?.recentVisits.length ? (
                      <p className="mt-2 text-xs text-slate-400">
                        No visits logged yet.
                      </p>
                    ) : (
                      <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                        {analytics.recentVisits.map((visit) => (
                          <div
                            key={visit.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#111116]/80 px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {visit.deviceType === 'Mobile' ? (
                                <Smartphone className="h-3.5 w-3.5 text-amber-400" />
                              ) : (
                                <Monitor className="h-3.5 w-3.5 text-amber-400" />
                              )}
                              <span className="font-semibold text-white">
                                {visit.visitorType}
                              </span>
                              <span className="text-slate-500">·</span>
                              <span className="text-slate-300">
                                {visit.sourceChannel}
                              </span>
                              <span className="text-slate-500">·</span>
                              <span className="text-amber-300">
                                {visit.interestArea}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                              {new Date(visit.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: LEADS */}
              {activeTab === 'leads' && (
                <div>
                  {leads.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/40 p-8 text-center text-sm text-slate-400">
                      No visitor phone numbers submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {leads.map((lead) => (
                        <div
                          key={lead.id}
                          className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-black/50 p-4 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono text-sm font-semibold text-amber-300 tabular-nums">
                                {lead.phone}
                              </p>
                              <span className="text-xs text-slate-500">·</span>
                              <span className="text-xs font-medium text-amber-200">
                                {lead.visitorType}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm font-medium text-white">
                              {lead.name}
                            </p>
                            {lead.note && (
                              <p className="mt-1 text-xs text-slate-300">
                                {lead.note}
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-slate-500">
                              {new Date(lead.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <a
                            href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300 shrink-0"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Call Now
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CLOUDINARY STUDIO */}
              {activeTab === 'cloudinary' && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-white/10 bg-black/45 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Cloud className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="font-display text-sm font-semibold text-white">
                            Cloudinary CDN Connection
                          </p>
                          <p className="text-xs text-slate-400">
                            {cloudinaryStatus?.configured
                              ? `Connected to cloud "${cloudinaryStatus.cloudName}"`
                              : 'Waiting for Cloudinary environment secrets'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          cloudinaryStatus?.configured
                            ? 'text-emerald-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {cloudinaryStatus?.configured
                          ? 'READY'
                          : 'SECRETS NEEDED'}
                      </span>
                    </div>

                    {!cloudinaryStatus?.configured && (
                      <p className="mt-3 text-xs leading-relaxed text-slate-300">
                        To enable direct uploads to Cloudinary, add{' '}
                        <code className="text-amber-300">
                          CLOUDINARY_CLOUD_NAME
                        </code>
                        ,{' '}
                        <code className="text-amber-300">
                          CLOUDINARY_API_KEY
                        </code>
                        , and{' '}
                        <code className="text-amber-300">
                          CLOUDINARY_API_SECRET
                        </code>{' '}
                        in your AI Studio Secrets panel. Uploaded works
                        automatically publish to MongoDB and appear in your
                        gallery.
                      </p>
                    )}
                  </div>

                  {uploadMessage && (
                    <p
                      role="status"
                      className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-200"
                    >
                      {uploadMessage}
                    </p>
                  )}

                  <form
                    onSubmit={handleCloudinaryUpload}
                    className="space-y-4 rounded-xl border border-white/10 bg-black/45 p-4 sm:p-5"
                  >
                    <h4 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
                      <ImagePlus className="h-4 w-4 text-amber-400" />
                      <span>Upload New Artwork via Cloudinary</span>
                    </h4>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="cloud-title"
                          className="mb-1 block text-xs font-medium text-slate-300"
                        >
                          Project Title *
                        </label>
                        <input
                          id="cloud-title"
                          type="text"
                          required
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          placeholder="e.g. Abyssinia Heritage Logo"
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="cloud-subtitle"
                          className="mb-1 block text-xs font-medium text-slate-300"
                        >
                          Subtitle *
                        </label>
                        <input
                          id="cloud-subtitle"
                          type="text"
                          required
                          value={uploadSubtitle}
                          onChange={(e) => setUploadSubtitle(e.target.value)}
                          placeholder="e.g. Brand Identity & Packaging"
                          className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="cloud-category"
                          className="mb-1 block text-xs font-medium text-slate-300"
                        >
                          Category *
                        </label>
                        <select
                          id="cloud-category"
                          value={uploadCategory}
                          onChange={(e) =>
                            setUploadCategory(
                              e.target.value as PortfolioProject['category']
                            )
                          }
                          className="w-full rounded-xl border border-white/15 bg-black/80 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                        >
                          <option value="branding">Logos & Identity</option>
                          <option value="book-covers">Book Covers</option>
                          <option value="posters">Posters</option>
                          <option value="print-merch">Print & Merch</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label
                            htmlFor="cloud-medium"
                            className="mb-1 block text-xs font-medium text-slate-300"
                          >
                            Medium *
                          </label>
                          <input
                            id="cloud-medium"
                            type="text"
                            required
                            value={uploadMedium}
                            onChange={(e) => setUploadMedium(e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="cloud-year"
                            className="mb-1 block text-xs font-medium text-slate-300"
                          >
                            Year *
                          </label>
                          <input
                            id="cloud-year"
                            type="text"
                            required
                            value={uploadYear}
                            onChange={(e) => setUploadYear(e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 font-mono text-sm text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="cloud-desc"
                        className="mb-1 block text-xs font-medium text-slate-300"
                      >
                        Description *
                      </label>
                      <textarea
                        id="cloud-desc"
                        required
                        rows={2}
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        placeholder="Brief design story and production notes..."
                        className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 hover:border-amber-400/40 hover:bg-white/10">
                        <Upload className="h-4 w-4 text-amber-400" />
                        <span>
                          {uploadFileName || 'Choose Artwork Image (PNG/JPG/WebP)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={uploading || !cloudinaryStatus?.configured}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Cloud className="h-4 w-4" />
                        <span>
                          {uploading
                            ? 'Uploading to Cloudinary...'
                            : 'Publish Artwork'}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
