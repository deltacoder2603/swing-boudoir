import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRecalculateProfileStatsById } from "@/hooks/api/useAdminProfileStats";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/profile-stats/")({
  component: ProfileStatsPage,
});

function ProfileStatsPage() {
  const [profileId, setProfileId] = useState("");
  const recalculateMutation = useRecalculateProfileStatsById();

  const handleRecalculate = async () => {
    if (!profileId) {
      toast.error("Please enter a profile ID");
      return;
    }
    try {
      await recalculateMutation.mutateAsync(profileId);
      toast.success("Profile stats recalculated successfully");
      setProfileId("");
    } catch (error) {
      toast.error("Failed to recalculate profile stats");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Stats</h1>
        <p className="text-muted-foreground text-sm">Recalculate profile statistics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recalculate Profile Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Profile ID</Label>
            <Input
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              placeholder="Enter profile ID"
            />
          </div>
          <Button onClick={handleRecalculate} disabled={recalculateMutation.isPending}>
            {recalculateMutation.isPending ? "Recalculating..." : "Recalculate Stats"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

