import OpenAI from 'openai';

// ─── OpenAI DALL-E ───────────────────────────────────────────────────────────

export async function generateWithOpenAI(
  apiKey: string,
  prompt: string,
  count = 1,
  model = 'dall-e-3'
): Promise<string[]> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const size = model === 'dall-e-2' ? '1024x1024' : '1024x1024';
  const quality = model === 'dall-e-3' ? 'hd' : 'standard';

  const requests = Array.from({ length: count }, () =>
    client.images.generate({
      model,
      prompt,
      n: 1,
      size,
      quality: quality as 'hd' | 'standard',
    })
  );

  const results = await Promise.all(requests);
  return results.map((r) => r.data?.[0]?.url ?? '').filter(Boolean);
}

// ─── Google Gemini ────────────────────────────────────────────────────────────
// Supports both Imagen (`:predict`) and Gemini image generation (`:generateContent`)

export async function generateWithGemini(
  apiKey: string,
  prompt: string,
  count = 1,
  model = 'gemini-2.0-flash-preview-image-generation',
  imageBase64?: string
): Promise<string[]> {
  const isGeminiModel = model.startsWith('gemini-');

  if (isGeminiModel) {
    // Gemini generateContent API — returns inline base64 image parts
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Prepare content parts
    const parts: any[] = [{ text: prompt }];

    if (imageBase64) {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      const mimeType = match?.[1] ?? 'image/jpeg';
      const data = match?.[2] ?? imageBase64;
      parts.push({ inline_data: { mime_type: mimeType, data } });
    }

    const results: string[] = [];
    const requests = Array.from({ length: Math.min(count, 4) }, () =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      })
    );

    const responses = await Promise.all(requests);
    for (const res of responses) {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: { message?: string } }).error?.message ?? `Gemini error ${res.status}`
        );
      }
      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
        }>;
      };
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          results.push(`data:${mime};base64,${part.inlineData.data}`);
        }
      }
    }
    return results;
  }

  // Imagen :predict API (legacy)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: Math.min(count, 4) },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ?? `Gemini error ${res.status}`
    );
  }

  const data = (await res.json()) as {
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
  };

  return (data.predictions ?? [])
    .map((p) => {
      if (!p.bytesBase64Encoded) return '';
      const mime = p.mimeType ?? 'image/png';
      return `data:${mime};base64,${p.bytesBase64Encoded}`;
    })
    .filter(Boolean);
}

// ─── Ideogram ────────────────────────────────────────────────────────────────

export async function generateWithIdeogram(
  apiKey: string,
  prompt: string,
  count = 1,
  model = 'V_2'
): Promise<string[]> {
  const res = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_request: {
        prompt,
        model,
        aspect_ratio: 'ASPECT_1_1',
        num_images: Math.min(count, 4),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      (err as { message?: string }).message ??
      (err as { error?: string }).error ??
      `Ideogram error ${res.status}`;
    throw new Error(msg);
  }

  const data = (await res.json()) as { data?: Array<{ url?: string }> };
  return (data.data ?? []).map((d) => d.url ?? '').filter(Boolean);
}

// ─── Vision: phân tích ảnh áo ────────────────────────────────────────────────

const VISION_PROMPT = `Analyze this shirt/garment image and provide a concise description in English covering:
1. Garment type and color
2. Design/graphic: text content, illustration style, colors used
3. Overall theme and mood
4. Font/typography style if text is present
5. Notable icons, motifs, or graphical elements
Be specific and visual. Under 150 words.`;

export async function analyzeShirtImage(
  apiKey: string,
  imageBase64: string
): Promise<string> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageBase64, detail: 'high' } },
          { type: 'text', text: VISION_PROMPT },
        ],
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

export async function analyzeShirtImageWithGemini(
  apiKey: string,
  imageBase64: string
): Promise<string> {
  // Strip data URL prefix to get raw base64 + mimeType
  const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = match?.[1] ?? 'image/jpeg';
  const base64Data = match?.[2] ?? imageBase64;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Data } },
          { text: VISION_PROMPT },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ?? `Gemini vision error ${res.status}`
    );
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim() ?? '';
}

// ─── Test API key ─────────────────────────────────────────────────────────────

export async function testApiKey(provider: string, apiKey: string): Promise<boolean> {
  try {
    if (provider === 'openai') {
      const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      await client.models.list();
      return true;
    }
    if (provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      return res.ok;
    }
    if (provider === 'ideogram') {
      // Ideogram: thử generate 1 ảnh nhanh — dùng endpoint check credits
      const res = await fetch('https://api.ideogram.ai/user/credits', {
        headers: { 'Api-Key': apiKey },
      });
      return res.ok;
    }
    return false;
  } catch {
    return false;
  }
}
