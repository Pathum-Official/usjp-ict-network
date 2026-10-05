"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToImgBB } from "@/lib/imgbb";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Camera } from "lucide-react";

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
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const url = await uploadToImgBB(file);
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      // Note: In a real app, you might want a context refresh mechanism here.
      // A simple window reload works to fetch the updated user doc from AuthContext if we don't have a specific refresh function.
      toast.success("Profile photo updated successfully!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      await updateDoc(doc(db, "users", user.uid), {
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
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">Manage your personal and academic information.</p>
      </div>

      <div className="grid md:grid-cols-[250px_1fr] gap-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <Avatar className="h-40 w-40 border-4 border-background shadow-xl">
              <AvatarImage src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="object-cover" />
              <AvatarFallback className="text-4xl">{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
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
                  </div>
                  <div className="space-y-2">
                    <Label>System Email (University / Registered)</Label>
                    <Input value={user.email} disabled className="bg-muted text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label>Public Email (For Directory)</Label>
                    <Input type="email" value={formData.publicEmail} onChange={e => setFormData({...formData, publicEmail: e.target.value})} placeholder="e.g. personal@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="07XXXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Number</Label>
                    <Input type="tel" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="07XXXXXXXX" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Permanent Address</Label>
                    <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Current Residence (Boarding/Hostel)</Label>
                    <Input value={formData.currentAddress} onChange={e => setFormData({...formData, currentAddress: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary border-b pb-2">Academic & Career</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} placeholder="E.g., BSc. in Applied Sciences" />
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
                  </div>
                  <div className="space-y-2">
                    <Label>School Attended</Label>
                    <Input value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} placeholder="E.g., Royal College, Colombo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Company (If employed)</Label>
                    <Input value={formData.jobCompany} onChange={e => setFormData({...formData, jobCompany: e.target.value})} placeholder="Company Name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Position</Label>
                    <Input value={formData.jobPosition} onChange={e => setFormData({...formData, jobPosition: e.target.value})} placeholder="Software Engineer" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary border-b pb-2">Social Links</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>LinkedIn URL</Label>
                    <Input value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>GitHub URL</Label>
                    <Input value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} placeholder="https://github.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Facebook URL</Label>
                    <Input value={formData.facebook} onChange={e => setFormData({...formData, facebook: e.target.value})} placeholder="https://facebook.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram URL</Label>
                    <Input value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} placeholder="https://instagram.com/..." />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>YouTube URL</Label>
                    <Input value={formData.youtube} onChange={e => setFormData({...formData, youtube: e.target.value})} placeholder="https://youtube.com/..." />
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
