export interface Profile {
  id: number;
  profileId: string;
  name: string;
  age: number;
  height: string;
  language: string;
  caste: string;
  profession: string;
  qualification: string;
  location: string;
  state: string;
  country: string;
  image: string;
  images: string[];
  salaryLpa?: number | string;
  maritalStatus?: string;
  religion?: string;
  workingWith?: string;
  father?: string;
  mother?: string;
  siblings?: string;
  familyLocation?: string;
  about?: string;
}

export function getProfileDetailsLine(profile: Profile | null): string {
  if (!profile) return '';
  const qual = profile.qualification && profile.qualification !== profile.profession ? profile.qualification : null;
  const parts = [
    `${profile.age} Yrs`,
    profile.height,
    profile.language,
    profile.caste,
    qual,
    profile.profession,
    profile.location,
    profile.state,
    profile.country,
  ].filter(Boolean);
  return parts.join(', ');
}

export function getProfileSummaryBullets(profile: Profile | null): string {
  if (!profile) return '';
  const loc = [profile.location, profile.state].filter(Boolean).join(', ');
  const parts = [
    `${profile.age} yrs`,
    profile.height,
    profile.profession,
    loc,
  ].filter(Boolean);
  return parts.join(' • ');
}

export function getProfileTags(profile: Profile | null): string[] {
  if (!profile) return [];
  return [profile.language, profile.caste, profile.profession].filter(Boolean);
}
