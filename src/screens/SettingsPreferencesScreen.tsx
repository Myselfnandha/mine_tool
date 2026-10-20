import React from 'react';
import { UserSettings } from '../types';

interface SettingsPreferencesScreenProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onClose: () => void;
  onResetDefaults: () => void;
  onExportData: () => void;
}

export const SettingsPreferencesScreen: React.FC<SettingsPreferencesScreenProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onResetDefaults,
  onExportData,
}) => {
  const toggleField = (key: keyof UserSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
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

      {/* Sync & Cloud Configuration */}
      <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-card space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-primary">cloud_sync</span>
          <span>Sync & Backend Strategy</span>
        </h3>
        <p className="text-xs text-on-surface-variant">
          Mine Notes runs 100% offline-first. Optionally select an asynchronous processing worker:
        </p>

        <div className="space-y-2 pt-1 text-xs">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low cursor-pointer">
            <input
              type="radio"
              name="sync_mode"
              checked={settings.offlineSyncMode === 'local_only'}
              onChange={() => onUpdateSettings({ ...settings, offlineSyncMode: 'local_only' })}
              className="accent-primary"
            />
            <div>
              <p className="font-medium text-on-surface">100% Local SQLite / IndexedDB (Recommended)</p>
              <p className="text-outline">No network requests. Zero tracking. Instantaneous reads & writes.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low cursor-pointer">
            <input
              type="radio"
              name="sync_mode"
              checked={settings.offlineSyncMode === 'huggingface_space'}
              onChange={() => onUpdateSettings({ ...settings, offlineSyncMode: 'huggingface_space' })}
              className="accent-primary"
            />
            <div>
              <p className="font-medium text-on-surface">HuggingFace Spaces (Free classification fallback)</p>
              <p className="text-outline">Asynchronously queries a free HF Space when unlisted URLs arrive.</p>
            </div>
          </label>
        </div>
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
