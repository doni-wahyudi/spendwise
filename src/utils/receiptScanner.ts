/**
 * Receipt Scanner Service
 * Uses OpenAI GPT or Google Gemini to extract transaction data from receipt images
 */

export interface ReceiptData {
    totalAmount: number | null;
    date: string | null;
    merchant: string | null;
    items: string | null;
    suggestedCategory: string | null;
}

// Default fallback models for each provider (vision-capable only)
export const DEFAULT_MODELS = {
    openai: [
        { id: 'gpt-5', name: 'GPT-5 (Latest)' },
        { id: 'o4-mini', name: 'o4-mini (Fast Reasoning)' },
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ],
    gemini: [
        { id: 'gemini-3-flash', name: 'Gemini 3 Flash (Latest)' },
        { id: 'gemini-3-pro', name: 'Gemini 3 Pro' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    ]
};

// Vision-capable model patterns for filtering
const VISION_MODEL_PATTERNS = {
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-5', 'o4', 'o3', 'o1'],
    gemini: ['gemini-2', 'gemini-3', 'gemini-1.5']
};

// Fetch available models from API
export async function fetchAvailableModels(
    provider: 'openai' | 'gemini',
    apiKey: string
): Promise<{ id: string; name: string }[]> {
    if (!apiKey) {
        throw new Error('API key required to fetch models');
    }

    try {
        if (provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            if (!response.ok) throw new Error('Failed to fetch OpenAI models');

            const data = await response.json();
            const models = data.data
                .filter((m: { id: string }) =>
                    VISION_MODEL_PATTERNS.openai.some(pattern => m.id.includes(pattern))
                )
                .map((m: { id: string }) => ({
                    id: m.id,
                    name: m.id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                }))
                .sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id));

            return models.length > 0 ? models : DEFAULT_MODELS.openai;

        } else {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );

            if (!response.ok) throw new Error('Failed to fetch Gemini models');

            const data = await response.json();
            const models = data.models
                .filter((m: { name: string; supportedGenerationMethods?: string[] }) =>
                    VISION_MODEL_PATTERNS.gemini.some(pattern => m.name.includes(pattern)) &&
                    m.supportedGenerationMethods?.includes('generateContent')
                )
                .map((m: { name: string; displayName?: string }) => ({
                    id: m.name.replace('models/', ''),
                    name: m.displayName || m.name.replace('models/', '')
                }))
                .sort((a: { id: string }, b: { id: string }) => b.id.localeCompare(a.id));

            return models.length > 0 ? models : DEFAULT_MODELS.gemini;
        }
    } catch (error) {
        console.error('Error fetching models:', error);
        return DEFAULT_MODELS[provider];
    }
};

// Convert image file to base64
async function imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const RECEIPT_PROMPT = `Analyze this receipt image and extract transaction details.
Return ONLY valid JSON with these fields:
{
  "total_amount": <number - final total without currency symbol, just the number>,
  "date": "<YYYY-MM-DD format or null if unclear>",
  "merchant": "<store/merchant name>",
  "items": "<brief 1-2 sentence summary of main items>",
  "suggested_category": "<one of: Food, Transport, Shopping, Bills, Entertainment, Health, Other>"
}

Important:
- Extract the TOTAL/GRAND TOTAL amount only
- Use null for any fields you cannot determine
- Date format must be YYYY-MM-DD
- Response must be valid JSON only, no other text`;

// Call OpenAI Vision API (supports custom base URL for OpenAI-compatible APIs)
async function scanWithOpenAI(imageBase64: string, apiKey: string, model: string, baseUrl: string): Promise<ReceiptData> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: RECEIPT_PROMPT },
                        {
                            type: 'image_url',
                            image_url: { url: imageBase64 }
                        }
                    ]
                }
            ],
            max_tokens: 500
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return parseReceiptResponse(content);
}

// Call Google Gemini API
async function scanWithGemini(imageBase64: string, apiKey: string, model: string): Promise<ReceiptData> {
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid image format');

    const mimeType = matches[1];
    const base64Data = matches[2];

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: RECEIPT_PROMPT },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }]
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return parseReceiptResponse(content);
}

// Parse JSON response from AI
function parseReceiptResponse(content: string): ReceiptData {
    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', content);
            return { totalAmount: null, date: null, merchant: null, items: null, suggestedCategory: null };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            totalAmount: parsed.total_amount ?? null,
            date: parsed.date || null,
            merchant: parsed.merchant || null,
            items: parsed.items || null,
            suggestedCategory: parsed.suggested_category || null
        };
    } catch (error) {
        console.error('Failed to parse receipt response:', error, content);
        return { totalAmount: null, date: null, merchant: null, items: null, suggestedCategory: null };
    }
}

// Main scan function
export async function scanReceipt(
    file: File,
    provider: 'openai' | 'gemini',
    apiKey: string,
    model: string,
    baseUrl: string = 'https://api.openai.com/v1'
): Promise<ReceiptData> {
    if (!apiKey) {
        throw new Error('API key not configured. Please add your API key in Settings.');
    }

    const imageBase64 = await imageToBase64(file);

    if (provider === 'openai') {
        return scanWithOpenAI(imageBase64, apiKey, model, baseUrl);
    } else {
        return scanWithGemini(imageBase64, apiKey, model);
    }
}
