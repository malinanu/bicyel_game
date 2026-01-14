import { useCampaign } from '@/context/CampaignContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Flame, TrendingUp, Trophy } from 'lucide-react';
import miloRtd from '@/assets/milo-rtd.png';

interface Cyclist {
  id: string;
  name: string;
  entries: number;
  position: number;
  isCurrentUser: boolean;
}

// Mock leaderboard data - in production, fetch from backend
const generateLeaderboardData = (currentUserName: string, currentUserEntries: number): Cyclist[] => {
  const mockRiders: Cyclist[] = [
    { id: '1', name: 'Sahan K.', entries: 12, position: 1, isCurrentUser: false },
    { id: '2', name: 'Priya M.', entries: 10, position: 2, isCurrentUser: false },
    { id: '3', name: 'Amal R.', entries: 8, position: 3, isCurrentUser: false },
    { id: '4', name: 'Nimal S.', entries: 7, position: 4, isCurrentUser: false },
    { id: '5', name: 'Kumari L.', entries: 5, position: 5, isCurrentUser: false },
    { id: '6', name: 'Ruwan D.', entries: 4, position: 6, isCurrentUser: false },
    { id: '7', name: 'Dilshan P.', entries: 3, position: 7, isCurrentUser: false },
  ];

  // Insert current user based on their entries
  const currentUser: Cyclist = {
    id: 'current',
    name: currentUserName || 'You',
    entries: currentUserEntries,
    position: 0,
    isCurrentUser: true,
  };

  // Calculate position based on entries
  let inserted = false;
  const combined = mockRiders.reduce((acc: Cyclist[], rider) => {
    if (!inserted && currentUserEntries >= rider.entries) {
      currentUser.position = acc.length + 1;
      acc.push(currentUser);
      inserted = true;
    }
    rider.position = acc.length + 1;
    acc.push(rider);
    return acc;
  }, []);

  if (!inserted) {
    currentUser.position = combined.length + 1;
    combined.push(currentUser);
  }

  return combined;
};

// Bicycle SVG Component
function BicycleIcon({ className, color }: { className?: string; color?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wheels */}
      <circle cx="5" cy="17" r="3.5" stroke={color || "currentColor"} strokeWidth="1.5" fill="none" />
      <circle cx="19" cy="17" r="3.5" stroke={color || "currentColor"} strokeWidth="1.5" fill="none" />
      {/* Wheel centers */}
      <circle cx="5" cy="17" r="0.8" fill={color || "currentColor"} />
      <circle cx="19" cy="17" r="0.8" fill={color || "currentColor"} />
      {/* Frame */}
      <path 
        d="M5 17L9 9L13 17M9 9L15 9L19 17M13 17L15 9M15 9L16 7" 
        stroke={color || "currentColor"} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      {/* Handlebar */}
      <path 
        d="M15.5 7L17 6L18 7" 
        stroke={color || "currentColor"} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      {/* Seat */}
      <path 
        d="M8 8L10 8" 
        stroke={color || "currentColor"} 
        strokeWidth="1.5" 
        strokeLinecap="round"
        fill="none"
      />
      {/* Pedal area */}
      <circle cx="13" cy="17" r="1.2" stroke={color || "currentColor"} strokeWidth="1" fill="none" />
    </svg>
  );
}

function CyclistRow({ cyclist, maxEntries }: { cyclist: Cyclist; maxEntries: number }) {
  const progress = maxEntries > 0 ? (cyclist.entries / maxEntries) * 100 : 0;
  
  // Animation delay based on position for staggered effect
  const animationDelay = `${cyclist.position * 0.1}s`;
  
  return (
    <div 
      className={`relative p-3 rounded-xl transition-all ${
        cyclist.isCurrentUser 
          ? 'bg-primary/10 border-2 border-primary shadow-soft' 
          : 'bg-muted/30'
      }`}
    >
      {/* Position Badge */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
          cyclist.position === 1 
            ? 'gradient-golden text-foreground' 
            : cyclist.position === 2
            ? 'bg-gray-300 text-gray-700'
            : cyclist.position === 3
            ? 'bg-amber-600 text-white'
            : 'bg-muted text-muted-foreground'
        }`}>
          {cyclist.position === 1 ? <Crown className="w-4 h-4" /> : cyclist.position}
        </div>
        
        {/* Cyclist Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold truncate text-sm ${cyclist.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
              {cyclist.name}
            </span>
            {cyclist.isCurrentUser && (
              <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full shrink-0">
                YOU
              </span>
            )}
            {cyclist.position === 1 && (
              <Flame className="w-4 h-4 text-orange-500 animate-pulse shrink-0" />
            )}
          </div>
          
          {/* Race Track with Bicycle */}
          <div className="mt-2 h-8 bg-gradient-to-r from-muted/50 via-primary/5 to-primary/20 rounded-full overflow-hidden relative border border-primary/20">
            {/* Track lanes/lines */}
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-primary/10 mx-2" />
            </div>
            
            {/* Track Progress */}
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                cyclist.isCurrentUser 
                  ? 'bg-gradient-to-r from-primary/40 via-primary/60 to-primary/80' 
                  : 'bg-muted-foreground/20'
              }`}
              style={{ 
                width: `${Math.max(20, progress)}%`,
                animationDelay 
              }}
            />
            
            {/* Moving Bicycle */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out ${
                cyclist.isCurrentUser ? 'animate-bounce-slow' : ''
              }`}
              style={{ 
                left: `calc(${Math.max(12, progress)}% - 14px)`,
                animationDelay
              }}
            >
              <div className={`relative ${cyclist.position === 1 ? 'animate-pulse' : ''}`}>
                <BicycleIcon 
                  className="w-7 h-7 drop-shadow-md" 
                  color={cyclist.isCurrentUser ? 'hsl(var(--primary))' : cyclist.position <= 3 ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))'}
                />
                {/* Speed lines for leading cyclists */}
                {cyclist.position <= 2 && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex gap-0.5">
                    <div className="w-2 h-0.5 bg-primary/40 rounded-full animate-pulse" />
                    <div className="w-1.5 h-0.5 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-0.5 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Finish line / Trophy at end */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <div className="w-0.5 h-5 bg-accent/50 rounded-full" />
              <Trophy className="w-4 h-4 text-accent" />
            </div>
          </div>
        </div>
        
        {/* Entries Count */}
        <div className="text-right shrink-0">
          <p className={`font-bold text-sm ${cyclist.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
            {cyclist.entries}
          </p>
          <p className="text-[10px] text-muted-foreground">entries</p>
        </div>
      </div>
    </div>
  );
}

export function BicycleLeaderboard() {
  const { state } = useCampaign();
  
  const approvedEntries = state.submissions.filter((s) => s.status === 'approved').length;
  const userName = state.user?.fullName?.split(' ')[0] || 'You';
  
  const leaderboard = generateLeaderboardData(userName, approvedEntries);
  const maxEntries = Math.max(...leaderboard.map(c => c.entries), 1);
  const currentUserData = leaderboard.find(c => c.isCurrentUser);
  
  // Get cyclists to show (current user + nearby positions)
  const currentUserPosition = currentUserData?.position || leaderboard.length;
  const visibleCyclists = leaderboard.filter(c => {
    // Always show top 3
    if (c.position <= 3) return true;
    // Show current user and +/- 2 positions
    if (Math.abs(c.position - currentUserPosition) <= 2) return true;
    return false;
  }).slice(0, 7);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <BicycleIcon className="w-5 h-5 text-primary" />
            </div>
            Race to Win Bikes!
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            Live Rankings
          </div>
        </div>
        {/* MILO RTD Product */}
        <div className="flex items-center gap-2 mt-2 p-2 bg-primary/5 rounded-lg">
          <img src={miloRtd} alt="MILO RTD" className="h-10 w-auto object-contain" />
          <p className="text-[11px] text-muted-foreground">
            Drink MILO RTD & enter codes to race ahead and win branded bicycles!
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-2">
        {/* Race Track Header */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 rounded-lg mb-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
              <div className="w-1 h-3 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-3 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="text-xs font-medium text-foreground">
              {currentUserPosition === 1 ? (
                <>🏆 You're leading the race!</>
              ) : currentUserPosition <= 3 ? (
                <>🔥 Almost at first place!</>
              ) : (
                <>💪 Keep racing!</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <BicycleIcon className="w-4 h-4 text-accent animate-bounce-slow" />
            <span className="text-[10px] text-muted-foreground">→ 🏆</span>
          </div>
        </div>
        
        {/* Leaderboard */}
        <div className="space-y-2">
          {visibleCyclists.map((cyclist) => (
            <CyclistRow 
              key={cyclist.id} 
              cyclist={cyclist} 
              maxEntries={maxEntries} 
            />
          ))}
        </div>
        
        {/* Footer Info */}
        <div className="text-center pt-2 pb-1">
          <div className="flex items-center justify-center gap-2 mb-1">
            <BicycleIcon className="w-4 h-4 text-primary" />
            <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <Trophy className="w-4 h-4 text-accent" />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Each valid entry moves your bicycle closer to the finish line! 🚴‍♂️🏆
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
