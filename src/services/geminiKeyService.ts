const STORAGE_KEY = 'gemini_api_key';

type KeyChangeListener = (key: string | null) => void;
const listeners = new Set<KeyChangeListener>();

export const geminiKeyService = {
  getStoredApiKey(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      const key = localStorage.getItem(STORAGE_KEY);
      return key ? key.trim() : null;
    } catch {
      return null;
    }
  },

  setStoredApiKey(key: string): void {
    try {
      const cleanKey = key.trim();
      localStorage.setItem(STORAGE_KEY, cleanKey);
      listeners.forEach((listener) => listener(cleanKey));
    } catch {
      // Storage unavailable
    }
  },

  clearStoredApiKey(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      listeners.forEach((listener) => listener(null));
    } catch {
      // Storage unavailable
    }
  },

  hasApiKey(): boolean {
    const key = this.getStoredApiKey();
    return Boolean(key && key.length > 5);
  },

  subscribe(listener: KeyChangeListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async verifyKeyOnServer(key: string): Promise<{ valid: boolean; message: string }> {
    try {
      const res = await fetch('/api/gemini/verify-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: key.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { valid: true, message: data.message || 'Key is valid and active!' };
      }
      return { valid: false, message: data.message || 'Invalid Gemini API key.' };
    } catch (err: any) {
      return {
        valid: false,
        message: err?.message || 'Unable to contact verification server. Check your internet connection.',
      };
    }
  },
};
