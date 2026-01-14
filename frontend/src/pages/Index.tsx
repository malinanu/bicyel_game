import { CampaignProvider } from '@/context/CampaignContext';
import { CampaignFlow } from '@/components/campaign/CampaignFlow';

const Index = () => {
  return (
    <CampaignProvider>
      <CampaignFlow />
    </CampaignProvider>
  );
};

export default Index;
