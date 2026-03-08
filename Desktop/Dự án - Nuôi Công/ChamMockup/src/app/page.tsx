'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { getUpcomingSeasons, MONTH_NAMES } from '@/lib/seasons';
import { Wand2, ImageIcon, TrendingUp, Calendar, ArrowRight, Clock } from 'lucide-react';
import { Season } from '@/types';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function SeasonCard({ season, onClick }: { season: Season; onClick: () => void }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const nextMonth = season.months.find((m) => m >= currentMonth) ?? season.months[0];
  const monthLabel = MONTH_NAMES[(nextMonth ?? 1) - 1];

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-400 hover:shadow-md transition-all text-left group w-full"
    >
      <span className="text-3xl">{season.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white">{season.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {monthLabel}
        </p>
      </div>
      <div className="flex gap-1">
        {season.colors.slice(0, 3).map((c) => (
          <div
            key={c.hex}
            className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition-colors flex-shrink-0" />
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { savedMockups } = useAppStore();
  const upcoming = getUpcomingSeasons(6);

  const totalSaved = savedMockups.length;
  const seasonCounts = savedMockups.reduce<Record<string, number>>((acc, m) => {
    acc[m.seasonName] = (acc[m.seasonName] ?? 0) + 1;
    return acc;
  }, {});
  const topSeason = Object.entries(seasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  const quickActions = [
    { label: 'Halloween', emoji: '🎃', season: 'halloween' },
    { label: 'Christmas', emoji: '🎄', season: 'christmas' },
    { label: "Valentine's", emoji: '💕', season: 'valentines' },
    { label: '4th of July', emoji: '🎆', season: 'july4th' },
    { label: 'Thanksgiving', emoji: '🦃', season: 'thanksgiving' },
    { label: "Mother's Day", emoji: '💐', season: 'mothersday' },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-white" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-white" />
        </div>
        <h2 className="text-2xl font-bold mb-1 relative">Welcome to ChamMockup 👋</h2>
        <p className="text-violet-200 text-sm mb-4 relative">
          AI-powered seasonal apparel mockups for your Etsy & POD store
        </p>
        <button
          onClick={() => router.push('/generator')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-violet-700 font-semibold text-sm hover:bg-violet-50 transition-colors shadow-lg relative w-fit"
        >
          <Wand2 className="w-4 h-4" />
          Create New Mockup
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Saved" value={totalSaved} icon={ImageIcon} color="bg-violet-500" />
        <StatCard label="Top Season" value={topSeason} icon={TrendingUp} color="bg-pink-500" />
        <StatCard label="Upcoming Events" value={upcoming.length} icon={Calendar} color="bg-indigo-500" />
        <StatCard label="Quick Actions" value={quickActions.length} icon={Wand2} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming seasons */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Upcoming Seasons</h3>
            <button
              onClick={() => router.push('/calendar')}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
            >
              View Calendar →
            </button>
          </div>
          <div className="space-y-2">
            {upcoming.map((season) => (
              <SeasonCard
                key={season.id}
                season={season}
                onClick={() => router.push('/generator')}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Create</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.season}
                  onClick={() => router.push('/generator')}
                  className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-left group"
                >
                  <span className="text-xl">{action.emoji}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Seller tips */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
            <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2">💡 Seller Tips</h3>
            <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
              <li>• Start Halloween designs by <strong>early September</strong></li>
              <li>• Christmas mockups should be live by <strong>early November</strong></li>
              <li>• Valentine designs should launch in <strong>January</strong></li>
              <li>• Batch generate multiple colors for the same design</li>
            </ul>
          </div>

          {/* Recent saves */}
          {savedMockups.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white">Recent Saves</h3>
                <button
                  onClick={() => router.push('/gallery')}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  View All →
                </button>
              </div>
              <div className="flex gap-2">
                {savedMockups.slice(0, 4).map((m) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={m.id}
                    src={m.url}
                    alt={m.seasonName}
                    className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
