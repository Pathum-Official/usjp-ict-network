"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function CommitteeSection() {
  const [committee, setCommittee] = useState<any[]>([]);

  useEffect(() => {
    const fetchCommittee = async () => {
      try {
        const q = query(collection(db, "users"), where("isFeaturedOnHome", "==", true));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        if (list.length > 0) {
          setCommittee(list);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCommittee();
  }, []);

  if (committee.length === 0) return null;

  return (
    <section id="committee" className="py-24">
      <div className="container mx-auto px-4 md:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Executive <span className="text-primary">Committee</span></h2>
        <p className="text-muted-foreground text-lg mb-16 max-w-2xl mx-auto">The dedicated student leaders steering the ICT Network towards greatness this year.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {committee.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col items-center group"
            >
              <div className="relative mb-4 rounded-full p-1 bg-gradient-to-br from-primary to-secondary transition-transform group-hover:scale-105">
                <Avatar className="h-24 w-24 border-4 border-background">
                  <AvatarImage src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} alt={member.name} />
                  <AvatarFallback>{member.name?.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <h3 className="text-lg font-semibold">{member.name}</h3>
              <p className="text-primary font-medium text-sm capitalize">
                {member.role === 'super_admin' ? 'Platform Admin' : 'Batch Representative'}
              </p>
              {member.cohortId && (
                <p className="text-muted-foreground text-xs uppercase mt-1">{member.cohortId}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
