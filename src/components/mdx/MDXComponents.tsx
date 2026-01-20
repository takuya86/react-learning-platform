import { Children, isValidElement, type ComponentProps, type ReactNode } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

// Extract language from className (e.g., "language-jsx" -> "jsx")
function extractLanguage(className?: string): string {
  if (!className) return 'text';
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : 'text';
}

// Extract code string from children
function extractCode(children: ReactNode): string {
  if (typeof children === 'string') {
    return children.trim();
  }
  if (Array.isArray(children)) {
    return children.map(extractCode).join('');
  }
  if (isValidElement(children)) {
    const props = children.props as { children?: ReactNode };
    if (props.children) {
      return extractCode(props.children);
    }
  }
  return String(children || '').trim();
}

// Inline code (used for `code` in text)
function InlineCode({ children, className, ...props }: ComponentProps<'code'>) {
  // If it has a language class, it's inside a pre block - render as-is for Pre to handle
  if (className?.includes('language-')) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  // Inline code styling
  return (
    <code
      className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400"
      {...props}
    >
      {children}
    </code>
  );
}

// Pre block with syntax highlighting
function Pre({ children, ...props }: ComponentProps<'pre'>) {
  // Try to extract language and code from children
  let language = 'text';
  let code = '';

  // Children should be a <code> element with className="language-xxx"
  const child = Children.only(children);
  if (isValidElement(child)) {
    const childProps = child.props as { className?: string; children?: ReactNode };
    language = extractLanguage(childProps.className);
    code = extractCode(childProps.children);
  }

  // If no language detected, just render as plain pre
  if (language === 'text' && !code) {
    return (
      <pre className="bg-[#011627] p-4 rounded-lg overflow-x-auto text-sm my-4" {...props}>
        {children}
      </pre>
    );
  }

  return (
    <pre className="bg-[#011627] p-4 rounded-lg overflow-x-auto text-sm my-4" {...props}>
      <Highlight theme={themes.nightOwl} code={code} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <code className={className} style={{ ...style, background: 'transparent' }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="inline-block w-8 text-gray-500 select-none text-right mr-4 text-xs">
                  {i + 1}
                </span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </code>
        )}
      </Highlight>
    </pre>
  );
}

// Headings
function H1({ children, ...props }: ComponentProps<'h1'>) {
  return (
    <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h1>
  );
}

function H2({ children, ...props }: ComponentProps<'h2'>) {
  return (
    <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h2>
  );
}

function H3({ children, ...props }: ComponentProps<'h3'>) {
  return (
    <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h3>
  );
}

// Paragraph
function P({ children, ...props }: ComponentProps<'p'>) {
  return (
    <p className="my-3 text-gray-700 dark:text-gray-300 leading-relaxed" {...props}>
      {children}
    </p>
  );
}

// Lists
function Ul({ children, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      className="list-disc list-inside my-3 space-y-1 text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </ul>
  );
}

function Ol({ children, ...props }: ComponentProps<'ol'>) {
  return (
    <ol
      className="list-decimal list-inside my-3 space-y-1 text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </ol>
  );
}

function Li({ children, ...props }: ComponentProps<'li'>) {
  return (
    <li className="ml-2" {...props}>
      {children}
    </li>
  );
}

// Strong/Bold
function Strong({ children, ...props }: ComponentProps<'strong'>) {
  return (
    <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </strong>
  );
}

// Blockquote
function Blockquote({ children, ...props }: ComponentProps<'blockquote'>) {
  return (
    <blockquote
      className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 dark:text-gray-400"
      {...props}
    >
      {children}
    </blockquote>
  );
}

// Link
function A({ children, href, ...props }: ComponentProps<'a'>) {
  return (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:underline"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  );
}

// Horizontal rule
function Hr(props: ComponentProps<'hr'>) {
  return <hr className="my-6 border-gray-300 dark:border-gray-700" {...props} />;
}

// MDX component mapping
export const mdxComponents = {
  code: InlineCode,
  pre: Pre,
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  ul: Ul,
  ol: Ol,
  li: Li,
  strong: Strong,
  blockquote: Blockquote,
  a: A,
  hr: Hr,
};

export type MDXComponentsType = typeof mdxComponents;
