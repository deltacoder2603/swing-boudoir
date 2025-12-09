import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminVoterModelMilestones, useGrantMilestoneSpin } from "@/hooks/api/useAdminMilestones";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Gift } from "lucide-react";

export const Route = createFileRoute("/admin/milestones/voter-model")({
  component: VoterModelMilestonesPage,
});

function VoterModelMilestonesPage() {
  const [page, setPage] = useState(1);
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const limit = 20;
  const { data, isLoading, error } = useAdminVoterModelMilestones(page, limit);
  const grantMutation = useGrantMilestoneSpin();

  const form = useForm({
    defaultValues: {
      voterId: "",
      modelId: "",
      milestoneAmount: 50,
    },
  });

  const handleGrant = async (data: { voterId: string; modelId: string; milestoneAmount: number }) => {
    await grantMutation.mutateAsync(data);
    setIsGrantDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voter Model Milestones</h1>
          <p className="text-muted-foreground text-sm">Manage spending milestones for voters per model</p>
        </div>
        <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Gift className="mr-2 h-4 w-4" />
              Grant Milestone Spin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Milestone Spin</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleGrant)} className="space-y-4">
              <div>
                <Label>Voter ID</Label>
                <Input {...form.register("voterId")} required />
              </div>
              <div>
                <Label>Model ID</Label>
                <Input {...form.register("modelId")} required />
              </div>
              <div>
                <Label>Milestone Amount ($)</Label>
                <Input type="number" {...form.register("milestoneAmount", { valueAsNumber: true })} required />
              </div>
              <Button type="submit" disabled={grantMutation.isPending}>
                Grant
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Voter Model Milestones</CardTitle>
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
                  <TableHead>Voter</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Milestone</TableHead>
                  <TableHead>Last Milestone Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell>{milestone.voterName || milestone.voterId}</TableCell>
                    <TableCell>{milestone.modelName || milestone.modelId}</TableCell>
                    <TableCell>${milestone.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>{milestone.lastMilestoneReached ? `$${milestone.lastMilestoneReached}` : "None"}</TableCell>
                    <TableCell>
                      {milestone.lastMilestoneReachedAt
                        ? new Date(milestone.lastMilestoneReachedAt).toLocaleDateString()
                        : "-"}
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

