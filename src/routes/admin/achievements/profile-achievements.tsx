import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminProfileAchievements } from "@/hooks/api/useAdminAchievements";
import { useState } from "react";

export const Route = createFileRoute("/admin/achievements/profile-achievements")({
  component: ProfileAchievementsPage,
});

function ProfileAchievementsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, error } = useAdminProfileAchievements(page, limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Achievements</h1>
        <p className="text-muted-foreground text-sm">View all achievements unlocked by profiles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Profile Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading profile achievements</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Achievement</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Unlocked At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((pa) => (
                  <TableRow key={pa.id}>
                    <TableCell>{pa.profileName || pa.profileId}</TableCell>
                    <TableCell>{pa.achievementName}</TableCell>
                    <TableCell>{pa.progress}%</TableCell>
                    <TableCell>{new Date(pa.unlockedAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

