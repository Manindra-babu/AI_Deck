import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Mail,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Save,
  Send,
  ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../api/client';
import { SystemHealth } from '../types';

export const Settings: React.FC = () => {
  const [settingsData, setSettingsData] = useState<any | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');

  const [smtpHost, setSmtpHost] = useState('smtp.hostinger.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpUseSsl, setSmtpUseSsl] = useState(true);
  const [emailRecipient, setEmailRecipient] = useState('');

  const [dailyReportHour, setDailyReportHour] = useState(7);
  const [dailyReportMinute, setDailyReportMinute] = useState(0);
  const [collectionInterval, setCollectionInterval] = useState(15);

  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettingsAndHealth = async () => {
    setIsLoading(true);
    try {
      const s = await apiFetch<any>('/settings');
      setSettingsData(s);
      setGeminiModel(s.gemini?.model || 'gemini-2.5-flash');
      setSmtpHost(s.smtp?.host || 'smtp.hostinger.com');
      setSmtpPort(s.smtp?.port || 465);
      setSmtpUsername(s.smtp?.username || '');
      setSmtpUseSsl(s.smtp?.use_ssl ?? true);
      setEmailRecipient(s.smtp?.recipient || '');
      setDailyReportHour(s.schedule?.daily_report_hour ?? 7);
      setDailyReportMinute(s.schedule?.daily_report_minute ?? 0);
      setCollectionInterval(s.schedule?.collection_interval_minutes ?? 15);

      const h = await apiFetch<SystemHealth>('/settings/health');
      setSystemHealth(h);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsAndHealth();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const payload: any = {
        gemini_model: geminiModel,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_username: smtpUsername,
        smtp_use_ssl: smtpUseSsl,
        email_recipient: emailRecipient,
        daily_report_hour: Number(dailyReportHour),
        daily_report_minute: Number(dailyReportMinute),
        collection_interval_minutes: Number(collectionInterval),
      };

      if (geminiApiKey.trim()) {
        payload.gemini_api_key = geminiApiKey.trim();
      }
      if (smtpPassword.trim()) {
        payload.smtp_password = smtpPassword.trim();
      }

      await apiFetch('/settings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setStatusMessage({ type: 'success', text: 'Application settings successfully updated!' });
      setGeminiApiKey('');
      setSmtpPassword('');
      await loadSettingsAndHealth();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setStatusMessage(null);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/settings/test-smtp', {
        method: 'POST',
        body: JSON.stringify({
          smtp_host: smtpHost,
          smtp_port: Number(smtpPort),
          smtp_username: smtpUsername,
          smtp_password: smtpPassword,
          smtp_use_ssl: smtpUseSsl,
        }),
      });
      setStatusMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'SMTP Connection Test Failed.' });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-subtle">
        <h1 className="text-lg font-bold text-primary-text">System Configuration & Integrations</h1>
        <p className="text-xs text-secondary-text">
          Manage Gemini intelligence API keys, Hostinger SMTP authentication, automated 07:00 AM IST email schedules, and real-time health diagnostics.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded text-xs border flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* System Health Diagnostics Card */}
      {systemHealth && (
        <div className="bg-surface border border-border rounded-md p-5 shadow-subtle">
          <h2 className="text-xs font-bold text-primary-text uppercase tracking-wide mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Operational Diagnostic Health</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-border rounded">
              <span className="text-[11px] text-secondary-text block mb-1">Database Engine</span>
              <div className="font-bold text-primary-text flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-primary-accent" />
                <span>{systemHealth.database.url_type} ({systemHealth.database.status})</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-border rounded">
              <span className="text-[11px] text-secondary-text block mb-1">Gemini Intelligence API</span>
              <div className="font-bold text-primary-text flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>{systemHealth.gemini_api.status}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-border rounded">
              <span className="text-[11px] text-secondary-text block mb-1">Hostinger SMTP Delivery</span>
              <div className="font-bold text-primary-text flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-700" />
                <span>{systemHealth.smtp.configured ? 'Configured' : 'Credentials Missing'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-border rounded">
              <span className="text-[11px] text-secondary-text block mb-1">Last Ingestion Run</span>
              <div className="font-bold text-primary-text flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{systemHealth.last_collection.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Gemini API Section */}
        <div className="bg-surface border border-border rounded-md p-5 shadow-subtle space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary-accent" />
              <h2 className="text-sm font-bold text-primary-text uppercase tracking-wide">
                Gemini API Intelligence Engine
              </h2>
            </div>
            {settingsData?.gemini?.is_configured && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Key Configured ({settingsData.gemini.masked_key})</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-secondary-text font-medium mb-1">
                Gemini API Key (Leave blank to keep existing)
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter new Gemini API key..."
                className="w-full border border-border rounded px-3 py-2 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
              />
              <span className="text-[11px] text-muted-text mt-1 block">
                Never exposed to the client interface. Saved securely in backend environment.
              </span>
            </div>

            <div>
              <label className="block text-secondary-text font-medium mb-1">Gemini Model Identifier</label>
              <input
                type="text"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                placeholder="e.g. gemini-2.5-flash or gemini-1.5-flash"
                className="w-full border border-border rounded px-3 py-2 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent font-mono"
              />
            </div>
          </div>
        </div>

        {/* Hostinger SMTP Configuration Section */}
        <div className="bg-surface border border-border rounded-md p-5 shadow-subtle space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary-accent" />
              <h2 className="text-sm font-bold text-primary-text uppercase tracking-wide">
                Hostinger SMTP Email Delivery
              </h2>
            </div>
            <span className="text-xs text-secondary-text">Used for 07:00 AM IST Daily Brief dispatch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-secondary-text font-medium mb-1">SMTP Host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.hostinger.com"
                className="w-full border border-border rounded px-3 py-2 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
              />
            </div>

            <div>
              <label className="block text-secondary-text font-medium mb-1">SMTP Port</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                placeholder="465"
                className="w-full border border-border rounded px-3 py-2 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
              />
            </div>

            <div>
              <label className="block text-secondary-text font-medium mb-1">Security</label>
              <select
                value={smtpUseSsl ? 'ssl' : 'tls'}
                onChange={(e) => setSmtpUseSsl(e.target.value === 'ssl')}
                className="w-full border border-border rounded px-3 py-2 bg-white text-primary-text"
              >
                <option value="ssl">SSL (Port 465 - Hostinger Recommended)</option>
                <option value="tls">STARTTLS (Port 587)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-secondary-text font-medium mb-1">SMTP Username / Sender Address</label>
              <input
                type="email"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                placeholder="news@yourdomain.com"
                className="w-full border border-border rounded px-3 py-2 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
              />
            </div>

            <div>
              <label className="block text-secondary-text font-medium mb-1">
                SMTP Password (Leave blank to keep existing)
              </label>
              <input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder="Hostinger mailbox password..."
                className="w-full border border-border rounded px-3 py-2 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-secondary-text font-medium mb-1">Daily Intelligence Report Recipient</label>
            <input
              type="email"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full border border-border rounded px-3 py-2 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
            />
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={isTestingSmtp || !smtpUsername || !smtpPassword}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
            >
              <Send className={`w-3.5 h-3.5 ${isTestingSmtp ? 'animate-pulse' : ''}`} />
              <span>{isTestingSmtp ? 'Testing Authentication...' : 'Test SMTP Credentials'}</span>
            </button>
          </div>
        </div>

        {/* Schedule & Polling Configuration */}
        <div className="bg-surface border border-border rounded-md p-5 shadow-subtle space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-accent" />
              <h2 className="text-sm font-bold text-primary-text uppercase tracking-wide">
                Automation & Daily Dispatch Schedule
              </h2>
            </div>
            <span className="text-xs font-semibold text-primary-accent">Timezone: Asia/Kolkata (IST)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-secondary-text font-medium mb-1">Daily Brief Hour (IST)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={dailyReportHour}
                onChange={(e) => setDailyReportHour(Number(e.target.value))}
                className="w-full border border-border rounded px-3 py-2 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
              />
              <span className="text-[11px] text-muted-text mt-1 block">Default: 7 (07:00 AM IST)</span>
            </div>

            <div>
              <label className="block text-secondary-text font-medium mb-1">Daily Brief Minute</label>
              <input
                type="number"
                min="0"
                max="59"
                value={dailyReportMinute}
                onChange={(e) => setDailyReportMinute(Number(e.target.value))}
                className="w-full border border-border rounded px-3 py-2 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
              />
              <span className="text-[11px] text-muted-text mt-1 block">Default: 0</span>
            </div>

            <div>
              <label className="block text-secondary-text font-medium mb-1">RSS Polling Interval (Minutes)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={collectionInterval}
                onChange={(e) => setCollectionInterval(Number(e.target.value))}
                className="w-full border border-border rounded px-3 py-2 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
              />
              <span className="text-[11px] text-muted-text mt-1 block">Default: 15 minutes</span>
            </div>
          </div>
        </div>

        {/* Save Settings Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-accent hover:bg-primary-accent-hover text-white rounded font-semibold text-xs transition shadow-sm"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving Configurations...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
