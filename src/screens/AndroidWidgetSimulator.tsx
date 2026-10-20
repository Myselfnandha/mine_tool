import React, { useState } from 'react';
import { WidgetBridge, WidgetCapturePayload } from '../modules/widget/widgetBridge';
import { Note } from '../types';

interface AndroidWidgetSimulatorProps {
  onWidgetCaptured: (message: string) => void;
  recentNotes: Note[];
}

export const AndroidWidgetSimulator: React.FC<AndroidWidgetSimulatorProps> = ({
  onWidgetCaptured,
  recentNotes,
}) => {
  const [widgetInput, setWidgetInput] = useState('');
  const [activeTab, setActiveTab] = useState<'simulator' | 'code'>('simulator');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<
    { id: string; time: string; text: string; action: string }[]
  >([]);

  const handleDispatch = (payload: WidgetCapturePayload) => {
    const result = WidgetBridge.handleWidgetDispatch(payload);
    if (result.success) {
      onWidgetCaptured(result.message);
      setDispatchLogs((prev) => [
        {
          id: 'log_' + Date.now(),
          time: new Date().toLocaleTimeString(),
          text: payload.text,
          action: `${payload.type.toUpperCase()} • ${result.message}`,
        },
        ...prev.slice(0, 5),
      ]);
      setWidgetInput('');
    }
  };

  const handleSimulateVoiceCapture = () => {
    setIsRecordingVoice(true);
    setTimeout(() => {
      setIsRecordingVoice(false);
      handleDispatch({
        type: 'voice_memo',
        text: 'Voice note: Ideas for Swiss typographic margin pacing and debossed folio stamps.',
      });
    }, 1800);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Header Explainer */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-5 shadow-card space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-primary">widgets</span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-on-surface">
              Android Integrated Home Screen Widget
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Interactive Simulator
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Kotlin & XML Architecture
            </button>
          </div>
        </div>
        <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
          Take quick thoughts, voice memos, and save links <strong>directly from your Android home screen</strong> without waiting for the full application window to open. The widget talks directly to the local database in milliseconds.
        </p>
      </div>

      {activeTab === 'simulator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Android Phone Shell Simulation (7 cols) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[340px] rounded-[36px] p-3.5 bg-neutral-900 border-[6px] border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.25)] relative overflow-hidden">
              {/* Android Status Bar */}
              <div className="flex items-center justify-between text-neutral-400 text-[11px] font-sans px-3 pt-1 pb-2">
                <span>09:41</span>
                <div className="w-16 h-3 rounded-full bg-black/60 mx-auto"></div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">wifi</span>
                  <span className="material-symbols-outlined text-[13px]">battery_full</span>
                </div>
              </div>

              {/* Android Home Wallpaper & Widgets Area */}
              <div className="space-y-4 py-2 min-h-[460px] flex flex-col justify-between">
                {/* 4x2 Main Mine Notes Widget */}
                <div className="bg-[#FCF9F8] text-[#1C1B1B] rounded-2xl p-4 border border-[#E5E5E3] shadow-md space-y-3">
                  {/* Widget Top Header */}
                  <div className="flex items-center justify-between border-b border-[#EAE7E7] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C25E00]"></span>
                      <span className="font-headline font-semibold text-sm tracking-tight">
                        Mine Notes
                      </span>
                      <span className="text-[10px] font-mono text-[#897265] uppercase">Quick Widget</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSimulateVoiceCapture}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isRecordingVoice
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'text-[#564337] hover:bg-[#F0EDED]'
                        }`}
                        title="Voice record without opening window"
                      >
                        <span className="material-symbols-outlined text-[16px]">mic</span>
                      </button>
                      <button
                        onClick={() =>
                          handleDispatch({
                            type: 'quick_task',
                            text: 'Review Swiss print proof samples',
                          })
                        }
                        className="w-7 h-7 rounded-full text-[#564337] hover:bg-[#F0EDED] flex items-center justify-center"
                        title="Quick checklist task"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      </button>
                    </div>
                  </div>

                  {/* Widget Direct Input Bar (Zero window overhead) */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (widgetInput.trim()) {
                        handleDispatch({ type: 'quick_note', text: widgetInput });
                      }
                    }}
                    className="flex items-center gap-2 bg-[#F6F3F2] rounded-xl p-1.5 pl-2.5 border border-[#E5E2E1]"
                  >
                    <input
                      type="text"
                      value={widgetInput}
                      onChange={(e) => setWidgetInput(e.target.value)}
                      placeholder="Capture thought directly..."
                      className="w-full bg-transparent text-xs text-[#1C1B1B] placeholder-[#897265] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!widgetInput.trim()}
                      className="w-6 h-6 rounded-lg bg-[#C25E00] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-30 active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                    </button>
                  </form>

                  {/* Voice recording state pill */}
                  {isRecordingVoice && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      <span>Recording voice memo directly to database...</span>
                    </div>
                  )}

                  {/* Recent Pinned Note preview in Widget */}
                  <div className="pt-1">
                    <p className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#897265]">
                      Pinned Memo
                    </p>
                    <p className="text-xs font-headline font-medium text-[#1C1B1B] truncate mt-0.5">
                      {recentNotes[0]?.title || 'No pinned note'}
                    </p>
                    <p className="text-[11px] font-sans text-[#564337] line-clamp-1 mt-0.5">
                      {recentNotes[0]?.content || 'Notes you save will automatically be previewed here.'}
                    </p>
                  </div>
                </div>

                {/* 2x1 Voice Canvas Mini Widget */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSimulateVoiceCapture}
                    className="bg-[#FCF9F8] text-[#1C1B1B] rounded-2xl p-3 border border-[#E5E5E3] shadow-sm flex items-center gap-2 text-left hover:border-[#C25E00] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#FFDBC7] text-[#733500] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px]">mic</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-tight">Voice Capsule</p>
                      <p className="text-[10px] text-[#897265]">Tap to record</p>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      handleDispatch({
                        type: 'quick_link',
                        text: 'https://news.ycombinator.com',
                      })
                    }
                    className="bg-[#FCF9F8] text-[#1C1B1B] rounded-2xl p-3 border border-[#E5E5E3] shadow-sm flex items-center gap-2 text-left hover:border-[#C25E00] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#D2E4FF] text-[#004880] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px]">bookmark</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-tight">Clip Link</p>
                      <p className="text-[10px] text-[#897265]">Zero prompt</p>
                    </div>
                  </button>
                </div>

                {/* Simulated Android App Dock */}
                <div className="pt-8">
                  <div className="flex items-center justify-around bg-black/30 backdrop-blur-md rounded-2xl p-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/80 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[20px]">call</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/80 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
                      <span className="material-symbols-outlined text-[22px]">draw</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/80 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[20px]">photo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Android Home Navigation Bar */}
              <div className="w-24 h-1 rounded-full bg-white/40 mx-auto mt-2"></div>
            </div>
          </div>

          {/* Background Widget Dispatch Logs (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface">
                    Widget Intent Receiver Stream
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-outline">Real-Time</span>
              </div>

              <div className="space-y-2">
                {dispatchLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-outline font-sans">
                    No widget actions dispatched yet. Type above to test silent capture.
                  </div>
                ) : (
                  dispatchLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-surface-container-low/60 border border-outline-variant/30 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-outline font-mono">
                        <span>{log.time}</span>
                        <span className="text-secondary font-semibold">{log.action}</span>
                      </div>
                      <p className="text-on-surface font-sans line-clamp-2">{log.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-card space-y-2 text-xs">
              <h4 className="font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                <span>Zero-Window Invariant</span>
              </h4>
              <p className="text-on-surface-variant leading-relaxed">
                Notice that capturing notes or links through the widget does <strong>not</strong> open a browser window or pop up modal confirmations. It commits immediately to SQLite storage in <strong>&lt; 15ms</strong>.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Kotlin & XML Architecture View */
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-5 shadow-card space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-on-surface">
              Native Android Files Created in Workspace
            </h3>
            <p className="text-xs text-on-surface-variant">
              The native files are already written to <code className="font-mono text-primary">android/</code>:
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40">
              <p className="text-primary font-bold mb-1">
                android/app/src/main/res/xml/mine_notes_appwidget_info.xml
              </p>
              <pre className="text-[11px] text-on-surface overflow-x-auto">
{`<appwidget-provider
    android:minWidth="180dp"
    android:minHeight="110dp"
    android:initialLayout="@layout/widget_quick_note"
    android:widgetCategory="home_screen" />`}
              </pre>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40">
              <p className="text-primary font-bold mb-1">
                android/app/src/main/java/com/minenotes/widget/MineNotesWidgetProvider.kt
              </p>
              <pre className="text-[11px] text-on-surface overflow-x-auto">
{`class MineNotesWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val views = RemoteViews(context.packageName, R.layout.widget_quick_note)
        // Background capture service pending intent
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
