"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BarChart3, Edit, Trash2, Download, ExternalLink, Paperclip, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { ResourceViewerModal } from "@/components/shared/ResourceViewerModal";
import { LectureVideoModal } from "@/components/shared/LectureVideoModal";
import { ZoomLobbyCard } from "@/components/shared/ZoomLobbyCard";

// Regex to parse URLs and wrap them in anchor tags
const linkify = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{part}</a>;
    }
    return part;
  });
};

export function AnnouncementCard({ 
  announcement, 
  onDelete 
}: { 
  announcement: any;
  onDelete?: (id: string) => void;
}) {
  const { user } = useAuth();
  const [pollVotes, setPollVotes] = useState<any>(announcement.poll?.votes || {});
  const [voting, setVoting] = useState(false);

  const canEdit = user && ['rep', 'academic_rep', 'super_admin'].includes(user.role);

  const [votersMap, setVotersMap] = useState<Record<string, any>>({});
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{ url: string, title: string, type: string } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string, title: string, moduleCode?: string, chapters?: string } | null>(null);
  const [selectedZoom, setSelectedZoom] = useState<any | null>(null);

  const handleVote = async (optionIndex: number) => {
    if (!user || !announcement.poll) return;
    
    setVoting(true);
    try {
      const newVotes = { ...pollVotes };
      
      if (announcement.poll.type === 'multiple') {
        const userVotes = newVotes[user.uid] || [];
        if (userVotes.includes(optionIndex)) {
          newVotes[user.uid] = userVotes.filter((i: number) => i !== optionIndex);
        } else {
          newVotes[user.uid] = [...userVotes, optionIndex];
        }
      } else {
        newVotes[user.uid] = [optionIndex];
      }

      await updateDoc(doc(db, "announcements", announcement.id), {
        "poll.votes": newVotes
      });
      
      setPollVotes(newVotes);
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setVoting(false);
    }
  };

  const calculatePollStats = () => {
    if (!announcement.poll) return null;
    const stats: Record<number, number> = {};
    let totalVotes = 0;
    
    // Initialize stats
    announcement.poll.options.forEach((_: any, idx: number) => {
      stats[idx] = 0;
    });

    Object.values(pollVotes).forEach((votes: any) => {
      if (Array.isArray(votes)) {
        votes.forEach((v: number) => {
          stats[v] = (stats[v] || 0) + 1;
        });
        if (votes.length > 0) totalVotes++;
      }
    });

    return { stats, totalVotes };
  };

  const pollData = calculatePollStats();
  const userCurrentVotes = user ? (pollVotes[user.uid] || []) : [];

  const fetchUsersMap = async () => {
    if (Object.keys(votersMap).length > 0) return votersMap;
    const usersSnap = await getDocs(collection(db, "users"));
    const map: Record<string, any> = {};
    usersSnap.forEach(d => { map[d.id] = d.data(); });
    setVotersMap(map);
    return map;
  };

  const handleExportCSV = async () => {
    if (!announcement.poll) return;
    try {
      const usersMapData = await fetchUsersMap();

      let csvContent = "Name,Reg No,WhatsApp,Combination,Role,Voted Options\n";
      
      Object.entries(pollVotes).forEach(([uid, votes]: [string, any]) => {
        const u = usersMapData[uid];
        if (!u) return;
        
        const votedOptionsText = Array.isArray(votes) 
          ? votes.map((v: number) => announcement.poll.options[v]).join("; ")
          : "";
          
        const name = `"${u.name || 'Unknown'}"`;
        const regNo = `"${u.regNo || '-'}"`;
        const whatsapp = `"${u.whatsapp || '-'}"`;
        const combination = `"${u.combination || '-'}"`;
        const role = `"${u.role || 'student'}"`;
        const optionsStr = `"${votedOptionsText}"`;
        
        csvContent += `${name},${regNo},${whatsapp},${combination},${role},${optionsStr}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `poll_results_${announcement.id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export CSV", err);
    }
  };

  return (
    <Card className="hover:border-primary/20 transition-all flex flex-col h-full relative overflow-hidden">
      {announcement.category === 'Urgent' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 z-10" />
      )}
      
      {announcement.bannerUrl && (
        <div className="w-full h-48 relative overflow-hidden bg-muted">
          <img src={announcement.bannerUrl} alt="Announcement Banner" className="w-full h-full object-cover" />
        </div>
      )}

      <CardHeader className="py-4 pb-2">
        <div className="flex justify-between items-start mb-2">
          <Badge variant={announcement.category === 'Urgent' ? 'destructive' : announcement.category === 'Academic' ? 'default' : 'secondary'}>
            {announcement.category || 'General'}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {announcement.createdAt ? new Date(announcement.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
            </span>
            
            {canEdit && onDelete && (
              <div className="flex gap-0 ml-2">
                <Link href={`/admin?tab=announcements&editId=${announcement.id}`} className={buttonVariants({ variant: "ghost", size: "icon", className: "h-6 w-6" })}>
                  <Edit className="h-3 w-3" />
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3" /></Button>} />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone. This will permanently delete the announcement.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(announcement.id)} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
        <h3 className="font-semibold text-lg leading-tight">{announcement.title}</h3>
      </CardHeader>
      <CardContent className="pt-2 flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">
          {linkify(announcement.content || '')}
        </p>

        {/* Poll UI */}
        {announcement.poll && pollData && (
          <div className="mt-auto pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
              <BarChart3 className="w-4 h-4 text-primary" />
              {announcement.poll.question}
            </div>
            
            <div className="space-y-2">
              {announcement.poll.options.map((opt: string, idx: number) => {
                const votesCount = pollData.stats[idx] || 0;
                const percentage = pollData.totalVotes > 0 ? Math.round((votesCount / pollData.totalVotes) * 100) : 0;
                const isSelected = userCurrentVotes.includes(idx);
                
                return (
                  <button 
                    key={idx}
                    disabled={voting}
                    onClick={() => handleVote(idx)}
                    className="w-full relative overflow-hidden rounded-md border p-2 text-left text-sm transition-colors hover:border-primary focus:outline-none group"
                  >
                    <div 
                      className={`absolute top-0 left-0 bottom-0 transition-all duration-500 opacity-20 ${isSelected ? 'bg-primary' : 'bg-muted-foreground'}`}
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative z-10 flex justify-between items-center px-1">
                      <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                        {opt}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">
                        {percentage}% ({votesCount})
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground font-medium">
                {pollData.totalVotes} {pollData.totalVotes === 1 ? 'vote' : 'votes'} • {announcement.poll.type === 'multiple' ? 'Multiple choice' : 'Single choice'}
              </span>
              {canEdit && (
                <div className="flex items-center gap-2">
                  <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
                    setIsViewDialogOpen(open);
                    if (open) {
                      setLoadingVoters(true);
                      fetchUsersMap().finally(() => setLoadingVoters(false));
                    }
                  }}>
                    <DialogTrigger render={
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Eye className="w-3 h-3 mr-1" /> View Results
                      </Button>
                    } />
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Poll Results: {announcement.poll.question}</DialogTitle>
                        <DialogDescription>See who voted for which option.</DialogDescription>
                      </DialogHeader>
                      
                      {loadingVoters ? (
                        <div className="flex flex-col items-center justify-center p-8 gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Loading voters...</p>
                        </div>
                      ) : (
                        <div className="space-y-6 mt-4">
                          {announcement.poll.options.map((opt: string, idx: number) => {
                            // Find users who voted for this option
                            const votersForOption = Object.entries(pollVotes)
                              .filter(([uid, votes]: [string, any]) => Array.isArray(votes) && votes.includes(idx))
                              .map(([uid]) => votersMap[uid])
                              .filter(Boolean); // remove null/undefined if user not found
                            
                            return (
                              <div key={idx} className="space-y-2">
                                <h3 className="font-semibold border-b pb-1 flex justify-between">
                                  <span>{opt}</span>
                                  <span className="text-primary">{votersForOption.length} votes</span>
                                </h3>
                                {votersForOption.length === 0 ? (
                                  <p className="text-sm text-muted-foreground italic">No votes yet.</p>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    {votersForOption.map(v => (
                                      <div key={v.uid} className="flex flex-col p-2 bg-muted/30 rounded border text-sm">
                                        <span className="font-medium">{v.name || 'Unknown'}</span>
                                        <span className="text-xs text-muted-foreground">{v.regNo || '-'} • {v.combination || '-'}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-7 text-xs">
                    <Download className="w-3 h-3 mr-1" /> Export CSV
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attached Resources */}
        {announcement.attachedResources && announcement.attachedResources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2">
              <Paperclip className="w-3 h-3" /> ATTACHED RESOURCES
            </h4>
            <div className="flex flex-col gap-2">
              {announcement.attachedResources.map((res: any, idx: number) => {
                const isViewerSupported = ['pdf_document', 'past_paper', 'document', 'image_resource', 'gallery_image'].includes(res.type);
                const isZoom = res.type === 'zoom_link' || res.url?.includes('zoom.us');
                const isVideo = !isZoom && (res.type === 'lecture_video' || res.type === 'custom_embed' || res.url?.includes('youtu'));
                
                return (
                  <button 
                    key={idx} 
                    onClick={() => {
                      if (isViewerSupported) {
                        setSelectedResource({ url: res.url, title: res.title, type: res.type || 'link' });
                      } else if (isVideo) {
                        setSelectedVideo({ url: res.url, title: res.title, moduleCode: res.moduleCode || res.module, chapters: res.chapters });
                      } else if (isZoom) {
                        setSelectedZoom({ 
                          url: res.url, 
                          title: res.title, 
                          module: res.moduleCode || res.module || 'Session',
                          startTime: res.startTime,
                          endTime: res.endTime
                        });
                      } else {
                        window.open(res.url, '_blank');
                      }
                    }}
                    className="flex items-center justify-between p-2 rounded-md border bg-muted/20 hover:bg-muted/50 transition-colors group text-left"
                  >
                    <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{res.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{res.type?.replace('_', ' ')}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      {selectedResource && (
        <ResourceViewerModal 
          url={selectedResource.url}
          type={selectedResource.type}
          title={selectedResource.title}
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}

      {selectedVideo && (
        <LectureVideoModal 
          isOpen={!!selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
          url={selectedVideo.url} 
          title={selectedVideo.title}
          moduleCode={selectedVideo.moduleCode}
          chapters={selectedVideo.chapters}
        />
      )}

      {selectedZoom && (
        <Dialog open={!!selectedZoom} onOpenChange={(open) => !open && setSelectedZoom(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
             <DialogTitle className="sr-only">Zoom Session</DialogTitle>
             <DialogDescription className="sr-only">Join Zoom Session details</DialogDescription>
             <ZoomLobbyCard 
               title={selectedZoom.title}
               module={selectedZoom.module}
               url={selectedZoom.url}
               startTime={selectedZoom.startTime}
               endTime={selectedZoom.endTime}
             />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
