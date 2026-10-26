"use client";

import { toast } from "sonner";
import React, { useState } from "react";
import { FileBadge, KeyRound, PenLine, ShieldCheck } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

import SignTab from "./SignTab";
import CertificatesTab from "./CertificatesTab";
import VerifyTab, { type VerifyInput } from "./VerifyTab";
import { Limitations, PrivacyNotice } from "./InfoSections";
import type { SigningIdentity } from "./lib/p12";

type Tab = "sign" | "verify" | "certificates";

export default function PdfDigitalSignature() {
  const [tab, setTab] = useState<Tab>("sign");
  // Shared so a certificate created in one tab can sign/verify in another.
  const [identity, setIdentity] = useState<SigningIdentity | null>(null);
  const [verifyInput, setVerifyInput] = useState<VerifyInput | null>(null);

  const startSigningWith = (next: SigningIdentity) => {
    setIdentity(next);
    setTab("sign");
    toast.success(`Signing as ${next.info.commonName}`);
  };

  return (
    <ToolsWrapper>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white">
          <FileBadge className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          PDF Digital Signature
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-300">
          Sign PDFs with a certificate, verify signed PDFs and create your own
          signing certificates – cryptographically, and entirely in your browser
        </p>
      </div>

      <PrivacyNotice />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        className="space-y-6"
      >
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="sign" className="gap-2 py-2">
            <PenLine className="h-4 w-4" />
            Sign
          </TabsTrigger>
          <TabsTrigger value="verify" className="gap-2 py-2">
            <ShieldCheck className="h-4 w-4" />
            Verify
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-2 py-2">
            <KeyRound className="h-4 w-4" />
            <span className="hidden sm:inline">Certificates</span>
            <span className="sm:hidden">Certs</span>
          </TabsTrigger>
        </TabsList>

        {/* forceMount keeps each tab's files and form state while switching */}
        <TabsContent
          value="sign"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <SignTab
            identity={identity}
            onIdentityChange={setIdentity}
            onCreateCertificate={() => setTab("certificates")}
            onVerify={(bytes, name) => {
              setVerifyInput({ bytes, name, key: Date.now() });
              setTab("verify");
            }}
          />
        </TabsContent>
        <TabsContent
          value="verify"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <VerifyTab input={verifyInput} identity={identity} />
        </TabsContent>
        <TabsContent
          value="certificates"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <CertificatesTab onUseIdentity={startSigningWith} />
        </TabsContent>
      </Tabs>

      <Limitations />
    </ToolsWrapper>
  );
}
