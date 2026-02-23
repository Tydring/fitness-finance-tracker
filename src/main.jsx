import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

import { UserStatsProvider } from './context/UserStatsContext';

// Register SW for purely offline capabilities (auto-updates handled by VitePWA natively)
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserStatsProvider>
          <App />
        </UserStatsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
