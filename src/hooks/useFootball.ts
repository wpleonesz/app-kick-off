import { useQuery } from "@tanstack/react-query";
import {
  getRecentMatches,
  getUpcomingMatches,
  getFootballNews,
  getLiveScores,
} from "../services/football.service";

const STALE = 1000 * 60 * 5; // 5 minutos (datos externos cambian menos)

export function useRecentMatches() {
  return useQuery({
    queryKey: ["football", "recent"],
    queryFn: getRecentMatches,
    staleTime: STALE,
  });
}

export function useUpcomingMatches() {
  return useQuery({
    queryKey: ["football", "upcoming"],
    queryFn: getUpcomingMatches,
    staleTime: STALE,
  });
}

export function useFootballNews() {
  return useQuery({
    queryKey: ["football", "news"],
    queryFn: getFootballNews,
    staleTime: STALE,
  });
}

export function useLiveScores() {
  return useQuery({
    queryKey: ["football", "live"],
    queryFn: getLiveScores,
    staleTime: 1000 * 60, // 1 minuto (scores cambian rápido)
    refetchInterval: 1000 * 60, // polling cada 1 minuto
  });
}
