"use client";

import { useState, useEffect } from "react";
import { loadFeed, type FeedItem } from "@/lib/feed";
import { getTechniqueById } from "@/data/techniques";

type Duration = 1 | 7;

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function FeedRow({ item }: { item: FeedItem }) {
  const techniqueName = item.techniqueName || (item.techniqueId ? getTechniqueById(item.techniqueId)?.name : null);

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border-primary last:border-0">
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
        item.intensity <= 3 ? "bg-accent" : item.intensity <= 7 ? "bg-warning" : "bg-danger"
      }`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-primary leading-relaxed">
          <span className="font-medium">Level {item.intensity}</span>
          {techniqueName && (
            <> → used <span className="text-accent">{techniqueName}</span></>
          )}
          {item.drop !== undefined && item.drop > 0 && (
            <> → dropped to <span className="font-medium">{item.intensity - item.drop}</span></>
          )}
          {item.worked && <span className="text-accent ml-1">✓</span>}
        </p>
        <p className="text-[10px] text-text-tertiary mt-0.5">{timeAgo(item.timestamp)}</p>
      </div>
    </div>
  );
}

export default function UrgeFeed() {
  const [duration, setDuration] = useState<Duration>(1);
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    setItems(loadFeed());
  }, []);

  const filtered = items.filter((i) => {
    if (duration === 1) {
      return new Date(i.timestamp).getTime() > Date.now() - 86400000;
    }
    return true;
  });

  return (
    <div className="bg-bg-surface border border-border-primary rounded-xl p-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Others checking in
        </p>
        <div className="flex gap-1">
          {([1, 7] as Duration[]).map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                duration === d ? "bg-accent text-black" : "bg-bg-elevated text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="divide-y divide-border-primary">
          {filtered.reverse().slice(0, 20).map((item) => (
            <FeedRow key={item.id || item.timestamp} item={item} />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-xs text-text-tertiary leading-relaxed">
            No shared check-ins yet.
          </p>
          <p className="text-[10px] text-text-tertiary/60 mt-1">
            After logging an urge, you can share it anonymously to help others.
          </p>
        </div>
      )}
    </div>
  );
}
