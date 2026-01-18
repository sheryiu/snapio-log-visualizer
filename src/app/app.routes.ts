import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./routes/home/home').then(m => m.Home),
  },
  {
    path: 'visualize/:fileName',
    loadComponent: () => import('./routes/visualize/visualize').then(m => m.Visualize),
  },
  {
    path: '**',
    redirectTo: 'home',
  }
];
