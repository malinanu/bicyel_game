'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Award, ImageIcon } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const maxEntries = 10;
  const entriesRemaining = maxEntries - (user?.entry_count || 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground">
          Track your entries and win 1 of 1000 bicycles with Milo 3M RTD
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.entry_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              out of {maxEntries} maximum
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entries Remaining</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{entriesRemaining}</div>
            <p className="text-xs text-muted-foreground">
              {entriesRemaining > 0 ? 'Keep uploading!' : 'Limit reached'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bicycles</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">1,000</div>
            <p className="text-xs text-muted-foreground">
              Available to win
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Your Entry</CardTitle>
          <CardDescription>
            Upload photos of Milo 3M RTD products to enter the campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {entriesRemaining > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                You have <span className="font-semibold text-green-600">{entriesRemaining} entries</span> remaining.
                Each photo gives you a chance to win one of 1000 bicycles!
              </p>
              <Link href="/dashboard/entries/new">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Entry
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              You have reached the maximum number of entries. Thank you for participating!
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your Entries</CardTitle>
          <CardDescription>
            View all your submitted entries and their verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/entries">
            <Button variant="outline" className="w-full sm:w-auto">
              <ImageIcon className="mr-2 h-4 w-4" />
              View My Entries ({user?.entry_count || 0})
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium">Purchase Milo 3M RTD</h4>
                <p className="text-sm text-muted-foreground">Buy any Milo 3M Ready-to-Drink product</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium">Take a Photo</h4>
                <p className="text-sm text-muted-foreground">Capture a clear photo of your Milo 3M RTD product</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium">Upload Your Entry</h4>
                <p className="text-sm text-muted-foreground">Submit up to {maxEntries} photos for more chances to win</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div>
                <h4 className="font-medium">Wait for the Draw</h4>
                <p className="text-sm text-muted-foreground">Winners will be announced and contacted via phone</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
