import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAdminFavorites, useDeleteFavorite } from "@/hooks/api/useAdminFavorites";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/favorites/")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, error } = useAdminFavorites(page, limit);
  const deleteMutation = useDeleteFavorite();

  const handleDelete = async (voterId: string, modelId: string) => {
    if (confirm("Are you sure you want to delete this favorite?")) {
      await deleteMutation.mutateAsync({ voterId, modelId });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground text-sm">View all favorite relationships between voters and models</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Favorites</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading favorites</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voter</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((favorite) => (
                  <TableRow key={favorite.id}>
                    <TableCell>{favorite.voterName || favorite.voterId}</TableCell>
                    <TableCell>{favorite.modelName || favorite.modelId}</TableCell>
                    <TableCell>{new Date(favorite.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(favorite.voterId, favorite.modelId)}>
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

