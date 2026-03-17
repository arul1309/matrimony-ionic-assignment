import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastController, GestureController, IonicModule } from '@ionic/angular';
import { ProfileService, ProfileAction } from '../../services/profile.service';
import { Profile } from '../../models/profile.interface';
import { ProfileCardComponent } from '../../components/profile-card/profile-card.component';

const SWIPE_OUT_MS = 320;
const SWIPE_THRESHOLD_PX = 80;
const GESTURE_THRESHOLD = 8;
const GESTURE_PRIORITY_X = 50;
const GESTURE_PRIORITY_Y = 40;
const CARD_ENTER_RESET_MS = 340;
const GESTURE_REATTACH_MS = 50;

const ACTION_CONFIG: Record<
  ProfileAction,
  { message: string; toastType: string; direction: SwipeDirection }
> = {
  interested: { message: 'Interested', toastType: 'interested', direction: 'right' },
  reject: { message: 'Not Interested', toastType: 'reject', direction: 'left' },
  shortlist: { message: 'Shortlisted', toastType: 'shortlist', direction: 'up' },
};

export type SwipeDirection = 'left' | 'right' | 'up';

@Component({
  selector: 'app-pending-profiles',
  templateUrl: './pending-profiles.page.html',
  styleUrls: ['./pending-profiles.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ProfileCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingProfilesPage implements OnInit, AfterViewInit {
  @ViewChild(ProfileCardComponent) profileCardRef?: ProfileCardComponent;

  profiles: Profile[] = [];
  index = 0;
  isExiting = false;
  exitDirection: SwipeDirection | null = null;
  cardJustEntered = false;

  readonly appName = 'Matrimony.com';

  private gestureSetup = false;
  private swipeHandled = false;

  constructor(
    private profileService: ProfileService,
    private toast: ToastController,
    private router: Router,
    private gestureCtrl: GestureController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileService.seedProfiles();
    this.loadProfiles();
  }

  ionViewWillEnter(): void {
    this.loadProfiles();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.setupSwipeGesture(), 100);
  }

  get pendingCount(): number {
    return this.profiles.length;
  }

  get newCount(): number {
    return Math.min(5, this.profiles.length);
  }

  get currentProfile(): Profile | null {
    return this.profiles[this.index] ?? null;
  }

  get hasCurrentProfile(): boolean {
    return this.profiles.length > 0 && this.index < this.profiles.length;
  }

  /** Peek cards behind the front card (next two profiles) for stack effect */
  get peekCards(): { profile: Profile; side: 'left' | 'right' }[] {
    const out: { profile: Profile; side: 'left' | 'right' }[] = [];
    const p2 = this.profiles[this.index + 2];
    const p1 = this.profiles[this.index + 1];
    if (p2) out.push({ profile: p2, side: 'left' });
    if (p1) out.push({ profile: p1, side: 'right' });
    return out;
  }

  get frontCardClasses(): Record<string, boolean> {
    return {
      'swipe-out-right': this.isExiting && this.exitDirection === 'right',
      'swipe-out-left': this.isExiting && this.exitDirection === 'left',
      'swipe-out-up': this.isExiting && this.exitDirection === 'up',
      'card-enter': this.cardJustEntered,
    };
  }

  interested(): void {
    this.triggerAction('interested');
  }

  reject(): void {
    this.triggerAction('reject');
  }

  shortlist(): void {
    this.triggerAction('shortlist');
  }

  openProfile(): void {
    const profile = this.currentProfile;
    if (profile) this.router.navigate(['/view-profile', profile.id]);
  }

  private loadProfiles(): void {
    this.profiles = this.profileService.getPendingProfiles();
    this.index = Math.min(this.index, Math.max(0, this.profiles.length - 1));
    this.gestureSetup = false;
    this.cdr.markForCheck();
  }

  private nextProfile(): void {
    if (this.index >= this.profiles.length) return;
    this.index++;
    this.gestureSetup = false;
    if (this.index < this.profiles.length) {
      this.cardJustEntered = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.cardJustEntered = false;
        this.cdr.markForCheck();
      }, CARD_ENTER_RESET_MS);
      setTimeout(() => this.setupSwipeGesture(), GESTURE_REATTACH_MS);
    } else {
      this.cdr.markForCheck();
    }
  }

  private triggerAction(action: ProfileAction): void {
    const profile = this.currentProfile;
    if (profile) this.profileService.setProfileAction(profile.id, action);
    const { message, toastType, direction } = ACTION_CONFIG[action];
    this.showToast(message, toastType);
    this.runExitAnimation(direction, () => this.nextProfile());
  }

  private runExitAnimation(direction: SwipeDirection, onDone: () => void): void {
    if (this.isExiting) return;
    this.isExiting = true;
    this.exitDirection = direction;
    this.cdr.markForCheck();
    setTimeout(() => {
      onDone();
      this.isExiting = false;
      this.exitDirection = null;
      this.cdr.markForCheck();
    }, SWIPE_OUT_MS);
  }

  private async showToast(message: string, toastType: string): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 2000,
      position: 'bottom',
      cssClass: `action-toast action-toast-${toastType}`,
    });
    await t.present();
  }

  private getSwipeAction(
    deltaX: number,
    deltaY: number,
    isVertical: boolean
  ): ProfileAction | null {
    if (isVertical && deltaY < -SWIPE_THRESHOLD_PX) return 'shortlist';
    if (!isVertical && deltaX > SWIPE_THRESHOLD_PX) return 'interested';
    if (!isVertical && deltaX < -SWIPE_THRESHOLD_PX) return 'reject';
    return null;
  }

  private setupSwipeGesture(): void {
    if (this.gestureSetup || !this.profiles.length) return;
    const cardEl = this.profileCardRef?.getCardElement();
    if (!cardEl) return;

    const handleEnd = (
      ev: { deltaX: number; deltaY: number },
      isVertical: boolean
    ) => {
      if (this.swipeHandled || this.isExiting) return;
      const action = this.getSwipeAction(ev.deltaX, ev.deltaY, isVertical);
      if (action) {
        this.swipeHandled = true;
        this.triggerAction(action);
        setTimeout(() => (this.swipeHandled = false), 400);
      }
    };

    const gestureOpts = {
      el: cardEl,
      threshold: GESTURE_THRESHOLD,
      disableScroll: true,
      passive: false,
      onMove: (e: { event?: Event }) => e.event?.preventDefault?.(),
    };

    const horizontal = this.gestureCtrl.create(
      {
        ...gestureOpts,
        gestureName: 'profile-swipe-x',
        direction: 'x',
        gesturePriority: GESTURE_PRIORITY_X,
        maxAngle: 25,
        onEnd: (ev: { deltaX: number; deltaY: number }) => handleEnd(ev, false),
      },
      true
    );
    const vertical = this.gestureCtrl.create(
      {
        ...gestureOpts,
        gestureName: 'profile-swipe-y',
        direction: 'y',
        gesturePriority: GESTURE_PRIORITY_Y,
        maxAngle: 20,
        onEnd: (ev: { deltaX: number; deltaY: number }) => handleEnd(ev, true),
      },
      true
    );

    horizontal.enable();
    vertical.enable();
    this.gestureSetup = true;
  }
}
