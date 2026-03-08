'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { GeneratedMockup } from '@/types';
import { Download, Trash2, Heart, Tag, Search, Filter, Package } from 'lucide-react';
import { downloadImage, formatDate } from '@/lib/utils';
import { buildEtsyTags } from '@/lib/prompt-builder';
import { PRESET_SEASONS } from '@/lib/seasons';

function MockupCard({ mockup }: { mockup: GeneratedMockup }) {
  const { removeFromGallery, toggleFavorite } = useAppStore();
  const [showTags, setShowTags] = useState(false);
  const [tagsCopied, setTagsCopied] = useState(false);

  const etsyTags = buildEtsyTags(mockup.config);

  const handleCopyTags = () => {
    navigator.clipboard.writeText(etsyTags.join(', '));
    setTagsCopied(true);
    setTimeout(() => setTagsCopied(false), 2000);
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg transition-all">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mockup.url}
          alt={`${mockup.seasonName} mockup`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
        <div className="absolute top-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="px-2 py-0.5 text-xs rounded-full bg-black/60 text-white font-medium backdrop-blur-sm">
            {mockup.seasonName}
          </span>
          <button
            onClick={() => toggleFavorite(mockup.id)}
            className={`p-1.5 rounded-full shadow transition-colors ${
              mockup.isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 text-gray-700 hover:bg-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${mockup.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => downloadImage(mockup.url, `mockup-${mockup.id}.png`)}
            className="p-2 rounded-full bg-white/90 text-gray-900 hover:bg-white transition-colors shadow"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => removeFromGallery(mockup.id)}
            className="p-2 rounded-full bg-white/90 text-red-500 hover:bg-red-50 transition-colors shadow"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {mockup.isFavorite && (
          <div className="absolute top-2 right-2">
            <span className="text-rose-500 text-lg">❤️</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {mockup.config.garmentColor.name} {mockup.config.garmentType === 'tshirt' ? 'T-Shirt' : mockup.config.garmentType}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(mockup.createdAt)}</p>
          </div>
          <div
            className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0 mt-0.5"
            style={{ backgroundColor: mockup.config.garmentColor.hex }}
          />
        </div>

        {mockup.config.designText && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
            &ldquo;{mockup.config.designText}&rdquo;
          </p>
        )}

        <button
          onClick={() => setShowTags(!showTags)}
          className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
        >
          <Tag className="w-3 h-3" />
          {showTags ? 'Hide' : 'Show'} Etsy Tags
        </button>

        {showTags && (
          <div className="mt-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="flex flex-wrap gap-1 mb-1.5">
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
              className="text-xs text-gray-500 hover:text-violet-600 dark:hover:text-violet-400"
            >
              {tagsCopied ? '✓ Copied!' : 'Copy all'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const { savedMockups } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterSeason, setFilterSeason] = useState('all');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'season'>('newest');

  let filtered = savedMockups.filter((m) => {
    if (filterFavorites && !m.isFavorite) return false;
    if (filterSeason !== 'all' && m.seasonId !== filterSeason) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.seasonName.toLowerCase().includes(q) ||
        m.config.designText?.toLowerCase().includes(q) ||
        m.config.garmentColor.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (sortBy === 'newest') filtered = filtered.sort((a, b) => b.createdAt - a.createdAt);
  else if (sortBy === 'oldest') filtered = filtered.sort((a, b) => a.createdAt - b.createdAt);
  else filtered = filtered.sort((a, b) => a.seasonName.localeCompare(b.seasonName));

  const handleDownloadAll = () => {
    filtered.forEach((m, i) => {
      setTimeout(() => downloadImage(m.url, `mockup-${m.id}.png`), i * 500);
    });
  };

  const uniqueSeasons = [...new Set(savedMockups.map((m) => m.seasonId))];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by season, text, color..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Season filter */}
        <select
          value={filterSeason}
          onChange={(e) => setFilterSeason(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-violet-500"
        >
          <option value="all">All Seasons</option>
          {uniqueSeasons.map((sid) => {
            const s = PRESET_SEASONS.find((ps) => ps.id === sid);
            return s ? (
              <option key={sid} value={sid}>
                {s.emoji} {s.name}
              </option>
            ) : null;
          })}
        </select>

        {/* Favorites filter */}
        <button
          onClick={() => setFilterFavorites(!filterFavorites)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
            filterFavorites
              ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
          }`}
        >
          <Heart className={`w-4 h-4 ${filterFavorites ? 'fill-current' : ''}`} />
          Favorites
        </button>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-violet-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="season">By Season</option>
        </select>

        {/* Download all */}
        {filtered.length > 0 && (
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors ml-auto"
          >
            <Package className="w-4 h-4" />
            Download All ({filtered.length})
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {filtered.length} mockup{filtered.length !== 1 ? 's' : ''}
        {filterSeason !== 'all' || search || filterFavorites ? ' (filtered)' : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl">
            🖼️
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {savedMockups.length === 0 ? 'No saved mockups yet' : 'No mockups match your filters'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            {savedMockups.length === 0
              ? 'Generate mockups in the Generator and save them to your gallery.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((mockup) => (
            <MockupCard key={mockup.id} mockup={mockup} />
          ))}
        </div>
      )}
    </div>
  );
}
