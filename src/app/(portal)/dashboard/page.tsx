"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, FileText, Video, Receipt, ExternalLink, ImageIcon, Code, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoThumbnailCard } from "@/components/shared/VideoThumbnailCard";
import { LectureVideoModal } from "@/components/shared/LectureVideoModal";
import { ResourceViewerModal } from "@/components/shared/ResourceViewerModal";
import { ZoomLobbyCard } from "@/components/shared/ZoomLobbyCard";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [finances, setFinances] = useState({ balance: 0, income: 0, expense: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [selectedZoom, setSelectedZoom] = useState<any | null>(null);
  const [selectedResource, setSelectedResource] = useState<{ url: string; title: string; type: string } | null>(null);
  const [birthdays, setBirthdays] = useState<string[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.cohortId) return;
      try {
        setLoading(true);

        const [annRes, resRes, lecRes, txRes, usersRes] = await Promise.all([
          getDocs(query(collection(db, "announcements"), where("cohortId", "==", user.cohortId))),
          getDocs(query(collection(db, "resources"), where("cohortId", "==", user.cohortId))),
          getDocs(query(collection(db, "lectures"), where("cohortId", "==", user.cohortId))),
          getDocs(query(collection(db, "transactions"), where("cohortId", "==", user.cohortId))),
          getDocs(query(collection(db, "users"), where("cohortId", "==", user.cohortId), where("status", "==", "approved")))
        ]);

        // Fetch announcements
        const annList: any[] = [];
        annRes.forEach(d => annList.push({ id: d.id, ...d.data() }));
        annList.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return timeB - timeA;
        });
        setAnnouncements(annList.slice(0, 3));

        // Fetch resources
        const resList: any[] = [];
        resRes.forEach(d => resList.push({ id: d.id, ...d.data() }));
        resList.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return timeB - timeA;
        });
        setResources(resList.slice(0, 3));

        // Fetch lectures
        const lecList: any[] = [];
        lecRes.forEach(d => lecList.push({ id: d.id, ...d.data() }));
        lecList.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return timeB - timeA;
        });
        setLectures(lecList.slice(0, 3));

        // Fetch transactions
        let income = 0;
        let expense = 0;
        const txList: any[] = [];
        txRes.forEach(d => {
          const data = d.data();
          if (data.type === 'income') income += Number(data.amount || 0);
          if (data.type === 'expense') expense += Number(data.amount || 0);
          txList.push({ id: d.id, ...data });
        });
        txList.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return timeB - timeA;
        });
        setFinances({ balance: income - expense, income, expense });
        setTransactions(txList.slice(0, 3));

        // Birthday logic
        const today = new Date();
        const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const bdayNames: string[] = [];
        usersRes.forEach(d => {
          const u = d.data();
          if (u.dob && u.dob.endsWith(todayMonthDay)) {
            bdayNames.push(u.name);
          }
        });
        setBirthdays(bdayNames);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [user?.cohortId, authLoading]);

  if (authLoading) {
    return <div className="flex items-center justify-center h-[80vh]"><Skeleton className="h-full w-full opacity-50" /></div>;
  }

  const widgets = [
    {
      title: "Recent Announcements",
      icon: <Megaphone className="h-5 w-5 text-primary" />,
      link: "/announcements",
      content: loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">No recent announcements.</div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann, i) => (
            <Link key={ann.id} href="/announcements" className="block">
              <div className="border-l-2 border-primary pl-4 py-2 hover:bg-muted/50 transition-colors rounded-r-md">
                <h4 className="text-sm font-medium line-clamp-1">{ann.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(ann.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ),
    },
    {
      title: "Latest Resources",
      icon: <FileText className="h-5 w-5 text-secondary" />,
      link: "/resources",
      content: loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">No resources available.</div>
      ) : (
        <div className="space-y-3">
          {resources.map((res, i) => (
            <div 
              key={res.id} 
              onClick={() => setSelectedResource({
                url: res.driveViewUrl || res.url || "",
                title: res.title,
                type: res.type || "pdf_document"
              })}
              className="block cursor-pointer"
            >
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2 rounded shrink-0 font-bold text-[10px] flex items-center justify-center
                    ${res.type === 'image_resource' ? 'bg-blue-500/10 text-blue-500' : 
                      res.type === 'custom_embed' ? 'bg-orange-500/10 text-orange-500' : 
                      'bg-red-500/10 text-red-500'}`}
                  >
                    {res.type === 'image_resource' ? <ImageIcon className="h-4 w-4" /> : 
                     res.type === 'custom_embed' ? <Code className="h-4 w-4" /> : 
                     'PDF'}
                  </div>
                  <span className="text-sm font-medium truncate">{res.title}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><ExternalLink className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Recent Kuppi Sessions",
      icon: <Video className="h-5 w-5 text-primary" />,
      link: "/lectures",
      content: loading ? (
        <Skeleton className="w-full aspect-video rounded-md" />
      ) : lectures.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">No recent sessions.</div>
      ) : (
        <div className="space-y-3">
          {lectures.map((lec, i) => (
            <div 
              key={lec.id} 
              onClick={() => {
                if (lec.type === 'zoom_meeting' || lec.startTime) {
                  setSelectedZoom(lec);
                } else {
                  setSelectedVideo(lec);
                }
              }}
              className="block cursor-pointer"
            >
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
                    <Video className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{lec.title}</span>
                    <span className="text-xs text-muted-foreground truncate">{lec.moduleCode || lec.module || (lec.type === 'zoom_meeting' ? 'Zoom Live' : 'Recorded Video')}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Batch Fund Status",
      icon: <Receipt className="h-5 w-5 text-secondary" />,
      link: "/finances",
      content: loading ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ) : (
        <div className="flex flex-col h-full space-y-4">
          <div className="text-center pt-2">
            <p className={`text-4xl font-bold ${finances.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              Rs. {finances.balance.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Current Balance</p>
          </div>
          
          {transactions.length > 0 && (
            <div className="space-y-2 mt-auto">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Transactions</div>
              {transactions.map(tx => (
                <Link key={tx.id} href="/finances" className="block">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/40 hover:bg-muted/80 transition-colors text-sm">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" /> : <ArrowDownRight className="h-4 w-4 text-destructive shrink-0" />}
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate">{tx.description}</span>
                        <div className="flex gap-2">
                          <span className="text-[10px] text-muted-foreground">{tx.fundName || 'General'}</span>
                          {tx.date && <span className="text-[10px] text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                    <span className={`font-semibold shrink-0 pl-2 ${tx.type === 'income' ? 'text-emerald-500' : 'text-destructive'}`}>
                      {tx.type === 'income' ? '+' : '-'} Rs. {tx.amount}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</h1>
        <p className="text-muted-foreground mt-2">Here is an overview of what's happening in {user?.cohortId?.toUpperCase() || 'your cohort'}.</p>
      </div>

      {birthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 border border-pink-500/30 rounded-xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="text-3xl">🎉</span> Happy Birthday! <span className="text-3xl">🎂</span>
            </h2>
            <p className="mt-2 text-muted-foreground font-medium">
              Wishing a fantastic birthday to <span className="text-primary font-bold">{birthdays.join(" and ")}</span> from the ICT Network!
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-64 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ec4899 20%, transparent 20%), radial-gradient(circle, #ec4899 20%, transparent 20%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {widgets.map((widget, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  {widget.icon}
                  <CardTitle className="text-lg">{widget.title}</CardTitle>
                </div>
                <Link href={widget.link}>
                  <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                </Link>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                {widget.content}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {selectedVideo && (
        <LectureVideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          url={selectedVideo.url}
          title={selectedVideo.title}
          moduleCode={selectedVideo.moduleCode || selectedVideo.module}
          chapters={selectedVideo.chapters}
        />
      )}

      {selectedResource && (
        <ResourceViewerModal
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
          url={selectedResource.url}
          title={selectedResource.title}
          type={selectedResource.type}
        />
      )}

      {selectedZoom && (
        <Dialog open={!!selectedZoom} onOpenChange={(open) => !open && setSelectedZoom(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
            <DialogTitle className="sr-only">Zoom Session</DialogTitle>
            <DialogDescription className="sr-only">Join Zoom Session details</DialogDescription>
            <ZoomLobbyCard
              url={selectedZoom.url}
              title={selectedZoom.title}
              module={selectedZoom.moduleCode || selectedZoom.module}
              startTime={selectedZoom.startTime}
              endTime={selectedZoom.endTime}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
