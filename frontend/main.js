// ==========================================================================
// CampusCare — entry point
// ==========================================================================
import './css/variables.css';
import './css/base.css';
import './css/layout.css';
import './css/components.css';
import './css/pages.css';

import { initApp } from './js/app.js';

// Boot the SPA once the DOM is ready.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
