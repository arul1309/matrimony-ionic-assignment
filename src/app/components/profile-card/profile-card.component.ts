/* eslint-disable @angular-eslint/no-output-native */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Gesture, GestureController, IonicModule } from '@ionic/angular';
import {
  Profile,
  getProfileDetailsLine,
  getProfileSummaryBullets,
} from '../../models/profile.interface';

const PHOTO_SWIPE_THRESHOLD_PX = 56;

@Component({
  selector: 'app-profile-card',
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileCardComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('photoRef', { read: ElementRef }) photoRef?: ElementRef<HTMLElement>;

  @Input() profile!: Profile;

  @Output() reject = new EventEmitter<void>();
  @Output() open = new EventEmitter<void>();
  @Output() photoSwipe = new EventEmitter<'next' | 'prev'>();

  private photoGesture?: Gesture;

  constructor(private gestureCtrl: GestureController) { }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.bindPhotoSwipeGesture());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profile']) {
      queueMicrotask(() => this.bindPhotoSwipeGesture());
    }
  }

  ngOnDestroy(): void {
    this.photoGesture?.destroy();
    this.photoGesture = undefined;
  }

  get detailsText(): string {
    const summary = getProfileSummaryBullets(this.profile ?? null);
    return summary || getProfileDetailsLine(this.profile ?? null);
  }

  private bindPhotoSwipeGesture(): void {
    this.photoGesture?.destroy();
    this.photoGesture = undefined;

    const el = this.photoRef?.nativeElement;
    if (!el || !this.profile) return;

    this.photoGesture = this.gestureCtrl.create(
      {
        el,
        gestureName: 'pending-profile-photo-swipe',
        threshold: 8,
        disableScroll: false,
        onEnd: (ev: { deltaX?: number }) => {
          const dx = ev.deltaX ?? 0;
          if (dx < -PHOTO_SWIPE_THRESHOLD_PX) {
            this.photoSwipe.emit('next');
          } else if (dx > PHOTO_SWIPE_THRESHOLD_PX) {
            this.photoSwipe.emit('prev');
          }
        },
      },
      true
    );

    this.photoGesture.enable();
  }

  onOpen(event: Event): void {
    event.stopPropagation();
    this.open.emit();
  }

  onReject(event: Event): void {
    event.stopPropagation();
    this.reject.emit();
  }

}
