import type { APIRoute } from 'astro';
import { getAllLessons } from '@/lib/lessons';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase();

    if (!query) {
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const allLessons = getAllLessons();
        const results = allLessons.filter(lesson =>
            lesson.name.toLowerCase().includes(query) ||
            lesson.description.toLowerCase().includes(query) ||
            lesson.conf_subject?.toLowerCase().includes(query)
        ).slice(0, 5); // Limit to 5 results

        const mappedResults = results.map(l => ({
            type: 'lesson',
            id: l.id,
            title: l.name,
            description: l.description,
            url: `/lessons/${l.id}` // Access via dynamic route logic if needed, or assume id is slug
        }));

        return new Response(JSON.stringify(mappedResults), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Search failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
