"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function GallerySection() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          // Filter out internal-only images
          if (data.visibility === 'public' || data.visibility === 'both' || !data.visibility) {
            list.push({ id: doc.id, ...data });
          }
        });
        setImages(list.slice(0, 6)); // Show latest 6 on home page
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  if (loading || images.length === 0) return null;

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our <span className="text-secondary">Gallery</span></h2>
          <p className="text-muted-foreground text-lg">Glimpses into the life and events of the ICT Network.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative group rounded-xl overflow-hidden border bg-background aspect-[4/3]"
            >
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                {item.category && (
                  <Badge variant="secondary" className="w-fit mb-2 bg-white/20 text-white border-none backdrop-blur-md">
                    {item.category}
                  </Badge>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                {item.caption && <p className="text-sm text-white/80 line-clamp-2">{item.caption}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
