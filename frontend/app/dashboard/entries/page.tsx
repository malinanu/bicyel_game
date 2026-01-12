'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { entriesApi } from '@/lib/api/entries';
import type { Entry, EntryListResponse } from '@/lib/types/entry';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, ImageIcon, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

export default function EntriesListPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesRemaining, setEntriesRemaining] = useState<number>(0);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: EntryListResponse = await entriesApi.getEntries();
      setEntries(response.entries);
      setEntriesRemaining(response.entries_remaining);
      setTotalEntries(response.total_entries);
    } catch (err: any) {
      console.error('Error loading entries:', err);
      setError(err.response?.data?.detail || 'Failed to load entries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Entries</h1>
        <p className="text-muted-foreground">
          View all your submitted entries for the Milo Bicycle Campaign
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground">
              out of 10 maximum
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
            <CardTitle className="text-sm font-medium">Verified Entries</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {entries.filter(e => e.verified).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Approved entries
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {entriesRemaining > 0 && (
        <div className="mb-6">
          <Link href="/dashboard/entries/new">
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Entry
            </Button>
          </Link>
        </div>
      )}

      {entries.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <ImageIcon className="h-16 w-16 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900">No Entries Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You haven't uploaded any entries yet. Start uploading photos of Milo 3M RTD products to enter the campaign!
              </p>
              <Link href="/dashboard/entries/new">
                <Button className="bg-green-600 hover:bg-green-700 mt-4">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Your First Entry
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              <div className="aspect-square relative bg-gray-100">
                <img
                  src={entry.image_url}
                  alt={`Entry ${entry.id}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Image</text></svg>';
                  }}
                />
                <div className="absolute top-2 right-2">
                  {entry.verified ? (
                    <Badge className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Entry #{entry.id}</CardTitle>
                <CardDescription className="text-xs">
                  Submitted: {formatDate(entry.created_at)}
                </CardDescription>
              </CardHeader>
              {entry.admin_notes && (
                <CardContent>
                  <Alert>
                    <AlertDescription className="text-xs">
                      {entry.admin_notes}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
