/* Oxvid Tools engine — seo category. Extracted by
   scripts/split-engine.mjs; re-run it if engine.js's tool implementations
   change. Loaded on demand by ToolWorkspace.jsx only when a tool from this
   category is visited. */

import {
  KW_COUNTRIES,
  KW_LANGS,
  PLATFORM_META,
  controlsRow,
  copyText,
  debounce,
  download,
  esc,
  h,
  renderTextTool,
  selectField,
  svgIcon,
  toast,
} from './engine-core.js';

function metaTitleGenerator(ws,tool){ renderTextTool(ws,tool,{
  toolbarLabel:'Write your page title', placeholder:'Best Running Shoes for Flat Feet in 2026',
  outputLabel:'Preview & length', stats:(v)=>[['Characters', v.length],['Pixel width (approx)', Math.round(v.length*7)+'px'],['Status', v.length>60?'Likely truncated in search results':v.length<30?'Could be more descriptive':'Good length']],
  transform(v){ return v.length>60 ? v.slice(0,57)+'…' : v; }
});}

function metaDescriptionGenerator(ws,tool){ renderTextTool(ws,tool,{
  toolbarLabel:'Write your meta description', placeholder:'A short, compelling summary of the page that encourages a click from search results.',
  outputLabel:'Preview & length', stats:(v)=>[['Characters', v.length],['Status', v.length>160?'Likely truncated':v.length<70?'Could be longer':'Good length']],
  transform(v){ return v.length>160 ? v.slice(0,157)+'…' : v; }
});}

function openGraphGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Open Graph fields'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const fields = [['title','og:title','My Page Title'],['description','og:description','A short description of the page'],['url','og:url','https://example.com/page'],['image','og:image','https://example.com/image.jpg'],['type','og:type','website'],['site_name','og:site_name','My Site']];
  const inputs={};
  fields.forEach(([id,label,ph])=>{
    const f=h('div',{class:'field'}); f.append(h('label',null,label), (function(){const i=h('input',{type:'text',placeholder:ph}); inputs[id]=i; return i;})());
    body.appendChild(f);
  });
  const out=h('div',{class:'result-box', style:'margin-top:8px;'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy tags'); actions.appendChild(copyBtn); body.appendChild(actions);
  function run(){
    const lines = fields.map(([id,label])=>inputs[id].value ? `<meta property="${label}" content="${esc(inputs[id].value)}" />` : null).filter(Boolean);
    out.textContent = lines.join('\n') || 'Fill in the fields above to generate tags.';
  }
  Object.values(inputs).forEach(i=>i.addEventListener('input', debounce(run,100)));
  copyBtn.onclick=()=>copyText(out.textContent,'Tags copied');
  run();
}

function robotsTxtGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Build robots.txt rules'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const row=h('div',{class:'field-row'});
  const uaF=h('div',{class:'field',style:'margin:0;'}, h('label',null,'User-agent'), h('input',{type:'text',value:'*'}));
  const sitemapF=h('div',{class:'field',style:'margin:0;'}, h('label',null,'Sitemap URL (optional)'), h('input',{type:'text',placeholder:'https://example.com/sitemap.xml'}));
  row.append(uaF,sitemapF); body.appendChild(row);
  const disF=h('div',{class:'field'}, h('label',null,'Disallow paths (one per line)'), h('textarea',{rows:4, style:'font-family:var(--font-body);'}));
  disF.querySelector('textarea').value='/admin/\n/cart/';
  const allowF=h('div',{class:'field'}, h('label',null,'Allow paths (one per line, optional)'), h('textarea',{rows:2, style:'font-family:var(--font-body);'}));
  body.append(disF, allowF);
  const out=h('div',{class:'result-box'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'});
  const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy'); const dlBtn=h('button',{class:'btn btn-secondary btn-sm'},'Download robots.txt');
  actions.append(copyBtn,dlBtn); body.appendChild(actions);
  function run(){
    let lines=[`User-agent: ${uaF.querySelector('input').value||'*'}`];
    disF.querySelector('textarea').value.split('\n').map(s=>s.trim()).filter(Boolean).forEach(p=>lines.push('Disallow: '+p));
    allowF.querySelector('textarea').value.split('\n').map(s=>s.trim()).filter(Boolean).forEach(p=>lines.push('Allow: '+p));
    if(sitemapF.querySelector('input').value) lines.push('', 'Sitemap: '+sitemapF.querySelector('input').value);
    out.textContent = lines.join('\n');
  }
  [uaF,sitemapF,disF,allowF].forEach(f=>f.querySelector('input,textarea').addEventListener('input', debounce(run,100)));
  copyBtn.onclick=()=>copyText(out.textContent,'robots.txt copied');
  dlBtn.onclick=()=>download('robots.txt', out.textContent);
  run();
}

function xmlSitemapGenerator(ws,tool){ renderTextTool(ws,tool,{
  toolbarLabel:'One URL per line', placeholder:'https://example.com/\nhttps://example.com/about\nhttps://example.com/contact',
  outputLabel:'sitemap.xml',
  controls:[{id:'freq',type:'select',label:'Change frequency',default:'weekly',options:[['always','always'],['hourly','hourly'],['daily','daily'],['weekly','weekly'],['monthly','monthly'],['yearly','yearly'],['never','never']]}],
  transform(v,o){
    const urls = v.split('\n').map(s=>s.trim()).filter(Boolean);
    const today = new Date().toISOString().slice(0,10);
    const body = urls.map(u=>`  <url>\n    <loc>${esc(u)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${o.freq}</changefreq>\n  </url>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
  }
});}

function keywordDensityChecker(ws,tool){ renderTextTool(ws,tool,{
  toolbarLabel:'Paste your page content', placeholder:'Paste the body text you want to analyze…',
  outputLabel:'Top words by frequency',
  transform(v){
    const stop = new Set('a an the and or but of to in on for with is are was were be this that it as by from at your you we our'.split(' '));
    const words = v.toLowerCase().match(/[a-z0-9']+/g)||[];
    const freq={}; words.forEach(w=>{ if(!stop.has(w) && w.length>2) freq[w]=(freq[w]||0)+1; });
    const total = words.length || 1;
    const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,15);
    if(!top.length) return 'No significant keywords found.';
    return top.map(([w,c])=>`${w} — ${c} (${(c/total*100).toFixed(1)}%)`).join('\n');
  }
});}

function serpSnippetPreview(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Preview a Google-style result'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const urlF=h('div',{class:'field'}, h('label',null,'URL'), h('input',{type:'text',value:'https://example.com/blog/post-title'}));
  const titleF=h('div',{class:'field'}, h('label',null,'Title'), h('input',{type:'text',value:'A Great Page Title for Search'}));
  const descF=h('div',{class:'field'}, h('label',null,'Description'), h('textarea',{rows:2, style:'font-family:var(--font-body);'}));
  descF.querySelector('textarea').value='A short, compelling meta description that makes people want to click through from search results.';
  body.append(urlF,titleF,descF);
  const preview = h('div',{style:'border:1px solid var(--line);border-radius:8px;padding:16px;margin-top:14px;font-family:arial,sans-serif;background:var(--panel);'});
  body.appendChild(preview);
  function run(){
    preview.innerHTML = `<div style="color:#1a0dab;font-size:18px;line-height:1.3;">${esc(titleF.querySelector('input').value)}</div>
    <div style="color:#006621;font-size:13px;margin-top:2px;">${esc(urlF.querySelector('input').value)}</div>
    <div style="color:#545454;font-size:13px;margin-top:4px;max-width:600px;">${esc(descF.querySelector('textarea').value)}</div>`;
  }
  [urlF,titleF,descF].forEach(f=>f.querySelector('input,textarea').addEventListener('input', debounce(run,80)));
  run();
}

function canonicalTagGenerator(ws,tool){ renderTextTool(ws,tool,{
  toolbarLabel:'Enter the canonical URL', placeholder:'https://example.com/preferred-page',
  outputLabel:'Canonical tag',
  transform(v){ return `<link rel="canonical" href="${v.trim()}" />`; }
});}

function hreflangGenerator(ws,tool){ renderTextTool(ws,tool,{
  toolbarLabel:'One "lang: url" pair per line', placeholder:'en: https://example.com/\nes: https://example.com/es/\nfr: https://example.com/fr/',
  outputLabel:'Hreflang tags',
  transform(v){
    return v.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
      const [lang, ...rest] = l.split(':'); const url = rest.join(':').trim();
      if(!url) throw new Error(`Line "${l}" is missing a URL — use "lang: url".`);
      return `<link rel="alternate" hreflang="${lang.trim()}" href="${url}" />`;
    }).join('\n');
  }
});}

function schemaMarkupGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Choose a schema type'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const typeF = selectField('Schema type', [['Article','Article'],['Product','Product'],['FAQPage','FAQ Page'],['LocalBusiness','Local Business']], 'Article');
  body.appendChild(controlsRow(typeF));
  const fieldsHost = h('div',{style:'margin-top:14px;'}); body.appendChild(fieldsHost);
  const out = h('div',{class:'result-box', style:'margin-top:14px;'}); body.appendChild(out);
  const FIELD_SETS = {
    Article: [['headline','Headline'],['author','Author name'],['datePublished','Date published (YYYY-MM-DD)'],['image','Image URL']],
    Product: [['name','Product name'],['description','Description'],['price','Price'],['currency','Currency (e.g. USD)']],
    FAQPage: [['q1','Question 1'],['a1','Answer 1'],['q2','Question 2'],['a2','Answer 2']],
    LocalBusiness: [['name','Business name'],['address','Address'],['phone','Phone'],['url','Website URL']],
  };
  let inputs={};
  function buildFields(){
    fieldsHost.innerHTML=''; inputs={};
    FIELD_SETS[typeF.sel.value].forEach(([id,label])=>{
      const f=h('div',{class:'field'}); const inp=h('input',{type:'text'});
      f.append(h('label',null,label), inp); fieldsHost.appendChild(f); inputs[id]=inp;
      inp.addEventListener('input', debounce(run,100));
    });
    run();
  }
  function run(){
    const v=Object.fromEntries(Object.entries(inputs).map(([k,el])=>[k,el.value]));
    let json;
    if(typeF.sel.value==='Article') json={ '@context':'https://schema.org','@type':'Article',headline:v.headline,author:{'@type':'Person',name:v.author},datePublished:v.datePublished,image:v.image };
    else if(typeF.sel.value==='Product') json={ '@context':'https://schema.org','@type':'Product',name:v.name,description:v.description,offers:{'@type':'Offer',price:v.price,priceCurrency:v.currency} };
    else if(typeF.sel.value==='FAQPage') json={ '@context':'https://schema.org','@type':'FAQPage',mainEntity:[{'@type':'Question',name:v.q1,acceptedAnswer:{'@type':'Answer',text:v.a1}},{'@type':'Question',name:v.q2,acceptedAnswer:{'@type':'Answer',text:v.a2}}] };
    else json={ '@context':'https://schema.org','@type':'LocalBusiness',name:v.name,address:v.address,telephone:v.phone,url:v.url };
    out.textContent = '<script type="application/ld+json">\n'+JSON.stringify(json,null,2)+'\n<\/script>';
  }
  typeF.sel.addEventListener('change', buildFields);
  buildFields();
}

function urlParser(ws,tool){ renderTextTool(ws,tool,{
  toolbarLabel:'Paste a URL', placeholder:'https://example.com:8080/path/to/page?query=1&sort=asc#section',
  outputLabel:'Parsed parts',
  transform(v){
    let u; try{ u=new URL(v); }catch(e){ throw new Error('That doesn\'t look like a valid, complete URL (include https://).'); }
    const params = Array.from(u.searchParams.entries()).map(([k,val])=>`  ${k} = ${val}`).join('\n') || '  (none)';
    return `Protocol: ${u.protocol}\nHost: ${u.hostname}\nPort: ${u.port||'(default)'}\nPath: ${u.pathname}\nQuery params:\n${params}\nHash: ${u.hash||'(none)'}`;
  }
});}

function utmBuilder(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Build a campaign URL'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const fields = [['url','Website URL','https://example.com/landing'],['source','Campaign source','newsletter'],['medium','Campaign medium','email'],['campaign','Campaign name','spring-sale'],['term','Campaign term (optional)',''],['content','Campaign content (optional)','']];
  const inputs={};
  fields.forEach(([id,label,ph])=>{
    const f=h('div',{class:'field'}); const inp=h('input',{type:'text',placeholder:ph});
    f.append(h('label',null,label),inp); body.appendChild(f); inputs[id]=inp;
    inp.addEventListener('input', debounce(run,80));
  });
  const out=h('div',{class:'result-box'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy URL'); actions.appendChild(copyBtn); body.appendChild(actions);
  function run(){
    if(!inputs.url.value){ out.textContent='Enter a URL to build the link.'; return; }
    const params=new URLSearchParams();
    if(inputs.source.value) params.set('utm_source', inputs.source.value);
    if(inputs.medium.value) params.set('utm_medium', inputs.medium.value);
    if(inputs.campaign.value) params.set('utm_campaign', inputs.campaign.value);
    if(inputs.term.value) params.set('utm_term', inputs.term.value);
    if(inputs.content.value) params.set('utm_content', inputs.content.value);
    const sep = inputs.url.value.includes('?') ? '&' : '?';
    out.textContent = inputs.url.value + sep + params.toString();
  }
  copyBtn.onclick=()=>copyText(out.textContent,'URL copied');
  run();
}

function platformBadge(name, size){
  size = size||26;
  const m = PLATFORM_META[name] || {bg:'#666',fg:'#fff',glyph:name[0]};
  const el = h('span',{class:'plat-badge', style:`width:${size}px;height:${size}px;font-size:${Math.round(size*0.46)}px;background:${m.bg};color:${m.fg};${m.border?'box-shadow:inset 0 0 0 1px rgba(0,0,0,0.15), 0 2px 5px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.6);':''}`}, m.glyph);
  return el;
}

function keywordSuggestionGenerator(ws,tool){
  const PLATFORMS = {
    Google:   { mods:['near me','for beginners','free','online','2026','meaning','definition','examples'] },
    YouTube:  { mods:['tutorial','review','unboxing','vs','tips','explained','2026','reaction','full guide'] },
    Bing:     { mods:['near me','best','how to','free','download','meaning','guide'] },
    Amazon:   { mods:['best','cheap','alternative','vs','reviews','for gift','bundle','under $50'] },
    eBay:     { mods:['used','for sale','bundle lot','vintage','new in box','cheap'] },
    'App Store': { mods:['app','alternative','free app','for iphone','offline','pro version'] },
    'Google Play': { mods:['app','alternative','free app','for android','apk','offline'] },
    Instagram:{ mods:['captions','hashtags','bio ideas','post ideas','aesthetic','reels ideas'] },
    'X / Twitter': { mods:['trending','thread','meme','news','opinion'] },
    Reddit:   { mods:['reddit','best subreddit for','honest review','worth it','alternative'] },
    Pinterest:{ mods:['ideas','diy','inspiration','aesthetic','board','recipe'] },
    Etsy:     { mods:['handmade','custom','personalized','gift','vintage','digital download'] },
    TikTok:   { mods:['trend','challenge','sound','hack','tips','viral'] },
    Naver:    { mods:['후기','추천','가격','비교','블로그'] },
    Trends:   { mods:['trending now','rising','breakout','by region','over time'] },
  };
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const platformNames = Object.keys(PLATFORMS);
  const initial = { params: new URLSearchParams(window.location.search) };
  let activePlatform = platformNames.includes(initial.params.get('platform')) ? initial.params.get('platform') : platformNames[0];

  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Research keywords by platform'));
  const body=h('div',{class:'ws-body', style:'padding:0;'});
  ws.append(toolbar,body);

  // ---- Dark research panel (mirrors a familiar autocomplete-research tool layout) ----
  const panel = h('div',{class:'kw-dark-panel'});
  const heading = h('h2',null, 'Research Keywords Using '+activePlatform+' Autocomplete');
  panel.appendChild(heading);
  const tabRow = h('div',{class:'kw-platform-row'});
  const tabs = {};
  platformNames.forEach(name=>{
    const tab = h('div',{class:'kw-platform-tab'+(name===activePlatform?' active':''), tabindex:'0', role:'button'});
    tab.append(platformBadge(name,22), h('span',null,name));
    tab.onclick = ()=>{ activePlatform=name; Object.entries(tabs).forEach(([n,el])=>el.classList.toggle('active', n===name)); heading.textContent='Research Keywords Using '+name+' Autocomplete'; run(); };
    tab.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); tab.click(); } });
    tabs[name]=tab; tabRow.appendChild(tab);
  });
  panel.appendChild(tabRow);
  const bar = h('div',{class:'kw-searchbar'});
  const typeSel = h('select',null); [['all','All'],['platform','Platform'],['questions','Questions'],['prepositions','Prepositions'],['alphabet','A–Z']].forEach(([v,l])=>typeSel.appendChild(h('option',{value:v},l)));
  const kwInput = h('input',{type:'text', placeholder:'Type a keyword and press enter', value: initial.params.get('q')||'coffee subscription'});
  const countrySel = h('select',null); Object.entries(KW_COUNTRIES).forEach(([v,c])=>countrySel.appendChild(h('option',{value:v},c.label)));
  const langSel = h('select',null); Object.entries(KW_LANGS).forEach(([v,l])=>langSel.appendChild(h('option',{value:v},l.label)));
  const searchBtn = h('button',{type:'button'}); searchBtn.innerHTML = svgIcon('search');
  bar.append(typeSel, kwInput, countrySel, langSel, searchBtn);
  panel.appendChild(bar);
  body.appendChild(panel);

  const inner = h('div',{style:'padding:20px;'});
  inner.appendChild(h('div',{class:'callout', style:'margin-bottom:16px;'},
    'This generates keyword ideas using the same question / preposition / alphabet / platform-intent patterns real keyword tools seed their research with. It does not pull live results from Google, Bing, YouTube or Amazon\'s autocomplete — browsers can\'t query those APIs directly (they block cross-site requests), so any site claiming to show you "live" autocomplete from all of them is generating results locally like this, or running a server behind the scenes.'));
  const resultsHost = h('div',{style:'display:grid;gap:16px;'});
  inner.appendChild(resultsHost);
  const actions = h('div',{class:'ws-actions'});
  const copyBtn = h('button',{class:'btn btn-secondary btn-sm'},'Copy all');
  const dlBtn = h('button',{class:'btn btn-secondary btn-sm'},'Download .txt');
  actions.append(copyBtn, dlBtn);
  inner.appendChild(actions);
  body.appendChild(inner);

  let allLines = [];
  function section(title, lines){
    const wrap = h('div');
    wrap.append(h('div',{style:'font-size:12.5px;font-weight:600;color:var(--muted);margin-bottom:8px;'}, title+' ('+lines.length+')'));
    const box = h('div',{class:'result-box'}, lines.join('\n'));
    wrap.appendChild(box);
    return wrap;
  }
  function run(){
    const kw = kwInput.value.trim();
    resultsHost.innerHTML = '';
    if(!kw){ resultsHost.appendChild(h('p',{style:'color:var(--muted);font-size:13.5px;'},'Type a seed keyword above to generate ideas.')); allLines=[]; return; }
    const lang = KW_LANGS[langSel.value] || KW_LANGS.en;
    const country = KW_COUNTRIES[countrySel.value] || KW_COUNTRIES.global;
    const questions = lang.questions.map(q=>`${q} ${kw}`);
    const prepositions = lang.prepositions.map(p=>`${kw} ${p}`);
    const alphabet = ALPHABET.map(l=>`${kw} ${l}`);
    const platformIdeas = PLATFORMS[activePlatform].mods.map(m=>`${kw} ${m}`);
    const localIdeas = country.mods.map(m=>`${kw} ${m}`);
    const show = typeSel.value;
    const sections = [];
    allLines = [];
    if(show==='all' || show==='platform'){ sections.push(section(activePlatform+' intent', platformIdeas)); allLines.push(...platformIdeas); }
    if(localIdeas.length && (show==='all' || show==='platform')){ sections.push(section(country.label, localIdeas)); allLines.push(...localIdeas); }
    if(show==='all' || show==='questions'){ sections.push(section('Questions ('+lang.label+')', questions)); allLines.push(...questions); }
    if(show==='all' || show==='prepositions'){ sections.push(section('Prepositions ('+lang.label+')', prepositions)); allLines.push(...prepositions); }
    if(show==='all' || show==='alphabet'){ sections.push(section('Alphabetical (A–Z)', alphabet)); allLines.push(...alphabet); }
    resultsHost.append(...sections);
  }
  kwInput.addEventListener('input', debounce(run,150));
  kwInput.addEventListener('keydown', e=>{ if(e.key==='Enter') run(); });
  typeSel.addEventListener('change', run);
  countrySel.addEventListener('change', run);
  langSel.addEventListener('change', run);
  searchBtn.addEventListener('click', run);
  copyBtn.onclick = ()=>copyText(allLines.join('\n'), allLines.length?'Keyword ideas copied':'Nothing to copy yet');
  dlBtn.onclick = ()=>{ if(!allLines.length){ toast('Nothing to download yet'); return; } download(tool.slug+'.txt', allLines.join('\n')); };
  run();
}

export const DISPATCH = {
  'meta-title-generator': metaTitleGenerator,
  'meta-description-generator': metaDescriptionGenerator,
  'open-graph-generator': openGraphGenerator,
  'robots-txt-generator': robotsTxtGenerator,
  'xml-sitemap-generator': xmlSitemapGenerator,
  'keyword-density-checker': keywordDensityChecker,
  'serp-snippet-preview': serpSnippetPreview,
  'canonical-tag-generator': canonicalTagGenerator,
  'hreflang-generator': hreflangGenerator,
  'schema-markup-generator': schemaMarkupGenerator,
  'url-parser': urlParser,
  'utm-builder': utmBuilder,
  'keyword-suggestion-generator': keywordSuggestionGenerator,
};
