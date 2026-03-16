import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Profile } from '../models/profile.interface';

const STORAGE_KEY = 'profiles';

export type ProfileAction = 'interested' | 'shortlist' | 'reject';

const DISPLAY_ORDER: number[] = [9837832, 9837833, 9837834, 9837835];

const IMAGE_SETS = {
  profile1: ['/assets/img/profile1.jpg', '/assets/img/profile1_1.jpg', '/assets/img/profile1_2.jpg', '/assets/img/profile1_3.jpg'],
  profile2: ['/assets/img/profile2.jpg'],
  profile3: ['/assets/img/profile3.jpg', '/assets/img/profile3_1.jpg', '/assets/img/profile3_2.jpg'],
  profile4: ['/assets/img/profile4.jpg', '/assets/img/profile4_1.jpg', '/assets/img/profile4_2.jpg'],
} as const;

const SEED_PROFILES: Profile[] = [
  { id: 9837832, profileId: 'M9837832', name: 'Aiswarya', age: 26, height: '5 ft 3 in', language: 'Tamil', caste: 'Iyengar', profession: 'Doctor', qualification: 'MBBS', location: 'Chennai', state: 'Tamil Nadu', country: 'India', image: IMAGE_SETS.profile1[0], images: [...IMAGE_SETS.profile1], salaryLpa: 12, maritalStatus: 'Never Married', religion: 'Hindu', workingWith: 'Private Hospital', father: 'Business', mother: 'Homemaker', siblings: '1 Brother', familyLocation: 'Chennai', about: 'Kind, caring, and passionate about my work as a doctor. I believe in balancing career with family life and enjoy spending quality time with loved ones. I like reading, classical music, and occasional travel. On weekends I often attend Carnatic music concerts or curl up with a good book. I come from a close-knit family and would like to build a similar warm and supportive home. Looking for a partner who values family, personal growth, and mutual respect—someone understanding, well-educated, and with similar values. I believe in open communication and growing together in life.' },
  { id: 9837833, profileId: 'M9837833', name: 'Priyanka', age: 27, height: '5 ft 2 in', language: 'Tamil', caste: 'Nair', profession: 'Doctor', qualification: 'MBBS', location: 'Chennai', state: 'Tamil Nadu', country: 'India', image: IMAGE_SETS.profile2[0], images: [...IMAGE_SETS.profile2], salaryLpa: 14, maritalStatus: 'Never Married', religion: 'Hindu', workingWith: 'Government Hospital', father: 'Retired', mother: 'Teacher', siblings: '1 Sister', familyLocation: 'Chennai', about: 'Dedicated professional with a deep love for travel and music. I enjoy exploring new places and cultures whenever I get time off from the hospital. I have travelled across South India and hope to explore more with the right person. Family means everything to me; I am very close to my parents and sister. I am looking for a life partner who is supportive, kind, and has a positive outlook. I value honesty, communication, and shared interests in music and travel. I also enjoy trying new cuisines and watching movies in my free time.' },
  { id: 9837834, profileId: 'M9837834', name: 'Pragati', age: 27, height: '5 ft 5 in', language: 'Tamil', caste: 'Kayastha', profession: 'Doctor', qualification: 'MBBS', location: 'Chennai', state: 'Tamil Nadu', country: 'India', image: IMAGE_SETS.profile3[0], images: [...IMAGE_SETS.profile3], salaryLpa: 11, maritalStatus: 'Never Married', religion: 'Hindu', workingWith: 'Private Clinic', father: 'Doctor', mother: 'Homemaker', siblings: '2 Brothers', familyLocation: 'Chennai', about: 'Friendly and family-oriented. I enjoy reading, cooking, and hosting get-togethers for friends and family. My work as a doctor keeps me busy but I always make time for family and close friends. I love experimenting with new recipes and believe that a happy home starts with shared meals and laughter. I am looking for a partner who is caring, responsible, and believes in building a warm and loving home. Compatibility and shared values are important to me. I appreciate someone who is grounded, has a good sense of humour, and values both career and family life.' },
  { id: 9837835, profileId: 'M9837835', name: 'Divya', age: 25, height: '5 ft 4 in', language: 'Tamil', caste: 'Brahmin', profession: 'Software Engineer', qualification: 'B.Tech', location: 'Chennai', state: 'Tamil Nadu', country: 'India', image: IMAGE_SETS.profile4[0], images: [...IMAGE_SETS.profile4], salaryLpa: 18, maritalStatus: 'Never Married', religion: 'Hindu', workingWith: 'IT Company', father: 'Engineer', mother: 'Bank Officer', siblings: '1 Sister', familyLocation: 'Chennai', about: 'Tech enthusiast who loves hiking and photography. I enjoy the outdoors and often go on treks during weekends with friends. I believe in continuous learning and personal growth—both in my career and in life. I like watching documentaries, following tech trends, and exploring new cafes in the city. Looking for a partner who is ambitious yet grounded, values independence, and enjoys both adventure and quiet moments. Someone with a good sense of humour and similar family values would be a great match. I believe in giving each other space while also being there when it matters.' },
];

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private profileActions: Record<number, ProfileAction> = {};

  constructor(private storage: StorageService) {}

  seedProfiles(): void {
    const existing = this.storage.get<Profile[]>(STORAGE_KEY);
    if (Array.isArray(existing) && existing.length > 0) return;
    this.storage.set(STORAGE_KEY, SEED_PROFILES.map((p) => ({ ...p, images: [...p.images] })));
  }

  getProfiles(): Profile[] {
    const list = this.getRawProfiles();
    return this.sortByDisplayOrder(this.copyProfiles(list));
  }

  getProfileById(id: number): Profile | null {
    return this.getProfiles().find((p) => p.id === id) ?? null;
  }

  getPendingProfiles(): Profile[] {
    return this.getProfiles().filter((p) => !this.profileActions[p.id]);
  }

  setProfileAction(id: number, action: ProfileAction): void {
    this.profileActions[id] = action;
  }

  getProfileActions(): Record<number, ProfileAction> {
    return { ...this.profileActions };
  }

  private getRawProfiles(): Profile[] {
    this.seedProfiles();
    const raw = this.storage.get<Profile[]>(STORAGE_KEY);
    return Array.isArray(raw) && raw.length > 0 ? raw : SEED_PROFILES;
  }

  private copyProfiles(profiles: Profile[]): Profile[] {
    return profiles.map((p) => {
      const images = p.images?.length ? [...p.images] : p.image ? [p.image] : [];
      return { ...p, image: images[0] ?? p.image ?? '', images };
    });
  }

  private sortByDisplayOrder(profiles: Profile[]): Profile[] {
    return [...profiles].sort((a, b) => DISPLAY_ORDER.indexOf(a.id) - DISPLAY_ORDER.indexOf(b.id));
  }
}
