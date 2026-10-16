import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Play, Bookmark, BookmarkCheck, User, ChevronLeft, ChevronRight } from "lucide-react";
import { WatchPanel } from "../components/watch-panel";
import { VideoPlayerModal } from "../components/video-player-modal";
import { StreamModal } from "../components/stream-modal";
import { TitleRow } from "../components/title-row";
import { EmptyState, LoadingBlock, FreeBadge, MetaRow, SectionHeading, Panel, AttributionNote } from "../components/ui-bits";
import { backdropUrl, posterUrl, formatRating, formatRuntime } from "../lib/media";
import { useTitleDetail } from "../queries/tmdb";
import { useToggleWatchlist, useWatchlist } from "../queries/watchlist";
import { titleKey, type MediaType, type TitleSummary } from "../types/titles";
import { cn } from "../lib/utils";

export default function TitlePage() {
  const params = useParams<{ mediaType: string; id: string }>();
  const mediaType: MediaType = params.mediaType === "tv" ? "tv" : "movie";
  const tmdbId = Number(params.id);

  const detail = useTitleDetail(mediaType, tmdbId);
  const watchlist = useWatchlist();
  const toggleSave = useToggleWatchlist();
  const [videoIndex, setVideoIndex] = useState<number | null>(null);
  const [streamModalVisible, setStreamModalVisible] = useState(false);
  
  // State for the Season/Episode selectors
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const item = detail.data;
  const savedKeys = useMemo(() => new Set((watchlist.data?.items ?? []).map((entry) => titleKey(entry.mediaType, entry.tmdbId))), [watchlist.data]);
  const freeKeys = useMemo(() => { const keys = new Set<string>(); if (item?.whereToWatch.hasFreeOption) keys.add(titleKey(item.mediaType, item.tmdbId)); return keys; }, [item]);

  if (detail.isLoading) return <LoadingBlock label="Loading title" />;
  if (detail.isError || !item) return <EmptyState title="Couldn't load this title" body="TMDb didn't return anything for it." />;

  const backdrop = backdropUrl(item.backdropPath ?? item.posterPath, "w1280");
  const poster = posterUrl(item.posterPath, "w342");
  const isSaved = savedKeys.has(titleKey(item.mediaType, item.tmdbId));
  const free = item.whereToWatch.hasFreeOption;
  const isTv = item.mediaType === "tv";

  const toggle = (target: TitleSummary) => toggleSave.mutate({ tmdbId: target.tmdbId, mediaType: target.mediaType, title: target.title, posterPath: target.posterPath, backdropPath: target.backdropPath, releaseYear: target.releaseYear, voteAverage: target.voteAverage, overview: target.overview });

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {backdrop && <div className="absolute inset-0"><img src={backdrop} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" /></div>}
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
          <Link to="/library" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-3.5" /> Back to library</Link>
          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end">
            {poster && <img src={poster} alt={item.title} className="w-48 shrink-0 rounded-xl border border-border shadow-2xl md:w-64" />}
            <div className="flex-1 space-y-4 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{item.mediaType === "tv" ? "Series" : "Film"}{item.releaseYear ? ` · ${item.releaseYear}` : ""}</p>
                <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-wide text-foreground sm:text-5xl">{item.title}</h1>
                {item.tagline && <p className="mt-2 text-sm italic text-muted-foreground">{item.tagline}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-3">{free && <FreeBadge />}<MetaRow parts={[formatRating(item.voteAverage), formatRuntime(item.runtimeMinutes), item.numberOfSeasons ? `${item.numberOfSeasons} seasons` : null].filter(Boolean) as string[]} /></div>
              {item.overview && <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{item.overview}</p>}

              {/* THE NEW GROUPED BOX FOR SEASON/EPISODE AND STREAM ONLINE */}
              <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm space-y-4">
                {isTv && (
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Season</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { if (season > 1) { setSeason(season - 1); setEpisode(1); } }} disabled={season <= 1} className={cn("rounded-full border border-border p-2 transition-colors", season <= 1 ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:text-primary")}><ChevronLeft className="size-4" /></button>
                        <span className="w-6 text-center font-display text-xl text-foreground">{season}</span>
                        <button onClick={() => { if (season < (item.numberOfSeasons || 10)) { setSeason(season + 1); setEpisode(1); } }} disabled={season >= (item.numberOfSeasons || 10)} className={cn("rounded-full border border-border p-2 transition-colors", season >= (item.numberOfSeasons || 10) ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:text-primary")}><ChevronRight className="size-4" /></button>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Episode</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { if (episode > 1) setEpisode(episode - 1); }} disabled={episode <= 1} className={cn("rounded-full border border-border p-2 transition-colors", episode <= 1 ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:text-primary")}><ChevronLeft className="size-4" /></button>
                        <span className="w-6 text-center font-display text-xl text-foreground">{episode}</span>
                        <button onClick={() => setEpisode(episode + 1)} className="rounded-full border border-border p-2 transition-colors hover:border-primary hover:text-primary"><ChevronRight className="size-4" /></button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
                  <button onClick={() => setStreamModalVisible(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"><Play className="size-4 fill-current" /> Stream Online</button>
                  <button onClick={() => toggle(item)} className={cn("inline-flex items-center gap-2 rounded-full border px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors", isSaved ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary hover:text-primary")}><>{isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}{isSaved ? "Saved" : "Save"}</button>
                </div>
              </div>

              {(item.directors.length > 0 || item.creators.length > 0) && <p className="text-xs text-muted-foreground">{item.creators.length > 0 ? "Created by" : "Directed by"} <span className="text-foreground">{(item.creators.length > 0 ? item.creators : item.directors).join(", ")}</span></p>}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <WatchPanel where={item.whereToWatch} />
        {item.cast.length > 0 && <section><SectionHeading title="Cast" /><div className="row-scroller -mx-1 px-1 mt-4">{item.cast.map((person) => (<div key={`${person.id}-${person.character}`} className="w-24 shrink-0 space-y-2">{person.profilePath ? <img src={`https://image.tmdb.org/t/p/w185${person.profilePath}`} alt={person.name} className="aspect-[2/3] w-full rounded-lg border border-border bg-card object-cover" /> : <div className="aspect-[2/3] w-full flex items-center justify-center rounded-lg border border-border bg-card"><User className="size-8 text-muted-foreground" /></div>}<div><p className="text-xs font-bold text-foreground line-clamp-2">{person.name}</p>{person.character && <p className="text-[10px] text-muted-foreground line-clamp-2">{person.character}</p>}</div></div>))}</div></section>}
        <TitleRow title="More like this" items={item.recommendations} freeKeys={freeKeys} savedKeys={savedKeys} onToggleSave={toggle} />
        <Panel><Link to="/library" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:text-primary/80"><ArrowLeft className="size-3.5" /> Back to browsing</Link><AttributionNote /></Panel>
      </div>

      <VideoPlayerModal videos={item.promoVideos} openIndex={videoIndex} onClose={() => setVideoIndex(null)} />
      
      {/* The New Stream Modal */}
      <StreamModal 
        visible={streamModalVisible} 
        onClose={() => setStreamModalVisible(false)} 
        tmdbId={item.tmdbId} 
        title={item.title} 
        mediaType={item.mediaType} 
        season={season} 
        episode={episode} 
      />
    </div>
  );
}
