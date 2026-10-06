import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileRequestsTab() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  const isSuperAdmin = user?.role === 'super_admin';
  const cohortId = user?.cohortId || '';

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      if (!user) return;
      
      let q;
      if (isSuperAdmin) {
        q = query(collection(db, "profile_updates"), where("status", "==", "pending"));
      } else {
        q = query(collection(db, "profile_updates"), where("cohortId", "==", cohortId), where("status", "==", "pending"));
      }
      
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setRequests(list);
    } catch (error) {
      console.error("Error fetching profile requests:", error);
      toast.error("Failed to load profile update requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: any) => {
    try {
      // 1. Update the user document
      await updateDoc(doc(db, "users", request.userId), request.data);
      
      // 2. Mark request as approved
      await updateDoc(doc(db, "profile_updates", request.id), { status: "approved" });
      
      toast.success("Profile update approved and applied!");
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve update");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateDoc(doc(db, "profile_updates", requestId), { status: "rejected" });
      toast.success("Profile update request rejected.");
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject update");
    }
  };

  const handleView = async (req: any) => {
    setSelectedRequest(req);
    setCurrentUserData(null);
    try {
      const { getDoc } = await import("firebase/firestore");
      const userSnap = await getDoc(doc(db, "users", req.userId));
      if (userSnap.exists()) {
        setCurrentUserData(userSnap.data());
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">
        No pending profile updates at the moment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(req => (
        <Card key={req.id}>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{req.userName}</span>
                <Badge variant="outline" className="text-xs uppercase">{req.cohortId}</Badge>
                <Badge variant="secondary" className="text-xs">Update Request</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Requested on {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString() : 'Unknown date'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleView(req)}>
                <Eye className="w-4 h-4 mr-2" /> View Changes
              </Button>
              <Button variant="default" size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => handleApprove(req)}>
                <Check className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleReject(req.id)}>
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Request from {selectedRequest.userName}</DialogTitle>
              <DialogDescription>Review the requested changes side-by-side with current data.</DialogDescription>
            </DialogHeader>

            {!currentUserData ? (
              <div className="py-8 flex justify-center"><Skeleton className="w-full h-32" /></div>
            ) : (
              <div className="space-y-6 mt-4">
                {/* Photo Comparison */}
                {selectedRequest.data.photoURL && selectedRequest.data.photoURL !== currentUserData.photoURL && (
                  <div className="flex flex-col items-center bg-muted/30 p-4 rounded-lg border">
                    <p className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Profile Photo Change</p>
                    <div className="flex items-center justify-center gap-8 w-full">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold mb-2 text-muted-foreground">CURRENT</span>
                        <Avatar className="h-28 w-28 border-4 shadow-sm opacity-70 grayscale">
                          <AvatarImage src={currentUserData.photoURL} className="object-cover" />
                          <AvatarFallback>{currentUserData.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="text-muted-foreground font-bold">➔</div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold mb-2 text-primary">REQUESTED</span>
                        <Avatar className="h-32 w-32 border-4 border-primary shadow-xl">
                          <AvatarImage src={selectedRequest.data.photoURL} className="object-cover" />
                          <AvatarFallback>{selectedRequest.userName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details Comparison */}
                <div className="grid gap-3">
                  {Object.entries(selectedRequest.data).map(([key, value]) => {
                    if (key === 'photoURL') return null; // handled above

                    if (key === 'socialLinks') {
                      return Object.entries(value as any).map(([socKey, socValue]) => {
                        const oldVal = currentUserData?.socialLinks?.[socKey] || '-';
                        const newVal = (socValue as string) || '-';
                        const isChanged = oldVal !== newVal;
                        if (!isChanged) return null;

                        return (
                          <div key={socKey} className="grid grid-cols-2 bg-muted/20 rounded-md border overflow-hidden">
                            <div className="p-3">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current {socKey}</span>
                              <p className="text-sm mt-1 break-all line-through opacity-70">{oldVal}</p>
                            </div>
                            <div className="p-3 border-l border-primary/20 bg-primary/5">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Requested {socKey}</span>
                              <p className="text-sm mt-1 break-all font-medium text-foreground">{newVal}</p>
                            </div>
                          </div>
                        );
                      });
                    }

                    const oldVal = currentUserData?.[key] || '-';
                    const newVal = (value as string) || '-';
                    const isChanged = oldVal !== newVal;
                    if (!isChanged) return null;

                    return (
                      <div key={key} className="grid grid-cols-2 bg-muted/20 rounded-md border overflow-hidden">
                        <div className="p-3">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current {key}</span>
                          <p className="text-sm mt-1 break-words line-through opacity-70">{oldVal}</p>
                        </div>
                        <div className="p-3 border-l border-primary/20 bg-primary/5">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Requested {key}</span>
                          <p className="text-sm mt-1 break-words font-medium text-foreground">{newVal}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleReject(selectedRequest.id)}>Reject</Button>
              <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => handleApprove(selectedRequest)}>Approve & Apply</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
