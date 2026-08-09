import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { App } from './components/App';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element not found.');
}

createRoot(rootEl).render(
  <StrictMode>
    <App shopDomain={rootEl.dataset.shop || ''} />
  </StrictMode>,
);
