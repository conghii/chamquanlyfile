'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import SeasonPicker from '@/components/generator/SeasonPicker';
import GarmentPicker from '@/components/generator/GarmentPicker';
import DisplayPicker from '@/components/generator/DisplayPicker';
import DesignInput from '@/components/generator/DesignInput';
import PromptPreview from '@/components/generator/PromptPreview';
import ResultGrid from '@/components/generator/ResultGrid';
import { cn } from '@/lib/utils';
import { Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { AIProviderId } from '@/types';

const PROVIDER_EMOJI: Record<AIProviderId, string> = {
  openai: '🤖',
  gemini: '✨',
  ideogram: '🎨',
};

function ProviderModelPicker() {
  const { settings, updateSettings } = useAppStore();
  const activeProvider = settings.providers.find((p) => p.id === settings.activeProvider);
  if (!activeProvider) return null;

  const setProvider = (id: AIProviderId) => {
    updateSettings({ ...settings, activeProvider: id });
  };

  const setModel = (model: string) => {
    updateSettings({
      ...settings,
      providers: settings.providers.map((p) =>
        p.id === settings.activeProvider ? { ...p, model } : p
      ),
    });
  };

  return (
    <div className="mb-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
      {/* Provider row */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-14 flex-shrink-0">Provider</span>
        <div className="flex gap-1.5 flex-wrap">
          {settings.providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all',
                settings.activeProvider === p.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-400 hover:text-violet-600'
              )}
            >
              {PROVIDER_EMOJI[p.id]} {p.name}
              {!p.apiKey && <span className="text-amber-400 text-[10px]">⚠</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Model row */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-14 flex-shrink-0">Model</span>
        <div className="flex gap-1.5 flex-wrap">
          {activeProvider.models.map((m) => (
            <button
              key={m.value}
              onClick={() => setModel(m.value)}
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-medium transition-all',
                activeProvider.model === m.value
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-600'
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-300 hover:text-violet-600'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {!activeProvider.apiKey && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          ⚠ Chưa có API key — vào <strong>Settings</strong> để thêm key
        </p>
      )}
    </div>
  );
}

const STEPS = [
  { id: 'season', label: 'Season', emoji: '🗓️' },
  { id: 'garment', label: 'Garment', emoji: '👕' },
  { id: 'display', label: 'Display', emoji: '📸' },
  { id: 'design', label: 'Design', emoji: '✏️' },
  { id: 'prompt', label: 'Prompt', emoji: '🤖' },
];

function StepSection({
  id,
  label,
  emoji,
  isOpen,
  onToggle,
  isComplete,
  description,
  children,
}: {
  id: string;
  label: string;
  emoji: string;
  isOpen: boolean;
  onToggle: () => void;
  isComplete: boolean;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(
      'rounded-2xl border-2 transition-all',
      isOpen
        ? 'border-violet-300 dark:border-violet-700 shadow-md'
        : isComplete
          ? 'border-green-200 dark:border-green-800'
          : 'border-gray-200 dark:border-gray-700'
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">{emoji}</span>
            <span className={cn(
              'font-semibold truncate',
              isOpen ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'
            )}>{label}</span>
            {isComplete && !isOpen && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold uppercase">
                ✓
              </span>
            )}
          </div>
          {isOpen && description && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
              {description}
            </p>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5">
          <div className="h-px bg-gray-100 dark:bg-gray-800 mb-4" />
          {children}
        </div>
      )}
    </div>
  );
}

export default function GeneratorPage() {
  const { config, generate, isGenerating, composedPrompt } = useAppStore();
  const [openStep, setOpenStep] = useState<string>('season');

  const toggle = (id: string) => setOpenStep((prev) => (prev === id ? '' : id));

  const isSeasonDone = !!config.season;
  const isGarmentDone = !!config.garmentType;
  const isDisplayDone = !!config.displayType;
  const isDesignDone = !!config.designText || !!config.customPrompt;
  const isPromptDone = !!(config.useCustomPrompt ? config.customPrompt : composedPrompt);

  const canGenerate = isSeasonDone && (isDesignDone || isPromptDone);

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Left panel - compact config steps */}
      <div className="w-[380px] xl:w-[420px] flex-shrink-0 overflow-y-auto space-y-3 pr-4 border-r border-gray-100 dark:border-gray-800">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-1">
            ✨ Hướng dẫn nhanh
          </h3>
          <p className="text-[11px] opacity-90 leading-relaxed font-medium">
            Chọn <strong>Mùa</strong> và <strong>Sản phẩm</strong> bạn muốn. Tải thiết kế gốc lên ở <strong>Bước 4</strong> để AI tự động khớp màu vải và giữ nguyên mẫu 100%. Nhấn <strong>Generate</strong> để xem kết quả!
          </p>
        </div>

        <StepSection
          id="season"
          label="1. Select Season"
          emoji="🗓️"
          isOpen={openStep === 'season'}
          onToggle={() => toggle('season')}
          isComplete={isSeasonDone}
          description="Chọn mùa hoặc lễ hội để AI tự động tạo bối cảnh (background) và ánh sáng phù hợp nhất."
        >
          <SeasonPicker />
        </StepSection>

        <StepSection
          id="garment"
          label="2. Choose Garment"
          emoji="👕"
          isOpen={openStep === 'garment'}
          onToggle={() => toggle('garment')}
          isComplete={isGarmentDone}
          description="Chọn loại áo. Nếu bạn tải ảnh lên ở Bước 4, AI sẽ tự động lấy màu vải từ mẫu đó."
        >
          <GarmentPicker />
        </StepSection>

        <StepSection
          id="display"
          label="3. Display Style"
          emoji="📸"
          isOpen={openStep === 'display'}
          onToggle={() => toggle('display')}
          isComplete={isDisplayDone}
          description="Chọn cách trình bày: người mẫu mặc, áo treo tường, hay xếp gọn trên mặt phẳng."
        >
          <DisplayPicker />
        </StepSection>

        <StepSection
          id="design"
          label="4. Design Input"
          emoji="✏️"
          isOpen={openStep === 'design'}
          onToggle={() => toggle('design')}
          isComplete={isDesignDone}
          description="Tải thiết kế của bạn. Hệ thống sẽ giữ nguyên 100% mẫu gốc và không tự ý thay đổi."
        >
          <DesignInput />
        </StepSection>

        <StepSection
          id="prompt"
          label="5. Review Prompt"
          emoji="🤖"
          isOpen={openStep === 'prompt'}
          onToggle={() => toggle('prompt')}
          isComplete={isPromptDone}
          description="Xem câu lệnh AI đã tự tối ưu để tạo ra hình ảnh và thẻ SEO Etsy hoàn hảo nhất."
        >
          <PromptPreview />
        </StepSection>

        {/* Generate button */}
        <div className="sticky bottom-0 pt-2 pb-4">
          <ProviderModelPicker />
          <button
            onClick={generate}
            disabled={!canGenerate || isGenerating}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-lg',
              canGenerate && !isGenerating
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            )}
          >
            <Wand2 className={cn('w-5 h-5', isGenerating && 'animate-spin')} />
            {isGenerating ? 'Generating...' : canGenerate ? 'Generate Mockup ✨' : 'Select Season & Design to Generate'}
          </button>
          {!isSeasonDone && (
            <p className="text-center text-xs text-gray-400 mt-2">
              Start by selecting a season above
            </p>
          )}
        </div>
      </div>

      {/* Right panel - expansive results */}
      <div className="flex-1 overflow-y-auto pl-2">
        <div className="sticky top-0 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Generated Mockups</h2>
          </div>
          <ResultGrid />
        </div>
      </div>
    </div>
  );
}
