import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCampaign } from '@/context/CampaignContext';
import { CampaignLayout } from '@/components/campaign/CampaignLayout';
import { ArrowLeft, Phone, Lock, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api';

export function LoginPage() {
  const { dispatch, goToStep } = useCampaign();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.requestOtp({
        name: 'User', // Default name for login flow
        phone_number: phoneNumber
      });

      if (response.success) {
        setStep('otp');
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.verifyOtp({
        phone_number: phoneNumber,
        otp_code: otp,
      });

      if (response.success && response.user) {
        // Update campaign context with user data
        dispatch({
          type: 'SET_USER',
          payload: {
            fullName: response.user.name,
            dateOfBirth: '2000-01-01', // Backend doesn't have DOB yet
            contactNumber: response.user.phone_number,
          },
        });
        dispatch({ type: 'ACCEPT_CONSENT' });
        dispatch({ type: 'SET_RETURNING_USER', payload: true });

        goToStep('dashboard');
      } else {
        setError(response.message || 'OTP verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CampaignLayout>
      <div className="flex-1 px-4 pb-8 flex flex-col pt-6">
        {/* Back Button */}
        <button
          onClick={() => (step === 'otp' ? setStep('phone') : goToStep('landing'))}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 self-start"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <Card className="flex-1 flex flex-col">
          <CardHeader className="text-center">
            <div className="w-16 h-16 gradient-milo rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 'phone' ? (
                <Phone className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Lock className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {step === 'phone' ? 'Welcome Back!' : 'Enter OTP'}
            </CardTitle>
            <CardDescription>
              {step === 'phone'
                ? 'Enter your registered phone number to continue'
                : `We've sent a code to ${phoneNumber}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {step === 'phone' ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setError(null);
                    }}
                    className={error ? 'border-destructive' : ''}
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>

                <div className="flex-1" />

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Verification Code
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError(null);
                    }}
                    className={`text-center font-mono text-xl tracking-widest ${
                      error ? 'border-destructive' : ''
                    }`}
                    maxLength={6}
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive the code?{' '}
                  <button
                    onClick={handleSendOtp}
                    className="text-primary font-medium hover:underline"
                    disabled={isLoading}
                  >
                    Resend
                  </button>
                </p>

                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground text-center">
                    <strong>Demo:</strong> Enter any 4+ digit code to login
                  </p>
                </div>

                <div className="flex-1" />

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleVerifyOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CampaignLayout>
  );
}
