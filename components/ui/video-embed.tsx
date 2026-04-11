"use client";

import { useRef, useState } from "react";

interface VideoEmbedProps {
  src: string;
  title?: string;
}

function getYouTubeId(url: string) {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^?&]+)/
  );
  return match?.[1];
}

export function VideoEmbed({ src, title = "Video" }: VideoEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const ytId = getYouTubeId(src);
  const thumbnail = ytId
    ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    : undefined;
  const embedSrc = ytId ? `https://www.youtube.com/embed/${ytId}` : src;

  return (
    <div ref={ref} className="my-6 overflow-hidden rounded-lg border border-border">
      {!loaded && thumbnail ? (
        <button
          onClick={() => setLoaded(true)}
          className="relative block w-full cursor-pointer"
        >
          <img
            src={thumbnail}
            alt={title}
            className="w-full"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="white"
              className="drop-shadow-lg"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      ) : (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={embedSrc}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
