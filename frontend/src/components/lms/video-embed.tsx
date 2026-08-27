'use client';

import { useEffect, useMemo, useRef } from 'react';

/**
 * Normalises the URLs people actually paste (a youtube watch link, a youtu.be
 * short link, a vimeo page) into their embeddable form, so an instructor does not
 * have to know the difference.
 */
function toEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') return `https://www.youtube.com/embed${url.pathname}`;
    if (host.endsWith('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return url.toString();
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.endsWith('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/** Files uploaded through Strapi's Media Library need a native video player. */
function isDirectVideoUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.pathname.startsWith('/uploads/') || /\.(mp4|webm|ogg|m4v)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function VideoEmbed({
  url,
  title,
  onPlaybackChange,
}: {
  url: string;
  title: string;
  onPlaybackChange?: (playing: boolean) => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const embed = useMemo(() => toEmbedUrl(url), [url]);
  const provider = embed?.includes('youtube.com/embed/')
    ? 'youtube'
    : embed?.includes('player.vimeo.com/video/') ? 'vimeo' : 'other';

  useEffect(() => {
    if (provider === 'other') return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      let data: Record<string, unknown>;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch { return; }
      if (provider === 'youtube') {
        const info = data.info as { playerState?: number } | undefined;
        if (typeof info?.playerState === 'number') onPlaybackChange?.(info.playerState === 1);
      } else if (data.event === 'play') onPlaybackChange?.(true);
      else if (data.event === 'pause' || data.event === 'ended') onPlaybackChange?.(false);
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      onPlaybackChange?.(false);
    };
  }, [onPlaybackChange, provider]);

  if (isDirectVideoUrl(url)) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        <video
          src={url}
          title={title}
          controls
          preload="metadata"
          className="size-full bg-black"
          onPlay={() => onPlaybackChange?.(true)}
          onPause={() => onPlaybackChange?.(false)}
          onEnded={() => onPlaybackChange?.(false)}
        />
      </div>
    );
  }

  if (!embed) {
    return (
      <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        This lesson&apos;s video link isn&apos;t a valid URL.{' '}
        <a href={url} className="underline" rel="noopener noreferrer" target="_blank">
          Open it directly
        </a>
        .
      </p>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
      <iframe
        ref={frameRef}
        src={provider === 'youtube'
          ? `${embed}${embed.includes('?') ? '&' : '?'}enablejsapi=1`
          : embed}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="size-full"
        onLoad={() => {
          const frame = frameRef.current?.contentWindow;
          if (!frame) return;
          if (provider === 'youtube') {
            frame.postMessage(JSON.stringify({ event: 'listening' }), '*');
          } else if (provider === 'vimeo') {
            for (const event of ['play', 'pause', 'ended']) {
              frame.postMessage(JSON.stringify({ method: 'addEventListener', value: event }), '*');
            }
          }
        }}
      />
    </div>
  );
}
