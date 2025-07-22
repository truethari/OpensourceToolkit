"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Copy,
  Info,
  Play,
  Check,
  Waves,
  Square,
  Speaker,
  Volume2,
  Activity,
  Settings,
  RotateCcw,
  Headphones,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface AudioTestResult {
  id: string;
  channel: string;
  frequency: number;
  volume: number;
  duration: number;
  timestamp: string;
  success: boolean;
  deviceInfo?: string;
}

interface SpeakerConfiguration {
  id: string;
  name: string;
  description: string;
  channels: { name: string; position: string; testFreq?: number }[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const speakerConfigurations: SpeakerConfiguration[] = [
  {
    id: "mono",
    name: "Mono",
    description: "Single channel audio",
    channels: [{ name: "Center", position: "center", testFreq: 440 }],
    icon: Speaker,
  },
  {
    id: "stereo",
    name: "Stereo (2.0)",
    description: "Left and right channels",
    channels: [
      { name: "Left", position: "left", testFreq: 440 },
      { name: "Right", position: "right", testFreq: 880 },
    ],
    icon: Headphones,
  },
  {
    id: "2.1",
    name: "2.1 Surround",
    description: "Stereo with subwoofer",
    channels: [
      { name: "Left", position: "left", testFreq: 440 },
      { name: "Right", position: "right", testFreq: 880 },
      { name: "Subwoofer", position: "center", testFreq: 60 },
    ],
    icon: Volume2,
  },
  {
    id: "4.0",
    name: "4.0 Surround",
    description: "Front and rear speakers",
    channels: [
      { name: "Front Left", position: "front-left", testFreq: 440 },
      { name: "Front Right", position: "front-right", testFreq: 880 },
      { name: "Rear Left", position: "rear-left", testFreq: 330 },
      { name: "Rear Right", position: "rear-right", testFreq: 550 },
    ],
    icon: Waves,
  },
  {
    id: "5.1",
    name: "5.1 Surround",
    description: "5 speakers + subwoofer",
    channels: [
      { name: "Front Left", position: "front-left", testFreq: 440 },
      { name: "Front Right", position: "front-right", testFreq: 880 },
      { name: "Center", position: "center", testFreq: 660 },
      { name: "Rear Left", position: "rear-left", testFreq: 330 },
      { name: "Rear Right", position: "rear-right", testFreq: 550 },
      { name: "Subwoofer", position: "center", testFreq: 60 },
    ],
    icon: Volume2,
  },
  {
    id: "7.1",
    name: "7.1 Surround",
    description: "7 speakers + subwoofer",
    channels: [
      { name: "Front Left", position: "front-left", testFreq: 440 },
      { name: "Front Right", position: "front-right", testFreq: 880 },
      { name: "Center", position: "center", testFreq: 660 },
      { name: "Rear Left", position: "rear-left", testFreq: 330 },
      { name: "Rear Right", position: "rear-right", testFreq: 550 },
      { name: "Side Left", position: "side-left", testFreq: 370 },
      { name: "Side Right", position: "side-right", testFreq: 740 },
      { name: "Subwoofer", position: "center", testFreq: 60 },
    ],
    icon: Volume2,
  },
  {
    id: "custom",
    name: "Custom Test",
    description: "Manual frequency and channel testing",
    channels: [],
    icon: Settings,
  },
];

const testFrequencies = [
  { label: "20 Hz (Deep Bass)", value: 20 },
  { label: "60 Hz (Bass)", value: 60 },
  { label: "100 Hz (Low Bass)", value: 100 },
  { label: "200 Hz (Low Mid)", value: 200 },
  { label: "440 Hz (A4 Note)", value: 440 },
  { label: "880 Hz (A5 Note)", value: 880 },
  { label: "1000 Hz (Mid)", value: 1000 },
  { label: "2000 Hz (High Mid)", value: 2000 },
  { label: "4000 Hz (High)", value: 4000 },
  { label: "8000 Hz (Very High)", value: 8000 },
  { label: "16000 Hz (Ultra High)", value: 16000 },
];

export default function SpeakerTester() {
  const [selectedConfig, setSelectedConfig] = useState("stereo");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChannel, setCurrentChannel] = useState("");
  const [volume, setVolume] = useState([0.5]);
  const [frequency, setFrequency] = useState(440);
  const [duration, setDuration] = useState(2);
  const [autoTest, setAutoTest] = useState(false);
  const [testResults, setTestResults] = useState<AudioTestResult[]>([]);
  const [copiedResult, setCopiedResult] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{
    totalDevices: number;
    audioOutputs: number;
    devices: { id: string; label: string }[];
  } | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamDestinationRef =
    useRef<MediaStreamAudioDestinationNode | null>(null);

  useEffect(() => {
    initializeAudioContext();
    initializeAudioElement();
    getAudioDeviceInfo();
    return () => {
      stopSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioElementRef.current) {
        audioElementRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (audioElementRef.current && selectedDeviceId) {
      setAudioOutputDevice();
    }
  }, [selectedDeviceId]);

  const initializeAudioContext = () => {
    try {
      audioContextRef.current = new (window.AudioContext ||
        (
          window as unknown as Window & {
            webkitAudioContext: typeof AudioContext;
          }
        ).webkitAudioContext)();
    } catch {
      setResult("Error: Web Audio API not supported in this browser");
    }
  };

  const initializeAudioElement = () => {
    if (!audioElementRef.current) {
      const audioElement = document.createElement("audio");
      audioElement.style.display = "none";
      audioElement.autoplay = true;
      document.body.appendChild(audioElement);
      audioElementRef.current = audioElement;
    }
  };

  const setAudioOutputDevice = async () => {
    if (audioElementRef.current && selectedDeviceId) {
      try {
        if ("setSinkId" in audioElementRef.current) {
          await (
            audioElementRef.current as HTMLAudioElement & {
              setSinkId: (sinkId: string) => Promise<void>;
            }
          ).setSinkId(selectedDeviceId);
          setResult(
            `Audio output set to: ${deviceInfo?.devices.find((d) => d.id === selectedDeviceId)?.label || "Unknown Device"}`,
          );
        } else {
          setResult("Device selection not supported in this browser");
        }
      } catch (error) {
        setResult(`Error setting audio device: ${error}`);
      }
    }
  };

  const getAudioDeviceInfo = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(
        (device) => device.kind === "audiooutput",
      );

      // Filter out devices with empty IDs and create device list
      const deviceList = audioOutputs
        .filter((d) => d.deviceId && d.deviceId.trim() !== "")
        .map((d, index) => ({
          id: d.deviceId,
          label: d.label || `Unknown Device ${index + 1}`,
        }));

      // Add default device option
      const devicesWithDefault = [
        { id: "default", label: "System Default" },
        ...deviceList,
      ];

      setDeviceInfo({
        totalDevices: devices.length,
        audioOutputs: audioOutputs.length,
        devices: devicesWithDefault,
      });

      // Set first available device as default if not already set
      if (deviceList.length > 0 && selectedDeviceId === "default") {
        setSelectedDeviceId("default");
      }
    } catch {
      console.error("Error getting device info");
    }
  };

  const playSound = (
    freq: number,
    channelPosition: string,
    channelName: string,
  ) => {
    if (!audioContextRef.current || !audioElementRef.current) {
      setResult("Audio context or audio element not available");
      return;
    }

    stopSound();

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      const pannerNode = audioContextRef.current.createStereoPanner();
      const mediaStreamDestination =
        audioContextRef.current.createMediaStreamDestination();

      oscillator.frequency.setValueAtTime(
        freq,
        audioContextRef.current.currentTime,
      );
      oscillator.type =
        freq < 100 ? "sawtooth" : freq > 2000 ? "sine" : "square";

      gainNode.gain.setValueAtTime(
        volume[0],
        audioContextRef.current.currentTime,
      );

      // Set panning based on channel position
      let panValue = 0;
      switch (channelPosition) {
        case "left":
        case "front-left":
        case "rear-left":
        case "side-left":
          panValue = -1;
          break;
        case "right":
        case "front-right":
        case "rear-right":
        case "side-right":
          panValue = 1;
          break;
        case "center":
        default:
          panValue = 0;
          break;
      }
      pannerNode.pan.setValueAtTime(
        panValue,
        audioContextRef.current.currentTime,
      );

      // Connect audio nodes: oscillator -> gain -> panner -> MediaStreamDestination
      oscillator.connect(gainNode);
      gainNode.connect(pannerNode);
      pannerNode.connect(mediaStreamDestination);

      // Set the MediaStream as the source for the audio element
      audioElementRef.current.srcObject = mediaStreamDestination.stream;
      audioElementRef.current.play();

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + duration);

      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
      pannerNodeRef.current = pannerNode;
      mediaStreamDestinationRef.current = mediaStreamDestination;

      setIsPlaying(true);
      setCurrentChannel(channelName);

      oscillator.onended = () => {
        setIsPlaying(false);
        setCurrentChannel("");
        addTestResult(channelName, freq, volume[0], duration, true);
      };

      setResult(
        `Playing ${freq}Hz tone on ${channelName} channel via ${deviceInfo?.devices.find((d) => d.id === selectedDeviceId)?.label || "System Default"}`,
      );
    } catch (error) {
      setResult(`Error playing sound: ${error}`);
      addTestResult(channelName, freq, volume[0], duration, false);
    }
  };

  const stopSound = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop(0);
        oscillatorRef.current.disconnect();
      } catch {
        // Oscillator might already be stopped
      }
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch {
        // Already disconnected
      }
      gainNodeRef.current = null;
    }
    if (pannerNodeRef.current) {
      try {
        pannerNodeRef.current.disconnect();
      } catch {
        // Already disconnected
      }
      pannerNodeRef.current = null;
    }
    if (mediaStreamDestinationRef.current) {
      try {
        mediaStreamDestinationRef.current.disconnect();
      } catch {
        // Already disconnected
      }
      mediaStreamDestinationRef.current = null;
    }
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.srcObject = null;
      } catch {
        // Already paused or no source
      }
    }
    setIsPlaying(false);
    setCurrentChannel("");
  };

  const addTestResult = (
    channel: string,
    freq: number,
    vol: number,
    dur: number,
    success: boolean,
  ) => {
    const testResult: AudioTestResult = {
      id: Math.random().toString(36).substring(2, 11),
      channel,
      frequency: freq,
      volume: vol,
      duration: dur,
      timestamp: new Date().toLocaleTimeString(),
      success,
      deviceInfo: deviceInfo
        ? `${deviceInfo.audioOutputs} output devices`
        : undefined,
    };
    setTestResults((prev) => [testResult, ...prev.slice(0, 19)]);
  };

  const runAutoTest = async () => {
    const config = speakerConfigurations.find((c) => c.id === selectedConfig);
    if (!config || config.channels.length === 0) return;

    setAutoTest(true);
    setResult("Running automatic speaker test...");

    for (let i = 0; i < config.channels.length; i++) {
      const channel = config.channels[i];
      const testFreq = channel.testFreq || 440;

      await new Promise((resolve) => {
        playSound(testFreq, channel.position, channel.name);
        setTimeout(resolve, (duration + 0.5) * 1000);
      });
    }

    setAutoTest(false);
    setResult(`Completed testing ${config.channels.length} channels`);
  };

  const clearResults = () => {
    setTestResults([]);
    setResult(null);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedResult(type);
      setTimeout(() => setCopiedResult(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const exportResults = () => {
    const exportData = {
      testSession: new Date().toISOString(),
      configuration: selectedConfig,
      deviceInfo,
      results: testResults,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `speaker-test-results-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedConfiguration = speakerConfigurations.find(
    (c) => c.id === selectedConfig,
  );

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Speaker Testing Tool</h1>
        <p className="text-muted-foreground">
          Test speakers and audio systems with multiple configurations including
          mono, stereo, surround sound, and custom frequency testing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Device Information
          </CardTitle>
          <CardDescription>
            Current audio output device information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deviceInfo && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {deviceInfo.audioOutputs}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Audio Output Devices
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {deviceInfo.totalDevices}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Media Devices
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {audioContextRef.current?.sampleRate || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Sample Rate (Hz)
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="device-selector">Output Device</Label>
                <Select
                  value={selectedDeviceId}
                  onValueChange={setSelectedDeviceId}
                >
                  <SelectTrigger id="device-selector">
                    <SelectValue placeholder="Select audio output device" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceInfo.devices
                      .filter((device) => device.id && device.id.trim() !== "")
                      .map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Select the audio output device for speaker testing. Changes
                  apply to new tests.
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="configurations" className="space-y-4">
        <div className="flex flex-col gap-2">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="configurations">Configurations</TabsTrigger>
            <TabsTrigger value="custom">Custom Test</TabsTrigger>
            <TabsTrigger value="frequency" className="hidden md:block">
              Frequency Test
            </TabsTrigger>
            <TabsTrigger value="results" className="hidden md:block">
              Test Results
            </TabsTrigger>
          </TabsList>

          <TabsList className="grid w-full grid-cols-2 md:hidden">
            <TabsTrigger value="frequency">Frequency Test</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="configurations">
          <Card>
            <CardHeader>
              <CardTitle>Speaker Configurations</CardTitle>
              <CardDescription>
                Test different speaker setups with predefined channel
                configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Speaker Configuration</Label>
                  <Select
                    value={selectedConfig}
                    onValueChange={setSelectedConfig}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {speakerConfigurations
                        .filter((config) => config.id !== "custom")
                        .map((config) => (
                          <SelectItem key={config.id} value={config.id}>
                            {config.name} - {config.description}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Test Duration (seconds)</Label>
                  <Input
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={duration}
                    onChange={(e) =>
                      setDuration(parseFloat(e.target.value) || 2)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Volume: {Math.round(volume[0] * 100)}%</Label>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {selectedConfiguration &&
                selectedConfiguration.channels.length > 0 && (
                  <>
                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">
                          {selectedConfiguration.name} Channels (
                          {selectedConfiguration.channels.length})
                        </h4>
                        <Button
                          onClick={runAutoTest}
                          disabled={isPlaying || autoTest}
                          variant="outline"
                        >
                          <Activity className="mr-2 h-4 w-4" />
                          {autoTest ? "Testing..." : "Auto Test All"}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {selectedConfiguration.channels.map(
                          (channel, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between rounded-lg border p-3 ${
                                currentChannel === channel.name
                                  ? "border-primary bg-primary/10"
                                  : ""
                              }`}
                            >
                              <div>
                                <div className="font-medium">
                                  {channel.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {channel.testFreq}Hz
                                </div>
                              </div>
                              <Button
                                onClick={() => {
                                  if (currentChannel === channel.name) {
                                    stopSound();
                                  } else {
                                    playSound(
                                      channel.testFreq || 440,
                                      channel.position,
                                      channel.name,
                                    );
                                  }
                                }}
                                disabled={
                                  isPlaying && currentChannel !== channel.name
                                }
                                size="sm"
                              >
                                {currentChannel === channel.name ? (
                                  <Square className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom Audio Test</CardTitle>
              <CardDescription>
                Test specific frequencies and channels manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Frequency (Hz)</Label>
                  <Input
                    type="number"
                    min="20"
                    max="20000"
                    value={frequency}
                    onChange={(e) =>
                      setFrequency(parseInt(e.target.value) || 440)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={duration}
                    onChange={(e) =>
                      setDuration(parseFloat(e.target.value) || 2)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Volume: {Math.round(volume[0] * 100)}%</Label>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <Button
                  onClick={() => {
                    if (currentChannel === "Left Channel") {
                      stopSound();
                    } else {
                      playSound(frequency, "left", "Left Channel");
                    }
                  }}
                  disabled={isPlaying && currentChannel !== "Left Channel"}
                  variant="outline"
                >
                  {currentChannel === "Left Channel" ? (
                    <Square className="mr-2 h-4 w-4" />
                  ) : (
                    <Volume2 className="mr-2 h-4 w-4" />
                  )}
                  {currentChannel === "Left Channel" ? "Stop" : "Test Left"}
                </Button>
                <Button
                  onClick={() => {
                    if (currentChannel === "Center Channel") {
                      stopSound();
                    } else {
                      playSound(frequency, "center", "Center Channel");
                    }
                  }}
                  disabled={isPlaying && currentChannel !== "Center Channel"}
                  variant="outline"
                >
                  {currentChannel === "Center Channel" ? (
                    <Square className="mr-2 h-4 w-4" />
                  ) : (
                    <Volume2 className="mr-2 h-4 w-4" />
                  )}
                  {currentChannel === "Center Channel" ? "Stop" : "Test Center"}
                </Button>
                <Button
                  onClick={() => {
                    if (currentChannel === "Right Channel") {
                      stopSound();
                    } else {
                      playSound(frequency, "right", "Right Channel");
                    }
                  }}
                  disabled={isPlaying && currentChannel !== "Right Channel"}
                  variant="outline"
                >
                  {currentChannel === "Right Channel" ? (
                    <Square className="mr-2 h-4 w-4" />
                  ) : (
                    <Volume2 className="mr-2 h-4 w-4" />
                  )}
                  {currentChannel === "Right Channel" ? "Stop" : "Test Right"}
                </Button>
              </div>

              {isPlaying && (
                <Button
                  onClick={stopSound}
                  variant="destructive"
                  className="w-full"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Current Test
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frequency">
          <Card>
            <CardHeader>
              <CardTitle>Frequency Response Test</CardTitle>
              <CardDescription>
                Test speaker response across different frequency ranges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {testFrequencies.map((freq) => (
                  <Button
                    key={freq.value}
                    onClick={() => {
                      if (currentChannel === `${freq.value}Hz Test`) {
                        stopSound();
                      } else {
                        playSound(freq.value, "center", `${freq.value}Hz Test`);
                      }
                    }}
                    disabled={
                      isPlaying && currentChannel !== `${freq.value}Hz Test`
                    }
                    variant="outline"
                    className="h-auto p-3 text-left"
                  >
                    <div>
                      <div className="text-center font-medium">
                        {freq.value} Hz
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        {freq.label.split(" ").slice(1).join(" ")}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Volume: {Math.round(volume[0] * 100)}%</Label>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {isPlaying && (
                <Button
                  onClick={stopSound}
                  variant="destructive"
                  className="w-full"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Current Test
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Test Results</span>
                <div className="flex gap-2">
                  <Button
                    onClick={exportResults}
                    disabled={testResults.length === 0}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    onClick={clearResults}
                    disabled={testResults.length === 0}
                    size="sm"
                    variant="outline"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                History of speaker tests and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length > 0 ? (
                <div className="space-y-2">
                  {testResults.map((result) => (
                    <div
                      key={result.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        result.success ? "border-green-700" : "border-red-700"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {result.channel} - {result.frequency}Hz
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Volume: {Math.round(result.volume * 100)}% • Duration:{" "}
                          {result.duration}s • {result.timestamp}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div
                          className={`flex items-center justify-center rounded px-2 py-1 text-center text-xs font-medium ${
                            result.success
                              ? "bg-green-700 text-green-100"
                              : "bg-red-700 text-red-100"
                          }`}
                        >
                          {result.success ? "Success" : "Failed"}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              `${result.channel}: ${result.frequency}Hz at ${Math.round(result.volume * 100)}% volume`,
                              result.id,
                            )
                          }
                        >
                          {copiedResult === result.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No test results yet. Run some speaker tests to see results
                  here.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {result && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            {result}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About Speaker Testing Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  • Multiple speaker configurations (Mono, Stereo, 2.1, 4.0,
                  5.1, 7.1)
                </li>
                <li>• Custom frequency testing (20Hz - 20kHz)</li>
                <li>• Channel-specific audio testing</li>
                <li>• Output device selection</li>
                <li>• Automatic test sequences</li>
                <li>• Real-time volume control</li>
                <li>• Test result tracking and export</li>
                <li>• Audio device information display</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Use Cases</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Home theater system setup</li>
                <li>• Studio monitor calibration</li>
                <li>• Gaming audio configuration</li>
                <li>• Multiple audio device testing</li>
                <li>• Speaker placement optimization</li>
                <li>• Audio equipment troubleshooting</li>
                <li>• Hearing range testing</li>
                <li>• Audio system quality assurance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
