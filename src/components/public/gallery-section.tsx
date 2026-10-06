"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Maximize2 } from "lucide-react";
import { PhotoLightbox } from "@/components/shared/PhotoLightbox";

export function GallerySection() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lightbox state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          const imageUrl = data.imageUrl || (data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls[0] : null);
          if (imageUrl) {
            list.push({ id: doc.id, ...data, imageUrl });
          }
        });
        setImages(list.slice(0, 12)); // Show up to 12 images on home page
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  if (loading || images.length === 0) return null;

  return (
    <section id="gallery" className="py-24 bg-muted/30">
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
              className="relative group rounded-xl overflow-hidden border bg-background aspect-[4/3] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
              onClick={() => openLightbox(i)}
            >
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full text-white transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 delay-100">
                  <Maximize2 className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                {item.category && (
                  <Badge variant="secondary" className="w-fit mb-2 bg-primary text-primary-foreground border-none shadow-md">
                    {item.category}
                  </Badge>
                )}
                <h3 className="text-xl font-bold text-white mb-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h3>
                {item.caption && <p className="text-sm text-white/80 line-clamp-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">{item.caption}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fullscreen Lightbox Slideshow */}
      {selectedIndex !== null && (
        <PhotoLightbox 
          images={images}
          initialIndex={selectedIndex}
          onClose={closeLightbox}
        />
      )}
    </section>
  );
}
