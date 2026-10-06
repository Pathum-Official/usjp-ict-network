"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Edit } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AchievementsManager() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [iconName, setIconName] = useState("Trophy");

  const fetchAchievements = async () => {
    const q = query(collection(db, "achievements"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    setAchievements(list);
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "achievements", editId), {
          title, value, iconName
        });
        toast.success("Achievement updated successfully");
        setEditId(null);
      } else {
        await addDoc(collection(db, "achievements"), {
          title, value, iconName,
          createdAt: serverTimestamp()
        });
        toast.success("Achievement created successfully");
      }
      setTitle(""); setValue(""); setIconName("Trophy");
      fetchAchievements();
    } catch (error) {
      toast.error(editId ? "Failed to update achievement" : "Failed to create achievement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "achievements", id));
      toast.success("Achievement deleted");
      fetchAchievements();
    } catch (error) {
      toast.error("Failed to delete achievement");
    }
  };

  const handleEdit = (ach: any) => {
    setEditId(ach.id);
    setTitle(ach.title || "");
    setValue(ach.value || "");
    setIconName(ach.iconName || "Trophy");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-xl bg-muted/20">
        <h3 className="font-semibold text-lg">{editId ? "Edit Achievement" : "Add New Achievement"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Value (e.g. 50+, 100%)</Label>
            <Input required value={value} onChange={(e) => setValue(e.target.value)} placeholder="50+" />
          </div>
          <div className="space-y-2">
            <Label>Title (e.g. Total Members)</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Total Members" />
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <Select value={iconName} onValueChange={(val) => setIconName(val || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select Icon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Users">Users</SelectItem>
                <SelectItem value="GraduationCap">Graduation Cap</SelectItem>
                <SelectItem value="Trophy">Trophy</SelectItem>
                <SelectItem value="Star">Star</SelectItem>
                <SelectItem value="Briefcase">Briefcase</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {editId ? "Save Changes" : "Create Achievement"}
          </Button>
          {editId && (
            <Button type="button" variant="outline" onClick={() => { setEditId(null); setTitle(""); setValue(""); setIconName("Trophy"); }}>
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Existing Achievements</h3>
        <div className="grid gap-4">
          {achievements.map(ach => (
            <div key={ach.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div>
                <h4 className="font-bold text-2xl text-primary">{ach.value}</h4>
                <p className="text-sm text-muted-foreground">{ach.title}</p>
                <p className="text-xs text-muted-foreground mt-1">Icon: {ach.iconName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => handleEdit(ach)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Achievement?</AlertDialogTitle>
                      <AlertDialogDescription>This will remove the achievement from the home page.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(ach.id)} className="bg-destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {achievements.length === 0 && <p className="text-muted-foreground text-sm">No achievements found.</p>}
        </div>
      </div>
    </div>
  );
}
