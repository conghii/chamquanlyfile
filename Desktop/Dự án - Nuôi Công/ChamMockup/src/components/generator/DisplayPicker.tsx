'use client';

import { useAppStore } from '@/stores/useAppStore';
import { DISPLAY_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export default function DisplayPicker() {
  const { config, setDisplayType, setConfig } = useAppStore();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {DISPLAY_TYPES.map((type) => {
          const isSelected = config.displayType === type.value;
          return (
            <button
              key={type.value}
              onClick={() => setDisplayType(type.value)}
              className={cn(
                'relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all hover:shadow-md h-full justify-center',
                isSelected
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-300'
              )}
            >
              {isSelected && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
              <span className="text-xl">{type.emoji}</span>
              <p className={cn('font-bold text-[10px] uppercase tracking-tight leading-tight', isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white')}>
                {type.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Model options (shown when model_wearing selected) */}
      {config.displayType === 'model_wearing' && (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Model Preferences</p>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Gender</p>
            <div className="flex gap-2">
              {(['male', 'female', 'unisex'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setConfig({ modelGender: g })}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize',
                    config.modelGender === g
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300'
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
