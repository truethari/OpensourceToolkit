"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Copy,
  Check,
  Database,
  Download,
  Settings,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface SQLTemplate {
  name: string;
  description: string;
  query: string;
  dialect: string;
}

interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}

export default function SQLFormatter() {
  const [inputSQL, setInputSQL] = useState("");
  const [outputSQL, setOutputSQL] = useState("");
  const [selectedDialect, setSelectedDialect] = useState("mysql");
  const [operation, setOperation] = useState("format");
  const [indentSize, setIndentSize] = useState("2");
  const [uppercaseKeywords, setUppercaseKeywords] = useState(true);
  const [newlineBeforeKeywords, setNewlineBeforeKeywords] = useState(true);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const templates: SQLTemplate[] = [
    {
      name: "Basic SELECT",
      description: "Simple SELECT query with WHERE clause",
      dialect: "mysql",
      query: `SELECT id, name, email, created_at FROM users WHERE status = 'active' AND age > 18 ORDER BY created_at DESC LIMIT 10;`,
    },
    {
      name: "JOIN Query",
      description: "JOIN query with multiple tables",
      dialect: "mysql",
      query: `SELECT u.name, p.title, c.name as category FROM users u INNER JOIN posts p ON u.id = p.user_id LEFT JOIN categories c ON p.category_id = c.id WHERE u.status = 'active' ORDER BY p.created_at DESC;`,
    },
    {
      name: "Complex Query",
      description: "Complex query with subqueries and aggregation",
      dialect: "mysql",
      query: `SELECT u.name, COUNT(p.id) as post_count, AVG(p.views) as avg_views FROM users u LEFT JOIN posts p ON u.id = p.user_id WHERE u.id IN (SELECT user_id FROM subscriptions WHERE plan = 'premium') GROUP BY u.id, u.name HAVING COUNT(p.id) > 5 ORDER BY avg_views DESC;`,
    },
    {
      name: "INSERT Statement",
      description: "INSERT with multiple values",
      dialect: "mysql",
      query: `INSERT INTO users (name, email, password, status, created_at) VALUES ('John Doe', 'john@example.com', 'hashed_password', 'active', NOW()), ('Jane Smith', 'jane@example.com', 'hashed_password', 'active', NOW());`,
    },
    {
      name: "UPDATE Statement",
      description: "UPDATE with JOIN",
      dialect: "mysql",
      query: `UPDATE users u INNER JOIN user_profiles up ON u.id = up.user_id SET u.last_login = NOW(), up.login_count = up.login_count + 1 WHERE u.email = 'user@example.com';`,
    },
    {
      name: "CREATE TABLE",
      description: "CREATE TABLE with constraints",
      dialect: "mysql",
      query: `CREATE TABLE posts (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, content TEXT, user_id INT NOT NULL, category_id INT, status ENUM('draft', 'published', 'archived') DEFAULT 'draft', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_user_id (user_id), INDEX idx_status (status), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);`,
    },
  ];

  const dialects = [
    { value: "mysql", label: "MySQL" },
    { value: "postgresql", label: "PostgreSQL" },
    { value: "sqlite", label: "SQLite" },
    { value: "oracle", label: "Oracle" },
    { value: "mssql", label: "SQL Server" },
    { value: "standard", label: "Standard SQL" },
  ];

  // SQL Keywords for formatting
  const sqlKeywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "JOIN",
    "INNER JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "FULL JOIN",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "ALTER",
    "DROP",
    "TABLE",
    "INDEX",
    "VIEW",
    "AND",
    "OR",
    "NOT",
    "IN",
    "EXISTS",
    "BETWEEN",
    "LIKE",
    "IS NULL",
    "IS NOT NULL",
    "ORDER BY",
    "GROUP BY",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "UNION",
    "UNION ALL",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
    "IF",
    "IFNULL",
    "COALESCE",
    "COUNT",
    "SUM",
    "AVG",
    "MIN",
    "MAX",
    "DISTINCT",
    "AS",
  ];

  // Basic SQL validation
  const validateSQL = useCallback((sql: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    const lines = sql.split("\n");

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Check for unmatched parentheses
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push({
          line: lineIndex + 1,
          column: line.length,
          message: "Unmatched parentheses",
          severity: "warning",
        });
      }

      // Check for missing semicolon at end of statement
      if (
        trimmedLine.match(
          /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i,
        ) &&
        !trimmedLine.endsWith(";") &&
        lineIndex === lines.length - 1
      ) {
        errors.push({
          line: lineIndex + 1,
          column: line.length,
          message: "Missing semicolon at end of statement",
          severity: "warning",
        });
      }

      // Check for SQL injection patterns (basic)
      if (line.match(/['"][^'"]*['"]\s*;?\s*(--|\/\*)/i)) {
        errors.push({
          line: lineIndex + 1,
          column: line.indexOf("--") || line.indexOf("/*"),
          message: "Potential SQL injection pattern detected",
          severity: "error",
        });
      }
    });

    return errors;
  }, []);

  // Format SQL query
  const formatSQL = useCallback(
    (sql: string): string => {
      if (!sql.trim()) return "";

      let formatted = sql;
      const indent = " ".repeat(parseInt(indentSize));

      // Remove extra whitespace
      formatted = formatted.replace(/\s+/g, " ").trim();

      // Handle keyword casing
      if (uppercaseKeywords) {
        sqlKeywords.forEach((keyword) => {
          const regex = new RegExp(
            `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "gi",
          );
          formatted = formatted.replace(regex, keyword.toUpperCase());
        });
      }

      // Add newlines before major keywords
      if (newlineBeforeKeywords) {
        const majorKeywords = [
          "SELECT",
          "FROM",
          "WHERE",
          "JOIN",
          "INNER JOIN",
          "LEFT JOIN",
          "RIGHT JOIN",
          "ORDER BY",
          "GROUP BY",
          "HAVING",
          "LIMIT",
          "UNION",
        ];

        majorKeywords.forEach((keyword) => {
          const regex = new RegExp(
            `\\s+(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`,
            "gi",
          );
          if (uppercaseKeywords) {
            formatted = formatted.replace(regex, `\n${keyword.toUpperCase()}`);
          } else {
            formatted = formatted.replace(regex, (match, p1) => `\n${p1}`);
          }
        });
      }

      // Handle subqueries indentation
      let indentLevel = 0;
      const lines = formatted.split("\n");
      const formattedLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return "";

        // Decrease indent for closing parentheses
        if (trimmed.startsWith(")")) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        const indentedLine = indent.repeat(indentLevel) + trimmed;

        // Increase indent for opening parentheses
        if (trimmed.includes("(") && !trimmed.includes(")")) {
          indentLevel++;
        }

        return indentedLine;
      });

      return formattedLines.join("\n");
    },
    [indentSize, uppercaseKeywords, newlineBeforeKeywords],
  );

  // Minify SQL query
  const minifySQL = useCallback((sql: string): string => {
    if (!sql.trim()) return "";

    return sql
      .replace(/\s+/g, " ")
      .replace(/\s*([(),;])\s*/g, "$1")
      .replace(/\s*(=|<|>|<=|>=|!=|<>)\s*/g, "$1")
      .trim();
  }, []);

  // Process SQL based on operation
  const processSQL = useCallback(() => {
    if (!inputSQL.trim()) {
      setErrors([
        {
          line: 1,
          column: 1,
          message: "Please enter a SQL query",
          severity: "error",
        },
      ]);
      setOutputSQL("");
      return;
    }

    try {
      setErrors([]);
      let result = "";

      // Validate SQL
      const validationErrors = validateSQL(inputSQL);
      setErrors(validationErrors);

      // Process based on operation
      switch (operation) {
        case "format":
          result = formatSQL(inputSQL);
          break;
        case "minify":
          result = minifySQL(inputSQL);
          break;
        case "validate":
          result = inputSQL; // Keep original for validation view
          break;
        default:
          result = formatSQL(inputSQL);
      }

      setOutputSQL(result);
    } catch (err) {
      setErrors([
        {
          line: 1,
          column: 1,
          message: err instanceof Error ? err.message : "Error processing SQL",
          severity: "error",
        },
      ]);
      setOutputSQL("");
    }
  }, [inputSQL, operation, formatSQL, minifySQL, validateSQL]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const downloadResult = () => {
    if (!outputSQL) return;

    const blob = new Blob([outputSQL], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted-query.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadTemplate = (template: SQLTemplate) => {
    setInputSQL(template.query);
    setSelectedDialect(template.dialect);
  };

  const clearAll = () => {
    setInputSQL("");
    setOutputSQL("");
    setErrors([]);
  };

  const getOptimizationTips = useMemo(() => {
    if (!inputSQL) return [];

    const tips: string[] = [];
    const upperSQL = inputSQL.toUpperCase();

    if (upperSQL.includes("SELECT *")) {
      tips.push(
        "Avoid SELECT * - specify only the columns you need for better performance",
      );
    }

    if (upperSQL.includes("WHERE") && !upperSQL.includes("INDEX")) {
      tips.push("Consider adding indexes on columns used in WHERE clauses");
    }

    if (upperSQL.match(/LIKE\s+'%[^%]+%'/)) {
      tips.push(
        "Leading wildcards in LIKE queries can't use indexes - consider full-text search",
      );
    }

    if (upperSQL.includes("ORDER BY") && !upperSQL.includes("LIMIT")) {
      tips.push("ORDER BY without LIMIT can be expensive on large datasets");
    }

    if (upperSQL.match(/WHERE.*OR.*OR/)) {
      tips.push(
        "Multiple OR conditions might benefit from UNION or restructuring",
      );
    }

    return tips;
  }, [inputSQL]);

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">
          SQL Query Formatter & Validator
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Format, validate, and optimize SQL queries with support for multiple
          database dialects
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Database Dialect</Label>
              <Select
                value={selectedDialect}
                onValueChange={setSelectedDialect}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dialects.map((dialect) => (
                    <SelectItem key={dialect.value} value={dialect.value}>
                      {dialect.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Indent Size</Label>
              <Select value={indentSize} onValueChange={setIndentSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 spaces</SelectItem>
                  <SelectItem value="4">4 spaces</SelectItem>
                  <SelectItem value="8">8 spaces</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="uppercase">Uppercase Keywords</Label>
              <Switch
                id="uppercase"
                checked={uppercaseKeywords}
                onCheckedChange={setUppercaseKeywords}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="newlines">Newline Before Keywords</Label>
              <Switch
                id="newlines"
                checked={newlineBeforeKeywords}
                onCheckedChange={setNewlineBeforeKeywords}
              />
            </div>
          </CardContent>
        </Card>

        {/* Operation Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Operation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={operation} onValueChange={setOperation}>
              <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3">
                <TabsTrigger value="format" className="text-sm">
                  Format
                </TabsTrigger>
                <TabsTrigger value="minify" className="text-sm">
                  Minify
                </TabsTrigger>
                <TabsTrigger value="validate" className="text-sm">
                  Validate
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={processSQL} className="w-full sm:flex-1">
                <Database className="mr-2 h-4 w-4" />
                {operation === "format"
                  ? "Format SQL"
                  : operation === "minify"
                    ? "Minify SQL"
                    : "Validate SQL"}
              </Button>
              <Button
                variant="outline"
                onClick={clearAll}
                className="w-full sm:w-auto"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Query Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate(template)}
                  className="h-auto w-full justify-start p-3 text-left"
                >
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {template.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              SQL Input
            </CardTitle>
            <CardDescription>Enter your SQL query here</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={inputSQL}
              onChange={(e) => setInputSQL(e.target.value)}
              placeholder="Enter your SQL query here...

Example:
SELECT users.name, COUNT(posts.id) as post_count
FROM users 
LEFT JOIN posts ON users.id = posts.user_id 
WHERE users.status = 'active' 
GROUP BY users.id 
ORDER BY post_count DESC;"
              className="min-h-[350px] resize-none font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Output</CardTitle>
              <CardDescription>
                {operation === "format"
                  ? "Formatted SQL"
                  : operation === "minify"
                    ? "Minified SQL"
                    : "Validation Results"}
              </CardDescription>
            </div>
            {outputSQL && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(outputSQL)}
                  className="w-full sm:w-auto"
                >
                  {copiedOutput ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadResult}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.length > 0 && (
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <Alert
                    key={index}
                    variant={
                      error.severity === "error" ? "destructive" : "default"
                    }
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Line {error.line}, Column {error.column}: {error.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <Textarea
              value={outputSQL}
              readOnly
              placeholder="Processed SQL will appear here..."
              className="min-h-[350px] resize-none font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      {/* Optimization Tips */}
      {getOptimizationTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Optimization Tips
            </CardTitle>
            <CardDescription>
              Suggestions to improve your query performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {getOptimizationTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" />
                  <span className="text-sm text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>SQL Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold">Basic Queries</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <code className="rounded bg-muted px-1">SELECT</code> -
                  Retrieve data
                </li>
                <li>
                  <code className="rounded bg-muted px-1">INSERT</code> - Add
                  data
                </li>
                <li>
                  <code className="rounded bg-muted px-1">UPDATE</code> - Modify
                  data
                </li>
                <li>
                  <code className="rounded bg-muted px-1">DELETE</code> - Remove
                  data
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Joins</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <code className="rounded bg-muted px-1">INNER JOIN</code> -
                  Matching records
                </li>
                <li>
                  <code className="rounded bg-muted px-1">LEFT JOIN</code> - All
                  from left
                </li>
                <li>
                  <code className="rounded bg-muted px-1">RIGHT JOIN</code> -
                  All from right
                </li>
                <li>
                  <code className="rounded bg-muted px-1">FULL JOIN</code> - All
                  records
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Functions</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <code className="rounded bg-muted px-1">COUNT()</code> - Count
                  rows
                </li>
                <li>
                  <code className="rounded bg-muted px-1">SUM()</code> - Sum
                  values
                </li>
                <li>
                  <code className="rounded bg-muted px-1">AVG()</code> - Average
                </li>
                <li>
                  <code className="rounded bg-muted px-1">GROUP BY</code> -
                  Group results
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
