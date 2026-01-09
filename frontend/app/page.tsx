'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Upload, Users, Trophy } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-green-600 mb-4">
            Milo Bicycle Campaign
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Win 1 of 1000 bicycles with Milo 3M RTD!
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <Card>
            <CardHeader className="text-center">
              <Trophy className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>1000 Bicycles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-muted-foreground">
                Amazing prizes waiting to be won by lucky participants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Upload className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Easy to Enter</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-muted-foreground">
                Simply upload photos of Milo 3M RTD products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Up to 10 Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-muted-foreground">
                Submit up to 10 entries for more chances to win
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Award className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Fair & Transparent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-muted-foreground">
                Random draw ensures everyone has an equal chance
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">How to Participate</CardTitle>
            <CardDescription className="text-center">
              Follow these simple steps to enter the campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Register or Login</h3>
                <p className="text-muted-foreground">
                  Sign up using your phone number and verify with OTP
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Purchase Milo 3M RTD</h3>
                <p className="text-muted-foreground">
                  Buy any Milo 3M Ready-to-Drink product from your nearest store
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Upload Your Photo</h3>
                <p className="text-muted-foreground">
                  Take a clear photo of your Milo 3M RTD product and upload it to your dashboard
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Wait for Results</h3>
                <p className="text-muted-foreground">
                  Winners will be randomly selected and contacted via their registered phone number
                </p>
              </div>
            </div>

            <div className="text-center pt-6">
              <Link href="/login">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  Start Your Journey
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Terms and conditions apply. Campaign valid while stocks last.</p>
        </div>
      </div>
    </div>
  );
}
