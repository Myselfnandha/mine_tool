import React, { useState } from 'react';
import { UserSettings } from '../types';
import { SyncEngine, DEFAULT_HF_SPACE_URL, DEFAULT_HF_DATASET_REPO } from '../modules/sync/syncEngine';

interface SettingsPreferencesScreenProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onClose: () => void;
  onResetDefaults: () => void;
  onExportData: () => void;
  onTriggerSync?: () => Promise<any>;
}

export const SettingsPreferencesScreen: React.FC<SettingsPreferencesScreenProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onResetDefaults,
  onExportData,
  onTriggerSync,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const toggleField = (key: keyof UserSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await SyncEngine.testConnection(settings.hfDatasetRepo, settings.hfAccessToken);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      if (onTriggerSync) {
        await onTriggerSync();
      } else {
        await SyncEngine.sync({ force: true });
      }
      setSyncFeedback('Synchronization complete. Vault is up to date.');
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/60">
        <div>
          <h2 className="font-display text-2xl font-normal text-on-surface">Settings & Preferences</h2>
          <p className="text-xs text-on-surface-variant font-sans mt-0.5">
            Crafted for calm, unhurried knowledge architecture.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Typography Configuration */}
      <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-card space-y-4">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">format_size</span>
            <span>Typographic Cadence</span>
          </h3>
          <p className="text-xs text-on-surface-variant">
            Choose your preferred body and headline typeface combination.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => onUpdateSettings({ ...settings, typographyFamily: 'Newsreader' })}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              settings.typographyFamily === 'Newsreader'
                ? 'border-primary bg-primary-fixed/20 ring-1 ring-primary'
                : 'border-outline-variant/50 hover:bg-surface-container-low'
            }`}
          >
            <p className="font-display text-lg text-on-surface">Newsreader + Inter</p>
            <p className="text-xs text-outline font-sans mt-1">
              Warm editorial book serif with mechanical Swiss UI numerals.
            </p>
          </button>

          <button
            onClick={() => onUpdateSettings({ ...settings, typographyFamily: 'Inter' })}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              settings.typographyFamily === 'Inter'
                ? 'border-primary bg-primary-fixed/20 ring-1 ring-primary'
                : 'border-outline-variant/50 hover:bg-surface-container-low'
            }`}
          >
            <p className="font-sans font-semibold text-base text-on-surface">Inter Monospace & Pure Sans</p>
            <p className="text-xs text-outline font-sans mt-1">
              High-density structural technical documentation layout.
            </p>
          </button>
        </div>
      </section>

      {/* Theme & Automatic Time-Based Mode */}
      <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-card space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">brightness_auto</span>
              <span>Theme & Lighting Cadence</span>
            </h3>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-primary-fixed/40 text-on-primary-fixed font-medium">
              {settings.themeMode === 'auto'
                ? 'Auto Time Active (6am–6pm Light, 6pm–6am Dark)'
                : settings.themeMode === 'dark' ? 'Always Dark' : 'Always Light'}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Automatic time mode dynamically syncs with the sun: warm paper vellum by day, deep charcoal slate by night.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={() => onUpdateSettings({ ...settings, themeMode: 'auto' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.themeMode === 'auto'
                ? 'border-primary bg-primary-fixed/20 ring-1 ring-primary'
                : 'border-outline-variant/50 hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
              <p className="text-sm font-semibold text-on-surface">Auto (Time-Based)</p>
            </div>
            <p className="text-[11px] text-outline font-sans">
              Light 6am–6pm, Dark 6pm–6am automatically.
            </p>
          </button>

          <button
            onClick={() => onUpdateSettings({ ...settings, themeMode: 'light' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.themeMode === 'light'
                ? 'border-primary bg-primary-fixed/20 ring-1 ring-primary'
                : 'border-outline-variant/50 hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[18px] text-amber-600">light_mode</span>
              <p className="text-sm font-semibold text-on-surface">Always Light</p>
            </div>
            <p className="text-[11px] text-outline font-sans">
              Archival stone vellum paper tone.
            </p>
          </button>

          <button
            onClick={() => onUpdateSettings({ ...settings, themeMode: 'dark' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.themeMode === 'dark'
                ? 'border-primary bg-primary-fixed/20 ring-1 ring-primary'
                : 'border-outline-variant/50 hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[18px] text-indigo-400">dark_mode</span>
              <p className="text-sm font-semibold text-on-surface">Always Dark</p>
            </div>
            <p className="text-[11px] text-outline font-sans">
              Deep charcoal slate reading surface.
            </p>
          </button>
        </div>
      </section>

      {/* Feature Module Toggles */}
      <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-card space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-primary">toggle_on</span>
          <span>Module Integrations</span>
        </h3>

        <div className="space-y-3.5 divide-y divide-surface-container-low text-xs">
          {/* Zero confirmation link saving */}
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5 pr-4">
              <p className="font-medium text-on-surface">Zero-Confirmation Link Saving</p>
              <p className="text-outline">
                Immediately classify and folder shared URLs without modal confirmation interruptions.
              </p>
            </div>
            <button
              onClick={() => toggleField('saveWithoutConfirmation')}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.saveWithoutConfirmation ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  settings.saveWithoutConfirmation ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          {/* Auto domain categorization */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 pr-4">
              <p className="font-medium text-on-surface">Automatic Domain Folders</p>
              <p className="text-outline">
                Group incoming web resources automatically by domain (e.g. GitHub → Code, Arxiv → Papers).
              </p>
            </div>
            <button
              onClick={() => toggleField('autoCategorizeLinks')}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.autoCategorizeLinks ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  settings.autoCategorizeLinks ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          {/* Android widget bridge */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 pr-4">
              <p className="font-medium text-on-surface">Android Widget Background Receiver</p>
              <p className="text-outline">
                Enables taking thoughts and voice memos from the Android home screen with zero window overhead.
              </p>
            </div>
            <button
              onClick={() => toggleField('enableAndroidWidgetBridge')}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.enableAndroidWidgetBridge ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  settings.enableAndroidWidgetBridge ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          {/* Voice memos */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 pr-4">
              <p className="font-medium text-on-surface">Voice Memo Audio Waveform Capsules</p>
              <p className="text-outline">
                Attach tactile microphone recordings directly into longform notes.
              </p>
            </div>
            <button
              onClick={() => toggleField('enableVoiceMemo')}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.enableVoiceMemo ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  settings.enableVoiceMemo ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>
        </div>
      </section>

      {/* Sync & Hugging Face Server Configuration */}
      <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">cloud_sync</span>
              <span>Hugging Face Space Cloud Sync</span>
            </h3>
            <p className="text-xs text-on-surface-variant">
              Stable offline-first architecture with 24/7 background REST synchronization.
            </p>
          </div>
          {settings.lastSyncedAt && (
            <span className="text-[11px] font-mono text-outline">
              Last synced: {new Date(settings.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Sync Mode Radio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
          <label
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              settings.offlineSyncMode === 'huggingface_space'
                ? 'border-primary bg-primary-fixed/20 ring-1 ring-primary'
                : 'border-outline-variant/40 hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="sync_mode"
                checked={settings.offlineSyncMode === 'huggingface_space'}
                onChange={() => onUpdateSettings({ ...settings, offlineSyncMode: 'huggingface_space' })}
                className="mt-0.5 accent-primary"
              />
              <div>
                <p className="font-semibold text-on-surface">Hugging Face Space (Default Sync)</p>
                <p className="text-[11px] text-outline mt-0.5">
                  Offline-first with bidirectional REST sync to your 24/7 Hugging Face Server.
                </p>
              </div>
            </div>
          </label>

          <label
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              settings.offlineSyncMode === 'local_only'
                ? 'border-primary bg-primary-fixed/20 ring-1 ring-primary'
                : 'border-outline-variant/40 hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="sync_mode"
                checked={settings.offlineSyncMode === 'local_only'}
                onChange={() => onUpdateSettings({ ...settings, offlineSyncMode: 'local_only' })}
                className="mt-0.5 accent-primary"
              />
              <div>
                <p className="font-semibold text-on-surface">100% Local Vault Only</p>
                <p className="text-[11px] text-outline mt-0.5">
                  Zero cloud communication. Changes stored strictly in on-device storage.
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Hugging Face Server Details (shown if HF mode active) */}
        {settings.offlineSyncMode === 'huggingface_space' && (
          <div className="space-y-3.5 pt-2 border-t border-surface-container-high/60">
            {/* Cloud Dataset Vault Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-on-surface">
                  Hugging Face Cloud Dataset Vault
                </label>
                <a
                  href={`https://huggingface.co/datasets/${settings.hfDatasetRepo || DEFAULT_HF_DATASET_REPO}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                >
                  <span>Open Hub Dataset</span>
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                </a>
              </div>
              <input
                type="text"
                value={settings.hfDatasetRepo || DEFAULT_HF_DATASET_REPO}
                onChange={(e) => onUpdateSettings({ ...settings, hfDatasetRepo: e.target.value })}
                placeholder="nandhaalagesan248/mine-notes-vault"
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
              />
              <p className="text-[10px] text-outline">
                Shared persistent cloud JSON vault. Both the Android APK and web space read and commit to this repository.
              </p>
            </div>

            {/* Server URL Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-on-surface">
                  Hugging Face Space Web URL
                </label>
                {settings.hfServerUrl !== DEFAULT_HF_SPACE_URL && (
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, hfServerUrl: DEFAULT_HF_SPACE_URL })}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Reset to Default Space
                  </button>
                )}
              </div>
              <input
                type="url"
                value={settings.hfServerUrl || DEFAULT_HF_SPACE_URL}
                onChange={(e) => onUpdateSettings({ ...settings, hfServerUrl: e.target.value })}
                placeholder="https://nandhaalagesan248-mine-notes.static.hf.space"
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Optional Access Token */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-on-surface flex items-center justify-between">
                <span>Hugging Face Access Token (Optional)</span>
                <span className="text-[10px] text-outline font-normal">Only required for private spaces</span>
              </label>
              <input
                type="password"
                value={settings.hfAccessToken || ''}
                onChange={(e) => onUpdateSettings({ ...settings, hfAccessToken: e.target.value })}
                placeholder="hf_..."
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Auto-Sync Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5 pr-4">
                <p className="text-xs font-medium text-on-surface">Automatic Background Synchronization</p>
                <p className="text-[11px] text-outline">
                  Debounce-syncs local mutations and synchronizes upon network reconnect.
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleField('autoSyncEnabled')}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  settings.autoSyncEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                    settings.autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>

            {/* Test Connection & Sync Now Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border border-outline-variant/50 transition-colors disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isTesting ? 'animate-spin' : ''}`}>
                  {isTesting ? 'sync' : 'network_check'}
                </span>
                <span>{isTesting ? 'Pinging Server...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleManualSyncNow}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-medium shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isSyncing ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>{isSyncing ? 'Synchronizing...' : 'Sync Vault Now'}</span>
              </button>
            </div>

            {/* Test Feedback Alert */}
            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {testResult.success ? 'check_circle' : 'error'}
                </span>
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Manual Sync Feedback */}
            {syncFeedback && (
              <div className="p-3 rounded-lg text-xs flex items-center gap-2 bg-primary-fixed/20 border border-primary/30 text-primary">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>{syncFeedback}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Data Management & Export */}
      <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-card space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-primary">folder_zip</span>
          <span>Data Export & Reset</span>
        </h3>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onExportData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium border border-outline-variant/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Archive JSON</span>
          </button>

          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium border border-red-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>Flush All Data (Clean Slate)</span>
          </button>
        </div>
      </section>
    </div>
  );
};
