"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save } from "lucide-react";

export interface DirectorySettings {
  showEmail: boolean;
  showPhone: boolean;
  showWhatsapp: boolean;
  showAddress: boolean;
  showDob: boolean;
  showRegNo: boolean;
}

const defaultSettings: DirectorySettings = {
  showEmail: true,
  showPhone: true,
  showWhatsapp: true,
  showAddress: true,
  showDob: false,
  showRegNo: true,
};

export function DirectorySettingsTab() {
  const [settings, setSettings] = useState<DirectorySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "directory");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as DirectorySettings);
        }
      } catch (error) {
        console.error("Error fetching directory settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "directory"), settings);
      toast.success("Directory settings saved successfully");
    } catch (error) {
      console.error("Error saving directory settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof DirectorySettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Directory Visibility Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Control which fields are visible to students in the Student Directory.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field Visibility</CardTitle>
          <CardDescription>Toggle the switches to show or hide sensitive information from the directory cards globally.</CardDescription>
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

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
