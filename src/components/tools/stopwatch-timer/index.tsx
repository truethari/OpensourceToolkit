"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Plus,
  Moon,
  Clock,
  Pause,
  Edit3,
  Timer,
  Users,
  Square,
  Trash2,
  Coffee,
  Laptop,
  Volume2,
  VolumeX,
  Settings,
  Download,
  RotateCcw,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface LapTime {
  id: number;
  time: number;
  lapTime: number;
}

interface TimerSettings {
  hours: number;
  minutes: number;
  seconds: number;
  soundEnabled: boolean;
  autoRestart: boolean;
  customMessage: string;
  hideMilliseconds: boolean;
}

interface StopwatchSettings {
  soundEnabled: boolean;
  lapSoundEnabled: boolean;
  precision: "centiseconds" | "milliseconds";
}

interface TimerPreset {
  id: string;
  name: string;
  hours: number;
  minutes: number;
  seconds: number;
  icon: string;
  color: string;
}

const STORAGE_KEY = "stopwatch-timer-settings";
const PRESETS_KEY = "stopwatch-timer-presets";

const DEFAULT_PRESETS: TimerPreset[] = [
  {
    id: "coding",
    name: "Coding",
    hours: 0,
    minutes: 40,
    seconds: 0,
    icon: "Laptop",
    color: "bg-yellow-500",
  },
  {
    id: "short-break",
    name: "Short Break",
    hours: 0,
    minutes: 5,
    seconds: 0,
    icon: "Coffee",
    color: "bg-green-500",
  },
  {
    id: "long-break",
    name: "Long Break",
    hours: 0,
    minutes: 15,
    seconds: 0,
    icon: "Moon",
    color: "bg-red-500",
  },
  {
    id: "social-media",
    name: "Social Media",
    hours: 0,
    minutes: 10,
    seconds: 0,
    icon: "Users",
    color: "bg-blue-500",
  },
];

export default function StopwatchTimer() {
  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const [stopwatchRunning, setStopwatchRunning] = useState<boolean>(false);
  const [lapTimes, setLapTimes] = useState<LapTime[]>([]);
  const [lapCounter, setLapCounter] = useState<number>(0);

  // Timer state
  const [timerTime, setTimerTime] = useState<number>(0);
  const [timerInitialTime, setTimerInitialTime] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);

  // Settings
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    hours: 0,
    minutes: 5,
    seconds: 0,
    soundEnabled: true,
    autoRestart: false,
    customMessage: "Timer finished!",
    hideMilliseconds: true,
  });

  const [stopwatchSettings, setStopwatchSettings] = useState<StopwatchSettings>(
    {
      soundEnabled: true,
      lapSoundEnabled: true,
      precision: "centiseconds",
    },
  );

  // Timer presets
  const [timerPresets, setTimerPresets] =
    useState<TimerPreset[]>(DEFAULT_PRESETS);
  const [showPresetDialog, setShowPresetDialog] = useState<boolean>(false);
  const [editingPreset, setEditingPreset] = useState<TimerPreset | null>(null);
  const [presetForm, setPresetForm] = useState<{
    name: string;
    hours: number;
    minutes: number;
    seconds: number;
    icon: string;
    color: string;
  }>({
    name: "",
    hours: 0,
    minutes: 0,
    seconds: 0,
    icon: "Timer",
    color: "bg-blue-500",
  });

  // UI state
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("stopwatch");

  // Refs
  const stopwatchInterval = useRef<NodeJS.Timeout | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const stopwatchStartTime = useRef<number | null>(null);
  const timerStartTime = useRef<number | null>(null);
  const stopwatchPausedTime = useRef<number>(0);
  const timerRemainingTime = useRef<number>(0);

  // Load settings and presets from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.timerSettings) setTimerSettings(parsed.timerSettings);
        if (parsed.stopwatchSettings)
          setStopwatchSettings(parsed.stopwatchSettings);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }

    const savedPresets = localStorage.getItem(PRESETS_KEY);
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimerPresets(parsed);
        }
      } catch (error) {
        console.error("Failed to load presets:", error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback(() => {
    const settings = {
      timerSettings,
      stopwatchSettings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [timerSettings, stopwatchSettings]);

  // Save presets to localStorage
  const savePresets = useCallback(() => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(timerPresets));
  }, [timerPresets]);

  useEffect(() => {
    saveSettings();
  }, [timerSettings, stopwatchSettings, saveSettings]);

  useEffect(() => {
    savePresets();
  }, [timerPresets, savePresets]);

  // Page Visibility API handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is being hidden - store current state
        if (stopwatchRunning && stopwatchStartTime.current) {
          stopwatchPausedTime.current = stopwatchTime;
        }
        if (timerRunning && timerStartTime.current) {
          timerRemainingTime.current = timerTime;
        }
      } else {
        // Tab is becoming visible - update times
        if (stopwatchRunning && stopwatchStartTime.current) {
          const currentTime = Date.now();
          const elapsedSinceStart = Math.floor(
            (currentTime - stopwatchStartTime.current) / 10,
          );
          setStopwatchTime(elapsedSinceStart);
        }
        if (timerRunning && timerStartTime.current) {
          const currentTime = Date.now();
          const elapsedSinceStart = Math.floor(
            (currentTime - timerStartTime.current) / 10,
          );
          const newTime = Math.max(
            0,
            timerRemainingTime.current - elapsedSinceStart,
          );
          setTimerTime(newTime);

          if (newTime <= 0 && !timerFinished) {
            setTimerRunning(false);
            setTimerFinished(true);
            if (timerSettings.soundEnabled) {
              // Create a simple beep function for the visibility handler
              const beep = (frequency = 800, duration = 200) => {
                try {
                  const audioCtx = new (window.AudioContext ||
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).webkitAudioContext)();
                  const oscillator = audioCtx.createOscillator();
                  const gainNode = audioCtx.createGain();
                  oscillator.connect(gainNode);
                  gainNode.connect(audioCtx.destination);
                  oscillator.frequency.value = frequency;
                  oscillator.type = "sine";
                  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                  gainNode.gain.exponentialRampToValueAtTime(
                    0.01,
                    audioCtx.currentTime + duration / 1000,
                  );
                  oscillator.start(audioCtx.currentTime);
                  oscillator.stop(audioCtx.currentTime + duration / 1000);
                } catch (error) {
                  console.warn("Could not play sound:", error);
                }
              };

              for (let i = 0; i < 3; i++) {
                setTimeout(() => beep(1500, 500), i * 600);
              }
            }
            if (window.Notification && Notification.permission === "granted") {
              new Notification("Timer Finished", {
                body: timerSettings.customMessage,
                icon: "/favicon.ico",
              });
            }
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [
    stopwatchRunning,
    timerRunning,
    stopwatchTime,
    timerTime,
    timerFinished,
    timerSettings,
  ]);

  // Audio functions
  const playBeep = useCallback((frequency = 800, duration = 200) => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)();
    }

    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.current.currentTime + duration / 1000,
    );

    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + duration / 1000);
  }, []);

  // Format time helper
  const formatTime = useCallback(
    (
      time: number,
      precision: "centiseconds" | "milliseconds" = "centiseconds",
    ): string => {
      const totalSeconds = Math.floor(time / 100);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (precision === "milliseconds") {
        const ms = (time % 100) * 10;
        if (hours > 0)
          return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
        return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
      } else {
        const centiseconds = time % 100;
        if (hours > 0)
          return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
        return `${minutes}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
      }
    },
    [],
  );

  // Format time for timer (with hideMilliseconds option)
  const formatTimerTime = useCallback(
    (time: number): string => {
      const totalSeconds = Math.floor(time / 100);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (timerSettings.hideMilliseconds) {
        if (hours > 0)
          return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      } else {
        const centiseconds = time % 100;
        if (hours > 0)
          return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
        return `${minutes}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
      }
    },
    [timerSettings.hideMilliseconds],
  );

  // Stopwatch functions
  const startStopwatch = useCallback(() => {
    if (!stopwatchRunning) {
      const currentTime = Date.now();
      if (stopwatchTime === 0) {
        stopwatchStartTime.current = currentTime;
      } else {
        // Resuming from pause - adjust start time
        stopwatchStartTime.current = currentTime - stopwatchTime * 10;
      }

      setStopwatchRunning(true);
      if (stopwatchSettings.soundEnabled) playBeep(1000, 100);

      stopwatchInterval.current = setInterval(() => {
        if (stopwatchStartTime.current) {
          const elapsedTime = Math.floor(
            (Date.now() - stopwatchStartTime.current) / 10,
          );
          setStopwatchTime(elapsedTime);
        }
      }, 10);
    }
  }, [
    stopwatchRunning,
    stopwatchTime,
    stopwatchSettings.soundEnabled,
    playBeep,
  ]);

  const pauseStopwatch = useCallback(() => {
    setStopwatchRunning(false);
    if (stopwatchInterval.current) {
      clearInterval(stopwatchInterval.current);
      stopwatchInterval.current = null;
    }
    if (stopwatchSettings.soundEnabled) playBeep(600, 100);
  }, [stopwatchSettings.soundEnabled, playBeep]);

  const resetStopwatch = useCallback(() => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setLapTimes([]);
    setLapCounter(0);
    stopwatchStartTime.current = null;
    stopwatchPausedTime.current = 0;
    if (stopwatchInterval.current) {
      clearInterval(stopwatchInterval.current);
      stopwatchInterval.current = null;
    }
    if (stopwatchSettings.soundEnabled) playBeep(400, 150);
  }, [stopwatchSettings.soundEnabled, playBeep]);

  const recordLap = useCallback(() => {
    if (stopwatchRunning && stopwatchTime > 0) {
      const lastLapTime =
        lapTimes.length > 0 ? lapTimes[lapTimes.length - 1].time : 0;
      const lapTime = stopwatchTime - lastLapTime;

      const newLap: LapTime = {
        id: lapCounter + 1,
        time: stopwatchTime,
        lapTime: lapTime,
      };

      setLapTimes((prev) => [...prev, newLap]);
      setLapCounter((prev) => prev + 1);

      if (stopwatchSettings.lapSoundEnabled) playBeep(1200, 80);
    }
  }, [
    stopwatchRunning,
    stopwatchTime,
    lapTimes,
    lapCounter,
    stopwatchSettings.lapSoundEnabled,
    playBeep,
  ]);

  // Timer functions
  const startTimer = useCallback(() => {
    const currentTime = Date.now();

    if (timerTime <= 0) {
      const totalSeconds =
        timerSettings.hours * 3600 +
        timerSettings.minutes * 60 +
        timerSettings.seconds;
      if (totalSeconds <= 0) return;

      const initialTime = totalSeconds * 100;
      setTimerTime(initialTime);
      setTimerInitialTime(initialTime);
      timerStartTime.current = currentTime;
      timerRemainingTime.current = initialTime;
    } else {
      // Resuming from pause - adjust start time based on remaining time
      timerStartTime.current = currentTime;
      timerRemainingTime.current = timerTime;
    }

    setTimerRunning(true);
    setTimerFinished(false);
    if (timerSettings.soundEnabled) playBeep(1000, 100);

    timerInterval.current = setInterval(() => {
      if (timerStartTime.current) {
        const elapsedTime = Math.floor(
          (Date.now() - timerStartTime.current) / 10,
        );
        const newTime = Math.max(0, timerRemainingTime.current - elapsedTime);
        setTimerTime(newTime);

        if (newTime <= 0) {
          setTimerRunning(false);
          setTimerFinished(true);
          if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
          }

          if (timerSettings.soundEnabled) {
            for (let i = 0; i < 3; i++) {
              setTimeout(() => playBeep(1500, 500), i * 600);
            }
          }

          if (window.Notification && Notification.permission === "granted") {
            new Notification("Timer Finished", {
              body: timerSettings.customMessage,
              icon: "/favicon.ico",
            });
          }

          if (timerSettings.autoRestart) {
            setTimeout(() => {
              setTimerFinished(false);
              const totalSeconds =
                timerSettings.hours * 3600 +
                timerSettings.minutes * 60 +
                timerSettings.seconds;
              const restartTime = totalSeconds * 100;
              setTimerTime(restartTime);
              setTimerInitialTime(restartTime);
              timerStartTime.current = Date.now();
              timerRemainingTime.current = restartTime;
              setTimerRunning(true);
            }, 3000);
          }
        }
      }
    }, 10);
  }, [timerTime, timerSettings, playBeep]);

  // Timer preset functions
  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: typeof Timer } = {
      Laptop,
      Timer,
      Coffee,
      Moon,
      Clock,
      Users,
    };
    return icons[iconName] || Timer;
  };

  const applyPreset = (preset: TimerPreset) => {
    if (!timerRunning && timerTime === 0) {
      setTimerSettings((prev) => ({
        ...prev,
        hours: preset.hours,
        minutes: preset.minutes,
        seconds: preset.seconds,
      }));
    }
  };

  const openPresetDialog = (preset?: TimerPreset) => {
    if (preset) {
      setEditingPreset(preset);
      setPresetForm({
        name: preset.name,
        hours: preset.hours,
        minutes: preset.minutes,
        seconds: preset.seconds,
        icon: preset.icon,
        color: preset.color,
      });
    } else {
      setEditingPreset(null);
      setPresetForm({
        name: "",
        hours: 0,
        minutes: 5,
        seconds: 0,
        icon: "Timer",
        color: "bg-blue-500",
      });
    }
    setShowPresetDialog(true);
  };

  const savePreset = () => {
    if (!presetForm.name.trim()) return;

    const newPreset: TimerPreset = {
      id: editingPreset?.id || Date.now().toString(),
      name: presetForm.name.trim(),
      hours: presetForm.hours,
      minutes: presetForm.minutes,
      seconds: presetForm.seconds,
      icon: presetForm.icon,
      color: presetForm.color,
    };

    if (editingPreset) {
      setTimerPresets((prev) =>
        prev.map((p) => (p.id === editingPreset.id ? newPreset : p)),
      );
    } else {
      setTimerPresets((prev) => [...prev, newPreset]);
    }

    setShowPresetDialog(false);
    setEditingPreset(null);
  };

  const resetPresets = () => {
    setTimerPresets(DEFAULT_PRESETS);
  };

  const deletePreset = (presetId: string) => {
    setTimerPresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  const pauseTimer = useCallback(() => {
    setTimerRunning(false);
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (timerSettings.soundEnabled) playBeep(600, 100);
  }, [timerSettings.soundEnabled, playBeep]);

  const resetTimer = useCallback(() => {
    setTimerRunning(false);
    setTimerTime(0);
    setTimerInitialTime(0);
    setTimerFinished(false);
    timerStartTime.current = null;
    timerRemainingTime.current = 0;
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (timerSettings.soundEnabled) playBeep(400, 150);
  }, [timerSettings.soundEnabled, playBeep]);

  // Export lap times
  const exportLapTimes = useCallback(() => {
    if (lapTimes.length === 0) return;

    const data = lapTimes.map((lap) => ({
      "Lap #": lap.id,
      "Total Time": formatTime(lap.time, stopwatchSettings.precision),
      "Lap Time": formatTime(lap.lapTime, stopwatchSettings.precision),
      "Average Lap": formatTime(
        Math.floor(lap.time / lap.id),
        stopwatchSettings.precision,
      ),
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stopwatch-lap-times-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [lapTimes, formatTime, stopwatchSettings.precision]);

  // Request notification permission
  useEffect(() => {
    if (window.Notification && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup intervals
  useEffect(() => {
    return () => {
      if (stopwatchInterval.current) clearInterval(stopwatchInterval.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  return (
    <ToolsWrapper>
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold text-white sm:text-4xl">
          Stopwatch & Timer
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Professional stopwatch with lap times and customizable timer with
          notifications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-4 flex flex-col items-center gap-3 sm:mb-6 sm:flex-row sm:justify-between">
          <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
            <TabsTrigger
              value="stopwatch"
              className="flex items-center gap-1 text-xs sm:gap-2 sm:text-sm"
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Stopwatch</span>
              <span className="sm:hidden">SW</span>
            </TabsTrigger>
            <TabsTrigger
              value="timer"
              className="flex items-center gap-1 text-xs sm:gap-2 sm:text-sm"
            >
              <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Timer</span>
              <span className="sm:hidden">TM</span>
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 px-3 py-2 text-xs sm:gap-2 sm:text-sm"
            size="sm"
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>

        <div className="flex flex-col">
          <TabsContent value="stopwatch" className="mt-0">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Stopwatch
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div className="text-center">
                      <div className="mb-4 font-mono text-4xl font-bold leading-none text-white sm:text-6xl md:text-8xl">
                        {formatTime(stopwatchTime, stopwatchSettings.precision)}
                      </div>

                      <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                        {!stopwatchRunning ? (
                          <Button
                            onClick={startStopwatch}
                            size="lg"
                            className="min-w-[100px] bg-green-600 text-sm hover:bg-green-700 sm:text-base"
                          >
                            <Play className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                            Start
                          </Button>
                        ) : (
                          <Button
                            onClick={pauseStopwatch}
                            size="lg"
                            className="min-w-[100px] bg-yellow-600 text-sm hover:bg-yellow-700 sm:text-base"
                          >
                            <Pause className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                            Pause
                          </Button>
                        )}

                        <Button
                          onClick={recordLap}
                          disabled={!stopwatchRunning || stopwatchTime === 0}
                          size="lg"
                          variant="outline"
                          className="min-w-[80px] text-sm sm:text-base"
                        >
                          <Clock className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                          Lap
                        </Button>

                        <Button
                          onClick={resetStopwatch}
                          size="lg"
                          variant="outline"
                          className="min-w-[90px] text-sm text-red-600 hover:bg-red-500 sm:text-base"
                        >
                          <RotateCcw className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <Card className="min-h-full shadow-lg">
                  <CardHeader className="pb-2 sm:pb-6">
                    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                      <CardTitle className="text-lg sm:text-xl">
                        Lap Times
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportLapTimes}
                          disabled={lapTimes.length === 0}
                          className="text-xs sm:text-sm"
                        >
                          <Download className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Export</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLapTimes([])}
                          className="text-xs text-red-600 hover:bg-red-50 sm:text-sm"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 sm:pt-6">
                    <div className="max-h-48 space-y-2 overflow-y-auto sm:max-h-64">
                      {lapTimes
                        .slice()
                        .reverse()
                        .map((lap) => (
                          <div
                            key={lap.id}
                            className="flex items-center justify-between rounded border bg-slate-50/50 p-2"
                          >
                            <div className="text-sm font-semibold sm:text-base">
                              Lap {lap.id}
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-xs sm:text-sm">
                                {formatTime(
                                  lap.lapTime,
                                  stopwatchSettings.precision,
                                )}
                              </div>
                              <div className="font-mono text-xs text-slate-500">
                                Total:{" "}
                                {formatTime(
                                  lap.time,
                                  stopwatchSettings.precision,
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timer" className="mt-0 w-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-orange-600" />
                  Timer
                  {timerFinished && (
                    <Badge className="bg-red-100 text-red-800">Finished!</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {!timerRunning && timerTime === 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div>
                      <Label>Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={timerSettings.hours}
                        onChange={(e) =>
                          setTimerSettings((prev) => ({
                            ...prev,
                            hours: Math.max(0, parseInt(e.target.value) || 0),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Minutes</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={timerSettings.minutes}
                        onChange={(e) =>
                          setTimerSettings((prev) => ({
                            ...prev,
                            minutes: Math.max(0, parseInt(e.target.value) || 0),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Seconds</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={timerSettings.seconds}
                        onChange={(e) =>
                          setTimerSettings((prev) => ({
                            ...prev,
                            seconds: Math.max(0, parseInt(e.target.value) || 0),
                          }))
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div className="mb-4 font-mono text-4xl font-bold leading-none text-white sm:text-6xl md:text-8xl">
                    {formatTimerTime(timerTime)}
                  </div>

                  {timerInitialTime > 0 && (
                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-100"
                        style={{
                          width: `${((timerInitialTime - timerTime) / timerInitialTime) * 100}%`,
                        }}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                    {!timerRunning ? (
                      <Button
                        onClick={startTimer}
                        size="lg"
                        className="min-w-[100px] bg-green-600 text-sm hover:bg-green-700 sm:text-base"
                        disabled={
                          timerSettings.hours === 0 &&
                          timerSettings.minutes === 0 &&
                          timerSettings.seconds === 0 &&
                          timerTime === 0
                        }
                      >
                        <Play className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        onClick={pauseTimer}
                        size="lg"
                        className="min-w-[100px] bg-yellow-600 text-sm hover:bg-yellow-700 sm:text-base"
                      >
                        <Pause className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                        Pause
                      </Button>
                    )}

                    {timerTime !== 0 && (
                      <Button
                        onClick={resetTimer}
                        size="lg"
                        variant="outline"
                        className="min-w-[80px] text-sm text-red-600 hover:bg-red-500 sm:text-base"
                      >
                        <Square className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                        Stop
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timer Presets */}
            <div className="mt-4 sm:mt-6">
              <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:mb-4 sm:flex-row sm:items-center">
                <h3 className="text-base font-semibold text-white sm:text-lg">
                  Timer Presets
                </h3>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetPresets()}
                    className="flex items-center gap-1 text-xs sm:gap-2 sm:text-sm"
                  >
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Reset Presets</span>
                    <span className="sm:hidden">Reset</span>
                  </Button>

                  <Dialog
                    open={showPresetDialog}
                    onOpenChange={setShowPresetDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPresetDialog()}
                        className="flex items-center gap-1 text-xs sm:gap-2 sm:text-sm"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Add Preset</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] w-[95vw] max-w-[425px] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">
                          {editingPreset ? "Edit Preset" : "Add Preset"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-3 py-4 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={presetForm.name}
                            onChange={(e) =>
                              setPresetForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Enter preset name"
                            className="text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Hours</Label>
                            <Input
                              type="number"
                              min="0"
                              max="23"
                              value={presetForm.hours}
                              onChange={(e) =>
                                setPresetForm((prev) => ({
                                  ...prev,
                                  hours: Math.max(
                                    0,
                                    parseInt(e.target.value) || 0,
                                  ),
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Minutes
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={presetForm.minutes}
                              onChange={(e) =>
                                setPresetForm((prev) => ({
                                  ...prev,
                                  minutes: Math.max(
                                    0,
                                    parseInt(e.target.value) || 0,
                                  ),
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Seconds
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={presetForm.seconds}
                              onChange={(e) =>
                                setPresetForm((prev) => ({
                                  ...prev,
                                  seconds: Math.max(
                                    0,
                                    parseInt(e.target.value) || 0,
                                  ),
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="icon" className="text-sm font-medium">
                            Icon
                          </Label>
                          <Select
                            value={presetForm.icon}
                            onValueChange={(value) =>
                              setPresetForm((prev) => ({
                                ...prev,
                                icon: value,
                              }))
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Timer">Timer</SelectItem>
                              <SelectItem value="Laptop">Laptop</SelectItem>
                              <SelectItem value="Coffee">Coffee</SelectItem>
                              <SelectItem value="Moon">Moon</SelectItem>
                              <SelectItem value="Clock">Clock</SelectItem>
                              <SelectItem value="Users">Users</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="color"
                            className="text-sm font-medium"
                          >
                            Color
                          </Label>
                          <Select
                            value={presetForm.color}
                            onValueChange={(value) =>
                              setPresetForm((prev) => ({
                                ...prev,
                                color: value,
                              }))
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bg-red-500">Red</SelectItem>
                              <SelectItem value="bg-blue-500">Blue</SelectItem>
                              <SelectItem value="bg-green-500">
                                Green
                              </SelectItem>
                              <SelectItem value="bg-yellow-500">
                                Yellow
                              </SelectItem>
                              <SelectItem value="bg-purple-500">
                                Purple
                              </SelectItem>
                              <SelectItem value="bg-orange-500">
                                Orange
                              </SelectItem>
                              <SelectItem value="bg-pink-500">Pink</SelectItem>
                              <SelectItem value="bg-indigo-500">
                                Indigo
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex flex-col justify-end gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          onClick={() => setShowPresetDialog(false)}
                          className="text-sm"
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={savePreset}
                          className="text-sm"
                          size="sm"
                        >
                          {editingPreset ? "Update" : "Save"} Preset
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="md::grid-cols-2 grid grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {timerPresets.map((preset) => {
                  const IconComponent = getIconComponent(preset.icon);

                  return (
                    <Card
                      key={preset.id}
                      className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                      onClick={() => applyPreset(preset)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div
                            className={`h-6 w-6 rounded-full sm:h-8 sm:w-8 ${preset.color} flex items-center justify-center`}
                          >
                            <IconComponent className="h-3 w-3 text-white sm:h-4 sm:w-4" />
                          </div>
                          <div className="flex gap-0.5 sm:gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-slate-100 sm:h-6 sm:w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPresetDialog(preset);
                              }}
                            >
                              <Edit3 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-red-600 hover:bg-red-50 sm:h-6 sm:w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePreset(preset.id);
                              }}
                            >
                              <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-1 truncate text-xs font-semibold sm:text-sm">
                            {preset.name}
                          </h4>
                          <p className="font-mono text-xs text-slate-600">
                            {preset.hours}H:
                            {preset.minutes.toString().padStart(2, "0")}M:
                            {preset.seconds.toString().padStart(2, "0")}S
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {showSettings && (
            <Card className="mt-3 shadow-lg sm:mt-5">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {activeTab === "stopwatch" ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1 text-sm sm:gap-2 sm:text-base">
                        {stopwatchSettings.soundEnabled ? (
                          <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        Sound Effects
                      </Label>
                      <Switch
                        checked={stopwatchSettings.soundEnabled}
                        onCheckedChange={(checked) =>
                          setStopwatchSettings((prev) => ({
                            ...prev,
                            soundEnabled: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm sm:text-base">Lap Sound</Label>
                      <Switch
                        checked={stopwatchSettings.lapSoundEnabled}
                        onCheckedChange={(checked) =>
                          setStopwatchSettings((prev) => ({
                            ...prev,
                            lapSoundEnabled: checked,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-sm sm:text-base">Precision</Label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Button
                          variant={
                            stopwatchSettings.precision === "centiseconds"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setStopwatchSettings((prev) => ({
                              ...prev,
                              precision: "centiseconds",
                            }))
                          }
                          className="text-xs sm:text-sm"
                        >
                          Centiseconds
                        </Button>
                        <Button
                          variant={
                            stopwatchSettings.precision === "milliseconds"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setStopwatchSettings((prev) => ({
                              ...prev,
                              precision: "milliseconds",
                            }))
                          }
                          className="text-xs sm:text-sm"
                        >
                          Milliseconds
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1 text-sm sm:gap-2 sm:text-base">
                        {timerSettings.soundEnabled ? (
                          <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        Sound Notifications
                      </Label>
                      <Switch
                        checked={timerSettings.soundEnabled}
                        onCheckedChange={(checked) =>
                          setTimerSettings((prev) => ({
                            ...prev,
                            soundEnabled: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm sm:text-base">
                        Auto Restart
                      </Label>
                      <Switch
                        checked={timerSettings.autoRestart}
                        onCheckedChange={(checked) =>
                          setTimerSettings((prev) => ({
                            ...prev,
                            autoRestart: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm sm:text-base">
                        Hide Milliseconds
                      </Label>
                      <Switch
                        checked={timerSettings.hideMilliseconds}
                        onCheckedChange={(checked) =>
                          setTimerSettings((prev) => ({
                            ...prev,
                            hideMilliseconds: checked,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-sm sm:text-base">
                        Custom Message
                      </Label>
                      <Input
                        value={timerSettings.customMessage}
                        onChange={(e) =>
                          setTimerSettings((prev) => ({
                            ...prev,
                            customMessage: e.target.value,
                          }))
                        }
                        placeholder="Timer finished!"
                        className="mt-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                <Separator />

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY);
                    setTimerSettings({
                      hours: 0,
                      minutes: 5,
                      seconds: 0,
                      soundEnabled: true,
                      autoRestart: false,
                      customMessage: "Timer finished!",
                      hideMilliseconds: true,
                    });
                    setStopwatchSettings({
                      soundEnabled: true,
                      lapSoundEnabled: true,
                      precision: "centiseconds",
                    });
                  }}
                  className="w-full text-xs sm:text-sm"
                >
                  <RotateCcw className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  Reset All Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </Tabs>
    </ToolsWrapper>
  );
}
