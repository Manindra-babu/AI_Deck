import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { IntelligenceBrief } from './pages/IntelligenceBrief';
import { NewsExplorer } from './pages/NewsExplorer';
import { ModelsTracker } from './pages/ModelsTracker';
import { ResearchRadar } from './pages/ResearchRadar';
import { SourceManagement } from './pages/SourceManagement';
import { Settings } from './pages/Settings';
import { apiFetch } from './api/client';
import { DashboardSummary } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<DashboardSummary>('/dashboard/summary');
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleRefreshAll = async () => {
    try {
      await apiFetch('/settings/trigger-collection', { method: 'POST' });
      await fetchSummary();
    } catch (err) {
      console.error('Failed to sync feeds:', err);
    }
  };

  const handleToggleBookmark = async (articleId: string) => {
    try {
      await apiFetch(`/articles/${articleId}/bookmark`, { method: 'PATCH' });
      await fetchSummary();
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleToggleRead = async (articleId: string) => {
    try {
      await apiFetch(`/articles/${articleId}/read`, { method: 'PATCH' });
      await fetchSummary();
    } catch (err) {
      console.error('Failed to toggle read:', err);
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      syncStatus={summary?.sync_status}
      totalArticlesCount={summary?.metrics?.total_articles ?? 0}
      onRefreshAll={handleRefreshAll}
    >
      {currentTab === 'dashboard' && (
        <Dashboard
          summary={summary}
          isLoading={isLoading}
          onNavigateTab={setCurrentTab}
          onToggleBookmark={handleToggleBookmark}
          onToggleRead={handleToggleRead}
        />
      )}
      {currentTab === 'brief' && <IntelligenceBrief />}
      {currentTab === 'news' && <NewsExplorer />}
      {currentTab === 'models' && <ModelsTracker />}
      {currentTab === 'research' && <ResearchRadar />}
      {currentTab === 'sources' && <SourceManagement />}
      {currentTab === 'settings' && <Settings />}
    </Layout>
  );
};

export default App;
