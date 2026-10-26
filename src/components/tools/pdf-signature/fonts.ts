import {
  Caveat,
  Dancing_Script,
  Great_Vibes,
  Sacramento,
} from "next/font/google";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: "500" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400" });
const caveat = Caveat({ subsets: ["latin"], weight: "500" });
const sacramento = Sacramento({ subsets: ["latin"], weight: "400" });

export interface SignatureFont {
  id: string;
  label: string;
  className: string;
  family: string;
  weight: string;
}

export const SIGNATURE_FONTS: SignatureFont[] = [
  {
    id: "dancing",
    label: "Dancing Script",
    className: dancingScript.className,
    family: dancingScript.style.fontFamily,
    weight: "500",
  },
  {
    id: "vibes",
    label: "Great Vibes",
    className: greatVibes.className,
    family: greatVibes.style.fontFamily,
    weight: "400",
  },
  {
    id: "sacramento",
    label: "Sacramento",
    className: sacramento.className,
    family: sacramento.style.fontFamily,
    weight: "400",
  },
  {
    id: "caveat",
    label: "Caveat",
    className: caveat.className,
    family: caveat.style.fontFamily,
    weight: "500",
  },
];
