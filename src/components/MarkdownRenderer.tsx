import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Preprocess LaTeX delimiters \( \) -> $ $ and \[ \] -> $$ $$
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    return content
      .replace(/\\\((\s*[\s\S]*?\s*)\\\)/g, '$$$1$$')
      .replace(/\\\[(\s*[\s\S]*?\s*)\\\]/g, '$$$$\n$1\n$$$$');
  }, [content]);

  return (
    <div className={`prose prose-invert max-w-none text-slate-100 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-5 mb-3 border-b border-white/10 pb-2 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl sm:text-2xl font-bold text-indigo-200 mt-4 mb-2.5 tracking-tight flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg sm:text-xl font-bold text-indigo-300 mt-3.5 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base sm:text-lg font-bold text-slate-200 mt-3 mb-1.5">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-2 text-base sm:text-lg leading-relaxed text-slate-100 font-normal">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-extrabold text-white bg-indigo-500/15 px-1.5 py-0.5 rounded border border-indigo-400/20">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-200 font-medium">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="my-3 ml-5 space-y-1.5 list-disc text-slate-200 text-base sm:text-lg marker:text-indigo-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-5 space-y-1.5 list-decimal text-slate-200 text-base sm:text-lg marker:text-indigo-400 font-bold">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 leading-relaxed text-slate-100">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-indigo-500 bg-indigo-950/40 px-4 py-3 rounded-r-2xl italic text-indigo-200 text-base sm:text-lg shadow-inner">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-5 border-white/15" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline underline-offset-4 font-semibold transition-colors"
            >
              {children}
            </a>
          ),
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            if (isInline) {
              return (
                <code
                  className="bg-slate-800/80 text-amber-300 px-2 py-0.5 rounded-lg text-xs sm:text-sm font-mono border border-slate-700/80 font-semibold"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-4 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950/90 shadow-2xl">
                {match && (
                  <div className="bg-slate-900/90 px-4 py-1.5 border-b border-slate-800 text-xs font-mono text-indigo-300 uppercase font-bold tracking-wider">
                    {match[1]}
                  </div>
                )}
                <pre className="p-4 text-xs sm:text-sm font-mono text-indigo-100 overflow-x-auto leading-relaxed">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-2xl border border-white/15 glass-card p-1 shadow-xl">
              <table className="w-full text-left text-sm sm:text-base border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-900/80 text-indigo-300 font-bold border-b border-white/10 uppercase text-xs tracking-wider">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 font-extrabold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 border-t border-white/5 text-slate-200">{children}</td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
