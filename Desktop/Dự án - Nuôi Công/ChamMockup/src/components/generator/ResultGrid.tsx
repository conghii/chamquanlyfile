'use client';

import { useAppStore } from '@/stores/useAppStore';
import { GeneratedMockup } from '@/types';
import { Download, Heart, Save, ExternalLink, AlertCircle, Loader2, Tag, X, Maximize2 } from 'lucide-react';
import { downloadImage, formatDate } from '@/lib/utils';
import { buildEtsyTags } from '@/lib/prompt-builder';
import { useState } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';

function MockupCard({ mockup }: { mockup: GeneratedMockup }) {
  const { saveToGallery, savedMockups } = useAppStore();
  const [showTags, setShowTags] = useState(false);
  const [tagsCopied, setTagsCopied] = useState(false);

  const isSaved = savedMockups.some((m) => m.id === mockup.id);
  const etsyTags = buildEtsyTags(mockup.config);

  const handleSave = () => {
    if (!isSaved) saveToGallery(mockup);
  };

  const handleCopyTags = () => {
    navigator.clipboard.writeText(etsyTags.join(', '));
    setTagsCopied(true);
    setTimeout(() => setTagsCopied(false), 2000);
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all">
      <Dialog.Root>
        {/* Image Trigger */}
        <div className="relative aspect-square cursor-zoom-in">
          <Dialog.Trigger asChild>
            <div className="w-full h-full">
              <Image
                src={mockup.url}
                alt={`${mockup.seasonName} mockup`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                  <Maximize2 className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Dialog.Trigger>

          {/* Overlay actions (kept separate from trigger for clickability) */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={(e) => { e.stopPropagation(); downloadImage(mockup.url, `mockup-${mockup.id}.png`); }}
              className="p-2 rounded-xl bg-white/90 text-gray-900 hover:bg-white transition-colors shadow-lg border border-gray-100"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (!isSaved) saveToGallery(mockup); }}
              disabled={isSaved}
              className={`p-2 rounded-xl transition-colors shadow-lg border border-gray-100 ${isSaved
                ? 'bg-violet-500 text-white cursor-default border-transparent'
                : 'bg-white/90 text-gray-900 hover:bg-white'
                }`}
              title={isSaved ? 'Saved to Gallery' : 'Save to Gallery'}
            >
              <Save className="w-4 h-4" />
            </button>
          </div>

          {/* Season badge */}
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 text-xs rounded-full bg-black/60 text-white font-medium backdrop-blur-sm">
              {mockup.seasonName}
            </span>
          </div>
        </div>

        {/* Modal Content */}
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] h-[95vh] max-w-5xl max-h-[850px] z-[101] outline-none animate-in zoom-in-95 fade-in duration-300">
            <div className="relative w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
              {/* Image Container */}
              <div className="relative flex-1 bg-gray-50 dark:bg-gray-950 overflow-hidden">
                <Image
                  src={mockup.url}
                  alt={`${mockup.seasonName} mockup preview`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              {/* Close Button */}
              <Dialog.Close asChild>
                <button className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-md z-10">
                  <X className="w-6 h-6" />
                </button>
              </Dialog.Close>

              {/* Info Bar */}
              <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    {mockup.seasonName} Mockup
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold">
                      {mockup.config.garmentType}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(mockup.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyTags}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                    {tagsCopied ? 'Copied!' : 'Copy Tags'}
                  </button>
                  <button
                    onClick={() => downloadImage(mockup.url, `mockup-${mockup.id}.png`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Card footer */}
      <div className="p-3">
        {/* ... (rest of footer kept as is) */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{formatDate(mockup.createdAt)}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTags(!showTags)}
            className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
          >
            <Tag className="w-3 h-3" />
            Etsy Tags
          </button>
        </div>
        {showTags && (
          <div className="mt-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="flex flex-wrap gap-1 mb-2">
              {etsyTags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-xs rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={handleCopyTags}
              className="text-xs text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              {tagsCopied ? '✓ Copied!' : 'Copy all tags'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultGrid() {
  const { generatedMockups, isGenerating, generationError, clearGenerationError, generate, variationCount, setVariationCount } = useAppStore();

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900 dark:text-white">Generating your mockups...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This may take 15–30 seconds</p>
        </div>
        <div className="w-48 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  if (generationError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <div className="text-center max-w-sm">
          <p className="font-semibold text-gray-900 dark:text-white">Generation Failed</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{generationError}</p>
        </div>
        <button
          onClick={clearGenerationError}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (generatedMockups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl">
          🎨
        </div>
        <p className="font-semibold text-gray-900 dark:text-white">No mockups yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Select a season, configure your garment, and click Generate to create your first AI mockup.
        </p>
        {/* Variation count */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Variations:</span>
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setVariationCount(n)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${variationCount === n
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {generatedMockups.length} variation{generatedMockups.length > 1 ? 's' : ''} generated
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Variations:</span>
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setVariationCount(n)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${variationCount === n
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={generate}
            className="ml-2 px-3 py-1.5 text-xs rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
          >
            Regenerate
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {generatedMockups.map((mockup) => (
          <MockupCard key={mockup.id} mockup={mockup} />
        ))}
      </div>
    </div>
  );
}
