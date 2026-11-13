import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import { LoginGate } from './auth/LoginGate';
import { CloudGate } from './cloud/CloudGate';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CloudGate>
      <LoginGate>
        <App />
      </LoginGate>
    </CloudGate>
  </StrictMode>,
);
