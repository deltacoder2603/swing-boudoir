import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAdminMedia, useDeleteMedia } from "@/hooks/api/useAdminMedia";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/media/")({
  component: MediaPage,
});

function MediaPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, error } = useAdminMedia(page, limit);
  const deleteMutation = useDeleteMedia();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this media?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Media</h1>
        <p className="text-muted-foreground text-sm">Manage all media files in the system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Media</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error loading media</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((media) => (
                  <TableRow key={media.id}>
                    <TableCell>{media.name}</TableCell>
                    <TableCell>{media.mediaType}</TableCell>
                    <TableCell>{media.status}</TableCell>
                    <TableCell>{media.size ? `${(media.size / 1024).toFixed(2)} KB` : "-"}</TableCell>
                    <TableCell>{new Date(media.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(media.id)}>
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

