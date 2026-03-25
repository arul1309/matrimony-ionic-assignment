import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
})
export class AppComponent {
  constructor(private router: Router) { }

  isPendingMenuActive(): boolean {
    const path = this.currentPath();
    if (path === '/' || path === '') {
      return true;
    }
    return (
      path.startsWith('/pending-profiles') ||
      path.startsWith('/view-profile')
    );
  }

  isDailyMenuActive(): boolean {
    return this.currentPath().startsWith('/daily-recommendations');
  }

  private currentPath(): string {
    const url = this.router.url.split('#')[0].split('?')[0];
    return url === '' ? '/' : url;
  }
}
