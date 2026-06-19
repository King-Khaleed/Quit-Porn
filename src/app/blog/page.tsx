import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/data/blog-posts";

export const metadata: Metadata = {
  title: "Porn Recovery Blog – Neuroscience & Evidence-Based Guides",
  description: "Expert guides on porn addiction recovery, neuroscience, and brain rewiring. Learn how dopamine, neuroplasticity, and evidence-based techniques can help you quit porn and reclaim your life.",
  openGraph: {
    title: "Porn Recovery Blog – Neuroscience & Evidence-Based Guides",
    description: "Expert guides on porn addiction recovery, neuroscience, and brain rewiring.",
  },
};

export default function BlogPage() {
  const sorted = [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto w-full px-5 pt-12 pb-24">
        <h1 className="text-2xl font-heading font-bold text-text-primary">
          Porn Recovery Blog
        </h1>
        <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
          Evidence-based guides on porn addiction recovery, brain science, and practical techniques.
        </p>

        <div className="mt-8 space-y-5">
          {sorted.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block bg-bg-surface border border-border-primary rounded-xl p-5 hover:bg-bg-surface-hover transition-all"
            >
              <div className="flex items-center gap-2 text-[10px] text-text-tertiary uppercase tracking-wider mb-2">
                <span>{post.category}</span>
                <span>·</span>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-base font-heading font-semibold text-text-primary leading-snug">
                {post.title}
              </h2>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                {post.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
