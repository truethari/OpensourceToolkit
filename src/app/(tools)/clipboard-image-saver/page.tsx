import type { Metadata } from "next";
import ClipboardImageSaver from "@/components/tools/clipboard-image-saver";
import { tools } from "@/config";

const toolConfig = tools.find((tool) => tool.id === "clipboard-image-saver");

export const metadata: Metadata = {
  title: toolConfig?.seo.title,
  description: toolConfig?.seo.description,
  keywords: toolConfig?.seo.keywords,
};

export default function ClipboardImageSaverPage() {
  return <ClipboardImageSaver />;
}
