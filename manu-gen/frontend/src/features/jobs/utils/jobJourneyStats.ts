import type { JobHistoryEntry } from "../jobs.types";

export interface JobJourneyStats {
  totalTrackedSeconds: number;
  stationVisits: number;
  longestDwellSeconds: number;
  longestDwellStation: string;
}

export function computeJobJourneyStats(entries: JobHistoryEntry[]): JobJourneyStats {
  let totalTrackedSeconds = 0;
  let longestDwellSeconds = 0;
  let longestDwellStation = "";
  let stationVisits = 0;

  for (const entry of entries) {
    if (entry.durationSeconds === null || entry.durationSeconds <= 0) continue;

    if (entry.phase === "departed" || entry.phase === "scan") {
      totalTrackedSeconds += entry.durationSeconds;
      stationVisits++;
      if (entry.durationSeconds > longestDwellSeconds) {
        longestDwellSeconds = entry.durationSeconds;
        longestDwellStation = entry.station;
      }
    }
  }

  return { totalTrackedSeconds, stationVisits, longestDwellSeconds, longestDwellStation };
}
