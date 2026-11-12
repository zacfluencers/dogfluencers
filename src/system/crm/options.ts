import type { ApplicationStatus, Option } from './types';

export const GENDERS: Option[] = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'self_described', label: 'I describe myself another way' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

/** Age filter bands, inclusive. Worked out from date of birth on the day. */
export const AGE_BANDS: (Option & { min: number; max: number })[] = [
  { value: '18-24', label: '18 to 24', min: 18, max: 24 },
  { value: '25-34', label: '25 to 34', min: 25, max: 34 },
  { value: '35-44', label: '35 to 44', min: 35, max: 44 },
  { value: '45-54', label: '45 to 54', min: 45, max: 54 },
  { value: '55+', label: '55 and over', min: 55, max: Infinity },
];

export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'inactive', label: 'Inactive' },
];

export const YES_NO: Option[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export function labelFor(list: readonly Option[], value: string | null | undefined): string {
  return list.find((o) => o.value === value)?.label ?? value ?? '';
}
