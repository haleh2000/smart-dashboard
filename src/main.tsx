import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AppProviders } from './app/AppProviders';
import { createDependencies } from './app/container';
import { router } from './app/router';
import { initializeColorTheme } from './shared/theme/colorTheme';
import './styles/tokens.css';
import './styles/base.css';
import './styles/forms.css';
import './styles/view-transitions.css';

initializeColorTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders dependencies={createDependencies()}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
