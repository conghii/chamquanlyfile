'use client';

import { useRouter } from 'next/navigation';
import { PRESET_SEASONS, MONTH_NAMES } from '@/lib/seasons';
import { Season } from '@/types';
import { Wand2, Clock } from 'lucide-react';

const DESIGN_LEAD_WEEKS: Record<string, number> = {
  halloween: 6,
  christmas: 8,
  valentines: 4,
  thanksgiving: 5,
  july4th: 4,
  mothersday: 3,
  fathersday: 3,
  easter: 4,
  stpatricks: 3,
  backtoschool: 4,
  newyear: 3,
  juneteenth: 3,
  spring: 2,
  summer: 2,
  fall: 2,
  winter: 2,
};

const MONTH_COLORS = [
  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200',
  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200',
  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200',
  'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
  'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200',
  'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200',
];

function getLeadWeeksText(season: Season): string {
  const weeks = DESIGN_LEAD_WEEKS[season.id] ?? 4;
  return `Start designing ${weeks} weeks early`;
}

function getStartDesignMonth(season: Season): string {
  const leadWeeks = DESIGN_LEAD_WEEKS[season.id] ?? 4;
  const firstMonth = Math.min(...season.months);
  const startDate = new Date(2025, firstMonth - 1, 1);
  startDate.setDate(startDate.getDate() - leadWeeks * 7);
  return MONTH_NAMES[startDate.getMonth()];
}

function SeasonTimelineCard({ season }: { season: Season }) {
  const router = useRouter();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const isPast = !season.months.some((m) => m >= currentMonth);
  const isCurrent = season.months.includes(currentMonth);
  const leadWeeks = DESIGN_LEAD_WEEKS[season.id] ?? 4;

  return (
    <div className={`relative flex gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-md ${
      isCurrent
        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-md'
        : isPast
        ? 'border-gray-200 dark:border-gray-700 opacity-60'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-300'
    }`}>
      {isCurrent && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 text-xs rounded-full bg-violet-500 text-white font-medium">
            Active Now
          </span>
        </div>
      )}

      {/* Emoji & season color */}
      <div className="flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
          style={{ backgroundColor: season.colors[0]?.hex + '30', border: `2px solid ${season.colors[0]?.hex}40` }}>
          {season.emoji}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-bold text-gray-900 dark:text-white">{season.name}</h3>
          {season.months.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {season.months.map((m) => MONTH_NAMES[m - 1]).join(', ')}
            </span>
          )}
        </div>

        {/* Color swatches */}
        <div className="flex gap-1 mb-2">
          {season.colors.map((c) => (
            <div
              key={c.hex}
              title={c.name}
              className="w-4 h-4 rounded-full border border-white dark:border-gray-700 shadow-sm"
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        {/* Keywords */}
        <div className="flex flex-wrap gap-1 mb-2">
          {season.keywords.slice(0, 4).map((kw) => (
            <span key={kw} className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {kw}
            </span>
          ))}
        </div>

        {/* Lead time reminder */}
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="w-3 h-3 text-amber-500" />
          <span className={isPast ? 'text-gray-400 dark:text-gray-500' : 'text-amber-600 dark:text-amber-400'}>
            {getLeadWeeksText(season)} ({leadWeeks}wk) — start in {getStartDesignMonth(season)}
          </span>
        </div>
      </div>

      {/* Create button */}
      {!isPast && (
        <button
          onClick={() => router.push('/generator')}
          className="flex-shrink-0 self-center p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
          title={`Create ${season.name} mockup`}
        >
          <Wand2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function MonthColumn({ month, monthIndex }: { month: string; monthIndex: number }) {
  const seasons = PRESET_SEASONS.filter((s) => s.months.includes(monthIndex + 1));
  const colorClass = MONTH_COLORS[monthIndex] ?? MONTH_COLORS[0];

  return (
    <div className="min-w-40 flex-shrink-0">
      <div className={`px-3 py-1.5 rounded-xl text-xs font-bold mb-2 text-center ${colorClass}`}>
        {month}
      </div>
      <div className="space-y-1.5">
        {seasons.map((season) => (
          <div
            key={season.id}
            className="px-2 py-1.5 rounded-lg text-xs font-medium text-center"
            style={{
              backgroundColor: season.colors[0]?.hex + '25',
              color: season.colors[0]?.hex,
              border: `1px solid ${season.colors[0]?.hex}50`,
            }}
          >
            {season.emoji} {season.name}
          </div>
        ))}
        {seasons.length === 0 && (
          <div className="px-2 py-1.5 rounded-lg text-xs text-gray-400 dark:text-gray-600 text-center border border-dashed border-gray-200 dark:border-gray-700">
            —
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const upcomingSeasons = [...PRESET_SEASONS].sort((a, b) => {
    const nextA = a.months.find((m) => m >= currentMonth) ?? a.months[0]! + 12;
    const nextB = b.months.find((m) => m >= currentMonth) ?? b.months[0]! + 12;
    return nextA - nextB;
  });

  return (
    <div className="space-y-8">
      {/* Horizontal Gantt */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">Annual Season Overview</h2>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {MONTH_NAMES.map((month, i) => (
              <MonthColumn key={month} month={month.slice(0, 3)} monthIndex={i} />
            ))}
          </div>
        </div>
        {/* Current month indicator */}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          Current month: {MONTH_NAMES[now.getMonth()]}
        </div>
      </div>

      {/* Timeline list */}
      <div>
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">
          Upcoming Design Schedule
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            sorted by upcoming order
          </span>
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {upcomingSeasons.map((season) => (
            <SeasonTimelineCard key={season.id} season={season} />
          ))}
        </div>
      </div>

      {/* Planning tips */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl border border-violet-200 dark:border-violet-800 p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">📅 POD Seller Planning Guide</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { emoji: '🎃', season: 'Halloween', tip: 'List by early September. Buyers browse 6–8 weeks early.' },
            { emoji: '🎄', season: 'Christmas', tip: 'Go live by early November. Peak traffic in Nov–Dec.' },
            { emoji: '💕', season: "Valentine's", tip: 'Launch in January. Valentine shopping starts early Feb.' },
            { emoji: '🇺🇸', season: '4th of July', tip: 'List by mid-June. Patriotic shirts sell fast!' },
            { emoji: '🦃', season: 'Thanksgiving', tip: 'Go live by mid-October alongside fall designs.' },
            { emoji: '💐', season: "Mother's Day", tip: 'List in April. Gift season peaks 2 weeks before.' },
          ].map((item) => (
            <div key={item.season} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span>{item.emoji}</span>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">{item.season}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
