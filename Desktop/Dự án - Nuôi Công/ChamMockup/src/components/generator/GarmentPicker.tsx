'use client';

import { useAppStore } from '@/stores/useAppStore';
import { GARMENT_TYPES, GARMENT_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export default function GarmentPicker() {
  const { config, setGarmentType, setConfig } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Garment type */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Garment Type</p>
        <div className="grid grid-cols-3 gap-2">
          {GARMENT_TYPES.map((type) => {
            const isSelected = config.garmentType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setGarmentType(type.value)}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2 rounded-xl border-2 text-sm font-medium transition-all h-full justify-center',
                  isSelected
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-violet-300'
                )}
              >
                <span className="text-xl">{type.emoji}</span>
                <span className="text-[10px] leading-tight text-center font-bold uppercase tracking-tight">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Garment color & Custom color - Hidden if image uploaded */}
      {config.uploadedImageBase64 ? (
        <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-800 flex items-center justify-center text-xl">
            ✨
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">Auto-matching Color</p>
            <p className="text-xs text-violet-600 dark:text-violet-400">
              The AI will automatically match the garment color and design from your uploaded image.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Garment color */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Garment Color</p>
            <div className="grid grid-cols-5 gap-2">
              {GARMENT_COLORS.map((color) => {
                const isSelected = config.garmentColor.hex === color.hex;
                const isLight = ['#FFFFFF', '#F8F8FF', '#B0BEC5', '#9E9E9E'].includes(color.hex);
                return (
                  <button
                    key={color.hex}
                    onClick={() => setConfig({ garmentColor: color })}
                    title={color.name}
                    className={cn(
                      'relative flex items-center justify-center rounded-xl w-full aspect-square border-2 transition-all hover:scale-105',
                      isSelected
                        ? 'border-violet-500 shadow-lg scale-105'
                        : isLight
                          ? 'border-gray-300 dark:border-gray-600'
                          : 'border-transparent hover:border-gray-400'
                    )}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <Check
                        className={cn('w-4 h-4', isLight ? 'text-gray-700' : 'text-white')}
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: config.garmentColor.hex }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Selected: <span className="font-medium text-gray-900 dark:text-white">{config.garmentColor.name}</span>
              </span>
            </div>
          </div>

          {/* Custom color */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Color</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.garmentColor.hex}
                onChange={(e) => setConfig({ garmentColor: { name: 'Custom', hex: e.target.value } })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700"
              />
              <input
                type="text"
                value={config.garmentColor.hex}
                onChange={(e) => {
                  const hex = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                    setConfig({ garmentColor: { name: 'Custom', hex } });
                  }
                }}
                placeholder="#1A1A1A"
                className="w-32 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
