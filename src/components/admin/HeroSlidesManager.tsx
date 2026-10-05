"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { uploadToImgBB } from "@/lib/imgbb";

export function HeroSlidesManager() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchSlides = async () => {
    const q = query(collection(db, "hero_slides"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    setSlides(list);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = imageUrl;
      if (selectedFile) {
        finalImageUrl = await uploadToImgBB(selectedFile);
      }

      if (editId) {
        await updateDoc(doc(db, "hero_slides", editId), {
          title, subtitle, imageUrl: finalImageUrl
        });
        toast.success("Slide updated successfully");
        setEditId(null);
      } else {
        await addDoc(collection(db, "hero_slides"), {
          title, subtitle, imageUrl: finalImageUrl,
          createdAt: serverTimestamp()
        });
        toast.success("Slide created successfully");
      }
      setTitle(""); setSubtitle(""); setImageUrl(""); setSelectedFile(null);
      fetchSlides();
    } catch (error) {
      toast.error(editId ? "Failed to update slide" : "Failed to create slide");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "hero_slides", id));
      toast.success("Slide deleted");
      fetchSlides();
    } catch (error) {
      toast.error("Failed to delete slide");
    }
  };

  const handleEdit = (slide: any) => {
    setEditId(slide.id);
    setTitle(slide.title || "");
    setSubtitle(slide.subtitle || "");
    setImageUrl(slide.imageUrl || "");
    setSelectedFile(null);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-xl bg-muted/20">
        <h3 className="font-semibold text-lg">{editId ? "Edit Slide" : "Add New Slide"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Slide Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Next Generation of ICT Scholars" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Subtitle</Label>
            <Textarea required value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle text..." />
          </div>
          <div className="space-y-2">
            <Label>Upload Image</Label>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                  setImageUrl("");
                }
              }} 
            />
          </div>
          <div className="space-y-2">
            <Label>Or Image URL (Fallback)</Label>
            <Input 
              value={imageUrl} 
              onChange={(e) => { setImageUrl(e.target.value); setSelectedFile(null); }} 
              placeholder="https://..." 
              disabled={!!selectedFile}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading && selectedFile ? "Uploading..." : editId ? "Save Changes" : "Create Slide"}
          </Button>
          {editId && (
            <Button type="button" variant="outline" onClick={() => { setEditId(null); setTitle(""); setSubtitle(""); setImageUrl(""); setSelectedFile(null); }}>
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Existing Slides</h3>
        <div className="grid gap-4">
          {slides.map(slide => (
            <div key={slide.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-4">
                {slide.imageUrl && <img src={slide.imageUrl} alt={slide.title} className="w-16 h-16 object-cover rounded-md" />}
                <div>
                  <h4 className="font-bold">{slide.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">{slide.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => handleEdit(slide)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>} />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Slide?</AlertDialogTitle>
                      <AlertDialogDescription>This will remove the slide from the home page.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(slide.id)} className="bg-destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {slides.length === 0 && <p className="text-muted-foreground text-sm">No slides found.</p>}
        </div>
      </div>
    </div>
  );
}
