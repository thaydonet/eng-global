import React, { useEffect, useRef } from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface CommentContentProps {
    content: string;
}

/**
 * Component to render comment content with:
 * - HTML support (sanitized)
 * - LaTeX math rendering ($...$)
 */
export default function CommentContent({ content }: CommentContentProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contentRef.current) return;

        // Render LaTeX formulas
        renderLatex();
    }, [content]);

    const renderLatex = () => {
        if (typeof window === 'undefined' || !window.katex || !contentRef.current) return;

        const processNode = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
                const text = node.textContent;
                const regex = /\$([^$]+)\$/g;

                if (!regex.test(text)) return;

                // Reset regex
                regex.lastIndex = 0;

                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                let match;

                while ((match = regex.exec(text)) !== null) {
                    // Add text before the match
                    if (match.index > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                    }

                    // Render LaTeX
                    try {
                        const span = document.createElement('span');
                        span.className = 'inline-math';
                        window.katex.render(match[1], span, {
                            throwOnError: false,
                            displayMode: false,
                        });
                        fragment.appendChild(span);
                    } catch (e) {
                        // Keep original if rendering fails
                        fragment.appendChild(document.createTextNode(match[0]));
                    }

                    lastIndex = regex.lastIndex;
                }

                // Add remaining text
                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                }

                // Replace node if we found LaTeX
                if (lastIndex > 0 && node.parentNode) {
                    node.parentNode.replaceChild(fragment, node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Process child nodes
                Array.from(node.childNodes).forEach(child => processNode(child));
            }
        };

        processNode(contentRef.current);
    };

    // Sanitize HTML to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['img', 'a', 'b', 'i', 'u', 'strong', 'em', 'br', 'p', 'span', 'div'],
        ALLOWED_ATTR: ['src', 'alt', 'href', 'title', 'class', 'width', 'height', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
    });

    return (
        <>
            <style>{`
                .comment-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                    margin: 0.5rem 0;
                }
                .comment-content a {
                    color: #3b82f6;
                    text-decoration: underline;
                }
                .comment-content a:hover {
                    color: #2563eb;
                }
            `}</style>
            <div
                ref={contentRef}
                className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm comment-content"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
        </>
    );
}
