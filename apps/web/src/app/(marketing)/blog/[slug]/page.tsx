import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { getPostBySlug, getPostSlugs } from '@/lib/blog';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.meta.title} — in midst my life`,
    description: post.meta.excerpt,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '3rem clamp(1rem, 3vw, 2.5rem) 5rem',
      }}
    >
      <Link
        href="/blog"
        style={{
          fontSize: '0.85rem',
          color: 'var(--accent)',
          marginBottom: '1.5rem',
          display: 'inline-block',
        }}
      >
        &larr; All posts
      </Link>

      <header style={{ marginBottom: '2.5rem' }}>
        <time
          dateTime={post.meta.date}
          style={{
            fontSize: '0.8rem',
            color: 'var(--stone)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {new Date(post.meta.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <h1
          style={{
            fontFamily: 'var(--font-display), Georgia, serif',
            fontSize: 'clamp(2rem, 3vw, 2.6rem)',
            margin: '0.3rem 0 0.5rem',
            lineHeight: 1.2,
          }}
        >
          {post.meta.title}
        </h1>
        <p style={{ color: 'var(--stone)', fontSize: '0.9rem', margin: 0 }}>
          By {post.meta.author}
        </p>
        {post.meta.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {post.meta.tags.map((tag) => (
              <span
                key={tag}
                className="chip"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="prose">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}
