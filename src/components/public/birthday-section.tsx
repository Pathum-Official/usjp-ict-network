"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Cohort } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";
import { BirthdayModal } from "@/components/shared/BirthdayModal";

export function BirthdaySection() {
  const [birthdays, setBirthdays] = useState<{ user: User, cohort: Cohort }[]>([]);
  const [cohorts, setCohorts] = useState<Record<string, Cohort>>({});
  const [loading, setLoading] = useState(true);
  const [selectedBirthday, setSelectedBirthday] = useState<{ user: User, cohort: Cohort } | null>(null);
  
  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const cohortSnap = await getDocs(collection(db, "cohorts"));
        const cohortMap: Record<string, Cohort> = {};
        cohortSnap.forEach(doc => {
          cohortMap[doc.id] = doc.data() as Cohort;
        });
        setCohorts(cohortMap);

        const q = query(collection(db, "users"), where("status", "==", "approved"));
        const userSnap = await getDocs(q);
        
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const currentMMDD = `${month}-${day}`;

        const todayBirthdays: { user: User, cohort: Cohort }[] = [];
        
        userSnap.forEach(doc => {
          const user = doc.data() as User;
          if (user.dob && user.dob.endsWith(currentMMDD)) {
            todayBirthdays.push({
              user,
              cohort: cohortMap[user.cohortId]
            });
          }
        });

        setBirthdays(todayBirthdays);
      } catch (error) {
        console.error("Error fetching birthdays:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdays();
  }, []);

  if (loading || birthdays.length === 0) return null;

  const groupedBirthdays: Record<string, { user: User, cohort: Cohort }[]> = {};
  birthdays.forEach(b => {
    const cohortName = (b.cohort?.name || "ICT Network").replace(/PMT/g, 'ICT');
    if (!groupedBirthdays[cohortName]) {
      groupedBirthdays[cohortName] = [];
    }
    groupedBirthdays[cohortName].push(b);
  });

  return (
    <section className="py-16 relative overflow-hidden" id="birthdays">
      <div className="absolute inset-0 bg-primary/5 -z-10" />
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4"
          >
            <PartyPopper className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Today's <span className="text-primary">Birthdays</span> 🎂</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join us in wishing our amazing ICT Network family members a very happy birthday!
          </p>
        </div>

        <div className="space-y-12">
          {Object.entries(groupedBirthdays).map(([cohortName, cohortBirthdays]) => (
            <div key={cohortName} className="space-y-6">
              <h3 className="text-2xl font-semibold border-b pb-2">{cohortName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cohortBirthdays.map((b, idx) => (
                  <motion.div
                    key={b.user.uid}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all border-primary/20">
                      <CardContent className="p-0">
                        <div className="p-6 flex items-center gap-4 bg-gradient-to-br from-background to-muted">
                          <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden flex-shrink-0 border-2 border-primary">
                            {b.user.photoURL ? (
                              <img src={b.user.photoURL} alt={b.user.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary text-2xl font-bold">
                                {b.user.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{b.user.name}</h4>
                            <p className="text-sm text-muted-foreground">It's their birthday today!</p>
                            <Button 
                              size="sm" 
                              className="mt-3 bg-gradient-to-r from-primary to-secondary text-white border-0"
                              onClick={() => setSelectedBirthday(b)}
                            >
                              <Gift className="w-4 h-4 mr-2" />
                              Wish Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBirthday && (
        <BirthdayModal 
          isOpen={!!selectedBirthday} 
          onClose={() => setSelectedBirthday(null)} 
          data={selectedBirthday} 
        />
      )}
    </section>
  );
}
