import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CampaignState, CampaignAction, CampaignStep } from '@/types/campaign';

const initialState: CampaignState = {
  step: 'landing',
  user: null,
  consentAccepted: false,
  currentCode: '',
  currentCodeId: null,
  currentImage: null,
  submissions: [],
  isReturningUser: false,
};

function campaignReducer(state: CampaignState, action: CampaignAction): CampaignState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'ACCEPT_CONSENT':
      return { ...state, consentAccepted: true };
    case 'SET_CODE':
      return { ...state, currentCode: action.payload };
    case 'SET_CODE_ID':
      return { ...state, currentCodeId: action.payload };
    case 'SET_IMAGE':
      return { ...state, currentImage: action.payload };
    case 'ADD_SUBMISSION':
      return { ...state, submissions: [...state.submissions, action.payload] };
    case 'UPDATE_SUBMISSION_STATUS':
      return {
        ...state,
        submissions: state.submissions.map((sub) =>
          sub.id === action.payload.id ? { ...sub, status: action.payload.status } : sub
        ),
      };
    case 'SET_RETURNING_USER':
      return { ...state, isReturningUser: action.payload };
    case 'RESET_CURRENT_ENTRY':
      return { ...state, currentCode: '', currentCodeId: null, currentImage: null };
    default:
      return state;
  }
}

interface CampaignContextType {
  state: CampaignState;
  dispatch: React.Dispatch<CampaignAction>;
  goToStep: (step: CampaignStep) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(campaignReducer, initialState);

  const goToStep = (step: CampaignStep) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  return (
    <CampaignContext.Provider value={{ state, dispatch, goToStep }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
}
