"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, addDoc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus, Edit, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

interface Combination {
  id: string;
  name: string;
}

export function CombinationsManagementTab() {
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchCombinations = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "combinations"), orderBy("name"));
      const snapshot = await getDocs(q);
      const list: Combination[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, name: doc.data().name });
      });
      setCombinations(list);
    } catch (error) {
      console.error("Error fetching combinations:", error);
      toast.error("Failed to load combinations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombinations();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setIsAdding(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "combinations", editId), { name: newName.trim() });
        toast.success("Combination updated successfully");
      } else {
        await addDoc(collection(db, "combinations"), { name: newName.trim() });
        toast.success("Combination added successfully");
      }
      setNewName("");
      setIsDialogOpen(false);
      setEditId(null);
      fetchCombinations();
    } catch (error) {
      console.error("Error saving combination:", error);
      toast.error(editId ? "Failed to update combination" : "Failed to add combination");
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleEdit = (combo: Combination) => {
    setEditId(combo.id);
    setNewName(combo.name);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditId(null);
      setNewName("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this combination?")) return;
    try {
      await deleteDoc(doc(db, "combinations", id));
      toast.success("Combination deleted");
      fetchCombinations();
    } catch (error) {
      console.error("Error deleting combination:", error);
      toast.error("Failed to delete combination");
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading combinations...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Manage Subject Combinations</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger>
            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Combination
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Subject Combination" : "Add Subject Combination"}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="e.g., Physical Science (Maths)" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={isAdding || !newName.trim()}>
                {isAdding ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Combination Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                  No combinations found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              combinations.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
