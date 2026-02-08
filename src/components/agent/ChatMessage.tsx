import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Bot, User, CheckCircle, AlertCircle, Clock, 
  Copy, Check, ExternalLink, ChevronDown, ChevronUp,
  Play, Pause, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ParsedCommand } from "@/services/agents/nlu.service";

export type MessageType = 
  | "text" 
  | "command" 
  | "error" 
  | "success" 
  | "loading"
  | "plan"
  | "confirmation"
  | "rich";

export interface RichMessage {
  id: string;
  type: MessageType;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  metadata?: {
    command?: ParsedCommand;
    actions?: string[];
    data?: Record<string, unknown>;
    progress?: number;
    status?: "pending" | "running" | "completed" | "failed";
  };
}

interface ChatMessageProps {
  message: RichMessage;
  onAction?: (action: string, data?: Record<string, unknown> | ParsedCommand) => void;
  isLast?: boolean;
}

export function ChatMessage({ message, onAction, isLast }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-4 mb-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-md",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
      )}>
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[85%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUser ? "You" : "AI Assistant"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
          {message.type === "command" && (
            <Badge variant="outline" className="text-xs">Command</Badge>
          )}
          {message.metadata?.status && (
            <StatusBadge status={message.metadata.status} />
          )}
        </div>

        {/* Message Body */}
        <div className={cn(
          "relative group rounded-2xl p-4 shadow-sm",
          isUser 
            ? "bg-primary/10 border border-primary/20" 
            : "bg-card border border-border"
        )}>
          {/* Content based on type */}
          {renderContent(message, onAction)}

          {/* Progress Bar for loading */}
          {message.type === "loading" && message.metadata?.progress !== undefined && (
            <div className="mt-3">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${message.metadata.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {message.metadata.progress}%
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        {message.metadata?.actions && message.metadata.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.metadata.actions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => onAction?.(action, message.metadata?.data)}
              >
                {action}
              </Button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function renderContent(message: RichMessage, onAction?: (action: string, data?: Record<string, unknown> | ParsedCommand) => void) {
  switch (message.type) {
    case "command":
      return (
        <div className="space-y-2">
          <p className="text-sm">{message.content}</p>
          {message.metadata?.command && (
            <CommandPreview 
              command={message.metadata.command} 
              onExecute={() => onAction?.("execute", message.metadata?.command)}
            />
          )}
        </div>
      );

    case "error":
      return (
        <div className="flex items-start gap-2 text-red-500">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{message.content}</p>
        </div>
      );

    case "success":
      return (
        <div className="flex items-start gap-2 text-green-500">
          <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{message.content}</p>
        </div>
      );

    case "plan":
      return (
        <div className="space-y-3">
          <p className="text-sm">{message.content}</p>
            {message.metadata?.data?.steps && (
            <div className="space-y-2">
              {(message.metadata.data.steps as Array<{ description: string; status: string }>).map((step, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{step.description}</span>
                  {step.status === "completed" && <Check className="h-4 w-4 text-green-500" />}
                  {step.status === "running" && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock className="h-4 w-4" />
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case "confirmation":
      return (
        <div className="space-y-3">
          <p className="text-sm">{message.content}</p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => onAction?.("confirm", message.metadata?.data)}
            >
              Confirm
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAction?.("cancel")}
            >
              Cancel
            </Button>
          </div>
        </div>
      );

    case "rich":
      return <RichContent content={message.content} data={message.metadata?.data} />;

    case "loading":
      return (
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Clock className="h-5 w-5 text-primary" />
          </motion.div>
          <p className="text-sm">{message.content}</p>
        </div>
      );

    default:
      return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
  }
}

function CommandPreview({ command, onExecute }: { command: ParsedCommand; onExecute?: () => void }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="mt-2 border-primary/20 bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {command.action.replace(/_/g, " ")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {Math.round(command.confidence * 100)}% confidence
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2"
              onClick={onExecute}
            >
              <Play className="h-3 w-3 mr-1" />
              Execute
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Parameters:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(command.params, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatusBadgeProps {
  status: "pending" | "running" | "completed" | "failed";
}

function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  const variants: Record<string, { color: string; icon: React.ElementType }> = {
    pending: { color: "bg-yellow-500/20 text-yellow-500", icon: Clock },
    running: { color: "bg-blue-500/20 text-blue-500", icon: Play },
    completed: { color: "bg-green-500/20 text-green-500", icon: CheckCircle },
    failed: { color: "bg-red-500/20 text-red-500", icon: AlertCircle }
  };

  const { color, icon: Icon } = variants[status] || variants.pending;

  return (
    <Badge variant="outline" className={`text-xs ${color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function RichContent({ content, data }: { content: string; data?: Record<string, unknown> }) {
  // Parse markdown-like content
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/);

  return (
    <div className="space-y-2">
      {parts.map((part, idx) => {
        if (part.startsWith("```")) {
          // Code block
          const code = part.slice(3, -3).trim();
          const lang = code.split("\n")[0];
          const codeContent = code.includes("\n") ? code.substring(code.indexOf("\n") + 1) : code;

          return (
            <div key={idx} className="relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        } else if (part.startsWith("`")) {
          // Inline code
          return (
            <code key={idx} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
              {part.slice(1, -1)}
            </code>
          );
        } else {
          // Regular text
          return <p key={idx} className="text-sm whitespace-pre-wrap">{part}</p>;
        }
      })}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return date.toLocaleDateString();
}

export default ChatMessage;
