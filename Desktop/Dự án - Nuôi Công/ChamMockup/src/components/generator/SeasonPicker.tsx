'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Season } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, X, Check } from 'lucide-react';
import { generateId } from '@/lib/utils';

export default function SeasonPicker() {
  const { allSeasons, config, setSeason, addCustomSeason, removeCustomSeason, customSeasons } = useAppStore();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🎉');
  const [customKeywords, setCustomKeywords] = useState('');

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const season: Season = {
      id: `custom-${generateId()}`,
      name: customName.trim(),
      emoji: customEmoji,
      months: [],
      colors: [
        { name: 'Color 1', hex: '#6366F1' },
        { name: 'Color 2', hex: '#EC4899' },
        { name: 'Color 3', hex: '#F59E0B' },
      ],
      keywords: customKeywords.split(',').map((k) => k.trim()).filter(Boolean),
      isCustom: true,
    };
    addCustomSeason(season);
    setCustomName('');
    setCustomKeywords('');
    setCustomEmoji('🎉');
    setShowCustomForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {allSeasons.map((season) => {
          const isSelected = config.season?.id === season.id;
          return (
            <button
              key={season.id}
              onClick={() => setSeason(isSelected ? null : season)}
              className={cn(
                'relative flex flex-col items-center p-2 rounded-xl border-2 text-center transition-all group hover:shadow-md h-full',
                isSelected
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-300'
              )}
            >
              {isSelected && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
              {season.isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustomSeason(season.id);
                  }}
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5 text-red-600" />
                </button>
              )}
              <span className="text-xl mb-1">{season.emoji}</span>
              <p className="font-bold text-[10px] text-gray-900 dark:text-white leading-tight uppercase tracking-tight">{season.name}</p>
              {/* Color swatches */}
              <div className="flex gap-1 mt-2">
                {season.colors.slice(0, 4).map((color) => (
                  <div
                    key={color.hex}
                    className="w-4 h-4 rounded-full border border-white dark:border-gray-700 shadow-sm"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </button>
          );
        })}

        {/* Add custom season */}
        <button
          onClick={() => setShowCustomForm(true)}
          className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-all min-h-[100px]"
        >
          <Plus className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Custom Season</span>
        </button>
      </div>

      {/* Selected season details */}
      {config.season && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{config.season.emoji}</span>
            <h3 className="font-bold text-gray-900 dark:text-white">{config.season.name}</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {config.season.colors.map((c) => (
              <div key={c.hex} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white shadow"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-gray-600 dark:text-gray-400">{c.name}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {config.season.keywords.map((kw) => (
              <span
                key={kw}
                className="px-2 py-0.5 text-xs rounded-full bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom season form */}
      {showCustomForm && (
        <div className="p-4 rounded-xl border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">Create Custom Season</h4>
          <div className="flex gap-2">
            <input
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              placeholder="Emoji"
              className="w-16 px-2 py-2 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            />
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Season name (e.g. Diwali)"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <input
            value={customKeywords}
            onChange={(e) => setCustomKeywords(e.target.value)}
            placeholder="Keywords, comma separated (e.g. lights, diya, celebration)"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCustom}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              Add Season
            </button>
            <button
              onClick={() => setShowCustomForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
