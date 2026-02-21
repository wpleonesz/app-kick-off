import api from "../lib/api";

// --- TheSportsDB Types ---

export interface SportsEvent {
  idEvent: string;
  idAPIfootball?: string;
  strEvent: string;
  strEventAlternate?: string;
  strFilename?: string;
  strSport: string;
  idLeague?: string;
  strLeague: string;
  strLeagueBadge?: string;
  strSeason?: string;
  strDescriptionEN?: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  intRound?: number;
  intSpectators?: number | null;
  strOfficial?: string | null;
  strTimestamp?: string;
  dateEvent: string;
  dateEventLocal?: string;
  strTime: string;
  strTimeLocal?: string;
  strGroup?: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  intScore?: number | null;
  intScoreVotes?: number | null;
  strResult?: string;
  idVenue?: string;
  strVenue?: string;
  strCountry?: string;
  strCity?: string;
  strPoster?: string;
  strSquare?: string;
  strFanart?: string | null;
  strThumb?: string | null;
  strBanner?: string;
  strMap?: string | null;
  strTweet1?: string;
  strVideo?: string;
  strStatus?: string;
  strPostponed?: string;
  strLocked?: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
}

// --- ESPN Soccer Types ---

export interface EspnNewsItem {
  headline: string;
  description: string;
  published: string;
  links: { web: { href: string } };
  images: Array<{ url: string }>;
}

/** Ligas disponibles para noticias - Gestionadas desde el backend */
export interface NewsLeague {
  id: string;
  label: string;
  flag: string;
}

/** Configuración del backend */
export interface FootballConfig {
  defaultLeagueId: string;
  defaultNewsLeague: string;
  newsPageSize: number;
}

// --- API Functions ---

/**
 * Obtiene eventos de football por fecha
 * @param date - Fecha en formato YYYY-MM-DD
 */
export async function getEventsByDate(date: string): Promise<SportsEvent[]> {
  return api.get<SportsEvent[]>(
    `/api/public/football?action=eventsByDate&date=${date}`,
    false, // No requiere autenticación
  );
}

/**
 * Obtiene los partidos recientes
 * @param leagueId - ID de la liga (opcional, usa el default del backend si no se especifica)
 */
export async function getRecentMatches(
  leagueId?: string,
): Promise<SportsEvent[]> {
  const url = leagueId
    ? `/api/public/football?action=recentMatches&leagueId=${leagueId}`
    : `/api/public/football?action=recentMatches`;
  return api.get<SportsEvent[]>(url, false);
}

/**
 * Obtiene los próximos partidos
 * @param leagueId - ID de la liga (opcional, usa el default del backend si no se especifica)
 */
export async function getUpcomingMatches(
  leagueId?: string,
): Promise<SportsEvent[]> {
  const url = leagueId
    ? `/api/public/football?action=upcomingMatches&leagueId=${leagueId}`
    : `/api/public/football?action=upcomingMatches`;
  return api.get<SportsEvent[]>(url, false);
}

/**
 * Obtiene noticias de football de una liga específica
 * @param league - ID de la liga (ej: 'soccer/eng.1'). Usa getNewsLeagues() para obtener las ligas disponibles
 * @param page - Número de página (por defecto 1)
 */
export async function getFootballNews(
  league?: string,
  page: number = 1,
): Promise<{ articles: EspnNewsItem[]; hasMore: boolean }> {
  const url = league
    ? `/api/public/football?action=news&league=${league}&page=${page}`
    : `/api/public/football?action=news&page=${page}`;
  return api.get<{ articles: EspnNewsItem[]; hasMore: boolean }>(url, false);
}

/**
 * Obtiene los marcadores en vivo
 */
export async function getLiveScores(): Promise<any[]> {
  return api.get<any[]>(`/api/public/football?action=liveScores`, false);
}

/**
 * Obtiene la lista de ligas disponibles para noticias
 */
export async function getNewsLeagues(): Promise<NewsLeague[]> {
  return api.get<NewsLeague[]>(
    `/api/public/football?action=newsLeagues`,
    false,
  );
}

/**
 * Obtiene la configuración general del backend
 * Incluye: defaultLeagueId, defaultNewsLeague, newsPageSize
 */
export async function getConfig(): Promise<FootballConfig> {
  return api.get<FootballConfig>(`/api/public/football?action=config`, false);
}
