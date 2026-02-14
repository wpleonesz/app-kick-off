// --- TheSportsDB ---

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

const SPORTS_DB_API = "https://www.thesportsdb.com/api/v1/json/123";
const LEAGUE_ID = "4328"; // Premier League

export async function getEventsByDate(date: string): Promise<SportsEvent[]> {
  try {
    const response = await fetch(`${SPORTS_DB_API}/eventsday.php?d=${date}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error("Error fetching events by date:", error);
    return [];
  }
}

export async function getRecentMatches(): Promise<SportsEvent[]> {
  try {
    const response = await fetch(
      `${SPORTS_DB_API}/eventspastleague.php?id=${LEAGUE_ID}`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data.events || []).slice(0, 10);
  } catch (error) {
    console.error("Error fetching recent matches:", error);
    return [];
  }
}

export async function getUpcomingMatches(): Promise<SportsEvent[]> {
  try {
    const response = await fetch(
      `${SPORTS_DB_API}/eventsnextleague.php?id=${LEAGUE_ID}`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data.events || []).slice(0, 10);
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    return [];
  }
}

// --- ESPN Soccer ---

export interface EspnNewsItem {
  headline: string;
  description: string;
  published: string;
  links: { web: { href: string } };
  images: Array<{ url: string }>;
}

const ESPN_API = "https://site.api.espn.com/apis/site/v2/sports";

/** Ligas disponibles para noticias */
export const NEWS_LEAGUES = [
  { id: "soccer/eng.1", label: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "soccer/esp.1", label: "La Liga", flag: "🇪🇸" },
  { id: "soccer/ger.1", label: "Bundesliga", flag: "🇩🇪" },
  { id: "soccer/ita.1", label: "Serie A", flag: "🇮🇹" },
  { id: "soccer/fra.1", label: "Ligue 1", flag: "🇫🇷" },
  { id: "soccer/uefa.champions", label: "Champions League", flag: "🏆" },
] as const;

export type NewsLeagueId = (typeof NEWS_LEAGUES)[number]["id"];

const NEWS_PAGE_SIZE = 6;

export async function getFootballNews(
  league: NewsLeagueId = "soccer/eng.1",
  page: number = 1,
): Promise<{ articles: EspnNewsItem[]; hasMore: boolean }> {
  try {
    // ESPN doesn't support offset, so we fetch enough and slice
    const needed = page * NEWS_PAGE_SIZE;
    const response = await fetch(
      `${ESPN_API}/${league}/news?limit=${needed + 1}`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const all: EspnNewsItem[] = data.articles || [];
    const start = (page - 1) * NEWS_PAGE_SIZE;
    const articles = all.slice(start, start + NEWS_PAGE_SIZE);
    const hasMore = all.length > needed;
    return { articles, hasMore };
  } catch (error) {
    console.error("Error fetching football news:", error);
    return { articles: [], hasMore: false };
  }
}

export async function getLiveScores(): Promise<any[]> {
  try {
    const response = await fetch(`${ESPN_API}/soccer/eng.1/scoreboard`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data.events || []).slice(0, 8);
  } catch (error) {
    console.error("Error fetching live scores:", error);
    return [];
  }
}
