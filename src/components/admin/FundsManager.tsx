"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus, Edit, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function FundsManager({ cohortId }: { cohortId: string }) {
  const [funds, setFunds] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const q = query(collection(db, "funds"), where("cohortId", "==", cohortId));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setFunds(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (cohortId) fetchFunds();
  }, [cohortId]);

  const handleSaveFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setIsSubmitting(true);
      if (editId) {
        await updateDoc(doc(db, "funds", editId), {
          name,
          description,
        });

        // Update all related transactions
        const txQuery = query(collection(db, "transactions"), where("fundId", "==", editId));
        const txSnap = await getDocs(txQuery);
        
        if (!txSnap.empty) {
          const batch = writeBatch(db);
          txSnap.forEach(txDoc => {
            batch.update(txDoc.ref, { fundName: name });
          });
          await batch.commit();
        }

        setFunds(funds.map(f => f.id === editId ? { ...f, name, description } : f));
        setEditId(null);
        setName("");
        setDescription("");
        toast.success("Fund updated successfully");
      } else {
        const newDoc = await addDoc(collection(db, "funds"), {
          cohortId,
          name,
          description,
          createdAt: serverTimestamp(),
        });
        setFunds([...funds, { id: newDoc.id, cohortId, name, description }]);
        setName("");
        setDescription("");
        toast.success("Fund created successfully");
      }
    } catch (e) {
      console.error(e);
      toast.error(editId ? "Failed to update fund" : "Failed to create fund");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (f: any) => {
    setEditId(f.id);
    setName(f.name);
    setDescription(f.description || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditId(null);
    setName("");
    setDescription("");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "funds", id));
      setFunds(funds.filter(f => f.id !== id));
      toast.success("Fund deleted");
    } catch (error) {
      toast.error("Failed to delete fund");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Funds / Accounts</CardTitle>
          <CardDescription>Create different accounts to track specific finances (e.g., Trip Fund, Birthday Fund).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveFund} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 w-full sm:flex-1">
              <label className="text-sm font-medium">Fund Name</label>
              <Input placeholder="e.g., Batch Trip 2026" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2 w-full sm:flex-1">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {editId ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} 
                {editId ? "Update Fund" : "Add Fund"}
              </Button>
              {editId && (
                <Button type="button" variant="outline" onClick={cancelEdit} className="px-3">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4">Loading...</TableCell></TableRow>
                ) : funds.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No funds created yet. Using General Fund by default.</TableCell></TableRow>
                ) : (
                  funds.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell>{f.description}</TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(f)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}>
                            <Trash2 className="h-4 w-4" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this fund?</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete this fund account? Existing transactions linked to this fund might be affected.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(f.id)} className="bg-destructive hover:bg-destructive/90 text-white">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
