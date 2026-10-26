"use client";

import React, { useState } from "react";
import { FilePlus2, FileSearch, Send } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { SigningIdentity } from "./lib/p12";
import CreateCertificate from "./CreateCertificate";
import RequestCertificate from "./RequestCertificate";
import InspectCertificate from "./InspectCertificate";

type Section = "create" | "request" | "inspect";

const SECTIONS: { value: Section; label: string; icon: typeof FilePlus2 }[] = [
  { value: "create", label: "Create", icon: FilePlus2 },
  { value: "request", label: "Request from a CA", icon: Send },
  { value: "inspect", label: "Inspect", icon: FileSearch },
];

export default function CertificatesTab({
  onUseIdentity,
}: {
  onUseIdentity: (identity: SigningIdentity) => void;
}) {
  const [section, setSection] = useState<Section>("create");

  return (
    <Card>
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {SECTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSection(value)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                section === value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Hidden instead of unmounted so half-filled forms survive switching */}
        <div className={section === "create" ? "" : "hidden"}>
          <CreateCertificate onUseIdentity={onUseIdentity} />
        </div>
        <div className={section === "request" ? "" : "hidden"}>
          <RequestCertificate onUseIdentity={onUseIdentity} />
        </div>
        <div className={section === "inspect" ? "" : "hidden"}>
          <InspectCertificate />
        </div>
      </CardContent>
    </Card>
  );
}
