"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CalendarDays, Image as ImageIcon, Trash2, Edit, X, MonitorPlay, Trophy, Users } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { uploadToImgBB } from "@/lib/imgbb";
import { HeroSlidesManager } from "./HeroSlidesManager";
import { AchievementsManager } from "./AchievementsManager";
import { FeaturedRepsManager } from "./FeaturedRepsManager";

export function PublicContentManagementTab() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("subtab") || "events";
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Public Site Management</CardTitle>
          <CardDescription>Manage content that is visible to the public on the landing page, events, and gallery.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab}>
            <TabsList className="mb-4 flex flex-wrap h-auto gap-2">
              <TabsTrigger value="events"><CalendarDays className="w-4 h-4 mr-2" /> Campus Events</TabsTrigger>
              <TabsTrigger value="gallery"><ImageIcon className="w-4 h-4 mr-2" /> Photo Gallery</TabsTrigger>
              <TabsTrigger value="hero"><MonitorPlay className="w-4 h-4 mr-2" /> Hero Slides</TabsTrigger>
              <TabsTrigger value="achievements"><Trophy className="w-4 h-4 mr-2" /> Achievements</TabsTrigger>
              <TabsTrigger value="reps"><Users className="w-4 h-4 mr-2" /> Featured Reps</TabsTrigger>
            </TabsList>
            
            <TabsContent value="events" className="space-y-8">
              <EventsManager />
            </TabsContent>
            
            <TabsContent value="gallery" className="space-y-8">
              <GalleryManager />
            </TabsContent>

            <TabsContent value="hero" className="space-y-8">
              <HeroSlidesManager />
            </TabsContent>

            <TabsContent value="achievements" className="space-y-8">
              <AchievementsManager />
            </TabsContent>

            <TabsContent value="reps" className="space-y-8">
              <FeaturedRepsManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function EventsManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const editId = searchParams.get("tab") === "public" && searchParams.get("subtab") !== "gallery" ? searchParams.get("editId") : null;
  
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  const fetchEvents = async () => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    setEvents(list);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (editId && events.length > 0) {
      const target = events.find(e => e.id === editId);
      if (target) {
        setTitle(target.title || "");
        setDate(target.date || "");
        setLocation(target.location || "");
        setImageUrl(target.imageUrl || "");
        setDescription(target.description || "");
        setLink(target.link || "");
        setSelectedFile(null);
      }
    } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
      setTitle(""); setDate(""); setLocation(""); setImageUrl(""); setDescription(""); setLink(""); setSelectedFile(null);
    }
  }, [editId, events]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = imageUrl;
      if (selectedFile) {
        finalImageUrl = await uploadToImgBB(selectedFile);
      }

      if (editId) {
        await updateDoc(doc(db, "events", editId), {
          title, date, location, imageUrl: finalImageUrl, description, link
        });
        toast.success("Event updated successfully");
        router.push("/admin?tab=public&subtab=events", { scroll: false });
      } else {
        await addDoc(collection(db, "events"), {
          title, date, location, imageUrl: finalImageUrl, description, link,
          createdAt: serverTimestamp()
        });
        toast.success("Event created successfully");
        setTitle(""); setDate(""); setLocation(""); setImageUrl(""); setDescription(""); setLink(""); setSelectedFile(null);
      }
      fetchEvents();
    } catch (error) {
      toast.error(editId ? "Failed to update event" : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "events", id));
      toast.success("Event deleted");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-xl bg-muted/20">
        <h3 className="font-semibold text-lg">{editId ? "Edit Event" : "Add New Event"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Tech Symposium" />
          </div>
          <div className="space-y-2">
            <Label>Date string</Label>
            <Input required value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. October 15, 2026" />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Main Auditorium" />
          </div>
          <div className="space-y-2">
            <Label>Upload Image (Optional)</Label>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                  setImageUrl(""); // clear manual url
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
          <div className="space-y-2">
            <Label>Link (Optional, e.g. Registration URL)</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Event details..." />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading && selectedFile ? "Uploading..." : editId ? "Save Changes" : "Create Event"}
          </Button>
          {editId && (
            <Button type="button" variant="outline" onClick={() => router.push("/admin?tab=public&subtab=events", { scroll: false })}>
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Existing Events</h3>
        <div className="grid gap-4">
          {events.map(evt => (
            <div key={evt.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div>
                <h4 className="font-bold">{evt.title}</h4>
                <p className="text-sm text-muted-foreground">{evt.date} | {evt.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary hover:bg-primary/10"
                  onClick={() => router.push(`/admin?tab=public&subtab=events&editId=${evt.id}`, { scroll: false })}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger>
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-accent cursor-pointer"><Trash2 className="w-4 h-4" /></div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently remove the event from the public site.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(evt.id)} className="bg-destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-muted-foreground text-sm">No events found.</p>}
        </div>
      </div>
    </div>
  );
}

function GalleryManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const editId = searchParams.get("tab") === "public" && searchParams.get("subtab") === "gallery" ? searchParams.get("editId") : null;
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("both");

  const { user } = useAuth();

  const fetchGallery = async () => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    setItems(list);
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  useEffect(() => {
    if (editId && items.length > 0) {
      const target = items.find(i => i.id === editId);
      if (target) {
        setTitle(target.title || "");
        setCategory(target.category || "");
        setImageUrl("");
        setCaption(target.caption || "");
        setVisibility(target.visibility || "both");
        setSelectedFiles([]);
        setExistingImageUrls(target.imageUrls || (target.imageUrl ? [target.imageUrl] : []));
      }
    } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
      setTitle(""); setCategory(""); setImageUrl(""); setCaption(""); setVisibility("both"); setSelectedFiles([]); setExistingImageUrls([]);
    }
  }, [editId, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 && existingImageUrls.length === 0 && !imageUrl) {
      toast.error("Please provide at least one image.");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        let newUrls: string[] = [];
        if (selectedFiles.length > 0) {
          setUploadProgress({ current: 0, total: selectedFiles.length });
          for (let i = 0; i < selectedFiles.length; i++) {
             newUrls.push(await uploadToImgBB(selectedFiles[i]));
             setUploadProgress({ current: i + 1, total: selectedFiles.length });
          }
        }
        const finalUrls = [...existingImageUrls, ...newUrls];
        if (imageUrl && !finalUrls.includes(imageUrl)) finalUrls.push(imageUrl);
        
        if (finalUrls.length === 0) {
           toast.error("Album must have at least one photo.");
           setLoading(false);
           return;
        }

        await updateDoc(doc(db, "gallery", editId), {
          title, category, imageUrls: finalUrls, imageUrl: finalUrls[0], caption, visibility
        });
        toast.success("Album updated successfully");
        router.push("/admin?tab=public&subtab=gallery", { scroll: false });
      } else {
        let finalUrls: string[] = [];
        if (selectedFiles.length > 0) {
          setUploadProgress({ current: 0, total: selectedFiles.length });
          for (let i = 0; i < selectedFiles.length; i++) {
             finalUrls.push(await uploadToImgBB(selectedFiles[i]));
             setUploadProgress({ current: i + 1, total: selectedFiles.length });
          }
        }
        if (imageUrl && !finalUrls.includes(imageUrl)) finalUrls.push(imageUrl);

        await addDoc(collection(db, "gallery"), {
          title, category, imageUrls: finalUrls, imageUrl: finalUrls[0], caption, visibility,
          cohortId: user?.cohortId || "unknown",
          createdAt: serverTimestamp()
        });
        toast.success("Album created successfully");
        setTitle(""); setCategory(""); setImageUrl(""); setCaption(""); setVisibility("both"); setSelectedFiles([]); setExistingImageUrls([]);
      }
      setUploadProgress(null);
      fetchGallery();
    } catch (error) {
      toast.error(editId ? "Failed to update album" : "Failed to add album");
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "gallery", id));
      toast.success("Photo deleted");
      fetchGallery();
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-xl bg-muted/20">
        <h3 className="font-semibold text-lg">{editId ? "Edit Photo" : "Add New Photo"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Photo Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Batch Trip Group Photo" />
          </div>
          <div className="space-y-2">
            <Label>Category / Event Name</Label>
            <Input required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Batch Trip 2026" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{editId ? "Add More Image(s)" : "Upload Image(s)"}</Label>
            <Input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={(e) => {
                if (e.target.files) {
                  setSelectedFiles(Array.from(e.target.files));
                  setImageUrl(""); // clear manual url if files are selected
                }
              }} 
            />
            {selectedFiles.length > 0 && (
              <p className="text-sm text-primary font-medium mt-1">
                {selectedFiles.length} new file(s) selected
              </p>
            )}
          </div>
          {editId && existingImageUrls.length > 0 && (
            <div className="space-y-2 md:col-span-2 border rounded-md p-4 bg-background">
              <Label>Manage Existing Photos in Album</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {existingImageUrls.map((url, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-md overflow-hidden border">
                     <img src={url} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity">
                        <Button type="button" variant="ghost" size="icon" className="text-white hover:text-red-500 hover:bg-transparent" onClick={() => {
                           setExistingImageUrls(prev => prev.filter((_, i) => i !== idx));
                        }}>
                          <X className="w-5 h-5" />
                        </Button>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <Label>Or Direct Image URL (Fallback)</Label>
            <Input 
              value={imageUrl} 
              onChange={(e) => { setImageUrl(e.target.value); setSelectedFiles([]); }} 
              placeholder="https://..." 
              disabled={selectedFiles.length > 0}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Caption (Optional)</Label>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="A great day..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(val) => setVisibility(val || '')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both (Public & Internal Moments)</SelectItem>
                <SelectItem value="public">Public (Landing Page Only)</SelectItem>
                <SelectItem value="internal">Internal (Moments Tab Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading && uploadProgress 
              ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...` 
              : editId ? "Save Changes" : "Upload Photo(s)"}
          </Button>
          {editId && (
            <Button type="button" variant="outline" onClick={() => router.push("/admin?tab=public&subtab=gallery", { scroll: false })}>
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Existing Albums</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const displayUrl = item.imageUrls?.[0] || item.imageUrl;
            const count = item.imageUrls ? item.imageUrls.length : 1;
            return (
              <div key={item.id} className="relative group rounded-lg overflow-hidden border">
                <img src={displayUrl} alt={item.title} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/40 transition-opacity flex flex-col justify-between p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-x-2 flex">
                      <Badge variant="secondary" className="bg-white/20 text-white border-none">{item.category}</Badge>
                      <Badge variant="secondary" className="bg-white/40 text-white border-none">{item.visibility || 'public'}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-background/50 text-white hover:bg-primary"
                        onClick={() => router.push(`/admin?tab=public&subtab=gallery&editId=${item.id}`, { scroll: false })}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 bg-destructive/80 text-white hover:bg-destructive"><Trash2 className="w-4 h-4" /></Button>} />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Album?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove all photos in this album.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-white truncate">{item.title}</h4>
                    <p className="text-white/70 text-xs">{count} photo{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No albums found.</p>}
        </div>
      </div>
    </div>
  );
}
