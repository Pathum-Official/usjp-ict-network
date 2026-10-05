"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Eye, EyeOff, Edit } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

export function CohortsManagementTab() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [idValue, setIdValue] = useState("");
  const [name, setName] = useState("");
  const [isHidden, setIsHidden] = useState(false);

  const fetchCohorts = async () => {
    const q = query(collection(db, "cohorts"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach(d => list.push({ _docId: d.id, ...d.data() }));
    setCohorts(list);
  };

  useEffect(() => {
    fetchCohorts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "cohorts", editId), {
          id: idValue,
          name,
          isHidden
        });
        toast.success("Cohort updated successfully");
        setEditId(null);
      } else {
        await addDoc(collection(db, "cohorts"), {
          id: idValue,
          name,
          isHidden,
          createdAt: serverTimestamp()
        });
        toast.success("Cohort created successfully");
      }
      setIdValue(""); setName(""); setIsHidden(false);
      fetchCohorts();
    } catch (error) {
      toast.error(editId ? "Failed to update cohort" : "Failed to create cohort");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteDoc(doc(db, "cohorts", docId));
      toast.success("Cohort deleted");
      fetchCohorts();
    } catch (error) {
      toast.error("Failed to delete cohort");
    }
  };

  const handleEdit = (cohort: any) => {
    setEditId(cohort._docId);
    setIdValue(cohort.id || "");
    setName(cohort.name || "");
    setIsHidden(cohort.isHidden || false);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-xl bg-muted/20">
        <h3 className="font-semibold text-lg">{editId ? "Edit Cohort" : "Add New Cohort"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cohort ID (e.g., ict-2026)</Label>
            <Input required value={idValue} onChange={(e) => setIdValue(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="ict-2026" />
          </div>
          <div className="space-y-2">
            <Label>Display Name (e.g., ICT 2026)</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ICT 2026" />
          </div>
          <div className="flex items-center space-x-2 md:col-span-2">
            <Switch checked={isHidden} onCheckedChange={setIsHidden} id="hidden-mode" />
            <Label htmlFor="hidden-mode">Hide from Registration Dropdown</Label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>{editId ? "Save Changes" : "Create Cohort"}</Button>
          {editId && (
            <Button type="button" variant="outline" onClick={() => { setEditId(null); setIdValue(""); setName(""); setIsHidden(false); }}>
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Existing Cohorts</h3>
        <div className="grid gap-4">
          {cohorts.map(cohort => (
            <div key={cohort._docId} className={`flex items-center justify-between p-4 border rounded-lg bg-card ${cohort.isHidden ? 'opacity-60' : ''}`}>
              <div>
                <h4 className="font-bold flex items-center gap-2">
                  {cohort.name} <span className="text-muted-foreground text-xs font-normal">({cohort.id})</span>
                  {cohort.isHidden && <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground flex items-center gap-1"><EyeOff className="w-3 h-3"/> Hidden</span>}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary hover:bg-primary/10"
                  onClick={() => handleEdit(cohort)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>} />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Cohort?</AlertDialogTitle>
                      <AlertDialogDescription>Are you sure you want to remove this cohort?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(cohort._docId)} className="bg-destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {cohorts.length === 0 && <p className="text-muted-foreground text-sm">No cohorts found.</p>}
        </div>
      </div>
    </div>
  );
}
