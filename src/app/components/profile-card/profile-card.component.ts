import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IONIC_IMPORTS } from '../../shared/ionic-imports';
import {
  Profile,
  getProfileDetailsLine,
  getProfileSummaryBullets,
  getProfileTags,
} from '../../models/profile.interface';

@Component({
  selector: 'app-profile-card',
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss',
  standalone: true,
  imports: [CommonModule, ...IONIC_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCardComponent {
  @ViewChild('cardRef', { read: ElementRef }) cardRef?: ElementRef<HTMLElement>;

  @Input() profile!: Profile;

  @Output() like = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();
  @Output() shortlist = new EventEmitter<void>();
  @Output() open = new EventEmitter<void>();

  get detailsText(): string {
    const summary = getProfileSummaryBullets(this.profile ?? null);
    return summary || getProfileDetailsLine(this.profile ?? null);
  }

  get profileTags(): string[] {
    return getProfileTags(this.profile ?? null);
  }

  getCardElement(): HTMLElement | null {
    return this.cardRef?.nativeElement ?? null;
  }

  onOpen(event: Event): void {
    event.stopPropagation();
    this.open.emit();
  }

  onLike(event: Event): void {
    event.stopPropagation();
    this.like.emit();
  }

  onReject(event: Event): void {
    event.stopPropagation();
    this.reject.emit();
  }

  onShortlist(event: Event): void {
    event.stopPropagation();
    this.shortlist.emit();
  }
}
