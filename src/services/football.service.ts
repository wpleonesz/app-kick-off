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
const ESPN_LEAGUE = "soccer/eng.1";

export async function getFootballNews(): Promise<EspnNewsItem[]> {
  try {
    const response = await fetch(`${ESPN_API}/${ESPN_LEAGUE}/news`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data.articles || []).slice(0, 8);
  } catch (error) {
    console.error("Error fetching football news:", error);
    return [];
  }
}

export async function getLiveScores(): Promise<any[]> {
  try {
    const response = await fetch(`${ESPN_API}/${ESPN_LEAGUE}/scoreboard`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data.events || []).slice(0, 8);
  } catch (error) {
    console.error("Error fetching live scores:", error);
    return [];
  }
}
