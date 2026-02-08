import { useState } from "react";
import { Plus, Brain, Play, Search, MoreVertical, Trash2, Edit, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFlashcards } from "@/hooks/useFlashcards";
import { DeckDialog } from "@/components/flashcards/DeckDialog";
import { CardDialog } from "@/components/flashcards/CardDialog";
import { StudyMode } from "@/components/flashcards/StudyMode";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

type FlashcardDeck = Tables<"flashcard_decks">;

export default function Flashcards() {
  const { 
    decks, 
    isLoadingDecks, 
    createDeck, 
    updateDeck, 
    deleteDeck,
    dueCards,
    getCardsForDeck,
    createCard,
    updateCard,
    deleteCard,
    reviewCard,
  } = useFlashcards();

  const [searchQuery, setSearchQuery] = useState("");
  const [deckDialogOpen, setDeckDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);

  const selectedDeckQuery = selectedDeckId ? getCardsForDeck(selectedDeckId) : null;
  const selectedDeck = decks.find(d => d.id === selectedDeckId);
  const studyDeckQuery = studyDeckId ? getCardsForDeck(studyDeckId) : null;

  const filteredDecks = decks.filter(deck =>
    deck.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDeck = async (data: { name: string; description?: string; color?: string }) => {
    try {
      await createDeck.mutateAsync(data);
      toast.success("Deck created successfully!");
    } catch (error) {
      toast.error("Failed to create deck");
    }
  };

  const handleUpdateDeck = async (data: { name: string; description?: string; color?: string }) => {
    if (!editingDeck) return;
    try {
      await updateDeck.mutateAsync({ id: editingDeck.id, ...data });
      toast.success("Deck updated successfully!");
    } catch (error) {
      toast.error("Failed to update deck");
    }
  };

  const handleDeleteDeck = async (id: string) => {
    try {
      await deleteDeck.mutateAsync(id);
      if (selectedDeckId === id) setSelectedDeckId(null);
      toast.success("Deck deleted");
    } catch (error) {
      toast.error("Failed to delete deck");
    }
  };

  const handleCreateCard = async (data: { front: string; back: string; deck_id: string }) => {
    try {
      await createCard.mutateAsync(data);
      toast.success("Card added!");
    } catch (error) {
      toast.error("Failed to add card");
    }
  };

  const handleReview = async (id: string, quality: number) => {
    try {
      await reviewCard.mutateAsync({ id, quality });
    } catch (error) {
      console.error("Failed to record review:", error);
    }
  };

  const startStudy = (deckId: string | null) => {
    setStudyDeckId(deckId);
    setStudyMode(true);
  };

  // Calculate stats
  const totalCards = decks.reduce((sum, d) => sum + (d.card_count || 0), 0);
  const dueToday = dueCards.length;

  if (studyMode) {
    const cardsToStudy = studyDeckId 
      ? (studyDeckQuery?.data || []).filter(c => new Date(c.next_review_date || 0) <= new Date())
      : dueCards;
    
    return (
      <div className="animate-fade-in p-4">
        <StudyMode
          cards={cardsToStudy}
          onComplete={() => {
            setStudyMode(false);
            setStudyDeckId(null);
            toast.success("Study session complete!");
          }}
          onReview={handleReview}
        />
      </div>
    );
  }

  // View deck details
  if (selectedDeckId && selectedDeck) {
    const cards = selectedDeckQuery?.data || [];
    const deckDueCards = cards.filter(c => new Date(c.next_review_date || 0) <= new Date());

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedDeckId(null)}>
            ← Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span 
                className="h-4 w-4 rounded-full" 
                style={{ backgroundColor: selectedDeck.color || "#8b5cf6" }}
              />
              {selectedDeck.name}
            </h1>
            {selectedDeck.description && (
              <p className="text-muted-foreground">{selectedDeck.description}</p>
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={() => startStudy(selectedDeckId)}
            disabled={deckDueCards.length === 0}
          >
            <Play className="mr-2 h-4 w-4" /> 
            Study ({deckDueCards.length} due)
          </Button>
          <Button onClick={() => setCardDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Card
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.id} className="card-hover">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Front</p>
                    <p className="font-medium line-clamp-2">{card.front}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Back</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{card.back}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Interval: {card.interval_days}d</span>
                    <span>Ease: {Number(card.ease_factor || 2.5).toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {cards.length === 0 && (
            <Card className="border-dashed col-span-full">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No cards yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add flashcards to start learning
                </p>
                <Button onClick={() => setCardDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add First Card
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <CardDialog
          open={cardDialogOpen}
          onOpenChange={setCardDialogOpen}
          deckId={selectedDeckId}
          onSave={handleCreateCard}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground">Spaced repetition learning</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => startStudy(null)} disabled={dueToday === 0}>
            <Play className="mr-2 h-4 w-4" /> Study Now ({dueToday})
          </Button>
          <Button onClick={() => { setEditingDeck(null); setDeckDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Deck
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{dueToday}</div>
            <p className="text-xs text-muted-foreground">Cards Due Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalCards}</div>
            <p className="text-xs text-muted-foreground">Total Cards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{decks.length}</div>
            <p className="text-xs text-muted-foreground">Total Decks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Search decks..." 
          className="pl-10" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDecks.map((deck) => (
          <Card 
            key={deck.id} 
            className="card-hover cursor-pointer group"
            onClick={() => setSelectedDeckId(deck.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: deck.color || "#8b5cf6" }}
                  />
                  <CardTitle className="text-lg">{deck.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setEditingDeck(deck);
                      setDeckDialogOpen(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeck(deck.id);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {deck.description && (
                <CardDescription className="line-clamp-1">{deck.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{deck.card_count || 0} cards</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    startStudy(deck.id);
                  }}
                >
                  <Play className="h-3 w-3 mr-1" /> Study
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDecks.length === 0 && !isLoadingDecks && (
          <Card className="card-hover cursor-pointer border-dashed" onClick={() => { setEditingDeck(null); setDeckDialogOpen(true); }}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <Brain className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium">Create your first deck</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use spaced repetition to learn faster
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <DeckDialog
        open={deckDialogOpen}
        onOpenChange={setDeckDialogOpen}
        deck={editingDeck}
        onSave={editingDeck ? handleUpdateDeck : handleCreateDeck}
      />
    </div>
  );
}
