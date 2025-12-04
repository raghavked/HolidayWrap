import React, { useEffect, useRef, useState } from 'react';
import { AppSettings, SubjectImage } from '../types';
import { removeWhiteBackground } from '../services/canvasService';

interface CanvasPreviewProps {
  subjects: SubjectImage[];
  patternUrl: string | null;
  settings: AppSettings;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({ subjects, patternUrl, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2); // Preview scale

  // Helper to calculate pixel dimensions from inches (assuming 300 DPI for export, but 72 for preview)
  // We'll work with a "virtual" high res canvas and scale it down via CSS for preview.
  const getDimensions = () => {
    const [w, h] = settings.paperSize.split('x').map(Number);
    // Use a lower DPI for screen preview performance, high DPI for export would be handled separately
    const dpi = 72; 
    return { width: w * dpi, height: h * dpi };
  };

  useEffect(() => {
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = getDimensions();
      canvas.width = width;
      canvas.height = height;

      // 1. Draw Pattern Background
      if (patternUrl) {
        const patternImg = new Image();
        patternImg.crossOrigin = "Anonymous";
        patternImg.src = patternUrl;
        await new Promise((resolve) => { patternImg.onload = resolve; });
        
        const pattern = ctx.createPattern(patternImg, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, width, height);
        }
      } else {
        ctx.fillStyle = '#FBF8F3'; // Cream/White fallback
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Draw Subjects
      const activeSubjects = subjects.filter(s => s.status === 'completed' && s.processedUrl);
      
      if (activeSubjects.length > 0) {
        // Load all subject images first
        const loadedImages = await Promise.all(
            activeSubjects.map(async (subj) => {
            if (!subj.processedUrl) return null;
            // Attempt to remove background client-side if it's white
            return await removeWhiteBackground(subj.processedUrl);
          })
        );

        const validImages = loadedImages.filter(img => img !== null) as HTMLImageElement[];
        
        if (validImages.length === 0) return;

        // Layout Logic
        const subjectSize = 150; // Base size in pixels
        const gap = settings.density === 'dense' ? 180 : settings.density === 'medium' ? 250 : 350;
        
        if (settings.layout === 'scatter') {
           // Random Scatter with some grid logic to avoid total overlap
           const cols = Math.ceil(width / gap);
           const rows = Math.ceil(height / gap);
           
           for (let r = 0; r < rows; r++) {
             for (let c = 0; c < cols; c++) {
               const imgIndex = (r * cols + c) % validImages.length;
               const img = validImages[imgIndex];
               
               // Random offset
               const offsetX = (Math.random() - 0.5) * (gap * 0.4);
               const offsetY = (Math.random() - 0.5) * (gap * 0.4);
               const rotation = (Math.random() - 0.5) * 0.5; // Radians

               const x = c * gap + gap/2 + offsetX;
               const y = r * gap + gap/2 + offsetY;

               ctx.save();
               ctx.translate(x, y);
               ctx.rotate(rotation);
               ctx.shadowColor = "rgba(0,0,0,0.2)";
               ctx.shadowBlur = 10;
               ctx.shadowOffsetX = 5;
               ctx.shadowOffsetY = 5;
               
               // Maintain aspect ratio
               const scaleFactor = subjectSize / Math.max(img.width, img.height);
               ctx.drawImage(img, - (img.width * scaleFactor)/2, - (img.height * scaleFactor)/2, img.width * scaleFactor, img.height * scaleFactor);
               
               ctx.restore();
             }
           }
        } else if (settings.layout === 'grid') {
          const cols = Math.ceil(width / gap);
          const rows = Math.ceil(height / gap);
          
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const imgIndex = (r * cols + c) % validImages.length;
              const img = validImages[imgIndex];
              
              const x = c * gap + gap/2;
              const y = r * gap + gap/2;

              ctx.save();
              ctx.translate(x, y);
              ctx.shadowColor = "rgba(0,0,0,0.15)";
              ctx.shadowBlur = 5;
              ctx.shadowOffsetX = 3;
              ctx.shadowOffsetY = 3;
              
              const scaleFactor = subjectSize / Math.max(img.width, img.height);
              ctx.drawImage(img, - (img.width * scaleFactor)/2, - (img.height * scaleFactor)/2, img.width * scaleFactor, img.height * scaleFactor);
              
              ctx.restore();
            }
          }
        } else if (settings.layout === 'diagonal') {
            const cols = Math.ceil(width / gap) + 2;
            const rows = Math.ceil(height / gap) + 2;
            
            for (let r = -1; r < rows; r++) {
              for (let c = -1; c < cols; c++) {
                const imgIndex = Math.abs((r * cols + c)) % validImages.length;
                const img = validImages[imgIndex];
                
                // Diagonal shift
                const shift = (r % 2) * (gap / 2);
                const x = c * gap + shift;
                const y = r * gap; // Tighter vertical packing for diagonal usually looks better if offset? No, simple offset is fine.

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(-0.1); // Slight fixed tilt
                
                const scaleFactor = subjectSize / Math.max(img.width, img.height);
                ctx.drawImage(img, - (img.width * scaleFactor)/2, - (img.height * scaleFactor)/2, img.width * scaleFactor, img.height * scaleFactor);
                
                ctx.restore();
              }
            }
        }
      }
    };

    render();
  }, [subjects, patternUrl, settings]);

  // Adjust container scaling to fit screen
  useEffect(() => {
    if (containerRef.current) {
        // Calculate dynamic scale to fit the canvas in the view
        // Logic omitted for brevity, hardcoded nice scale for now or use CSS 'contain'
    }
  }, [settings.paperSize]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-slate-200 overflow-auto flex items-center justify-center p-8 relative shadow-inner"
    >
      <div className="relative shadow-2xl transition-all duration-500 ease-in-out">
        <canvas 
          ref={canvasRef} 
          className="bg-white"
          style={{ 
             // We use a fixed CSS height to make it fit in view, while the actual canvas is high res
             maxHeight: '80vh',
             maxWidth: '100%',
             height: 'auto',
             width: 'auto'
          }}
        />
        {(!patternUrl && subjects.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-slate-400 font-holiday text-3xl opacity-50">Preview Area</p>
            </div>
        )}
      </div>
    </div>
  );
};
