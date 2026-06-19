export interface FeedItem {
  id?: number;
  timestamp: string;
  intensity: number;
  techniqueId?: string;
  techniqueName?: string;
  drop?: number;
  worked: boolean;
}

const FEED_KEY = "qp_feed";
const TTL_DAYS = 7;

export function loadFeed(): FeedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(FEED_KEY);
    if (stored) {
      const items: FeedItem[] = JSON.parse(stored);
      const cutoff = Date.now() - TTL_DAYS * 86400000;
      const valid = items.filter((i) => new Date(i.timestamp).getTime() > cutoff);
      if (valid.length < items.length) {
        localStorage.setItem(FEED_KEY, JSON.stringify(valid));
      }
      return valid;
    }
  } catch {}
  return [];
}

export function addFeedItem(item: FeedItem) {
  if (typeof window === "undefined") return;
  const feed = loadFeed();
  item.id = Date.now();
  feed.push(item);
  localStorage.setItem(FEED_KEY, JSON.stringify(feed));
}

export function clearFeed() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FEED_KEY);
}
