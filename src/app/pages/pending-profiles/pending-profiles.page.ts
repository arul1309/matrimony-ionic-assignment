import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  HostListener,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastController, IonicModule } from '@ionic/angular';
import { ProfileService } from '../../services/profile.service';
import { Profile } from '../../models/profile.interface';
import { ProfileCardComponent } from '../../components/profile-card/profile-card.component';

@Component({
  selector: 'app-pending-profiles',
  templateUrl: './pending-profiles.page.html',
  styleUrls: ['./pending-profiles.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ProfileCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingProfilesPage implements OnInit, AfterViewInit {
  @ViewChild('listViewport') listViewport?: ElementRef<HTMLElement>;

  profiles: Profile[] = [];
  index = 0;
  canScrollPrev = false;
  canScrollNext = false;

  readonly appName = 'My Matches';

  constructor(
    private profileService: ProfileService,
    private toast: ToastController,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.profileService.seedProfiles();
    this.loadProfiles();
  }

  ionViewWillEnter(): void {
    this.loadProfiles();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateNavState(), 50);
  }

  get pendingCount(): number {
    return this.profiles.length;
  }

  get newCount(): number {
    return this.profiles.length;
  }

  get currentProfile(): Profile | null {
    return this.profiles[this.index] ?? null;
  }

  get visibleProfiles(): Profile[] {
    return this.profiles.slice(this.index);
  }

  get hasCurrentProfile(): boolean {
    return this.profiles.length > 0 && this.index < this.profiles.length;
  }

  scrollList(direction: 'left' | 'right'): void {
    const viewport = this.listViewport?.nativeElement;
    if (!viewport) return;
    const distance = Math.round(viewport.clientWidth * 0.7);
    const sign = direction === 'right' ? 1 : -1;
    viewport.scrollBy({ left: sign * distance, behavior: 'smooth' });
  }

  reject(profile?: Profile | null): void {
    const p = profile ?? this.currentProfile;
    if (!p) return;
    this.profileService.setProfileAction(p.id, 'reject');
    void this.showRejectToast();
    this.loadProfiles();
  }

  openProfile(profile?: Profile | null): void {
    const p = profile ?? this.currentProfile;
    if (p) this.router.navigate(['/view-profile', p.id]);
  }

  onPhotoSwipe(direction: 'next' | 'prev', listSlotIndex: number): void {
    if (listSlotIndex !== 0) return;
    if (direction === 'next' && this.index < this.profiles.length - 1) {
      this.index++;
      this.resetListScrollToStart();
    } else if (direction === 'prev' && this.index > 0) {
      this.index--;
      this.resetListScrollToStart();
    }
    this.updateNavState();
    this.cdr.markForCheck();
  }

  private resetListScrollToStart(): void {
    const viewport = this.listViewport?.nativeElement;
    if (viewport) viewport.scrollLeft = 0;
  }

  private loadProfiles(): void {
    this.profiles = this.profileService.getPendingProfiles();
    this.index = Math.min(this.index, Math.max(0, this.profiles.length - 1));
    this.updateNavState();
    this.cdr.markForCheck();
  }

  onListScroll(): void {
    this.updateNavState();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateNavState();
  }

  private updateNavState(): void {
    const viewport = this.listViewport?.nativeElement;
    if (!viewport) {
      this.canScrollPrev = false;
      this.canScrollNext = false;
      this.cdr.markForCheck();
      return;
    }
    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    this.canScrollPrev = viewport.scrollLeft > 4;
    this.canScrollNext = viewport.scrollLeft < maxScrollLeft - 4;
    this.cdr.markForCheck();
  }

  private async showRejectToast(): Promise<void> {
    const t = await this.toast.create({
      message: 'Not Interested',
      duration: 2000,
      position: 'bottom',
      cssClass: 'action-toast action-toast-reject',
    });
    await t.present();
  }
}