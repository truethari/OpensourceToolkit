import { type LucideProps } from "lucide-react";

export interface ITool {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  color: string;
  category: string;
  tags: string[];
  features: string[];
  popular?: boolean;
  href: string;
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}
