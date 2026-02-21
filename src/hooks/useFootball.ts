import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  getRecentMatches,
  getUpcomingMatches,
  getFootballNews,
  getLiveScores,
  getNewsLeagues,
  getConfig,
} from "../services/football.service";

const STALE = 1000 * 60 * 5; // 5 minutos (datos externos cambian menos)

export function useRecentMatches(leagueId?: string) {
  return useQuery({
    queryKey: ["football", "recent", leagueId],
    queryFn: () => getRecentMatches(leagueId),
    staleTime: STALE,
  });
}

export function useUpcomingMatches(leagueId?: string) {
  return useQuery({
    queryKey: ["football", "upcoming", leagueId],
    queryFn: () => getUpcomingMatches(leagueId),
    staleTime: STALE,
  });
}

export function useFootballNews(league?: string) {
  return useInfiniteQuery({
    queryKey: ["football", "news", league],
    queryFn: ({ pageParam = 1 }) => getFootballNews(league, pageParam),
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + 1 : undefined,
    initialPageParam: 1,
    staleTime: STALE,
  });
}

export function useNewsLeagues() {
  return useQuery({
    queryKey: ["football", "newsLeagues"],
    queryFn: getNewsLeagues,
    staleTime: STALE * 6, // 30 minutos (las ligas cambian muy raramente)
  });
}

export function useFootballConfig() {
  return useQuery({
    queryKey: ["football", "config"],
    queryFn: getConfig,
    staleTime: STALE * 6, // 30 minutos (la config cambia muy raramente)
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
