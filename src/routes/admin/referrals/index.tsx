import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminReferralStats } from "@/hooks/api/useAdminReferrals";
import { useState } from "react";

export const Route = createFileRoute("/admin/referrals/")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, error } = useAdminReferralStats(page, limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
        <p className="text-muted-foreground text-sm">View referral statistics for all users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading referral stats</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Total Referrals</TableHead>
                  <TableHead>Current Tier</TableHead>
                  <TableHead>Next Tier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((stat) => (
                  <TableRow key={stat.userId}>
                    <TableCell>{stat.userName || stat.userId}</TableCell>
                    <TableCell>{stat.referralCode || "-"}</TableCell>
                    <TableCell>{stat.totalReferrals}</TableCell>
                    <TableCell>{stat.currentTier?.name || "-"}</TableCell>
                    <TableCell>{stat.nextTier?.name || "-"}</TableCell>
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

