export interface UserData {
  fullName: string;
  dateOfBirth: string;
  contactNumber: string;
}

export interface Submission {
  id: string;
  uniqueCode: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
}

export interface CampaignState {
  step: CampaignStep;
  user: UserData | null;
  consentAccepted: boolean;
  currentCode: string;
  currentCodeId: number | null;
  currentImage: string | null;
  submissions: Submission[];
  isReturningUser: boolean;
}

export type CampaignStep = 
  | 'landing'
  | 'registration'
  | 'consent'
  | 'code-entry'
  | 'camera-capture'
  | 'confirmation'
  | 'dashboard'
  | 'login';

export type CampaignAction =
  | { type: 'SET_STEP'; payload: CampaignStep }
  | { type: 'SET_USER'; payload: UserData }
  | { type: 'ACCEPT_CONSENT' }
  | { type: 'SET_CODE'; payload: string }
  | { type: 'SET_CODE_ID'; payload: number | null }
  | { type: 'SET_IMAGE'; payload: string }
  | { type: 'ADD_SUBMISSION'; payload: Submission }
  | { type: 'UPDATE_SUBMISSION_STATUS'; payload: { id: string; status: Submission['status'] } }
  | { type: 'SET_RETURNING_USER'; payload: boolean }
  | { type: 'RESET_CURRENT_ENTRY' };
