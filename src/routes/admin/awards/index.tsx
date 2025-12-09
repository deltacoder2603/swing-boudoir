import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAwards } from "@/hooks/api/useAdminAwards";
import { useState } from "react";

export const Route = createFileRoute("/admin/awards/")({
  component: AwardsPage,
});

function AwardsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, error } = useAdminAwards(page, limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Awards</h1>
        <p className="text-muted-foreground text-sm">View all awards across all contests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Awards</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading awards</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contest</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell>{award.icon}</TableCell>
                    <TableCell>{award.name}</TableCell>
                    <TableCell>{award.contestName || award.contestId}</TableCell>
                    <TableCell>{new Date(award.createdAt).toLocaleDateString()}</TableCell>
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

