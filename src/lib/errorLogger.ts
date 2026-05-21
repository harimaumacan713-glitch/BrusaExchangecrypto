import { auth } from './firebase';

export interface LogErrorParams {
  message: string;
  stack?: string;
  source: string;
  context?: Record<string, any>;
}

export const logErrorToServer = async ({ message, stack, source, context = {} }: LogErrorParams) => {
  try {
    const user = auth.currentUser;
    const payload = {
      message,
      stack: stack || new Error().stack || null,
      source,
      url: typeof window !== 'undefined' ? window.location.href : null,
      userEmail: user?.email || 'Anonymous',
      userId: user?.uid || 'Anonymous',
      context,
    };

    console.warn(`[Client-Logged] Reporting error to server: ${message}`);

    const res = await fetch('/api/logs/error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn('Failed to submit log to backend. Status:', res.status);
    }
  } catch (err) {
    console.warn('Error during logErrorToServer:', err);
  }
};
