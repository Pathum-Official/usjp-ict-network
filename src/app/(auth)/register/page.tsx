"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import { useEffect } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    regNo: "",
    cohortId: "",
    combination: "",
  });
  const [combinations, setCombinations] = useState<{id:string, name:string}[]>([]);
  const [cohorts, setCohorts] = useState<{id:string, name:string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

    const fetchCohorts = async () => {
      try {
        const q = query(collection(db, "cohorts"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list: {id:string, name:string}[] = [];
        snap.forEach(d => {
          if (!d.data().isHidden) {
            list.push({ id: d.data().id, name: d.data().name });
          }
        });
        setCohorts(list);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchCombs();
    fetchCohorts();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cohortId) {
      toast.error("Please select a cohort.");
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // Save additional details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: formData.email,
        name: formData.name,
        regNo: formData.regNo,
        cohortId: formData.cohortId,
        combination: formData.combination,
        role: "student",
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      toast.success("Registration successful!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to register.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-2xl tracking-tight text-primary">ICT Network</span>
          </Link>
        </div>
        <Card className="border-t-4 border-t-primary shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">Join the ICT student portal</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Edu Email Address</label>
                <Input type="email" placeholder="student@sjp.ac.lk" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Student Reg Number</label>
                <Input placeholder="AS2022xxx" value={formData.regNo} onChange={(e) => setFormData({...formData, regNo: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cohort / Batch</label>
                <Select onValueChange={(val: string | null) => val && setFormData({...formData, cohortId: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {cohorts.length > 0 ? (
                      cohorts.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No cohorts available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Combination</label>
                <Select value={formData.combination || ''} onValueChange={(val) => setFormData({...formData, combination: val || ''})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select combination (Optional)" />
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
                <label className="text-sm font-medium">Password</label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={6} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-4 mt-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Register"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
