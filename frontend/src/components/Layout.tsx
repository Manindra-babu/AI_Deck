import React, { useState } from 'react';
import {
  Radar,
  LayoutDashboard,
  FileText,
  Compass,
  Cpu,
  GraduationCap,
  Rss,
  Settings,
  RefreshCw,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  syncStatus?: {
    last_collection: string | null;
    collection_status: string;
    last_articles_found: number;
    next_scheduled_brief: string;
    timezone: string;
  };
  totalArticlesCount?: number;
  onRefreshAll?: () => Promise<void>;
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({
  currentTab,
  setCurrentTab,
  syncStatus,
  totalArticlesCount = 0,
  onRefreshAll,
  children,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualTrigger = async () => {
    if (!onRefreshAll || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Intelligence Dashboard', icon: LayoutDashboard },
    { id: 'brief', label: 'AI Intelligence Brief', icon: FileText },
    { id: 'news', label: 'News Explorer', icon: Compass },
    { id: 'models', label: 'AI Models Tracker', icon: Cpu },
    { id: 'research', label: 'Research Radar', icon: GraduationCap },
    { id: 'sources', label: 'Source Management', icon: Rss },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-primary-text">
      {/* Top Professional Header */}
      <header className="sticky top-0 z-30 bg-surface border-b border-border shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-accent flex items-center justify-center text-white shadow-sm">
              <Radar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-primary-text tracking-tight">AI Intelligence Radar</span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-primary-accent-subtle text-primary-accent rounded border border-blue-200">
                  Live
                </span>
              </div>
              <p className="text-xs text-secondary-text hidden sm:block">Automated Real-Time AI News & Research Intelligence</p>
            </div>
          </div>

          {/* Sync & Operational Indicators */}
          <div className="flex items-center gap-3 text-xs">
            {syncStatus && (
              <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-border px-3 py-1.5 rounded text-secondary-text">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span>
                    <strong className="text-primary-text font-semibold">{totalArticlesCount}</strong> verified articles
                  </span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5" title="Next automated Daily Brief delivery">
                  <Clock className="w-3.5 h-3.5 text-primary-accent" />
                  <span>Brief: <strong className="text-primary-text font-medium">07:00 AM IST</strong></span>
                </div>
              </div>
            )}

            {/* Run Ingestion Action */}
            <button
              onClick={handleManualTrigger}
              disabled={isRefreshing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-primary-accent hover:bg-primary-accent-hover transition shadow-sm ${
                isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing Feeds...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-1 scrollbar-none" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium rounded-t-md border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? 'border-primary-accent text-primary-accent bg-blue-50/40 font-semibold'
                      : 'border-transparent text-secondary-text hover:text-primary-text hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-accent' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Professional Footer */}
      <footer className="bg-surface border-t border-border mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-secondary-text gap-2">
          <div>
            AI Intelligence Radar &bull; Factual verification, zero synthetic hallucinations.
          </div>
          <div className="flex items-center gap-4">
            <span>Daily Report scheduled at 07:00 AM IST</span>
            <span>&bull;</span>
            <span>Hostinger SMTP Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
