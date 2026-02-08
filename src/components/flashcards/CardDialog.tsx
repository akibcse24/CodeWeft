import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tables } from "@/integrations/supabase/types";

type Flashcard = Tables<"flashcards">;

interface CardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: Flashcard | null;
  deckId: string;
  onSave: (data: { front: string; back: string; deck_id: string }) => void;
}

export function CardDialog({ open, onOpenChange, card, deckId, onSave }: CardDialogProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  useEffect(() => {
    if (card) {
      setFront(card.front);
      setBack(card.back);
    } else {
      setFront("");
      setBack("");
    }
  }, [card, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    onSave({ front: front.trim(), back: back.trim(), deck_id: deckId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{card ? "Edit Card" : "Add New Card"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="front">Front (Question)</Label>
              <Textarea
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Enter your question..."
                rows={3}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="back">Back (Answer)</Label>
              <Textarea
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Enter the answer..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!front.trim() || !back.trim()}>
              {card ? "Save Changes" : "Add Card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
