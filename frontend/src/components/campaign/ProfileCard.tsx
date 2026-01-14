import { useCampaign } from '@/context/CampaignContext';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Bike, Medal, TrendingUp } from 'lucide-react';

interface ProfileCardProps {
  leaderboardPosition?: number;
  totalParticipants?: number;
}

export function ProfileCard({ leaderboardPosition = 1, totalParticipants = 100 }: ProfileCardProps) {
  const { state } = useCampaign();
  
  const approvedCount = state.submissions.filter((s) => s.status === 'approved').length;
  const pendingCount = state.submissions.filter((s) => s.status === 'pending').length;
  const totalEntries = state.submissions.length;
  
  // Progress percentage based on position (inverted - lower position = higher progress)
  const progressPercentage = totalParticipants > 0 
    ? Math.max(10, ((totalParticipants - leaderboardPosition + 1) / totalParticipants) * 100)
    : 50;

  return (
    <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
      <CardContent className="p-0">
        {/* Header Banner */}
        <div className="gradient-milo p-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full" />
            <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />
          </div>
          
          <div className="relative flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <span className="text-2xl font-bold text-white">
                {state.user?.fullName?.charAt(0)?.toUpperCase() || 'C'}
              </span>
            </div>
            
            {/* Name and Status */}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white truncate">
                {state.user?.fullName || 'Champion'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                  🏆 Rank #{leaderboardPosition}
                </span>
              </div>
            </div>
            
            {/* Badge */}
            <div className="text-right">
              <div className="w-12 h-12 gradient-golden rounded-full flex items-center justify-center shadow-lg">
                <Medal className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <div className="w-8 h-8 gradient-milo rounded-full flex items-center justify-center mx-auto mb-1">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg font-bold text-foreground">{totalEntries}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-xl">
              <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-1">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <p className="text-lg font-bold text-success">{approvedCount}</p>
              <p className="text-[10px] text-muted-foreground">Valid</p>
            </div>
            <div className="text-center p-3 bg-warning/10 rounded-xl">
              <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-1">
                <Bike className="w-4 h-4 text-warning" />
              </div>
              <p className="text-lg font-bold text-warning">{pendingCount}</p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Race Progress</span>
              <span className="font-semibold text-primary">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full gradient-milo rounded-full transition-all duration-500 relative"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center">
                  <Bike className="w-3 h-3 text-primary" />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              {leaderboardPosition === 1 
                ? "🎉 You're in the lead!" 
                : `${leaderboardPosition - 1} position${leaderboardPosition - 1 > 1 ? 's' : ''} away from first place!`
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
