import type { Context } from "https://edge.netlify.com";

const escapeMeta = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  // Path is /s/:slug
  const slug = url.pathname.split("/").pop();

  // If no slug or not a story path, just pass through
  if (!slug || !url.pathname.startsWith('/s/')) {
    return context.next();
  }

  // Environment variables
  const supabaseUrl = Deno.env.get("REACT_APP_SUPABASE_URL");
  const supabaseKey = Deno.env.get("REACT_APP_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in Edge Function");
    return context.next();
  }

  try {
    // Fetch story metadata — only public stories matched by slug
    const query = new URLSearchParams({
      public_slug: `eq.${slug}`,
      is_public: 'eq.true',
      select: 'title,prompt,image_path'
    });

    const apiUrl = `${supabaseUrl}/rest/v1/story_archives?${query}`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (!apiRes.ok) {
      console.error("Supabase error", await apiRes.text());
      return context.next();
    }

    const data = await apiRes.json();
    const story = data?.[0];

    // If story not found, just serve the app (it will show 404 UI)
    if (!story) {
      return context.next();
    }

    // Fetch the app shell (index.html)
    // Since this runs before rewrites, we need to explicitly fetch the content we want to serve
    // We assume the build output is at /index.html
    const origin = url.origin;
    const response = await fetch(`${origin}/index.html`);
    
    if (!response.ok) {
      return context.next();
    }

    const html = await response.text();

    // Prepare meta tags
    const title = escapeMeta(story.title || "DigiTimes Story");
    const description = escapeMeta(story.prompt || "Check out this story created with DigiTimes.");
    const imageUrl = escapeMeta(story.image_path
      ? `${supabaseUrl}/storage/v1/object/public/photos/${story.image_path}`
      : `${origin}/images/placeholders/newspapers1.jpeg`);

    // Inject tags
    // We replace the existing title and inject meta tags before </head>
    const canonicalUrl = escapeMeta(`${origin}/s/${slug}`);
    const modifiedHtml = html
      // Crawlers often use the first tag; replace default metadata rather than append duplicates.
      .replace(/<meta\b(?=[^>]*(?:name=["'](?:description|twitter:[^"']+)["']|property=["']og:[^"']+["']))[^>]*>/gi, '')
      .replace(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/gi, '')
      .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
      .replace('</head>', `
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:site_name" content="DigiTimes" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <link rel="canonical" href="${canonicalUrl}" />
    </head>`);

    return new Response(modifiedHtml, {
      headers: {
        ...Object.fromEntries(response.headers),
        'content-type': 'text/html; charset=utf-8'
      },
      status: 200
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return context.next();
  }
};
