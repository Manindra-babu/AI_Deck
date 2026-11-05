import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Send,
  RefreshCw,
  ExternalLink,
  Cpu,
  Sparkles,
  GitBranch,
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DailyReport } from '../types';
import { apiFetch } from '../api/client';
import { VerificationBadge } from '../components/VerificationBadge';
import { EmptyState } from '../components/EmptyState';

export const IntelligenceBrief: React.FC = () => {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [reportHistory, setReportHistory] = useState<{ id: string; report_date: string; total_articles_analyzed: number }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadLatestReport = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ report: DailyReport | null }>(`/reports/latest`);
      if (data.report) {
        setReport(data.report);
        setSelectedDate(data.report.report_date);
      } else {
        setReport(null);
      }
      
      const historyList = await apiFetch<any[]>('/reports?limit=15');
      setReportHistory(historyList);
    } catch (err: any) {
      console.error('Failed to load report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLatestReport();
  }, []);

  const handleSelectDate = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsLoading(true);
    try {
      const data = await apiFetch<{ report: DailyReport }>(`/reports/${dateStr}`);
      setReport(data.report);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to fetch report for date.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setActionMessage(null);
    try {
      const res = await apiFetch<{ success: boolean; message: string; report_date: string }>('/reports/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setActionMessage({ type: 'success', text: res.message });
      await loadLatestReport();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to generate report.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!report) return;
    setIsSendingEmail(true);
    setActionMessage(null);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(`/reports/${report.id}/send-email`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setActionMessage({ type: 'success', text: res.message || 'Email successfully sent via Hostinger SMTP!' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to send email. Check SMTP settings.' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Operational Controls */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-primary-accent rounded border border-blue-200 uppercase tracking-wider">
              Daily Intelligence Synthesis
            </span>
            <span className="text-xs text-secondary-text">07:00 AM IST Scheduled Delivery</span>
          </div>
          <h1 className="text-lg font-bold text-primary-text">AI Intelligence Brief</h1>
          <p className="text-xs text-secondary-text">
            Fact-grounded daily intelligence executive synthesis curated from verified incoming feeds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {reportHistory.length > 0 && (
            <select
              value={selectedDate}
              onChange={(e) => handleSelectDate(e.target.value)}
              className="text-xs border border-border rounded px-2.5 py-1.5 bg-white text-primary-text focus:outline-none focus:ring-1 focus:ring-primary-accent"
            >
              {reportHistory.map((h) => (
                <option key={h.id} value={h.report_date}>
                  {h.report_date} ({h.total_articles_analyzed} sources)
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-primary-accent bg-blue-50 border border-blue-200 hover:bg-blue-100 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating...' : 'Synthesize Now'}</span>
          </button>

          {report && (
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-primary-accent hover:bg-primary-accent-hover transition shadow-sm"
            >
              <Send className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-pulse' : ''}`} />
              <span>{isSendingEmail ? 'Sending...' : 'Dispatch Email'}</span>
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded text-xs border flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="bg-surface border border-border rounded-md p-8 text-center text-xs text-secondary-text">
          Loading intelligence brief...
        </div>
      ) : !report ? (
        <EmptyState
          icon={FileText}
          title="No Daily Brief Generated Yet"
          description="Synthesize verified articles currently in the database to generate today's comprehensive intelligence report."
          actionText="Generate Today's Brief"
          onAction={handleGenerateReport}
        />
      ) : (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-surface border border-border rounded-md p-6 shadow-subtle">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <div className="flex items-center gap-2 text-xs text-secondary-text">
                <Calendar className="w-4 h-4 text-primary-accent" />
                <span className="font-semibold text-primary-text">{report.report_date}</span>
                <span>&bull;</span>
                <span>{report.total_articles_analyzed} primary sources verified</span>
              </div>
              <span className="text-[11px] text-muted-text">
                Generated at {report.generated_at ? new Date(report.generated_at).toLocaleTimeString() : '07:00 IST'}
              </span>
            </div>

            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Executive Synthesis
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-line">
              {report.executive_summary}
            </p>
          </div>

          {/* Top Developments Section */}
          <div className="bg-surface border border-border rounded-md p-6 shadow-subtle">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-accent" />
              <span>Top Developments of the Day</span>
            </h3>

            {(report.top_developments || []).length === 0 ? (
              <p className="text-xs text-secondary-text">No top developments classified for this date.</p>
            ) : (
              <div className="space-y-4">
                {report.top_developments.map((dev, idx) => (
                  <div
                    key={idx}
                    className="border-l-2 border-primary-accent bg-slate-50/50 p-4 rounded-r border-t border-r border-b border-border"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-900">{dev.source_name}</span>
                      <span className="text-slate-300">&bull;</span>
                      <VerificationBadge status={dev.verification_status} />
                    </div>

                    <h4 className="text-sm font-bold text-primary-text mb-2">
                      <a
                        href={dev.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary-accent inline-flex items-baseline gap-1"
                      >
                        <span>{dev.headline}</span>
                        <ExternalLink className="w-3 h-3 text-secondary-text" />
                      </a>
                    </h4>

                    <p className="text-xs text-slate-700 leading-relaxed mb-3 font-sans">
                      {dev.what_happened}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <strong className="text-primary-accent block font-medium mb-0.5">Why it matters:</strong>
                        <span className="text-slate-700">{dev.why_it_matters}</span>
                      </div>
                      {dev.technical_implications && (
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <strong className="text-slate-800 block font-medium mb-0.5">Technical Implications:</strong>
                          <span className="text-slate-700">{dev.technical_implications}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Releases & Research Breakthroughs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Releases */}
            <div className="bg-surface border border-border rounded-md p-5 shadow-subtle">
              <h3 className="text-xs font-bold text-primary-text uppercase tracking-wide mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Tracked Model Releases</span>
              </h3>
              {(report.model_releases || []).length === 0 ? (
                <p className="text-xs text-secondary-text py-2">No new model releases recorded for this period.</p>
              ) : (
                <div className="space-y-3">
                  {report.model_releases.map((m, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-primary-text">{m.model_name}</span>
                        <span className="text-[11px] font-medium text-secondary-text">{m.organization}</span>
                      </div>
                      <p className="text-slate-600 text-xs mb-2 leading-relaxed">{m.details}</p>
                      <a
                        href={m.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-accent hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        <span>Official Announcement</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Research Breakthroughs */}
            <div className="bg-surface border border-border rounded-md p-5 shadow-subtle">
              <h3 className="text-xs font-bold text-primary-text uppercase tracking-wide mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Research Breakthroughs</span>
              </h3>
              {(report.research_breakthroughs || []).length === 0 ? (
                <p className="text-xs text-secondary-text py-2">No research breakthroughs highlighted for this period.</p>
              ) : (
                <div className="space-y-3">
                  {report.research_breakthroughs.map((r, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                      <h5 className="font-bold text-primary-text mb-1">
                        <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-accent">
                          {r.title}
                        </a>
                      </h5>
                      <p className="text-slate-600 text-xs mb-2 leading-relaxed">{r.significance}</p>
                      <a
                        href={r.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-accent hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        <span>Read Paper</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Emerging Trends Section */}
          {(report.emerging_trends || []).length > 0 && (
            <div className="bg-surface border border-border rounded-md p-5 shadow-subtle">
              <h3 className="text-xs font-bold text-primary-text uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Emerging Industry & Technical Trends</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.emerging_trends.map((t, idx) => (
                  <div key={idx} className="p-3 rounded border border-slate-200 bg-white text-xs">
                    <span className="font-bold text-primary-text block mb-1">{t.trend}</span>
                    <p className="text-slate-600 text-xs mb-2 leading-relaxed">
                      <strong>Observed Evidence:</strong> {t.evidence}
                    </p>
                    <p className="text-slate-700 text-xs">
                      <strong>Significance:</strong> {t.significance}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
