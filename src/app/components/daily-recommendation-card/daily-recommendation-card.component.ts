/* eslint-disable @angular-eslint/no-output-native */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Profile, getProfileDetailsLine } from '../../models/profile.interface';

@Component({
  selector: 'app-daily-recommendation-card',
  templateUrl: './daily-recommendation-card.component.html',
  styleUrls: ['./daily-recommendation-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyRecommendationCardComponent {
  @Input() profile!: Profile;
  @Output() like = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();
  @Output() shortlist = new EventEmitter<void>();

  get detailsLine(): string {
    return getProfileDetailsLine(this.profile ?? null);
  }

  get imageCount(): number {
    const imgs = this.profile?.images;
    if (Array.isArray(imgs) && imgs.length > 0) return imgs.length;
    return this.profile?.image ? 1 : 0;
  }
}
