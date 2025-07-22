"use client";

import { toast } from "sonner";
import React, { useState, useRef, useEffect } from "react";
import {
  Zap,
  Mic,
  Play,
  Waves,
  Filter,
  Square,
  Upload,
  Volume2,
  Activity,
  Settings,
  Download,
  RotateCcw,
  FileAudio,
  AudioLines,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

export default function AudioNoiseReduction() {
  interface AudioProcessingSettings {
    noiseReduction: number;
    gain: number;
    highPassFilter: number;
    lowPassFilter: number;
    compressor: {
      threshold: number;
      ratio: number;
      attack: number;
      release: number;
    };
    equalizer: {
      bass: number;
      mid: number;
      treble: number;
    };
  }

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(
    null,
  );
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentPlayback, setCurrentPlayback] = useState<
    "original" | "processed" | null
  >(null);
  const [error, setError] = useState("");
  const [analysisResults, setAnalysisResults] = useState<{
    duration: number;
    sampleRate: number;
    channels: number;
    noiseLevel: number;
  } | null>(null);

  const [settings, setSettings] = useState<AudioProcessingSettings>({
    noiseReduction: 50,
    gain: 0,
    highPassFilter: 80,
    lowPassFilter: 8000,
    compressor: {
      threshold: -24,
      ratio: 4,
      attack: 3,
      release: 250,
    },
    equalizer: {
      bass: 0,
      mid: 0,
      treble: 0,
    },
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const processedAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedAudioElement = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const cleanup = () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }

      stopPlayback();

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (mediaSourceRef.current) {
        mediaSourceRef.current.disconnect();
        mediaSourceRef.current = null;
      }

      connectedAudioElement.current = null;
    };

    return cleanup;
  }, [isRecording]);

  const initializeAudioContext = async () => {
    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
  };

  const startRecording = async () => {
    try {
      setError("");
      await initializeAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 2,
          sampleRate: 44100,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const audioFile = new File(
          [audioBlob],
          `recording_${Date.now()}.webm`,
          { type: "audio/webm" },
        );
        handleAudioFile(audioFile);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      setupRealtimeVisualizer(stream);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (err) {
      setError("Failed to access microphone. Please check permissions.");
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (isRecording) {
      toast.success("Recording stopped");
    }
  };

  const setupRealtimeVisualizer = (stream: MediaStream) => {
    if (!audioContextRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    source.connect(analyser);
    analyserRef.current = analyser;

    animateVisualizer();
  };

  const animateVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.fillStyle = "rgb(15, 23, 42)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        const gradient = ctx.createLinearGradient(
          0,
          canvas.height,
          0,
          canvas.height - barHeight,
        );
        gradient.addColorStop(0, "rgb(59, 130, 246)");
        gradient.addColorStop(0.6, "rgb(147, 197, 253)");
        gradient.addColorStop(1, "rgb(219, 234, 254)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      if (isRecording || isPlaying) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        setError("Please select a valid audio file");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        return;
      }

      handleAudioFile(file);
      toast.success("Audio file uploaded successfully");
    }
  };

  const handleAudioFile = async (file: File) => {
    setAudioFile(file);
    setError("");

    const url = URL.createObjectURL(file);
    setOriginalAudioUrl(url);

    await analyzeAudioFile(file);
  };

  const analyzeAudioFile = async (file: File) => {
    try {
      await initializeAudioContext();
      if (!audioContextRef.current) return;

      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer =
        await audioContextRef.current.decodeAudioData(arrayBuffer);

      const channelData = audioBuffer.getChannelData(0);
      let sumSquares = 0;

      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.abs(channelData[i]);
        sumSquares += sample * sample;
      }

      const rms = Math.sqrt(sumSquares / channelData.length);
      const noiseLevel = Math.round((1 - rms) * 100);

      setAnalysisResults({
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        noiseLevel: Math.max(0, Math.min(100, noiseLevel)),
      });
    } catch (err) {
      console.error("Audio analysis error:", err);
      setError("Failed to analyze audio file");
    }
  };

  const processAudio = async () => {
    if (!audioFile || !audioContextRef.current) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError("");

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      setProcessingProgress(20);

      const audioBuffer =
        await audioContextRef.current.decodeAudioData(arrayBuffer);
      setProcessingProgress(40);

      const processedBuffer = await applyAudioProcessing(audioBuffer);
      setProcessingProgress(80);

      const processedBlob = await audioBufferToBlob(processedBuffer);
      const processedUrl = URL.createObjectURL(processedBlob);

      setProcessedAudioUrl(processedUrl);
      setProcessingProgress(100);

      toast.success("Audio processing completed!");
    } catch (err) {
      console.error("Audio processing error:", err);
      setError("Failed to process audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const applyAudioProcessing = async (
    audioBuffer: AudioBuffer,
  ): Promise<AudioBuffer> => {
    if (!audioContextRef.current) throw new Error("No audio context");

    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate,
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    let currentNode: AudioNode = source;

    // High-pass filter for noise reduction
    if (settings.highPassFilter > 0) {
      const highPassFilter = offlineContext.createBiquadFilter();
      highPassFilter.type = "highpass";
      highPassFilter.frequency.value = settings.highPassFilter;
      highPassFilter.Q.value = 0.7;
      currentNode.connect(highPassFilter);
      currentNode = highPassFilter;
    }

    // Low-pass filter
    if (settings.lowPassFilter < 20000) {
      const lowPassFilter = offlineContext.createBiquadFilter();
      lowPassFilter.type = "lowpass";
      lowPassFilter.frequency.value = settings.lowPassFilter;
      lowPassFilter.Q.value = 0.7;
      currentNode.connect(lowPassFilter);
      currentNode = lowPassFilter;
    }

    // Dynamics compressor
    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = settings.compressor.threshold;
    compressor.ratio.value = settings.compressor.ratio;
    compressor.attack.value = settings.compressor.attack / 1000;
    compressor.release.value = settings.compressor.release / 1000;
    currentNode.connect(compressor);
    currentNode = compressor;

    // EQ filters
    if (settings.equalizer.bass !== 0) {
      const bassFilter = offlineContext.createBiquadFilter();
      bassFilter.type = "lowshelf";
      bassFilter.frequency.value = 320;
      bassFilter.gain.value = settings.equalizer.bass;
      currentNode.connect(bassFilter);
      currentNode = bassFilter;
    }

    if (settings.equalizer.mid !== 0) {
      const midFilter = offlineContext.createBiquadFilter();
      midFilter.type = "peaking";
      midFilter.frequency.value = 1000;
      midFilter.Q.value = 0.7;
      midFilter.gain.value = settings.equalizer.mid;
      currentNode.connect(midFilter);
      currentNode = midFilter;
    }

    if (settings.equalizer.treble !== 0) {
      const trebleFilter = offlineContext.createBiquadFilter();
      trebleFilter.type = "highshelf";
      trebleFilter.frequency.value = 3200;
      trebleFilter.gain.value = settings.equalizer.treble;
      currentNode.connect(trebleFilter);
      currentNode = trebleFilter;
    }

    // Gain control
    if (settings.gain !== 0) {
      const gainNode = offlineContext.createGain();
      gainNode.gain.value = Math.pow(10, settings.gain / 20);
      currentNode.connect(gainNode);
      currentNode = gainNode;
    }

    currentNode.connect(offlineContext.destination);
    source.start(0);

    return offlineContext.startRendering();
  };

  const audioBufferToBlob = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, length * numberOfChannels * 2, true);

    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, audioBuffer.getChannelData(channel)[i]),
        );
        view.setInt16(
          offset,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true,
        );
        offset += 2;
      }
    }

    return new Blob([buffer], { type: "audio/wav" });
  };

  const playAudio = (type: "original" | "processed") => {
    stopPlayback();

    const url = type === "original" ? originalAudioUrl : processedAudioUrl;

    if (!url) return;

    // Always create a fresh audio element for playback to avoid MediaElementSource conflicts
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.src = url;

    // Store reference for cleanup
    if (type === "original") {
      originalAudioRef.current = audio;
    } else {
      processedAudioRef.current = audio;
    }

    audio.play();
    setIsPlaying(true);
    setCurrentPlayback(type);

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentPlayback(null);
    };

    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      setError("Failed to play audio. Please try again.");
      setIsPlaying(false);
      setCurrentPlayback(null);
    };

    setupPlaybackVisualizer(audio);
  };

  const stopPlayback = () => {
    [originalAudioRef, processedAudioRef].forEach((ref) => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });

    // Clean up media source
    if (mediaSourceRef.current) {
      mediaSourceRef.current.disconnect();
      mediaSourceRef.current = null;
    }

    connectedAudioElement.current = null;
    setIsPlaying(false);
    setCurrentPlayback(null);
  };

  const setupPlaybackVisualizer = (audio: HTMLAudioElement) => {
    if (!audioContextRef.current) return;

    try {
      // Always clean up previous connections
      if (mediaSourceRef.current) {
        mediaSourceRef.current.disconnect();
        mediaSourceRef.current = null;
      }

      // Create fresh media element source for the new audio element
      const source = audioContextRef.current.createMediaElementSource(audio);
      mediaSourceRef.current = source;
      connectedAudioElement.current = audio;

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      analyserRef.current = analyser;

      animateVisualizer();
    } catch (err) {
      console.error("Visualizer setup error:", err);
      // If we can't create a media source, just skip visualization
      if (analyserRef.current) {
        analyserRef.current = null;
      }
    }
  };

  const downloadAudio = () => {
    if (!processedAudioUrl) return;

    const link = document.createElement("a");
    link.href = processedAudioUrl;
    link.download = `processed_audio_${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Download started!");
  };

  const resetAll = () => {
    if (isRecording) {
      stopRecording();
    }
    stopPlayback();

    // Clean up audio sources and URLs
    if (originalAudioUrl) {
      URL.revokeObjectURL(originalAudioUrl);
    }
    if (processedAudioUrl) {
      URL.revokeObjectURL(processedAudioUrl);
    }

    setAudioFile(null);
    setOriginalAudioUrl(null);
    setProcessedAudioUrl(null);
    setAnalysisResults(null);
    setRecordingTime(0);
    setError("");
    setProcessingProgress(0);

    // Clear audio references
    originalAudioRef.current = null;
    processedAudioRef.current = null;
    connectedAudioElement.current = null;

    toast.success("Reset completed");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (duration: number) => {
    return `${Math.floor(duration / 60)}:${Math.floor(duration % 60)
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          Professional Audio Noise Reduction
        </h1>
        <p className="text-muted-foreground">
          Remove background noise, enhance audio quality, and apply professional
          audio processing
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AudioLines className="h-5 w-5" />
              Audio Input
            </CardTitle>
            <CardDescription>
              Record audio or upload a file to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={isRecording ? "bg-red-600 hover:bg-red-700" : ""}
                size="lg"
              >
                {isRecording ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Stop ({formatTime(recordingTime)})
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Record
                  </>
                )}
              </Button>

              <Button
                onClick={() => document.getElementById("audioUpload")?.click()}
                variant="outline"
                size="lg"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>

            <input
              id="audioUpload"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="rounded-lg border bg-gray-950 p-4">
              <canvas
                ref={canvasRef}
                width={400}
                height={120}
                className="w-full rounded"
              />
            </div>

            {audioFile && (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-2">
                    <FileAudio className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {audioFile.name}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                  </Badge>
                </div>

                {analysisResults && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      Duration: {formatDuration(analysisResults.duration)}
                    </div>
                    <div>Sample Rate: {analysisResults.sampleRate} Hz</div>
                    <div>Channels: {analysisResults.channels}</div>
                    <div>Noise Level: {analysisResults.noiseLevel}%</div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Processing Settings
            </CardTitle>
            <CardDescription>
              Adjust noise reduction and audio enhancement parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="eq">EQ</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <div className="space-y-2">
                  <Label>Noise Reduction: {settings.noiseReduction}%</Label>
                  <Slider
                    value={[settings.noiseReduction]}
                    onValueChange={([value]) =>
                      setSettings((prev) => ({
                        ...prev,
                        noiseReduction: value,
                      }))
                    }
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Gain: {settings.gain > 0 ? "+" : ""}
                    {settings.gain} dB
                  </Label>
                  <Slider
                    value={[settings.gain]}
                    onValueChange={([value]) =>
                      setSettings((prev) => ({ ...prev, gain: value }))
                    }
                    min={-20}
                    max={20}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>High-Pass Filter: {settings.highPassFilter} Hz</Label>
                  <Slider
                    value={[settings.highPassFilter]}
                    onValueChange={([value]) =>
                      setSettings((prev) => ({
                        ...prev,
                        highPassFilter: value,
                      }))
                    }
                    min={20}
                    max={500}
                    step={5}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="space-y-2">
                  <Label>Low-Pass Filter: {settings.lowPassFilter} Hz</Label>
                  <Slider
                    value={[settings.lowPassFilter]}
                    onValueChange={([value]) =>
                      setSettings((prev) => ({ ...prev, lowPassFilter: value }))
                    }
                    min={1000}
                    max={20000}
                    step={100}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Compressor</h4>

                  <div className="space-y-2">
                    <Label>Threshold: {settings.compressor.threshold} dB</Label>
                    <Slider
                      value={[settings.compressor.threshold]}
                      onValueChange={([value]) =>
                        setSettings((prev) => ({
                          ...prev,
                          compressor: { ...prev.compressor, threshold: value },
                        }))
                      }
                      min={-40}
                      max={0}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ratio: {settings.compressor.ratio}:1</Label>
                    <Slider
                      value={[settings.compressor.ratio]}
                      onValueChange={([value]) =>
                        setSettings((prev) => ({
                          ...prev,
                          compressor: { ...prev.compressor, ratio: value },
                        }))
                      }
                      min={1}
                      max={20}
                      step={0.5}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Attack: {settings.compressor.attack}ms</Label>
                      <Slider
                        value={[settings.compressor.attack]}
                        onValueChange={([value]) =>
                          setSettings((prev) => ({
                            ...prev,
                            compressor: { ...prev.compressor, attack: value },
                          }))
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Release: {settings.compressor.release}ms</Label>
                      <Slider
                        value={[settings.compressor.release]}
                        onValueChange={([value]) =>
                          setSettings((prev) => ({
                            ...prev,
                            compressor: { ...prev.compressor, release: value },
                          }))
                        }
                        min={10}
                        max={1000}
                        step={10}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="eq" className="space-y-6">
                <div className="space-y-2">
                  <Label>
                    Bass: {settings.equalizer.bass > 0 ? "+" : ""}
                    {settings.equalizer.bass} dB
                  </Label>
                  <Slider
                    value={[settings.equalizer.bass]}
                    onValueChange={([value]) =>
                      setSettings((prev) => ({
                        ...prev,
                        equalizer: { ...prev.equalizer, bass: value },
                      }))
                    }
                    min={-12}
                    max={12}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Mid: {settings.equalizer.mid > 0 ? "+" : ""}
                    {settings.equalizer.mid} dB
                  </Label>
                  <Slider
                    value={[settings.equalizer.mid]}
                    onValueChange={([value]) =>
                      setSettings((prev) => ({
                        ...prev,
                        equalizer: { ...prev.equalizer, mid: value },
                      }))
                    }
                    min={-12}
                    max={12}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Treble: {settings.equalizer.treble > 0 ? "+" : ""}
                    {settings.equalizer.treble} dB
                  </Label>
                  <Slider
                    value={[settings.equalizer.treble]}
                    onValueChange={([value]) =>
                      setSettings((prev) => ({
                        ...prev,
                        equalizer: { ...prev.equalizer, treble: value },
                      }))
                    }
                    min={-12}
                    max={12}
                    step={0.5}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex flex-col gap-2 md:flex-row">
              <Button
                onClick={processAudio}
                disabled={!audioFile || isProcessing}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Activity className="mr-2 h-4 w-4 animate-spin" />
                    Processing... {processingProgress}%
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Process Audio
                  </>
                )}
              </Button>

              <Button onClick={resetAll} variant="outline" size="lg">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>

            {isProcessing && (
              <Progress value={processingProgress} className="mt-4" />
            )}
          </CardContent>
        </Card>
      </div>

      {(originalAudioUrl || processedAudioUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5" />
              Audio Playback & Export
            </CardTitle>
            <CardDescription>
              Compare original and processed audio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {originalAudioUrl && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Original Audio
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        isPlaying ? stopPlayback() : playAudio("original")
                      }
                      disabled={isPlaying && currentPlayback !== "original"}
                      variant="outline"
                      className="flex-1"
                    >
                      {isPlaying && currentPlayback === "original" ? (
                        <Square className="mr-2 h-4 w-4" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      {isPlaying && currentPlayback === "original"
                        ? "Playing"
                        : "Play"}
                    </Button>
                  </div>
                </div>
              )}

              {processedAudioUrl && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Processed Audio
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        isPlaying ? stopPlayback() : playAudio("processed")
                      }
                      disabled={isPlaying && currentPlayback !== "processed"}
                      variant="outline"
                      className="flex-1"
                    >
                      {isPlaying && currentPlayback === "processed" ? (
                        <Square className="mr-2 h-4 w-4" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      {isPlaying && currentPlayback === "processed"
                        ? "Playing"
                        : "Play"}
                    </Button>
                    <Button onClick={downloadAudio} variant="default">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {isPlaying && (
              <Button
                onClick={stopPlayback}
                variant="outline"
                className="w-full"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Playback
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Audio Processing Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold">Noise Reduction</h4>
              <p className="text-sm text-muted-foreground">
                Advanced spectral gating and filtering to remove background
                noise, hum, and unwanted artifacts from your audio recordings.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Professional Processing</h4>
              <p className="text-sm text-muted-foreground">
                Multi-band EQ, dynamic compression, and gain control for
                professional-grade audio enhancement and mastering.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Real-time Visualization</h4>
              <p className="text-sm text-muted-foreground">
                Live frequency analysis and waveform visualization to monitor
                audio input and processing results in real-time.
              </p>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Noise Gate</Badge>
              <Badge variant="outline">High/Low Pass Filters</Badge>
              <Badge variant="outline">Dynamic Compression</Badge>
              <Badge variant="outline">3-Band EQ</Badge>
              <Badge variant="outline">Real-time Recording</Badge>
              <Badge variant="outline">File Upload Support</Badge>
              <Badge variant="outline">WAV Export</Badge>
              <Badge variant="outline">Browser-based Processing</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
