import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useSpinHistory, type SpinHistoryItem } from "@/hooks/api/useVoter";

interface SpinHistoryProps {
  profileId: string | undefined;
}

const PRIZE_ICONS: Record<string, string> = {
  BONUS_VOTES: "💞",
  VOTE_MULTIPLIER: "🔁",
  VOTE_MULTIPLIER_TOKEN: "💎",
  PERSONAL_MESSAGE: "💌",
  INSTAGRAM_FEATURE: "📸",
  EXCLUSIVE_BADGE: "🪩",
  MAGAZINE_FOLLOW_BACK: "💖",
  DIGITAL_BOUDOIR_ACCESS: "🌟",
  BTS_VIDEO_LINK: "💬",
  FREE_RETRY_SPIN: "🎁",
  MEET_GREET_DISCOUNT: "🎉",
};

export function SpinHistory({ profileId }: SpinHistoryProps) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading } = useSpinHistory(profileId, page, limit);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading spin history...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Spin History
          </CardTitle>
          <CardDescription>Your past spin wheel results</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No spin history yet. Start spinning to see your results here!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { data: history, pagination } = data;
  const hasNextPage = pagination.page < pagination.totalPages;
  const hasPrevPage = pagination.page > 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Spin History
        </CardTitle>
        <CardDescription>
          Your past spin wheel results ({pagination.total} total)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {history.map((item) => {
            const icon = PRIZE_ICONS[item.rewardType] || "🎁";
            return (
              <div
                key={item.id}
                className="border rounded-lg p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{icon}</div>
                  <div>
                    <h3 className="font-semibold">{item.rewardName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(item.spunAt)}
                    </p>
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
            );
          })}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

