import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ServicesProvider } from './context/ServicesContext';

import './styles.css';
import './card.css';
import './card-extras.css';
import './deck.css';
import './mobile.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ServicesProvider>
      <App />
    </ServicesProvider>
  </React.StrictMode>,
);
