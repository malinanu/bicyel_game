import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCampaign } from '@/context/CampaignContext';
import { CampaignLayout } from '@/components/campaign/CampaignLayout';
import { CheckCircle2, PartyPopper, ArrowRight, Clock } from 'lucide-react';
import successIcon from '@/assets/success-icon.png';

export function ConfirmationPage() {
  const { goToStep, state, dispatch } = useCampaign();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const latestSubmission = state.submissions[state.submissions.length - 1];

  const handleAddAnother = () => {
    dispatch({ type: 'RESET_CURRENT_ENTRY' });
    goToStep('code-entry');
  };

  return (
    <CampaignLayout showSteps currentStep={5} totalSteps={5}>
      <div className="flex-1 px-4 pb-8 flex flex-col items-center justify-center">
        {/* Success Animation */}
        <div className="relative mb-6">
          <div className="w-32 h-32 gradient-milo rounded-full flex items-center justify-center animate-scale-in shadow-strong">
            <img src={successIcon} alt="Success" className="w-20 h-20" />
          </div>
          {showConfetti && (
            <div className="absolute -top-4 -right-4 animate-bounce">
              <PartyPopper className="w-10 h-10 text-accent" />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 animate-slide-up">
          Submission <span className="text-gradient-milo">Complete!</span>
        </h1>

        <p className="text-muted-foreground text-center mb-8 max-w-xs animate-fade-in">
          Your entry has been submitted successfully. Good luck!
        </p>

        {/* Submission Details */}
        <Card className="w-full max-w-sm mb-8 animate-slide-up">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unique Code</span>
                <span className="font-mono font-bold text-primary">{state.currentCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {latestSubmission?.status === 'pending' ? (
                  <span className="flex items-center gap-1 text-warning font-medium text-sm">
                    <Clock className="w-4 h-4" />
                    Under Review
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-success font-medium text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Approved
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Entries</span>
                <span className="font-bold text-foreground">{state.submissions.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="w-full max-w-sm space-y-3">
          <Button variant="hero" size="lg" className="w-full" onClick={handleAddAnother}>
            Submit Another Code
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => goToStep('dashboard')}
          >
            View My Dashboard
          </Button>
        </div>
      </div>
    </CampaignLayout>
  );
}
