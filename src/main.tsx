import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AppProviders } from './app/AppProviders';
import { createDependencies } from './app/container';
import { router } from './app/router';
import { startCallSimulator } from './modules/calls';
import { startKpiSimulator } from './modules/dashboard';
import { initializeColorTheme } from './shared/theme/colorTheme';
import './styles/tokens.css';
import './styles/base.css';
import './styles/forms.css';
import './styles/view-transitions.css';

initializeColorTheme();

// Keeps the mock KPIs (and their «نسبت به ساعت قبل» deltas) live. Remove with the mocks.
startKpiSimulator();
// Same for the call cards in «تماس‌ها و ساعات پیک», which read the same array as the call table.
startCallSimulator();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders dependencies={createDependencies()}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
