// ==========================================================================
// CampusCare — Router: hash navigation. Decoupled so page modules can
// navigate without importing app.js (avoids a circular dependency).
// ==========================================================================

let routeHandler = null;

/** Register the function that renders the current route (called by app.js). */
export function setRouteHandler(fn) {
  routeHandler = fn;
}

/**
 * Navigate to a hash route (e.g. '#/pengaduan').
 * If the hash is unchanged we trigger the handler directly; otherwise the
 * browser's hashchange event (listened to by app.js) performs the render.
 */
export async function navigate(hash) {
  if (location.hash === hash) {
    if (routeHandler) await routeHandler();
  } else {
    location.hash = hash;
  }
}

/** Route to the top-level path (used after login). */
export function navigateHome() {
  location.hash = '#/dashboard';
}
