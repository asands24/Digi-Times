import type { Context } from "https://edge.netlify.com";

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
    // Fetch story metadata
    // We check for either public_slug OR id matching the slug
    const query = new URLSearchParams({
      or: `(public_slug.eq.${slug},id.eq.${slug})`,
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
    const title = (story.title || "DigiTimes Story").replace(/"/g, '&quot;');
    const description = (story.prompt || "Check out this story created with DigiTimes.").replace(/"/g, '&quot;');
    const imageUrl = story.image_path 
      ? `${supabaseUrl}/storage/v1/object/public/photos/${story.image_path}`
      : `${origin}/og-default.jpg`; // Ensure you have a default OG image if possible

    // Inject tags
    // We replace the existing title and inject meta tags before </head>
    const modifiedHtml = html
      .replace(/<title>.*<\/title>/, `<title>${title}</title>`)
      .replace('</head>', `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
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
