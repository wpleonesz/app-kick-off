# Integración de APIs de Fútbol en Home

## APIs elegidas (gratuitas, sin registro)

| API | URL base | Datos | Auth |
|---|---|---|---|
| **TheSportsDB** | `https://www.thesportsdb.com/api/v1/json/3` | Partidos recientes, próximos eventos, equipos, noticias | Sin key |
| **ESPN Soccer** | `https://site.api.espn.com/apis/site/v2/sports/soccer` | Marcadores en vivo, noticias por liga | Sin key |

Ambas son HTTPS → sin problemas de ATS en iOS.

---

## Paso 1 — Servicios externos

Crear `src/services/football.service.ts`:

```typescript
import { CapacitorHttp } from '@capacitor/core';

// --- TheSportsDB ---

export interface SportsEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  dateEvent: string;
  strTime: string;
  strThumb: string | null;
  strLeague: string;
}

// Liga que quieres mostrar (Premier League = 4328, La Liga = 4335, Bundesliga = 4331)
const LEAGUE_ID = '4328'; // Premier League

export async function getRecentMatches(): Promise<SportsEvent[]> {
  const res = await CapacitorHttp.get({
    url: `https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${LEAGUE_ID}`,
    headers: { 'Content-Type': 'application/json' },
  });
  return (res.data?.events || []).slice(0, 10);
}

export async function getUpcomingMatches(): Promise<SportsEvent[]> {
  const res = await CapacitorHttp.get({
    url: `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${LEAGUE_ID}`,
    headers: { 'Content-Type': 'application/json' },
  });
  return (res.data?.events || []).slice(0, 10);
}

// --- ESPN Soccer ---

export interface EspnNewsItem {
  headline: string;
  description: string;
  published: string;
  links: { web: { href: string } };
  images: Array<{ url: string }>;
}

// Liga en ESPN: eng.1 = Premier League, esp.1 = La Liga, ger.1 = Bundesliga
const ESPN_LEAGUE = 'eng.1';

export async function getFootballNews(): Promise<EspnNewsItem[]> {
  const res = await CapacitorHttp.get({
    url: `https://site.api.espn.com/apis/site/v2/sports/soccer/${ESPN_LEAGUE}/news`,
    headers: { 'Content-Type': 'application/json' },
  });
  return (res.data?.articles || []).slice(0, 8);
}

export async function getLiveScores(): Promise<any[]> {
  const res = await CapacitorHttp.get({
    url: `https://site.api.espn.com/apis/site/v2/sports/soccer/${ESPN_LEAGUE}/scoreboard`,
    headers: { 'Content-Type': 'application/json' },
  });
  return (res.data?.events || []).slice(0, 8);
}
```

---

## Paso 2 — Hooks con React Query

Crear `src/hooks/useFootball.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import {
  getRecentMatches,
  getUpcomingMatches,
  getFootballNews,
  getLiveScores,
} from '../services/football.service';

const STALE = 1000 * 60 * 5; // 5 minutos (datos externos cambian menos)

export function useRecentMatches() {
  return useQuery({
    queryKey: ['football', 'recent'],
    queryFn: getRecentMatches,
    staleTime: STALE,
  });
}

export function useUpcomingMatches() {
  return useQuery({
    queryKey: ['football', 'upcoming'],
    queryFn: getUpcomingMatches,
    staleTime: STALE,
  });
}

export function useFootballNews() {
  return useQuery({
    queryKey: ['football', 'news'],
    queryFn: getFootballNews,
    staleTime: STALE,
  });
}

export function useLiveScores() {
  return useQuery({
    queryKey: ['football', 'live'],
    queryFn: getLiveScores,
    staleTime: 1000 * 60, // 1 minuto (scores cambian rápido)
    refetchInterval: 1000 * 60, // polling cada 1 minuto
  });
}
```

---

## Paso 3 — Componentes visuales

Crear `src/components/football/MatchCard.tsx`:

```tsx
import React from 'react';
import { IonCard, IonCardContent } from '@ionic/react';
import { SportsEvent } from '../../services/football.service';

interface Props {
  match: SportsEvent;
}

export function MatchCard({ match }: Props) {
  const hasScore =
    match.intHomeScore !== null && match.intAwayScore !== null;

  return (
    <IonCard style={{ margin: '0 0 12px 0', borderRadius: '12px' }}>
      <IonCardContent>
        <p style={{ fontSize: '11px', color: 'var(--ion-color-medium)', marginBottom: '8px' }}>
          {match.strLeague} · {match.dateEvent}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, flex: 1, textAlign: 'right', fontSize: '14px' }}>
            {match.strHomeTeam}
          </span>
          <span style={{
            margin: '0 12px',
            fontWeight: 700,
            fontSize: '18px',
            color: hasScore ? 'var(--ion-color-dark)' : 'var(--ion-color-medium)',
            minWidth: '60px',
            textAlign: 'center',
          }}>
            {hasScore
              ? `${match.intHomeScore} - ${match.intAwayScore}`
              : match.strTime || 'vs'}
          </span>
          <span style={{ fontWeight: 600, flex: 1, textAlign: 'left', fontSize: '14px' }}>
            {match.strAwayTeam}
          </span>
        </div>
      </IonCardContent>
    </IonCard>
  );
}
```

Crear `src/components/football/NewsCard.tsx`:

```tsx
import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import { EspnNewsItem } from '../../services/football.service';

interface Props {
  article: EspnNewsItem;
}

export function NewsCard({ article }: Props) {
  const imageUrl = article.images?.[0]?.url;

  return (
    <IonCard style={{ margin: '0 0 12px 0', borderRadius: '12px' }}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={article.headline}
          style={{ width: '100%', height: '160px', objectFit: 'cover' }}
        />
      )}
      <IonCardHeader>
        <IonCardTitle style={{ fontSize: '15px', fontWeight: 600 }}>
          {article.headline}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p style={{ fontSize: '13px', color: 'var(--ion-color-medium)', margin: 0 }}>
          {article.description}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--ion-color-medium)', marginTop: '8px' }}>
          {new Date(article.published).toLocaleDateString('es-EC', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      </IonCardContent>
    </IonCard>
  );
}
```

---

## Paso 4 — Home.tsx completo

Reemplazar el contenido de `src/pages/Home.tsx`:

```tsx
import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonRefresher, IonRefresherContent, IonSpinner, IonSegment,
  IonSegmentButton, IonLabel,
} from '@ionic/react';
import { RefresherEventDetail } from '@ionic/core';
import { useQueryClient } from '@tanstack/react-query';
import { useRecentMatches, useUpcomingMatches, useFootballNews } from '../hooks/useFootball';
import { MatchCard } from '../components/football/MatchCard';
import { NewsCard } from '../components/football/NewsCard';

type Tab = 'recientes' | 'proximos' | 'noticias';

const Home: React.FC = () => {
  const [tab, setTab] = useState<Tab>('recientes');
  const queryClient = useQueryClient();

  const { data: recent, isLoading: loadingRecent } = useRecentMatches();
  const { data: upcoming, isLoading: loadingUpcoming } = useUpcomingMatches();
  const { data: news, isLoading: loadingNews } = useFootballNews();

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await queryClient.invalidateQueries({ queryKey: ['football'] });
    event.detail.complete();
  };

  const isLoading =
    (tab === 'recientes' && loadingRecent) ||
    (tab === 'proximos' && loadingUpcoming) ||
    (tab === 'noticias' && loadingNews);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>⚽ Fútbol</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={tab}
            onIonChange={e => setTab(e.detail.value as Tab)}
          >
            <IonSegmentButton value="recientes">
              <IonLabel>Recientes</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="proximos">
              <IonLabel>Próximos</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="noticias">
              <IonLabel>Noticias</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Desliza para actualizar"
            refreshingSpinner="crescent"
          />
        </IonRefresher>

        <div style={{ padding: '16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <IonSpinner name="crescent" />
            </div>
          )}

          {tab === 'recientes' && !loadingRecent && (
            <>
              <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '16px' }}>
                Partidos Recientes — Premier League
              </h3>
              {recent?.length === 0 && (
                <p style={{ color: 'var(--ion-color-medium)', textAlign: 'center' }}>
                  Sin partidos recientes
                </p>
              )}
              {recent?.map(match => (
                <MatchCard key={match.idEvent} match={match} />
              ))}
            </>
          )}

          {tab === 'proximos' && !loadingUpcoming && (
            <>
              <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '16px' }}>
                Próximos Partidos — Premier League
              </h3>
              {upcoming?.length === 0 && (
                <p style={{ color: 'var(--ion-color-medium)', textAlign: 'center' }}>
                  Sin próximos partidos
                </p>
              )}
              {upcoming?.map(match => (
                <MatchCard key={match.idEvent} match={match} />
              ))}
            </>
          )}

          {tab === 'noticias' && !loadingNews && (
            <>
              <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '16px' }}>
                Noticias — Premier League
              </h3>
              {news?.length === 0 && (
                <p style={{ color: 'var(--ion-color-medium)', textAlign: 'center' }}>
                  Sin noticias disponibles
                </p>
              )}
              {news?.map((article, i) => (
                <NewsCard key={i} article={article} />
              ))}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
```

---

## Paso 5 — Verificar que las URLs son accesibles

Prueba desde terminal:

```bash
# TheSportsDB - partidos recientes Premier League
curl -s "https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=4328" | python3 -m json.tool | head -30

# ESPN - noticias Premier League
curl -s "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news" | python3 -m json.tool | head -30

# ESPN - scoreboard
curl -s "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard" | python3 -m json.tool | head -30
```

---

## Otras ligas disponibles

### TheSportsDB — `id` de liga
| Liga | ID |
|---|---|
| Premier League | 4328 |
| La Liga | 4335 |
| Bundesliga | 4331 |
| Serie A | 4332 |
| Ligue 1 | 4334 |
| Champions League | 4480 |

### ESPN — `league` slug
| Liga | Slug |
|---|---|
| Premier League | `eng.1` |
| La Liga | `esp.1` |
| Bundesliga | `ger.1` |
| Serie A | `ita.1` |
| Ligue 1 | `fra.1` |
| MLS | `usa.1` |

---

## Orden de implementación

1. Crear `src/services/football.service.ts`
2. Crear `src/hooks/useFootball.ts`
3. Crear `src/components/football/MatchCard.tsx`
4. Crear `src/components/football/NewsCard.tsx`
5. Reemplazar `src/pages/Home.tsx`
6. `npm run build && ionic cap sync ios --no-build && ionic cap run ios`

---

## Notas importantes

- **No necesitan API key** — ambas APIs son públicas y gratuitas.
- **CapacitorHttp** se usa para evitar CORS en la app nativa (iOS/Android).
- En web (browser), puede haber CORS desde `localhost`; en el simulador/dispositivo funciona sin problema porque CapacitorHttp va por la capa nativa.
- Si quieres cambiar la liga, solo cambia `LEAGUE_ID` en el servicio.
- `refetchInterval: 1000 * 60` en `useLiveScores` hace polling cada 1 minuto para scores en vivo.
