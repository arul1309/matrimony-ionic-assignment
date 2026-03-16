import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'pending-profiles',
    pathMatch: 'full'
  },
  {
    path: 'pending-profiles',
    loadComponent: () =>
      import('./pages/pending-profiles/pending-profiles.page')
      .then(m => m.PendingProfilesPage)
  },
  {
    path: 'view-profile/:id',
    loadComponent: () =>
      import('./pages/view-profile/view-profile.page')
      .then(m => m.ViewProfilePage)
  }
];