"use client";

import Link from "next/link";
import React from "react";
import { useNavigation } from "@/providers/NavigationProvider";

interface ProgressLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  [key: string]: string | React.ReactNode | ((e: React.MouseEvent) => void);
}

export function ProgressLink({
  href,
  children,
  onClick,
  ...props
}: ProgressLinkProps) {
  const { startNavigation } = useNavigation();

  const handleClick = (e: React.MouseEvent) => {
    startNavigation();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
