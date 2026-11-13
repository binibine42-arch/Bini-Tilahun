import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

const CACHE_RESET_KEY = 'biniyam_cache_reset_v2';

async function purgeLegacyCachesIfNeeded() {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    if (window.localStorage.getItem(CACHE_RESET_KEY)) return;
    const keys = await window.caches.keys();
    await Promise.all(keys.map((key) => window.caches.delete(key)));
    window.localStorage.setItem(CACHE_RESET_KEY, new Date().toISOString());
  } catch {
    // Ignore storage or cache access issues in restricted contexts
  }
}

void purgeLegacyCachesIfNeeded();

registerSW({immediate: true});

createRoot(document.getElementById('root')!).render(<App />);
