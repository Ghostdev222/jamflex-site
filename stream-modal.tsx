import { X } from "lucide-react";

export function StreamModal({
  visible,
  onClose,
  tmdbId,
  title,
  mediaType,
  season = 1,
  episode = 1,
}: {
  visible: boolean;
  onClose: () => void;
  tmdbId: number;
  title: string;
  mediaType: "movie" | "tv";
  season?: number;
  episode?: number;
}) {
  const isTv = mediaType === "tv";
  
  // This builds the exact vidsrc.sh link for the episode you picked
  const streamUrl = isTv
    ? `https://vidsrc.sh/embed/tv/${tmdbId}/${season}/${episode}`
    : `https://vidsrc.sh/embed/movie/${tmdbId}`;

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg uppercase tracking-wide text-foreground">
              {title}
            </h3>
            {isTv && (
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Playing Season {season} · Episode {episode}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* The Video Player (Iframe) */}
        <div className="aspect-video w-full bg-black">
          <iframe
            key={streamUrl}
            src={streamUrl}
            className="h-full w-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        </div>
      </div>
    </div>
  );
}
