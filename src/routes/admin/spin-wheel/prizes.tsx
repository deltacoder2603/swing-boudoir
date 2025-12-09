import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminActivePrizes } from "@/hooks/api/useAdminSpinWheel";
import { useState } from "react";

export const Route = createFileRoute("/admin/spin-wheel/prizes")({
  component: ActivePrizesPage,
});

function ActivePrizesPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, error } = useAdminActivePrizes(page, limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Active Prizes</h1>
        <p className="text-muted-foreground text-sm">View all active spin wheel prizes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Active Prizes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading prizes</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Prize Type</TableHead>
                  <TableHead>Prize Value</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Claimed</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((prize) => (
                  <TableRow key={prize.id}>
                    <TableCell>{prize.profileName || prize.profileId}</TableCell>
                    <TableCell>{prize.prizeType}</TableCell>
                    <TableCell>{prize.prizeValue || "-"}</TableCell>
                    <TableCell>{prize.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell>{prize.isClaimed ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {prize.expiresAt ? new Date(prize.expiresAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{new Date(prize.createdAt).toLocaleDateString()}</TableCell>
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

