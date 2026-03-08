'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { AppSettings, AIProvider, AIProviderId } from '@/types';
import { testApiKey } from '@/lib/ai-providers';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Save, RotateCcw, Zap } from 'lucide-react';
import { GARMENT_TYPES, DISPLAY_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const PROVIDER_META: Record<AIProviderId, { emoji: string; color: string; docsLabel: string; docsHint: string; keyPrefix: string; keyPlaceholder: string }> = {
  openai: {
    emoji: '🤖',
    color: 'from-green-500 to-emerald-600',
    docsLabel: 'platform.openai.com',
    docsHint: 'API Keys → Create new secret key',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-proj-... hoặc sk-...',
  },
  gemini: {
    emoji: '✨',
    color: 'from-blue-500 to-indigo-600',
    docsLabel: 'aistudio.google.com',
    docsHint: 'Get API key → Create API key',
    keyPrefix: 'AIzaSy',
    keyPlaceholder: 'AIzaSy...',
  },
  ideogram: {
    emoji: '🎨',
    color: 'from-purple-500 to-pink-600',
    docsLabel: 'ideogram.ai/api',
    docsHint: 'Account → API Keys → Generate',
    keyPrefix: '',
    keyPlaceholder: 'Ideogram API key...',
  },
};

function ProviderCard({
  provider,
  isActive,
  onSetActive,
  onUpdate,
}: {
  provider: AIProvider;
  isActive: boolean;
  onSetActive: () => void;
  onUpdate: (patch: Partial<AIProvider>) => void;
}) {
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const meta = PROVIDER_META[provider.id];

  const keyFormatOk =
    !provider.apiKey ||
    !meta.keyPrefix ||
    provider.apiKey.startsWith(meta.keyPrefix);

  const handleTest = async () => {
    if (!provider.apiKey) return;
    setTesting(true);
    setTestResult(null);
    const ok = await testApiKey(provider.id, provider.apiKey);
    setTestResult(ok);
    setTesting(false);
  };

  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden transition-all',
      isActive
        ? 'border-violet-500 shadow-lg shadow-violet-500/10'
        : 'border-gray-200 dark:border-gray-700'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-5 py-4',
        isActive
          ? 'bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20'
          : 'bg-white dark:bg-gray-800'
      )}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-lg shadow-sm`}>
            {meta.emoji}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{provider.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{meta.docsHint}</p>
          </div>
        </div>
        <button
          onClick={onSetActive}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
            isActive
              ? 'bg-violet-600 text-white shadow-sm'
              : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400'
          )}
        >
          {isActive ? (
            <><Zap className="w-3 h-3" /> Active</>
          ) : (
            'Set Active'
          )}
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 bg-white dark:bg-gray-800 space-y-4">
        {/* API Key */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            API Key
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={provider.apiKey}
                onChange={(e) => onUpdate({ apiKey: e.target.value })}
                placeholder={meta.keyPlaceholder}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleTest}
              disabled={!provider.apiKey || testing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Test
            </button>
          </div>
          {/* Test result */}
          {testResult !== null && (
            <div className={cn(
              'flex items-center gap-1.5 mt-1.5 text-xs font-medium',
              testResult ? 'text-green-600 dark:text-green-400' : 'text-red-500'
            )}>
              {testResult
                ? <><CheckCircle className="w-3.5 h-3.5" /> Kết nối thành công!</>
                : <><XCircle className="w-3.5 h-3.5" /> API key không hợp lệ</>
              }
            </div>
          )}
          {!keyFormatOk && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              ⚠️ Key này không đúng format của {provider.name} (phải bắt đầu bằng <code className="font-mono">{meta.keyPrefix}</code>)
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Lấy key tại <span className="text-violet-500 font-medium">{meta.docsLabel}</span>
          </p>
        </div>

        {/* Model selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            Model
          </label>
          <div className="space-y-1.5">
            {provider.models.map((m) => {
              const isSelected = provider.model === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => onUpdate({ model: m.value })}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 text-left transition-all',
                    isSelected
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-100 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600'
                  )}
                >
                  <div>
                    <p className={cn(
                      'text-sm font-semibold leading-tight',
                      isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'
                    )}>
                      {m.label}
                    </p>
                    {m.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{m.description}</p>
                    )}
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-violet-500 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState<AppSettings>(
    () => JSON.parse(JSON.stringify(settings))
  );
  const [saved, setSaved] = useState(false);

  const updateProvider = (providerId: AIProviderId, patch: Partial<AIProvider>) => {
    setLocalSettings((prev) => ({
      ...prev,
      providers: prev.providers.map((p) =>
        p.id === providerId ? { ...p, ...patch } : p
      ),
    }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* AI Providers */}
      <section>
        <div className="mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">AI Providers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Cấu hình API key và chọn model cho từng provider. Key được lưu local trên trình duyệt.
          </p>
        </div>

        {/* Active provider summary */}
        <div className="mb-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-500 flex-shrink-0" />
          <p className="text-sm text-violet-700 dark:text-violet-300">
            Đang dùng:{' '}
            <strong>
              {localSettings.providers.find((p) => p.id === localSettings.activeProvider)?.name}
            </strong>
            {' — '}
            {localSettings.providers.find((p) => p.id === localSettings.activeProvider)?.model}
          </p>
        </div>

        <div className="space-y-4">
          {localSettings.providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isActive={localSettings.activeProvider === provider.id}
              onSetActive={() =>
                setLocalSettings((prev) => ({ ...prev, activeProvider: provider.id }))
              }
              onUpdate={(patch) => updateProvider(provider.id, patch)}
            />
          ))}
        </div>
      </section>

      {/* Defaults */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white">Default Preferences</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Giá trị mặc định khi mở Generator.
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Default Garment
          </label>
          <div className="grid grid-cols-4 gap-2">
            {GARMENT_TYPES.map((g) => (
              <button
                key={g.value}
                onClick={() => setLocalSettings((p) => ({ ...p, defaultGarmentType: g.value }))}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-xs font-medium transition-all',
                  localSettings.defaultGarmentType === g.value
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300'
                )}
              >
                <span>{g.emoji}</span>
                <span className="leading-tight text-center">{g.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Default Display
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DISPLAY_TYPES.map((d) => (
              <button
                key={d.value}
                onClick={() => setLocalSettings((p) => ({ ...p, defaultDisplayType: d.value }))}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-xs font-medium transition-all',
                  localSettings.defaultDisplayType === d.value
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300'
                )}
              >
                <span>{d.emoji}</span>
                <span className="leading-tight text-center">{d.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="font-bold text-gray-900 dark:text-white mb-1">Data & Privacy</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Tất cả dữ liệu lưu local trong trình duyệt. Không gửi lên server.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { if (confirm('Xóa toàn bộ gallery?')) { localStorage.removeItem('chammockup:mockups'); window.location.reload(); } }}
            className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Clear Gallery
          </button>
          <button
            onClick={() => { if (confirm('Xóa lịch sử prompt?')) { localStorage.removeItem('chammockup:prompt_history'); localStorage.removeItem('chammockup:prompt_templates'); window.location.reload(); } }}
            className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Clear Prompt History
          </button>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3 pb-4">
        <button
          onClick={handleSave}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg',
            saved
              ? 'bg-green-500 text-white'
              : 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-xl hover:-translate-y-0.5'
          )}
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Đã lưu!' : 'Lưu Settings'}
        </button>
        <button
          onClick={() => setLocalSettings(JSON.parse(JSON.stringify(settings)))}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
}
