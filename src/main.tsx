import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './styles.css';
import './card.css';
import './card-extras.css';
import './deck.css';
import './mobile.css'; /* must be last — overrides card.css desktop modal sizes */

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
