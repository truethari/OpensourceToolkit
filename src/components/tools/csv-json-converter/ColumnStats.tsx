"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import type { ColumnStat, ColumnType } from "./utils";

const TYPE_COLORS: Record<ColumnType, string> = {
  number: "bg-blue-500",
  string: "bg-emerald-500",
  boolean: "bg-purple-500",
  object: "bg-amber-500",
  mixed: "bg-orange-500",
  empty: "bg-gray-500",
};

interface ColumnStatsProps {
  stats: ColumnStat[];
  totalRows: number;
}

export default function ColumnStats({ stats, totalRows }: ColumnStatsProps) {
  if (stats.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Load some data to see per-column statistics.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Column</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">Filled</th>
              <th className="px-3 py-2 text-right font-medium">Unique</th>
              <th className="px-3 py-2 text-right font-medium">Range</th>
              <th className="px-3 py-2 text-left font-medium">Sample</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => {
              const pct = totalRows === 0 ? 0 : (stat.filled / totalRows) * 100;
              return (
                <tr key={stat.name} className="border-t">
                  <td
                    className="max-w-[14rem] truncate px-3 py-2 font-medium"
                    title={stat.name}
                  >
                    {stat.name}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      className={`${TYPE_COLORS[stat.type]} text-white hover:opacity-90`}
                    >
                      {stat.type}
                    </Badge>
                  </td>
                  <td className="min-w-[9rem] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2 w-16" />
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {stat.filled}/{totalRows}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    {stat.unique.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-xs">
                    {stat.min !== undefined && stat.max !== undefined
                      ? `${stat.min} – ${stat.max}`
                      : "—"}
                  </td>
                  <td
                    className="max-w-[16rem] truncate px-3 py-2 font-mono text-xs text-muted-foreground"
                    title={stat.sample}
                  >
                    {stat.sample || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
