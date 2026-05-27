"use client";

import { useEffect, useState } from "react";
import { PlansEmptyGhost } from "@/components/plans/PlansEmptyGhost";
import { PlansTeachingSheet } from "@/components/plans/PlansTeachingSheet";
import { PlanCreateCard } from "@/components/plans/PlanCreateCard";
import {
  hasSeenPlansTeaching,
  trackEmptyState,
} from "@/lib/plans-teaching";

export function PlansEmptyState({
  helpOpen,
  onHelpClose,
}: {
  helpOpen?: boolean;
  onHelpClose?: () => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ghostDimmed, setGhostDimmed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!hasSeenPlansTeaching()) {
      setSheetOpen(true);
      trackEmptyState("empty_state_shown");
    } else {
      setGhostDimmed(false);
    }
  }, []);

  useEffect(() => {
    if (helpOpen) {
      setSheetOpen(true);
      setGhostDimmed(true);
      onHelpClose?.();
    }
  }, [helpOpen, onHelpClose]);

  function dismissSheet() {
    setSheetOpen(false);
    setGhostDimmed(false);
  }

  const showCreate = mounted && !sheetOpen;

  return (
    <div className="relative mt-6">
      <PlansEmptyGhost dimmed={ghostDimmed && sheetOpen} />
      {showCreate ? (
        <div className="mt-6">
          <PlanCreateCard />
        </div>
      ) : null}
      <PlansTeachingSheet open={sheetOpen} onDismiss={dismissSheet} />
    </div>
  );
}
