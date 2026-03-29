import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { TabApp } from './TabApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TabApp />
  </StrictMode>,
);
