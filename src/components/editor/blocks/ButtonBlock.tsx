import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, FileText, Copy, Settings2, Check,
  Sparkles, Zap, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type ButtonAction = 'url' | 'page' | 'copy';
type ButtonStyle = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonBlockProps {
  id: string;
  content?: string;
  properties?: {
    action?: ButtonAction;
    actionValue?: string;
    style?: ButtonStyle;
    icon?: string;
  };
  onChange?: (content: string, properties?: Record<string, unknown>) => void;
  isEditing?: boolean;
}

const BUTTON_STYLES: Record<ButtonStyle, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
};

const ACTION_ICONS: Record<ButtonAction, React.ReactNode> = {
  url: <ExternalLink className="h-4 w-4" />,
  page: <FileText className="h-4 w-4" />,
  copy: <Copy className="h-4 w-4" />,
};

export function ButtonBlock({ 
  id, 
  content = 'Click me', 
  properties = {},
  onChange,
  isEditing = false 
}: ButtonBlockProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [label, setLabel] = useState(content);
  const [action, setAction] = useState<ButtonAction>(properties.action || 'url');
  const [actionValue, setActionValue] = useState(properties.actionValue || '');
  const [style, setStyle] = useState<ButtonStyle>(properties.style || 'primary');
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    if (isEditing) return;

    switch (action) {
      case 'url':
        if (actionValue) {
          window.open(actionValue, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'page':
        // Navigate to page - this would be handled by parent
        toast.info('Navigate to page: ' + actionValue);
        break;
      case 'copy':
        if (actionValue) {
          navigator.clipboard.writeText(actionValue);
          setCopied(true);
          toast.success('Copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        }
        break;
    }
  };

  const handleSave = () => {
    onChange?.(label, { action, actionValue, style });
    setShowSettings(false);
  };

  return (
    <div className="py-2 group relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2"
      >
        <Button
          className={cn(
            "gap-2 transition-all",
            BUTTON_STYLES[style],
            isEditing && "cursor-default"
          )}
          onClick={handleClick}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            ACTION_ICONS[action]
          )}
          {label}
          {action === 'url' && <ArrowRight className="h-3 w-3 opacity-50" />}
        </Button>

        {isEditing && (
          <Popover open={showSettings} onOpenChange={setShowSettings}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Button Label</label>
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Button text..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Style</label>
                  <Select value={style} onValueChange={(v) => setStyle(v as ButtonStyle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3" />
                          Primary
                        </div>
                      </SelectItem>
                      <SelectItem value="secondary">
                        <div className="flex items-center gap-2">
                          <Zap className="h-3 w-3" />
                          Secondary
                        </div>
                      </SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Action</label>
                  <Select value={action} onValueChange={(v) => setAction(v as ButtonAction)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-3 w-3" />
                          Open URL
                        </div>
                      </SelectItem>
                      <SelectItem value="page">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          Open Page
                        </div>
                      </SelectItem>
                      <SelectItem value="copy">
                        <div className="flex items-center gap-2">
                          <Copy className="h-3 w-3" />
                          Copy Text
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {action === 'url' && 'URL'}
                    {action === 'page' && 'Page ID'}
                    {action === 'copy' && 'Text to Copy'}
                  </label>
                  <Input
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    placeholder={
                      action === 'url' ? 'https://example.com' :
                      action === 'page' ? 'Page ID or title...' :
                      'Text to copy...'
                    }
                  />
                </div>

                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </motion.div>
    </div>
  );
}
