"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { MapPin, CalendarDays, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Edit } from "lucide-react";

interface CampusEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  imageUrl?: string;
  link?: string;
  createdAt?: any;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const list: CampusEvent[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CampusEvent);
        });
        setEvents(list);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-[80vh] py-16 px-4 md:px-8 relative overflow-hidden bg-background">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-500/20 blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20 px-3 py-1">
            <Sparkles className="w-4 h-4 mr-2" /> Campus Life
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Upcoming <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Events</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover what's happening in the ICT Network. From academic workshops to batch trips, stay connected and never miss out.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl h-[400px] bg-muted animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-card/50 backdrop-blur-xl border rounded-3xl">
            <CalendarDays className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-2xl font-bold mb-2">No Events Scheduled</h3>
            <p className="text-muted-foreground">Check back later for exciting upcoming events!</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {events.map((evt) => (
              <motion.div 
                key={evt.id} 
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="group relative rounded-3xl overflow-hidden border bg-card/40 backdrop-blur-md shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Image Section */}
                <div className="relative h-56 w-full overflow-hidden bg-muted">
                  {evt.imageUrl ? (
                    <img 
                      src={evt.imageUrl} 
                      alt={evt.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-indigo-500/20">
                      <CalendarDays className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  {/* Glassmorphism Date Badge Overlay */}
                  <div className="absolute top-4 left-4 bg-background/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{evt.date}</span>
                  </div>
                  {user && ['rep', 'media_rep', 'super_admin'].includes(user.role) && (
                    <Link 
                      href={`/admin?tab=public&editId=${evt.id}`} 
                      className="absolute top-4 right-4 bg-background/90 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-3 line-clamp-2 leading-tight">{evt.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{evt.location}</span>
                  </div>
                  <p className="text-muted-foreground line-clamp-3 text-sm mb-6">
                    {evt.description}
                  </p>
                  
                  {evt.link ? (
                    <a 
                      href={evt.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: "outline" }) + " w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"}
                    >
                      View Details <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      View Details
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
