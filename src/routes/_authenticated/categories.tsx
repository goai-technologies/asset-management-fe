import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("category_name")).data ?? [],
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const { error } = await supabase.from("categories").insert({ category_name: newName.trim() });
    if (error) return toast.error(error.message);
    setNewName(""); qc.invalidateQueries({ queryKey: ["categories"] });
  };
  const save = async () => {
    if (!editing) return;
    const { error } = await supabase.from("categories").update({ category_name: editing.name }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    setEditing(null); qc.invalidateQueries({ queryKey: ["categories"] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div>
      <PageHeader title="Categories" description="Manage asset categories." />
      <Card className="mb-4"><CardContent className="p-4">
        <form onSubmit={add} className="flex gap-2">
          <Input placeholder="New category name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button type="submit"><Plus className="h-4 w-4 mr-2" />Add</Button>
        </form>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {isLoading ? <p className="p-4 text-muted-foreground">Loading…</p> : (
          <ul className="divide-y">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-4">
                {editing?.id === c.id ? (
                  <div className="flex-1 flex gap-2">
                    <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                    <Button onClick={save}>Save</Button>
                    <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{c.category_name}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing({ id: c.id, name: c.category_name })}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>
    </div>
  );
}
