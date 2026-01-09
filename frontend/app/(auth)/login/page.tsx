'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/auth/phone-input';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const validateForm = () => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const phoneRegex = /^\d{3}\s\d{3}\s\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Remove spaces for API call
      const cleanPhone = phoneNumber.replace(/\s/g, '');

      const response = await authApi.requestOtp({
        name: name.trim(),
        phone_number: cleanPhone,
      });

      toast.success(
        response.dev_mode && response.otp_code
          ? `OTP Code: ${response.otp_code}`
          : 'OTP sent to your phone',
        { description: 'Check your phone for the verification code' }
      );

      // Navigate to verify page with phone number
      router.push(`/verify?phone=${encodeURIComponent(cleanPhone)}&name=${encodeURIComponent(name.trim())}`);
    } catch (error: any) {
      toast.error('Failed to send OTP', {
        description: error.response?.data?.detail || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-green-600">Milo Bicycle Campaign</CardTitle>
          <CardDescription>Win 1 of 1000 bicycles with Milo 3M RTD!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={isLoading}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              error={errors.phone}
            />

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Get OTP Code'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
