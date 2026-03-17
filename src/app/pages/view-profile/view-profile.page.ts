import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { ProfileService } from '../../services/profile.service';
import {
  Profile,
  getProfileDetailsLine,
  getProfileSummaryBullets,
  getProfileTags,
} from '../../models/profile.interface';

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
export class ViewProfilePage implements OnInit {
  profile: Profile | null = null;
  currentImageIndex = 0;
  fullScreenOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private toast: ToastController
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.profile = this.profileService.getProfileById(id);
    if (!this.profile) {
      this.router.navigate(['/pending-profiles']);
    }
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

  get currentImage(): string {
    const list = this.images;
    return list[this.currentImageIndex] ?? list[0] ?? '';
  }

  get detailsLine(): string {
    return getProfileDetailsLine(this.profile);
  }

  get summaryBullets(): string {
    return getProfileSummaryBullets(this.profile);
  }

  get profileTags(): string[] {
    return getProfileTags(this.profile);
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

  setImageIndex(i: number): void {
    if (i >= 0 && i < this.images.length) this.currentImageIndex = i;
  }

  nextImage(): void {
    const len = this.images.length;
    if (len > 0) this.currentImageIndex = (this.currentImageIndex + 1) % len;
  }

  prevImage(): void {
    const len = this.images.length;
    if (len > 0) this.currentImageIndex = (this.currentImageIndex - 1 + len) % len;
  }

  openFullScreen(): void {
    this.fullScreenOpen = true;
  }

  closeFullScreen(): void {
    this.fullScreenOpen = false;
  }

  onNavClick(fn: () => void, event: Event): void {
    event.stopPropagation();
    fn.call(this);
  }

  onThumbClick(i: number, event: Event): void {
    event.stopPropagation();
    this.setImageIndex(i);
  }

  async onInterest(): Promise<void> {
    if (this.profile) this.profileService.setProfileAction(this.profile.id, 'interested');
    await this.showToastAndGoBack('Interested');
  }

  async onShortlist(): Promise<void> {
    if (this.profile) this.profileService.setProfileAction(this.profile.id, 'shortlist');
    await this.showToastAndGoBack('Shortlisted');
  }

  onIgnore(): void {
    if (this.profile) this.profileService.setProfileAction(this.profile.id, 'reject');
    this.router.navigate(['/pending-profiles']);
  }

  private async showToastAndGoBack(message: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 2000, position: 'bottom' });
    await t.present();
    this.router.navigate(['/pending-profiles']);
  }
}
