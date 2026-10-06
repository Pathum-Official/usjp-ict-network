"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EventsSection() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, "events"), orderBy("createdAt", "desc"), limit(6));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        
        // Add pseudo-type based on date
        const now = new Date().getTime();
        const formattedList = list.map(evt => {
          let type = "Upcoming";
          try {
            const evtDate = new Date(evt.date).getTime();
            if (evtDate < now) type = "Past";
          } catch(e) {}
          return { ...evt, type };
        });

        setEvents(formattedList);
      } catch(error) {
        console.error("Failed to fetch events", error);
      }
    };
    fetchEvents();
  }, []);

  if (events.length === 0) return null;

  return (
    <section id="events" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest <span className="text-primary">Events</span></h2>
            <p className="text-muted-foreground text-lg">Join us in our academic and social gatherings.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {events.map((evt, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors h-full">
                <CardContent className="p-0">
                  <div 
                    className="h-32 p-6 flex items-start justify-between relative"
                    style={evt.imageUrl ? { backgroundImage: `url(${evt.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {evt.imageUrl && <div className="absolute inset-0 bg-black/50" />}
                    
                    <div className="relative z-10 flex w-full justify-between items-start">
                      <Badge variant={evt.type === 'Upcoming' ? 'default' : 'secondary'}>{evt.type}</Badge>
                      {!evt.imageUrl && <Calendar className="text-foreground/50 h-8 w-8" />}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-4 line-clamp-1">{evt.title}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary shrink-0" /> <span className="line-clamp-1">{evt.date}</span>
                      </div>
                      {evt.time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary shrink-0" /> <span className="line-clamp-1">{evt.time}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0" /> <span className="line-clamp-1">{evt.location}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
