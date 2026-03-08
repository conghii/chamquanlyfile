'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Copy, Check, Save, History, Trash2 } from 'lucide-react';
import { buildPrompt } from '@/lib/prompt-builder';

export default function PromptPreview() {
  const {
    config,
    composedPrompt,
    setComposedPrompt,
    setConfig,
    promptTemplates,
    promptHistory,
    saveTemplate,
    removeTemplate,
  } = useAppStore();

  const [copied, setCopied] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const activePrompt = config.useCustomPrompt ? config.customPrompt : composedPrompt;

  const handleCopy = () => {
    navigator.clipboard.writeText(activePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !activePrompt.trim()) return;
    saveTemplate(templateName.trim(), activePrompt);
    setTemplateName('');
  };

  const handleRegeneratePrompt = () => {
    const fresh = buildPrompt(config);
    setComposedPrompt(fresh);
    setConfig({ useCustomPrompt: false });
  };

  return (
    <div className="space-y-4">
      {/* Toggle between auto and custom prompt */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setConfig({ useCustomPrompt: false })}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              !config.useCustomPrompt
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Auto Prompt
          </button>
          <button
            onClick={() => setConfig({ useCustomPrompt: true })}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              config.useCustomPrompt
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Custom Prompt
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Prompt history"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Copy prompt"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Prompt text area */}
      {config.useCustomPrompt ? (
        <textarea
          value={config.customPrompt}
          onChange={(e) => setConfig({ customPrompt: e.target.value })}
          rows={6}
          placeholder="Enter your fully custom prompt..."
          className="w-full px-4 py-3 rounded-xl border border-violet-300 dark:border-violet-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      ) : (
        <div className="relative">
          <textarea
            value={composedPrompt}
            onChange={(e) => setComposedPrompt(e.target.value)}
            rows={6}
            placeholder="Select a season and configure settings to generate a prompt..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-sm resize-none focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          />
          {composedPrompt && (
            <button
              onClick={handleRegeneratePrompt}
              className="absolute bottom-3 right-3 px-2 py-1 text-xs rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 transition-colors"
            >
              Rebuild
            </button>
          )}
        </div>
      )}

      {/* Save template */}
      <div className="flex gap-2">
        <input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Template name..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <button
          onClick={handleSaveTemplate}
          disabled={!templateName.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>

      {/* Saved templates */}
      {promptTemplates.length > 0 && (
        <div>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
          >
            {showTemplates ? 'Hide' : 'Show'} saved templates ({promptTemplates.length})
          </button>
          {showTemplates && (
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {promptTemplates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      setComposedPrompt(t.prompt);
                      setConfig({ useCustomPrompt: false });
                    }}
                  >
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.prompt}</p>
                  </div>
                  <button
                    onClick={() => removeTemplate(t.id)}
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {showHistory && promptHistory.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Recent prompts</p>
          {promptHistory.slice(0, 10).map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setComposedPrompt(p);
                setConfig({ useCustomPrompt: false });
                setShowHistory(false);
              }}
              className="w-full text-left p-2 text-xs text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors truncate"
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
