export type ScreenId =
  | "phone-verification"
  | "enter-code"
  | "who-is-profile-for"
  | "gender"
  | "basic-details"
  | "what-looking-for"
  | "education-work"
  | "demographics"
  | "lifestyle-interests"
  | "family-background"
  | "add-photos"
  | "community-promise"
  | "verification"
  | "choose-plan"
  | "profile-activating";

export interface ScreenInfo {
  id: ScreenId;
  stepNumber: number;
  totalSteps: number;
  title: string;
  category: string;
}

export interface UserFormData {
  phoneNumber: string;
  otpCode: string[];
  profileFor: "myself" | "son" | "daughter" | "brother" | "sister" | "";
  gender: "male" | "female" | "";
  firstName: string;
  lastName: string;
  maritalStatus: string;
  religion: string;
  dob: string;
  intent: string;
  timeline: string;
  educationLevel: string;
  instituteName: string;
  employmentStatus: string;
  profession: string;
  country: string;
  nationality: string;
  cityState: string;
  heightInches: number;
  sect: string;
  ethnicity: string;
  caste: string;
  houseSize: string;
  incomeBracket: string;
  religionPractice: string;
  eatHalalOnly: boolean;
  smoke: boolean;
  drinkAlcohol: boolean;
  moveAbroad: boolean;
  haveChildren: boolean;
  interests: string[];
  fatherDetails: string;
  motherDetails: string;
  brothers: string;
  sisters: string;
  familyLocation: string;
  financialStatus: string;
  photos: (string | null)[];
  agreedToPromise: boolean;
  selectedPlan: "free" | "basic" | "standard" | "premium";
}

export interface ScreenProps {
  formData: UserFormData;
  updateFormData: (fields: Partial<UserFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}
