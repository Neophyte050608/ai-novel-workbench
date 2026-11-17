import React from 'react';
import ReactDOM from 'react-dom/client';
import '@douyinfe/semi-ui/dist/css/semi.min.css';
import { AppProviders } from './app/providers/AppProviders';
import { App } from './app/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
