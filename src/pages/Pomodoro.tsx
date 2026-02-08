import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Settings, Coffee, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

type TimerMode = "work" | "break" | "longBreak";

const TIMER_SETTINGS = {
  work: 25 * 60,
  break: 5 * 60,
  longBreak: 15 * 60,
};

export default function Pomodoro() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const totalTime = TIMER_SETTINGS[mode];
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const resetTimer = useCallback(() => {
    setTimeLeft(TIMER_SETTINGS[mode]);
    setIsRunning(false);
  }, [mode]);

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_SETTINGS[newMode]);
    setIsRunning(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === "work") {
        setSessions((prev) => prev + 1);
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
          <p className="text-muted-foreground">Stay focused with timed sessions</p>
        </div>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" /> Settings
        </Button>
      </div>

      <div className="max-w-xl mx-auto">
        <Card className="overflow-hidden">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center gap-2 mb-4">
              <Button
                variant={mode === "work" ? "default" : "outline"}
                size="sm"
                onClick={() => switchMode("work")}
              >
                <Clock className="mr-1 h-4 w-4" /> Work
              </Button>
              <Button
                variant={mode === "break" ? "default" : "outline"}
                size="sm"
                onClick={() => switchMode("break")}
              >
                <Coffee className="mr-1 h-4 w-4" /> Break
              </Button>
              <Button
                variant={mode === "longBreak" ? "default" : "outline"}
                size="sm"
                onClick={() => switchMode("longBreak")}
              >
                Long Break
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <motion.div
              key={timeLeft}
              initial={{ scale: 1 }}
              animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
              className="mb-8"
            >
              <div className="text-7xl md:text-8xl font-mono font-bold gradient-text">
                {formatTime(timeLeft)}
              </div>
            </motion.div>

            <Progress value={progress} className="h-2 mb-8" />

            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                className="w-32"
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" /> Start
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{sessions}</div>
              <p className="text-xs text-muted-foreground">Sessions Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{sessions * 25}</div>
              <p className="text-xs text-muted-foreground">Minutes Focused</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
