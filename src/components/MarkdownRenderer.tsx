import { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const html = useMemo(() => {
    if (!content.trim()) return '';
    return marked.parse(content) as string;
  }, [content]);

  if (!html) return null;

  return (
    <div
      className={`prose-bw ${className}`}
      // User's own content inside their private extension — dangerouslySetInnerHTML is acceptable here.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
