import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminSpinHistory } from "@/hooks/api/useAdminSpinWheel";
import { useState } from "react";

export const Route = createFileRoute("/admin/spin-wheel/history")({
  component: SpinHistoryPage,
});

function SpinHistoryPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, error } = useAdminSpinHistory(page, limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Spin History</h1>
        <p className="text-muted-foreground text-sm">View all spin wheel history across all users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Spin History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading spin history</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Reward Type</TableHead>
                  <TableHead>Spun At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell>{history.profileName || history.profileId}</TableCell>
                    <TableCell>{history.rewardName}</TableCell>
                    <TableCell>{history.rewardType}</TableCell>
                    <TableCell>{new Date(history.spunAt).toLocaleString()}</TableCell>
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

