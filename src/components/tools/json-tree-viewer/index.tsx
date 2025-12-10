"use client";

import { toast } from "sonner";
import React, { useState, useCallback, useMemo } from "react";
import {
  FileJson,
  Upload,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Search,
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface TreeNodeProps {
  name: string;
  value: unknown;
  level: number;
  searchTerm: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  name,
  value,
  level,
  searchTerm,
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const indent = level * 20;

  const matchesSearch = useCallback(
    (text: string) => {
      if (!searchTerm) return true;
      return text.toLowerCase().includes(searchTerm.toLowerCase());
    },
    [searchTerm],
  );

  const shouldShow = useMemo(() => {
    if (!searchTerm) return true;
    const checkValue = (val: unknown): boolean => {
      if (val === null || val === undefined) return false;
      if (typeof val === "object") {
        return Object.entries(val).some(
          ([k, v]) => matchesSearch(k) || checkValue(v),
        );
      }
      return matchesSearch(String(val));
    };
    return matchesSearch(name) || checkValue(value);
  }, [name, value, searchTerm, matchesSearch]);

  if (!shouldShow) return null;

  const getValueType = (val: unknown): string => {
    if (val === null) return "null";
    if (Array.isArray(val)) return "array";
    return typeof val;
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "string":
        return "text-green-500";
      case "number":
        return "text-blue-500";
      case "boolean":
        return "text-purple-500";
      case "null":
        return "text-gray-500";
      case "array":
        return "text-orange-500";
      case "object":
        return "text-cyan-500";
      default:
        return "text-gray-400";
    }
  };

  const type = getValueType(value);
  const isExpandable = type === "object" || type === "array";

  const renderValue = () => {
    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }

    if (type === "string") {
      return (
        <span className="text-green-500">&quot;{String(value)}&quot;</span>
      );
    }

    if (type === "number" || type === "boolean") {
      return <span className={getTypeColor(type)}>{String(value)}</span>;
    }

    if (type === "array") {
      const arr = value as unknown[];
      return (
        <span className="text-gray-400">
          [{arr.length} {arr.length === 1 ? "item" : "items"}]
        </span>
      );
    }

    if (type === "object") {
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj);
      return (
        <span className="text-gray-400">
          {"{"}
          {keys.length} {keys.length === 1 ? "property" : "properties"}
          {"}"}
        </span>
      );
    }

    return null;
  };

  return (
    <div>
      <div
        className="group flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => isExpandable && setIsExpanded(!isExpanded)}
      >
        {isExpandable ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-500" />
          )
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <span className="font-mono text-sm">
          <span
            className={
              matchesSearch(name) ? "bg-yellow-200 dark:bg-yellow-900" : ""
            }
          >
            {name}
          </span>
          <span className="text-gray-500">: </span>
          {renderValue()}
        </span>
      </div>

      {isExpandable && isExpanded && (
        <div>
          {type === "array"
            ? (value as unknown[]).map((item, index) => (
                <TreeNode
                  key={index}
                  name={`[${index}]`}
                  value={item}
                  level={level + 1}
                  searchTerm={searchTerm}
                />
              ))
            : Object.entries(value as Record<string, unknown>).map(
                ([key, val]) => (
                  <TreeNode
                    key={key}
                    name={key}
                    value={val}
                    level={level + 1}
                    searchTerm={searchTerm}
                  />
                ),
              )}
        </div>
      )}
    </div>
  );
};

interface NodeGraphProps {
  data: unknown;
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  children: string[];
}

const NodeGraph: React.FC<NodeGraphProps> = ({ data }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const levels: Map<number, number> = new Map();

    const processNode = (
      value: unknown,
      path: string,
      level: number,
    ): string => {
      const nodeId = path || "root";
      const levelCount = levels.get(level) || 0;
      levels.set(level, levelCount + 1);

      const type =
        value === null ? "null" : Array.isArray(value) ? "array" : typeof value;

      let label = path.split(".").pop() || "root";
      if (type === "array") {
        label += ` [${(value as unknown[]).length}]`;
      } else if (type === "object" && value !== null) {
        label += ` {${Object.keys(value as Record<string, unknown>).length}}`;
      } else if (type === "string") {
        const strVal = String(value);
        label += `: "${strVal.length > 20 ? strVal.substring(0, 20) + "..." : strVal}"`;
      } else if (type === "number" || type === "boolean") {
        label += `: ${String(value)}`;
      } else if (type === "null") {
        label += ": null";
      }

      const children: string[] = [];

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const childId = processNode(item, `${path}[${index}]`, level + 1);
          children.push(childId);
        });
      } else if (value && typeof value === "object") {
        Object.entries(value as Record<string, unknown>).forEach(
          ([key, val]) => {
            const childPath = path ? `${path}.${key}` : key;
            const childId = processNode(val, childPath, level + 1);
            children.push(childId);
          },
        );
      }

      nodes.push({
        id: nodeId,
        label,
        type,
        x: 0,
        y: 0,
        children,
      });

      return nodeId;
    };

    processNode(data, "", 0);

    // Calculate positions using a tree layout
    const levelNodes = new Map<number, GraphNode[]>();

    nodes.forEach((node) => {
      const level = node.id.split(/[.\[]/).length - 1;
      if (!levelNodes.has(level)) {
        levelNodes.set(level, []);
      }
      levelNodes.get(level)!.push(node);
    });

    const verticalSpacing = 120;
    const horizontalSpacing = 200;

    levelNodes.forEach((levelNodeList, level) => {
      const totalWidth = (levelNodeList.length - 1) * horizontalSpacing;
      levelNodeList.forEach((node, index) => {
        node.y = level * verticalSpacing + 50;
        node.x = index * horizontalSpacing - totalWidth / 2 + 400;
      });
    });

    return nodes;
  }, [data]);

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "string":
        return "#10b981";
      case "number":
        return "#3b82f6";
      case "boolean":
        return "#a855f7";
      case "null":
        return "#6b7280";
      case "array":
        return "#f59e0b";
      case "object":
        return "#06b6d4";
      default:
        return "#9ca3af";
    }
  };

  const viewBox = useMemo(() => {
    if (graphData.length === 0) return "0 0 800 600";

    const maxX = Math.max(...graphData.map((n) => n.x)) + 150;
    const maxY = Math.max(...graphData.map((n) => n.y)) + 100;
    const minX = Math.min(...graphData.map((n) => n.x)) - 150;

    return `${minX} 0 ${maxX - minX} ${maxY}`;
  }, [graphData]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.2, 0.3));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button === 0) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.3, Math.min(3, prev + delta)));
  }, []);

  return (
    <div className="relative w-full rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      {/* Zoom Controls */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-2 md:right-4 md:top-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomIn}
          className="h-8 w-8 p-0 md:h-10 md:w-10"
          title="Zoom In"
        >
          <ZoomIn className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomOut}
          className="h-8 w-8 p-0 md:h-10 md:w-10"
          title="Zoom Out"
        >
          <ZoomOut className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          className="h-8 w-8 p-0 md:h-10 md:w-10"
          title="Reset View"
        >
          <Maximize2 className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute left-2 top-2 z-10 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium dark:bg-gray-800 md:left-4 md:top-4 md:px-3 md:py-1 md:text-sm">
        {Math.round(zoom * 100)}%
      </div>

      <div className="w-full overflow-auto">
        <svg
          width="100%"
          height="600"
          viewBox={viewBox}
          className="min-w-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3, 0 6"
                  className="fill-gray-400 dark:fill-gray-600"
                />
              </marker>
            </defs>

            {/* Draw edges */}
            {graphData.map((node) =>
              node.children.map((childId) => {
                const childNode = graphData.find((n) => n.id === childId);
                if (!childNode) return null;

                return (
                  <line
                    key={`${node.id}-${childId}`}
                    x1={node.x}
                    y1={node.y + 20}
                    x2={childNode.x}
                    y2={childNode.y - 20}
                    className="stroke-gray-300 dark:stroke-gray-700"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              }),
            )}

            {/* Draw nodes */}
            {graphData.map((node) => {
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedNode === node.id;

              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() =>
                    setSelectedNode(node.id === selectedNode ? null : node.id)
                  }
                  className="cursor-pointer"
                >
                  <rect
                    x={node.x - 80}
                    y={node.y - 20}
                    width="160"
                    height="40"
                    rx="8"
                    fill={getTypeColor(node.type)}
                    opacity={isHovered || isSelected ? 1 : 0.8}
                    stroke={isSelected ? "#ffffff" : "none"}
                    strokeWidth={isSelected ? 3 : 0}
                    className="transition-all"
                  />
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    className="pointer-events-none fill-white text-sm font-medium"
                    style={{ fontSize: "12px" }}
                  >
                    {node.label.length > 25
                      ? node.label.substring(0, 25) + "..."
                      : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {selectedNode && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Selected Node:{" "}
            </span>
            <span className="font-mono text-gray-900 dark:text-white">
              {selectedNode}
            </span>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 p-3 dark:border-gray-800 md:p-4">
        <div className="flex flex-wrap gap-2 text-xs md:gap-4">
          <div className="flex items-center gap-1 md:gap-2">
            <div
              className="h-3 w-3 rounded md:h-4 md:w-4"
              style={{ backgroundColor: "#10b981" }}
            />
            <span className="text-gray-600 dark:text-gray-400">String</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div
              className="h-3 w-3 rounded md:h-4 md:w-4"
              style={{ backgroundColor: "#3b82f6" }}
            />
            <span className="text-gray-600 dark:text-gray-400">Number</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div
              className="h-3 w-3 rounded md:h-4 md:w-4"
              style={{ backgroundColor: "#a855f7" }}
            />
            <span className="text-gray-600 dark:text-gray-400">Boolean</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div
              className="h-3 w-3 rounded md:h-4 md:w-4"
              style={{ backgroundColor: "#f59e0b" }}
            />
            <span className="text-gray-600 dark:text-gray-400">Array</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div
              className="h-3 w-3 rounded md:h-4 md:w-4"
              style={{ backgroundColor: "#06b6d4" }}
            />
            <span className="text-gray-600 dark:text-gray-400">Object</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div
              className="h-3 w-3 rounded md:h-4 md:w-4"
              style={{ backgroundColor: "#6b7280" }}
            />
            <span className="text-gray-600 dark:text-gray-400">Null</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function JSONTreeViewer() {
  const [jsonInput, setJsonInput] = useState("");
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fileName, setFileName] = useState("");

  const parseJSON = useCallback((input: string) => {
    if (!input.trim()) {
      setParsedJson(null);
      setError("");
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setParsedJson(parsed);
      setError("");
      toast.success("JSON parsed successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
      setParsedJson(null);
      toast.error("Invalid JSON format");
    }
  }, []);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonInput(content);
        parseJSON(content);
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
      };
      reader.readAsText(file);
    },
    [parseJSON],
  );

  const handleTextInput = useCallback((value: string) => {
    setJsonInput(value);
    setFileName("");
  }, []);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  const exportTree = useCallback(() => {
    if (!parsedJson) {
      toast.error("No JSON to export");
      return;
    }

    const blob = new Blob([JSON.stringify(parsedJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `json-tree-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported successfully");
  }, [parsedJson]);

  const stats = useMemo(() => {
    if (!parsedJson) return null;

    const countNodes = (obj: unknown): number => {
      if (obj === null || typeof obj !== "object") return 1;

      if (Array.isArray(obj)) {
        return 1 + obj.reduce((sum, item) => sum + countNodes(item), 0);
      }

      return (
        1 + Object.values(obj).reduce((sum, val) => sum + countNodes(val), 0)
      );
    };

    const getDepth = (obj: unknown, current = 0): number => {
      if (obj === null || typeof obj !== "object") return current;

      if (Array.isArray(obj)) {
        return obj.length > 0
          ? Math.max(...obj.map((item) => getDepth(item, current + 1)))
          : current + 1;
      }

      const values = Object.values(obj);
      return values.length > 0
        ? Math.max(...values.map((val) => getDepth(val, current + 1)))
        : current + 1;
    };

    const countTypes = (obj: unknown): Record<string, number> => {
      const types: Record<string, number> = {};

      const count = (val: unknown) => {
        const type =
          val === null ? "null" : Array.isArray(val) ? "array" : typeof val;
        types[type] = (types[type] || 0) + 1;

        if (val && typeof val === "object") {
          const values = Array.isArray(val) ? val : Object.values(val);
          values.forEach(count);
        }
      };

      count(obj);
      return types;
    };

    return {
      nodes: countNodes(parsedJson),
      depth: getDepth(parsedJson),
      types: countTypes(parsedJson),
      size: new Blob([JSON.stringify(parsedJson)]).size,
    };
  }, [parsedJson]);

  return (
    <ToolsWrapper>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-600 text-white">
          <FileJson className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
          JSON Tree Viewer
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Visualize JSON structure as an interactive tree with search and
          navigation
        </p>
      </div>

      <div className="grid w-full gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Input JSON</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload" className="mb-2 block">
                  Upload JSON File
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Upload className="h-5 w-5 text-gray-500" />
                </div>
                {fileName && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Loaded: {fileName}
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="absolute -inset-2 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-500 dark:bg-gray-950">
                    OR
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="json-input" className="mb-2 block">
                  Paste JSON
                </Label>
                <Textarea
                  id="json-input"
                  placeholder='{"name": "example", "value": 123}'
                  value={jsonInput}
                  onChange={(e) => handleTextInput(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <Button
                onClick={() => parseJSON(jsonInput)}
                className="w-full"
                disabled={!jsonInput.trim()}
              >
                Parse JSON
              </Button>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
                  <p className="font-mono text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="tree">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tree">Tree View</TabsTrigger>
              <TabsTrigger value="node">Node View</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="tree" className="space-y-4">
              {parsedJson !== null && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>JSON Structure</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(parsedJson, null, 2),
                              "JSON",
                            )
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportTree}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                          placeholder="Search keys or values..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="max-h-[600px] w-full overflow-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                      <TreeNode
                        name="root"
                        value={parsedJson}
                        level={0}
                        searchTerm={searchTerm}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {parsedJson === null && !error && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-gray-500">
                      <FileJson className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>
                        Upload a JSON file or paste JSON to visualize its
                        structure
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="node" className="space-y-4">
              {parsedJson !== null && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Node Graph Visualization</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(parsedJson, null, 2),
                              "JSON",
                            )
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <NodeGraph data={parsedJson} />
                  </CardContent>
                </Card>
              )}

              {parsedJson === null && !error && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-gray-500">
                      <Network className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>
                        Upload a JSON file or paste JSON to visualize as a node
                        graph
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              {stats && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950 md:p-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 md:text-sm">
                            Total Nodes
                          </p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 md:text-2xl">
                            {stats.nodes}
                          </p>
                        </div>
                        <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-950 md:p-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 md:text-sm">
                            Max Depth
                          </p>
                          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 md:text-2xl">
                            {stats.depth}
                          </p>
                        </div>
                        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950 md:p-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 md:text-sm">
                            File Size
                          </p>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400 md:text-2xl">
                            {(stats.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950 md:p-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 md:text-sm">
                            Types Count
                          </p>
                          <p className="text-xl font-bold text-orange-600 dark:text-orange-400 md:text-2xl">
                            {Object.keys(stats.types).length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(stats.types)
                          .sort(([, a], [, b]) => b - a)
                          .map(([type, count]) => (
                            <div key={type}>
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-sm font-medium capitalize">
                                  {type}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {count} (
                                  {((count / stats.nodes) * 100).toFixed(1)}%)
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className="h-full rounded-full bg-cyan-500 transition-all"
                                  style={{
                                    width: `${(count / stats.nodes) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {stats === null && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-gray-500">
                      <FileJson className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>Parse JSON to view statistics</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ToolsWrapper>
  );
}
