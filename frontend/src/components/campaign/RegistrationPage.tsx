import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCampaign } from '@/context/CampaignContext';
import { CampaignLayout } from '@/components/campaign/CampaignLayout';
import { UserData } from '@/types/campaign';
import { ArrowLeft, User, Calendar, Phone, Lock, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api';

export function RegistrationPage() {
  const { dispatch, goToStep } = useCampaign();
  const [formData, setFormData] = useState<UserData>({
    fullName: '',
    dateOfBirth: '',
    contactNumber: '',
  });
  const [errors, setErrors] = useState<Partial<UserData>>({});
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Please enter a valid name';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        newErrors.dateOfBirth = 'You must be at least 13 years old';
      }
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{9,15}$/.test(formData.contactNumber.replace(/\D/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.requestOtp({
        name: formData.fullName,
        phone_number: formData.contactNumber,
        date_of_birth: formData.dateOfBirth
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
        phone_number: formData.contactNumber,
        otp_code: otp,
      });

      if (response.success && response.user) {
        // Update campaign context with user data
        dispatch({
          type: 'SET_USER',
          payload: {
            fullName: response.user.name,
            dateOfBirth: response.user.date_of_birth || formData.dateOfBirth,
            contactNumber: response.user.phone_number,
          },
        });
        dispatch({ type: 'ACCEPT_CONSENT' });

        goToStep('consent');
      } else {
        setError(response.message || 'OTP verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof UserData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <CampaignLayout showSteps currentStep={1} totalSteps={5}>
      <div className="flex-1 px-4 pb-8 flex flex-col">
        {/* Back Button */}
        <button
          onClick={() => (step === 'otp' ? setStep('form') : goToStep('landing'))}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 self-start"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <Card className="flex-1 flex flex-col">
          <CardHeader className="text-center">
            <div className="w-16 h-16 gradient-milo rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 'form' ? (
                <User className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Lock className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {step === 'form' ? 'Create Your Account' : 'Enter OTP'}
            </CardTitle>
            <CardDescription>
              {step === 'form'
                ? 'Enter your details to participate in the campaign'
                : `We've sent a code to ${formData.contactNumber}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange('fullName')}
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange('dateOfBirth')}
                  className={errors.dateOfBirth ? 'border-destructive' : ''}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dateOfBirth && (
                  <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
                )}
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Contact Number
                </label>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.contactNumber}
                  onChange={handleChange('contactNumber')}
                  className={errors.contactNumber ? 'border-destructive' : ''}
                />
                {errors.contactNumber && (
                  <p className="text-xs text-destructive">{errors.contactNumber}</p>
                )}
              </div>

              <div className="flex-1" />

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-xs text-destructive text-center">{error}</p>
                </div>
              )}

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
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
                  {error && <p className="text-xs text-destructive text-center">{error}</p>}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive the code?{' '}
                  <button
                    onClick={handleSubmit}
                    className="text-primary font-medium hover:underline"
                    disabled={isLoading}
                  >
                    Resend
                  </button>
                </p>

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
                    'Verify & Continue'
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
