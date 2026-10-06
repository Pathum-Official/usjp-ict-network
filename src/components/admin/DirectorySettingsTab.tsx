"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function DirectorySettingsTab() {
  const { user } = useAuth();
  const cohortId = user?.cohortId || '';

  const [settings, setSettings] = useState<any>({
    showEmail: true,
    showPhone: true,
    showWhatsapp: true,
    showAddress: true,
    showDob: false,
    showRegNo: true,
    shareDirectoryWith: [],
    shareResourcesWith: []
  });
  const [cohorts, setCohorts] = useState<{id:string, name:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Cohort Document for settings
        if (cohortId) {
          const docSnap = await getDoc(doc(db, "cohorts", cohortId));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSettings({
              showEmail: data.directorySettings?.showEmail ?? true,
              showPhone: data.directorySettings?.showPhone ?? true,
              showWhatsapp: data.directorySettings?.showWhatsapp ?? true,
              showAddress: data.directorySettings?.showAddress ?? true,
              showDob: data.directorySettings?.showDob ?? false,
              showRegNo: data.directorySettings?.showRegNo ?? true,
              shareDirectoryWith: data.shareDirectoryWith || [],
              shareResourcesWith: data.shareResourcesWith || []
            });
          }
        }
        
        // Fetch All Cohorts for sharing options
        const q = query(collection(db, "cohorts"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list: {id:string, name:string}[] = [];
        snap.forEach(d => {
          if (d.data().id !== cohortId) {
            list.push({ id: d.data().id, name: d.data().name });
          }
        });
        setCohorts(list);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cohortId]);

  const handleSave = async () => {
    if (!cohortId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "cohorts", cohortId), {

        directorySettings: {
          showEmail: settings.showEmail,
          showPhone: settings.showPhone,
          showWhatsapp: settings.showWhatsapp,
          showAddress: settings.showAddress,
          showDob: settings.showDob,
          showRegNo: settings.showRegNo,
        },
        shareDirectoryWith: settings.shareDirectoryWith,
        shareResourcesWith: settings.shareResourcesWith
      }, { merge: true });
      toast.success("Batch settings saved successfully");
    } catch (error) {
      console.error("Error saving batch settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleShare = (id: string, type: 'directory' | 'resources') => {
    const key = type === 'directory' ? 'shareDirectoryWith' : 'shareResourcesWith';
    setSettings((prev: any) => {
      let current = [...prev[key]];
      if (id === 'all') {
        if (current.includes('all')) {
          current = [];
        } else {
          current = ['all'];
        }
      } else {
        if (current.includes('all')) {
          current = current.filter(x => x !== 'all');
        }
        if (current.includes(id)) {
          current = current.filter(x => x !== id);
        } else {
          current.push(id);
        }
      }
      return { ...prev, [key]: current };
    });
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Batch Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Control how your batch's directory and learning resources are shared with other batches.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Directory Sharing Settings</CardTitle>
          <CardDescription>Select which other batches are allowed to view your batch's student directory.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-4 rounded-lg border bg-background">
            <Checkbox 
              id="share-dir-all" 
              checked={settings.shareDirectoryWith.includes('all')} 
              onCheckedChange={() => toggleShare('all', 'directory')}
            />
            <div className="space-y-1 leading-none">
              <label htmlFor="share-dir-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                Public to All Batches
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                Anyone from any registered batch can view your batch's student directory.
              </p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {cohorts.map(c => (
              <div key={`dir-${c.id}`} className={`flex items-center space-x-2 p-3 rounded-lg border bg-background ${settings.shareDirectoryWith.includes('all') ? 'opacity-50' : ''}`}>
                <Checkbox 
                  id={`share-dir-${c.id}`} 
                  disabled={settings.shareDirectoryWith.includes('all')}
                  checked={settings.shareDirectoryWith.includes(c.id) || settings.shareDirectoryWith.includes('all')}
                  onCheckedChange={() => toggleShare(c.id, 'directory')}
                />
                <label htmlFor={`share-dir-${c.id}`} className="text-sm font-medium cursor-pointer">
                  {c.name}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <CardTitle>Learning Resources Transfer</CardTitle>
          <CardDescription>Share your batch's learning resources (notes, kuppi recordings) with junior batches or others.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-4 rounded-lg border bg-background">
            <Checkbox 
              id="share-res-all" 
              checked={settings.shareResourcesWith.includes('all')} 
              onCheckedChange={() => toggleShare('all', 'resources')}
            />
            <div className="space-y-1 leading-none">
              <label htmlFor="share-res-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                Public to All Batches
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                Anyone from any registered batch can access your learning resources.
              </p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {cohorts.map(c => (
              <div key={`res-${c.id}`} className={`flex items-center space-x-2 p-3 rounded-lg border bg-background ${settings.shareResourcesWith.includes('all') ? 'opacity-50' : ''}`}>
                <Checkbox 
                  id={`share-res-${c.id}`} 
                  disabled={settings.shareResourcesWith.includes('all')}
                  checked={settings.shareResourcesWith.includes(c.id) || settings.shareResourcesWith.includes('all')}
                  onCheckedChange={() => toggleShare(c.id, 'resources')}
                />
                <label htmlFor={`share-res-${c.id}`} className="text-sm font-medium cursor-pointer">
                  {c.name} (Junior Batch)
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field Visibility</CardTitle>
          <CardDescription>Toggle the switches to show or hide sensitive information from the directory cards for your batch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Email Address</Label>
              <p className="text-sm text-muted-foreground">Show student's public email address</p>
            </div>
            <Switch checked={settings.showEmail} onCheckedChange={() => handleToggle('showEmail')} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Phone Number</Label>
              <p className="text-sm text-muted-foreground">Show student's contact number & call button</p>
            </div>
            <Switch checked={settings.showPhone} onCheckedChange={() => handleToggle('showPhone')} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>WhatsApp Number</Label>
              <p className="text-sm text-muted-foreground">Show WhatsApp chat link button</p>
            </div>
            <Switch checked={settings.showWhatsapp} onCheckedChange={() => handleToggle('showWhatsapp')} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Home Town / Address</Label>
              <p className="text-sm text-muted-foreground">Show student's permanent address</p>
            </div>
            <Switch checked={settings.showAddress} onCheckedChange={() => handleToggle('showAddress')} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Date of Birth</Label>
              <p className="text-sm text-muted-foreground">Show student's birthday on the directory card</p>
            </div>
            <Switch checked={settings.showDob} onCheckedChange={() => handleToggle('showDob')} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Registration Number</Label>
              <p className="text-sm text-muted-foreground">Show student's university registration number</p>
            </div>
            <Switch checked={settings.showRegNo} onCheckedChange={() => handleToggle('showRegNo')} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto mt-4">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
