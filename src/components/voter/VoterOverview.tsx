import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Trophy } from "lucide-react";
import type { VoterStats } from "@/hooks/api/useVoter";
import { useNavigate } from "@tanstack/react-router";

interface VoterOverviewProps {
  stats: VoterStats | undefined;
  userId: string | undefined;
}

export function VoterOverview({ stats }: VoterOverviewProps) {
  const navigate = useNavigate();

  const handleModelClick = (username: string | null) => {
    if (username) {
      navigate({ to: "/profile/$username", params: { username } });
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Voter Dashboard</h1>
        <p className="text-muted-foreground">
          Track your voting activity and support your favorite models
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Votes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVotes || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.freeVotes || 0} free · {stats.paidVotes || 0} paid
            </p>
          </CardContent>
        </Card>

        {/* Contests Voted In */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contests Voted</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contestsVotedIn || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active competitions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Favorite Models */}
      {stats.favoriteModels && stats.favoriteModels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Top Models</CardTitle>
            <CardDescription>
              Models you've supported the most
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.favoriteModels.map((model, index) => (
                <div key={model.profileId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <p 
                        className={`font-medium ${model.username ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
                        onClick={() => handleModelClick(model.username)}
                      >
                        {model.modelName}
                      </p>
                      <p className="text-xs text-muted-foreground">{model.voteCount} votes</p>
                    </div>
                  </div>
                  <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle>Ready to Vote?</CardTitle>
          <CardDescription>
            Support your favorite models in active competitions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Navigate to <span className="font-semibold text-purple-600">"Vote in Contests"</span> to start voting for your favorite models!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

