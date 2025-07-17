import UUID from "@/components/tools/uuid";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UUID | OpenSource Toolkit",
};

export default function Page() {
  return <UUID />;
}
