import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Image, X, Shuffle, Upload, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CoverImageProps {
  coverUrl: string | null;
  onCoverChange: (url: string | null) => void;
  readOnly?: boolean;
  coverPosition?: number; // 0-100, vertical position
  onCoverPositionChange?: (position: number) => void;
}

const GRADIENT_COVERS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
  "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
  "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
];

const UNSPLASH_COVERS = [
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1490730141103-6cac27abb37f?w=1200&h=400&fit=crop",
];

export function CoverImage({ 
  coverUrl, 
  onCoverChange, 
  readOnly = false,
  coverPosition = 50,
  onCoverPositionChange
}: CoverImageProps) {
  const [customUrl, setCustomUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [localPosition, setLocalPosition] = useState(coverPosition);
  const coverRef = useRef<HTMLDivElement>(null);

  const isGradient = coverUrl?.startsWith("linear-gradient");

  const handleRandomCover = () => {
    const allCovers = [...GRADIENT_COVERS, ...UNSPLASH_COVERS];
    const randomCover = allCovers[Math.floor(Math.random() * allCovers.length)];
    onCoverChange(randomCover);
  };

  const handleCustomUrl = () => {
    if (customUrl.trim()) {
      onCoverChange(customUrl.trim());
      setCustomUrl("");
      setIsOpen(false);
    }
  };

  const handleRepositionMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isRepositioning || !coverRef.current) return;
    
    const rect = coverRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percent = Math.max(0, Math.min(100, (y / rect.height) * 100));
    setLocalPosition(percent);
  }, [isRepositioning]);

  const handleRepositionEnd = useCallback(() => {
    if (isRepositioning) {
      setIsRepositioning(false);
      onCoverPositionChange?.(localPosition);
    }
  }, [isRepositioning, localPosition, onCoverPositionChange]);

  const CoverPickerContent = (
    <PopoverContent className="w-80 p-0" align="end">
      <Tabs defaultValue="gradients" className="w-full">
        <TabsList className="w-full rounded-none border-b bg-muted/50 p-0">
          <TabsTrigger value="gradients" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Gradients</TabsTrigger>
          <TabsTrigger value="photos" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Photos</TabsTrigger>
          <TabsTrigger value="custom" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Link</TabsTrigger>
        </TabsList>
        <div className="p-4">
          <TabsContent value="gradients" className="mt-0">
            <div className="grid grid-cols-5 gap-2">
              {GRADIENT_COVERS.map((gradient, i) => (
                <button
                  key={i}
                  className="h-8 rounded-md hover:ring-2 ring-primary transition-all ring-offset-1 ring-offset-background"
                  style={{ background: gradient }}
                  onClick={() => {
                    onCoverChange(gradient);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="photos" className="mt-0">
            <div className="grid grid-cols-3 gap-2">
              {UNSPLASH_COVERS.map((url, i) => (
                <button
                  key={i}
                  className="h-12 rounded-md overflow-hidden hover:ring-2 ring-primary transition-all ring-offset-1 ring-offset-background"
                  onClick={() => {
                    onCoverChange(url);
                    setIsOpen(false);
                  }}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="custom" className="mt-0 space-y-2">
            <Input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Paste image URL..."
              onKeyDown={(e) => e.key === "Enter" && handleCustomUrl()}
              className="h-8"
            />
            <Button onClick={handleCustomUrl} size="sm" className="w-full">Set Cover</Button>
          </TabsContent>
        </div>
      </Tabs>
    </PopoverContent>
  );

  if (!coverUrl && !readOnly) {
    return null; // Cover is added via PageHeader now
  }

  if (!coverUrl) return null;

  return (
    <motion.div
      ref={coverRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "relative w-full h-[28vh] min-h-[180px] max-h-[260px] group overflow-hidden",
        "bg-muted",
        isRepositioning && "cursor-ns-resize"
      )}
      onMouseMove={handleRepositionMouseMove}
      onMouseUp={handleRepositionEnd}
      onMouseLeave={handleRepositionEnd}
    >
      {/* Cover Image */}
      <div
        className={cn(
          "absolute inset-0 transition-all duration-500",
          !isGradient && "bg-cover"
        )}
        style={
          isGradient
            ? { background: coverUrl }
            : { 
                backgroundImage: `url(${coverUrl})`,
                backgroundPosition: `center ${localPosition}%`
              }
        }
      />

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />

      {/* Controls - top right corner */}
      {!readOnly && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90 shadow-lg"
              >
                <Image className="h-3.5 w-3.5 mr-1.5" />
                Change cover
              </Button>
            </PopoverTrigger>
            {CoverPickerContent}
          </Popover>

          {!isGradient && (
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                "h-8 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90 shadow-lg",
                isRepositioning && "bg-primary text-primary-foreground"
              )}
              onMouseDown={() => setIsRepositioning(true)}
            >
              <Move className="h-3.5 w-3.5 mr-1.5" />
              Reposition
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="h-8 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90 shadow-lg text-destructive hover:text-destructive"
            onClick={() => onCoverChange(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Reposition indicator */}
      {isRepositioning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="px-4 py-2 bg-background/90 rounded-lg shadow-lg text-sm font-medium">
            Drag to reposition
          </div>
        </div>
      )}
    </motion.div>
  );
}
