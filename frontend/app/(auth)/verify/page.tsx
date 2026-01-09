'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OtpInput } from '@/components/auth/otp-input';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [error, setError] = useState('');

  const phoneNumber = searchParams.get('phone') || '';
  const name = searchParams.get('name') || '';

  useEffect(() => {
    if (!phoneNumber) {
      router.push('/login');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phoneNumber, router]);

  useEffect(() => {
    if (otpCode.length === 6) {
      handleVerify();
    }
  }, [otpCode]);

  const handleVerify = async () => {
    if (otpCode.length !== 6) return;

    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.verifyOtp({
        phone_number: phoneNumber,
        otp_code: otpCode,
      });

      login(response.access_token, response.user);

      toast.success('Login successful!', {
        description: 'Welcome to Milo Campaign',
      });

      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Invalid OTP code';
      setError(errorMessage);
      toast.error('Verification failed', {
        description: errorMessage,
      });
      setOtpCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.requestOtp({
        name,
        phone_number: phoneNumber,
      });

      setCountdown(300);
      toast.success(
        response.dev_mode && response.otp_code
          ? `New OTP Code: ${response.otp_code}`
          : 'New OTP sent',
        { description: 'Check your phone for the verification code' }
      );
    } catch (error: any) {
      toast.error('Failed to resend OTP', {
        description: 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Verify Your Phone</CardTitle>
          <CardDescription>
            We sent a 6-digit code to<br />
            <span className="font-medium">+94 {phoneNumber}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <OtpInput value={otpCode} onChange={setOtpCode} error={error} />

          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Code expires in: <span className="font-medium">{formatTime(countdown)}</span>
            </p>

            {countdown === 0 ? (
              <Button
                variant="link"
                onClick={handleResend}
                disabled={isLoading}
                className="text-sm text-green-600"
              >
                Resend OTP
              </Button>
            ) : (
              <Button
                variant="link"
                onClick={() => router.push('/login')}
                className="text-sm"
              >
                Change Phone Number
              </Button>
            )}
          </div>

          {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Dev Mode:</strong> Check backend console for OTP code
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
