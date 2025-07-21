"use client";

import React, { useEffect, useState } from "react";
import { useNavigation } from "@/providers/NavigationProvider";

export function NavigationProgressBar() {
  const { isNavigating } = useNavigation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isNavigating) {
      setIsVisible(true);
      setProgress(0);

      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90; // Stop at 90% until navigation completes
          }
          return prev + Math.random() * 10;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      // Complete the progress bar and hide it
      setProgress(100);
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);

      return () => clearTimeout(timeout);
    }
  }, [isNavigating]);

  if (!isVisible) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-0.5 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
        }}
      >
        <div className="h-full w-full animate-pulse bg-white/20" />
      </div>
    </div>
  );
}
