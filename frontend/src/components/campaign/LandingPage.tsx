import { Button } from '@/components/ui/button';
import { useCampaign } from '@/context/CampaignContext';
import { CampaignLayout } from '@/components/campaign/CampaignLayout';
import { Bike, Gift, Zap, ArrowRight } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import miloLogo from '@/assets/milo-logo.png';

export function LandingPage() {
  const { goToStep, state } = useCampaign();

  const handleParticipate = () => {
    if (state.user && state.consentAccepted) {
      goToStep('code-entry');
    } else {
      goToStep('registration');
    }
  };

  const handleReturningUser = () => {
    goToStep('login');
  };

  return (
    <CampaignLayout>
      <div className="flex-1 flex flex-col">
        {/* Hero Image Section */}
        <div className="relative h-72 overflow-hidden bg-primary">
          {/* MILO Logo Overlay */}
          <div className="absolute top-4 left-4 z-20">
            <img 
              src={miloLogo} 
              alt="MILO" 
              className="h-12 w-auto drop-shadow-lg rounded-lg"
            />
          </div>
          <img
            src={heroBg}
            alt="MILO Win 1000 Bikes Campaign"
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95" />
        </div>

        {/* Content Section */}
        <div className="flex-1 px-6 pb-8 -mt-8 relative z-10 flex flex-col">
          {/* Campaign Badge */}
          <div className="flex justify-center mb-4">
            <div className="gradient-golden text-foreground font-bold px-6 py-2 rounded-full text-sm shadow-medium animate-pulse-soft">
              🎉 WIN 1000 BIKES!
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl font-bold text-center text-foreground mb-3">
            Fuel Your Energy,
            <br />
            <span className="text-gradient-milo">Win Big!</span>
          </h1>

          {/* Description */}
          <p className="text-center text-muted-foreground mb-6 max-w-xs mx-auto">
            Purchase MILO RTD, enter your unique code, and stand a chance to win amazing prizes!
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-card rounded-xl p-4 shadow-soft text-center">
              <div className="w-10 h-10 gradient-milo rounded-full flex items-center justify-center mx-auto mb-2">
                <Bike className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">1000 Bikes</span>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-soft text-center">
              <div className="w-10 h-10 gradient-golden rounded-full flex items-center justify-center mx-auto mb-2">
                <Gift className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Instant Prizes</span>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-soft text-center">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-secondary-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Easy Entry</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3 mt-auto">
            <Button
              variant="hero"
              size="xl"
              className="w-full animate-cta-attention flex items-center justify-center gap-2"
              onClick={handleParticipate}
            >
              Participate Now
              <ArrowRight className="w-5 h-5 animate-bounce-arrow" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleReturningUser}
            >
              Already Registered? Login
            </Button>
          </div>
        </div>
      </div>
    </CampaignLayout>
  );
}
