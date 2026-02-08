import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Wand2, Languages, MessageSquare, 
  Minimize2, Maximize2, ChevronDown, Loader2,
  BookOpen, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIInlineActionsProps {
  selectedText: string;
  onReplace: (newText: string) => void;
  onClose?: () => void;
}

type AIAction = 
  | 'improve' 
  | 'fix-grammar' 
  | 'shorter' 
  | 'longer' 
  | 'explain'
  | 'translate'
  | 'tone';

const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
];

const TONES = [
  { id: 'formal', name: 'Formal', icon: '🎩' },
  { id: 'casual', name: 'Casual', icon: '😊' },
  { id: 'friendly', name: 'Friendly', icon: '👋' },
  { id: 'professional', name: 'Professional', icon: '💼' },
  { id: 'confident', name: 'Confident', icon: '💪' },
];

export function AIInlineActions({ selectedText, onReplace, onClose }: AIInlineActionsProps) {
  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const executeAction = async (action: AIAction, extra?: string) => {
    if (!selectedText.trim()) {
      toast.error('No text selected');
      return;
    }

    setLoading(true);
    setCurrentAction(action);

    try {
      let prompt = '';
      
      switch (action) {
        case 'improve':
          prompt = `Improve the following text for clarity and readability. Keep the same meaning but make it better. Only return the improved text, nothing else:\n\n${selectedText}`;
          break;
        case 'fix-grammar':
          prompt = `Fix any grammar, spelling, and punctuation errors in the following text. Only return the corrected text, nothing else:\n\n${selectedText}`;
          break;
        case 'shorter':
          prompt = `Make the following text shorter and more concise while keeping the key points. Only return the shortened text, nothing else:\n\n${selectedText}`;
          break;
        case 'longer':
          prompt = `Expand the following text with more details and explanation while keeping the same tone. Only return the expanded text, nothing else:\n\n${selectedText}`;
          break;
        case 'explain':
          prompt = `Explain the following text in simple terms. Return a clear explanation:\n\n${selectedText}`;
          break;
        case 'translate':
          prompt = `Translate the following text to ${extra}. Only return the translation, nothing else:\n\n${selectedText}`;
          break;
        case 'tone':
          prompt = `Rewrite the following text in a ${extra} tone. Keep the same meaning but change the style. Only return the rewritten text, nothing else:\n\n${selectedText}`;
          break;
      }

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [{ role: 'user', content: prompt }],
          type: 'inline-action'
        }
      });

      if (error) throw error;

      const result = data?.message || data?.content || '';
      if (result) {
        onReplace(result.trim());
        toast.success(`Text ${action === 'explain' ? 'explained' : 'updated'}!`);
      }
    } catch (error) {
      console.error('AI action failed:', error);
      toast.error('Failed to process text. Please try again.');
    } finally {
      setLoading(false);
      setCurrentAction(null);
      onClose?.();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-auto px-2 gap-1 text-xs font-medium"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">AI</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => executeAction('improve')} disabled={loading}>
          <Wand2 className="h-4 w-4 mr-2" />
          Improve writing
          {currentAction === 'improve' && <Loader2 className="h-3 w-3 ml-auto animate-spin" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => executeAction('fix-grammar')} disabled={loading}>
          <Pencil className="h-4 w-4 mr-2" />
          Fix grammar
          {currentAction === 'fix-grammar' && <Loader2 className="h-3 w-3 ml-auto animate-spin" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => executeAction('shorter')} disabled={loading}>
          <Minimize2 className="h-4 w-4 mr-2" />
          Make shorter
          {currentAction === 'shorter' && <Loader2 className="h-3 w-3 ml-auto animate-spin" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => executeAction('longer')} disabled={loading}>
          <Maximize2 className="h-4 w-4 mr-2" />
          Make longer
          {currentAction === 'longer' && <Loader2 className="h-3 w-3 ml-auto animate-spin" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => executeAction('explain')} disabled={loading}>
          <BookOpen className="h-4 w-4 mr-2" />
          Explain this
          {currentAction === 'explain' && <Loader2 className="h-3 w-3 ml-auto animate-spin" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={loading}>
            <Languages className="h-4 w-4 mr-2" />
            Translate to...
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem 
                key={lang.code}
                onClick={() => executeAction('translate', lang.name)}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={loading}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Change tone...
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {TONES.map((tone) => (
              <DropdownMenuItem 
                key={tone.id}
                onClick={() => executeAction('tone', tone.name)}
              >
                <span className="mr-2">{tone.icon}</span>
                {tone.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
