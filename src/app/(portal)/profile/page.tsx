"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, collection, getDocs, query, orderBy, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToImgBB } from "@/lib/imgbb";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Camera, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    publicEmail: "",
    phone: "",
    whatsapp: "",
    address: "",
    currentAddress: "",
    dob: "",
    degree: "",
    school: "",
    combination: "",
    jobCompany: "",
    jobPosition: "",
    linkedin: "",
    facebook: "",
    github: "",
    instagram: "",
    youtube: "",
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [combinations, setCombinations] = useState<{id:string, name:string}[]>([]);
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);

  useEffect(() => {
    const fetchCombs = async () => {
      try {
        const q = query(collection(db, "combinations"), orderBy("name"));
        const snap = await getDocs(q);
        const list: {id:string, name:string}[] = [];
        snap.forEach(d => list.push({ id: d.id, name: d.data().name }));
        setCombinations(list);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCombs();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        publicEmail: user.publicEmail || "",
        phone: user.phone || "",
        whatsapp: user.whatsapp || "",
        address: user.address || "",
        currentAddress: user.currentAddress || "",
        dob: user.dob || "",
        degree: user.degree || "",
        school: user.school || "",
        combination: user.combination || "",
        jobCompany: user.jobCompany || "",
        jobPosition: user.jobPosition || "",
        linkedin: user.socialLinks?.linkedin || "",
        facebook: user.socialLinks?.facebook || "",
        github: user.socialLinks?.github || "",
        instagram: user.socialLinks?.instagram || "",
        youtube: user.socialLinks?.youtube || "",
      });
      
      // Fetch pending update request
      const fetchPending = async () => {
        try {
          const snap = await getDoc(doc(db, "profile_updates", user.uid));
          if (snap.exists() && snap.data().status === 'pending') {
            setPendingUpdate(snap.data());
          } else {
            setPendingUpdate(null);
          }
        } catch(e) {
          console.error(e);
        }
      };
      fetchPending();
    }
  }, [user, isSaving, isUploading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const url = await uploadToImgBB(file);
      
      await setDoc(doc(db, "profile_updates", user.uid), {
        userId: user.uid,
        cohortId: user.cohortId || 'unknown',
        userName: user.name,
        type: 'photo',
        data: { photoURL: url },
        status: 'pending',
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast.success("Photo update request submitted to admin for approval!");
    } catch (error) {
      toast.error("Failed to submit photo update request");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      
      await setDoc(doc(db, "profile_updates", user.uid), {
        userId: user.uid,
        cohortId: user.cohortId || 'unknown',
        userName: user.name,
        type: 'details',
        data: {
          name: formData.name,
          publicEmail: formData.publicEmail,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          address: formData.address,
          currentAddress: formData.currentAddress,
          dob: formData.dob,
          degree: formData.degree,
          school: formData.school,
          combination: formData.combination,
          jobCompany: formData.jobCompany,
          jobPosition: formData.jobPosition,
          socialLinks: {
            linkedin: formData.linkedin,
            facebook: formData.facebook,
            github: formData.github,
            instagram: formData.instagram,
            youtube: formData.youtube,
          }
        },
        status: 'pending',
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast.success("Profile update request submitted to admin for approval!");
    } catch (error) {
      toast.error("Failed to submit update request");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  const PendingField = ({ field, isSocial = false }: { field: string, isSocial?: boolean }) => {
    if (!pendingUpdate || !pendingUpdate.data) return null;
    const oldVal = isSocial ? (user.socialLinks as any)?.[field] : (user as any)[field];
    const newVal = isSocial ? (pendingUpdate.data.socialLinks as any)?.[field] : pendingUpdate.data[field];
    
    if (newVal !== undefined && newVal !== oldVal) {
      return (
        <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3"/> Pending: {newVal || '(empty)'}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">Manage your personal and academic information.</p>
      </div>

      {pendingUpdate && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Pending Approval</h3>
            <div className="mt-2 text-sm opacity-90">
              You have submitted profile updates that are waiting for admin approval. Changed fields are marked below in amber. Any new changes you save will overwrite your currently pending request.
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[250px_1fr] gap-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <Avatar className="h-40 w-40 border-4 border-background shadow-xl">
              <AvatarImage src={pendingUpdate?.data?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="object-cover" />
              <AvatarFallback className="text-4xl">{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            {pendingUpdate?.data?.photoURL && pendingUpdate.data.photoURL !== user.photoURL && (
              <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 hover:bg-amber-600 border-2 border-background text-white shadow-md">Pending</Badge>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
            </label>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs font-mono mt-1 bg-muted px-2 py-1 rounded inline-block">{user.regNo}</p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSave}>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update your information to help peers connect with you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary border-b pb-2">Personal Information</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <PendingField field="name" />
                  </div>
                  <div className="space-y-2">
                    <Label>System Email (University / Registered)</Label>
                    <Input value={user.email} disabled className="bg-muted text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label>Public Email (For Directory)</Label>
                    <Input type="email" value={formData.publicEmail} onChange={e => setFormData({...formData, publicEmail: e.target.value})} placeholder="e.g. personal@email.com" />
                    <PendingField field="publicEmail" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                    <PendingField field="dob" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="07XXXXXXXX" />
                    <PendingField field="phone" />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Number</Label>
                    <Input type="tel" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="07XXXXXXXX" />
                    <PendingField field="whatsapp" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Permanent Address</Label>
                    <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    <PendingField field="address" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Current Residence (Boarding/Hostel)</Label>
                    <Input value={formData.currentAddress} onChange={e => setFormData({...formData, currentAddress: e.target.value})} />
                    <PendingField field="currentAddress" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary border-b pb-2">Academic & Career</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} placeholder="E.g., BSc. in Applied Sciences" />
                    <PendingField field="degree" />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject Combination</Label>
                    <Select value={formData.combination || ''} onValueChange={(val) => setFormData({...formData, combination: val || ''})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select combination" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None / Other</SelectItem>
                        {combinations.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <PendingField field="combination" />
                  </div>
                  <div className="space-y-2">
                    <Label>School Attended</Label>
                    <Input value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} placeholder="E.g., Royal College, Colombo" />
                    <PendingField field="school" />
                  </div>
                  <div className="space-y-2">
                    <Label>Company (If employed)</Label>
                    <Input value={formData.jobCompany} onChange={e => setFormData({...formData, jobCompany: e.target.value})} placeholder="Company Name" />
                    <PendingField field="jobCompany" />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Position</Label>
                    <Input value={formData.jobPosition} onChange={e => setFormData({...formData, jobPosition: e.target.value})} placeholder="Software Engineer" />
                    <PendingField field="jobPosition" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary border-b pb-2">Social Links</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>LinkedIn URL</Label>
                    <Input value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." />
                    <PendingField field="linkedin" isSocial />
                  </div>
                  <div className="space-y-2">
                    <Label>GitHub URL</Label>
                    <Input value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} placeholder="https://github.com/..." />
                    <PendingField field="github" isSocial />
                  </div>
                  <div className="space-y-2">
                    <Label>Facebook URL</Label>
                    <Input value={formData.facebook} onChange={e => setFormData({...formData, facebook: e.target.value})} placeholder="https://facebook.com/..." />
                    <PendingField field="facebook" isSocial />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram URL</Label>
                    <Input value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} placeholder="https://instagram.com/..." />
                    <PendingField field="instagram" isSocial />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>YouTube URL</Label>
                    <Input value={formData.youtube} onChange={e => setFormData({...formData, youtube: e.target.value})} placeholder="https://youtube.com/..." />
                    <PendingField field="youtube" isSocial />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>

            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
