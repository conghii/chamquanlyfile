'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { DESIGN_STYLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Lightbulb, ImageIcon, Type } from 'lucide-react';
import ImageUpload from './ImageUpload';

const EXAMPLE_TEXTS: Record<string, string[]> = {
  halloween: ['Spooky Season', 'Trick or Treat', 'Boo Crew', 'Witchy Vibes'],
  christmas: ['Merry & Bright', 'Tis the Season', 'Ho Ho Ho', 'Cozy Christmas'],
  fall: ['Hello Pumpkin', 'Thankful & Blessed', 'Fall Vibes', 'Basic Witch'],
  valentines: ['Be Mine', 'Love You More', 'XOXO', 'All You Need is Love'],
  july4th: ['Land of the Free', 'American Made', 'USA All Day', 'Stars & Stripes'],
  thanksgiving: ['Thankful & Blessed', 'Grateful Heart', 'Gobble Till You Wobble'],
  summer: ['Sunny Days', 'Beach Please', 'Summer Vibes', 'Salty Air'],
  spring: ['Hello Spring', 'In Full Bloom', 'Fresh Start'],
  mothersday: ['Blessed Mama', 'Mom Life', 'Love You Mom', 'Best Mom Ever'],
};

type InputMode = 'text' | 'image';

export default function DesignInput() {
  const { config, setConfig, setDesignStyle } = useAppStore();
  const [mode, setMode] = useState<InputMode>(
    config.uploadedImageBase64 ? 'image' : 'text'
  );

  const examples = EXAMPLE_TEXTS[config.season?.id ?? ''] ?? EXAMPLE_TEXTS['halloween'];

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
        <button
          onClick={() => setMode('text')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'text'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          <Type className="w-4 h-4" />
          Nhập text
        </button>
        <button
          onClick={() => setMode('image')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'image'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          <ImageIcon className="w-4 h-4" />
          Upload ảnh áo
          {config.uploadedImageAnalysis && (
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          )}
        </button>
      </div>

      {mode === 'image' ? (
        <div className="space-y-4">
          <ImageUpload />
          {config.uploadedImageBase64 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Text bổ sung
                <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={config.designText}
                onChange={(e) => setConfig({ designText: e.target.value })}
                placeholder='e.g. "Spooky Season"'
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Design Text
              <span className="ml-1 text-xs font-normal text-gray-400">(text in trên áo)</span>
            </label>
            <input
              type="text"
              value={config.designText}
              onChange={(e) => setConfig({ designText: e.target.value })}
              placeholder='e.g. "Spooky Season", "Thankful & Blessed"'
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
            {config.season && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setConfig({ designText: ex })}
                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-300 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Design Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DESIGN_STYLES.map((style) => {
                const isSelected = config.designStyle === style.value;
                return (
                  <button
                    key={style.value}
                    onClick={() => setDesignStyle(style.value)}
                    className={cn(
                      'px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                      isSelected
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-violet-300'
                    )}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mô tả thêm
              <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={config.customPrompt}
              onChange={(e) => setConfig({ customPrompt: e.target.value })}
              rows={3}
              placeholder='e.g. "a cute ghost holding a pumpkin latte with retro font"'
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none text-sm"
            />
          </div>
        </div>
      )}

      {config.season && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Tip {config.season.name}:</strong>{' '}
            {mode === 'image'
              ? 'Upload ảnh áo thực tế → AI tự mô tả design → tạo mockup chuyên nghiệp.'
              : `Dùng keywords như "${config.season.keywords.slice(0, 3).join(', ')}" cho kết quả tốt nhất.`
            }
          </p>
        </div>
      )}
    </div>
  );
}
