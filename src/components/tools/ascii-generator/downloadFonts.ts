import fs from "fs";
import path from "path";

import { FIGLET_FONTS } from "./utils";

const BASE_URL = "http://www.figlet.org/fonts/";

export async function downloadFont(fontName: string): Promise<boolean> {
  try {
    const url = `${BASE_URL}${fontName}.flf`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `Failed to download ${fontName}: ${response.status} ${response.statusText}`,
      );
      return false;
    }

    const fontData = await response.text();
    const fontsDir = path.join(process.cwd(), "public", "fonts");

    // Ensure fonts directory exists
    if (!fs.existsSync(fontsDir)) {
      fs.mkdirSync(fontsDir, { recursive: true });
    }

    const fontPath = path.join(fontsDir, `${fontName}.flf`);
    fs.writeFileSync(fontPath, fontData);

    console.log(`✓ Downloaded ${fontName}.flf`);
    return true;
  } catch (error) {
    console.error(`Failed to download ${fontName}:`, error);
    return false;
  }
}

export async function downloadAllFonts(): Promise<void> {
  console.log(`Starting download of ${FIGLET_FONTS.length} fonts...`);

  const results = await Promise.allSettled(
    FIGLET_FONTS.map((font) => downloadFont(font)),
  );

  const successful = results.filter(
    (result) => result.status === "fulfilled" && result.value === true,
  ).length;

  const failed = results.length - successful;

  console.log(`\nDownload complete!`);
  console.log(`✓ Successfully downloaded: ${successful} fonts`);
  if (failed > 0) {
    console.log(`✗ Failed to download: ${failed} fonts`);
  }
  console.log(`Fonts saved to: public/fonts/`);
}

export async function downloadSpecificFonts(
  fontNames: string[],
): Promise<void> {
  console.log(`Downloading ${fontNames.length} specific fonts...`);

  const results = await Promise.allSettled(
    fontNames.map((font) => downloadFont(font)),
  );

  const successful = results.filter(
    (result) => result.status === "fulfilled" && result.value === true,
  ).length;

  const failed = results.length - successful;

  console.log(`\nDownload complete!`);
  console.log(`✓ Successfully downloaded: ${successful} fonts`);
  if (failed > 0) {
    console.log(`✗ Failed to download: ${failed} fonts`);
  }
}

// Function to check if fonts exist locally
export function getFontsStatus(): { available: string[]; missing: string[] } {
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const available: string[] = [];
  const missing: string[] = [];

  for (const font of FIGLET_FONTS) {
    const fontPath = path.join(fontsDir, `${font}.flf`);
    if (fs.existsSync(fontPath)) {
      available.push(font);
    } else {
      missing.push(font);
    }
  }

  return { available, missing };
}

// Usage examples:
// await downloadAllFonts();
// await downloadSpecificFonts(['standard', 'big', 'block']);
// const status = getFontsStatus();

if (module === require.main) {
  // If this file is run directly, download all fonts
  downloadAllFonts().catch(console.error);
}
