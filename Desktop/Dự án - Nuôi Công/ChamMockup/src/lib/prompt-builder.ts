import { GeneratorConfig, DisplayType, GarmentType, DesignStyle } from '@/types';

const DISPLAY_PROMPTS: Record<DisplayType, string> = {
  flat_lay:
    'A professional flat lay product mockup photographed from above on a clean surface, styled with seasonal props',
  hanging:
    'A professional hanging product mockup of a garment on a sleek hanger against a clean background',
  folded:
    'A professional neatly folded garment product mockup displayed on a clean flat surface',
  model_wearing:
    'A professional lifestyle product photo of a model wearing a',
  ghost_mannequin:
    'A professional ghost mannequin (invisible mannequin) product photo showing a',
  lifestyle:
    'A professional lifestyle scene product photo featuring a person wearing a',
};

const GARMENT_LABELS: Record<GarmentType, string> = {
  tshirt: 'crew-neck t-shirt',
  vneck: 'v-neck t-shirt',
  longsleeve: 'long-sleeve shirt',
  sweatshirt: 'crewneck sweatshirt',
  hoodie: 'pullover hoodie',
  tanktop: 'tank top',
  croptop: 'crop top',
};

const STYLE_PROMPTS: Record<DesignStyle, string> = {
  retro: 'retro 70s-inspired',
  vintage: 'vintage distressed',
  minimalist: 'clean minimalist',
  distressed: 'grunge distressed texture',
  hand_lettered: 'hand-lettered brush script',
  bold_graphic: 'bold graphic illustration',
  watercolor: 'soft watercolor illustration',
  sublimation: 'all-over vibrant sublimation print',
};

export function buildPrompt(config: GeneratorConfig): string {
  if (!config.season) return '';

  const { season, garmentType, garmentColor, displayType, designText, designStyle, uploadedImageAnalysis, uploadedImageBase64 } = config;

  const displayIntro = DISPLAY_PROMPTS[displayType];
  const garmentLabel = GARMENT_LABELS[garmentType];
  const styleLabel = STYLE_PROMPTS[designStyle];
  const colorPalette = season.colors.map((c) => c.name).join(', ');
  const keywords = season.keywords.slice(0, 4).join(', ');

  let prompt = '';

  if (uploadedImageBase64) {
    prompt = `${displayIntro}. Use the provided image as the absolute reference for both the graphic design and the garment color.`;
  } else if (displayType === 'flat_lay') {
    prompt = `${displayIntro}. The garment is a ${garmentColor.name.toLowerCase()} ${garmentLabel}`;
  } else if (displayType === 'hanging' || displayType === 'folded') {
    prompt = `${displayIntro} of a ${garmentColor.name.toLowerCase()} ${garmentLabel}`;
  } else {
    prompt = `${displayIntro} ${garmentColor.name.toLowerCase()} ${garmentLabel}`;
  }

  if (uploadedImageBase64) {
    prompt += ` Render a high-fidelity mockup by applying the design exactly as it appears onto the ${garmentLabel}, matching the shirt color perfectly from the source image. Do not change the colors or layout of the design.`;
    if (designText) {
      prompt += ` Verify the text "${designText}" is rendered exactly as shown in the reference.`;
    }
    prompt += ` Context: ${season.name} season with ${keywords} atmosphere.`;
  } else if (designText) {
    prompt += ` with a ${styleLabel} design`;
    prompt += `. The design features the text "${designText}" in ${styleLabel} typography`;
    prompt += `, surrounded by ${season.name} elements like ${keywords}`;
  } else {
    prompt += ` with a ${styleLabel} ${season.name} themed design`;
    prompt += ` featuring ${keywords} elements`;
  }

  prompt += `. Color palette: ${colorPalette}`;

  const seasonContext: Record<string, string> = {
    halloween: 'The overall mood is spooky yet stylish, suitable for Halloween season merchandise',
    christmas: 'The overall atmosphere is festive and warm, perfect for holiday gifting',
    valentines: "The overall feel is romantic and heartfelt, ideal for Valentine's Day",
    july4th: 'The overall theme is patriotic and celebratory, great for Independence Day',
    thanksgiving: 'The overall mood is warm, grateful, and family-oriented for Thanksgiving',
    summer: 'The overall feel is vibrant, fun, and beach-ready for summer',
    fall: 'The overall mood is cozy, warm, and autumnal',
    winter: 'The overall atmosphere is cool, minimal, and cozy for winter',
    spring: 'The overall feel is fresh, blooming, and full of renewal energy',
  };

  if (seasonContext[season.id]) {
    prompt += `. ${seasonContext[season.id]}`;
  }

  prompt += '. Professional product photography, high resolution, e-commerce ready, clean and appealing composition.';

  return prompt;
}

export function buildEtsyTags(config: GeneratorConfig): string[] {
  if (!config.season) return [];

  const { season, garmentType, designStyle } = config;
  const garmentLabel = GARMENT_LABELS[garmentType];

  const tags = [
    season.name.toLowerCase(),
    `${season.name.toLowerCase()} shirt`,
    `${season.name.toLowerCase()} ${garmentLabel}`,
    `${garmentLabel} gift`,
    ...season.keywords.slice(0, 5),
    designStyle.replace('_', ' '),
    'print on demand',
    'graphic tee',
    'unisex shirt',
    'gift idea',
    'USA seller',
  ];

  if (config.designText) {
    const words = config.designText.toLowerCase().split(' ');
    tags.push(...words.filter((w) => w.length > 3).slice(0, 3));
  }

  return [...new Set(tags)].slice(0, 13);
}
