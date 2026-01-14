import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCampaign } from '@/context/CampaignContext';
import { CampaignLayout } from '@/components/campaign/CampaignLayout';
import { ProfileCard } from '@/components/campaign/ProfileCard';
import { BicycleLeaderboard } from '@/components/campaign/BicycleLeaderboard';
import {
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Image as ImageIcon,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Submission } from '@/types/campaign';
import { useState } from 'react';

const statusConfig = {
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Pending Review' },
  approved: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rejected' },
};

function SubmissionCard({ submission }: { submission: Submission }) {
  const config = statusConfig[submission.status];
  const Icon = config.icon;

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft border flex gap-4">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {submission.imageUrl ? (
          <img
            src={submission.imageUrl}
            alt="Submission"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono font-bold text-primary truncate">
            {submission.uniqueCode}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {new Date(submission.submittedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { goToStep, state, dispatch } = useCampaign();
  const [showHistory, setShowHistory] = useState(false);

  // Calculate leaderboard position based on approved entries
  const approvedCount = state.submissions.filter((s) => s.status === 'approved').length;
  const mockTotalParticipants = 150;
  
  // Simple position calculation (in production, fetch from backend)
  const calculatePosition = (entries: number) => {
    if (entries >= 12) return 1;
    if (entries >= 10) return 2;
    if (entries >= 8) return 3;
    if (entries >= 7) return 4;
    if (entries >= 5) return 5;
    if (entries >= 4) return 6;
    if (entries >= 3) return 7;
    return Math.min(8 + (12 - entries), mockTotalParticipants);
  };

  const leaderboardPosition = calculatePosition(approvedCount);

  const handleNewSubmission = () => {
    dispatch({ type: 'RESET_CURRENT_ENTRY' });
    goToStep('code-entry');
  };

  const handleLogout = () => {
    goToStep('landing');
  };

  return (
    <CampaignLayout>
      <div className="flex-1 px-4 py-4 flex flex-col gap-4 overflow-auto">
        {/* Header with Logout */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>

        {/* Profile Card */}
        <ProfileCard 
          leaderboardPosition={leaderboardPosition} 
          totalParticipants={mockTotalParticipants} 
        />

        {/* Add New Entry Button */}
        <Button variant="hero" size="lg" className="w-full" onClick={handleNewSubmission}>
          <Plus className="w-5 h-5" />
          Submit New Code
        </Button>

        {/* Bicycle Race Leaderboard */}
        <BicycleLeaderboard />

        {/* Submissions History - Collapsible */}
        <Card className="overflow-hidden">
          <CardHeader 
            className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setShowHistory(!showHistory)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Submission History</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {state.submissions.length} entries
                </span>
                {showHistory ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
          
          {showHistory && (
            <CardContent className="px-4 pb-4 pt-0">
              {state.submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-6">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">No submissions yet</p>
                  <p className="text-xs text-muted-foreground">
                    Enter a code to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...state.submissions].reverse().map((submission) => (
                    <SubmissionCard key={submission.id} submission={submission} />
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </CampaignLayout>
  );
}
