"use client";

import React from "react";
import { Star, HardDrive, CloudOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FavoritesNoticeDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500 text-white">
            <Star className="h-6 w-6 fill-current" />
          </div>
          <DialogTitle>Your first favorite is saved</DialogTitle>
          <DialogDescription>
            Favorites are stored only in this browser. Nothing is sent to a
            server and nothing syncs across your devices.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start space-x-3">
            <HardDrive className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              Saved in this browser&apos;s local storage on this device only.
            </span>
          </li>
          <li className="flex items-start space-x-3">
            <CloudOff className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              Never uploaded, shared, or synced with any server or account.
            </span>
          </li>
          <li className="flex items-start space-x-3">
            <Trash2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              Clearing your browser data or using private browsing removes them.
            </span>
          </li>
        </ul>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
