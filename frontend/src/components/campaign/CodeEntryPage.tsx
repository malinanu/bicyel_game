import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCampaign } from '@/context/CampaignContext';
import { CampaignLayout } from '@/components/campaign/CampaignLayout';
import { ArrowLeft, Hash, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api';

export function CodeEntryPage() {
  const { dispatch, goToStep, state } = useCampaign();
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [codeId, setCodeId] = useState<number | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(value);
    setError(null);
    setIsValid(false);
  };

  const validateCode = async () => {
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }

    if (code.length < 6) {
      setError('Code must be at least 6 characters');
      return;
    }

    // Check if code was already used in local state
    const alreadyUsed = state.submissions.some((sub) => sub.uniqueCode === code);
    if (alreadyUsed) {
      setError('This code has already been used');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await apiClient.validateCode({ code });

      if (response.success && response.code_id) {
        setIsValid(true);
        setCodeId(response.code_id);
        dispatch({ type: 'SET_CODE', payload: code });
        dispatch({ type: 'SET_CODE_ID', payload: response.code_id });

        setTimeout(() => {
          goToStep('camera-capture');
        }, 800);
      } else {
        setError(response.message || 'Invalid code. Please check and try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <CampaignLayout showSteps currentStep={3} totalSteps={5}>
      <div className="flex-1 px-4 pb-8 flex flex-col">
        {/* Back Button */}
        <button
          onClick={() => goToStep(state.isReturningUser ? 'dashboard' : 'consent')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 self-start"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <Card className="flex-1 flex flex-col">
          <CardHeader className="text-center">
            <div className="w-16 h-16 gradient-golden rounded-full flex items-center justify-center mx-auto mb-4">
              <Hash className="w-8 h-8 text-foreground" />
            </div>
            <CardTitle className="text-2xl">Enter Your Code</CardTitle>
            <CardDescription>
              Find the unique code on top of your MILO RTD pack
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* Code Visual Guide */}
            <div className="bg-muted rounded-xl p-4 mb-6">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Look for the alphanumeric code printed on the top
              </p>
              <div className="bg-card rounded-lg p-3 text-center font-mono text-lg tracking-widest text-primary border-2 border-dashed border-primary/30">
                CGQSQC
              </div>
            </div>

            {/* Code Input */}
            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium">Unique Code</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter code here"
                  value={code}
                  onChange={handleCodeChange}
                  maxLength={10}
                  className={`font-mono text-lg tracking-wider uppercase text-center ${
                    error ? 'border-destructive' : isValid ? 'border-success' : ''
                  }`}
                  disabled={isValidating || isValid}
                />
                {isValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-success" />
                )}
              </div>
              {error && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">{error}</span>
                </div>
              )}
              {isValid && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs">Code verified successfully!</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-accent/30 rounded-lg p-3 mb-6">
              <p className="text-xs text-muted-foreground text-center">
                Enter the unique code from your MILO RTD pack to continue
              </p>
            </div>

            <div className="flex-1" />

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={validateCode}
              disabled={isValidating || isValid || !code.trim()}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Validating...
                </>
              ) : isValid ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Verified!
                </>
              ) : (
                'Validate Code'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </CampaignLayout>
  );
}
