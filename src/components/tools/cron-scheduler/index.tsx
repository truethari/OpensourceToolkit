"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Settings,
  Timer,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

interface CronJob {
  id: string;
  name: string;
  expression: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: string;
  body?: string;
  enabled: boolean;
  nextRun: Date | null;
  lastRun: Date | null;
  status: "idle" | "running" | "success" | "error";
  logs: CronJobLog[];
}

interface CronJobLog {
  id: string;
  timestamp: Date;
  status: "success" | "error";
  duration: number;
  response?: string;
  error?: string;
}

const CRON_PRESETS = [
  { label: "Every minute", expression: "* * * * *" },
  { label: "Every 5 minutes", expression: "*/5 * * * *" },
  { label: "Every 15 minutes", expression: "*/15 * * * *" },
  { label: "Every 30 minutes", expression: "*/30 * * * *" },
  { label: "Every hour", expression: "0 * * * *" },
  { label: "Every 6 hours", expression: "0 */6 * * *" },
  { label: "Every day at midnight", expression: "0 0 * * *" },
  { label: "Every Monday at 9am", expression: "0 9 * * 1" },
];

export default function CronScheduler() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [activeTab, setActiveTab] = useState("scheduler");
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // New job form state
  interface NewJobForm {
    name: string;
    expression: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers: string;
    body: string;
  }

  const [newJob, setNewJob] = useState<NewJobForm>({
    name: "",
    expression: "",
    url: "",
    method: "GET",
    headers: "{}",
    body: "",
  });

  // Manual schedule builder state
  const [manualSchedule, setManualSchedule] = useState({
    minute: "*",
    hour: "*",
    day: "*",
    month: "*",
    weekday: "*",
  });

  // Convert manual schedule to cron expression
  const manualToCron = (manual: typeof manualSchedule): string => {
    return `${manual.minute} ${manual.hour} ${manual.day} ${manual.month} ${manual.weekday}`;
  };

  // Parse cron expression to manual schedule
  const cronToManual = (expression: string) => {
    const parts = expression.trim().split(/\s+/);
    if (parts.length === 5) {
      return {
        minute: parts[0],
        hour: parts[1],
        day: parts[2],
        month: parts[3],
        weekday: parts[4],
      };
    }
    return {
      minute: "*",
      hour: "*",
      day: "*",
      month: "*",
      weekday: "*",
    };
  };

  // Update cron expression when manual schedule changes
  const updateCronFromManual = (newManual: typeof manualSchedule) => {
    const cronExpression = manualToCron(newManual);
    setNewJob((prev) => ({ ...prev, expression: cronExpression }));
  };

  // Update manual schedule when cron expression changes
  const updateManualFromCron = (expression: string) => {
    if (validateCronExpression(expression)) {
      const newManual = cronToManual(expression);
      setManualSchedule(newManual);
    }
  };

  // Get human-readable description of cron expression
  const getCronDescription = (expression: string): string => {
    if (!validateCronExpression(expression)) return "Invalid expression";

    const parts = expression.trim().split(/\s+/);
    const [minute, hour, day, month, weekday] = parts;

    let description = "Runs ";

    // Handle minute
    if (minute === "*") {
      description += "every minute";
    } else if (minute.startsWith("*/")) {
      const interval = minute.slice(2);
      description += `every ${interval} minutes`;
    } else {
      description += `at minute ${minute}`;
    }

    // Handle hour
    if (hour !== "*") {
      if (hour.startsWith("*/")) {
        const interval = hour.slice(2);
        description += `, every ${interval} hours`;
      } else {
        const hourNum = parseInt(hour);
        const ampm = hourNum >= 12 ? "PM" : "AM";
        const displayHour =
          hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
        description += ` at ${displayHour}:00 ${ampm}`;
      }
    }

    // Handle day of month
    if (day !== "*") {
      if (day.startsWith("*/")) {
        const interval = day.slice(2);
        description += `, every ${interval} days`;
      } else {
        description += ` on day ${day}`;
      }
    }

    // Handle month
    if (month !== "*") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      if (month.includes(",")) {
        description += ` in months ${month}`;
      } else {
        const monthNum = parseInt(month) - 1;
        description += ` in ${months[monthNum]}`;
      }
    }

    // Handle weekday
    if (weekday !== "*") {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      if (weekday === "1-5") {
        description += " on weekdays";
      } else if (weekday === "0,6") {
        description += " on weekends";
      } else if (weekday.includes(",")) {
        description += ` on days ${weekday}`;
      } else {
        const dayNum = parseInt(weekday);
        description += ` on ${days[dayNum]}`;
      }
    }

    return description;
  };

  // Parse cron expression to get next run time
  const getNextRunTime = (expression: string): Date | null => {
    try {
      const parts = expression.trim().split(/\s+/);
      if (parts.length !== 5) return null;

      const [minute] = parts;
      const now = new Date();
      const next = new Date(now);

      // Simple implementation for common patterns
      if (minute === "*") {
        next.setMinutes(next.getMinutes() + 1);
      } else if (minute.startsWith("*/")) {
        const interval = parseInt(minute.slice(2));
        const currentMinute = next.getMinutes();
        const nextMinute = Math.ceil(currentMinute / interval) * interval;
        next.setMinutes(nextMinute);
      } else {
        const targetMinute = parseInt(minute);
        if (targetMinute > now.getMinutes()) {
          next.setMinutes(targetMinute);
        } else {
          next.setMinutes(targetMinute);
          next.setHours(next.getHours() + 1);
        }
      }

      next.setSeconds(0);
      next.setMilliseconds(0);
      return next;
    } catch {
      return null;
    }
  };

  // Validate cron expression
  const validateCronExpression = (expression: string): boolean => {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return false;

    const patterns = [
      /^(\*|[0-5]?\d|\*\/[1-9]\d*)$/, // minute
      /^(\*|[01]?\d|2[0-3]|\*\/[1-9]\d*)$/, // hour
      /^(\*|[12]?\d|3[01]|\*\/[1-9]\d*)$/, // day
      /^(\*|[01]?\d|\*\/[1-9]\d*)$/, // month
      /^(\*|[0-6]|\*\/[1-9])$/, // weekday
    ];

    return parts.every((part, index) => patterns[index].test(part));
  };

  // Execute job
  const executeJob = async (job: CronJob): Promise<void> => {
    const startTime = Date.now();

    try {
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: "running" } : j)),
      );

      const headersString = job.headers || "{}";
      const headers = JSON.parse(headersString) as Record<string, string>;
      const response = await fetch(job.url, {
        method: job.method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: job.method !== "GET" ? job.body : undefined,
      });

      const duration = Date.now() - startTime;
      const responseText = await response.text();

      const log: CronJobLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        status: response.ok ? "success" : "error",
        duration,
        response: responseText,
        error: response.ok
          ? undefined
          : `HTTP ${response.status}: ${response.statusText}`,
      };

      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                status: response.ok ? "success" : "error",
                lastRun: new Date(),
                nextRun: getNextRunTime(j.expression),
                logs: [log, ...j.logs.slice(0, 49)], // Keep last 50 logs
              }
            : j,
        ),
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const log: CronJobLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        status: "error",
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                status: "error",
                lastRun: new Date(),
                nextRun: getNextRunTime(j.expression),
                logs: [log, ...j.logs.slice(0, 49)],
              }
            : j,
        ),
      );
    }
  };

  // Check and execute jobs
  const checkJobs = () => {
    const now = new Date();
    jobs.forEach((job) => {
      if (
        job.enabled &&
        job.nextRun &&
        now >= job.nextRun &&
        job.status !== "running"
      ) {
        executeJob(job);
      }
    });
  };

  // Start/stop scheduler
  const toggleScheduler = () => {
    if (isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
    } else {
      intervalRef.current = setInterval(checkJobs, 1000);
      setIsRunning(true);
    }
  };

  // Add new job
  const addJob = () => {
    if (!newJob.name || !newJob.expression || !newJob.url) return;
    if (!validateCronExpression(newJob.expression)) return;

    const job: CronJob = {
      id: Date.now().toString(),
      name: newJob.name,
      expression: newJob.expression,
      url: newJob.url,
      method: newJob.method,
      headers: newJob.headers,
      body: newJob.body,
      enabled: true,
      nextRun: getNextRunTime(newJob.expression),
      lastRun: null,
      status: "idle",
      logs: [],
    };

    setJobs((prev) => [...prev, job]);
    setNewJob({
      name: "",
      expression: "",
      url: "",
      method: "GET",
      headers: "{}",
      body: "",
    });
    setManualSchedule({
      minute: "*",
      hour: "*",
      day: "*",
      month: "*",
      weekday: "*",
    });
  };

  // Toggle job enabled status
  const toggleJob = (id: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id
          ? {
              ...job,
              enabled: !job.enabled,
              nextRun: !job.enabled ? getNextRunTime(job.expression) : null,
            }
          : job,
      ),
    );
  };

  // Delete job
  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
  };

  // Run job manually
  const runJobManually = (job: CronJob) => {
    executeJob(job);
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cron-scheduler-jobs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CronJob[];
        const restoredJobs = parsed.map((job) => ({
          ...job,
          nextRun: job.nextRun ? new Date(job.nextRun) : null,
          lastRun: job.lastRun ? new Date(job.lastRun) : null,
          logs: job.logs.map((log) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          })),
        }));
        setJobs(restoredJobs);
      } catch (error) {
        console.error("Failed to load jobs from localStorage:", error);
      }
    }
  }, []);

  // Save to localStorage when jobs change
  useEffect(() => {
    localStorage.setItem("cron-scheduler-jobs", JSON.stringify(jobs));
  }, [jobs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStatusIcon = (status: CronJob["status"]) => {
    switch (status) {
      case "running":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Cron Job Scheduler</h1>
        <p className="text-muted-foreground">
          Schedule and manage API calls with cron expressions
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleScheduler}
            variant={isRunning ? "destructive" : "default"}
            size="sm"
          >
            {isRunning ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Stop Scheduler</span>
                <span className="sm:hidden">Stop</span>
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Start Scheduler</span>
                <span className="sm:hidden">Start</span>
              </>
            )}
          </Button>
          <Badge variant={isRunning ? "default" : "secondary"}>
            {isRunning ? "Running" : "Stopped"}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Active Jobs: {jobs.filter((j) => j.enabled).length} / {jobs.length}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduler" className="text-xs sm:text-sm">
            <Settings className="mr-1 h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Scheduler</span>
            <span className="sm:hidden">Setup</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
            <Timer className="mr-1 h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs sm:text-sm">
            <History className="mr-1 h-4 w-4 sm:mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduler" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Job</CardTitle>
              <CardDescription>
                Create a new scheduled API call with cron expression
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Job Name</Label>
                  <Input
                    id="name"
                    value={newJob.name}
                    onChange={(e) =>
                      setNewJob((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Health Check"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={newJob.url}
                    onChange={(e) =>
                      setNewJob((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="https://api.example.com/health"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expression">Cron Expression</Label>
                  <Input
                    id="expression"
                    value={newJob.expression}
                    onChange={(e) => {
                      setNewJob((prev) => ({
                        ...prev,
                        expression: e.target.value,
                      }));
                      updateManualFromCron(e.target.value);
                    }}
                    placeholder="*/5 * * * *"
                    className={
                      !validateCronExpression(newJob.expression) &&
                      newJob.expression
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {newJob.expression &&
                    !validateCronExpression(newJob.expression) && (
                      <p className="text-sm text-red-500">
                        Invalid cron expression
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label>Manual Schedule Builder</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    <div className="space-y-1">
                      <Label className="text-xs">Minute</Label>
                      <Select
                        value={manualSchedule.minute}
                        onValueChange={(value) => {
                          const newManual = {
                            ...manualSchedule,
                            minute: value,
                          };
                          setManualSchedule(newManual);
                          updateCronFromManual(newManual);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">Every minute</SelectItem>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="45">45</SelectItem>
                          <SelectItem value="*/5">Every 5 min</SelectItem>
                          <SelectItem value="*/10">Every 10 min</SelectItem>
                          <SelectItem value="*/15">Every 15 min</SelectItem>
                          <SelectItem value="*/30">Every 30 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hour</Label>
                      <Select
                        value={manualSchedule.hour}
                        onValueChange={(value) => {
                          const newManual = { ...manualSchedule, hour: value };
                          setManualSchedule(newManual);
                          updateCronFromManual(newManual);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">Every hour</SelectItem>
                          <SelectItem value="0">Midnight (0)</SelectItem>
                          <SelectItem value="6">6 AM</SelectItem>
                          <SelectItem value="9">9 AM</SelectItem>
                          <SelectItem value="12">Noon (12)</SelectItem>
                          <SelectItem value="18">6 PM</SelectItem>
                          <SelectItem value="*/6">Every 6 hours</SelectItem>
                          <SelectItem value="*/12">Every 12 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Day</Label>
                      <Select
                        value={manualSchedule.day}
                        onValueChange={(value) => {
                          const newManual = { ...manualSchedule, day: value };
                          setManualSchedule(newManual);
                          updateCronFromManual(newManual);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">Every day</SelectItem>
                          <SelectItem value="1">1st</SelectItem>
                          <SelectItem value="15">15th</SelectItem>
                          <SelectItem value="*/7">Every 7 days</SelectItem>
                          <SelectItem value="*/14">Every 14 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Month</Label>
                      <Select
                        value={manualSchedule.month}
                        onValueChange={(value) => {
                          const newManual = { ...manualSchedule, month: value };
                          setManualSchedule(newManual);
                          updateCronFromManual(newManual);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">Every month</SelectItem>
                          <SelectItem value="1">January</SelectItem>
                          <SelectItem value="2">February</SelectItem>
                          <SelectItem value="3">March</SelectItem>
                          <SelectItem value="4">April</SelectItem>
                          <SelectItem value="5">May</SelectItem>
                          <SelectItem value="6">June</SelectItem>
                          <SelectItem value="7">July</SelectItem>
                          <SelectItem value="8">August</SelectItem>
                          <SelectItem value="9">September</SelectItem>
                          <SelectItem value="10">October</SelectItem>
                          <SelectItem value="11">November</SelectItem>
                          <SelectItem value="12">December</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Weekday</Label>
                      <Select
                        value={manualSchedule.weekday}
                        onValueChange={(value) => {
                          const newManual = {
                            ...manualSchedule,
                            weekday: value,
                          };
                          setManualSchedule(newManual);
                          updateCronFromManual(newManual);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">Every day</SelectItem>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                          <SelectItem value="1-5">Weekdays</SelectItem>
                          <SelectItem value="0,6">Weekends</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Use the dropdowns above to build your schedule, or type
                    directly in the cron expression field
                  </div>
                  {newJob.expression &&
                    validateCronExpression(newJob.expression) && (
                      <div className="rounded bg-blue-50 p-3 text-sm">
                        <div className="font-medium text-blue-900">
                          Schedule Preview:
                        </div>
                        <div className="text-blue-700">
                          {getCronDescription(newJob.expression)}
                        </div>
                        {getNextRunTime(newJob.expression) && (
                          <div className="mt-1 text-xs text-blue-600">
                            Next run:{" "}
                            {getNextRunTime(
                              newJob.expression,
                            )?.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select
                    value={newJob.method}
                    onValueChange={(value: "GET" | "POST" | "PUT" | "DELETE") =>
                      setNewJob((prev) => ({ ...prev, method: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="headers">Headers (JSON)</Label>
                  <Textarea
                    id="headers"
                    value={newJob.headers}
                    onChange={(e) =>
                      setNewJob((prev) => ({
                        ...prev,
                        headers: e.target.value,
                      }))
                    }
                    placeholder='{"Authorization": "Bearer token"}'
                    rows={3}
                    className="text-sm"
                  />
                </div>
                {newJob.method !== "GET" && (
                  <div className="space-y-2">
                    <Label htmlFor="body">Request Body</Label>
                    <Textarea
                      id="body"
                      value={newJob.body}
                      onChange={(e) =>
                        setNewJob((prev) => ({ ...prev, body: e.target.value }))
                      }
                      placeholder='{"key": "value"}'
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {CRON_PRESETS.map((preset) => (
                    <Button
                      key={preset.expression}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewJob((prev) => ({
                          ...prev,
                          expression: preset.expression,
                        }));
                        updateManualFromCron(preset.expression);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={addJob}
                disabled={
                  !newJob.name ||
                  !newJob.url ||
                  !validateCronExpression(newJob.expression)
                }
                className="w-full"
              >
                Add Job
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cron expressions use 5 fields: minute (0-59), hour (0-23), day
              (1-31), month (1-12), weekday (0-6). Jobs only run while this tab
              is open in your browser.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No Jobs Scheduled
                </h3>
                <p className="text-center text-muted-foreground">
                  Switch to the Scheduler tab to create your first cron job.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg">
                            {job.name}
                          </CardTitle>
                          <CardDescription className="break-all text-sm">
                            {job.method} {job.url}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={job.enabled ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {job.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleJob(job.id)}
                          className="text-xs"
                        >
                          {job.enabled ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runJobManually(job)}
                          disabled={job.status === "running"}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteJob(job.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground sm:text-sm">
                          Expression
                        </div>
                        <div className="break-all font-mono text-xs sm:text-sm">
                          {job.expression}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground sm:text-sm">
                          Next Run
                        </div>
                        <div className="text-xs sm:text-sm">
                          {job.nextRun
                            ? job.nextRun.toLocaleString()
                            : "Not scheduled"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground sm:text-sm">
                          Last Run
                        </div>
                        <div className="text-xs sm:text-sm">
                          {job.lastRun ? job.lastRun.toLocaleString() : "Never"}
                        </div>
                      </div>
                    </div>
                    {job.logs.length > 0 && (
                      <div className="mt-4">
                        <div className="mb-2 text-xs font-medium text-muted-foreground sm:text-sm">
                          Recent Activity
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {job.logs.slice(0, 10).map((log) => (
                            <div
                              key={log.id}
                              className={`h-3 w-3 rounded-full ${
                                log.status === "success"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                              title={`${log.status} - ${log.timestamp.toLocaleString()}`}
                            />
                          ))}
                          {job.logs.length > 10 && (
                            <span className="text-xs text-muted-foreground">
                              +{job.logs.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No Logs Available
                </h3>
                <p className="text-center text-muted-foreground">
                  Job execution logs will appear here once you start running
                  jobs.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">
                      {job.name} Logs
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {job.logs.length} execution
                      {job.logs.length !== 1 ? "s" : ""} recorded
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {job.logs.length === 0 ? (
                      <p className="py-4 text-center text-muted-foreground">
                        No executions yet
                      </p>
                    ) : (
                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {job.logs.map((log) => (
                          <div
                            key={log.id}
                            className={`rounded-lg border p-3 ${
                              log.status === "success"
                                ? "border-green-200 bg-green-500"
                                : "border-red-200 bg-red-600"
                            }`}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-2">
                                {log.status === "success" ? (
                                  <CheckCircle className="h-4 w-4 text-black" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-black" />
                                )}
                                <span className="text-sm font-medium">
                                  {log.status === "success"
                                    ? "Success"
                                    : "Error"}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {log.duration}ms
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {log.timestamp.toLocaleString()}
                              </span>
                            </div>
                            {log.error && (
                              <p className="mt-2 break-words text-sm text-black">
                                {log.error}
                              </p>
                            )}
                            {log.response && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-sm text-muted-foreground">
                                  Response
                                </summary>
                                <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
                                  {log.response}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ToolsWrapper>
  );
}
