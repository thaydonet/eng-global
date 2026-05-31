import { marked } from 'marked';

/**
 * Processes Markdown content with LaTeX support
 * Converts Markdown to HTML while preserving LaTeX formulas ($...$)
 */
export function processMarkdown(content: string): string {
  if (!content) return '';

  // Configure marked options
  marked.setOptions({
    breaks: true,  // Convert \n to <br>
    gfm: true,     // GitHub Flavored Markdown
  });

  // Convert Markdown to HTML
  let html = marked.parse(content) as string;

  return html;
}

/**
 * Extracts alt text and creates responsive image HTML
 */
export function createResponsiveImage(src: string, alt: string = ''): string {
  return `<img src="${src}" alt="${alt}" class="w-full h-auto rounded-lg shadow-md my-6" loading="lazy" />`;
}

/**
 * Creates embedded video HTML (supports YouTube, Vimeo, etc.)
 */
export function createVideoEmbed(url: string): string {
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return `<div class="relative w-full pb-[56.25%] my-6">
        <iframe
          class="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
          src="https://www.youtube.com/embed/${videoId}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>`;
    }
  }

  // Vimeo
  if (url.includes('vimeo.com')) {
    const videoId = url.split('/').pop();
    return `<div class="relative w-full pb-[56.25%] my-6">
      <iframe
        class="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
        src="https://player.vimeo.com/video/${videoId}"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>`;
  }

  // Generic video file
  return `<video class="w-full h-auto rounded-lg shadow-md my-6" controls>
    <source src="${url}" type="video/mp4">
    Your browser does not support the video tag.
  </video>`;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
