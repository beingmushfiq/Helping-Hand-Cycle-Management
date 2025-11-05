

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum RuleType {
  STRICT = 'Strict',
  FLEXIBLE = 'Flexible',
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  joinMonth: number;
  joiningMonthName: string;
  lateFeePaid: number;
}

export interface MonthlyContribution {
  memberId: string;
  status: PaymentStatus;
  paymentDate?: string;
  amountPaid?: number;
}

export interface RoscaMonth {
  month: number;
  payoutMemberId: string | null;
  payoutAmount: number | null;
  contributions: MonthlyContribution[];
}

export interface RoscaCycle {
  id: string;
  name:string;
  members: Member[];
  monthlyContributionAmount: number;
  currentMonth: number;
  months: RoscaMonth[];
  ruleType: RuleType;
  joiningFee: number;
  cycleLength: number;
  isArchived: boolean;
  savingsFund: number;
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  cycleId?: string;
}

export type AuthUser = {
  uid: string; // Firebase UID
  name: string;
  email: string;
  role: 'admin' | 'member';
  cycleId?: string; // For members
  memberId?: string; // For members
} | null;