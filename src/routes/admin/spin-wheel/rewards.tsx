import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  useAdminSpinWheelRewards,
  useCreateSpinWheelReward,
  useUpdateSpinWheelReward,
  useDeleteSpinWheelReward,
  type SpinWheelReward,
  type CreateSpinWheelRewardRequest,
} from "@/hooks/api/useAdminSpinWheel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/spin-wheel/rewards")({
  component: SpinWheelRewardsPage,
});

function SpinWheelRewardsPage() {
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<SpinWheelReward | null>(null);
  const limit = 20;

  const { data, isLoading, error } = useAdminSpinWheelRewards(page, limit);
  const createMutation = useCreateSpinWheelReward();
  const updateMutation = useUpdateSpinWheelReward();
  const deleteMutation = useDeleteSpinWheelReward();

  const form = useForm<CreateSpinWheelRewardRequest>({
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      probability: 0,
      popupMessage: "",
      rewardType: "BONUS_VOTES",
      rewardValue: null,
      isActive: true,
      sortOrder: 0,
    },
  });

  const handleSubmit = async (data: CreateSpinWheelRewardRequest) => {
    if (editingReward) {
      await updateMutation.mutateAsync({ id: editingReward.id, data });
      setEditingReward(null);
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsCreateDialogOpen(false);
    form.reset();
  };

  const handleEdit = (reward: SpinWheelReward) => {
    setEditingReward(reward);
    form.reset({
      name: reward.name,
      description: reward.description,
      icon: reward.icon,
      probability: reward.probability,
      popupMessage: reward.popupMessage,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue || undefined,
      isActive: reward.isActive,
      sortOrder: reward.sortOrder,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this reward?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Spin Wheel Rewards</h1>
          <p className="text-muted-foreground text-sm">Manage spin wheel rewards and their probabilities</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingReward(null); form.reset(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingReward ? "Edit Reward" : "Create Reward"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input {...form.register("name")} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea {...form.register("description")} required />
              </div>
              <div>
                <Label>Icon</Label>
                <Input {...form.register("icon")} placeholder="🎁" required />
              </div>
              <div>
                <Label>Probability (%)</Label>
                <Input type="number" {...form.register("probability", { valueAsNumber: true })} min={0} max={100} required />
              </div>
              <div>
                <Label>Popup Message</Label>
                <Textarea {...form.register("popupMessage")} required />
              </div>
              <div>
                <Label>Reward Type</Label>
                <select {...form.register("rewardType")} className="w-full p-2 border rounded">
                  <option value="BONUS_VOTES">Bonus Votes</option>
                  <option value="VOTE_MULTIPLIER">Vote Multiplier</option>
                  <option value="FREE_RETRY_SPIN">Free Retry Spin</option>
                  <option value="VOTE_MULTIPLIER_TOKEN">Vote Multiplier Token</option>
                </select>
              </div>
              <div>
                <Label>Reward Value</Label>
                <Input type="number" {...form.register("rewardValue", { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" {...form.register("sortOrder", { valueAsNumber: true })} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch {...form.register("isActive")} checked={form.watch("isActive")} />
                <Label>Active</Label>
              </div>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingReward ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading rewards</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>{reward.icon}</TableCell>
                    <TableCell>{reward.name}</TableCell>
                    <TableCell>{reward.rewardType}</TableCell>
                    <TableCell>{reward.probability}%</TableCell>
                    <TableCell>{reward.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(reward)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(reward.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

