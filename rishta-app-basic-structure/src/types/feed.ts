export interface FeedProfile {
  id: string;
  name: string;
  age: number;
  profession?: string;
  occupation?: string;
  city: string;
  country: string;
  verified: boolean;
  managedByFamily?: boolean;
  matchPercentage?: number;
  sect?: string;
  ethnicity?: string;
  caste?: string;
  height?: string;
  imageUrl: string;
}

export type FeedScreen = 'discover' | 'explore' | 'own_profile' | 'edit_personal';

export interface ReportReason {
  id: string;
  label: string;
}

export interface OwnProfileData {
  name: string;
  age: number;
  managedByFamily: boolean;
  completeness: number;
  avatarUrl: string;
  heightInches: number;
  sect: string;
  ethnicity: string;
  caste: string;
  houseSize: string;
  monthlyIncome: string;
  lastUpdated: string;
}

export interface PersonalEditData {
  heightInches: number;
  sect: string;
  ethnicity: string;
  caste: string;
  houseSize: string;
  monthlyIncome: string;
}

export interface FeedFilters {
  minAge: number;
  maxAge: number;
  city: string;
  sect: string;
  verifiedOnly: boolean;
}
