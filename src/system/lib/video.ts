/**
 * Marks a clip `data-ready` once it has a frame to paint. With `data-fade-in`
 * on the element, system.css holds it transparent until then, so a clip that
 * is slow to arrive fades in over its tile instead of popping in. A poster is
 * a frame to paint, so a clip with one shows at once.
 */
export function fadeInWhenReady(video: HTMLVideoElement) {
  const ready = () => video.setAttribute('data-ready', '');
  if (video.poster || video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return ready();
  video.addEventListener('loadeddata', ready, { once: true });
  video.addEventListener('playing', ready, { once: true });
}

/** True when a clip has something to show: the video itself, or a still. */
export function hasVisual(video?: { src?: string; poster?: string }): boolean {
  return Boolean(video?.src || video?.poster);
}
