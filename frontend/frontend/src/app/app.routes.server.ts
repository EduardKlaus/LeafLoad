import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static public pages can be pre-rendered
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'auth/login', renderMode: RenderMode.Prerender },
  { path: 'auth/signup', renderMode: RenderMode.Prerender },
  { path: 'auth/signup/restaurant', renderMode: RenderMode.Prerender },
  { path: 'impressum', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },

  // All other routes (account, orders, cart, dynamic restaurant pages)
  // must use Client rendering since they depend on auth/localStorage
  { path: '**', renderMode: RenderMode.Client },
];
