import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import App from './App.jsx';
import { I18nProvider } from './i18n/index.jsx';

const Router = typeof window !== 'undefined' && (
  window.__USE_HASH_ROUTER__
  || import.meta.env.VITE_USE_HASH_ROUTER === 'true'
  || window.location.protocol === 'file:'
)
  ? HashRouter
  : BrowserRouter;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <Router>
        <App />
      </Router>
    </I18nProvider>
  </React.StrictMode>
);
