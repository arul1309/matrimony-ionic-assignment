import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { ProfileService } from '../../services/profile.service';
import { Profile, getProfileDetailsLine } from '../../models/profile.interface';

export interface InfoRow {
  key: string;
  value: string;
}

@Component({
  selector: 'app-view-profile',
  templateUrl: './view-profile.page.html',
  styleUrls: ['./view-profile.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewProfilePage implements OnInit, OnDestroy {
  profile: Profile | null = null;
  currentImageIndex = 0;

  @ViewChild('imageScroller') private imageScrollerRef?: ElementRef<HTMLElement>;
  private mobileScrollRaf = 0;
  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private toast: ToastController,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap
      .pipe(
        map((pm) => Number(pm.get('id'))),
        distinctUntilChanged()
      )
      .subscribe((id) => {
        if (!Number.isFinite(id) || id <= 0) {
          void this.router.navigate(['/pending-profiles']);
          return;
        }
        this.profileService.seedProfiles();
        this.profile = this.profileService.getProfileById(id);
        if (!this.profile) {
          void this.router.navigate(['/pending-profiles']);
          return;
        }
        this.currentImageIndex = 0;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  get profileId(): string {
    return this.profile?.profileId ?? '';
  }

  get images(): string[] {
    if (!this.profile) return [];
    const list = this.profile.images;
    return Array.isArray(list) && list.length > 0
      ? list
      : this.profile.image
        ? [this.profile.image]
        : [];
  }

  nextImage(): void {
    const len = this.images.length;
    if (len < 2) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % len;
    this.cdr.markForCheck();
    this.syncMobileScrollerToIndex();
  }

  prevImage(): void {
    const len = this.images.length;
    if (len < 2) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + len) % len;
    this.cdr.markForCheck();
    this.syncMobileScrollerToIndex();
  }

  onMobileImageScroll(): void {
    if (this.mobileScrollRaf) cancelAnimationFrame(this.mobileScrollRaf);
    this.mobileScrollRaf = requestAnimationFrame(() => {
      const el = this.imageScrollerRef?.nativeElement;
      if (!el) return;

      const width = el.clientWidth;
      if (!width) return;

      const idx = Math.round(el.scrollLeft / width);
      const clamped = Math.max(0, Math.min(this.images.length - 1, idx));
      if (clamped !== this.currentImageIndex) {
        this.currentImageIndex = clamped;
        this.cdr.markForCheck();
      }
    });
  }

  private syncMobileScrollerToIndex(): void {
    const el = this.imageScrollerRef?.nativeElement;
    if (!el) return;
    const width = el.clientWidth;
    if (!width) return;
    el.scrollTo({ left: this.currentImageIndex * width, behavior: 'smooth' });
  }

  get detailsLine(): string {
    return getProfileDetailsLine(this.profile);
  }

  get locationLine(): string {
    if (!this.profile?.location && !this.profile?.state) return '';
    const loc = this.profile.location ?? '';
    const state = this.profile.state ? `, ${this.profile.state}` : '';
    return loc + state;
  }

  get salaryDisplay(): string {
    const v = this.profile?.salaryLpa;
    if (v == null) return '';
    if (typeof v === 'number' && v > 0) return `${v} LPA`;
    if (typeof v === 'string' && v.trim()) return v.trim();
    return '';
  }

  get basicInfoRows(): InfoRow[] {
    const p = this.profile;
    if (!p) return [];
    const rows: InfoRow[] = [];
    if (p.age) rows.push({ key: 'Age', value: String(p.age) });
    if (p.height) rows.push({ key: 'Height', value: p.height });
    if (p.maritalStatus) rows.push({ key: 'Marital Status', value: p.maritalStatus });
    if (p.religion) rows.push({ key: 'Religion', value: p.religion });
    if (p.caste) rows.push({ key: 'Caste', value: p.caste });
    if (p.language) rows.push({ key: 'Mother Tongue', value: p.language });
    if (this.locationLine) rows.push({ key: 'Location', value: this.locationLine });
    return rows;
  }

  get professionalRows(): InfoRow[] {
    const p = this.profile;
    if (!p) return [];
    const rows: InfoRow[] = [];
    if (p.profession) rows.push({ key: 'Occupation', value: p.profession });
    if (p.qualification) rows.push({ key: 'Education', value: p.qualification });
    if (p.workingWith) rows.push({ key: 'Working With', value: p.workingWith });
    if (this.salaryDisplay) rows.push({ key: 'Annual Income', value: this.salaryDisplay });
    return rows;
  }

  get familyRows(): InfoRow[] {
    const p = this.profile;
    if (!p) return [];
    const rows: InfoRow[] = [];
    if (p.father) rows.push({ key: 'Father', value: p.father });
    if (p.mother) rows.push({ key: 'Mother', value: p.mother });
    if (p.siblings) rows.push({ key: 'Siblings', value: p.siblings });
    if (p.familyLocation) rows.push({ key: 'Family Location', value: p.familyLocation });
    return rows;
  }

  async onInterest(): Promise<void> {
    if (this.profile) this.profileService.setProfileAction(this.profile.id, 'interested');
    await this.showToastAndGoBack('Interested');
  }


  async onIgnore(): Promise<void> {
    if (this.profile) this.profileService.setProfileAction(this.profile.id, 'reject');
    await this.showToastAndGoBack('Not Interested');
  }

  private async showToastAndGoBack(message: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 2000, position: 'bottom' });
    await t.present();
    await this.router.navigate(['/pending-profiles']);
  }
}
