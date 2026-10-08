import { escapeHtml } from '../utils/sanitizeHtml';

// Built-in layouts need no network and keep stable IDs in saved stories.
export function templateLayout(title: string, index = 0) {
  const colors = ['#25433a', '#804757', '#526b85', '#ab542f', '#313b5e', '#685238', '#52624a'];
  const accent = colors[index % colors.length];
  return {
    html: `<article class="edition"><header><p class="edition-label">${escapeHtml(title)} · Special edition</p><div class="masthead">DigiTimes</div><p class="dateline">{{dateline}} · The newspaper of your life</p></header><h1>{{headline}}</h1><p class="byline">{{byline}}</p><figure><img src="{{imageUrl}}" alt="{{imageAlt}}" /></figure><section class="copy">{{bodyHtml}}</section><footer>Small moments. Big headlines.</footer></article>`,
    css: `.edition{--accent:${accent};max-width:760px;margin:auto;border-top:6px solid var(--accent)}.edition-label{text-transform:uppercase;letter-spacing:.16em;font:11px Arial,sans-serif;color:var(--accent);text-align:center}.masthead{font:bold clamp(34px,9vw,68px) Georgia,serif;text-align:center;letter-spacing:-.07em}.dateline{text-align:center;border-block:1px solid var(--accent);padding:8px;font:11px Arial,sans-serif}.edition h1{font-size:clamp(28px,6vw,46px);letter-spacing:-.035em;color:var(--accent);${index % 3 === 1 ? 'text-align:center;font-style:italic' : ''}}.byline{font:12px Arial,sans-serif}.edition figure{margin:24px 0}.edition img{width:100%;max-height:420px;object-fit:cover;border-radius:0}.copy{font-size:17px;${index % 3 === 2 ? 'column-count:2;column-gap:28px;column-rule:1px solid #ddd' : ''}}.copy p:first-child:first-letter{font-size:2.8em;float:left;line-height:.95;margin:4px 7px 0 0;color:var(--accent)}.edition footer{border-top:2px solid var(--accent);padding:16px 0;margin-top:28px;text-align:center;font:11px Arial,sans-serif}@media(max-width:500px){.copy{column-count:1}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`,
  };
}
