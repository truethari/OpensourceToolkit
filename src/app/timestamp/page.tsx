import Timestamp from "@/components/tools/timestamp";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timestamp | OpenSource Toolkit",
};

export default function Page() {
  return <Timestamp />;
}
