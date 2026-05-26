import React, { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface FacebookImageGridProps {
  images: string[];
  disableFullscreen?: boolean;
}

export function FacebookImageGrid({ images, disableFullscreen = false }: FacebookImageGridProps) {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const count = images.length;
  
  // Custom layout classes based on count
  const getGridClass = () => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2 gap-1 h-64";
    if (count === 3) return "grid-cols-2 gap-1 h-80";
    return "grid-cols-2 gap-1 h-80"; // 4 or more
  };

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    if (disableFullscreen) return; // let event bubble up
    e.stopPropagation();
    setFullscreenIndex(index);
  };

  return (
    <>
      <div className={`grid rounded-xl overflow-hidden mt-4 ${getGridClass()}`}>
        {count === 1 && (
          <div 
            className="w-full h-full max-h-[500px] relative cursor-pointer"
            onClick={(e) => handleImageClick(e, 0)}
          >
            <img 
              src={images[0]} 
              alt="Post image" 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {count === 2 && images.slice(0, 2).map((img, i) => (
          <div 
            key={i} 
            className="w-full h-full relative cursor-pointer"
            onClick={(e) => handleImageClick(e, i)}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </div>
        ))}

        {count === 3 && (
          <>
            <div 
              className="col-span-2 h-48 relative cursor-pointer"
              onClick={(e) => handleImageClick(e, 0)}
            >
              <img src={images[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-2 gap-1 col-span-2 h-32">
              <div 
                className="w-full h-full relative cursor-pointer"
                onClick={(e) => handleImageClick(e, 1)}
              >
                <img src={images[1]} alt="" className="w-full h-full object-cover" />
              </div>
              <div 
                className="w-full h-full relative cursor-pointer"
                onClick={(e) => handleImageClick(e, 2)}
              >
                <img src={images[2]} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </>
        )}

        {count >= 4 && (
          <>
            {images.slice(0, 3).map((img, i) => (
              <div 
                key={i} 
                className="w-full h-40 relative cursor-pointer"
                onClick={(e) => handleImageClick(e, i)}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <div 
              className="w-full h-40 relative cursor-pointer"
              onClick={(e) => handleImageClick(e, 3)}
            >
              <img src={images[3]} alt="" className="w-full h-full object-cover" />
              {count > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-3xl font-medium tracking-wide">
                    +{count - 4}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Image Viewer Modal */}
      {fullscreenIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setFullscreenIndex(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[101]"
            onClick={(e) => { e.stopPropagation(); setFullscreenIndex(null); }}
          >
            <X size={24} />
          </button>

          {/* Left Arrow */}
          {images.length > 1 && (
            <button
              className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[101]"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenIndex(prev => (prev === 0 ? images.length - 1 : (prev as number) - 1));
              }}
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <img 
            src={images[fullscreenIndex]} 
            alt="Fullscreen" 
            className="max-w-[85vw] max-h-[90vh] object-contain rounded-lg relative z-[100]"
            onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing
          />

          {/* Right Arrow */}
          {images.length > 1 && (
            <button
              className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[101]"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenIndex(prev => (prev === images.length - 1 ? 0 : (prev as number) + 1));
              }}
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
