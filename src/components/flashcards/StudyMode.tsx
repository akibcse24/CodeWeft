import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, ThumbsDown, ThumbsUp, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tables } from "@/integrations/supabase/types";

type Flashcard = Tables<"flashcards">;

interface StudyModeProps {
  cards: Flashcard[];
  onComplete: () => void;
  onReview: (id: string, quality: number) => void;
}

export function StudyMode({ cards, onComplete, onReview }: StudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((reviewed / cards.length) * 100) : 0;

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleRate = (quality: number) => {
    if (!currentCard) return;

    onReview(currentCard.id, quality);
    setReviewed(prev => prev + 1);
    setIsFlipped(false);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === "1") handleRate(1);
        else if (e.key === "2") handleRate(3);
        else if (e.key === "3") handleRate(4);
        else if (e.key === "4") handleRate(5);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipped, currentIndex]);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Brain className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No cards to review!</h2>
        <p className="text-muted-foreground mb-6">
          All caught up. Check back later for more cards.
        </p>
        <Button onClick={onComplete}>Back to Decks</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {cards.length}
          </p>
          <Progress value={progress} className="w-40 h-2" />
        </div>
        <Button variant="ghost" size="icon" onClick={onComplete}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Flashcard */}
      <div
        className="perspective-1000 cursor-pointer"
        onClick={handleFlip}
        style={{ perspective: "1000px" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isFlipped ? "back" : "front"}
            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="min-h-[300px] flex items-center justify-center">
              <CardContent className="p-8 text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                  {isFlipped ? "Answer" : "Question"}
                </p>
                <p className="text-xl font-medium whitespace-pre-wrap">
                  {isFlipped ? currentCard?.back : currentCard?.front}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      {!isFlipped ? (
        <div className="flex justify-center">
          <Button onClick={handleFlip} size="lg">
            <RotateCcw className="mr-2 h-4 w-4" /> Show Answer
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            How well did you know this?
          </p>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              className="flex-col h-auto py-3 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleRate(1)}
            >
              <ThumbsDown className="h-5 w-5 mb-1" />
              <span className="text-xs">Again</span>
              <span className="text-[10px] text-muted-foreground">1</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-3 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
              onClick={() => handleRate(3)}
            >
              <span className="text-lg mb-1">😐</span>
              <span className="text-xs">Hard</span>
              <span className="text-[10px] text-muted-foreground">2</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-3 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
              onClick={() => handleRate(4)}
            >
              <ThumbsUp className="h-5 w-5 mb-1" />
              <span className="text-xs">Good</span>
              <span className="text-[10px] text-muted-foreground">3</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-3 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => handleRate(5)}
            >
              <Zap className="h-5 w-5 mb-1" />
              <span className="text-xs">Easy</span>
              <span className="text-[10px] text-muted-foreground">4</span>
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 rounded bg-muted">Space</kbd> to flip,{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-muted">1-4</kbd> to rate
      </p>
    </div>
  );
}
