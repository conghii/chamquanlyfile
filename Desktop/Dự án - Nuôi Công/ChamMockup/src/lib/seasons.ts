import { Season } from '@/types';

export const PRESET_SEASONS: Season[] = [
  {
    id: 'spring',
    name: 'Spring',
    emoji: '🌸',
    months: [3, 4, 5],
    colors: [
      { name: 'Blush Pink', hex: '#FFB7C5' },
      { name: 'Lavender', hex: '#C8A2C8' },
      { name: 'Mint', hex: '#98D8C8' },
      { name: 'Butter Yellow', hex: '#FFF3B0' },
      { name: 'Sky Blue', hex: '#87CEEB' },
    ],
    keywords: ['floral', 'bloom', 'butterfly', 'garden', 'pastel', 'renewal', 'cherry blossom'],
  },
  {
    id: 'summer',
    name: 'Summer',
    emoji: '☀️',
    months: [6, 7, 8],
    colors: [
      { name: 'Coral', hex: '#FF6B6B' },
      { name: 'Turquoise', hex: '#00CED1' },
      { name: 'Sunshine', hex: '#FFD700' },
      { name: 'Ocean Blue', hex: '#006994' },
      { name: 'Palm Green', hex: '#4CAF50' },
    ],
    keywords: ['tropical', 'beach', 'ocean', 'sunshine', 'vibrant', 'surf', 'summer vibes'],
  },
  {
    id: 'fall',
    name: 'Fall / Autumn',
    emoji: '🍂',
    months: [9, 10, 11],
    colors: [
      { name: 'Pumpkin', hex: '#FF7518' },
      { name: 'Rust', hex: '#B7410E' },
      { name: 'Harvest Gold', hex: '#DA9100' },
      { name: 'Bark Brown', hex: '#795548' },
      { name: 'Forest Green', hex: '#228B22' },
    ],
    keywords: ['pumpkin', 'harvest', 'cozy', 'flannel', 'leaves', 'warm earth', 'apple picking'],
  },
  {
    id: 'winter',
    name: 'Winter',
    emoji: '❄️',
    months: [12, 1, 2],
    colors: [
      { name: 'Ice Blue', hex: '#B0E0E6' },
      { name: 'Silver', hex: '#C0C0C0' },
      { name: 'Deep Navy', hex: '#1C2951' },
      { name: 'Snow White', hex: '#F8F8FF' },
      { name: 'Pine Green', hex: '#01796F' },
    ],
    keywords: ['snowflake', 'cozy knit', 'minimalist', 'icy', 'cabin', 'hot cocoa'],
  },
  {
    id: 'valentines',
    name: "Valentine's Day",
    emoji: '💕',
    months: [2],
    colors: [
      { name: 'Hot Pink', hex: '#FF69B4' },
      { name: 'Deep Red', hex: '#C62828' },
      { name: 'Blush', hex: '#FFCCCC' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Gold', hex: '#FFD700' },
    ],
    keywords: ['hearts', 'love', 'romantic', 'cupid', 'roses', 'xoxo', 'be mine'],
  },
  {
    id: 'stpatricks',
    name: "St. Patrick's Day",
    emoji: '🍀',
    months: [3],
    colors: [
      { name: 'Kelly Green', hex: '#4CBB17' },
      { name: 'Gold', hex: '#FFD700' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Dark Green', hex: '#006400' },
    ],
    keywords: ['clover', 'shamrock', 'lucky', 'leprechaun', 'pot of gold', 'Irish'],
  },
  {
    id: 'easter',
    name: 'Easter',
    emoji: '🐣',
    months: [3, 4],
    colors: [
      { name: 'Pastel Purple', hex: '#D8B4FE' },
      { name: 'Pastel Yellow', hex: '#FEF08A' },
      { name: 'Pastel Blue', hex: '#BAE6FD' },
      { name: 'Pastel Pink', hex: '#FBCFE8' },
      { name: 'Pastel Green', hex: '#BBF7D0' },
    ],
    keywords: ['bunny', 'eggs', 'spring bloom', 'chick', 'pastel', 'resurrection', 'Easter basket'],
  },
  {
    id: 'july4th',
    name: '4th of July',
    emoji: '🎆',
    months: [7],
    colors: [
      { name: 'Red', hex: '#B22234' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Navy Blue', hex: '#3C3B6E' },
      { name: 'Gold', hex: '#FFD700' },
    ],
    keywords: ['patriotic', 'fireworks', 'USA', 'stars & stripes', 'freedom', 'independence', 'americana'],
  },
  {
    id: 'backtoschool',
    name: 'Back to School',
    emoji: '✏️',
    months: [8, 9],
    colors: [
      { name: 'Apple Red', hex: '#FF3B30' },
      { name: 'Sunshine Yellow', hex: '#FFCC00' },
      { name: 'Sky Blue', hex: '#007AFF' },
      { name: 'Grass Green', hex: '#34C759' },
    ],
    keywords: ['pencil', 'apple', 'school bus', 'learning', 'teacher', 'books', 'ABCs'],
  },
  {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    months: [10],
    colors: [
      { name: 'Pumpkin Orange', hex: '#FF6600' },
      { name: 'Midnight Black', hex: '#1A1A2E' },
      { name: 'Witch Purple', hex: '#6A0DAD' },
      { name: 'Ghost White', hex: '#F5F5F5' },
      { name: 'Lime Green', hex: '#32CD32' },
    ],
    keywords: ['spooky', 'pumpkin', 'ghost', 'witch', 'skeleton', 'bats', 'haunted', 'trick or treat'],
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    emoji: '🦃',
    months: [11],
    colors: [
      { name: 'Brown', hex: '#795548' },
      { name: 'Burnt Orange', hex: '#CC5500' },
      { name: 'Harvest Gold', hex: '#DA9100' },
      { name: 'Cream', hex: '#FFF8E7' },
      { name: 'Burgundy', hex: '#800020' },
    ],
    keywords: ['turkey', 'grateful', 'harvest', 'family', 'thankful', 'blessed', 'pie'],
  },
  {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    months: [12],
    colors: [
      { name: 'Christmas Red', hex: '#CC0000' },
      { name: 'Holly Green', hex: '#165B33' },
      { name: 'Gold', hex: '#FFD700' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Silver', hex: '#C0C0C0' },
    ],
    keywords: ['santa', 'reindeer', 'snowflake', 'ornament', 'tree', 'mistletoe', 'merry', 'jolly'],
  },
  {
    id: 'newyear',
    name: 'New Year',
    emoji: '🥂',
    months: [1],
    colors: [
      { name: 'Gold', hex: '#FFD700' },
      { name: 'Silver', hex: '#C0C0C0' },
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Champagne', hex: '#F7E7CE' },
    ],
    keywords: ['fireworks', 'cheers', 'celebration', 'countdown', 'new beginnings', 'midnight'],
  },
  {
    id: 'mothersday',
    name: "Mother's Day",
    emoji: '💐',
    months: [5],
    colors: [
      { name: 'Soft Pink', hex: '#FFB6C1' },
      { name: 'Floral Lavender', hex: '#E6B0E6' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Rose Gold', hex: '#B76E79' },
    ],
    keywords: ['mom', 'love', 'heart', 'flower', 'blessed mama', 'mother', 'roses', 'gratitude'],
  },
  {
    id: 'fathersday',
    name: "Father's Day",
    emoji: '👔',
    months: [6],
    colors: [
      { name: 'Navy', hex: '#001F5B' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Forest Green', hex: '#228B22' },
      { name: 'Tan', hex: '#D2B48C' },
    ],
    keywords: ['dad', 'tools', 'outdoor', 'fishing', 'grill', 'sports', 'best dad'],
  },
  {
    id: 'juneteenth',
    name: 'Juneteenth',
    emoji: '✊',
    months: [6],
    colors: [
      { name: 'Red', hex: '#BF0A30' },
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Green', hex: '#006400' },
      { name: 'Gold', hex: '#FFD700' },
    ],
    keywords: ['liberation', 'heritage', 'culture', 'freedom', 'unity', 'celebrate', 'Black excellence'],
  },
];

export function getSeasonByMonth(month: number): Season[] {
  return PRESET_SEASONS.filter((s) => s.months.includes(month));
}

export function getUpcomingSeasons(count = 4): Season[] {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const sorted = [...PRESET_SEASONS].sort((a, b) => {
    const nextA = a.months.find((m) => m >= currentMonth) ?? a.months[0] + 12;
    const nextB = b.months.find((m) => m >= currentMonth) ?? b.months[0] + 12;
    return nextA - nextB;
  });
  return sorted.slice(0, count);
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
