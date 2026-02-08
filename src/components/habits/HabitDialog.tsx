import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tables } from "@/integrations/supabase/types";

type Habit = Tables<"habits">;

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
  onSave: (data: { 
    name: string; 
    description?: string; 
    frequency?: string;
    target_days?: number[];
    color?: string;
    icon?: string;
  }) => void;
}

const COLORS = [
  "#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#6366f1"
];

const ICONS = ["🏃", "📚", "💪", "🧘", "💧", "😴", "🎯", "✍️", "🎸", "🧠"];

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

export function HabitDialog({ open, onOpenChange, habit, onSave }: HabitDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [targetDays, setTargetDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || "");
      setFrequency(habit.frequency || "daily");
      setTargetDays(habit.target_days || [1, 2, 3, 4, 5, 6, 7]);
      setColor(habit.color || COLORS[0]);
      setIcon(habit.icon || ICONS[0]);
    } else {
      setName("");
      setDescription("");
      setFrequency("daily");
      setTargetDays([1, 2, 3, 4, 5, 6, 7]);
      setColor(COLORS[0]);
      setIcon(ICONS[0]);
    }
  }, [habit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ 
      name: name.trim(), 
      description: description.trim() || undefined, 
      frequency,
      target_days: targetDays,
      color,
      icon,
    });
    onOpenChange(false);
  };

  const toggleDay = (day: number) => {
    setTargetDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{habit ? "Edit Habit" : "Create New Habit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="name">Habit Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Study for 1 hour"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICONS.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why is this habit important?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frequency === "custom" && (
              <div className="space-y-2">
                <Label>Target Days</Label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day) => (
                    <div key={day.value} className="flex items-center gap-1">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={targetDays.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <label htmlFor={`day-${day.value}`} className="text-sm">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-transform ${
                      color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {habit ? "Save Changes" : "Create Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
