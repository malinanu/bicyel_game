import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useCampaign } from '@/context/CampaignContext';
import { CampaignLayout } from '@/components/campaign/CampaignLayout';
import { ArrowLeft, Shield, Image, FileText, CheckCircle2 } from 'lucide-react';

const consentItems = [
  {
    id: 'data',
    icon: Shield,
    title: 'Data Collection',
    description: 'I consent to the collection and processing of my personal data for this campaign.',
  },
  {
    id: 'image',
    icon: Image,
    title: 'Image Usage',
    description: 'I allow my submitted images to be used for verification and promotional purposes.',
  },
  {
    id: 'terms',
    icon: FileText,
    title: 'Campaign Terms',
    description: 'I have read and agree to the campaign terms and conditions.',
  },
];

export function ConsentPage() {
  const { dispatch, goToStep } = useCampaign();
  const [acceptedItems, setAcceptedItems] = useState<Record<string, boolean>>({});

  const allAccepted = consentItems.every((item) => acceptedItems[item.id]);

  const toggleItem = (id: string) => {
    setAcceptedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAcceptAll = () => {
    const allItems = consentItems.reduce(
      (acc, item) => ({ ...acc, [item.id]: true }),
      {}
    );
    setAcceptedItems(allItems);
  };

  const handleContinue = () => {
    if (allAccepted) {
      dispatch({ type: 'ACCEPT_CONSENT' });
      goToStep('code-entry');
    }
  };

  return (
    <CampaignLayout showSteps currentStep={2} totalSteps={5}>
      <div className="flex-1 px-4 pb-8 flex flex-col">
        {/* Back Button */}
        <button
          onClick={() => goToStep('registration')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 self-start"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <Card className="flex-1 flex flex-col">
          <CardHeader className="text-center">
            <div className="w-16 h-16 gradient-milo rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Your Privacy Matters</CardTitle>
            <CardDescription>
              Please review and accept the following consents to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-4 mb-6">
              {consentItems.map((item) => {
                const Icon = item.icon;
                const isChecked = acceptedItems[item.id];

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isChecked
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-sm">{item.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      {isChecked && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex-1" />

            {!allAccepted && (
              <Button
                variant="outline"
                size="lg"
                className="w-full mb-3"
                onClick={handleAcceptAll}
              >
                Accept All
              </Button>
            )}

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleContinue}
              disabled={!allAccepted}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    </CampaignLayout>
  );
}
