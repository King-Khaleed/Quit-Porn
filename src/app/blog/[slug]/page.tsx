import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/data/blog-posts";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    keywords: post.keywords.join(", "),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto w-full px-5 pt-12 pb-24">
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            ← Back to blog
          </Link>
        </div>

        <article itemScope itemType="https://schema.org/Article">
          <meta itemProp="author" content={post.author} />
          <meta itemProp="datePublished" content={post.date} />
          <meta itemProp="headline" content={post.title} />
          <meta itemProp="description" content={post.description} />

          <div className="flex items-center gap-2 text-[10px] text-text-tertiary uppercase tracking-wider mb-3">
            <span>{post.category}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>

          <h1 className="text-xl font-heading font-bold text-text-primary leading-snug">
            {post.title}
          </h1>

          <div className="mt-6 space-y-5 text-sm text-text-secondary leading-relaxed">
            {post.content.map((block, i) => {
              if (block.type === "heading" && block.level === 2) {
                return (
                  <h2 key={i} className="text-lg font-heading font-semibold text-text-primary pt-4">
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "heading" && block.level === 3) {
                return (
                  <h3 key={i} className="text-base font-heading font-semibold text-text-primary pt-3">
                    {block.text}
                  </h3>
                );
              }
              if (block.type === "paragraph") {
                return <p key={i}>{block.text}</p>;
              }
              if (block.type === "list") {
                return (
                  <ul key={i} className="space-y-2 list-disc list-inside marker:text-accent">
                    {block.items?.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                );
              }
              if (block.type === "quote") {
                return (
                  <blockquote key={i} className="border-l-2 border-accent pl-4 py-2 text-text-tertiary italic">
                    <p>&ldquo;{block.text}&rdquo;</p>
                    {block.source && (
                      <cite className="text-[10px] text-text-tertiary not-italic mt-2 block">
                        — {block.source}
                      </cite>
                    )}
                  </blockquote>
                );
              }
              if (block.type === "faq") {
                return (
                  <div key={i} itemScope itemProp="mainEntity" itemType="https://schema.org/Question" className="bg-bg-surface border border-border-primary rounded-xl p-4">
                    <h3 itemProp="name" className="text-sm font-semibold text-text-primary mb-2">{block.q}</h3>
                    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                      <p itemProp="text" className="text-sm text-text-secondary leading-relaxed">{block.a}</p>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </article>

        <div className="mt-10 pt-6 border-t border-border-primary">
          <p className="text-xs text-text-tertiary">
            Disclaimer: This content is for informational purposes only and does not constitute medical advice. If you are struggling with addiction, consider consulting a licensed mental health professional.
          </p>
        </div>
      </div>
    </div>
  );
}
