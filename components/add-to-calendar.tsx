"use client";

import { CalendarPlus } from "lucide-react";
import type { PipelineResult } from "@/engine";
import { buildDeadlineICS } from "@/lib/calendar/ics";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface AddToCalendarProps {
  result: PipelineResult;
  language: string;
}

/**
 * Lets the person download their deadline(s) as an .ics file with reminders baked in
 * (7/3/1 days before), so their own calendar warns them before the clock runs out.
 * Generated entirely in the browser — no upload, no account.
 */
export function AddToCalendar({ result, language }: AddToCalendarProps) {
  if (result.deadlines.deadlines.length === 0) return null;

  function download() {
    const ics = buildDeadlineICS(result);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waive-deadlines.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={download}
      aria-label="Add your deadlines to your calendar, with reminders"
    >
      <CalendarPlus /> {t(language, "calendar.add")}
    </Button>
  );
}
