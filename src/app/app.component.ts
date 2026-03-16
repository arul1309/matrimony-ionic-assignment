import { Component } from '@angular/core';
import { IONIC_IMPORTS } from './shared/ionic-imports';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [...IONIC_IMPORTS],
})
export class AppComponent {}
