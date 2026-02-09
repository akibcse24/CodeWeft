import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, Brain, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VoiceCaptureProps {
    onTranscription: (text: string) => void;
}

export function VoiceCapture({ onTranscription }: VoiceCaptureProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const { toast } = useToast();

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                setAudioBlob(blob);
                handleTranscribe(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            toast({ title: "Recording started...", description: "Speak your thoughts." });
        } catch (err) {
            console.error("Failed to start recording", err);
            toast({ title: "Microphone error", description: "Could not access microphone.", variant: "destructive" });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    const handleTranscribe = async (blob: Blob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append("file", blob, "audio.webm");

            const { data, error } = await supabase.functions.invoke("voice-transcribe", {
                body: formData,
            });

            if (error) throw error;
            if (data.text) {
                onTranscription(data.text);
                toast({ title: "Transcription complete", description: "Added to your brain." });
            }
        } catch (err) {
            console.error("Transcription failed", err);
            toast({ title: "Transcription failed", description: "Voice processing failed.", variant: "destructive" });
        } finally {
            setIsTranscribing(false);
            setAudioBlob(null);
        }
    };

    return (
        <div className="relative">
            <AnimatePresence>
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -top-16 left-1/2 -translate-x-1/2 bg-destructive/10 backdrop-blur-md border border-destructive/20 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="h-2 w-2 rounded-full bg-destructive"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Recording</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="lg"
                variant={isRecording ? "destructive" : "outline"}
                className={cn(
                    "h-14 w-14 rounded-2xl shadow-xl transition-all duration-500",
                    isRecording && "animate-pulse"
                )}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
            >
                {isTranscribing ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : isRecording ? (
                    <Square className="h-6 w-6 fill-white" />
                ) : (
                    <Mic className="h-6 w-6" />
                )}
            </Button>
        </div>
    );
}

