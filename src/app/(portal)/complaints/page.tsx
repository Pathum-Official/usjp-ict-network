"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const complaintData: any = {
        subject,
        message,
        status: "pending",
        cohortId: user?.cohortId || "unknown",
        createdAt: Date.now(),
      };

      // Completely omit identity if anonymous
      if (!isAnonymous && user) {
        complaintData.submittedBy = user.uid;
        complaintData.submittedByName = user.name;
      }

      await addDoc(collection(db, "complaints"), complaintData);
      toast.success("Feedback submitted successfully.");
      setSubject("");
      setMessage("");
      setIsAnonymous(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback & Complaints</h1>
          <p className="text-muted-foreground">Submit feedback or report issues to the committee.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>
            Your feedback helps us improve the ICT Network experience. You can choose to remain completely anonymous.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input 
                placeholder="Brief summary of your feedback" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea 
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Provide detailed feedback here..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="anonymous"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <label htmlFor="anonymous" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Submit Anonymously
              </label>
            </div>
            {isAnonymous && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-dashed">
                Note: When submitted anonymously, absolutely no user identifiers (UID, Name, Email) will be saved to the database.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
