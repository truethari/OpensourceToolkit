"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Copy,
  Check,
  Download,
  Keyboard,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface KeyEvent {
  id: string;
  key: string;
  code: string;
  keyCode: number;
  which: number;
  location: number;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  timestamp: number;
  type: "keydown" | "keyup" | "keypress";
}

interface KeyStats {
  totalKeys: number;
  uniqueKeys: number;
  averageSpeed: number;
  longestHold: number;
  shortestPress: number;
  mostPressed: string;
}

interface TypingTest {
  text: string;
  completed: boolean;
  wpm: number;
  accuracy: number;
  errors: number;
  startTime: number;
  endTime: number;
}

const defaultTexts = [
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with five dozen liquor jugs.",
  "Waltz, bad nymph, for quick jigs vex.",
  "How vexingly quick daft zebras jump!",
  "The five boxing wizards jump quickly.",
];

export default function KeyboardTester() {
  const [isListening, setIsListening] = useState(false);
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>([]);
  const [currentKey, setCurrentKey] = useState<KeyEvent | null>(null);
  const [keyStats, setKeyStats] = useState<KeyStats>({
    totalKeys: 0,
    uniqueKeys: 0,
    averageSpeed: 0,
    longestHold: 0,
    shortestPress: 0,
    mostPressed: "",
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showKeyCode, setShowKeyCode] = useState(true);
  const [showModifiers, setShowModifiers] = useState(true);
  const [filterKey, setFilterKey] = useState("");
  const [typingTest, setTypingTest] = useState<TypingTest>({
    text: defaultTexts[0],
    completed: false,
    wpm: 0,
    accuracy: 0,
    errors: 0,
    startTime: 0,
    endTime: 0,
  });
  const [typingInput, setTypingInput] = useState("");
  const [isTypingTestActive, setIsTypingTestActive] = useState(false);
  const [selectedText, setSelectedText] = useState(0);
  const typingInputRef = useRef<HTMLInputElement>(null);
  const keyPressStartTimes = useRef<Map<string, number>>(new Map());

  const playKeySound = useCallback(() => {
    if (soundEnabled) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  }, [soundEnabled]);

  const handleKeyEvent = useCallback(
    (event: KeyboardEvent, type: "keydown" | "keyup" | "keypress") => {
      if (!isListening) return;

      // Don't interfere with typing test
      if (
        isTypingTestActive &&
        document.activeElement === typingInputRef.current
      ) {
        return;
      }

      const keyEvent: KeyEvent = {
        id: Date.now().toString() + Math.random(),
        key: event.key,
        code: event.code,
        keyCode: event.keyCode || 0, // Legacy property, kept for compatibility
        which: event.which || 0, // Legacy property, kept for compatibility
        location: event.location,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        repeat: event.repeat,
        timestamp: Date.now(),
        type,
      };

      if (type === "keydown") {
        keyPressStartTimes.current.set(event.code, Date.now());
        setCurrentKey(keyEvent);
        playKeySound();
      } else if (type === "keyup") {
        const startTime = keyPressStartTimes.current.get(event.code);
        if (startTime) {
          const holdDuration = Date.now() - startTime;
          keyEvent.timestamp = holdDuration; // Store hold duration in timestamp for keyup events
          keyPressStartTimes.current.delete(event.code);
        }
        setCurrentKey(null);
      }

      setKeyEvents((prev) => [keyEvent, ...prev.slice(0, 99)]); // Keep only last 100 events
    },
    [isListening, isTypingTestActive, playKeySound],
  );

  const calculateStats = useCallback(() => {
    const keydownEvents = keyEvents.filter((e) => e.type === "keydown");
    const keyupEvents = keyEvents.filter((e) => e.type === "keyup");

    if (keydownEvents.length === 0) {
      setKeyStats({
        totalKeys: 0,
        uniqueKeys: 0,
        averageSpeed: 0,
        longestHold: 0,
        shortestPress: 0,
        mostPressed: "",
      });
      return;
    }

    const uniqueKeys = new Set(keydownEvents.map((e) => e.key)).size;
    const keyCount = keydownEvents.reduce(
      (acc, event) => {
        acc[event.key] = (acc[event.key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostPressed = Object.keys(keyCount).reduce(
      (a, b) => (keyCount[a] > keyCount[b] ? a : b),
      "",
    );

    const holdDurations = keyupEvents
      .map((e) => e.timestamp)
      .filter((d) => d > 0);
    const longestHold =
      holdDurations.length > 0 ? Math.max(...holdDurations) : 0;
    const shortestPress =
      holdDurations.length > 0 ? Math.min(...holdDurations) : 0;

    // Calculate WPM based on recent key presses
    const recentEvents = keydownEvents.slice(0, 20);
    const timeSpan =
      recentEvents.length > 1
        ? (recentEvents[0].timestamp -
            recentEvents[recentEvents.length - 1].timestamp) /
          1000 /
          60
        : 0;
    const averageSpeed = timeSpan > 0 ? recentEvents.length / 5 / timeSpan : 0; // WPM

    setKeyStats({
      totalKeys: keydownEvents.length,
      uniqueKeys,
      averageSpeed: Math.round(averageSpeed),
      longestHold,
      shortestPress,
      mostPressed,
    });
  }, [keyEvents]);

  const startListening = () => {
    setIsListening(true);
    setKeyEvents([]);
    setCurrentKey(null);
  };

  const stopListening = () => {
    setIsListening(false);
    setCurrentKey(null);
  };

  const clearEvents = () => {
    setKeyEvents([]);
    setCurrentKey(null);
    keyPressStartTimes.current.clear();
  };

  const exportData = () => {
    const data = {
      events: keyEvents,
      stats: keyStats,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keyboard-test-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getKeyDisplay = (event: KeyEvent) => {
    let display = event.key;
    if (event.key === " ") display = "Space";
    if (event.key === "Enter") display = "Enter";
    if (event.key === "Tab") display = "Tab";
    if (event.key === "Escape") display = "Escape";
    if (event.key === "Backspace") display = "Backspace";
    if (event.key === "Delete") display = "Delete";
    return display;
  };

  const getModifierString = (event: KeyEvent) => {
    const modifiers = [];
    if (event.ctrlKey) modifiers.push("Ctrl");
    if (event.altKey) modifiers.push("Alt");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.metaKey) modifiers.push("Meta");
    return modifiers.join(" + ");
  };

  const startTypingTest = () => {
    setTypingInput("");
    setIsTypingTestActive(true);
    setTypingTest((prev) => ({
      ...prev,
      startTime: Date.now(),
      completed: false,
      errors: 0,
    }));
    setTimeout(() => typingInputRef.current?.focus(), 100);
  };

  const handleTypingInputChange = (value: string) => {
    if (!isTypingTestActive) return;

    setTypingInput(value);

    const targetText = typingTest.text;
    let errors = 0;

    for (let i = 0; i < value.length; i++) {
      if (i >= targetText.length || value[i] !== targetText[i]) {
        errors++;
      }
    }

    if (value === targetText) {
      const endTime = Date.now();
      const duration = (endTime - typingTest.startTime) / 1000 / 60; // minutes
      const wpm = Math.round(targetText.length / 5 / duration);
      const accuracy = Math.round(
        ((targetText.length - errors) / targetText.length) * 100,
      );

      setTypingTest((prev) => ({
        ...prev,
        completed: true,
        endTime,
        wpm,
        accuracy,
        errors,
      }));
      setIsTypingTestActive(false);
    } else {
      setTypingTest((prev) => ({
        ...prev,
        errors,
      }));
    }
  };

  const resetTypingTest = () => {
    setTypingInput("");
    setIsTypingTestActive(false);
    setTypingTest((prev) => ({
      ...prev,
      completed: false,
      wpm: 0,
      accuracy: 0,
      errors: 0,
    }));
  };

  const changeTypingText = (index: number) => {
    setSelectedText(index);
    setTypingTest((prev) => ({
      ...prev,
      text: defaultTexts[index],
    }));
    resetTypingTest();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => handleKeyEvent(e, "keydown");
    const handleKeyUp = (e: KeyboardEvent) => handleKeyEvent(e, "keyup");
    const handleKeyPress = (e: KeyboardEvent) => handleKeyEvent(e, "keypress");

    if (isListening) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
      document.addEventListener("keypress", handleKeyPress);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("keypress", handleKeyPress);
    };
  }, [isListening, handleKeyEvent]);

  useEffect(() => {
    calculateStats();
  }, [keyEvents, calculateStats]);

  const filteredEvents = filterKey
    ? keyEvents.filter(
        (e) =>
          e.key.toLowerCase().includes(filterKey.toLowerCase()) ||
          e.code.toLowerCase().includes(filterKey.toLowerCase()),
      )
    : keyEvents;

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Keyboard Tester</h1>
        <p className="text-muted-foreground">
          Test keyboard functionality, monitor key presses, typing speed, and
          key response times
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Key Monitoring
          </CardTitle>
          <CardDescription>
            Start monitoring to capture and analyze keyboard events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={isListening ? stopListening : startListening}
              className={
                isListening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }
            >
              {isListening ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isListening ? "Stop Monitoring" : "Start Monitoring"}
            </Button>

            <Button onClick={clearEvents} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Data
            </Button>

            <Button
              onClick={exportData}
              variant="outline"
              disabled={keyEvents.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
              <Label htmlFor="sound">Key Sound</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="keycode"
                checked={showKeyCode}
                onCheckedChange={setShowKeyCode}
              />
              <Label htmlFor="keycode">Show Key Codes</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="modifiers"
                checked={showModifiers}
                onCheckedChange={setShowModifiers}
              />
              <Label htmlFor="modifiers">Show Modifiers</Label>
            </div>
          </div>

          <div
            className={`rounded-lg p-4 transition-all duration-200 ${
              currentKey
                ? "border-2 border-primary bg-muted"
                : "border-2 border-muted bg-muted/30"
            }`}
          >
            <h4 className="mb-2 font-semibold">Currently Pressed:</h4>
            <div
              className={`text-2xl font-bold transition-opacity duration-200 ${
                currentKey ? "opacity-100" : "opacity-40"
              }`}
            >
              {currentKey ? getKeyDisplay(currentKey) : "No key pressed"}
            </div>
            {showKeyCode && (
              <div
                className={`mt-2 font-mono text-sm text-muted-foreground transition-opacity duration-200 ${
                  currentKey ? "opacity-100" : "opacity-40"
                }`}
              >
                {currentKey
                  ? `Code: ${currentKey.code} | KeyCode: ${currentKey.keyCode}`
                  : "Code: --- | KeyCode: ---"}
              </div>
            )}
            {showModifiers && (
              <div
                className={`mt-1 text-sm transition-opacity duration-200 ${
                  currentKey ? "opacity-100" : "opacity-40"
                }`}
              >
                {currentKey && getModifierString(currentKey)
                  ? `Modifiers: ${getModifierString(currentKey)}`
                  : "Modifiers: None"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{keyStats.totalKeys}</div>
              <div className="text-sm text-muted-foreground">Total Keys</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{keyStats.uniqueKeys}</div>
              <div className="text-sm text-muted-foreground">Unique Keys</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{keyStats.averageSpeed}</div>
              <div className="text-sm text-muted-foreground">Avg WPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{keyStats.mostPressed}</div>
              <div className="text-sm text-muted-foreground">Most Pressed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Key Events</TabsTrigger>
          <TabsTrigger value="typing">Typing Test</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Key Event Log</CardTitle>
              <CardDescription>
                Real-time log of keyboard events and their properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Filter by key or code..."
                  value={filterKey}
                  onChange={(e) => setFilterKey(e.target.value)}
                  className="max-w-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(
                      filteredEvents
                        .map(
                          (e) =>
                            `${e.type}: ${e.key} (${e.code}) ${getModifierString(e)}`,
                        )
                        .join("\n"),
                      "events",
                    )
                  }
                  disabled={filteredEvents.length === 0}
                >
                  {copiedField === "events" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto rounded-lg border">
                {filteredEvents.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {isListening
                      ? "Press any key to see events..."
                      : "Start monitoring to capture events"}
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between rounded p-2 text-sm hover:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              event.type === "keydown"
                                ? "default"
                                : event.type === "keyup"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {event.type}
                          </Badge>
                          <span className="font-medium">
                            {getKeyDisplay(event)}
                          </span>
                          {showModifiers && getModifierString(event) && (
                            <span className="text-muted-foreground">
                              + {getModifierString(event)}
                            </span>
                          )}
                        </div>
                        {showKeyCode && (
                          <div className="font-mono text-xs text-muted-foreground">
                            {event.code} | {event.keyCode}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typing">
          <Card>
            <CardHeader>
              <CardTitle>Typing Speed Test</CardTitle>
              <CardDescription>
                Test your typing speed and accuracy with various texts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <Label>Select Test Text</Label>
                  <Select
                    value={selectedText.toString()}
                    onValueChange={(value) => changeTypingText(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultTexts.map((text, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {text.substring(0, 50)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={startTypingTest}
                    disabled={isTypingTestActive}
                  >
                    Start Test
                  </Button>
                  <Button onClick={resetTypingTest} variant="outline">
                    Reset
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="mb-4 text-lg leading-relaxed">
                  {typingTest.text.split("").map((char, index) => {
                    let className = "border-b-2 border-transparent";
                    if (index < typingInput.length) {
                      className =
                        typingInput[index] === char
                          ? "bg-green-200 border-green-500"
                          : "bg-red-200 border-red-500";
                    } else if (
                      index === typingInput.length &&
                      isTypingTestActive
                    ) {
                      className = "border-blue-500 border-b-2 animate-pulse";
                    }
                    return (
                      <span key={index} className={className}>
                        {char}
                      </span>
                    );
                  })}
                </div>

                <Input
                  ref={typingInputRef}
                  value={typingInput}
                  onChange={(e) => handleTypingInputChange(e.target.value)}
                  placeholder="Start typing the text above..."
                  disabled={!isTypingTestActive}
                  className="font-mono"
                />
              </div>

              {typingTest.completed && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {typingTest.wpm}
                    </div>
                    <div className="text-sm text-muted-foreground">WPM</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {typingTest.accuracy}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Accuracy
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {typingTest.errors}
                    </div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {Math.round(
                        (typingTest.endTime - typingTest.startTime) / 1000,
                      )}
                      s
                    </div>
                    <div className="text-sm text-muted-foreground">Time</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Keyboard Analytics</CardTitle>
              <CardDescription>
                Detailed analysis of your keyboard usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold">Key Press Statistics</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Key Presses:</span>
                      <span className="font-mono">{keyStats.totalKeys}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique Keys Used:</span>
                      <span className="font-mono">{keyStats.uniqueKeys}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Typing Speed:</span>
                      <span className="font-mono">
                        {keyStats.averageSpeed} WPM
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Most Pressed Key:</span>
                      <span className="font-mono">
                        {keyStats.mostPressed || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Key Hold Times</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Longest Hold:</span>
                      <span className="font-mono">
                        {keyStats.longestHold}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shortest Press:</span>
                      <span className="font-mono">
                        {keyStats.shortestPress}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Events:</span>
                      <span className="font-mono">{keyEvents.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold">Event Type Distribution</h4>
                <div className="grid grid-cols-3 gap-4">
                  {["keydown", "keyup", "keypress"].map((type) => {
                    const count = keyEvents.filter(
                      (e) => e.type === type,
                    ).length;
                    const percentage =
                      keyEvents.length > 0
                        ? ((count / keyEvents.length) * 100).toFixed(1)
                        : "0";
                    return (
                      <div key={type} className="text-center">
                        <div className="text-xl font-bold">{count}</div>
                        <div className="text-sm text-muted-foreground">
                          {type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {percentage}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold">Raw Event Data</h4>
                <div className="max-h-40 overflow-y-auto rounded border bg-muted/50 p-3 font-mono text-xs">
                  {keyEvents.length === 0 ? (
                    <div className="text-muted-foreground">
                      No event data available
                    </div>
                  ) : (
                    keyEvents.slice(0, 10).map((event) => (
                      <div key={event.id} className="mb-1">
                        {JSON.stringify({
                          type: event.type,
                          key: event.key,
                          code: event.code,
                          modifiers: {
                            ctrl: event.ctrlKey,
                            alt: event.altKey,
                            shift: event.shiftKey,
                            meta: event.metaKey,
                          },
                        })}
                      </div>
                    ))
                  )}
                </div>
                {keyEvents.length > 10 && (
                  <div className="text-xs text-muted-foreground">
                    Showing first 10 of {keyEvents.length} events
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>About Keyboard Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Real-time key press monitoring</li>
                <li>• Detailed event logging with modifiers</li>
                <li>• Typing speed and accuracy testing</li>
                <li>• Key hold time measurement</li>
                <li>• Sound feedback for key presses</li>
                <li>• Export data in JSON format</li>
                <li>• Filtering and search capabilities</li>
                <li>• Comprehensive analytics dashboard</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Use Cases</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Testing keyboard functionality</li>
                <li>• Measuring typing performance</li>
                <li>• Debugging keyboard input issues</li>
                <li>• Keyboard response time analysis</li>
                <li>• Gaming key press testing</li>
                <li>• Accessibility testing</li>
                <li>• Quality assurance testing</li>
                <li>• Educational typing practice</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
