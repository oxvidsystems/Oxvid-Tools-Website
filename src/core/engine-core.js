/* Oxvid Tools engine — shared core: helpers, tool/category data, and the
   generic render engines (calculator/text/image workspaces) used across
   multiple categories. Extracted by scripts/split-engine.mjs; re-run it if
   engine.js's tool implementations change. */

const qs = (s, r=document) => r.querySelector(s);

const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

function h(tag, attrs, ...kids){
  const e = document.createElement(tag);
  if(attrs) for(const k in attrs){
    if(k==='html'){ e.innerHTML = attrs[k]; }
    else if(k.startsWith('on') && typeof attrs[k]==='function'){ e.addEventListener(k.slice(2), attrs[k]); }
    else if(k==='class'){ e.className = attrs[k]; }
    else if(attrs[k]!==false && attrs[k]!=null){ e.setAttribute(k, attrs[k]); }
  }
  kids.flat().forEach(k=>{
    if(k==null) return;
    const isNode = typeof k==='object' && k.nodeType!=null;
    e.appendChild(isNode ? k : document.createTextNode(String(k)));
  });
  return e;
}

function esc(str){
  return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

function slugify(s){
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g,'')
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-')
    .replace(/^-|-$/g,'');
}

function download(filename, content, mime){
  mime = mime || 'text/plain;charset=utf-8';
  const blob = (content instanceof Blob) ? content : new Blob([content], {type:mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

let toastTimer;

function toast(msg){
  const t = qs('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}

async function copyText(text, msg){
  try{
    await navigator.clipboard.writeText(text);
    toast(msg || 'Copied to clipboard');
  }catch(e){
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); toast(msg || 'Copied to clipboard'); }
    catch(e2){ toast('Could not copy — select and copy manually'); }
    ta.remove();
  }
}

function fmtBytes(n){
  if(n===0) return '0 B';
  const u=['B','KB','MB','GB']; const i=Math.min(u.length-1, Math.floor(Math.log(n)/Math.log(1024)));
  return (n/Math.pow(1024,i)).toFixed(i===0?0:2)+' '+u[i];
}

function fmtNum(n, d){
  if(n===null||n===undefined||Number.isNaN(n)) return '—';
  return Number(n).toLocaleString(undefined, {maximumFractionDigits: d===undefined?2:d});
}

function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

function svgIcon(name){
  const map = {
    search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
    upload:'<path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/>',
    empty:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6" stroke-linecap="round"/>',
    soon:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2" stroke-linecap="round" stroke-linejoin="round"/>',
    sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    pdf:'<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M9 13.5h6M9 17h4"/>',
    image:'<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5.5-5.5L4 20"/>',
    text:'<path d="M4 6h16M4 12h11M4 18h14" stroke-linecap="round"/>',
    dev:'<path d="M9 6L3.5 12 9 18M15 6l5.5 6-5.5 6" stroke-linecap="round" stroke-linejoin="round"/>',
    calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7.2h8" stroke-linecap="round"/><path d="M8 11.2h.01M12 11.2h.01M16 11.2h.01M8 15h.01M12 15h.01M16 15h.01M8 18.5h.01M12 18.5h.01" stroke-linecap="round" stroke-width="2.4"/>',
    seo:'<circle cx="10" cy="10" r="6.5"/><path d="M20.5 20.5L15 15" stroke-linecap="round"/><path d="M7 11l1.8-2 1.7 1.8L13.5 7.3" stroke-linecap="round" stroke-linejoin="round"/>',
    finance:'<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M8.5 7.5V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3 12.5h18M10.5 12.5v3" stroke-linecap="round"/>',
    color:'<path d="M12 3a9 9 0 1 0 1.5 17.9c1 0 1.3-.9.9-1.6-.3-.6-.1-1.3.6-1.5.6-.2 1.3-.2 2 .1a2.6 2.6 0 0 0 3.4-1.7A9 9 0 0 0 12 3z"/><circle cx="7.7" cy="11.5" r="1.1"/><circle cx="10.8" cy="7.8" r="1.1"/><circle cx="15.2" cy="8.3" r="1.1"/><circle cx="16.3" cy="12.6" r="1.1"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${map[name]||''}</svg>`;
}

function hexToRgb(hex){
  hex = hex.replace('#','').trim();
  if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  const n = parseInt(hex,16);
  if(hex.length!==6 || Number.isNaN(n)) return null;
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}

function rgbToHex(r,g,b){
  return '#' + [r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
}

function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){ h=s=0; }
  else{
    const d=max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h/=6;
  }
  return { h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100) };
}

function hslToRgb(h,s,l){
  h/=360; s/=100; l/=100;
  let r,g,b;
  if(s===0){ r=g=b=l; }
  else{
    const hue2rgb=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
    const q = l<0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  return { r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) };
}

const CATEGORIES = [
  { key:'pdf',     name:'PDF & Documents', desc:'Merge, split, compress and convert PDF files.' },
  { key:'image',   name:'Image Tools',     desc:'Resize, compress, convert and edit images.' },
  { key:'text',    name:'Text & Writing',  desc:'Count, clean, transform and generate text.' },
  { key:'dev',     name:'Developer Tools', desc:'Format, validate, encode and inspect code and data.' },
  { key:'calc',    name:'Calculators',     desc:'Everyday maths, health and date calculators.' },
  { key:'seo',     name:'SEO & Web',       desc:'Meta tags, sitemaps and on-page SEO helpers.' },
  { key:'finance', name:'Finance & Business', desc:'Pricing, margin, ROI and invoicing tools.' },
  { key:'gen',     name:'Generators',      desc:'QR codes, passwords, IDs and placeholder data.' },
  { key:'color',   name:'Color & Design',  desc:'Color conversion, palettes and CSS generators.' },
];

const CAT_BY_KEY = Object.fromEntries(CATEGORIES.map(c=>[c.key,c]));

const RAW_TOOLS = [
  // PDF & Documents — Phase 2 (needs a PDF engine; scaffolded, not faked)
  ['pdf-merge','PDF Merge','pdf','Combine multiple PDF files into one document, in the order you choose.','combine join pdfs',1,0],
  ['pdf-split','PDF Split','pdf','Split a PDF into separate files by page range.','extract separate pages',1,0],
  ['pdf-compress','PDF Compress','pdf','Reduce PDF file size for easier sharing and upload.','reduce shrink size',1,0],
  ['pdf-to-jpg','PDF to JPG','pdf','Convert each page of a PDF into a JPG image.','convert export',0,0],
  ['jpg-to-pdf','JPG to PDF','pdf','Turn one or more JPG images into a single PDF.','convert images',0,0],
  ['png-to-pdf','PNG to PDF','pdf','Turn one or more PNG images into a single PDF.','convert images',0,0],
  ['pdf-to-png','PDF to PNG','pdf','Convert each page of a PDF into a PNG image.','convert export',0,0],
  ['pdf-to-text','PDF to Text','pdf','Extract the plain text content from a PDF file.','extract ocr copy',0,0],
  ['text-to-pdf','Text to PDF','pdf','Turn plain text into a formatted, downloadable PDF.','convert create',0,0],
  ['pdf-rotate','PDF Rotate','pdf','Rotate one or all pages of a PDF document.','turn orientation',0,0],
  ['pdf-extract-pages','PDF Extract Pages','pdf','Pull a specific set of pages out of a PDF into a new file.','save subset',0,0],
  ['pdf-delete-pages','PDF Delete Pages','pdf','Remove unwanted pages from a PDF document.','remove clean up',0,0],
  ['pdf-reorder-pages','PDF Reorder Pages','pdf','Rearrange the page order of a PDF document.','sort pages',0,0],
  ['pdf-protect','PDF Protect','pdf','Add a password to restrict access to a PDF.','encrypt password lock',0,0],
  ['pdf-unlock','PDF Unlock','pdf','Remove a known password from a protected PDF.','decrypt password',0,0],
  ['pdf-page-numbering','PDF Page Numbering','pdf','Add page numbers to every page of a PDF.','pagination footer',0,0],
  ['pdf-watermark','PDF Watermark','pdf','Stamp a text or image watermark across PDF pages.','stamp brand',0,0],
  ['pdf-metadata-viewer','PDF Metadata Viewer','pdf','Inspect the author, title and other metadata of a PDF.','inspect properties',0,0],
  ['pdf-metadata-remover','PDF Metadata Remover','pdf','Strip identifying metadata from a PDF file.','clean privacy',0,0],
  ['pdf-size-analyzer','PDF Size Analyzer','pdf','See what is taking up space inside a PDF file.','analyze breakdown',0,0],

  // Image Tools — live, canvas-based
  ['image-compress','Image Compress','image','Shrink JPG, PNG or WEBP file size while controlling quality.','reduce optimize shrink',1,1],
  ['image-resize','Image Resize','image','Resize an image to exact pixel dimensions or a percentage.','scale dimensions',1,0],
  ['image-crop','Image Crop','image','Crop an image to a specific rectangle.','trim cut',0,0],
  ['image-rotate','Image Rotate','image','Rotate an image by 90°, 180°, 270° or a custom angle.','turn orientation',0,0],
  ['image-flip','Image Flip','image','Flip an image horizontally or vertically.','mirror',0,0],
  ['image-converter','Image Converter','image','Convert an image between JPG, PNG and WEBP.','format convert',1,0],
  ['jpg-to-png','JPG to PNG','image','Convert a JPG image to PNG format.','convert format',0,0],
  ['png-to-jpg','PNG to JPG','image','Convert a PNG image to JPG format.','convert format',0,0],
  ['webp-to-jpg','WEBP to JPG','image','Convert a WEBP image to JPG format.','convert format',0,0],
  ['jpg-to-webp','JPG to WEBP','image','Convert a JPG image to WEBP format.','convert format',0,0],
  ['png-to-webp','PNG to WEBP','image','Convert a PNG image to WEBP format.','convert format',0,0],
  ['webp-to-png','WEBP to PNG','image','Convert a WEBP image to PNG format.','convert format',0,0],
  ['image-to-base64','Image to Base64','image','Encode an image file into a Base64 data URI.','encode data uri',0,0],
  ['base64-to-image','Base64 to Image','image','Decode a Base64 string back into a downloadable image.','decode data uri',0,0],
  ['image-grayscale','Image Grayscale','image','Convert a color image to grayscale.','black and white desaturate',0,0],
  ['image-blur','Image Blur','image','Apply an adjustable blur effect to an image.','soften effect',0,0],
  ['image-pixelate','Image Pixelate','image','Pixelate an image or blur out sensitive areas.','mosaic censor',0,0],
  ['image-quality-analyzer','Image Quality Analyzer','image','Check resolution, size and estimated quality of an image.','inspect analyze',0,0],
  ['image-dimensions-viewer','Image Dimensions Viewer','image','View the exact width, height and aspect ratio of an image.','size inspect',0,0],
  ['favicon-generator','Favicon Generator','image','Generate favicon.ico-ready PNGs in standard sizes from one image.','icon website',0,0],

  // Text & Writing — live
  ['word-counter','Word Counter','text','Count words, characters, sentences and reading time as you type.','count text length seo',1,1],
  ['character-counter','Character Counter','text','Count characters with and without spaces.','count length limit',1,0],
  ['sentence-counter','Sentence Counter','text','Count the number of sentences in a block of text.','count text',0,0],
  ['paragraph-counter','Paragraph Counter','text','Count the number of paragraphs in a block of text.','count text',0,0],
  ['reading-time-calculator','Reading Time Calculator','text','Estimate how long a piece of text takes to read aloud or silently.','wpm article blog',0,0],
  ['case-converter','Case Converter','text','Convert text between sentence case, Title Case, camelCase and more.','uppercase lowercase',1,0],
  ['uppercase-converter','Uppercase Converter','text','Convert text to UPPERCASE.','case convert',0,0],
  ['lowercase-converter','Lowercase Converter','text','Convert text to lowercase.','case convert',0,0],
  ['title-case-converter','Title Case Converter','text','Convert text to Title Case.','case convert heading',0,0],
  ['remove-duplicate-lines','Remove Duplicate Lines','text','Delete repeated lines from a list or block of text.','dedupe unique list',0,0],
  ['remove-extra-spaces','Remove Extra Spaces','text','Collapse repeated spaces, tabs and blank lines.','trim whitespace clean',0,0],
  ['text-sorter','Text Sorter','text','Sort lines of text alphabetically, by length or numerically.','order alphabetize list',0,0],
  ['text-reverser','Text Reverser','text','Reverse text by character, word or line.','flip mirror',0,0],
  ['slug-generator','Slug Generator','text','Turn a title into a clean, URL-safe slug.','url friendly seo permalink',1,0],
  ['lorem-ipsum-generator','Lorem Ipsum Generator','text','Generate placeholder Lorem Ipsum paragraphs, sentences or words.','placeholder dummy text',0,0],

  // Developer Tools — live
  ['json-formatter','JSON Formatter','dev','Pretty-print and indent JSON for readability.','beautify indent pretty',1,1],
  ['json-validator','JSON Validator','dev','Check whether a JSON document is syntactically valid.','lint check syntax',1,0],
  ['json-minifier','JSON Minifier','dev','Strip whitespace from JSON to reduce its size.','compress minify',0,0],
  ['xml-formatter','XML Formatter','dev','Pretty-print and indent XML markup.','beautify indent',0,0],
  ['xml-validator','XML Validator','dev','Check whether an XML document is well-formed.','lint check syntax',0,0],
  ['html-formatter','HTML Formatter','dev','Pretty-print and indent HTML markup.','beautify indent',0,0],
  ['css-formatter','CSS Formatter','dev','Pretty-print and indent CSS rules.','beautify indent',0,0],
  ['javascript-formatter','JavaScript Formatter','dev','Add readable indentation and line breaks to JavaScript.','beautify indent',0,0],
  ['html-minifier','HTML Minifier','dev','Strip comments and whitespace from HTML.','compress minify',0,0],
  ['css-minifier','CSS Minifier','dev','Strip comments and whitespace from CSS.','compress minify',0,0],
  ['javascript-minifier','JavaScript Minifier','dev','Strip comments and extra whitespace from JavaScript.','compress minify',0,0],
  ['base64-encoder','Base64 Encoder','dev','Encode text into Base64.','encode convert',1,0],
  ['base64-decoder','Base64 Decoder','dev','Decode a Base64 string back into text.','decode convert',1,0],
  ['url-encoder','URL Encoder','dev','Percent-encode text for safe use in a URL.','encode uri escape',1,0],
  ['url-decoder','URL Decoder','dev','Decode a percent-encoded URL string.','decode uri unescape',1,0],
  ['uuid-generator','UUID Generator','dev','Generate random UUID v4 identifiers, one or in bulk.','guid unique id random',1,0],
  ['jwt-decoder','JWT Decoder','dev','Decode a JSON Web Token header and payload (no signature check).','json web token auth',0,0],
  ['regex-tester','Regex Tester','dev','Test a regular expression against sample text with live matches.','regexp pattern match',1,0],
  ['unix-timestamp-converter','Unix Timestamp Converter','dev','Convert between Unix timestamps and human-readable dates.','epoch date time',0,0],
  ['hash-generator','Hash Generator','dev','Generate MD5, SHA-1, SHA-256 and SHA-512 hashes of text.','checksum md5 sha',0,0],

  // Calculators — live
  ['percentage-calculator','Percentage Calculator','calc','Work out percentages, percentage of a value and reverse percentages.','percent math',1,1],
  ['percentage-change-calculator','Percentage Change Calculator','calc','Calculate the percentage increase or decrease between two numbers.','percent difference',0,0],
  ['average-calculator','Average Calculator','calc','Calculate the mean, median and mode of a list of numbers.','mean median mode',0,0],
  ['ratio-calculator','Ratio Calculator','calc','Simplify a ratio or scale it to a new value.','proportion simplify',0,0],
  ['age-calculator','Age Calculator','calc','Calculate exact age in years, months and days from a birth date.','birthday date',1,0],
  ['date-difference-calculator','Date Difference Calculator','calc','Calculate the number of days, weeks and months between two dates.','days between',0,0],
  ['time-difference-calculator','Time Difference Calculator','calc','Calculate the duration between two times of day.','hours minutes',0,0],
  ['bmi-calculator','BMI Calculator','calc','Calculate Body Mass Index from height and weight.','health weight fitness',1,0],
  ['bmr-calculator','BMR Calculator','calc','Estimate Basal Metabolic Rate using the Mifflin-St Jeor equation.','metabolism calories',0,0],
  ['calorie-calculator','Calorie Calculator','calc','Estimate daily calorie needs based on activity level.','diet nutrition tdee',0,0],
  ['discount-calculator','Discount Calculator','calc','Calculate a sale price after a percentage discount.','sale price off',0,0],
  ['tip-calculator','Tip Calculator','calc','Calculate a tip and split a bill between people.','gratuity split bill',0,0],
  ['loan-calculator','Loan Calculator','calc','Calculate monthly payments and total interest on a loan.','payment amortization',0,0],
  ['mortgage-calculator','Mortgage Calculator','calc','Estimate monthly mortgage payments including tax and insurance.','home loan payment',0,0],
  ['compound-interest-calculator','Compound Interest Calculator','calc','Calculate growth of an investment with compound interest.','investment growth',0,0],
  ['simple-interest-calculator','Simple Interest Calculator','calc','Calculate interest earned or owed using simple interest.','loan investment',0,0],
  ['profit-margin-calculator','Profit Margin Calculator','calc','Calculate gross profit margin from cost and revenue.','markup margin business',0,0],
  ['markup-calculator','Markup Calculator','calc','Calculate selling price from cost and a target markup.','price cost business',0,0],
  ['salary-calculator','Salary Calculator','calc','Convert between hourly, monthly and annual salary.','wage pay income',0,0],
  ['unit-converter','Unit Converter','calc','Convert between length, weight, temperature and volume units.','metric imperial convert',1,0],

  // SEO & Web — live except HTTP status checker
  ['meta-title-generator','Meta Title Generator','seo','Write and check the length of an SEO page title.','title tag length',1,0],
  ['meta-description-generator','Meta Description Generator','seo','Write and check the length of a meta description.','meta tag snippet',1,0],
  ['open-graph-generator','Open Graph Generator','seo','Generate Open Graph meta tags for social sharing previews.','og facebook social',0,0],
  ['robots-txt-generator','Robots.txt Generator','seo','Build a robots.txt file with allow/disallow rules.','crawler indexing',0,0],
  ['xml-sitemap-generator','XML Sitemap Generator','seo','Generate an XML sitemap from a list of URLs.','sitemap.xml urls',0,0],
  ['keyword-density-checker','Keyword Density Checker','seo','See how often each word or phrase appears in a body of text.','word frequency seo',0,0],
  ['serp-snippet-preview','SERP Snippet Preview','seo','Preview how a title and description will look in Google search results.','google preview serp',0,0],
  ['canonical-tag-generator','Canonical Tag Generator','seo','Generate a rel=canonical link tag for a URL.','duplicate content',0,0],
  ['hreflang-generator','Hreflang Generator','seo','Generate hreflang tags for a multilingual page set.','international language',0,0],
  ['schema-markup-generator','Schema Markup Generator','seo','Generate JSON-LD structured data for common schema types.','json-ld rich results',0,0],
  ['http-status-code-checker','HTTP Status Code Checker','seo','Look up a live URL\'s HTTP response status.','status code 404 500',0,0],
  ['url-parser','URL Parser','seo','Break a URL down into protocol, host, path, query and hash.','inspect uri parts',0,0],
  ['utm-builder','UTM Builder','seo','Build a campaign URL with UTM tracking parameters.','analytics campaign tracking',0,0],
  ['keyword-suggestion-generator','Keyword Suggestion Generator','seo','Expand a seed keyword into long-tail ideas — questions, comparisons, prepositions and platform-specific angles for Google, YouTube, Bing, Amazon and more.','autocomplete keyword research long tail bing google youtube amazon',1,1],

  // Finance & Business — live
  ['roi-calculator','ROI Calculator','finance','Calculate return on investment as a percentage.','return investment',1,0],
  ['roas-calculator','ROAS Calculator','finance','Calculate return on ad spend from revenue and ad cost.','advertising marketing',0,0],
  ['revenue-calculator','Revenue Calculator','finance','Calculate total revenue from units sold and price.','sales income',0,0],
  ['gross-profit-calculator','Gross Profit Calculator','finance','Calculate gross profit from revenue and cost of goods sold.','cogs margin',0,0],
  ['net-profit-calculator','Net Profit Calculator','finance','Calculate net profit after all expenses.','income statement',0,0],
  ['break-even-calculator','Break-Even Calculator','finance','Calculate the break-even point in units and revenue.','fixed variable cost',0,0],
  ['vat-calculator','VAT Calculator','finance','Add or remove VAT from a price.','tax europe uk',0,0],
  ['sales-tax-calculator','Sales Tax Calculator','finance','Calculate sales tax and total price.','tax us purchase',0,0],
  ['commission-calculator','Commission Calculator','finance','Calculate commission earned on a sale.','sales rep payout',0,0],
  ['invoice-generator','Invoice Generator','finance','Create a professional, itemized invoice to print or save.','billing client document',1,0],
  ['quote-generator','Quote Generator','finance','Create a professional price quote to print or send.','estimate proposal',0,0],
  ['pricing-calculator','Pricing Calculator','finance','Work out a sale price from cost, margin and fees.','cost margin fees',0,0],
  ['business-loan-calculator','Business Loan Calculator','finance','Estimate repayments on a business loan.','sme finance',0,0],
  ['savings-calculator','Savings Calculator','finance','Project savings growth with regular contributions.','goal deposit',0,0],
  ['investment-return-calculator','Investment Return Calculator','finance','Project the future value of a lump-sum investment.','compound growth',0,0],

  // Generators — live
  ['qr-code-generator','QR Code Generator','gen','Generate a scannable QR code from text, a URL or contact details.','qr code scan link',1,1],
  ['password-generator','Password Generator','gen','Generate strong, random passwords with custom rules.','secure random pin',1,1],
  ['username-generator','Username Generator','gen','Generate available-style username suggestions.','handle nickname',0,0],
  ['random-number-generator','Random Number Generator','gen','Generate one or more random numbers in a range.','rng lottery pick',0,0],
  ['random-string-generator','Random String Generator','gen','Generate a random string of letters, numbers or symbols.','token key random',0,0],
  ['barcode-generator','Barcode Generator','gen','Generate a scannable barcode (CODE128, EAN, UPC and more).','barcode product sku',0,0],
  ['color-palette-generator','Color Palette Generator','gen','Generate a color palette from a base color and harmony rule.','colors scheme design',0,0],
  ['fake-data-generator','Fake Data Generator','gen','Generate placeholder names, emails and addresses for testing.','mock dummy sample',0,0],
  ['name-generator','Name Generator','gen','Generate random first and last name combinations.','random people',0,0],
  ['business-name-generator','Business Name Generator','gen','Generate business name ideas from a keyword.','brand startup naming',0,0],
  ['email-subject-generator','Email Subject Generator','gen','Generate email subject line ideas for a campaign type.','marketing newsletter',0,0],
  ['pin-generator','PIN Generator','gen','Generate a random numeric PIN of any length.','code security',0,0],

  // Color & Design — live
  ['hex-to-rgb','HEX to RGB','color','Convert a HEX color code to RGB values.','color convert css',1,0],
  ['rgb-to-hex','RGB to HEX','color','Convert RGB values to a HEX color code.','color convert css',0,0],
  ['hex-to-hsl','HEX to HSL','color','Convert a HEX color code to HSL values.','color convert css',0,0],
  ['hsl-to-hex','HSL to HEX','color','Convert HSL values to a HEX color code.','color convert css',0,0],
  ['color-picker','Color Picker','color','Pick a color and get its HEX, RGB and HSL values instantly.','swatch eyedropper',0,0],
  ['color-contrast-checker','Color Contrast Checker','color','Check WCAG contrast ratio between a text and background color.','accessibility wcag aa',1,1],
  ['palette-extractor','Palette Extractor','color','Extract the dominant colors from an uploaded image.','swatches image colors',0,0],
  ['gradient-generator','Gradient Generator','color','Design a linear or radial CSS gradient visually.','css background design',1,0],
  ['css-box-shadow-generator','CSS Box Shadow Generator','color','Design a CSS box-shadow visually and copy the code.','css design shadow',0,0],
  ['css-border-radius-generator','CSS Border Radius Generator','color','Design custom CSS border-radius corners visually.','css design rounded',0,0],
];

const TOOLS = RAW_TOOLS.map(([id,name,category,description,kw,popular,featured])=>({
  id, slug:id, name, category, description,
  keywords:(name+' '+description+' '+kw).toLowerCase(),
  popular:!!popular, featured:!!featured,
}));

const TOOL_BY_SLUG = Object.fromEntries(TOOLS.map(t=>[t.slug,t]));

function toolsInCategory(cat){ return TOOLS.filter(t=>t.category===cat); }

function relatedTools(tool, n){
  return TOOLS.filter(t=>t.category===tool.category && t.id!==tool.id)
    .sort((a,b)=>(b.popular-a.popular)||(b.featured-a.featured))
    .slice(0, n||4);
}

const SOON = new Set([
  'http-status-code-checker',
]);

function isLive(tool){ return !SOON.has(tool.id); }

const SOON_REASON = {
  'http-status-code-checker': 'Checking an arbitrary live URL requires a server-side request — a browser can\'t reliably do this itself due to cross-origin restrictions. This needs a small backend endpoint, and is the one tool on this entire platform that genuinely can\'t be done from a static, client-only page.',
};

const CAT_HOWTO = {
  pdf: ['Choose the PDF file (or files) you want to work with.','Set any options this tool needs.','Run the tool and review the result before saving.','Download the finished file to your device.'],
  image: ['Drop in or choose an image file.','Adjust the options — size, format, quality or effect.','Preview the result instantly in your browser.','Download the finished image.'],
  text: ['Paste or type your text into the box.','The result updates automatically as you type.','Copy the result or download it as a text file.'],
  dev: ['Paste your code, data or string into the input box.','Run the tool to format, validate or convert it.','Copy the result, or download it as a file.'],
  calc: ['Enter the numbers the calculation needs.','The result updates instantly as you adjust the inputs.','Copy the result for your notes, spreadsheet or report.'],
  seo: ['Fill in the fields for the page or campaign you\'re working on.','Review the generated tags, preview or file.','Copy the output into your site\'s code or CMS.'],
  finance: ['Enter your figures — cost, price, rate or amount.','Review the calculated result and supporting breakdown.','Use the number in your pricing, reporting or planning.'],
  gen: ['Set the options for what you want to generate.','Generate a new result with one click.','Copy or download the result, and generate again any time.'],
  color: ['Enter or pick a starting color, or upload an image.','Adjust the controls and watch the live preview update.','Copy the resulting color code or CSS.'],
};

const CAT_FEATURES = {
  pdf: ['Runs entirely for your file, nothing is stored longer than needed','Works on desktop and mobile browsers','No account or sign-up required'],
  image: ['Processing happens in your browser — files are never uploaded to a server','Works with JPG, PNG and WEBP','Instant preview before you download'],
  text: ['Updates live as you type, no button required for most actions','Handles large blocks of text smoothly','Copy or download the result in one click'],
  dev: ['Built for real-world formatting and encoding tasks','Clear, specific error messages when input is invalid','Copy or download output instantly'],
  calc: ['Instant results as you adjust the inputs','Sensible rounding and clear units','No spreadsheet required'],
  seo: ['Generates output ready to paste into your site or CMS','Follows current on-page SEO conventions','Free to use with no limits'],
  finance: ['Clear breakdown, not just a single number','Useful for freelancers, small businesses and quick planning','Figures update instantly as you type'],
  gen: ['Uses your browser\'s secure random number generator where relevant','Generate as many results as you like','Copy or download instantly'],
  color: ['Live visual preview as you adjust values','Outputs ready-to-use CSS or color codes','Built for designers and developers'],
};

function genHowTo(tool){ return CAT_HOWTO[tool.category] || CAT_HOWTO.text; }

function genFeatures(tool){ return CAT_FEATURES[tool.category] || CAT_FEATURES.text; }

function genFaq(tool){
  const cat = CAT_BY_KEY[tool.category];
  return [
    [`Is ${tool.name} free to use?`, `Yes. ${tool.name} is free to use with no account, sign-up or usage limit.`],
    [`Does ${tool.name} work on mobile?`, `Yes, the tool is fully responsive and works on phones, tablets and desktop browsers.`],
    isLive(tool)
      ? [`Is my data uploaded anywhere?`, tool.category==='image'||tool.category==='pdf' ? `Processing happens locally in your browser using standard web APIs — your file isn't uploaded to a server as part of this tool.` : `No. ${tool.name} runs entirely in your browser tab — nothing you type is sent anywhere.`]
      : [`When will ${tool.name} be available?`, SOON_REASON[tool.category] || SOON_REASON[tool.id] || `This tool is on the roadmap and will be enabled in an upcoming update.`],
    [`What category is ${tool.name} in?`, `${tool.name} is part of ${cat.name} — ${cat.desc.toLowerCase()}`],
  ];
}

function renderSoon(ws, tool, errored){
  const body = h('div',{class:'ws-body', style:'text-align:center;padding:52px 20px;'});
  const iconWrap = h('div',{style:`width:56px;height:56px;border-radius:14px;background:${errored?'var(--danger-soft)':'var(--accent-soft)'};color:${errored?'var(--danger)':'var(--accent-ink)'};display:flex;align-items:center;justify-content:center;margin:0 auto;`});
  const icon = h('div',{class:'soon-icon'});
  icon.innerHTML = svgIcon(errored?'empty':'soon');
  iconWrap.appendChild(icon);
  body.appendChild(iconWrap);
  if(!errored) body.appendChild(h('span',{class:'tag featured', style:'margin-top:14px;display:inline-flex;'},'On the roadmap'));
  body.appendChild(h('h3',{style:'font-family:var(--font-body);font-size:16px;margin-top:12px;'}, errored ? 'This tool hit a snag' : (tool.name+' is on its way')));
  body.appendChild(h('p',{style:'color:var(--muted);font-size:13.5px;max-width:420px;margin:8px auto 0;'},
    errored ? 'Something went wrong loading this workspace. Please try again, or pick a related tool below.' : (SOON_REASON[tool.category] || SOON_REASON[tool.id] || 'This tool is on the roadmap and isn\'t enabled yet — it is listed for transparency, not left silently broken.')));
  const actions = h('div',{style:'display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap;'});
  actions.append(
    h('a',{class:'btn btn-primary', href:'/category/'+tool.category},'Browse other '+CAT_BY_KEY[tool.category].name),
    h('a',{class:'btn btn-secondary', href:'/tools?f=popular'},'See popular tools')
  );
  body.appendChild(actions);
  ws.appendChild(body);
}

function renderCalc(ws, tool, opts){
  const toolbar = h('div',{class:'ws-toolbar'}, h('strong',null,'Enter your numbers'), h('span',{style:'font-size:12px;color:var(--muted);'},'Updates instantly'));
  const body = h('div',{class:'ws-body ws-cols'});
  const formCol = h('div');
  const resultCol = h('div');
  const inputs = {};
  opts.fields.forEach(f=>{
    if(f.type==='checkbox'){
      const field = h('div',{class:'field'});
      const wrap = h('label',{class:'checkline'});
      const input = h('input',{type:'checkbox', id:'f_'+f.id});
      if(f.default) input.checked = true;
      wrap.append(input, ' '+f.label);
      field.appendChild(wrap);
      inputs[f.id]=input; formCol.appendChild(field);
      return;
    }
    const field = h('div',{class:'field'});
    field.appendChild(h('label',{for:'f_'+f.id}, f.label));
    let input;
    if(f.type==='select'){
      input = h('select',{id:'f_'+f.id});
      f.options.forEach(([v,l])=>input.appendChild(h('option',{value:v},l)));
      if(f.default!=null) input.value = f.default;
    }else if(f.type==='textarea'){
      input = h('textarea',{id:'f_'+f.id, rows:f.rows||3, style:'font-family:var(--font-body);'});
      input.value = f.default||'';
    }else{
      input = h('input',{type:f.type||'text', id:'f_'+f.id, placeholder:f.placeholder||''});
      if(f.step) input.step = f.step;
      if(f.default!=null) input.value = f.default;
    }
    field.appendChild(input);
    if(f.hint) field.appendChild(h('div',{class:'hint'}, f.hint));
    inputs[f.id]=input; formCol.appendChild(field);
  });
  const resultBox = h('div');
  resultCol.appendChild(resultBox);
  const actions = h('div',{class:'ws-actions'});
  const copyBtn = h('button',{class:'btn btn-secondary btn-sm'},'Copy result');
  const resetBtn = h('button',{class:'btn btn-ghost btn-sm'},'Reset');
  actions.append(copyBtn, resetBtn);
  resultCol.appendChild(actions);
  body.append(formCol, resultCol);
  ws.append(toolbar, body);

  let lastText='';
  function getValues(){
    const v={};
    opts.fields.forEach(f=>{
      const el = inputs[f.id];
      if(f.type==='checkbox') v[f.id]=el.checked;
      else if(f.type==='number') v[f.id] = el.value===''? null : parseFloat(el.value);
      else v[f.id]=el.value;
    });
    return v;
  }
  function update(){
    resultBox.innerHTML='';
    let out;
    try{ out = opts.compute(getValues()); }
    catch(e){ out = {error:e.message}; }
    if(!out || out.error){
      resultBox.appendChild(h('div',{class:'error-msg'}, (out&&out.error)||'Enter valid numbers to see a result.'));
      lastText=''; return;
    }
    lastText='';
    if(out.big!=null){ resultBox.appendChild(h('div',{class:'big-result'}, out.big)); lastText += out.big; }
    if(out.stats && out.stats.length){
      const sl = h('div',{class:'stat-list'});
      out.stats.forEach(([l,v])=>sl.appendChild(h('div',{class:'item'}, h('b',null,v), h('span',null,l))));
      resultBox.appendChild(sl);
      lastText += (lastText?'\n':'') + out.stats.map(([l,v])=>l+': '+v).join('\n');
    }
    if(out.table && out.table.length){
      const t = h('table',{class:'simple', style:'margin-top:12px;'});
      const body = h('tbody');
      out.table.forEach(([l,v])=>body.appendChild(h('tr',null,h('td',null,l),h('td',{style:'text-align:right;font-weight:600;'},v))));
      t.appendChild(body);
      resultBox.appendChild(t);
    }
    if(out.note) resultBox.appendChild(h('div',{class:'callout', style:'margin-top:12px;', html: out.note}));
  }
  Object.values(inputs).forEach(inp=>{
    inp.addEventListener('input', debounce(update,80));
    inp.addEventListener('change', update);
  });
  copyBtn.onclick=()=>copyText(lastText||'Nothing to copy yet', 'Result copied');
  resetBtn.onclick=()=>{
    opts.fields.forEach(f=>{ const el=inputs[f.id]; if(f.type==='checkbox') el.checked=!!f.default; else el.value = f.default!=null?f.default:''; });
    update();
  };
  update();
  return {update, getValues, inputs};
}

function renderTextTool(ws, tool, opts){
  const toolbar = h('div',{class:'ws-toolbar'});
  toolbar.appendChild(h('strong',null, opts.toolbarLabel || 'Paste your text'));
  const optWrap = h('div',{style:'display:flex;gap:10px;flex-wrap:wrap;align-items:center;'});
  const controls = {};
  (opts.controls||[]).forEach(c=>{
    if(c.type==='select'){
      const sel = h('select',{style:'padding:6px 8px;width:auto;'});
      c.options.forEach(([v,l])=>sel.appendChild(h('option',{value:v},l)));
      if(c.default!=null) sel.value=c.default;
      controls[c.id]=sel; optWrap.appendChild(sel);
    }else if(c.type==='number'){
      const wrap = h('label',{style:'display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted);'}, c.label+':');
      const inp = h('input',{type:'number', value:c.default, style:'width:66px;padding:6px 8px;'});
      wrap.appendChild(inp); controls[c.id]=inp; optWrap.appendChild(wrap);
    }else if(c.type==='checkbox'){
      const wrap = h('label',{class:'checkline'});
      const inp = h('input',{type:'checkbox'}); if(c.default) inp.checked=true;
      wrap.append(inp, ' '+c.label); controls[c.id]=inp; optWrap.appendChild(wrap);
    }
  });
  toolbar.appendChild(optWrap);
  const body = h('div',{class:'ws-body'});
  const cols = h('div',{class:'ws-cols'});
  const inWrap = h('div');
  inWrap.appendChild(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;'}, opts.inputLabel||'Input'));
  const ta = h('textarea',{rows:12, placeholder:opts.placeholder||'Type or paste text here…'});
  if(opts.sample) ta.value = opts.sample;
  inWrap.appendChild(ta);
  const outWrap = h('div');
  outWrap.appendChild(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;'}, opts.outputLabel||'Result'));
  const outBox = h('div',{class:'result-box empty'}, opts.emptyText||'Your result will appear here.');
  outWrap.appendChild(outBox);
  cols.append(inWrap, outWrap);
  body.appendChild(cols);
  const statsWrap = h('div',{class:'stat-list', style:'margin-top:14px;'});
  if(opts.stats) body.appendChild(statsWrap);
  const actions = h('div',{class:'ws-actions'});
  const copyBtn = h('button',{class:'btn btn-secondary btn-sm'},'Copy result');
  const dlBtn = h('button',{class:'btn btn-secondary btn-sm'},'Download .txt');
  const clearBtn = h('button',{class:'btn btn-ghost btn-sm'},'Clear');
  actions.append(copyBtn, dlBtn, clearBtn);
  body.appendChild(actions);
  ws.append(toolbar, body);

  function getCtrl(){
    const v={};
    for(const k in controls){
      const el = controls[k];
      v[k] = el.type==='checkbox' ? el.checked : (el.tagName==='SELECT' ? el.value : parseFloat(el.value));
    }
    return v;
  }
  let currentOut = '';
  function run(){
    const val = ta.value;
    if(opts.stats){ statsWrap.innerHTML=''; opts.stats(val).forEach(([l,v])=>statsWrap.appendChild(h('div',{class:'item'},h('b',null,v),h('span',null,l)))); }
    if(!val){ outBox.className='result-box empty'; outBox.textContent = opts.emptyText||'Your result will appear here.'; currentOut=''; return; }
    let res;
    try{ res = opts.transform(val, getCtrl()); }
    catch(e){ outBox.className='result-box'; outBox.innerHTML=''; outBox.appendChild(h('div',{class:'error-msg'}, e.message)); currentOut=''; return; }
    outBox.className='result-box';
    outBox.textContent = res;
    currentOut = res;
  }
  ta.addEventListener('input', debounce(run,100));
  Object.values(controls).forEach(c=>c.addEventListener('input', run));
  copyBtn.onclick = ()=>copyText(currentOut||'', currentOut? 'Result copied':'Nothing to copy yet');
  dlBtn.onclick = ()=>{ if(!currentOut){ toast('Nothing to download yet'); return; } download(tool.slug+'.txt', currentOut); };
  clearBtn.onclick = ()=>{ ta.value=''; run(); ta.focus(); };
  run();
  return {run, ta, outBox};
}

function imageDropzone(container, onFile, label){
  const dz = h('div',{class:'dropzone', tabindex:'0', role:'button','aria-label':'Upload image'});
  dz.innerHTML = svgIcon('upload');
  dz.appendChild(h('div',null, label||'Click to upload or drag & drop an image'));
  const fname = h('div',{class:'fname'},'PNG, JPG or WEBP · processed locally in your browser');
  dz.appendChild(fname);
  const input = h('input',{type:'file', accept:'image/*', style:'display:none;'});
  dz.appendChild(input);
  container.appendChild(dz);
  function handle(f){
    if(!f || !f.type.startsWith('image/')){ toast('Please choose an image file'); return; }
    fname.textContent = f.name+' · '+fmtBytes(f.size);
    onFile(f);
  }
  dz.addEventListener('click', ()=>input.click());
  dz.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); input.click(); } });
  dz.addEventListener('dragover', e=>{ e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', ()=>dz.classList.remove('drag'));
  dz.addEventListener('drop', e=>{ e.preventDefault(); dz.classList.remove('drag'); if(e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); });
  input.addEventListener('change', ()=>{ if(input.files[0]) handle(input.files[0]); });
  return { dz, setLabel:t=>fname.textContent=t };
}

// Batch variant of imageDropzone: accepts multiple files (click-select or
// drag-drop) and hands the whole list to onFiles at once, so tools that
// apply the same operation to many images (resize, compress, convert...)
// can process a batch in one pass instead of one file at a time.
function imageMultiDropzone(container, onFiles, label){
  const dz = h('div',{class:'dropzone', tabindex:'0', role:'button','aria-label':'Upload images'});
  dz.innerHTML = svgIcon('upload');
  dz.appendChild(h('div',null, label||'Click to upload or drag & drop images'));
  const fname = h('div',{class:'fname'},'PNG, JPG or WEBP · multiple files supported · processed locally in your browser');
  dz.appendChild(fname);
  const input = h('input',{type:'file', accept:'image/*', multiple:true, style:'display:none;'});
  dz.appendChild(input);
  container.appendChild(dz);
  function handle(fileList){
    const files = Array.from(fileList||[]).filter(f=>f && f.type.startsWith('image/'));
    if(!files.length){ toast('Please choose one or more image files'); return; }
    fname.textContent = files.length===1 ? (files[0].name+' · '+fmtBytes(files[0].size)) : (files.length+' images selected');
    onFiles(files);
  }
  dz.addEventListener('click', ()=>input.click());
  dz.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); input.click(); } });
  dz.addEventListener('dragover', e=>{ e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', ()=>dz.classList.remove('drag'));
  dz.addEventListener('drop', e=>{ e.preventDefault(); dz.classList.remove('drag'); handle(e.dataTransfer.files); });
  input.addEventListener('change', ()=>handle(input.files));
  return { dz, setLabel:t=>fname.textContent=t };
}

function loadImageFile(file){
  return new Promise((resolve, reject)=>{
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>resolve({ img, url, size:file.size, type:file.type, name:file.name });
    img.onerror = ()=>reject(new Error('Could not read that image file.'));
    img.src = url;
  });
}

function numField(label, value, min, max, step){
  const wrap = h('label',{style:'display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--muted);font-weight:600;'}, label);
  const inp = h('input',{type:'number', value, min, max, step:step||1, style:'padding:7px 9px;'});
  wrap.appendChild(inp);
  return {wrap, inp};
}

function selectField(label, options, value){
  const wrap = h('label',{style:'display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--muted);font-weight:600;'}, label);
  const sel = h('select',{style:'padding:7px 9px;'});
  options.forEach(([v,l])=>sel.appendChild(h('option',{value:v},l)));
  if(value!=null) sel.value=value;
  wrap.appendChild(sel);
  return {wrap, sel};
}

function checkField(label, checked){
  const wrap = h('label',{class:'checkline', style:'margin-top:22px;'});
  const inp = h('input',{type:'checkbox'}); if(checked) inp.checked=true;
  wrap.append(inp, ' '+label);
  return {wrap, inp};
}

function controlsRow(...items){ const row=h('div',{class:'field-row'}); items.forEach(i=>row.appendChild(i.wrap||i)); return row; }

const PLATFORM_META = {
  Google:        { bg:'#ffffff', fg:'#4285F4', glyph:'G', border:true },
  YouTube:       { bg:'#FF0000', fg:'#ffffff', glyph:'▶' },
  Bing:          { bg:'linear-gradient(135deg,#00809D,#3B4371)', fg:'#ffffff', glyph:'b' },
  Amazon:        { bg:'#000000', fg:'#FF9900', glyph:'a' },
  eBay:          { bg:'#ffffff', fg:'#E53238', glyph:'e', border:true },
  'App Store':   { bg:'#000000', fg:'#ffffff', glyph:'A' },
  'Google Play': { bg:'#ffffff', fg:'#00C853', glyph:'▷', border:true },
  Instagram:     { bg:'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF,#515BD4)', fg:'#ffffff', glyph:'◎' },
  'X / Twitter': { bg:'#000000', fg:'#ffffff', glyph:'X' },
  Reddit:        { bg:'#FF4500', fg:'#ffffff', glyph:'r' },
  Pinterest:     { bg:'#E60023', fg:'#ffffff', glyph:'P' },
  Etsy:          { bg:'#F1641E', fg:'#ffffff', glyph:'E' },
  TikTok:        { bg:'#000000', fg:'#ffffff', glyph:'♪' },
  Naver:         { bg:'#03C75A', fg:'#ffffff', glyph:'N' },
  Trends:        { bg:'linear-gradient(135deg,#4285F4,#EA4335,#FBBC05,#34A853)', fg:'#ffffff', glyph:'↗' },
};

const KW_LANGS = {
  en: { label:'English', questions:['what','why','how','when','where','who','which','can','does','is','will','should'], prepositions:['for','with','without','near','to','like','versus','under','over'] },
  ur: { label:'اردو (Roman Urdu)', questions:['kya','kyun','kaise','kab','kahan','kaun','konsa','kya kar sakta hai','best'], prepositions:['ke liye','ke sath','ke bina','ke qareeb','jaisa','ke muqable mein'] },
  es: { label:'Español', questions:['qué','por qué','cómo','cuándo','dónde','quién','cuál','puede','es'], prepositions:['para','con','sin','cerca de','como','versus'] },
};

const KW_COUNTRIES = {
  global: { label:'Global / Worldwide', mods:[] },
  pk: { label:'Pakistan', mods:['price in Pakistan','near me','in Karachi','in Lahore'] },
  us: { label:'United States', mods:['near me','price in USD','in USA'] },
  gb: { label:'United Kingdom', mods:['near me','price in GBP','in UK'] },
  in: { label:'India', mods:['price in India','near me','in Delhi'] },
  ae: { label:'UAE', mods:['price in Dubai','near me','in UAE'] },
};

function loadCdnScript(src){
  return new Promise((resolve,reject)=>{
    if(document.querySelector(`script[src="${src}"]`)){ resolve(); return; }
    const s=document.createElement('script'); s.src=src; s.onload=resolve; s.onerror=()=>reject(new Error('Could not load a required library from cdnjs.'));
    document.head.appendChild(s);
  });
}

export {
  qs,
  qsa,
  h,
  esc,
  debounce,
  slugify,
  download,
  toast,
  copyText,
  fmtBytes,
  fmtNum,
  clamp,
  svgIcon,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  CATEGORIES,
  CAT_BY_KEY,
  RAW_TOOLS,
  TOOLS,
  TOOL_BY_SLUG,
  toolsInCategory,
  relatedTools,
  SOON,
  isLive,
  SOON_REASON,
  CAT_HOWTO,
  CAT_FEATURES,
  genHowTo,
  genFeatures,
  genFaq,
  renderSoon,
  renderCalc,
  renderTextTool,
  imageDropzone,
  imageMultiDropzone,
  loadImageFile,
  numField,
  selectField,
  checkField,
  controlsRow,
  PLATFORM_META,
  KW_LANGS,
  KW_COUNTRIES,
  loadCdnScript,
};
