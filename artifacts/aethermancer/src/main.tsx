import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

// Request landscape lock on mobile (works on Android Chrome + some PWA contexts).
// Silently ignored on unsupported browsers.
if (typeof screen !== 'undefined' && screen.orientation && (screen.orientation as any).lock) {
  (screen.orientation as any).lock('landscape').catch(() => {/* not supported — overlay handles it */});
}

createRoot(document.getElementById('root')!).render(<App />);
