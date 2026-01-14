import { useCampaign } from '@/context/CampaignContext';
import { LandingPage } from './LandingPage';
import { RegistrationPage } from './RegistrationPage';
import { ConsentPage } from './ConsentPage';
import { CodeEntryPage } from './CodeEntryPage';
import { CameraCapturePage } from './CameraCapturePage';
import { ConfirmationPage } from './ConfirmationPage';
import { DashboardPage } from './DashboardPage';
import { LoginPage } from './LoginPage';

export function CampaignFlow() {
  const { state } = useCampaign();

  const renderStep = () => {
    switch (state.step) {
      case 'landing':
        return <LandingPage />;
      case 'registration':
        return <RegistrationPage />;
      case 'consent':
        return <ConsentPage />;
      case 'code-entry':
        return <CodeEntryPage />;
      case 'camera-capture':
        return <CameraCapturePage />;
      case 'confirmation':
        return <ConfirmationPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'login':
        return <LoginPage />;
      default:
        return <LandingPage />;
    }
  };

  return <>{renderStep()}</>;
}
