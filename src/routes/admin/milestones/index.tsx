import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminMilestones } from "@/hooks/api/useAdminMilestones";
import { useState } from "react";

export const Route = createFileRoute("/admin/milestones/")({
  component: MilestonesPage,
});

function MilestonesPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, error } = useAdminMilestones(page, limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Milestones</h1>
        <p className="text-muted-foreground text-sm">View all milestones achieved by profiles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading milestones</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Notified</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell>{milestone.profileName || milestone.profileId}</TableCell>
                    <TableCell>{milestone.type}</TableCell>
                    <TableCell>{milestone.threshold}</TableCell>
                    <TableCell>{milestone.currentValue}</TableCell>
                    <TableCell>{milestone.isNotified ? "Yes" : "No"}</TableCell>
                    <TableCell>{new Date(milestone.createdAt).toLocaleDateString()}</TableCell>
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

