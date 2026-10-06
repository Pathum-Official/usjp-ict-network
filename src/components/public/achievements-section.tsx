"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Medal, Users, GraduationCap, Briefcase } from "lucide-react";

export function AchievementsSection() {
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const q = query(collection(db, "achievements"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        if (list.length > 0) {
          setAchievements(list);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAchievements();
  }, []);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Users': return <Users className="h-8 w-8 text-primary" />;
      case 'GraduationCap': return <GraduationCap className="h-8 w-8 text-secondary" />;
      case 'Star': return <Star className="h-8 w-8 text-primary" />;
      case 'Briefcase': return <Briefcase className="h-8 w-8 text-secondary" />;
      default: return <Trophy className="h-8 w-8 text-primary" />;
    }
  };

  if (achievements.length === 0) return null;

  return (
    <section id="achievements" className="py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Milestones & <span className="text-secondary">Achievements</span></h2>
          <p className="text-muted-foreground text-lg">Celebrating the academic and extracurricular successes of our brilliant scholars.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {achievements.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <Card className="h-full border-t-4 border-t-primary bg-card/50 hover:bg-card transition-colors flex flex-col justify-center items-center py-6">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto bg-muted p-4 rounded-full mb-4 inline-flex">
                    {getIcon(item.iconName)}
                  </div>
                  <CardTitle className="text-4xl font-extrabold text-foreground">{item.value}</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground font-medium">
                  {item.title}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
