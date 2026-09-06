import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export function MathContent({ children }: { children: string }) {
  return (
    <div className="math-content text-ink">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function InlineMathContent({ children }: { children: string }) {
  return (
    <span className="math-content inline text-inherit">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{ p: ({ children: content }) => <>{content}</> }}
      >
        {children}
      </ReactMarkdown>
    </span>
  );
}
