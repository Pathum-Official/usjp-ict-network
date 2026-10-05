"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Image as ImageIcon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Edit } from "lucide-react";
import { PhotoLightbox } from "@/components/shared/PhotoLightbox";

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  imageUrls?: string[];
  caption?: string;
  createdAt?: any;
}

export default function GalleryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const list: GalleryItem[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as GalleryItem);
        });
        setItems(list);
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-[80vh] py-16 px-4 md:px-8 relative overflow-hidden bg-background">
      {/* Ambient Glow Backgrounds */}
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20 px-3 py-1">
            <Sparkles className="w-4 h-4 mr-2" /> Memories
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Photo <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Gallery</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Relive the best moments of the ICT Network. A visual journey through our academic and extracurricular milestones.
          </p>
        </motion.div>

        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`rounded-2xl bg-muted animate-pulse ${i % 2 === 0 ? 'h-64' : 'h-96'}`} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-card/50 backdrop-blur-xl border rounded-3xl">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-2xl font-bold mb-2">Gallery is Empty</h3>
            <p className="text-muted-foreground">Photos will appear here once they are uploaded by the media team.</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
          >
            {items.map((item, index) => {
              const displayUrl = item.imageUrls?.[0] || item.imageUrl;
              const count = item.imageUrls ? item.imageUrls.length : 1;
              return (
              <motion.div 
                key={item.id} 
                variants={itemVariants}
                className="group relative rounded-2xl overflow-hidden break-inside-avoid shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer"
                onClick={() => setSelectedIndex(index)}
              >
                <img  
                  src={displayUrl} 
                  alt={item.title} 
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay gradient & Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="flex gap-2">
                    <Badge className="w-fit mb-2 bg-primary/80 backdrop-blur-sm border-none">{item.category}</Badge>
                    {count > 1 && <Badge className="w-fit mb-2 bg-primary/80 backdrop-blur-sm border-none">{count} Photos</Badge>}
                  </div>
                  <h3 className="text-white font-bold text-xl leading-tight mb-1">{item.title}</h3>
                  {item.caption && (
                    <p className="text-white/80 text-sm line-clamp-2">{item.caption}</p>
                  )}
                  {user && ['rep', 'media_rep', 'super_admin'].includes(user.role) && (
                    <Link 
                      href={`/admin?tab=public&subtab=gallery&editId=${item.id}`} 
                      className="absolute top-4 right-4 bg-background/90 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4 text-foreground" />
                    </Link>
                  )}
                </div>
              </motion.div>
            )})}
          </motion.div>
        )}
      </div>

      {selectedIndex !== null && items[selectedIndex] && (
        <PhotoLightbox
          images={(items[selectedIndex].imageUrls || (items[selectedIndex].imageUrl ? [items[selectedIndex].imageUrl] : [])).map((url: string) => ({
            id: url,
            imageUrl: url,
            title: items[selectedIndex].title,
            category: items[selectedIndex].category,
            caption: items[selectedIndex].caption,
          }))}
          initialIndex={0}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}
