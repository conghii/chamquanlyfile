import { GarmentType, DisplayType, DesignStyle, GarmentColor } from '@/types';

export const GARMENT_TYPES: { value: GarmentType; label: string; emoji: string }[] = [
  { value: 'tshirt', label: 'T-Shirt', emoji: '👕' },
  { value: 'vneck', label: 'V-Neck T-Shirt', emoji: '👕' },
  { value: 'longsleeve', label: 'Long Sleeve Shirt', emoji: '👔' },
  { value: 'sweatshirt', label: 'Sweatshirt', emoji: '🧥' },
  { value: 'hoodie', label: 'Hoodie', emoji: '🥷' },
  { value: 'tanktop', label: 'Tank Top', emoji: '🩱' },
  { value: 'croptop', label: 'Crop Top', emoji: '👚' },
];

export const DISPLAY_TYPES: { value: DisplayType; label: string; description: string; emoji: string }[] = [
  { value: 'flat_lay', label: 'Flat Lay', description: 'Top-down on flat surface', emoji: '📐' },
  { value: 'hanging', label: 'Hanging', description: 'Hung on hanger/hook', emoji: '🧷' },
  { value: 'folded', label: 'Folded', description: 'Neatly folded presentation', emoji: '📦' },
  { value: 'model_wearing', label: 'Model Wearing', description: 'Real person wearing the shirt', emoji: '🧍' },
  { value: 'ghost_mannequin', label: 'Ghost Mannequin', description: '3D invisible mannequin effect', emoji: '👻' },
  { value: 'lifestyle', label: 'Lifestyle Scene', description: 'Real-world lifestyle setting', emoji: '🌆' },
];

export const DESIGN_STYLES: { value: DesignStyle; label: string }[] = [
  { value: 'retro', label: 'Retro' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'distressed', label: 'Distressed' },
  { value: 'hand_lettered', label: 'Hand-Lettered' },
  { value: 'bold_graphic', label: 'Bold Graphic' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'sublimation', label: 'Sublimation' },
];

export const GARMENT_COLORS: GarmentColor[] = [
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#1C2951' },
  { name: 'Heather Gray', hex: '#9E9E9E' },
  { name: 'Sport Gray', hex: '#B0BEC5' },
  { name: 'Maroon', hex: '#800020' },
  { name: 'Forest Green', hex: '#228B22' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Red', hex: '#CC0000' },
  { name: 'Cardinal Red', hex: '#C41230' },
  { name: 'Purple', hex: '#6A0DAD' },
  { name: 'Orange', hex: '#FF6600' },
];
