"use client";

import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Play,
  Pause,
  Clock,
  Globe,
  Trash2,
  XCircle,
  Download,
  Activity,
  BarChart3,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface MonitoredSite {
  id: string;
  url: string;
  name: string;
  interval: number;
  isActive: boolean;
  lastCheck?: Date;
  status: "up" | "down" | "warning" | "unknown";
  responseTime?: number;
  statusCode?: number;
  history: StatusCheck[];
}

interface StatusCheck {
  timestamp: Date;
  status: "up" | "down" | "warning";
  responseTime: number;
  statusCode: number;
}

const STATUS_COLORS = {
  up: "#22c55e",
  warning: "#eab308",
  down: "#ef4444",
  unknown: "#6b7280",
};

const STATUS_ICONS = {
  up: CheckCircle,
  warning: AlertTriangle,
  down: XCircle,
  unknown: Clock,
};

export default function UptimeMonitor() {
  const [sites, setSites] = useState<MonitoredSite[]>([]);
  const [newSite, setNewSite] = useState({ url: "", name: "", interval: 60 });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addSite = () => {
    if (!newSite.url || !newSite.name) {
      toast.error("Please fill in all fields");
      return;
    }

    const url = newSite.url.startsWith("http")
      ? newSite.url
      : `https://${newSite.url}`;

    const site: MonitoredSite = {
      id: crypto.randomUUID(),
      url,
      name: newSite.name,
      interval: newSite.interval,
      isActive: false,
      status: "unknown",
      history: [],
    };

    setSites((prev) => [...prev, site]);
    setNewSite({ url: "", name: "", interval: 60 });
    toast.success("Site added successfully");
  };

  const removeSite = (id: string) => {
    stopMonitoring(id);
    setSites((prev) => prev.filter((site) => site.id !== id));
    if (selectedSite === id) {
      setSelectedSite(null);
    }
    toast.success("Site removed");
  };

  const checkSiteStatus = async (site: MonitoredSite): Promise<StatusCheck> => {
    const startTime = Date.now();

    try {
      // First, try a fetch request with no-cors mode
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(site.url, {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const status: "up" | "down" | "warning" =
        responseTime > 5000 ? "warning" : "up";

      return {
        timestamp: new Date(),
        status,
        responseTime,
        statusCode: response.type === "opaque" ? 200 : 0,
      };
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      // If fetch fails, try alternative method using Image loading
      // This works for many sites and bypasses CORS for basic connectivity
      try {
        const imageCheck = await new Promise<boolean>((resolve) => {
          const img = new Image();
          const imageTimeout = setTimeout(() => {
            resolve(false);
          }, 5000);

          img.onload = () => {
            clearTimeout(imageTimeout);
            resolve(true);
          };

          img.onerror = () => {
            clearTimeout(imageTimeout);
            // Even if the image fails to load, it means we reached the server
            resolve(true);
          };

          // Try to load favicon or a small image from the domain
          const urlObj = new URL(site.url);
          img.src = `${urlObj.protocol}//${urlObj.host}/favicon.ico?_=${Date.now()}`;
        });

        const responseTime = Date.now() - startTime;

        return {
          timestamp: new Date(),
          status: imageCheck
            ? responseTime > 5000
              ? "warning"
              : "up"
            : "down",
          responseTime,
          statusCode: imageCheck ? 200 : 0,
        };
      } catch (imageError) {
        console.error("Image check error:", imageError);
        const responseTime = Date.now() - startTime;

        return {
          timestamp: new Date(),
          status: "down",
          responseTime: responseTime > 0 ? responseTime : 8000,
          statusCode: 0,
        };
      }
    }
  };

  const performCheck = async (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;

    try {
      const check = await checkSiteStatus(site);

      setSites((prev) =>
        prev.map((s) => {
          if (s.id === siteId) {
            const updatedHistory = [...s.history, check].slice(-100); // Keep last 100 checks
            return {
              ...s,
              lastCheck: check.timestamp,
              status: check.status,
              responseTime: check.responseTime,
              statusCode: check.statusCode,
              history: updatedHistory,
            };
          }
          return s;
        }),
      );
    } catch (error) {
      console.error("Error checking site:", error);
    }
  };

  const startMonitoring = (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;

    // Initial check
    performCheck(siteId);

    // Set up interval
    const intervalId = setInterval(() => {
      performCheck(siteId);
    }, site.interval * 1000);

    intervalRefs.current.set(siteId, intervalId);

    setSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, isActive: true } : s)),
    );
  };

  const stopMonitoring = (siteId: string) => {
    const intervalId = intervalRefs.current.get(siteId);
    if (intervalId) {
      clearInterval(intervalId);
      intervalRefs.current.delete(siteId);
    }

    setSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, isActive: false } : s)),
    );
  };

  const toggleMonitoring = (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;

    if (site.isActive) {
      stopMonitoring(siteId);
      toast.success("Monitoring stopped");
    } else {
      startMonitoring(siteId);
      toast.success("Monitoring started");
    }
  };

  const startAllMonitoring = () => {
    sites.forEach((site) => {
      if (!site.isActive) {
        startMonitoring(site.id);
      }
    });
    setIsMonitoring(true);
    toast.success("Started monitoring all sites");
  };

  const stopAllMonitoring = () => {
    sites.forEach((site) => {
      if (site.isActive) {
        stopMonitoring(site.id);
      }
    });
    setIsMonitoring(false);
    toast.success("Stopped monitoring all sites");
  };

  const exportData = () => {
    const data = {
      sites,
      exportedAt: new Date().toISOString(),
      totalSites: sites.length,
      activeSites: sites.filter((s) => s.isActive).length,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uptime-monitor-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const getStatusChart = (site: MonitoredSite) => {
    if (!site.history.length) return null;

    const height = 40;
    // Use a responsive approach - limit history to recent checks for mobile
    const maxBars = isMobile ? 50 : 100;
    const recentHistory = site.history.slice(-maxBars);

    return (
      <div className="relative">
        <div className="mb-1 text-xs text-muted-foreground">
          Status History (Last {recentHistory.length} checks)
        </div>
        <div className="w-full overflow-hidden rounded border">
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${recentHistory.length} ${height}`}
            preserveAspectRatio="none"
            className="w-full"
          >
            {recentHistory.map((check, index) => (
              <rect
                key={index}
                x={index}
                y={0}
                width={1}
                height={height}
                fill={STATUS_COLORS[check.status]}
              />
            ))}
          </svg>
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>Oldest</span>
          <span>Latest</span>
        </div>
      </div>
    );
  };

  const getCommandLineChart = (site: MonitoredSite) => {
    if (!site.history.length) return null;

    const recent = site.history.slice(-20); // Last 20 checks

    return (
      <div className="rounded bg-black p-4 font-mono text-sm text-green-400">
        <div className="mb-2 text-white">
          $ uptime-monitor --site={site.name}
        </div>
        {recent.map((check, index) => {
          const color =
            check.status === "up"
              ? "text-green-400"
              : check.status === "warning"
                ? "text-yellow-400"
                : "text-red-400";
          const symbol =
            check.status === "up"
              ? "●"
              : check.status === "warning"
                ? "◐"
                : "○";

          return (
            <div key={index} className={`${color} flex items-center gap-2`}>
              <span>{symbol}</span>
              <span>{check.timestamp.toLocaleTimeString()}</span>
              <span>{check.status.toUpperCase()}</span>
              <span>{check.responseTime}ms</span>
              <span>HTTP {check.statusCode}</span>
            </div>
          );
        })}
        <div className="mt-2 text-white">● UP ◐ WARNING ○ DOWN</div>
      </div>
    );
  };

  const calculateUptime = (site: MonitoredSite) => {
    if (!site.history.length) return 0;

    const upChecks = site.history.filter(
      (check) => check.status === "up",
    ).length;
    return ((upChecks / site.history.length) * 100).toFixed(2);
  };

  const getAverageResponseTime = (site: MonitoredSite) => {
    if (!site.history.length) return 0;

    const totalTime = site.history.reduce(
      (sum, check) => sum + check.responseTime,
      0,
    );
    return Math.round(totalTime / site.history.length);
  };

  // Handle mobile detection
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    const currentIntervals = intervalRefs.current;
    return () => {
      currentIntervals.forEach((intervalId) => clearInterval(intervalId));
    };
  }, []);

  useEffect(() => {
    if (isMonitoring && !selectedSite) {
      const firstActiveSite = sites.find((s) => s.isActive);
      if (firstActiveSite) setSelectedSite(firstActiveSite.id);
    }
  }, [isMonitoring, selectedSite, sites]);

  const selectedSiteData = selectedSite
    ? sites.find((s) => s.id === selectedSite)
    : null;

  return (
    <ToolsWrapper>
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
          <Activity className="h-8 w-8 text-blue-500" />
          Uptime Monitor
        </h1>
        <p className="text-muted-foreground">
          Monitor website uptime and performance with real-time status tracking
          and command-line style visualization
        </p>
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> This tool performs basic connectivity checks
            from your browser. Due to CORS policies, detailed status codes may
            not be available for all sites. The monitor checks if sites are
            reachable and measures response times.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Panel - Site Management */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Site
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  placeholder="My Website"
                  value={newSite.name}
                  onChange={(e) =>
                    setNewSite((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="site-url">URL</Label>
                <Input
                  id="site-url"
                  placeholder="https://example.com"
                  value={newSite.url}
                  onChange={(e) =>
                    setNewSite((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="check-interval">Check Interval (seconds)</Label>
                <Input
                  id="check-interval"
                  type="number"
                  min="30"
                  max="3600"
                  value={newSite.interval}
                  onChange={(e) =>
                    setNewSite((prev) => ({
                      ...prev,
                      interval: parseInt(e.target.value) || 60,
                    }))
                  }
                />
              </div>
              <Button onClick={addSite} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Site
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Monitored Sites ({sites.length})</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={
                      isMonitoring ? stopAllMonitoring : startAllMonitoring
                    }
                    disabled={sites.length === 0}
                  >
                    {isMonitoring ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportData}
                    disabled={sites.length === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sites.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  No sites added yet
                </p>
              ) : (
                <div className="space-y-3">
                  {sites.map((site) => {
                    const StatusIcon = STATUS_ICONS[site.status];
                    return (
                      <div
                        key={site.id}
                        className={`cursor-pointer rounded border p-3 transition-colors ${
                          selectedSite === site.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedSite(site.id)}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusIcon
                              className={`h-4 w-4`}
                              style={{ color: STATUS_COLORS[site.status] }}
                            />
                            <span className="text-sm font-medium">
                              {site.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMonitoring(site.id);
                              }}
                            >
                              {site.isActive ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSite(site.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {site.url}
                        </div>
                        {site.lastCheck && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Last check: {site.lastCheck.toLocaleTimeString()}
                            {site.responseTime && ` • ${site.responseTime}ms`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Details and Charts */}
        <div className="lg:col-span-2">
          {selectedSiteData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {selectedSiteData.name}
                  <Badge
                    variant={
                      selectedSiteData.status === "up"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {selectedSiteData.status.toUpperCase()}
                  </Badge>
                  {selectedSiteData.isActive && (
                    <Badge variant="outline">Monitoring</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="terminal">Terminal View</TabsTrigger>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Status</span>
                          </div>
                          <div
                            className="text-2xl font-bold"
                            style={{
                              color: STATUS_COLORS[selectedSiteData.status],
                            }}
                          >
                            {selectedSiteData.status.toUpperCase()}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">
                              Response Time
                            </span>
                          </div>
                          <div className="text-2xl font-bold">
                            {selectedSiteData.responseTime
                              ? `${selectedSiteData.responseTime}ms`
                              : "N/A"}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">Uptime</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {calculateUptime(selectedSiteData)}%
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="mb-4 text-lg font-semibold">
                        Status History
                      </h3>
                      {getStatusChart(selectedSiteData)}
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div>
                        <span className="font-medium">URL:</span>{" "}
                        {selectedSiteData.url}
                      </div>
                      <div>
                        <span className="font-medium">Check Interval:</span>{" "}
                        {selectedSiteData.interval}s
                      </div>
                      <div>
                        <span className="font-medium">Last Status Code:</span>{" "}
                        {selectedSiteData.statusCode || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Total Checks:</span>{" "}
                        {selectedSiteData.history.length}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="terminal" className="space-y-4">
                    {getCommandLineChart(selectedSiteData)}
                  </TabsContent>

                  <TabsContent value="statistics" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Performance Metrics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span>Average Response Time:</span>
                            <span className="font-medium">
                              {getAverageResponseTime(selectedSiteData)}ms
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fastest Response:</span>
                            <span className="font-medium">
                              {selectedSiteData.history.length > 0
                                ? Math.min(
                                    ...selectedSiteData.history.map(
                                      (h) => h.responseTime,
                                    ),
                                  ) + "ms"
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Slowest Response:</span>
                            <span className="font-medium">
                              {selectedSiteData.history.length > 0
                                ? Math.max(
                                    ...selectedSiteData.history.map(
                                      (h) => h.responseTime,
                                    ),
                                  ) + "ms"
                                : "N/A"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Availability Stats
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span>Total Uptime:</span>
                            <span className="font-medium text-green-600">
                              {calculateUptime(selectedSiteData)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Successful Checks:</span>
                            <span className="font-medium">
                              {
                                selectedSiteData.history.filter(
                                  (h) => h.status === "up",
                                ).length
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Failed Checks:</span>
                            <span className="font-medium text-red-600">
                              {
                                selectedSiteData.history.filter(
                                  (h) => h.status === "down",
                                ).length
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Warning Checks:</span>
                            <span className="font-medium text-yellow-600">
                              {
                                selectedSiteData.history.filter(
                                  (h) => h.status === "warning",
                                ).length
                              }
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {selectedSiteData.history.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Recent Check History
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="max-h-64 space-y-2 overflow-y-auto">
                            {selectedSiteData.history
                              .slice(-10)
                              .reverse()
                              .map((check, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between rounded border p-2 text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-2 w-2 rounded-full"
                                      style={{
                                        backgroundColor:
                                          STATUS_COLORS[check.status],
                                      }}
                                    />
                                    <span>
                                      {check.timestamp.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="font-medium">
                                      {check.status.toUpperCase()}
                                    </span>
                                    <span>{check.responseTime}ms</span>
                                    <span>HTTP {check.statusCode}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No Site Selected
                  </h3>
                  <p className="text-muted-foreground">
                    Add a site and select it to view monitoring details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ToolsWrapper>
  );
}
