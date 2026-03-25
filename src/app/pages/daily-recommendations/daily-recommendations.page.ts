import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Profile } from '../../models/profile.interface';
import { ProfileAction, ProfileService } from '../../services/profile.service';
import { DailyRecommendationCardComponent } from '../../components/daily-recommendation-card/daily-recommendation-card.component';

type SwipeDirection = 'left' | 'right' | 'up';

const SWIPE_THRESHOLD_PX = 40;
const SWIPE_OUT_MS = 280;
const CARD_ENTER_MS = 300;
const STACK_PEEK_ENTER_Y_PX = -22;
const STACK_PEEK_ENTER_SCALE = 0.98;

const DIRECTION_LOCK_PX = 14;

const ACTION_CONFIG: Record<ProfileAction, { message: string; toastType: string; direction: SwipeDirection }> = {
  interested: { message: 'Interested', toastType: 'interested', direction: 'right' },
  reject: { message: 'Not Interested', toastType: 'reject', direction: 'left' },
  shortlist: { message: 'Shortlisted', toastType: 'shortlist', direction: 'up' },
};

@Component({
  selector: 'app-daily-recommendations',
  templateUrl: './daily-recommendations.page.html',
  styleUrls: ['./daily-recommendations.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, DailyRecommendationCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyRecommendationsPage implements OnInit, AfterViewInit {
  @ViewChild('topCard') topCardRef?: ElementRef<HTMLElement>;

  profiles: Profile[] = [];

  private swipeEl: HTMLElement | null = null;
  private swipeBusy = false;
  private swipeDirection: 'horizontal' | 'vertical' | null = null;
  private activePointerId: number | null = null;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private detachPointerSwipe: (() => void) | null = null;

  private shouldEnableSwipeGesture(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  }

  constructor(
    private profileService: ProfileService,
    private toast: ToastController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileService.seedProfiles();
    this.profiles = this.profileService.getPendingProfiles();

    this.setupViewport();
  }

  private setupViewport(): void {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(min-width: 768px)');
    mql.addEventListener?.('change', () => {
      this.releasePointerHandlers();
      this.cdr.markForCheck();
      if (this.shouldEnableSwipeGesture()) {
        setTimeout(() => this.bindGesture(), 80);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.shouldEnableSwipeGesture()) setTimeout(() => this.bindGesture(), 180);
  }

  get currentProfile(): Profile | null {
    return this.profiles[0] ?? null;
  }

  get hasCurrentProfile(): boolean {
    return !!this.currentProfile;
  }

  interested(): void {
    this.runAction('interested', true);
  }

  reject(): void {
    this.runAction('reject', true);
  }

  shortlist(): void {
    this.runAction('shortlist', true);
  }

  private bindGesture(): void {
    if (!this.shouldEnableSwipeGesture()) return;
    this.detachPointerSwipe?.();
    this.detachPointerSwipe = null;

    this.swipeEl = this.topCardRef?.nativeElement ?? null;
    if (!this.swipeEl || !this.hasCurrentProfile) return;

    const el = this.swipeEl;
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0) rotate(0deg) scale(1)';

    const resetCardTransform = () => {
      if (!this.swipeEl) return;
      this.swipeEl.style.transition = 'transform 180ms ease';
      this.swipeEl.style.transform = 'translateX(-50%) translateY(0) rotate(0deg) scale(1)';
    };

    const applyMove = (rawDx: number, rawDy: number) => {
      if (!this.swipeEl || this.swipeBusy) return;
      this.swipeEl.style.transition = 'none';
      const absX = Math.abs(rawDx);
      const absY = Math.abs(rawDy);

      if (!this.swipeDirection) {
        if (absX < DIRECTION_LOCK_PX && absY < DIRECTION_LOCK_PX) {
          return;
        }
        this.swipeDirection = absY >= absX * 0.85 ? 'vertical' : 'horizontal';
      }

      const dx = Math.max(Math.min(rawDx, 130), -130);
      const dy = Math.max(Math.min(rawDy, 120), -120);

      if (this.swipeDirection === 'vertical') {
        this.swipeEl.style.transform = `translateX(-50%) translateY(${dy}px)`;
      } else {
        const rotate = dx / 22;
        this.swipeEl.style.transform = `translateX(calc(-50% + ${dx}px)) rotate(${rotate}deg)`;
      }
    };

    const endDrag = (rawDx: number, rawDy: number) => {
      if (!this.swipeEl || this.swipeBusy) return;

      let action: ProfileAction | null = null;
      const isUp = rawDy < -22;
      const mostlyUp =
        rawDy < -26 && Math.abs(rawDy) > Math.abs(rawDx) * 0.75;

      if (!this.swipeDirection && mostlyUp) {
        action = 'shortlist';
      } else if (this.swipeDirection === 'vertical' && isUp) {
        action = 'shortlist';
      } else if (
        this.swipeDirection === 'horizontal' &&
        mostlyUp &&
        Math.abs(rawDx) < SWIPE_THRESHOLD_PX + 12
      ) {
        action = 'shortlist';
      } else if (this.swipeDirection === 'horizontal' && rawDx > SWIPE_THRESHOLD_PX) {
        action = 'interested';
      } else if (this.swipeDirection === 'horizontal' && rawDx < -SWIPE_THRESHOLD_PX) {
        action = 'reject';
      }

      this.swipeDirection = null;

      if (!action) {
        resetCardTransform();
        return;
      }
      this.runAction(action, true);
    };

    const onPointerDown = (ev: PointerEvent) => {
      if (this.swipeBusy || ev.button !== 0) return;
      this.activePointerId = ev.pointerId;
      this.pointerStartX = ev.clientX;
      this.pointerStartY = ev.clientY;
      this.swipeDirection = null;
      try {
        el.setPointerCapture(ev.pointerId);
      } catch {
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (ev.pointerId !== this.activePointerId || this.swipeBusy) return;
      const rawDx = ev.clientX - this.pointerStartX;
      const rawDy = ev.clientY - this.pointerStartY;
      applyMove(rawDx, rawDy);
    };

    const onPointerUp = (ev: PointerEvent) => {
      if (ev.pointerId !== this.activePointerId) return;
      this.activePointerId = null;
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
      }
      const rawDx = ev.clientX - this.pointerStartX;
      const rawDy = ev.clientY - this.pointerStartY;
      endDrag(rawDx, rawDy);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    this.detachPointerSwipe = () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      this.detachPointerSwipe = null;
    };

  }

  private releasePointerHandlers(): void {
    this.detachPointerSwipe?.();
    this.activePointerId = null;
    this.swipeEl = null;
  }

  private runAction(action: ProfileAction, animateOut: boolean): void {
    const p = this.currentProfile;
    if (!p || this.swipeBusy) return;

    const { message, toastType, direction } = ACTION_CONFIG[action];
    this.profileService.setProfileAction(p.id, action);
    this.showToast(message, toastType);

    const cardEl = this.swipeEl ?? this.topCardRef?.nativeElement ?? null;

    if (!animateOut || !cardEl) {
      this.completeCardShift({ animateInFromTop: false });
      return;
    }

    this.swipeBusy = true;
    const x = direction === 'right' ? 520 : direction === 'left' ? -520 : 0;
    const y = direction === 'up' ? -480 : 0;
    const rotate = direction === 'right' ? 14 : direction === 'left' ? -14 : 0;
    const scale = direction === 'up' ? 0.95 : 0.98;

    cardEl.style.transition = `transform ${SWIPE_OUT_MS}ms ease, opacity ${SWIPE_OUT_MS}ms ease`;
    cardEl.style.opacity = '0';
    cardEl.style.transform = `translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${rotate}deg) scale(${scale})`;

    setTimeout(() => {
      this.completeCardShift({ animateInFromTop: true });
    }, SWIPE_OUT_MS);
  }

  private completeCardShift(options?: { animateInFromTop?: boolean }): void {
    const animateIn = options?.animateInFromTop === true;

    this.profiles = this.profileService.getPendingProfiles();

    this.swipeBusy = false;
    this.releasePointerHandlers();

    const cardEl = this.topCardRef?.nativeElement ?? null;

    if (cardEl && this.hasCurrentProfile && animateIn) {
      this.cdr.detectChanges();
      cardEl.style.transition = 'none';
      cardEl.style.opacity = '0';
      cardEl.style.transform = `translateX(-50%) translateY(${STACK_PEEK_ENTER_Y_PX}px) scale(${STACK_PEEK_ENTER_SCALE}) rotate(0deg)`;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = this.topCardRef?.nativeElement;
          if (!el || !this.hasCurrentProfile) {
            return;
          }
          el.style.transition = `transform ${CARD_ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${Math.min(280, CARD_ENTER_MS)}ms ease`;
          el.style.opacity = '1';
          el.style.transform =
            'translateX(-50%) translateY(0) scale(1) rotate(0deg)';
        });
      });
    } else if (cardEl && this.hasCurrentProfile) {
      cardEl.style.transition = 'none';
      cardEl.style.opacity = '1';
      cardEl.style.transform =
        'translateX(-50%) translateY(0) rotate(0deg) scale(1)';
    }

    this.cdr.markForCheck();

    const rebindDelay =
      cardEl && this.hasCurrentProfile && animateIn ? CARD_ENTER_MS + 48 : 24;
    setTimeout(() => {
      if (this.shouldEnableSwipeGesture()) this.bindGesture();
    }, rebindDelay);
  }

  private async showToast(message: string, toastType: string): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 1800,
      position: 'bottom',
      cssClass: `action-toast action-toast-${toastType}`,
    });
    await t.present();
  }
}
