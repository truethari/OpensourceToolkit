"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Camera,
  Mic,
  MicOff,
  CameraOff,
  Play,
  Square,
  Download,
  RefreshCw,
  Settings,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Monitor,
  Shield,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

interface AudioLevelData {
  level: number;
  peak: number;
  timestamp: number;
}

interface RecordingInfo {
  id: string;
  name: string;
  type: "video" | "audio";
  duration: number;
  size: number;
  url: string;
  timestamp: number;
}

interface CameraSettings {
  width: number;
  height: number;
  frameRate: number;
  facingMode: "user" | "environment";
}

interface AudioSettings {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

const videoQualities = [
  { label: "HD (1280x720)", width: 1280, height: 720 },
  { label: "Full HD (1920x1080)", width: 1920, height: 1080 },
  { label: "4K (3840x2160)", width: 3840, height: 2160 },
  { label: "VGA (640x480)", width: 640, height: 480 },
  { label: "QVGA (320x240)", width: 320, height: 240 },
];

const frameRates = [15, 24, 30, 60];
const sampleRates = [8000, 16000, 22050, 44100, 48000];

export default function CameraMicTester() {
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    width: 1280,
    height: 720,
    frameRate: 30,
    facingMode: "user",
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    sampleRate: 44100,
    channelCount: 2,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  });

  const [audioLevel, setAudioLevel] = useState<AudioLevelData>({
    level: 0,
    peak: 0,
    timestamp: 0,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<"video" | "audio">(
    "video",
  );
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);

  const [cameraError, setCameraError] = useState<string>("");
  const [micError, setMicError] = useState<string>("");
  const [permissionStatus, setPermissionStatus] = useState({
    camera: "prompt" as PermissionState | "prompt",
    microphone: "prompt" as PermissionState | "prompt",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const cameras = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => ({
          deviceId: device.deviceId || "default",
          label:
            device.label ||
            `Camera ${device.deviceId?.slice(0, 8) || "default"}`,
          kind: device.kind,
        }));

      const mics = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId || "default",
          label:
            device.label ||
            `Microphone ${device.deviceId?.slice(0, 8) || "default"}`,
          kind: device.kind,
        }));

      setCameraDevices(cameras);
      setMicDevices(mics);

      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(cameras[0].deviceId);
      }
      if (mics.length > 0 && !selectedMic) {
        setSelectedMic(mics[0].deviceId);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  }, [selectedCamera, selectedMic]);

  const checkPermissions = useCallback(async () => {
    try {
      const cameraPermission = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      const micPermission = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      setPermissionStatus({
        camera: cameraPermission.state,
        microphone: micPermission.state,
      });
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      // Request both camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Stop the stream immediately after getting permission
      stream.getTracks().forEach((track) => track.stop());

      // Update permission status and device list
      await checkPermissions();
      await loadDevices();
    } catch (error) {
      console.error("Error requesting permissions:", error);
      await checkPermissions(); // Update status even if request failed
    }
  }, [checkPermissions, loadDevices]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError("");

      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId:
            selectedCamera && selectedCamera !== "default"
              ? { exact: selectedCamera }
              : undefined,
          width: { ideal: cameraSettings.width },
          height: { ideal: cameraSettings.height },
          frameRate: { ideal: cameraSettings.frameRate },
          facingMode: cameraSettings.facingMode,
        },
      };

      // Request camera permission and start stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setIsCameraActive(true);

      // Update permission status after successful access
      await checkPermissions();
      await loadDevices(); // Refresh device list with labels
    } catch (error) {
      console.error("Error starting camera:", error);
      let errorMessage = "Failed to start camera";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage =
            "Camera permission was denied. Please allow camera access and try again.";
        } else if (error.name === "NotFoundError") {
          errorMessage =
            "No camera device found. Please connect a camera and try again.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application.";
        } else if (error.name === "OverconstrainedError") {
          errorMessage =
            "Camera settings are not supported. Try different quality settings.";
        } else {
          errorMessage = error.message;
        }
      }

      setCameraError(errorMessage);
      setIsCameraActive(false);

      // Update permission status after error
      await checkPermissions();
    }
  }, [
    selectedCamera,
    cameraSettings,
    cameraStream,
    loadDevices,
    checkPermissions,
  ]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setCameraError("");
  }, [cameraStream]);

  const startMicrophone = useCallback(async () => {
    try {
      setMicError("");

      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId:
            selectedMic && selectedMic !== "default"
              ? { exact: selectedMic }
              : undefined,
          sampleRate: audioSettings.sampleRate,
          channelCount: audioSettings.channelCount,
          echoCancellation: audioSettings.echoCancellation,
          noiseSuppression: audioSettings.noiseSuppression,
          autoGainControl: audioSettings.autoGainControl,
        },
      };

      // Request microphone permission and start stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMicStream(stream);
      setIsMicActive(true);

      // Set up audio analysis
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioContextRef.current = new AudioContextClass();

      // Resume audio context if it's suspended
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      analyserRef.current = audioContextRef.current.createAnalyser();

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      const bufferLength = analyserRef.current.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (
          analyserRef.current &&
          audioContextRef.current &&
          audioContextRef.current.state === "running"
        ) {
          analyserRef.current.getByteTimeDomainData(dataArray);

          // Calculate RMS (Root Mean Square) for more accurate level detection
          let sum = 0;
          let peak = 0;

          for (let i = 0; i < bufferLength; i++) {
            const sample = (dataArray[i] - 128) / 128; // Convert to -1 to 1 range
            sum += sample * sample;
            peak = Math.max(peak, Math.abs(sample));
          }

          const rms = Math.sqrt(sum / bufferLength);

          // Calculate levels with better sensitivity
          const level = Math.min(rms * 500, 100); // More sensitive detection
          const peakLevel = Math.min(peak * 200, 100);

          setAudioLevel({
            level: Math.max(level, 0),
            peak: Math.max(peakLevel, 0),
            timestamp: Date.now(),
          });
        }
      };

      audioLevelIntervalRef.current = setInterval(updateAudioLevel, 50); // More frequent updates

      // Update permission status after successful access
      await checkPermissions();
      await loadDevices(); // Refresh device list with labels
    } catch (error) {
      console.error("Error starting microphone:", error);
      let errorMessage = "Failed to start microphone";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage =
            "Microphone permission was denied. Please allow microphone access and try again.";
        } else if (error.name === "NotFoundError") {
          errorMessage =
            "No microphone device found. Please connect a microphone and try again.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Microphone is already in use by another application.";
        } else if (error.name === "OverconstrainedError") {
          errorMessage =
            "Microphone settings are not supported. Try different audio settings.";
        } else {
          errorMessage = error.message;
        }
      }

      setMicError(errorMessage);
      setIsMicActive(false);

      // Update permission status after error
      await checkPermissions();
    }
  }, [selectedMic, audioSettings, micStream, loadDevices, checkPermissions]);

  const stopMicrophone = useCallback(() => {
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null);
    }

    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsMicActive(false);
    setMicError("");
    setAudioLevel({ level: 0, peak: 0, timestamp: 0 });
  }, [micStream]);

  const startRecording = useCallback(async () => {
    try {
      let stream: MediaStream;

      if (recordingType === "video") {
        // For video recording, get both camera and microphone streams
        const videoConstraints: MediaStreamConstraints = {
          video: {
            deviceId:
              selectedCamera && selectedCamera !== "default"
                ? { exact: selectedCamera }
                : undefined,
            width: { ideal: cameraSettings.width },
            height: { ideal: cameraSettings.height },
            frameRate: { ideal: cameraSettings.frameRate },
            facingMode: cameraSettings.facingMode,
          },
          audio: {
            deviceId:
              selectedMic && selectedMic !== "default"
                ? { exact: selectedMic }
                : undefined,
            sampleRate: audioSettings.sampleRate,
            channelCount: audioSettings.channelCount,
            echoCancellation: audioSettings.echoCancellation,
            noiseSuppression: audioSettings.noiseSuppression,
            autoGainControl: audioSettings.autoGainControl,
          },
        };

        stream = await navigator.mediaDevices.getUserMedia(videoConstraints);

        // Update states to reflect that devices are now active
        setCameraStream(stream);
        setMicStream(stream);
        setIsCameraActive(true);
        setIsMicActive(true);

        // Update video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        // For audio recording, get microphone stream only
        const audioConstraints: MediaStreamConstraints = {
          audio: {
            deviceId:
              selectedMic && selectedMic !== "default"
                ? { exact: selectedMic }
                : undefined,
            sampleRate: audioSettings.sampleRate,
            channelCount: audioSettings.channelCount,
            echoCancellation: audioSettings.echoCancellation,
            noiseSuppression: audioSettings.noiseSuppression,
            autoGainControl: audioSettings.autoGainControl,
          },
        };

        stream = await navigator.mediaDevices.getUserMedia(audioConstraints);

        // Update states
        setMicStream(stream);
        setIsMicActive(true);

        // Set up audio analysis if not already active
        if (!audioContextRef.current) {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          audioContextRef.current = new AudioContextClass();

          if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume();
          }

          analyserRef.current = audioContextRef.current.createAnalyser();
          const source =
            audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);

          analyserRef.current.fftSize = 2048;
          analyserRef.current.smoothingTimeConstant = 0.8;
          const bufferLength = analyserRef.current.fftSize;
          const dataArray = new Uint8Array(bufferLength);

          const updateAudioLevel = () => {
            if (
              analyserRef.current &&
              audioContextRef.current &&
              audioContextRef.current.state === "running"
            ) {
              analyserRef.current.getByteTimeDomainData(dataArray);

              let sum = 0;
              let peak = 0;

              for (let i = 0; i < bufferLength; i++) {
                const sample = (dataArray[i] - 128) / 128;
                sum += sample * sample;
                peak = Math.max(peak, Math.abs(sample));
              }

              const rms = Math.sqrt(sum / bufferLength);
              const level = Math.min(rms * 500, 100);
              const peakLevel = Math.min(peak * 200, 100);

              setAudioLevel({
                level: Math.max(level, 0),
                peak: Math.max(peakLevel, 0),
                timestamp: Date.now(),
              });
            }
          };

          audioLevelIntervalRef.current = setInterval(updateAudioLevel, 50);
        }
      }

      // Update permissions and device list
      await checkPermissions();
      await loadDevices();

      const mimeType = recordingType === "video" ? "video/webm" : "audio/webm";
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      const chunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        const recording: RecordingInfo = {
          id: Date.now().toString(),
          name: `${recordingType}-recording-${new Date().toLocaleTimeString()}`,
          type: recordingType,
          duration: recordingDuration,
          size: blob.size,
          url,
          timestamp: Date.now(),
        };

        setRecordings((prev) => [recording, ...prev]);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [
    recordingType,
    selectedCamera,
    selectedMic,
    cameraSettings,
    audioSettings,
    checkPermissions,
    loadDevices,
    recordingDuration,
  ]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, [isRecording]);

  const downloadRecording = (recording: RecordingInfo) => {
    const a = document.createElement("a");
    a.href = recording.url;
    a.download = `${recording.name}.${recording.type === "video" ? "webm" : "webm"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteRecording = (id: string) => {
    setRecordings((prev) => {
      const recording = prev.find((r) => r.id === id);
      if (recording) {
        URL.revokeObjectURL(recording.url);
      }
      return prev.filter((r) => r.id !== id);
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getPermissionIcon = (state: PermissionState | "prompt") => {
    switch (state) {
      case "granted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "denied":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPermissionText = (state: PermissionState | "prompt") => {
    switch (state) {
      case "granted":
        return "Granted";
      case "denied":
        return "Denied";
      default:
        return "Not requested";
    }
  };

  useEffect(() => {
    loadDevices();
    checkPermissions();

    return () => {
      // Cleanup will be handled by individual stream management functions
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [loadDevices, checkPermissions]);

  // Effect to handle camera stream changes
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;

      const video = videoRef.current;
      const handleLoadedMetadata = () => {
        video.play().catch(console.error);
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    } else if (videoRef.current && !cameraStream) {
      videoRef.current.srcObject = null;
    }
  }, [cameraStream]);

  // Effect to handle camera device changes
  useEffect(() => {
    if (isCameraActive && selectedCamera) {
      // Restart camera with new device
      const restartCamera = async () => {
        try {
          setCameraError(""); // Clear any previous errors

          const constraints: MediaStreamConstraints = {
            video: {
              deviceId:
                selectedCamera !== "default"
                  ? { exact: selectedCamera }
                  : undefined,
              width: { ideal: cameraSettings.width },
              height: { ideal: cameraSettings.height },
              frameRate: { ideal: cameraSettings.frameRate },
              facingMode: cameraSettings.facingMode,
            },
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);

          // Stop the previous stream before setting the new one
          if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
          }

          setCameraStream(stream);
        } catch (error) {
          console.error("Error changing camera device:", error);
          setCameraError(
            error instanceof Error
              ? error.message
              : "Failed to change camera device",
          );
        }
      };

      restartCamera();
    }
  }, [
    selectedCamera,
    cameraSettings.width,
    cameraSettings.height,
    cameraSettings.frameRate,
    cameraSettings.facingMode,
    isCameraActive,
  ]);

  // Effect to handle microphone device changes
  useEffect(() => {
    if (isMicActive && selectedMic) {
      // Restart microphone with new device
      const restartMicrophone = async () => {
        try {
          setMicError(""); // Clear any previous errors

          // Stop current stream and audio context
          if (micStream) {
            micStream.getTracks().forEach((track) => track.stop());
          }

          if (audioLevelIntervalRef.current) {
            clearInterval(audioLevelIntervalRef.current);
            audioLevelIntervalRef.current = null;
          }

          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }

          const constraints: MediaStreamConstraints = {
            audio: {
              deviceId:
                selectedMic !== "default" ? { exact: selectedMic } : undefined,
              sampleRate: audioSettings.sampleRate,
              channelCount: audioSettings.channelCount,
              echoCancellation: audioSettings.echoCancellation,
              noiseSuppression: audioSettings.noiseSuppression,
              autoGainControl: audioSettings.autoGainControl,
            },
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          setMicStream(stream);

          // Set up audio analysis
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          audioContextRef.current = new AudioContextClass();

          if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume();
          }

          analyserRef.current = audioContextRef.current.createAnalyser();
          const source =
            audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);

          analyserRef.current.fftSize = 2048;
          analyserRef.current.smoothingTimeConstant = 0.8;
          const bufferLength = analyserRef.current.fftSize;
          const dataArray = new Uint8Array(bufferLength);

          const updateAudioLevel = () => {
            if (
              analyserRef.current &&
              audioContextRef.current &&
              audioContextRef.current.state === "running"
            ) {
              analyserRef.current.getByteTimeDomainData(dataArray);

              let sum = 0;
              let peak = 0;

              for (let i = 0; i < bufferLength; i++) {
                const sample = (dataArray[i] - 128) / 128;
                sum += sample * sample;
                peak = Math.max(peak, Math.abs(sample));
              }

              const rms = Math.sqrt(sum / bufferLength);
              const level = Math.min(rms * 500, 100);
              const peakLevel = Math.min(peak * 200, 100);

              setAudioLevel({
                level: Math.max(level, 0),
                peak: Math.max(peakLevel, 0),
                timestamp: Date.now(),
              });
            }
          };

          audioLevelIntervalRef.current = setInterval(updateAudioLevel, 50);
        } catch (error) {
          console.error("Error changing microphone device:", error);
          setMicError(
            error instanceof Error
              ? error.message
              : "Failed to change microphone device",
          );
        }
      };

      restartMicrophone();
    }
  }, [
    selectedMic,
    audioSettings.sampleRate,
    audioSettings.channelCount,
    audioSettings.echoCancellation,
    audioSettings.noiseSuppression,
    audioSettings.autoGainControl,
    isMicActive,
    micStream,
  ]);

  // Cleanup effect for streams and recordings
  useEffect(() => {
    return () => {
      // Clean up current streams
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
      }

      // Clean up recording URLs
      recordings.forEach((recording) => {
        URL.revokeObjectURL(recording.url);
      });
    };
  }, [cameraStream, micStream, recordings]);

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Camera & Microphone Tester</h1>
        <p className="text-muted-foreground">
          Test camera and microphone functionality, record media, and monitor
          audio levels
        </p>
      </div>

      {/* Privacy & Security Notice */}
      <Card className="border-2 border-green-600 bg-green-600/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription className="text-white">
            Your privacy is fully protected - all processing happens locally in
            your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-white" />
                <div>
                  <h4 className="font-medium text-white">
                    100% Local Processing
                  </h4>
                  <p className="text-sm text-white">
                    All camera and microphone data is processed entirely in your
                    browser. Nothing is uploaded to any server.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-white" />
                <div>
                  <h4 className="font-medium text-white">No Data Collection</h4>
                  <p className="text-sm text-white">
                    We don&apos;t collect, store, or analyze any of your audio
                    or video content. Your data stays on your device.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-white" />
                <div>
                  <h4 className="font-medium text-white">No Cloud Storage</h4>
                  <p className="text-sm text-white">
                    Recordings are stored temporarily in your browser&apos;s
                    memory only. Nothing is saved to external servers.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-white" />
                <div>
                  <h4 className="font-medium text-white">
                    You Control Downloads
                  </h4>
                  <p className="text-sm text-white">
                    Only you decide what recordings to download to your
                    computer. We never automatically save anything.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-white" />
                <div>
                  <h4 className="font-medium text-white">
                    Standard Browser Security
                  </h4>
                  <p className="text-sm text-white">
                    Uses secure WebRTC APIs. Your browser controls all
                    permissions and access to your devices.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-white" />
                <div>
                  <h4 className="font-medium text-white">
                    Open Source & Transparent
                  </h4>
                  <p className="text-sm text-white">
                    This tool is open source - you can inspect the code to
                    verify our privacy claims.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-green-100 p-3">
            <p className="text-sm text-green-800">
              <strong>🔒 How it works:</strong> When you start the camera or
              microphone, your browser requests permission and creates a local
              media stream. All audio analysis, video processing, and recording
              happens on your device using standard web technologies. No network
              requests are made for media processing.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Permissions Status
          </CardTitle>
          <CardDescription>
            Current permission status for camera and microphone access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span>Camera</span>
              </div>
              <div className="flex items-center gap-2">
                {getPermissionIcon(permissionStatus.camera)}
                <span className="text-sm">
                  {getPermissionText(permissionStatus.camera)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span>Microphone</span>
              </div>
              <div className="flex items-center gap-2">
                {getPermissionIcon(permissionStatus.microphone)}
                <span className="text-sm">
                  {getPermissionText(permissionStatus.microphone)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={requestPermissions} size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Request Permissions
            </Button>
            <Button onClick={loadDevices} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Devices
            </Button>
            <Button onClick={checkPermissions} variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Check Status
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="camera" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="camera">Camera</TabsTrigger>
          <TabsTrigger value="microphone">Microphone</TabsTrigger>
          <TabsTrigger value="recording">Recording</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="camera">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Testing
              </CardTitle>
              <CardDescription>
                Test camera functionality and preview video feed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label>Camera Device</Label>
                  <Select
                    value={selectedCamera}
                    onValueChange={setSelectedCamera}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {cameraDevices.map((device) => (
                        <SelectItem
                          key={device.deviceId}
                          value={device.deviceId || "default"}
                        >
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={isCameraActive ? stopCamera : startCamera}
                    className={
                      isCameraActive
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }
                  >
                    {isCameraActive ? (
                      <CameraOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    {isCameraActive ? "Stop Camera" : "Start Camera"}
                  </Button>
                </div>
              </div>

              {cameraError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Camera Error:</span>
                  </div>
                  <p className="mt-1 text-sm">{cameraError}</p>
                </div>
              )}

              <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Monitor className="mx-auto mb-2 h-12 w-12" />
                      <p>Camera preview will appear here</p>
                      <p className="text-sm">
                        Click &quot;Start Camera&quot; to begin
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {isCameraActive && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {cameraSettings.width}x{cameraSettings.height}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Resolution
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {cameraSettings.frameRate} FPS
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Frame Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {cameraSettings.facingMode}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Facing Mode
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge variant={isCameraActive ? "default" : "secondary"}>
                      {isCameraActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="text-sm text-muted-foreground">Status</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="microphone">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Microphone Testing
              </CardTitle>
              <CardDescription>
                Test microphone functionality and monitor audio levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label>Microphone Device</Label>
                  <Select value={selectedMic} onValueChange={setSelectedMic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      {micDevices.map((device) => (
                        <SelectItem
                          key={device.deviceId}
                          value={device.deviceId || "default"}
                        >
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={isMicActive ? stopMicrophone : startMicrophone}
                    className={
                      isMicActive
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }
                  >
                    {isMicActive ? (
                      <MicOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Mic className="mr-2 h-4 w-4" />
                    )}
                    {isMicActive ? "Stop Microphone" : "Start Microphone"}
                  </Button>
                </div>
              </div>

              {micError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Microphone Error:</span>
                  </div>
                  <p className="mt-1 text-sm">{micError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Audio Level</Label>
                    <div className="flex items-center gap-2">
                      {audioLevel.level > 0 ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                      <span className="font-mono text-sm">
                        {Math.round(audioLevel.level)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={audioLevel.level} className="h-3" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Peak Level</Label>
                    <span className="font-mono text-sm">
                      {Math.round(audioLevel.peak)}%
                    </span>
                  </div>
                  <Progress value={audioLevel.peak} className="h-2" />
                </div>
              </div>

              {isMicActive && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {audioSettings.sampleRate} Hz
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sample Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {audioSettings.channelCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Channels
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge
                      variant={
                        audioSettings.echoCancellation ? "default" : "secondary"
                      }
                    >
                      {audioSettings.echoCancellation ? "On" : "Off"}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Echo Cancel
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge variant={isMicActive ? "default" : "secondary"}>
                      {isMicActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="text-sm text-muted-foreground">Status</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recording">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Recording & Playback
              </CardTitle>
              <CardDescription>
                Record video and audio, then download or playback recordings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label>Recording Type</Label>
                  <Select
                    value={recordingType}
                    onValueChange={(value: "video" | "audio") =>
                      setRecordingType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video (with audio)</SelectItem>
                      <SelectItem value="audio">Audio only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  {!isRecording ? (
                    <div className="flex flex-col gap-1">
                      <Button
                        onClick={startRecording}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Recording
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {recordingType === "video"
                          ? "Will automatically start camera and microphone"
                          : "Will automatically start microphone"}
                      </p>
                    </div>
                  ) : (
                    <Button onClick={stopRecording} variant="outline">
                      <Square className="mr-2 h-4 w-4" />
                      Stop Recording
                    </Button>
                  )}
                </div>
              </div>

              {isRecording && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                      <span className="font-medium">
                        Recording {recordingType}...
                      </span>
                    </div>
                    <div className="font-mono text-lg">
                      {formatDuration(recordingDuration)}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">
                  Recordings ({recordings.length})
                </h4>

                {recordings.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Play className="mx-auto mb-2 h-12 w-12" />
                    <p>No recordings yet</p>
                    <p className="text-sm">
                      Start recording to see your files here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recordings.map((recording) => (
                      <div
                        key={recording.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <div className="font-medium">{recording.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDuration(recording.duration)} •{" "}
                            {formatFileSize(recording.size)} • {recording.type}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadRecording(recording)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteRecording(recording.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Camera Settings</CardTitle>
                <CardDescription>
                  Configure camera resolution, frame rate, and other options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Video Quality</Label>
                  <Select
                    value={`${cameraSettings.width}x${cameraSettings.height}`}
                    onValueChange={(value) => {
                      const quality = videoQualities.find(
                        (q) => `${q.width}x${q.height}` === value,
                      );
                      if (quality) {
                        setCameraSettings((prev) => ({
                          ...prev,
                          width: quality.width,
                          height: quality.height,
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {videoQualities.map((quality) => (
                        <SelectItem
                          key={`${quality.width}x${quality.height}`}
                          value={`${quality.width}x${quality.height}`}
                        >
                          {quality.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frame Rate</Label>
                  <Select
                    value={cameraSettings.frameRate.toString()}
                    onValueChange={(value) =>
                      setCameraSettings((prev) => ({
                        ...prev,
                        frameRate: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frameRates.map((rate) => (
                        <SelectItem key={rate} value={rate.toString()}>
                          {rate} FPS
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Camera Facing</Label>
                  <Select
                    value={cameraSettings.facingMode}
                    onValueChange={(value: "user" | "environment") =>
                      setCameraSettings((prev) => ({
                        ...prev,
                        facingMode: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Front Camera (User)</SelectItem>
                      <SelectItem value="environment">
                        Back Camera (Environment)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audio Settings</CardTitle>
                <CardDescription>
                  Configure microphone sample rate, channels, and audio
                  processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sample Rate</Label>
                  <Select
                    value={audioSettings.sampleRate.toString()}
                    onValueChange={(value) =>
                      setAudioSettings((prev) => ({
                        ...prev,
                        sampleRate: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleRates.map((rate) => (
                        <SelectItem key={rate} value={rate.toString()}>
                          {rate} Hz
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Channel Count</Label>
                  <Select
                    value={audioSettings.channelCount.toString()}
                    onValueChange={(value) =>
                      setAudioSettings((prev) => ({
                        ...prev,
                        channelCount: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Mono (1 channel)</SelectItem>
                      <SelectItem value="2">Stereo (2 channels)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Echo Cancellation</Label>
                    <Switch
                      checked={audioSettings.echoCancellation}
                      onCheckedChange={(checked) =>
                        setAudioSettings((prev) => ({
                          ...prev,
                          echoCancellation: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Noise Suppression</Label>
                    <Switch
                      checked={audioSettings.noiseSuppression}
                      onCheckedChange={(checked) =>
                        setAudioSettings((prev) => ({
                          ...prev,
                          noiseSuppression: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto Gain Control</Label>
                    <Switch
                      checked={audioSettings.autoGainControl}
                      onCheckedChange={(checked) =>
                        setAudioSettings((prev) => ({
                          ...prev,
                          autoGainControl: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>About Camera & Microphone Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Camera device selection and testing</li>
                <li>• Microphone device selection and monitoring</li>
                <li>• Real-time audio level visualization</li>
                <li>• Video and audio recording capabilities</li>
                <li>• Customizable quality settings</li>
                <li>• Permission status monitoring</li>
                <li>• Download recorded media files</li>
                <li>• Audio processing controls</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Use Cases</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Testing camera and microphone functionality</li>
                <li>• Debugging media device issues</li>
                <li>• Recording test videos and audio</li>
                <li>• Checking audio levels and quality</li>
                <li>• Verifying device permissions</li>
                <li>• Quality assurance testing</li>
                <li>• Video conferencing setup testing</li>
                <li>• Media device compatibility testing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
