'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  const formatPhoneNumber = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="phone">Phone Number</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+94</span>
        <Input
          id="phone"
          type="tel"
          placeholder="077 123 4567"
          value={value}
          onChange={(e) => onChange(formatPhoneNumber(e.target.value))}
          className={`pl-12 ${error ? 'border-red-500' : ''}`}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground">Enter your Sri Lankan mobile number</p>
    </div>
  );
}
