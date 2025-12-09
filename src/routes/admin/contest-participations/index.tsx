import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAdminContestParticipations, useUpdateContestParticipation } from "@/hooks/api/useAdminContestParticipation";
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/contest-participations/")({
  component: ContestParticipationsPage,
});

function ContestParticipationsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, error } = useAdminContestParticipations(page, limit);
  const updateMutation = useUpdateContestParticipation();

  const handleApprove = async (id: string) => {
    await updateMutation.mutateAsync({ id, data: { isApproved: true } });
  };

  const handleReject = async (id: string) => {
    await updateMutation.mutateAsync({ id, data: { isApproved: false } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contest Participations</h1>
        <p className="text-muted-foreground text-sm">Manage contest participations and approvals</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contest Participations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading participations</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Contest</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Participating</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((participation) => (
                  <TableRow key={participation.id}>
                    <TableCell>{participation.profileName || participation.profileId}</TableCell>
                    <TableCell>{participation.contestName || participation.contestId}</TableCell>
                    <TableCell>{participation.isApproved ? "Yes" : "No"}</TableCell>
                    <TableCell>{participation.isParticipating ? "Yes" : "No"}</TableCell>
                    <TableCell>{new Date(participation.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {!participation.isApproved && (
                        <Button variant="ghost" size="sm" onClick={() => handleApprove(participation.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {participation.isApproved && (
                        <Button variant="ghost" size="sm" onClick={() => handleReject(participation.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
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

