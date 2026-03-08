export interface SeasonColor {
  name: string;
  hex: string;
}

export interface Season {
  id: string;
  name: string;
  emoji: string;
  months: number[];
  colors: SeasonColor[];
  keywords: string[];
  isCustom?: boolean;
}

export type GarmentType =
  | 'tshirt'
  | 'vneck'
  | 'longsleeve'
  | 'sweatshirt'
  | 'hoodie'
  | 'tanktop'
  | 'croptop';

export type DisplayType =
  | 'flat_lay'
  | 'hanging'
  | 'folded'
  | 'model_wearing'
  | 'ghost_mannequin'
  | 'lifestyle';

export type DesignStyle =
  | 'retro'
  | 'vintage'
  | 'minimalist'
  | 'distressed'
  | 'hand_lettered'
  | 'bold_graphic'
  | 'watercolor'
  | 'sublimation';

export type ModelGender = 'male' | 'female' | 'unisex';

export interface GarmentColor {
  name: string;
  hex: string;
}

export interface GeneratorConfig {
  season: Season | null;
  garmentType: GarmentType;
  garmentColor: GarmentColor;
  displayType: DisplayType;
  modelGender?: ModelGender;
  designText: string;
  designStyle: DesignStyle;
  customPrompt: string;
  useCustomPrompt: boolean;
  uploadedImageBase64?: string;
  uploadedImageAnalysis?: string;
}

export interface GeneratedMockup {
  id: string;
  url: string;
  prompt: string;
  config: GeneratorConfig;
  createdAt: number;
  seasonId: string;
  seasonName: string;
  isFavorite: boolean;
  firebaseId?: string;
}

export type AIProviderId = 'openai' | 'gemini' | 'ideogram';

export interface AIModelOption {
  value: string;
  label: string;
  description?: string;
}

export interface AIProvider {
  id: AIProviderId;
  name: string;
  apiKey: string;
  model: string;
  models: AIModelOption[];
}

export interface AppSettings {
  providers: AIProvider[];
  activeProvider: AIProviderId;
  theme: 'light' | 'dark' | 'system';
  defaultGarmentType: GarmentType;
  defaultDisplayType: DisplayType;
}

export interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  createdAt: number;
}
