"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, addDoc, serverTimestamp, updateDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Plus, X, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export function SubjectsManagementTab({ cohortId }: { cohortId: string }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "modules"),
        where("cohortId", "==", cohortId)
      );
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort by code
      list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
      setSubjects(list);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cohortId) {
      fetchSubjects();
    }
  }, [cohortId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      toast.error("Code and Name are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "modules"), {
        code: newCode.trim(),
        name: newName.trim(),
        cohortId,
        createdAt: serverTimestamp()
      });
      toast.success("Subject added successfully");
      setNewCode("");
      setNewName("");
      fetchSubjects();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editCode.trim() || !editName.trim()) {
      toast.error("Code and Name cannot be empty");
      return;
    }
    try {
      await updateDoc(doc(db, "modules", id), {
        code: editCode.trim(),
        name: editName.trim()
      });
      toast.success("Subject updated");
      setEditingId(null);
      fetchSubjects();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update subject");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "modules", id));
      toast.success("Subject deleted");
      fetchSubjects();
    } catch (error) {
      toast.error("Failed to delete subject");
    }
  };

  const startEditing = (subject: any) => {
    setEditingId(subject.id);
    setEditCode(subject.code);
    setEditName(subject.name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading subjects...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Subject / Module</CardTitle>
          <CardDescription>Create a new subject to categorize resources and lectures.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Module Code</label>
              <Input placeholder="e.g., PHY101" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Subject Name</label>
              <Input placeholder="e.g., Physics" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Add Subject
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="border rounded-md overflow-hidden bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module Code</TableHead>
              <TableHead>Subject Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No subjects found.</TableCell>
              </TableRow>
            ) : (
              subjects.map((s) => (
                <TableRow key={s.id}>
                  {editingId === s.id ? (
                    <>
                      <TableCell>
                        <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleUpdate(s.id)} className="text-emerald-500 hover:text-emerald-600">
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="text-muted-foreground">
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-mono font-medium">{s.code}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEditing(s)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-destructive" />}>
                            <Trash2 className="h-4 w-4" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete this subject. (Warning: Existing resources using this module code won't be deleted automatically).</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
