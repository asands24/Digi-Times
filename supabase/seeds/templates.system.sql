insert into templates (title, slug, html, css, is_system)
values
(
  'Classic Broadsheet',
  'broadsheet-classic',
  '<article class="broadsheet"><header><h1>{{headline}}</h1><p class="dek">{{dek}}</p></header><figure><img src="{{imageUrl}}" alt="{{imageAlt}}"></figure><section class="body">{{bodyHtml}}</section><footer>{{byline}}</footer></article>',
  '.broadsheet{font-family:Georgia,serif;max-width:800px;margin:auto;} .dek{font-style:italic;opacity:.8}',
  true
)
on conflict (slug) do nothing;

insert into templates (title, slug, html, css, is_system)
values
(
  'Evening Tabloid',
  'tabloid-evening',
  '<article class="tabloid"><h1>{{headline}}</h1><figure><img src="{{imageUrl}}" alt="{{imageAlt}}"></figure><section>{{bodyHtml}}</section></article>',
  '.tabloid{font-family:Impact, Haettenschweiler, Arial Narrow Bold, sans-serif;letter-spacing:.5px;max-width:760px;margin:auto;}',
  true
)
on conflict (slug) do nothing;
