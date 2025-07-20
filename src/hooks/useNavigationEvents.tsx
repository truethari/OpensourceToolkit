"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/providers/NavigationProvider";

export function useNavigationEvents() {
  const pathname = usePathname();
  const { stopNavigation } = useNavigation();

  useEffect(() => {
    // Stop navigation when route changes
    stopNavigation();
  }, [pathname, stopNavigation]);
}
