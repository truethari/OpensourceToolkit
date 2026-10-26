"use client";

import React from "react";
import { ChevronDown, CircleAlert, Lock, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { LIMITATIONS, PRIVACY_POINTS, SITE_PRIVACY_NOTE } from "./data";

export function PrivacyNotice() {
  return (
    <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/20">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 font-semibold text-teal-800 dark:text-teal-300">
          <Lock className="h-5 w-5" />
          Private by design: everything happens on your device
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PRIVACY_POINTS.map((p) => (
            <div key={p.title} className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              <div className="min-w-0 text-sm">
                <div className="font-medium">{p.title}</div>
                <div className="text-muted-foreground">{p.text}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {SITE_PRIVACY_NOTE}
        </p>
      </CardContent>
    </Card>
  );
}

export function Limitations() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CircleAlert className="h-5 w-5 text-amber-500" />
          What this tool can&apos;t do
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Running entirely in the browser keeps your keys private, but a web
          page can&apos;t do everything desktop software can. Here&apos;s
          exactly what that means.
        </p>
      </CardHeader>
      <CardContent className="divide-y">
        {LIMITATIONS.map((item) => (
          <details key={item.title} className="group py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              {item.title}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
            {item.workaround && (
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {item.workaround}
              </pre>
            )}
          </details>
        ))}
      </CardContent>
    </Card>
  );
}
