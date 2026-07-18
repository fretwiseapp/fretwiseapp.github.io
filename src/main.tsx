import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { attachAudioPriming } from '@audio/index';
import './ui/styles.css';

attachAudioPriming();

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing');
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
