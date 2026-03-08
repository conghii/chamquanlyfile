import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  Season,
  GeneratorConfig,
  GeneratedMockup,
  AppSettings,
  PromptTemplate,
  GarmentType,
  DisplayType,
  DesignStyle,
} from '@/types';
import { PRESET_SEASONS } from '@/lib/seasons';
import {
  getMockups,
  saveMockup,
  deleteMockup,
  toggleFavoriteMockup,
  getCustomSeasons,
  saveCustomSeason,
  deleteCustomSeason,
  getPromptTemplates,
  savePromptTemplate,
  deletePromptTemplate,
  getSettings,
  saveSettings,
  addPromptHistory,
  getPromptHistory,
} from '@/lib/storage';
import { buildPrompt } from '@/lib/prompt-builder';
import { generateWithOpenAI, generateWithGemini, generateWithIdeogram, analyzeShirtImageWithGemini } from '@/lib/ai-providers';
import { generateId } from '@/lib/utils';
import { uploadMockupImage, saveMockupToFirestore, getUserMockups, deleteUserMockup, toggleUserFavorite } from '@/lib/firebase-utils';

interface AppState {
  customSeasons: Season[];
  allSeasons: Season[];

  user: {
    uid: string | null;
    email: string | null;
    photoURL: string | null;
  };
  config: GeneratorConfig;
  composedPrompt: string;

  generatedMockups: GeneratedMockup[];
  isGenerating: boolean;
  generationError: string | null;
  variationCount: number;

  // Image analysis
  isAnalyzingImage: boolean;
  imageAnalysisError: string | null;

  savedMockups: GeneratedMockup[];
  promptTemplates: PromptTemplate[];
  promptHistory: string[];
  settings: AppSettings;
  activeNav: string;
  theme: 'light' | 'dark';
}

interface AppActions {
  addCustomSeason: (season: Season) => void;
  removeCustomSeason: (id: string) => void;

  setConfig: (patch: Partial<GeneratorConfig>) => void;
  setSeason: (season: Season | null) => void;
  setGarmentType: (type: GarmentType) => void;
  setDisplayType: (type: DisplayType) => void;
  setDesignStyle: (style: DesignStyle) => void;
  setComposedPrompt: (prompt: string) => void;
  setVariationCount: (n: number) => void;

  // Image
  setUploadedImage: (base64: string | undefined) => void;
  analyzeImage: () => Promise<void>;
  clearImageAnalysis: () => void;

  generate: () => Promise<void>;
  clearGenerationError: () => void;
  clearGeneratedMockups: () => void;

  saveToGallery: (mockup: GeneratedMockup) => void;
  removeFromGallery: (id: string) => void;
  toggleFavorite: (id: string) => void;

  saveTemplate: (name: string, prompt: string) => void;
  removeTemplate: (id: string) => void;

  updateSettings: (settings: AppSettings) => void;
  setUser: (user: { uid: string | null; email: string | null; photoURL: string | null }) => void;

  setActiveNav: (nav: string) => void;
  toggleTheme: () => void;
}

const DEFAULT_CONFIG: GeneratorConfig = {
  season: null,
  garmentType: 'tshirt',
  garmentColor: { name: 'Black', hex: '#1A1A1A' },
  displayType: 'flat_lay',
  designText: '',
  designStyle: 'retro',
  customPrompt: '',
  useCustomPrompt: false,
  uploadedImageBase64: undefined,
  uploadedImageAnalysis: undefined,
};

export const useAppStore = create<AppState & AppActions>()(
  immer((set, get) => ({
    customSeasons: [],
    allSeasons: [...PRESET_SEASONS],
    user: {
      uid: null,
      email: null,
      photoURL: null,
    },
    config: DEFAULT_CONFIG,
    composedPrompt: '',
    generatedMockups: [],
    isGenerating: false,
    generationError: null,
    variationCount: 2,
    isAnalyzingImage: false,
    imageAnalysisError: null,
    savedMockups: [],
    promptTemplates: [],
    promptHistory: [],
    settings: {
      providers: [
        {
          id: 'gemini',
          name: 'Google Gemini',
          apiKey: '',
          model: 'gemini-2.5-flash-image',
          models: [
            { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', description: 'Cân bằng giữa tốc độ và chất lượng (Ít lỗi 429)' },
            { value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image', description: 'Mới nhất, tạo ảnh chất lượng cao' },
            { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image', description: 'Chất lượng ảnh chuyên nghiệp' },
            { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', description: 'Tốt nhất cho phân tích văn bản/ảnh' },
            { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', description: 'Nhanh nhất cho xử lý ngôn ngữ' },
          ],
        },
        {
          id: 'openai',
          name: 'OpenAI',
          apiKey: '',
          model: 'dall-e-3',
          models: [
            { value: 'dall-e-3', label: 'DALL-E 3', description: 'Chất lượng cao nhất, hỗ trợ HD' },
            { value: 'dall-e-2', label: 'DALL-E 2', description: 'Nhanh hơn, rẻ hơn' },
          ],
        },
        {
          id: 'ideogram',
          name: 'Ideogram',
          apiKey: '',
          model: 'V_2',
          models: [
            { value: 'V_2', label: 'Ideogram v2', description: 'Tốt nhất cho text trên ảnh' },
            { value: 'V_2_TURBO', label: 'Ideogram v2 Turbo', description: 'Nhanh hơn v2' },
            { value: 'V_1', label: 'Ideogram v1', description: 'Phiên bản cổ điển' },
            { value: 'V_1_TURBO', label: 'Ideogram v1 Turbo', description: 'Nhanh nhất, rẻ nhất' },
          ],
        },
      ],
      activeProvider: 'gemini',
      theme: 'system',
      defaultGarmentType: 'tshirt',
      defaultDisplayType: 'flat_lay',
    },
    activeNav: 'dashboard',
    theme: 'light',

    addCustomSeason: (season) => {
      saveCustomSeason(season);
      set((s) => {
        s.customSeasons.push(season);
        s.allSeasons = [...PRESET_SEASONS, ...s.customSeasons];
      });
    },

    removeCustomSeason: (id) => {
      deleteCustomSeason(id);
      set((s) => {
        s.customSeasons = s.customSeasons.filter((cs) => cs.id !== id);
        s.allSeasons = [...PRESET_SEASONS, ...s.customSeasons];
      });
    },

    setConfig: (patch) => {
      set((s) => {
        Object.assign(s.config, patch);
        if (!s.config.useCustomPrompt) {
          s.composedPrompt = buildPrompt(s.config);
        }
      });
    },

    setSeason: (season) => {
      set((s) => {
        s.config.season = season;
        if (!s.config.useCustomPrompt) {
          s.composedPrompt = buildPrompt(s.config);
        }
      });
    },

    setGarmentType: (type) => {
      set((s) => {
        s.config.garmentType = type;
        if (!s.config.useCustomPrompt) {
          s.composedPrompt = buildPrompt(s.config);
        }
      });
    },

    setDisplayType: (type) => {
      set((s) => {
        s.config.displayType = type;
        if (!s.config.useCustomPrompt) {
          s.composedPrompt = buildPrompt(s.config);
        }
      });
    },

    setDesignStyle: (style) => {
      set((s) => {
        s.config.designStyle = style;
        if (!s.config.useCustomPrompt) {
          s.composedPrompt = buildPrompt(s.config);
        }
      });
    },

    setComposedPrompt: (prompt) => {
      set((s) => {
        s.composedPrompt = prompt;
      });
    },

    setVariationCount: (n) => {
      set((s) => {
        s.variationCount = n;
      });
    },

    // ---- Image upload & analysis ----
    setUploadedImage: (base64) => {
      set((s) => {
        s.config.uploadedImageBase64 = base64;
        // Reset analysis khi đổi ảnh
        s.config.uploadedImageAnalysis = undefined;
        s.imageAnalysisError = null;
        if (!s.config.useCustomPrompt) {
          s.composedPrompt = buildPrompt(s.config);
        }
      });
    },

    analyzeImage: async () => {
      const { config, settings } = get();
      if (!config.uploadedImageBase64) return;

      const provider = settings.providers.find((p) => p.id === 'gemini');
      if (!provider?.apiKey) {
        set((s) => {
          s.imageAnalysisError = 'Cần cấu hình Gemini API key trong Settings.';
        });
        return;
      }

      set((s) => {
        s.isAnalyzingImage = true;
        s.imageAnalysisError = null;
      });

      try {
        const analysis = await analyzeShirtImageWithGemini(provider.apiKey, config.uploadedImageBase64!);
        set((s) => {
          s.config.uploadedImageAnalysis = analysis;
          s.isAnalyzingImage = false;
          if (!s.config.useCustomPrompt) {
            s.composedPrompt = buildPrompt(s.config);
          }
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Phân tích ảnh thất bại';
        set((s) => {
          s.isAnalyzingImage = false;
          s.imageAnalysisError = message;
        });
      }
    },

    clearImageAnalysis: () => {
      set((s) => {
        s.config.uploadedImageBase64 = undefined;
        s.config.uploadedImageAnalysis = undefined;
        s.imageAnalysisError = null;
        if (!s.config.useCustomPrompt) {
          s.composedPrompt = buildPrompt(s.config);
        }
      });
    },

    // ---- Generation ----
    generate: async () => {
      const { config, composedPrompt, settings, variationCount } = get();
      if (!config.season) return;

      const prompt = config.useCustomPrompt ? config.customPrompt : composedPrompt;
      if (!prompt.trim()) return;

      const provider = settings.providers.find((p) => p.id === settings.activeProvider);
      if (!provider?.apiKey) {
        set((s) => {
          s.generationError = 'Please set your API key in Settings first.';
        });
        return;
      }

      set((s) => {
        s.isGenerating = true;
        s.generationError = null;
      });

      try {
        addPromptHistory(prompt);

        let urls: string[] = [];
        if (settings.activeProvider === 'openai') {
          urls = await generateWithOpenAI(provider.apiKey, prompt, variationCount, provider.model);
        } else if (settings.activeProvider === 'gemini') {
          urls = await generateWithGemini(provider.apiKey, prompt, variationCount, provider.model, config.uploadedImageBase64);
        } else if (settings.activeProvider === 'ideogram') {
          urls = await generateWithIdeogram(provider.apiKey, prompt, variationCount, provider.model);
        }

        const newMockups: GeneratedMockup[] = urls.map((url) => ({
          id: generateId(),
          url,
          prompt,
          config: { ...config },
          createdAt: Date.now(),
          seasonId: config.season!.id,
          seasonName: config.season!.name,
          isFavorite: false,
        }));

        // Cloud sync if user is logged in
        const { user } = get();
        if (user.uid) {
          for (const mockup of newMockups) {
            try {
              // Optionally upload to storage if URL is base64 or if we want cloud persistence
              // For now, these URLs are usually from AI providers (OpenAI/Gemini/Ideogram)
              // They might expire, so we SHOULD upload them to our Firebase Storage.
              const cloudUrl = await uploadMockupImage(user.uid, mockup.id, mockup.url);
              mockup.url = cloudUrl;
              await saveMockupToFirestore(user.uid, mockup);
            } catch (syncErr) {
              console.error('Failed to sync mockup to cloud:', syncErr);
            }
          }
        }

        set((s) => {
          s.generatedMockups = newMockups;
          s.isGenerating = false;
          s.promptHistory = getPromptHistory();
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Generation failed';
        set((s) => {
          s.isGenerating = false;
          s.generationError = message;
        });
      }
    },

    clearGenerationError: () => {
      set((s) => { s.generationError = null; });
    },

    clearGeneratedMockups: () => {
      set((s) => { s.generatedMockups = []; });
    },

    saveToGallery: (mockup) => {
      saveMockup(mockup);
      set((s) => { s.savedMockups = getMockups(); });

      // Cloud sync if logged in
      const { user } = get();
      if (user.uid) {
        saveMockupToFirestore(user.uid, mockup).catch(console.error);
      }
    },

    removeFromGallery: (id) => {
      const mockup = get().savedMockups.find(m => m.id === id);
      deleteMockup(id);
      set((s) => { s.savedMockups = s.savedMockups.filter((m) => m.id !== id); });

      // Cloud delete if logged in
      const { user } = get();
      if (user.uid && mockup?.firebaseId) {
        deleteUserMockup(user.uid, mockup.firebaseId).catch(console.error);
      }
    },

    toggleFavorite: (id) => {
      const mockup = get().savedMockups.find(m => m.id === id);
      toggleFavoriteMockup(id);
      set((s) => {
        s.savedMockups = s.savedMockups.map((m) =>
          m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
        );
      });

      // Cloud toggle if logged in
      const { user } = get();
      if (user.uid && mockup?.firebaseId) {
        toggleUserFavorite(user.uid, mockup.firebaseId, !mockup.isFavorite).catch(console.error);
      }
    },

    saveTemplate: (name, prompt) => {
      const template: PromptTemplate = {
        id: generateId(),
        name,
        prompt,
        createdAt: Date.now(),
      };
      savePromptTemplate(template);
      set((s) => { s.promptTemplates = getPromptTemplates(); });
    },

    removeTemplate: (id) => {
      deletePromptTemplate(id);
      set((s) => { s.promptTemplates = s.promptTemplates.filter((t) => t.id !== id); });
    },

    updateSettings: (settings) => {
      saveSettings(settings);
      set((s) => { s.settings = settings; });
    },

    setUser: (user) => {
      set((s) => {
        s.user = user;
      });
      // Load history when user changes
      if (user.uid) {
        getUserMockups(user.uid).then((mockups) => {
          set((s) => {
            s.savedMockups = [...getMockups(), ...mockups];
          });
        });
      }
    },

    setActiveNav: (nav) => {
      set((s) => { s.activeNav = nav; });
    },

    toggleTheme: () => {
      set((s) => { s.theme = s.theme === 'light' ? 'dark' : 'light'; });
    },
  }))
);

export function hydrateStore() {
  const store = useAppStore.getState();
  const customSeasons = getCustomSeasons();
  const savedMockups = getMockups();
  const promptTemplates = getPromptTemplates();
  const promptHistory = getPromptHistory();
  const settings = getSettings();

  useAppStore.setState({
    customSeasons,
    allSeasons: [...PRESET_SEASONS, ...customSeasons],
    savedMockups,
    promptTemplates,
    promptHistory,
    settings,
    config: {
      ...store.config,
      garmentType: settings.defaultGarmentType,
      displayType: settings.defaultDisplayType,
    },
  });
}
