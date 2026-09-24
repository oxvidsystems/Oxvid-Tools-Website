/* Toolworks engine — 145 client-side tool implementations, extracted
   verbatim from the original single-file site. Framework-agnostic:
   these functions take a plain DOM container element and mount
   themselves imperatively (canvas ops, PDF processing via pdf-lib/
   pdf.js loaded on demand, text/JSON/hash utilities, calculators).
   React only owns the app shell and pages; ToolWorkspace.jsx mounts
   these into a ref. Behavior is unchanged from the original file. */

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

/* ---------------------------------------------------------------------
   1. Color math
--------------------------------------------------------------------- */
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
function relLuminance({r,g,b}){
  const f = v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);
}
function contrastRatio(hexA, hexB){
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  if(!a||!b) return null;
  const la = relLuminance(a)+0.05, lb = relLuminance(b)+0.05;
  return la>lb ? la/lb : lb/la;
}

/* ---------------------------------------------------------------------
   2. Hashing (SHA via SubtleCrypto, MD5 pure-JS fallback)
--------------------------------------------------------------------- */
async function shaHash(algo, text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function md5(str){
  function rl(n,c){ return (n<<c)|(n>>>(32-c)); }
  function ff(a,b,c,d,x,s,t){ return rl((a+((b&c)|(~b&d))+x+t)|0,s)+b|0; }
  function gg(a,b,c,d,x,s,t){ return rl((a+((b&d)|(c&~d))+x+t)|0,s)+b|0; }
  function hh(a,b,c,d,x,s,t){ return rl((a+(b^c^d)+x+t)|0,s)+b|0; }
  function ii(a,b,c,d,x,s,t){ return rl((a+(c^(b|~d))+x+t)|0,s)+b|0; }
  function toWords(s){
    const bytes = new TextEncoder().encode(s);
    const n = ((bytes.length+8>>6)+1)*16;
    const words = new Array(n).fill(0);
    for(let i=0;i<bytes.length;i++) words[i>>2] |= bytes[i] << ((i%4)*8);
    words[bytes.length>>2] |= 0x80 << ((bytes.length%4)*8);
    words[n-2] = bytes.length*8;
    return words;
  }
  const x = toWords(str);
  let a=1732584193,b=-271733879,c=-1732584194,d=271733878;
  const K=[3614090360,3905402710,606105819,3250441966,4118548399,1200080426,2821735955,4249261313,1770035416,2336552879,4294925233,2304563134,1804603682,4254626195,2792965006,1236535329,4129170786,3225465664,643717713,3921069994,3593408605,38016083,3634488961,3889429448,568446438,3275163606,4107603335,1163531501,2850285829,4243563512,1735328473,2368359562,4294588738,2272392833,1839030562,4259657740,2763975236,1272893353,4139469664,3200236656,681279174,3936430074,3572445317,76029189,3654602809,3873151461,530742520,3299628645,4096336452,1126891415,2878612391,4237533241,1700485571,2399980690,4293915773,2240044497,1873313359,4264355552,2734768916,1309151649,4149444226,3174756917,718787259,3951481745];
  const S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  for(let i=0;i<x.length;i+=16){
    let A=a,B=b,C=c,D=d;
    for(let j=0;j<64;j++){
      let f,g;
      if(j<16){ f=(B&C)|(~B&D); g=j; }
      else if(j<32){ f=(D&B)|(~D&C); g=(5*j+1)%16; }
      else if(j<48){ f=B^C^D; g=(3*j+5)%16; }
      else { f=C^(B|~D); g=(7*j)%16; }
      const tmp=D; D=C; C=B;
      B = (B + rl((A+f+K[j]+(x[i+g]|0))|0, S[j]))|0;
      A = tmp;
    }
    a=(a+A)|0; b=(b+B)|0; c=(c+C)|0; d=(d+D)|0;
  }
  function toHex(n){
    let s='';
    for(let i=0;i<4;i++) s += ((n>>(i*8))&255).toString(16).padStart(2,'0');
    return s;
  }
  return toHex(a)+toHex(b)+toHex(c)+toHex(d);
}

/* ---------------------------------------------------------------------
   3. Category + Tool registry
   Note on duplicates: the original 150-item concept brief lists a few
   tools twice under different categories (UUID Generator, Lorem Ipsum
   Generator, Gradient Generator, Slug Generator, Word Counter). Each of
   those is implemented once, at a single canonical URL, and cross-tagged
   with keywords from the other category so search still surfaces it —
   per "the registry should prevent accidental duplicate tool records."
   That brings the live registry to 146 unique tool records.
--------------------------------------------------------------------- */
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

// [id, name, category, description, extraKeywords, popular, featured]
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

/* ---------------------------------------------------------------------
   4. Live status — every tool NOT in this "coming soon" list has a real,
   working implementation below. Nothing here fakes a result.
--------------------------------------------------------------------- */
const SOON = new Set([
  'http-status-code-checker',
]);
function isLive(tool){ return !SOON.has(tool.id); }
const SOON_REASON = {
  'http-status-code-checker': 'Checking an arbitrary live URL requires a server-side request — a browser can\'t reliably do this itself due to cross-origin restrictions. This needs a small backend endpoint, and is the one tool on this entire platform that genuinely can\'t be done from a static, client-only page.',
};

/* ---------------------------------------------------------------------
   5. Generic how-to / FAQ copy (per-category templates + per-tool
   overrides for the higher-traffic tools). Keeps every tool page
   genuinely informative without 146 bespoke essays.
--------------------------------------------------------------------- */
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
    h('a',{class:'btn btn-primary', href:'#/category/'+tool.category},'Browse other '+CAT_BY_KEY[tool.category].name),
    h('a',{class:'btn btn-secondary', href:'#/tools?f=popular'},'See popular tools')
  );
  body.appendChild(actions);
  ws.appendChild(body);
}

/* =========================================================================
   10. WORKSPACE ENGINES — shared, reusable UI patterns
   ========================================================================= */

/* ---- 10a. Generic calculator/form engine (Calculators, Finance, some SEO/Gen) */
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

/* ---- 10b. Generic text-in / text-out engine (Text, most Dev tools) */
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

/* ---- 10c. Image engine — canvas-based, no external libraries needed */
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
function loadImageFile(file){
  return new Promise((resolve, reject)=>{
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>resolve({ img, url, size:file.size, type:file.type, name:file.name });
    img.onerror = ()=>reject(new Error('Could not read that image file.'));
    img.src = url;
  });
}
function previewCanvas(container){
  const box = h('div',{style:'margin-top:16px;border:1px solid var(--line);border-radius:8px;background:repeating-conic-gradient(var(--paper) 0% 25%, var(--panel) 0% 50%) 0 0/16px 16px;display:flex;align-items:center;justify-content:center;padding:12px;min-height:140px;overflow:auto;'});
  const canvas = h('canvas',{style:'max-width:100%;max-height:420px;display:block;'});
  box.appendChild(canvas);
  container.appendChild(box);
  return canvas;
}
function suggestExt(mime){ return {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[mime] || 'png'; }

function renderImageTool(ws, tool, cfg){
  // cfg: { dropLabel, setup(host, state, rerun) -> getOpts fn, process(state, opts, canvas) -> {stats, mime, quality} }
  const toolbar = h('div',{class:'ws-toolbar'}, h('strong',null,'Image workspace'), h('span',{style:'font-size:12px;color:var(--muted);'},'Processed locally in your browser'));
  const body = h('div',{class:'ws-body'});
  ws.append(toolbar, body);
  const uploadWrap = h('div');
  body.appendChild(uploadWrap);
  imageDropzone(uploadWrap, onFile, cfg.dropLabel);

  let state = null, getOpts = ()=>({});
  const controlsHost = h('div',{style:'margin-top:16px;display:none;'});
  const previewHost = h('div');
  let canvasBox = null;
  const statsWrap = h('div',{class:'stat-list', style:'margin-top:14px;display:none;'});
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const dlBtn = h('button',{class:'btn btn-primary btn-sm'},'Download result');
  const resetBtn = h('button',{class:'btn btn-ghost btn-sm'},'Choose another image');
  actions.append(dlBtn, resetBtn);
  body.append(controlsHost, previewHost, statsWrap, actions);

  function onFile(file){
    loadImageFile(file).then(res=>{
      state = res;
      controlsHost.innerHTML=''; controlsHost.style.display='block';
      previewHost.innerHTML='';
      canvasBox = previewCanvas(previewHost);
      getOpts = cfg.setup(controlsHost, state, rerun) || (()=>({}));
      actions.style.display='flex';
      rerun();
    }).catch(e=>toast(e.message));
  }
  let lastBlob=null, lastMime='image/png', lastExt='png';
  function rerun(){
    if(!state || !canvasBox) return;
    const opts = getOpts();
    const out = cfg.process(state, opts, canvasBox) || {};
    statsWrap.innerHTML=''; statsWrap.style.display='none';
    if(out.stats && out.stats.length){ statsWrap.style.display='grid'; out.stats.forEach(([l,v])=>statsWrap.appendChild(h('div',{class:'item'},h('b',null,v),h('span',null,l)))); }
    const mime = out.mime || 'image/png';
    const quality = out.quality!=null ? out.quality : 0.92;
    canvasBox.toBlob(blob=>{
      if(!blob) return;
      lastBlob = blob; lastMime = mime; lastExt = suggestExt(mime);
      if(out.onBlob) out.onBlob(blob);
    }, mime, quality);
  }
  dlBtn.onclick = ()=>{
    if(!lastBlob){ toast('Nothing to download yet'); return; }
    download(tool.slug+'-result.'+lastExt, lastBlob, lastMime);
  };
  resetBtn.onclick = ()=>{
    state=null; controlsHost.style.display='none'; controlsHost.innerHTML='';
    previewHost.innerHTML=''; canvasBox=null;
    statsWrap.style.display='none'; actions.style.display='none';
  };
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
function drawFit(canvas, img, w, h){ canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,w,h); return ctx; }

/* ---- Image tool definitions (20 tools, all canvas-based) ---- */
function imgResize(ws,tool){ renderImageTool(ws,tool,{
  setup(host,state,rerun){
    const ratio = state.img.naturalWidth/state.img.naturalHeight;
    const wF=numField('Width (px)', state.img.naturalWidth,1,8000);
    const hF=numField('Height (px)', state.img.naturalHeight,1,8000);
    const lockF=checkField('Lock aspect ratio', true);
    host.appendChild(controlsRow(wF,hF,lockF));
    wF.inp.addEventListener('input',()=>{ if(lockF.inp.checked) hF.inp.value=Math.max(1,Math.round(wF.inp.value/ratio)); rerun(); });
    hF.inp.addEventListener('input',()=>{ if(lockF.inp.checked) wF.inp.value=Math.max(1,Math.round(hF.inp.value*ratio)); rerun(); });
    return ()=>({ w:parseInt(wF.inp.value)||state.img.naturalWidth, h:parseInt(hF.inp.value)||state.img.naturalHeight });
  },
  process(state,opts,canvas){
    const ctx=drawFit(canvas, state.img, opts.w, opts.h);
    ctx.drawImage(state.img,0,0,opts.w,opts.h);
    return { stats:[['New size', opts.w+'×'+opts.h],['Original', state.img.naturalWidth+'×'+state.img.naturalHeight]], mime:'image/png' };
  }
});}
function imgCrop(ws,tool){ renderImageTool(ws,tool,{
  setup(host,state,rerun){
    const nw=state.img.naturalWidth, nh=state.img.naturalHeight;
    const xF=numField('X',0,0,nw), yF=numField('Y',0,0,nh);
    const wF=numField('Width', nw,1,nw), hF=numField('Height', nh,1,nh);
    host.appendChild(controlsRow(xF,yF,wF,hF));
    [xF,yF,wF,hF].forEach(f=>f.inp.addEventListener('input', debounce(rerun,80)));
    return ()=>({ x:clamp(parseInt(xF.inp.value)||0,0,nw-1), y:clamp(parseInt(yF.inp.value)||0,0,nh-1), w:clamp(parseInt(wF.inp.value)||nw,1,nw), h:clamp(parseInt(hF.inp.value)||nh,1,nh) });
  },
  process(state,opts,canvas){
    const w=Math.min(opts.w, state.img.naturalWidth-opts.x), h=Math.min(opts.h, state.img.naturalHeight-opts.y);
    const ctx=drawFit(canvas,state.img,w,h);
    ctx.drawImage(state.img, opts.x,opts.y,w,h, 0,0,w,h);
    return { stats:[['Cropped size', w+'×'+h]], mime:'image/png' };
  }
});}
function imgRotate(ws,tool){ renderImageTool(ws,tool,{
  setup(host,state,rerun){
    const angF=selectField('Rotate', [['90','90° clockwise'],['180','180°'],['270','270° clockwise'],['custom','Custom angle']], '90');
    const customF=numField('Custom angle (°)', 45, -360,360);
    customF.wrap.style.display='none';
    host.appendChild(controlsRow(angF,customF));
    angF.sel.addEventListener('change',()=>{ customF.wrap.style.display = angF.sel.value==='custom'?'flex':'none'; rerun(); });
    customF.inp.addEventListener('input', debounce(rerun,80));
    return ()=>({ angle: angF.sel.value==='custom' ? (parseFloat(customF.inp.value)||0) : parseInt(angF.sel.value) });
  },
  process(state,opts,canvas){
    const rad = opts.angle*Math.PI/180;
    const iw=state.img.naturalWidth, ih=state.img.naturalHeight;
    const nw = Math.round(Math.abs(iw*Math.cos(rad))+Math.abs(ih*Math.sin(rad)));
    const nh = Math.round(Math.abs(iw*Math.sin(rad))+Math.abs(ih*Math.cos(rad)));
    const ctx=drawFit(canvas,state.img,nw,nh);
    ctx.translate(nw/2, nh/2); ctx.rotate(rad); ctx.drawImage(state.img,-iw/2,-ih/2);
    return { stats:[['Angle', opts.angle+'°'],['New size', nw+'×'+nh]], mime:'image/png' };
  }
});}
function imgFlip(ws,tool){ renderImageTool(ws,tool,{
  setup(host,state,rerun){
    const dirF=selectField('Flip direction', [['h','Horizontal (mirror)'],['v','Vertical (upside down)']], 'h');
    host.appendChild(controlsRow(dirF));
    dirF.sel.addEventListener('change',rerun);
    return ()=>({dir:dirF.sel.value});
  },
  process(state,opts,canvas){
    const iw=state.img.naturalWidth, ih=state.img.naturalHeight;
    const ctx=drawFit(canvas,state.img,iw,ih);
    ctx.save();
    if(opts.dir==='h'){ ctx.translate(iw,0); ctx.scale(-1,1); } else { ctx.translate(0,ih); ctx.scale(1,-1); }
    ctx.drawImage(state.img,0,0);
    ctx.restore();
    return { mime:'image/png' };
  }
});}
function imgConvertMaker(fixedFormat){ return function(ws,tool){ renderImageTool(ws,tool,{
  setup(host,state,rerun){
    let fmtSel;
    const qF=numField('Quality (0.1–1)', 0.92, 0.1, 1, 0.01);
    if(fixedFormat){
      host.appendChild(h('p',{class:'hint', style:'margin-bottom:10px;'}, 'Converting to '+fixedFormat.toUpperCase()+'.'));
    } else {
      const fmtF=selectField('Output format', [['image/png','PNG'],['image/jpeg','JPG'],['image/webp','WEBP']], 'image/png');
      fmtSel=fmtF.sel; host.appendChild(controlsRow(fmtF));
      fmtSel.addEventListener('change', ()=>{ qF.wrap.style.display = fmtSel.value==='image/png' ? 'none':'flex'; rerun(); });
    }
    host.appendChild(controlsRow(qF));
    qF.inp.addEventListener('input', debounce(rerun,80));
    const mimeMap={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'};
    return ()=>({ mime: fixedFormat ? mimeMap[fixedFormat] : fmtSel.value, quality: parseFloat(qF.inp.value)||0.92 });
  },
  process(state,opts,canvas){
    const iw=state.img.naturalWidth, ih=state.img.naturalHeight;
    const ctx=drawFit(canvas,state.img,iw,ih);
    if(opts.mime==='image/jpeg'){ ctx.fillStyle='#fff'; ctx.fillRect(0,0,iw,ih); }
    ctx.drawImage(state.img,0,0);
    return { mime:opts.mime, quality:opts.quality, stats:[['Output format', opts.mime.split('/')[1].toUpperCase()]] };
  }
});};}
function imgCompress(ws,tool){ renderImageTool(ws,tool,{
  setup(host,state,rerun){
    const fmtF=selectField('Format', [['image/jpeg','JPG'],['image/webp','WEBP']], 'image/jpeg');
    const qF=numField('Quality', 0.7, 0.05, 1, 0.05);
    host.appendChild(controlsRow(fmtF,qF));
    fmtF.sel.addEventListener('change',rerun);
    qF.inp.addEventListener('input', debounce(rerun,80));
    return ()=>({ mime:fmtF.sel.value, quality:parseFloat(qF.inp.value)||0.7 });
  },
  process(state,opts,canvas){
    const iw=state.img.naturalWidth, ih=state.img.naturalHeight;
    const ctx=drawFit(canvas,state.img,iw,ih);
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,iw,ih);
    ctx.drawImage(state.img,0,0);
    return { mime:opts.mime, quality:opts.quality, stats:[['Original size', fmtBytes(state.size)],['Quality', Math.round(opts.quality*100)+'%']] };
  }
});}
function imgToBase64(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Upload an image to encode'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const uploadWrap=h('div'); body.appendChild(uploadWrap);
  const outWrap=h('div',{style:'margin-top:16px;display:none;'});
  const ta=h('textarea',{rows:10, readonly:true, style:'font-size:12px;'});
  outWrap.append(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;'},'Base64 data URI'), ta);
  const actions=h('div',{class:'ws-actions'});
  const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy data URI');
  const dlBtn=h('button',{class:'btn btn-secondary btn-sm'},'Download .txt');
  actions.append(copyBtn,dlBtn);
  outWrap.appendChild(actions);
  body.appendChild(outWrap);
  imageDropzone(uploadWrap, file=>{
    const reader=new FileReader();
    reader.onload=()=>{ ta.value=reader.result; outWrap.style.display='block'; };
    reader.readAsDataURL(file);
  });
  copyBtn.onclick=()=>copyText(ta.value,'Data URI copied');
  dlBtn.onclick=()=>{ if(!ta.value){toast('Nothing to download yet');return;} download(tool.slug+'.txt', ta.value); };
}
function base64ToImage(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Paste a Base64 image string'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const ta=h('textarea',{rows:6, placeholder:'data:image/png;base64,… or a raw base64 string'});
  body.appendChild(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;'},'Base64 input'));
  body.appendChild(ta);
  const previewHost=h('div',{style:'margin-top:14px;'}); body.appendChild(previewHost);
  const actions=h('div',{class:'ws-actions'});
  const dlBtn=h('button',{class:'btn btn-primary btn-sm', disabled:true},'Download image');
  actions.appendChild(dlBtn); body.appendChild(actions);
  let currentUrl=null, currentExt='png';
  function run(){
    previewHost.innerHTML='';
    let val=ta.value.trim();
    if(!val){ dlBtn.disabled=true; return; }
    if(!val.startsWith('data:')) val = 'data:image/png;base64,'+val;
    const m = val.match(/^data:image\/(\w+);base64,/);
    if(!m){ previewHost.appendChild(h('div',{class:'error-msg'},'That doesn\'t look like a valid image data URI.')); dlBtn.disabled=true; return; }
    const img=new Image();
    img.onload=()=>{ img.style.maxWidth='100%'; img.style.borderRadius='8px'; img.style.border='1px solid var(--line)'; previewHost.appendChild(img); currentUrl=val; currentExt=m[1]==='jpeg'?'jpg':m[1]; dlBtn.disabled=false; };
    img.onerror=()=>{ previewHost.appendChild(h('div',{class:'error-msg'},'Could not decode this string as an image.')); dlBtn.disabled=true; };
    img.src=val;
  }
  ta.addEventListener('input', debounce(run,150));
  dlBtn.onclick=()=>{ if(!currentUrl) return; const a=document.createElement('a'); a.href=currentUrl; a.download='image.'+currentExt; a.click(); };
}
function imgGrayscale(ws,tool){ renderImageTool(ws,tool,{
  setup(){ return ()=>({}); },
  process(state,opts,canvas){
    const iw=state.img.naturalWidth, ih=state.img.naturalHeight;
    const ctx=drawFit(canvas,state.img,iw,ih);
    ctx.drawImage(state.img,0,0);
    const data=ctx.getImageData(0,0,iw,ih);
    const d=data.data;
    for(let i=0;i<d.length;i+=4){ const g=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; d[i]=d[i+1]=d[i+2]=g; }
    ctx.putImageData(data,0,0);
    return { mime:'image/png' };
  }
});}
function imgBlur(ws,tool){ renderImageTool(ws,tool,{
  setup(host,state,rerun){
    const bF=numField('Blur radius (px)', 4, 0, 40, 1);
    host.appendChild(controlsRow(bF));
    bF.inp.addEventListener('input', debounce(rerun,80));
    return ()=>({ radius: parseFloat(bF.inp.value)||0 });
  },
  process(state,opts,canvas){
    const iw=state.img.naturalWidth, ih=state.img.naturalHeight;
    const ctx=drawFit(canvas,state.img,iw,ih);
    ctx.filter = opts.radius>0 ? ('blur('+opts.radius+'px)') : 'none';
    ctx.drawImage(state.img,0,0);
    ctx.filter='none';
    return { mime:'image/png', stats:[['Blur radius', opts.radius+'px']] };
  }
});}
function imgPixelate(ws,tool){ renderImageTool(ws,tool,{
  setup(host,state,rerun){
    const bF=numField('Block size (px)', 12, 2, 100, 1);
    host.appendChild(controlsRow(bF));
    bF.inp.addEventListener('input', debounce(rerun,80));
    return ()=>({ block: parseInt(bF.inp.value)||12 });
  },
  process(state,opts,canvas){
    const iw=state.img.naturalWidth, ih=state.img.naturalHeight;
    const small=document.createElement('canvas');
    const sw=Math.max(1,Math.round(iw/opts.block)), sh=Math.max(1,Math.round(ih/opts.block));
    small.width=sw; small.height=sh;
    small.getContext('2d').drawImage(state.img,0,0,sw,sh);
    const ctx=drawFit(canvas,state.img,iw,ih);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(small,0,0,sw,sh,0,0,iw,ih);
    return { mime:'image/png', stats:[['Block size', opts.block+'px']] };
  }
});}
function imgDimensions(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Upload an image to inspect'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const uploadWrap=h('div'); body.appendChild(uploadWrap);
  const statsWrap=h('div',{class:'stat-list', style:'margin-top:16px;display:none;'}); body.appendChild(statsWrap);
  imageDropzone(uploadWrap, file=>{
    loadImageFile(file).then(({img,size})=>{
      const gcdFn=(a,b)=>b?gcdFn(b,a%b):a;
      const g=gcdFn(img.naturalWidth,img.naturalHeight)||1;
      statsWrap.style.display='grid'; statsWrap.innerHTML='';
      [['Width', img.naturalWidth+' px'],['Height', img.naturalHeight+' px'],['Aspect ratio', (img.naturalWidth/g)+':'+(img.naturalHeight/g)],['File size', fmtBytes(size)]]
        .forEach(([l,v])=>statsWrap.appendChild(h('div',{class:'item'},h('b',null,v),h('span',null,l))));
    });
  });
}
function imgQualityAnalyzer(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Upload an image to analyze'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const uploadWrap=h('div'); body.appendChild(uploadWrap);
  const statsWrap=h('div',{class:'stat-list', style:'margin-top:16px;display:none;'}); body.appendChild(statsWrap);
  const note=h('div',{class:'callout', style:'margin-top:14px;display:none;'});
  body.appendChild(note);
  imageDropzone(uploadWrap, file=>{
    loadImageFile(file).then(({img,size})=>{
      const px = img.naturalWidth*img.naturalHeight;
      const bpp = px>0 ? Number((size*8/px).toFixed(2)) : 0;
      statsWrap.style.display='grid'; statsWrap.innerHTML='';
      [['Resolution', img.naturalWidth+'×'+img.naturalHeight],['Megapixels', (px/1e6).toFixed(2)+' MP'],['File size', fmtBytes(size)],['Bits per pixel', bpp]]
        .forEach(([l,v])=>statsWrap.appendChild(h('div',{class:'item'},h('b',null,v),h('span',null,l))));
      note.style.display='block';
      note.textContent = bpp>24 ? 'High bits-per-pixel — this file is likely larger than it needs to be for web use. Try Image Compress.' : 'This looks like a reasonably efficient encode for its resolution.';
    });
  });
}
function faviconGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Upload a square-ish source image'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const uploadWrap=h('div'); body.appendChild(uploadWrap);
  const grid=h('div',{class:'tool-grid', style:'margin-top:16px;'}); body.appendChild(grid);
  const sizes=[16,32,48,180,192,512];
  imageDropzone(uploadWrap, file=>{
    loadImageFile(file).then(({img})=>{
      grid.innerHTML='';
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx=(img.naturalWidth-side)/2, sy=(img.naturalHeight-side)/2;
      sizes.forEach(sz=>{
        const c=document.createElement('canvas'); c.width=sz; c.height=sz;
        const ctx=c.getContext('2d'); ctx.drawImage(img, sx,sy,side,side, 0,0,sz,sz);
        const card=h('div',{class:'card', style:'padding:14px;text-align:center;'});
        c.style.width='64px'; c.style.height='64px'; c.style.borderRadius='6px'; c.style.margin='0 auto 10px';
        card.appendChild(c);
        card.appendChild(h('div',{style:'font-size:12.5px;color:var(--muted);margin-bottom:8px;'}, sz+'×'+sz+' px'));
        const btn=h('button',{class:'btn btn-secondary btn-sm'},'Download PNG');
        btn.onclick=()=>c.toBlob(b=>download('favicon-'+sz+'.png', b, 'image/png'), 'image/png');
        card.appendChild(btn);
        grid.appendChild(card);
      });
    });
  });
}
// (image tool implementations continue below in a flatter, easier-to-audit style)

/* ---- Developer Tools (20 tools) ---- */
function basicIndent(str, openers, closers){
  // generic bracket-based indenter used for CSS/JS light-formatting
  let depth=0, out='', i=0;
  const n=str.length;
  let result='';
  for(let ch of str){
    if(closers.includes(ch)){ depth=Math.max(0,depth-1); result+='\n'+'  '.repeat(depth)+ch; }
    else if(openers.includes(ch)){ result+=ch+'\n'+'  '.repeat(depth+1); depth++; }
    else if(ch===';'){ result+=ch+'\n'+'  '.repeat(depth); }
    else result+=ch;
  }
  return result.split('\n').map(l=>l.trim()).filter((l,idx,arr)=>l!=='' || (idx>0 && arr[idx-1]!=='')).join('\n');
}
function jsonFormatter(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'{"paste":"your JSON here"}',
  outputLabel:'Formatted JSON',
  controls:[{id:'indent', type:'select', label:'Indent', options:[['2','2 spaces'],['4','4 spaces'],['tab','Tab']], default:'2'}],
  transform(v,opts){ const obj=JSON.parse(v); const ind = opts.indent==='tab' ? '\t' : Number(opts.indent); return JSON.stringify(obj, null, ind); }
});}
function jsonValidator(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'{"paste":"your JSON here"}', outputLabel:'Validation result',
  transform(v){ try{ JSON.parse(v); return '✓ Valid JSON.'; }catch(e){ return '✗ Invalid JSON — '+e.message; } }
});}
function jsonMinifier(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'{"paste":"your JSON here"}', outputLabel:'Minified JSON',
  stats:(v)=>{ try{ const min=JSON.stringify(JSON.parse(v)); return [['Original', v.length+' chars'],['Minified', min.length+' chars'],['Saved', Math.max(0,Math.round((1-min.length/v.length)*100))+'%']]; }catch(e){ return [['Original', v.length+' chars']]; } },
  transform(v){ return JSON.stringify(JSON.parse(v)); }
});}
function xmlFormatter(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'<root><item>value</item></root>', outputLabel:'Formatted XML',
  transform(v){
    const doc = new DOMParser().parseFromString(v,'application/xml');
    if(doc.querySelector('parsererror')) throw new Error('That XML is not well-formed.');
    let depth=0; let out='';
    const serializer = new XMLSerializer();
    function walk(node){
      if(node.nodeType===3){ const t=node.textContent.trim(); if(t) out += '  '.repeat(depth)+t+'\n'; return; }
      if(node.nodeType!==1) return;
      const attrs = Array.from(node.attributes||[]).map(a=>` ${a.name}="${a.value}"`).join('');
      const hasElementChildren = Array.from(node.childNodes).some(c=>c.nodeType===1);
      if(!hasElementChildren){
        out += '  '.repeat(depth)+`<${node.tagName}${attrs}>${node.textContent}</${node.tagName}>\n`;
      }else{
        out += '  '.repeat(depth)+`<${node.tagName}${attrs}>\n`;
        depth++;
        Array.from(node.childNodes).forEach(walk);
        depth--;
        out += '  '.repeat(depth)+`</${node.tagName}>\n`;
      }
    }
    Array.from(doc.childNodes).forEach(walk);
    return out.trim();
  }
});}
function xmlValidator(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'<root><item>value</item></root>', outputLabel:'Validation result',
  transform(v){
    const doc = new DOMParser().parseFromString(v,'application/xml');
    const err = doc.querySelector('parsererror');
    return err ? '✗ Not well-formed — '+err.textContent.split('\n')[0] : '✓ Well-formed XML.';
  }
});}
function htmlFormatter(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'<div><p>Hello</p></div>', outputLabel:'Formatted HTML',
  transform(v){
    let depth=0; const voidTags=new Set(['br','hr','img','input','meta','link']);
    const tokens = v.replace(/>\s+</g,'><').match(/<[^>]+>|[^<]+/g)||[];
    let out=[];
    tokens.forEach(tok=>{
      if(tok.startsWith('</')){ depth=Math.max(0,depth-1); out.push('  '.repeat(depth)+tok); }
      else if(tok.startsWith('<')){
        const tagMatch = tok.match(/^<([a-zA-Z0-9]+)/);
        const tag = tagMatch?tagMatch[1].toLowerCase():'';
        const selfClose = tok.endsWith('/>') || voidTags.has(tag);
        out.push('  '.repeat(depth)+tok);
        if(!selfClose) depth++;
      } else {
        const t = tok.trim();
        if(t) out.push('  '.repeat(depth)+t);
      }
    });
    return out.join('\n');
  }
});}
function cssFormatter(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'.a{color:red;margin:0}', outputLabel:'Formatted CSS',
  transform(v){
    return v.replace(/\s*{\s*/g,' {\n  ').replace(/;\s*/g,';\n  ').replace(/\s*}\s*/g,'\n}\n')
      .split('\n').map(l=>l.trim()).filter(Boolean).map(l=>l==='}'?l:(l.endsWith('{')? l : '  '+l)).join('\n')
      .replace(/  }/g,'}');
  }
});}
function jsFormatter(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'function greet(name){return "hi "+name}', outputLabel:'Formatted JavaScript (lightweight)',
  transform(v){
    let depth=0, out=[];
    v.split(/(?<=[{};])/).forEach(chunk=>{
      let seg = chunk.trim(); if(!seg) return;
      if(seg.startsWith('}')) depth=Math.max(0,depth-1);
      out.push('  '.repeat(depth)+seg);
      if(seg.endsWith('{')) depth++;
    });
    return out.join('\n');
  }
});}
function htmlMinifier(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'<div>\n  <p>Hello</p>\n</div>', outputLabel:'Minified HTML',
  stats:(v)=>{ const min=v.replace(/<!--[\s\S]*?-->/g,'').replace(/>\s+</g,'><').trim(); return [['Original', v.length],['Minified', min.length],['Saved', Math.max(0,Math.round((1-min.length/v.length)*100))+'%']]; },
  transform(v){ return v.replace(/<!--[\s\S]*?-->/g,'').replace(/>\s+</g,'><').trim(); }
});}
function cssMinifier(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'.a {\n  color: red;\n}', outputLabel:'Minified CSS',
  stats:(v)=>{ const min=v.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s*([{}:;,])\s*/g,'$1').replace(/;}/g,'}').replace(/\s+/g,' ').trim(); return [['Original', v.length],['Minified', min.length],['Saved', Math.max(0,Math.round((1-min.length/v.length)*100))+'%']]; },
  transform(v){ return v.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s*([{}:;,])\s*/g,'$1').replace(/;}/g,'}').replace(/\s+/g,' ').trim(); }
});}
function jsMinifier(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'function greet(name) {\n  return "hi " + name;\n}', outputLabel:'Minified JavaScript (lightweight — strips comments & extra whitespace only)',
  stats:(v)=>{ const min=v.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1').replace(/\s+/g,' ').trim(); return [['Original', v.length],['Minified', min.length],['Saved', Math.max(0,Math.round((1-min.length/v.length)*100))+'%']]; },
  transform(v){ return v.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1').replace(/\s+/g,' ').trim(); }
});}
function base64Encoder(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'Text to encode…', outputLabel:'Base64',
  transform(v){ return btoa(unescape(encodeURIComponent(v))); }
});}
function base64Decoder(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'Base64 string to decode…', outputLabel:'Decoded text',
  transform(v){ try{ return decodeURIComponent(escape(atob(v.trim()))); }catch(e){ throw new Error('That doesn\'t look like valid Base64.'); } }
});}
function urlEncoder(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'Text or URL to encode…', outputLabel:'Encoded',
  transform(v){ return encodeURIComponent(v); }
});}
function urlDecoder(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'Percent-encoded text…', outputLabel:'Decoded',
  transform(v){ try{ return decodeURIComponent(v); }catch(e){ throw new Error('That doesn\'t look like valid percent-encoding.'); } }
});}
function uuidGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate UUID v4'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const countF = numField('How many?', 5, 1, 100);
  body.appendChild(controlsRow(countF));
  const out = h('div',{class:'result-box', style:'margin-top:14px;'});
  body.appendChild(out);
  const actions=h('div',{class:'ws-actions'});
  const genBtn=h('button',{class:'btn btn-primary btn-sm'},'Generate');
  const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy all');
  actions.append(genBtn,copyBtn); body.appendChild(actions);
  let list=[];
  function gen(){
    const n = clamp(parseInt(countF.inp.value)||1,1,100);
    list = Array.from({length:n},()=>crypto.randomUUID());
    out.textContent = list.join('\n');
  }
  genBtn.onclick=gen; countF.inp.addEventListener('change',gen);
  copyBtn.onclick=()=>copyText(list.join('\n'), 'UUIDs copied');
  gen();
}
function jwtDecoder(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Paste a JWT'));
  const body=h('div',{class:'ws-body ws-cols'});
  ws.append(toolbar,body);
  const inWrap=h('div');
  const ta=h('textarea',{rows:10, placeholder:'eyJhbGciOi...'});
  inWrap.append(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;'},'Token'), ta);
  const outWrap=h('div');
  const headerBox=h('div',{class:'result-box empty'},'Header will appear here.');
  const payloadBox=h('div',{class:'result-box empty', style:'margin-top:10px;'},'Payload will appear here.');
  outWrap.append(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;'},'Decoded (not verified)'), headerBox, payloadBox);
  body.append(inWrap, outWrap);
  ws.appendChild(h('div',{class:'container', style:'padding:0 20px 20px;'}, h('div',{class:'callout warn'}, 'This decodes the token only — it does not verify the signature. Never trust an unverified token for authorization.')));
  function b64urlDecode(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; return decodeURIComponent(escape(atob(s))); }
  function run(){
    const parts = ta.value.trim().split('.');
    if(parts.length<2){ headerBox.className='result-box empty'; headerBox.textContent='Header will appear here.'; payloadBox.className='result-box empty'; payloadBox.textContent='Payload will appear here.'; return; }
    try{
      headerBox.className='result-box'; headerBox.textContent = JSON.stringify(JSON.parse(b64urlDecode(parts[0])),null,2);
      payloadBox.className='result-box'; payloadBox.textContent = JSON.stringify(JSON.parse(b64urlDecode(parts[1])),null,2);
    }catch(e){ headerBox.className='result-box'; headerBox.innerHTML=''; headerBox.appendChild(h('div',{class:'error-msg'},'Could not decode this token.')); payloadBox.textContent=''; }
  }
  ta.addEventListener('input', debounce(run,120));
}
function regexTester(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Pattern & test string'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const row=h('div',{class:'field-row'});
  const patF = h('div',{class:'field', style:'margin:0;'}, h('label',null,'Pattern'), h('input',{type:'text', placeholder:'\\\\b[A-Z][a-z]+\\\\b', value:''}));
  const flagF = h('div',{class:'field', style:'margin:0;max-width:120px;'}, h('label',null,'Flags'), h('input',{type:'text', value:'g'}));
  row.append(patF, flagF); body.appendChild(row);
  const ta = h('textarea',{rows:8, placeholder:'Sample text to test against…'});
  body.appendChild(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin:12px 0 6px;'},'Test string'));
  body.appendChild(ta);
  const out = h('div',{class:'result-box empty', style:'margin-top:12px;'},'Matches will appear here.');
  body.appendChild(out);
  const patInput = qs('input',patF), flagInput = qs('input',flagF);
  function run(){
    const p = patInput.value; if(!p){ out.className='result-box empty'; out.textContent='Matches will appear here.'; return; }
    let re;
    try{ re = new RegExp(p, flagInput.value); }catch(e){ out.className='result-box'; out.innerHTML=''; out.appendChild(h('div',{class:'error-msg'},'Invalid pattern — '+e.message)); return; }
    const text = ta.value;
    const matches = flagInput.value.includes('g') ? Array.from(text.matchAll(re)) : (re.exec(text) ? [re.exec(text)] : []);
    out.className='result-box';
    out.textContent = matches.length ? (matches.length+' match'+(matches.length===1?'':'es')+':\n'+matches.map((m,i)=>`${i+1}. "${m[0]}" at index ${m.index}`).join('\n')) : 'No matches.';
  }
  [patInput,flagInput].forEach(i=>i.addEventListener('input', debounce(run,100)));
  ta.addEventListener('input', debounce(run,100));
}
function unixTimestampConverter(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Convert between epoch time and date'));
  const body=h('div',{class:'ws-body ws-cols'});
  ws.append(toolbar,body);
  const leftCol=h('div');
  leftCol.append(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;'},'Unix timestamp (seconds)'));
  const tsInput = h('input',{type:'number', placeholder:'e.g. 1700000000'});
  leftCol.appendChild(tsInput);
  const nowBtn = h('button',{class:'btn btn-secondary btn-sm', style:'margin-top:10px;'},'Use current time');
  leftCol.appendChild(nowBtn);
  const rightCol=h('div');
  rightCol.append(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;'},'Human-readable date (local)'));
  const dateOut = h('div',{class:'result-box'},'—');
  rightCol.appendChild(dateOut);
  const utcOut = h('div',{class:'result-box', style:'margin-top:10px;'},'—');
  rightCol.appendChild(utcOut);
  body.append(leftCol, rightCol);
  function fromTs(){
    const n = parseFloat(tsInput.value);
    if(Number.isNaN(n)){ dateOut.textContent='—'; utcOut.textContent='—'; return; }
    const d = new Date(n*1000);
    dateOut.textContent = d.toString();
    utcOut.textContent = d.toUTCString();
  }
  tsInput.addEventListener('input', debounce(fromTs,100));
  nowBtn.onclick=()=>{ tsInput.value = Math.floor(Date.now()/1000); fromTs(); };
  nowBtn.click();
}
function hashGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Hash text'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const ta=h('textarea',{rows:6, placeholder:'Text to hash…'});
  body.append(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;'},'Input'), ta);
  const results=h('div',{style:'margin-top:14px;display:grid;gap:10px;'});
  body.appendChild(results);
  const algos = [['MD5', v=>md5(v)], ['SHA-1', v=>shaHash('SHA-1',v)], ['SHA-256', v=>shaHash('SHA-256',v)], ['SHA-384', v=>shaHash('SHA-384',v)], ['SHA-512', v=>shaHash('SHA-512',v)]];
  const boxes = {};
  algos.forEach(([name])=>{
    const row = h('div');
    row.append(h('div',{style:'font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px;'},name));
    const box = h('div',{class:'result-box'},'—');
    row.appendChild(box);
    boxes[name]=box;
    results.appendChild(row);
  });
  async function run(){
    const v = ta.value;
    if(!v){ algos.forEach(([n])=>boxes[n].textContent='—'); return; }
    for(const [name, fn] of algos){
      try{ boxes[name].textContent = await fn(v); }catch(e){ boxes[name].textContent='Unavailable in this browser.'; }
    }
  }
  ta.addEventListener('input', debounce(run,150));
}

/* ---- Text & Writing (15 tools) ---- */
function countWords(v){ const t=v.trim(); return t? t.split(/\s+/).length : 0; }
function wordCounter(ws,tool){ renderTextTool(ws,tool,{
  toolbarLabel:'Type or paste text — everything updates live',
  placeholder:'Start typing or paste your text…', outputLabel:'Summary',
  stats:(v)=>{
    const words = countWords(v);
    const chars = v.length, charsNoSpace = v.replace(/\s/g,'').length;
    const sentences = (v.match(/[.!?]+(?=\s|$)/g)||[]).length || (v.trim()?1:0);
    const paragraphs = v.split(/\n\s*\n/).filter(p=>p.trim()).length || (v.trim()?1:0);
    const minutes = Math.max(1, Math.round(words/200));
    return [['Words', words],['Characters', chars],['No spaces', charsNoSpace],['Sentences', sentences],['Paragraphs', paragraphs],['Read time', minutes+' min']];
  },
  transform(v){ return `${countWords(v)} words, ${v.length} characters, about ${Math.max(1,Math.round(countWords(v)/200))} minute read.`; }
});}
function characterCounter(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'Type or paste text…', outputLabel:'Character count',
  stats:(v)=>[['With spaces', v.length],['Without spaces', v.replace(/\s/g,'').length],['Limit 280', Math.max(0,280-v.length)+' left']],
  transform(v){ return v.length+' characters ('+v.replace(/\s/g,'').length+' without spaces).'; }
});}
function sentenceCounter(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'Paste a paragraph…', outputLabel:'Sentence count',
  transform(v){ const n=(v.match(/[.!?]+(?=\s|$)/g)||[]).length || (v.trim()?1:0); return n+' sentence'+(n===1?'':'s')+'.'; }
});}
function paragraphCounter(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'Paste text with multiple paragraphs…', outputLabel:'Paragraph count',
  transform(v){ const n=v.split(/\n\s*\n/).filter(p=>p.trim()).length || (v.trim()?1:0); return n+' paragraph'+(n===1?'':'s')+'.'; }
});}
function readingTimeCalculator(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'Paste an article or blog post…', outputLabel:'Estimated reading time',
  controls:[{id:'wpm',type:'number',label:'Words per minute',default:200}],
  transform(v,o){ const w=countWords(v); const wpm=o.wpm||200; const mins=w/wpm; const m=Math.floor(mins), s=Math.round((mins-m)*60); return `${w} words → about ${m>0?m+' min ':''}${m>0?s+' sec':mins<1?Math.round(mins*60)+' sec':''} to read at ${wpm} wpm.`; }
});}
function caseConverterMaker(mode){ return function(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'Type or paste text…', outputLabel:'Converted text',
  controls: mode==='all' ? [{id:'mode',type:'select',label:'Case',default:'upper',options:[['upper','UPPERCASE'],['lower','lowercase'],['title','Title Case'],['sentence','Sentence case'],['camel','camelCase'],['snake','snake_case'],['kebab','kebab-case']]}] : [],
  transform(v,o){
    const which = mode==='all' ? o.mode : mode;
    switch(which){
      case 'upper': return v.toUpperCase();
      case 'lower': return v.toLowerCase();
      case 'title': return v.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
      case 'sentence': return v.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c=>c.toUpperCase());
      case 'camel': return v.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g,(m,c)=>c.toUpperCase());
      case 'snake': return v.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_|_$/g,'');
      case 'kebab': return v.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'');
      default: return v;
    }
  }
});};}
function removeDuplicateLines(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'One item per line…', outputLabel:'Unique lines',
  controls:[{id:'ci',type:'checkbox',label:'Case-insensitive'}],
  transform(v,o){ const seen=new Set(); const out=[]; v.split('\n').forEach(l=>{ const k=o.ci?l.toLowerCase():l; if(!seen.has(k)){seen.add(k); out.push(l);} }); return out.join('\n'); }
});}
function removeExtraSpaces(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'Text  with   extra    spaces…', outputLabel:'Cleaned text',
  transform(v){ return v.split('\n').map(l=>l.replace(/[ \t]+/g,' ').trim()).filter((l,i,a)=>!(l===''&&a[i-1]==='')).join('\n'); }
});}
function textSorter(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'One item per line…', outputLabel:'Sorted lines',
  controls:[{id:'mode',type:'select',label:'Sort by',default:'az',options:[['az','A → Z'],['za','Z → A'],['len','Length'],['num','Numeric']]},{id:'dedupe',type:'checkbox',label:'Remove duplicates'}],
  transform(v,o){
    let lines=v.split('\n');
    if(o.dedupe) lines=[...new Set(lines)];
    if(o.mode==='az') lines.sort((a,b)=>a.localeCompare(b));
    else if(o.mode==='za') lines.sort((a,b)=>b.localeCompare(a));
    else if(o.mode==='len') lines.sort((a,b)=>a.length-b.length);
    else if(o.mode==='num') lines.sort((a,b)=>(parseFloat(a)||0)-(parseFloat(b)||0));
    return lines.join('\n');
  }
});}
function textReverser(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'Type or paste text…', outputLabel:'Reversed text',
  controls:[{id:'mode',type:'select',label:'Reverse by',default:'char',options:[['char','Character'],['word','Word'],['line','Line']]}],
  transform(v,o){
    if(o.mode==='char') return v.split('').reverse().join('');
    if(o.mode==='word') return v.split(/\s+/).reverse().join(' ');
    return v.split('\n').reverse().join('\n');
  }
});}
function slugGenerator(ws,tool){ renderTextTool(ws,tool,{
  placeholder:'My Blog Post Title!', outputLabel:'URL slug',
  controls:[{id:'sep',type:'select',label:'Separator',default:'-',options:[['-','Hyphen (-)'],['_','Underscore (_)']]}],
  transform(v,o){ const s=slugify(v); return o.sep==='_' ? s.replace(/-/g,'_') : s; }
});}
function loremIpsumGenerator(ws,tool){
  const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
  function sentence(){ const n=5+Math.floor(Math.random()*10); const words=Array.from({length:n},()=>WORDS[Math.floor(Math.random()*WORDS.length)]); const s=words.join(' '); return s.charAt(0).toUpperCase()+s.slice(1)+'.'; }
  function paragraph(){ const n=3+Math.floor(Math.random()*4); return Array.from({length:n},sentence).join(' '); }
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate placeholder text'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const row=h('div',{class:'field-row'});
  const unitF=selectField('Generate', [['paragraphs','Paragraphs'],['sentences','Sentences'],['words','Words']],'paragraphs');
  const countF=numField('How many', 3, 1, 50);
  row.append(unitF.wrap, countF.wrap); body.appendChild(row);
  const out=h('div',{class:'result-box', style:'margin-top:14px;'});
  body.appendChild(out);
  const actions=h('div',{class:'ws-actions'});
  const genBtn=h('button',{class:'btn btn-primary btn-sm'},'Generate');
  const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy');
  actions.append(genBtn,copyBtn); body.appendChild(actions);
  let text='';
  function gen(){
    const n=clamp(parseInt(countF.inp.value)||1,1,50);
    if(unitF.sel.value==='words') text = Array.from({length:n},()=>WORDS[Math.floor(Math.random()*WORDS.length)]).join(' ');
    else if(unitF.sel.value==='sentences') text = Array.from({length:n},sentence).join(' ');
    else text = Array.from({length:n},paragraph).join('\n\n');
    out.textContent = text;
  }
  genBtn.onclick=gen; unitF.sel.addEventListener('change',gen); countF.inp.addEventListener('change',gen);
  copyBtn.onclick=()=>copyText(text,'Lorem ipsum copied');
  gen();
}

/* ---- Calculators (20 tools) ---- */
function percentageCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[
    {id:'x',label:'X (%)',type:'number',default:20},
    {id:'y',label:'of Y',type:'number',default:150},
  ],
  compute(v){ if(v.x==null||v.y==null) return {error:'Enter both numbers.'}; const r=v.x/100*v.y;
    return { big: fmtNum(r)+' is '+v.x+'% of '+v.y, stats:[[ 'X% of Y', fmtNum(r)],['Y as % of X base', v.x?fmtNum(v.y/(v.x/100)):'—']] }; }
});}
function percentageChangeCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'a',label:'Original value',type:'number',default:100},{id:'b',label:'New value',type:'number',default:120}],
  compute(v){ if(v.a==null||v.b==null||v.a===0) return {error:'Enter two numbers (original can\'t be 0).'};
    const pct=((v.b-v.a)/Math.abs(v.a))*100;
    return { big:(pct>=0?'+':'')+fmtNum(pct)+'%', stats:[['Direction', pct>=0?'Increase':'Decrease'],['Difference', fmtNum(v.b-v.a)]] }; }
});}
function averageCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'nums',label:'Numbers (comma or space separated)',type:'textarea',default:'4, 8, 15, 16, 23, 42'}],
  compute(v){ const arr=(v.nums||'').split(/[,\s]+/).map(Number).filter(n=>!Number.isNaN(n)); if(!arr.length) return {error:'Enter at least one number.'};
    const mean=arr.reduce((a,b)=>a+b,0)/arr.length;
    const sorted=[...arr].sort((a,b)=>a-b); const mid=Math.floor(sorted.length/2);
    const median = sorted.length%2 ? sorted[mid] : (sorted[mid-1]+sorted[mid])/2;
    const freq={}; arr.forEach(n=>freq[n]=(freq[n]||0)+1);
    const maxFreq=Math.max(...Object.values(freq));
    const modes = Object.keys(freq).filter(k=>freq[k]===maxFreq).map(Number);
    return { big:'Mean: '+fmtNum(mean), stats:[['Median', fmtNum(median)],['Mode', maxFreq>1?modes.join(', '):'None'],['Count', arr.length],['Sum', fmtNum(arr.reduce((a,b)=>a+b,0))]] }; }
});}
function ratioCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'a',label:'A',type:'number',default:4},{id:'b',label:'B',type:'number',default:16},{id:'scaleA',label:'Scale A to',type:'number',default:''}],
  compute(v){ if(v.a==null||v.b==null||v.a===0) return {error:'Enter A and B (A ≠ 0).'};
    const g=(function gcd(x,y){ x=Math.abs(x); y=Math.abs(y); return y? gcd(y,x%y): x; })(v.a,v.b) || 1;
    const stats=[['Simplified', (v.a/g)+':'+(v.b/g)]];
    if(v.scaleA){ stats.push(['Scaled B', fmtNum(v.scaleA * (v.b/v.a))]); }
    return { big: (v.a/g)+' : '+(v.b/g), stats }; }
});}
function ageCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'dob',label:'Date of birth',type:'date',default:''}],
  compute(v){ if(!v.dob) return {error:'Choose a date of birth.'};
    const b=new Date(v.dob), now=new Date();
    if(b>now) return {error:'That date is in the future.'};
    let y=now.getFullYear()-b.getFullYear(), m=now.getMonth()-b.getMonth(), d=now.getDate()-b.getDate();
    if(d<0){ m--; d += new Date(now.getFullYear(),now.getMonth(),0).getDate(); }
    if(m<0){ y--; m+=12; }
    const totalDays = Math.floor((now-b)/86400000);
    return { big: y+' years, '+m+' months, '+d+' days', stats:[['Total days', totalDays],['Total weeks', Math.floor(totalDays/7)],['Next birthday', new Date(now.getFullYear()+(now.getMonth()>b.getMonth()||(now.getMonth()===b.getMonth()&&now.getDate()>b.getDate())?1:0), b.getMonth(), b.getDate()).toDateString()]] }; }
});}
function dateDifferenceCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'a',label:'Start date',type:'date',default:''},{id:'b',label:'End date',type:'date',default:''}],
  compute(v){ if(!v.a||!v.b) return {error:'Choose both dates.'};
    const d1=new Date(v.a), d2=new Date(v.b); const ms=Math.abs(d2-d1); const days=Math.round(ms/86400000);
    return { big: days+' days', stats:[['Weeks', (days/7).toFixed(1)],['Months (approx)', (days/30.44).toFixed(1)],['Years (approx)', (days/365.25).toFixed(2)]] }; }
});}
function timeDifferenceCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'a',label:'Start time',type:'time',default:'09:00'},{id:'b',label:'End time',type:'time',default:'17:30'}],
  compute(v){ if(!v.a||!v.b) return {error:'Choose both times.'};
    const [ah,am]=v.a.split(':').map(Number), [bh,bm]=v.b.split(':').map(Number);
    let mins=(bh*60+bm)-(ah*60+am); if(mins<0) mins+=24*60;
    return { big: Math.floor(mins/60)+'h '+(mins%60)+'m', stats:[['Total minutes', mins],['Decimal hours', (mins/60).toFixed(2)]] }; }
});}
function bmiCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'unit',label:'Units',type:'select',default:'metric',options:[['metric','Metric (kg / cm)'],['imperial','Imperial (lb / in)']]},{id:'weight',label:'Weight',type:'number',default:70},{id:'height',label:'Height',type:'number',default:175}],
  compute(v){ if(!v.weight||!v.height) return {error:'Enter weight and height.'};
    let bmi;
    if(v.unit==='metric'){ const m=v.height/100; bmi=v.weight/(m*m); } else { bmi = 703*v.weight/(v.height*v.height); }
    let cat='Normal weight'; if(bmi<18.5) cat='Underweight'; else if(bmi>=25&&bmi<30) cat='Overweight'; else if(bmi>=30) cat='Obese';
    return { big: fmtNum(bmi,1), stats:[['Category', cat]], note:'BMI is a general screening measure and does not account for muscle mass, frame or age — talk to a healthcare professional for a full picture.' }; }
});}
function bmrCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'sex',label:'Sex',type:'select',default:'male',options:[['male','Male'],['female','Female']]},{id:'weight',label:'Weight (kg)',type:'number',default:70},{id:'height',label:'Height (cm)',type:'number',default:175},{id:'age',label:'Age',type:'number',default:30}],
  compute(v){ if(!v.weight||!v.height||!v.age) return {error:'Fill in all fields.'};
    const base = 10*v.weight + 6.25*v.height - 5*v.age;
    const bmr = v.sex==='male' ? base+5 : base-161;
    return { big: fmtNum(bmr,0)+' kcal/day', stats:[['Formula', 'Mifflin-St Jeor']] }; }
});}
function calorieCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'sex',label:'Sex',type:'select',default:'male',options:[['male','Male'],['female','Female']]},{id:'weight',label:'Weight (kg)',type:'number',default:70},{id:'height',label:'Height (cm)',type:'number',default:175},{id:'age',label:'Age',type:'number',default:30},
    {id:'activity',label:'Activity level',type:'select',default:'1.375',options:[['1.2','Sedentary'],['1.375','Light exercise'],['1.55','Moderate exercise'],['1.725','Heavy exercise'],['1.9','Athlete']]}],
  compute(v){ if(!v.weight||!v.height||!v.age) return {error:'Fill in all fields.'};
    const base=10*v.weight+6.25*v.height-5*v.age; const bmr = v.sex==='male'?base+5:base-161;
    const tdee = bmr*parseFloat(v.activity);
    return { big: fmtNum(tdee,0)+' kcal/day', stats:[['To lose ~0.5kg/wk', fmtNum(tdee-500,0)],['To gain ~0.5kg/wk', fmtNum(tdee+500,0)]] }; }
});}
function discountCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'price',label:'Original price',type:'number',default:100},{id:'discount',label:'Discount (%)',type:'number',default:20}],
  compute(v){ if(v.price==null||v.discount==null) return {error:'Enter price and discount.'};
    const saved=v.price*v.discount/100; const final=v.price-saved;
    return { big: fmtNum(final,2), stats:[['You save', fmtNum(saved,2)],['Original', fmtNum(v.price,2)]] }; }
});}
function tipCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'bill',label:'Bill amount',type:'number',default:60},{id:'tip',label:'Tip (%)',type:'number',default:15},{id:'people',label:'Split between',type:'number',default:1}],
  compute(v){ if(!v.bill) return {error:'Enter a bill amount.'};
    const tipAmt=v.bill*(v.tip||0)/100; const total=v.bill+tipAmt; const people=Math.max(1,v.people||1);
    return { big: fmtNum(total/people,2)+' / person', stats:[['Tip amount', fmtNum(tipAmt,2)],['Total', fmtNum(total,2)],['Per person', fmtNum(total/people,2)]] }; }
});}
function loanCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'amount',label:'Loan amount',type:'number',default:20000},{id:'rate',label:'Annual interest rate (%)',type:'number',default:8},{id:'years',label:'Term (years)',type:'number',default:5}],
  compute(v){ if(!v.amount||v.rate==null||!v.years) return {error:'Fill in all fields.'};
    const r=v.rate/100/12, n=v.years*12;
    const m = r===0 ? v.amount/n : v.amount*r/(1-Math.pow(1+r,-n));
    return { big: fmtNum(m,2)+' /month', stats:[['Total paid', fmtNum(m*n,2)],['Total interest', fmtNum(m*n-v.amount,2)]] }; }
});}
function mortgageCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'price',label:'Home price',type:'number',default:300000},{id:'down',label:'Down payment',type:'number',default:60000},{id:'rate',label:'Interest rate (%)',type:'number',default:6.5},{id:'years',label:'Term (years)',type:'number',default:30},
    {id:'tax',label:'Monthly tax + insurance',type:'number',default:250}],
  compute(v){ if(!v.price||v.down==null||v.rate==null||!v.years) return {error:'Fill in all fields.'};
    const principal=v.price-v.down; if(principal<=0) return {error:'Down payment must be less than the home price.'};
    const r=v.rate/100/12, n=v.years*12;
    const m = r===0 ? principal/n : principal*r/(1-Math.pow(1+r,-n));
    return { big: fmtNum(m+(v.tax||0),2)+' /month', stats:[['Principal & interest', fmtNum(m,2)],['Tax & insurance', fmtNum(v.tax||0,2)],['Loan amount', fmtNum(principal,2)]] }; }
});}
function compoundInterestCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'principal',label:'Initial amount',type:'number',default:5000},{id:'rate',label:'Annual rate (%)',type:'number',default:6},{id:'years',label:'Years',type:'number',default:10},{id:'n',label:'Compounds per year',type:'select',default:'12',options:[['1','Annually'],['4','Quarterly'],['12','Monthly'],['365','Daily']]}],
  compute(v){ if(!v.principal||v.rate==null||!v.years) return {error:'Fill in all fields.'};
    const n=parseFloat(v.n); const amt = v.principal*Math.pow(1+(v.rate/100)/n, n*v.years);
    return { big: fmtNum(amt,2), stats:[['Interest earned', fmtNum(amt-v.principal,2)],['Starting amount', fmtNum(v.principal,2)]] }; }
});}
function simpleInterestCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'principal',label:'Principal',type:'number',default:5000},{id:'rate',label:'Annual rate (%)',type:'number',default:6},{id:'years',label:'Years',type:'number',default:10}],
  compute(v){ if(!v.principal||v.rate==null||!v.years) return {error:'Fill in all fields.'};
    const interest=v.principal*(v.rate/100)*v.years;
    return { big: fmtNum(v.principal+interest,2), stats:[['Interest earned', fmtNum(interest,2)]] }; }
});}
function profitMarginCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'cost',label:'Cost',type:'number',default:40},{id:'revenue',label:'Revenue (selling price)',type:'number',default:100}],
  compute(v){ if(v.cost==null||!v.revenue) return {error:'Enter cost and revenue.'};
    const profit=v.revenue-v.cost; const margin=profit/v.revenue*100;
    return { big: fmtNum(margin,2)+'%', stats:[['Profit', fmtNum(profit,2)],['Markup %', fmtNum(v.cost?profit/v.cost*100:0,2)]] }; }
});}
function markupCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'cost',label:'Cost',type:'number',default:40},{id:'markup',label:'Markup (%)',type:'number',default:50}],
  compute(v){ if(v.cost==null||v.markup==null) return {error:'Enter cost and markup.'};
    const price=v.cost*(1+v.markup/100);
    return { big: fmtNum(price,2), stats:[['Profit', fmtNum(price-v.cost,2)],['Margin %', fmtNum((price-v.cost)/price*100,2)]] }; }
});}
function salaryCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'amount',label:'Amount',type:'number',default:25},{id:'period',label:'Pay period',type:'select',default:'hour',options:[['hour','Per hour'],['month','Per month'],['year','Per year']]},{id:'hours',label:'Hours / week',type:'number',default:40}],
  compute(v){ if(!v.amount||!v.hours) return {error:'Fill in all fields.'};
    let annual;
    if(v.period==='hour') annual=v.amount*v.hours*52;
    else if(v.period==='month') annual=v.amount*12;
    else annual=v.amount;
    const hourly = annual/(v.hours*52);
    return { big: fmtNum(annual,0)+' /year', stats:[['Per month', fmtNum(annual/12,2)],['Per hour', fmtNum(hourly,2)],['Per week', fmtNum(annual/52,2)]] }; }
});}
const UNIT_GROUPS = {
  length: { base:'m', units:{ mm:0.001,cm:0.01,m:1,km:1000,in:0.0254,ft:0.3048,yd:0.9144,mi:1609.344 } },
  weight: { base:'kg', units:{ mg:0.000001,g:0.001,kg:1,t:1000,oz:0.0283495,lb:0.453592 } },
  volume: { base:'l', units:{ ml:0.001,l:1,gal:3.78541,qt:0.946353,cup:0.24,'fl oz':0.0295735 } },
  temperature: { base:'c', units:{ c:'c', f:'f', k:'k' } },
};
function convertUnit(group, from, to, val){
  if(group==='temperature'){
    let c;
    if(from==='c') c=val; else if(from==='f') c=(val-32)*5/9; else c=val-273.15;
    if(to==='c') return c; if(to==='f') return c*9/5+32; return c+273.15;
  }
  const g = UNIT_GROUPS[group];
  return val*g.units[from]/g.units[to];
}
function unitConverter(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Convert units'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const groupF = selectField('Category',[['length','Length'],['weight','Weight'],['temperature','Temperature'],['volume','Volume']],'length');
  body.appendChild(controlsRow(groupF));
  const row = h('div',{class:'field-row', style:'margin-top:14px;'});
  const valF = numField('Value', 1, null, null, 'any');
  const fromF = selectField('From', [], null);
  const toF = selectField('To', [], null);
  row.append(valF.wrap, fromF.wrap, toF.wrap); body.appendChild(row);
  const out = h('div',{class:'big-result', style:'margin-top:18px;'});
  body.appendChild(out);
  function populate(){
    const g=groupF.sel.value;
    const keys = g==='temperature' ? ['c','f','k'] : Object.keys(UNIT_GROUPS[g].units);
    const labelMap = {c:'Celsius (°C)',f:'Fahrenheit (°F)',k:'Kelvin (K)'};
    fromF.sel.innerHTML=''; toF.sel.innerHTML='';
    keys.forEach(k=>{ fromF.sel.appendChild(h('option',{value:k}, labelMap[k]||k)); toF.sel.appendChild(h('option',{value:k}, labelMap[k]||k)); });
    fromF.sel.value=keys[0]; toF.sel.value=keys[1]||keys[0];
    run();
  }
  function run(){
    const v=parseFloat(valF.inp.value);
    if(Number.isNaN(v)){ out.textContent='Enter a value'; return; }
    const r = convertUnit(groupF.sel.value, fromF.sel.value, toF.sel.value, v);
    out.textContent = fmtNum(v)+' '+fromF.sel.value+' = '+fmtNum(r,6)+' '+toF.sel.value;
  }
  groupF.sel.addEventListener('change', populate);
  [valF.inp,fromF.sel,toF.sel].forEach(el=>el.addEventListener('input', debounce(run,80)));
  populate();
}

/* ---- Finance & Business (15 tools) ---- */
function roiCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'cost',label:'Investment cost',type:'number',default:1000},{id:'gain',label:'Return / gain',type:'number',default:1300}],
  compute(v){ if(!v.cost) return {error:'Enter a non-zero investment cost.'};
    const roi=(v.gain-v.cost)/v.cost*100;
    return { big: fmtNum(roi,2)+'%', stats:[['Net profit', fmtNum(v.gain-v.cost,2)]] }; }
});}
function roasCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'revenue',label:'Revenue from ads',type:'number',default:5000},{id:'spend',label:'Ad spend',type:'number',default:1000}],
  compute(v){ if(!v.spend) return {error:'Enter a non-zero ad spend.'};
    return { big: fmtNum(v.revenue/v.spend,2)+'x', stats:[['Revenue per $1 spent', fmtNum(v.revenue/v.spend,2)]] }; }
});}
function revenueCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'units',label:'Units sold',type:'number',default:500},{id:'price',label:'Price per unit',type:'number',default:29.99}],
  compute(v){ if(!v.units||!v.price) return {error:'Fill in both fields.'};
    return { big: fmtNum(v.units*v.price,2), stats:[['Units', v.units],['Price', fmtNum(v.price,2)]] }; }
});}
function grossProfitCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'revenue',label:'Revenue',type:'number',default:20000},{id:'cogs',label:'Cost of goods sold',type:'number',default:8000}],
  compute(v){ if(v.revenue==null||v.cogs==null) return {error:'Fill in both fields.'};
    const gp=v.revenue-v.cogs;
    return { big: fmtNum(gp,2), stats:[['Gross margin %', v.revenue?fmtNum(gp/v.revenue*100,2):'—']] }; }
});}
function netProfitCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'revenue',label:'Revenue',type:'number',default:20000},{id:'expenses',label:'Total expenses (incl. COGS, tax, etc.)',type:'number',default:15000}],
  compute(v){ if(v.revenue==null||v.expenses==null) return {error:'Fill in both fields.'};
    const np=v.revenue-v.expenses;
    return { big: fmtNum(np,2), stats:[['Net margin %', v.revenue?fmtNum(np/v.revenue*100,2):'—']] }; }
});}
function breakEvenCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'fixed',label:'Fixed costs',type:'number',default:10000},{id:'price',label:'Price per unit',type:'number',default:50},{id:'variable',label:'Variable cost per unit',type:'number',default:20}],
  compute(v){ if(!v.fixed||v.price==null||v.variable==null) return {error:'Fill in all fields.'};
    const contrib=v.price-v.variable; if(contrib<=0) return {error:'Price must be greater than variable cost.'};
    const units=v.fixed/contrib;
    return { big: fmtNum(units,1)+' units', stats:[['Break-even revenue', fmtNum(units*v.price,2)],['Contribution / unit', fmtNum(contrib,2)]] }; }
});}
function vatCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'amount',label:'Amount',type:'number',default:100},{id:'rate',label:'VAT rate (%)',type:'number',default:20},{id:'mode',label:'Mode',type:'select',default:'add',options:[['add','Add VAT (net → gross)'],['remove','Remove VAT (gross → net)']]}],
  compute(v){ if(v.amount==null||v.rate==null) return {error:'Fill in all fields.'};
    if(v.mode==='add'){ const vatAmt=v.amount*v.rate/100; return { big: fmtNum(v.amount+vatAmt,2), stats:[['VAT amount', fmtNum(vatAmt,2)],['Net amount', fmtNum(v.amount,2)]] }; }
    const net=v.amount/(1+v.rate/100); return { big: fmtNum(net,2), stats:[['VAT amount', fmtNum(v.amount-net,2)],['Gross amount', fmtNum(v.amount,2)]] }; }
});}
function salesTaxCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'price',label:'Price before tax',type:'number',default:100},{id:'rate',label:'Sales tax rate (%)',type:'number',default:8.5}],
  compute(v){ if(v.price==null||v.rate==null) return {error:'Fill in all fields.'};
    const tax=v.price*v.rate/100;
    return { big: fmtNum(v.price+tax,2), stats:[['Tax amount', fmtNum(tax,2)]] }; }
});}
function commissionCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'sale',label:'Sale amount',type:'number',default:5000},{id:'rate',label:'Commission rate (%)',type:'number',default:10}],
  compute(v){ if(!v.sale||v.rate==null) return {error:'Fill in both fields.'};
    return { big: fmtNum(v.sale*v.rate/100,2), stats:[['Net to seller', fmtNum(v.sale*(1-v.rate/100),2)]] }; }
});}
function pricingCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'cost',label:'Cost per unit',type:'number',default:20},{id:'margin',label:'Target margin (%)',type:'number',default:40},{id:'fees',label:'Payment / platform fees (%)',type:'number',default:3}],
  compute(v){ if(v.cost==null||v.margin==null) return {error:'Fill in cost and margin.'};
    if(v.margin>=100) return {error:'Margin must be less than 100%.'};
    let price=v.cost/(1-v.margin/100);
    if(v.fees) price = price/(1-v.fees/100);
    return { big: fmtNum(price,2), stats:[['Profit per unit', fmtNum(price*(1-(v.fees||0)/100)-v.cost,2)]] }; }
});}
function businessLoanCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'amount',label:'Loan amount',type:'number',default:50000},{id:'rate',label:'Annual interest rate (%)',type:'number',default:9},{id:'years',label:'Term (years)',type:'number',default:5}],
  compute(v){ if(!v.amount||v.rate==null||!v.years) return {error:'Fill in all fields.'};
    const r=v.rate/100/12, n=v.years*12;
    const m = r===0 ? v.amount/n : v.amount*r/(1-Math.pow(1+r,-n));
    return { big: fmtNum(m,2)+' /month', stats:[['Total repaid', fmtNum(m*n,2)],['Total interest', fmtNum(m*n-v.amount,2)]] }; }
});}
function savingsCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'initial',label:'Starting amount',type:'number',default:1000},{id:'monthly',label:'Monthly contribution',type:'number',default:200},{id:'rate',label:'Annual interest rate (%)',type:'number',default:4},{id:'years',label:'Years',type:'number',default:10}],
  compute(v){ if(v.initial==null||v.monthly==null||v.rate==null||!v.years) return {error:'Fill in all fields.'};
    const r=v.rate/100/12, n=v.years*12; let bal=v.initial;
    for(let i=0;i<n;i++){ bal = bal*(1+r) + v.monthly; }
    const contributed = v.initial + v.monthly*n;
    return { big: fmtNum(bal,2), stats:[['Total contributed', fmtNum(contributed,2)],['Interest earned', fmtNum(bal-contributed,2)]] }; }
});}
function investmentReturnCalculator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'initial',label:'Initial investment',type:'number',default:10000},{id:'rate',label:'Expected annual return (%)',type:'number',default:7},{id:'years',label:'Years',type:'number',default:20}],
  compute(v){ if(!v.initial||v.rate==null||!v.years) return {error:'Fill in all fields.'};
    const fv = v.initial*Math.pow(1+v.rate/100, v.years);
    return { big: fmtNum(fv,2), stats:[['Total gain', fmtNum(fv-v.initial,2)],['Growth multiple', fmtNum(fv/v.initial,2)+'x']] }; }
});}
function lineItemDocGenerator(ws,tool,title){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,title+' builder'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const row1=h('div',{class:'field-row'});
  const fromF=h('div',{class:'field',style:'margin:0;'}, h('label',null,'From (your business)'), h('input',{type:'text', value:'Your Business Name', id:'fromF'}));
  const toF=h('div',{class:'field',style:'margin:0;'}, h('label',null,'To (client)'), h('input',{type:'text', value:'Client Name', id:'toF'}));
  row1.append(fromF,toF); body.appendChild(row1);
  const row2=h('div',{class:'field-row'});
  const numF=h('div',{class:'field',style:'margin:0;'}, h('label',null, title+' #'), h('input',{type:'text', value:'INV-1001', id:'numF'}));
  const dateF=h('div',{class:'field',style:'margin:0;'}, h('label',null,'Date'), h('input',{type:'date', value:new Date().toISOString().slice(0,10), id:'dateF'}));
  row2.append(numF,dateF); body.appendChild(row2);
  const itemsHost=h('div',{style:'margin-top:14px;'});
  body.appendChild(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:8px;'},'Line items'));
  body.appendChild(itemsHost);
  const addBtn=h('button',{class:'btn btn-secondary btn-sm', style:'margin-top:8px;'},'+ Add line item');
  body.appendChild(addBtn);
  function addRow(desc,qty,price){
    const r=h('div',{class:'field-row', style:'margin-top:8px;'});
    const d=h('input',{type:'text',placeholder:'Description', value:desc||''});
    const q=h('input',{type:'number',placeholder:'Qty', value:qty!=null?qty:1, style:'max-width:90px;'});
    const p=h('input',{type:'number',placeholder:'Unit price', value:price!=null?price:0, style:'max-width:120px;'});
    const rm=h('button',{class:'btn btn-ghost btn-sm', type:'button'},'✕');
    rm.onclick=()=>{ r.remove(); recalc(); };
    [d,q,p].forEach(el=>el.addEventListener('input', debounce(recalc,100)));
    r.append(d,q,p,rm);
    itemsHost.appendChild(r);
  }
  addRow('Design services',10,75); addRow('Hosting setup',1,150);
  addBtn.onclick=()=>{ addRow('',1,0); };
  const totalOut=h('div',{class:'big-result', style:'margin-top:16px;'});
  body.appendChild(totalOut);
  const preview=h('div',{class:'result-box', style:'margin-top:14px;white-space:pre-wrap;'});
  body.appendChild(preview);
  const actions=h('div',{class:'ws-actions'});
  const printBtn=h('button',{class:'btn btn-primary btn-sm'},'Open printable version');
  const dlBtn=h('button',{class:'btn btn-secondary btn-sm'},'Download as .html');
  actions.append(printBtn,dlBtn); body.appendChild(actions);
  function buildDoc(){
    const rows = Array.from(itemsHost.children).map(r=>{
      const [d,q,p]=r.querySelectorAll('input');
      return {desc:d.value||'Item', qty:parseFloat(q.value)||0, price:parseFloat(p.value)||0};
    });
    const total = rows.reduce((s,r)=>s+r.qty*r.price,0);
    const rowsHtml = rows.map(r=>`<tr><td>${esc(r.desc)}</td><td style="text-align:right;">${r.qty}</td><td style="text-align:right;">${fmtNum(r.price,2)}</td><td style="text-align:right;">${fmtNum(r.qty*r.price,2)}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} ${esc(numF.querySelector('input').value)}</title>
    <style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;color:#14161A;} h1{font-size:22px;} table{width:100%;border-collapse:collapse;margin-top:20px;} th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left;} th{color:#666;font-size:12px;text-transform:uppercase;} .total{text-align:right;font-size:20px;font-weight:700;margin-top:16px;} .meta{display:flex;justify-content:space-between;color:#555;font-size:13px;margin-top:6px;} @media print{a.noprint{display:none;}}</style></head>
    <body>
    <a class="noprint" href="#" onclick="window.print();return false;" style="float:right;">Print / Save as PDF</a>
    <h1>${title}</h1>
    <div class="meta"><div><b>From:</b> ${esc(fromF.querySelector('input').value)}</div><div><b>To:</b> ${esc(toF.querySelector('input').value)}</div></div>
    <div class="meta"><div>#${esc(numF.querySelector('input').value)}</div><div>${esc(dateF.querySelector('input').value)}</div></div>
    <table><thead><tr><th>Description</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Unit price</th><th style="text-align:right;">Amount</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    <div class="total">Total: ${fmtNum(total,2)}</div>
    </body></html>`;
    return {html, total, rows};
  }
  function recalc(){
    const {html, total, rows} = buildDoc();
    totalOut.textContent = 'Total: '+fmtNum(total,2);
    preview.textContent = rows.map(r=>`${r.desc}  ×${r.qty}  @ ${fmtNum(r.price,2)}  =  ${fmtNum(r.qty*r.price,2)}`).join('\n') + `\n\nTotal: ${fmtNum(total,2)}`;
  }
  [fromF,toF,numF,dateF].forEach(f=>f.querySelector('input').addEventListener('input', debounce(recalc,100)));
  printBtn.onclick=()=>{ const {html}=buildDoc(); const w=window.open('','_blank'); if(w){ w.document.write(html); w.document.close(); } else toast('Please allow pop-ups to open the printable version'); };
  dlBtn.onclick=()=>{ const {html}=buildDoc(); download(tool.slug+'.html', html, 'text/html'); };
  recalc();
}
function invoiceGenerator(ws,tool){ lineItemDocGenerator(ws,tool,'Invoice'); }
function quoteGenerator(ws,tool){ lineItemDocGenerator(ws,tool,'Quote'); }

/* ---- SEO & Web (12 live tools) ---- */
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
/* ---- Shared: platform badges + i18n word packs for the keyword tool ---- */
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
function platformBadge(name, size){
  size = size||26;
  const m = PLATFORM_META[name] || {bg:'#666',fg:'#fff',glyph:name[0]};
  const el = h('span',{class:'plat-badge', style:`width:${size}px;height:${size}px;font-size:${Math.round(size*0.46)}px;background:${m.bg};color:${m.fg};${m.border?'box-shadow:inset 0 0 0 1px rgba(0,0,0,0.15), 0 2px 5px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.6);':''}`}, m.glyph);
  return el;
}
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

/* ---- Generators (12 tools) ---- */
function loadCdnScript(src){
  return new Promise((resolve,reject)=>{
    if(document.querySelector(`script[src="${src}"]`)){ resolve(); return; }
    const s=document.createElement('script'); s.src=src; s.onload=resolve; s.onerror=()=>reject(new Error('Could not load a required library from cdnjs.'));
    document.head.appendChild(s);
  });
}
/* ---------------------------------------------------------------------
   PDF engine — pdf-lib (create/edit) + pdf.js (render/extract text) + JSZip
   (bundling multiple output files), all loaded lazily from cdnjs only when
   a PDF tool is actually opened.
--------------------------------------------------------------------- */
let _pdfLibLoaded=false, _pdfJsLoaded=false, _jsZipLoaded=false;
async function loadPdfLib(){
  if(_pdfLibLoaded) return;
  await loadCdnScript('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
  _pdfLibLoaded=true;
}
async function loadPdfJs(){
  if(_pdfJsLoaded) return;
  await loadCdnScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  // eslint-disable-next-line no-undef
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  _pdfJsLoaded=true;
}
async function loadJsZip(){
  if(_jsZipLoaded) return;
  await loadCdnScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  _jsZipLoaded=true;
}
let _jsPdfLoaded=false;
async function loadJsPdfLib(){
  if(_jsPdfLoaded) return;
  await loadCdnScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  _jsPdfLoaded=true;
}
function fileDropzone(container, opts, onFiles){
  const dz = h('div',{class:'dropzone', tabindex:'0', role:'button','aria-label':opts.label||'Upload file'});
  dz.innerHTML = svgIcon('upload');
  dz.appendChild(h('div',null, opts.label||'Click to upload or drag & drop'));
  const fname = h('div',{class:'fname'}, opts.hint||'');
  dz.appendChild(fname);
  const input = h('input',{type:'file', accept:opts.accept||'*/*', style:'display:none;'});
  if(opts.multiple) input.setAttribute('multiple','multiple');
  dz.appendChild(input);
  container.appendChild(dz);
  function matchesAccept(file, accept){
    if(!accept || accept==='*/*') return true;
    return accept.split(',').some(pattern=>{
      pattern = pattern.trim();
      if(pattern.startsWith('.')) return file.name.toLowerCase().endsWith(pattern.toLowerCase());
      if(pattern.endsWith('/*')) return file.type.startsWith(pattern.slice(0,-1));
      return file.type === pattern;
    });
  }
  function handle(fileList){
    let arr = Array.from(fileList);
    if(!arr.length) return;
    const rejected = arr.filter(f=>!matchesAccept(f, opts.accept));
    arr = arr.filter(f=>matchesAccept(f, opts.accept));
    if(rejected.length) toast(rejected.length===1 ? `Skipped "${rejected[0].name}" — wrong file type` : `Skipped ${rejected.length} files with the wrong type`);
    if(!arr.length) return;
    fname.textContent = arr.length===1 ? (arr[0].name+' · '+fmtBytes(arr[0].size)) : (arr.length+' files selected · '+fmtBytes(arr.reduce((s,f)=>s+f.size,0))+' total');
    onFiles(arr);
  }
  dz.addEventListener('click', ()=>input.click());
  dz.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); input.click(); } });
  dz.addEventListener('dragover', e=>{ e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', ()=>dz.classList.remove('drag'));
  dz.addEventListener('drop', e=>{ e.preventDefault(); dz.classList.remove('drag'); if(e.dataTransfer.files.length) handle(e.dataTransfer.files); });
  input.addEventListener('change', ()=>{ if(input.files.length) handle(input.files); });
  return { dz, setLabel:t=>fname.textContent=t };
}
// Parses "1-3,5,8-9" into a sorted, de-duplicated array of 0-based page indices, clamped to pageCount.
function parsePageRange(str, pageCount){
  const out = new Set();
  String(str||'').split(',').map(s=>s.trim()).filter(Boolean).forEach(part=>{
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if(m){
      let a=parseInt(m[1]), b=parseInt(m[2]);
      if(a>b) [a,b]=[b,a];
      for(let i=a;i<=b;i++) if(i>=1 && i<=pageCount) out.add(i-1);
    } else if(/^\d+$/.test(part)){
      const n=parseInt(part);
      if(n>=1 && n<=pageCount) out.add(n-1);
    }
  });
  return Array.from(out).sort((a,b)=>a-b);
}
function pdfWorkspaceShell(ws, label){
  const toolbar = h('div',{class:'ws-toolbar'}, h('strong',null,label), h('span',{style:'font-size:12px;color:var(--muted);'},'Runs in your browser via pdf-lib / pdf.js'));
  const body = h('div',{class:'ws-body'});
  ws.append(toolbar, body);
  return body;
}
function qrCodeGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate a QR code'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const ta=h('textarea',{rows:3, placeholder:'Text or URL to encode…'});
  body.append(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;'},'Content'), ta);
  const sizeF = numField('Size (px)', 220, 100, 600);
  body.appendChild(controlsRow(sizeF));
  const qrHost = h('div',{style:'margin-top:16px;display:flex;justify-content:center;padding:16px;background:#fff;border-radius:8px;border:1px solid var(--line);'});
  body.appendChild(qrHost);
  const actions=h('div',{class:'ws-actions'}); const dlBtn=h('button',{class:'btn btn-primary btn-sm'},'Download PNG'); actions.appendChild(dlBtn); body.appendChild(actions);
  let qr=null, loaded=false;
  async function ensureLib(){
    if(loaded) return;
    await loadCdnScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
    loaded=true;
  }
  async function run(){
    const text = ta.value || 'https://example.com';
    try{ await ensureLib(); }catch(e){ qrHost.textContent='Could not load the QR library — check your connection.'; return; }
    qrHost.innerHTML='';
    try{
      // eslint-disable-next-line no-undef
      new QRCode(qrHost, { text, width: parseInt(sizeF.inp.value)||220, height: parseInt(sizeF.inp.value)||220 });
    }catch(e){
      qrHost.textContent = 'Could not generate a QR code right now — please try again.';
    }
  }
  ta.addEventListener('input', debounce(run,200));
  sizeF.inp.addEventListener('input', debounce(run,200));
  dlBtn.onclick=()=>{
    const img = qrHost.querySelector('img'); const canvas = qrHost.querySelector('canvas');
    if(canvas){ canvas.toBlob(b=>download('qr-code.png', b, 'image/png')); }
    else if(img){ download('qr-code.png', img.src.split(',')[1] ? atob(img.src.split(',')[1]) : ''); toast('Right-click the QR code and choose "Save image" if the download didn\'t start.'); }
    else toast('Generate a QR code first.');
  };
  run();
}
function barcodeGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate a barcode'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const row=h('div',{class:'field-row'});
  const valF=h('div',{class:'field',style:'margin:0;'}, h('label',null,'Value'), h('input',{type:'text',value:'123456789012'}));
  const fmtF=selectField('Format',[['CODE128','CODE128'],['EAN13','EAN-13'],['UPC','UPC'],['CODE39','CODE39']],'CODE128');
  row.append(valF, fmtF.wrap); body.appendChild(row);
  const host=h('div',{style:'margin-top:16px;display:flex;justify-content:center;padding:16px;background:#fff;border-radius:8px;border:1px solid var(--line);overflow:auto;'});
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  host.appendChild(svg); body.appendChild(host);
  const actions=h('div',{class:'ws-actions'}); const dlBtn=h('button',{class:'btn btn-primary btn-sm'},'Download SVG'); actions.appendChild(dlBtn); body.appendChild(actions);
  let loaded=false;
  async function ensureLib(){ if(loaded) return; await loadCdnScript('https://cdnjs.cloudflare.com/ajax/libs/JsBarcode/3.11.5/JsBarcode.all.min.js'); loaded=true; }
  async function run(){
    try{ await ensureLib(); }catch(e){ toast('Could not load the barcode library.'); return; }
    try{
      // eslint-disable-next-line no-undef
      JsBarcode(svg, valF.querySelector('input').value||'123456789012', { format: fmtF.sel.value, height:70, displayValue:true });
    }catch(e){ toast('That value isn\'t valid for the '+fmtF.sel.value+' format.'); }
  }
  valF.querySelector('input').addEventListener('input', debounce(run,200));
  fmtF.sel.addEventListener('change', run);
  dlBtn.onclick=()=>{ const xml=new XMLSerializer().serializeToString(svg); download('barcode.svg', xml, 'image/svg+xml'); };
  run();
}
function passwordGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate a password'));
  const body=h('div',{class:'ws-body'});
  ws.append(toolbar,body);
  const lenF=numField('Length', 16, 4, 128);
  body.appendChild(controlsRow(lenF));
  const opts=[['upper','A-Z',true],['lower','a-z',true],['digits','0-9',true],['symbols','!@#$%…',true]];
  const optWrap=h('div',{style:'display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;'});
  const checks={};
  opts.forEach(([id,label,def])=>{ const w=h('label',{class:'checkline'}); const c=h('input',{type:'checkbox'}); c.checked=def; w.append(c,' '+label); checks[id]=c; optWrap.appendChild(w); });
  body.appendChild(optWrap);
  const out=h('div',{class:'big-result', style:'margin-top:16px;word-break:break-all;'}); body.appendChild(out);
  const strengthBar=h('div',{style:'height:6px;border-radius:3px;background:var(--line);margin-top:10px;overflow:hidden;'});
  const strengthFill=h('div',{style:'height:100%;width:0%;background:var(--danger);transition:width .2s;'}); strengthBar.appendChild(strengthFill);
  body.appendChild(strengthBar);
  const strengthLabel=h('div',{style:'font-size:12px;color:var(--muted);margin-top:6px;'}); body.appendChild(strengthLabel);
  const actions=h('div',{class:'ws-actions'}); const genBtn=h('button',{class:'btn btn-primary btn-sm'},'Generate'); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy'); actions.append(genBtn,copyBtn); body.appendChild(actions);
  const SETS={upper:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',lower:'abcdefghijklmnopqrstuvwxyz',digits:'0123456789',symbols:'!@#$%^&*()-_=+[]{};:,.<>?'};
  let pwd='';
  function gen(){
    const pool = Object.keys(checks).filter(k=>checks[k].checked).map(k=>SETS[k]).join('');
    if(!pool){ out.textContent='Select at least one character type'; return; }
    const len=clamp(parseInt(lenF.inp.value)||16,4,128);
    const arr=new Uint32Array(len); crypto.getRandomValues(arr);
    pwd = Array.from(arr, n=>pool[n%pool.length]).join('');
    out.textContent = pwd;
    const variety = Object.keys(checks).filter(k=>checks[k].checked).length;
    const score = Math.min(100, len*3 + variety*10);
    strengthFill.style.width=score+'%';
    strengthFill.style.background = score<40?'var(--danger)':score<70?'var(--copper)':'var(--success)';
    strengthLabel.textContent = score<40?'Weak':score<70?'Reasonable':'Strong';
  }
  genBtn.onclick=gen; lenF.inp.addEventListener('input',gen); Object.values(checks).forEach(c=>c.addEventListener('change',gen));
  copyBtn.onclick=()=>copyText(pwd,'Password copied');
  gen();
}
function pinGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate a numeric PIN'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const lenF=numField('Digits', 4, 3, 12); body.appendChild(controlsRow(lenF));
  const out=h('div',{class:'big-result', style:'margin-top:16px;letter-spacing:4px;'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const genBtn=h('button',{class:'btn btn-primary btn-sm'},'Generate'); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy'); actions.append(genBtn,copyBtn); body.appendChild(actions);
  let pin='';
  function gen(){ const len=clamp(parseInt(lenF.inp.value)||4,3,12); const arr=new Uint32Array(len); crypto.getRandomValues(arr); pin=Array.from(arr,n=>n%10).join(''); out.textContent=pin; }
  genBtn.onclick=gen; lenF.inp.addEventListener('input',gen); copyBtn.onclick=()=>copyText(pin,'PIN copied'); gen();
}
function randomNumberGenerator(ws,tool){ renderCalc(ws,tool,{
  fields:[{id:'min',label:'Minimum',type:'number',default:1},{id:'max',label:'Maximum',type:'number',default:100},{id:'count',label:'How many',type:'number',default:1},{id:'unique',label:'No duplicates',type:'checkbox',default:false}],
  compute(v){ if(v.min==null||v.max==null||v.min>=v.max) return {error:'Enter a valid min/max range (min < max).'};
    const count=clamp(v.count||1,1,1000); const range=Math.floor(v.max)-Math.floor(v.min)+1;
    if(v.unique && count>range) return {error:'Range too small for that many unique numbers.'};
    let results=[];
    if(v.unique){ const pool=Array.from({length:range},(_,i)=>Math.floor(v.min)+i); for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; } results=pool.slice(0,count); }
    else { results=Array.from({length:count},()=>Math.floor(v.min+Math.random()*(v.max-v.min+1))); }
    return { big: results.join(', ') }; }
});}
function randomStringGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate a random string'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const lenF=numField('Length', 24, 1, 256);
  const typeF=selectField('Character set',[['alnum','Letters + numbers'],['alpha','Letters only'],['numeric','Numbers only'],['hex','Hex (0-9a-f)']],'alnum');
  body.appendChild(controlsRow(lenF, typeF));
  const out=h('div',{class:'result-box', style:'margin-top:14px;'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const genBtn=h('button',{class:'btn btn-primary btn-sm'},'Generate'); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy'); actions.append(genBtn,copyBtn); body.appendChild(actions);
  const SETS={alnum:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',alpha:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',numeric:'0123456789',hex:'0123456789abcdef'};
  let str='';
  function gen(){ const pool=SETS[typeF.sel.value]; const len=clamp(parseInt(lenF.inp.value)||24,1,256); const arr=new Uint32Array(len); crypto.getRandomValues(arr); str=Array.from(arr,n=>pool[n%pool.length]).join(''); out.textContent=str; }
  genBtn.onclick=gen; lenF.inp.addEventListener('input',gen); typeF.sel.addEventListener('change',gen); copyBtn.onclick=()=>copyText(str,'Copied'); gen();
}
const NAME_FIRST=['Ava','Liam','Noah','Emma','Zara','Omar','Sara','Ali','Maya','Kai','Leo','Nora','Ivy','Theo','Ada','Milo','Aria','Finn','Luna','Jax'];
const NAME_LAST=['Rahman','Khan','Malik','Ahmed','Sheikh','Baig','Qureshi','Chaudhry','Hussain','Iqbal','Farooq','Siddiqui','Butt','Raza','Javed','Anwar'];
function nameGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate random names'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const countF=numField('How many', 6, 1, 50); body.appendChild(controlsRow(countF));
  const out=h('div',{class:'result-box', style:'margin-top:14px;'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const genBtn=h('button',{class:'btn btn-primary btn-sm'},'Generate'); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy'); actions.append(genBtn,copyBtn); body.appendChild(actions);
  let list=[];
  function gen(){ const n=clamp(parseInt(countF.inp.value)||6,1,50); list=Array.from({length:n},()=>NAME_FIRST[Math.floor(Math.random()*NAME_FIRST.length)]+' '+NAME_LAST[Math.floor(Math.random()*NAME_LAST.length)]); out.textContent=list.join('\n'); }
  genBtn.onclick=gen; countF.inp.addEventListener('change',gen); copyBtn.onclick=()=>copyText(list.join('\n'),'Names copied'); gen();
}
function usernameGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate username ideas'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const baseF=h('div',{class:'field'}, h('label',null,'Base word (e.g. your name)'), h('input',{type:'text',value:'ab'}));
  body.appendChild(baseF);
  const out=h('div',{class:'result-box', style:'margin-top:6px;'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const genBtn=h('button',{class:'btn btn-primary btn-sm'},'Generate'); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy'); actions.append(genBtn,copyBtn); body.appendChild(actions);
  let list=[];
  function gen(){
    const base=(baseF.querySelector('input').value||'user').toLowerCase().replace(/[^a-z0-9]/g,'');
    const suffixes=['_dev','.codes','x',String(Math.floor(Math.random()*90+10)),'_official','hq','_pk','pro','xyz','_'+String(Math.floor(Math.random()*900+100))];
    list = suffixes.map(s=>base+s);
    out.textContent = list.join('\n');
  }
  genBtn.onclick=gen; baseF.querySelector('input').addEventListener('input', debounce(gen,150)); copyBtn.onclick=()=>copyText(list.join('\n'),'Usernames copied'); gen();
}
function businessNameGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate business name ideas'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const kwF=h('div',{class:'field'}, h('label',null,'Keyword'), h('input',{type:'text',value:'Bright'}));
  body.appendChild(kwF);
  const out=h('div',{class:'result-box', style:'margin-top:6px;'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const genBtn=h('button',{class:'btn btn-primary btn-sm'},'Generate'); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy'); actions.append(genBtn,copyBtn); body.appendChild(actions);
  const PREFIXES=['','Prime','Nova','Blue','Peak','Metro','Urban','Bright','North','Core'];
  const SUFFIXES=['Labs','Studio','Works','Hub','Co.','Group','Solutions','Collective','House','Digital'];
  let list=[];
  function gen(){
    const kw=(kwF.querySelector('input').value||'Bright').trim();
    list=Array.from({length:8},()=> {
      const p=PREFIXES[Math.floor(Math.random()*PREFIXES.length)]; const s=SUFFIXES[Math.floor(Math.random()*SUFFIXES.length)];
      return [p,kw,s].filter(Boolean).join(' ');
    });
    list=[...new Set(list)];
    out.textContent=list.join('\n');
  }
  genBtn.onclick=gen; kwF.querySelector('input').addEventListener('input', debounce(gen,150)); copyBtn.onclick=()=>copyText(list.join('\n'),'Ideas copied'); gen();
}
function emailSubjectGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate subject line ideas'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const kwF=h('div',{class:'field'}, h('label',null,'Topic'), h('input',{type:'text',value:'summer sale'}));
  const typeF=selectField('Campaign type',[['promo','Promotion / sale'],['newsletter','Newsletter'],['launch','Product launch'],['reminder','Reminder / urgency']],'promo');
  body.append(kwF); body.appendChild(controlsRow(typeF));
  const out=h('div',{class:'result-box', style:'margin-top:6px;'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const genBtn=h('button',{class:'btn btn-primary btn-sm'},'Generate'); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy'); actions.append(genBtn,copyBtn); body.appendChild(actions);
  const TEMPLATES = {
    promo: ['{t}: don\'t miss out', 'Save big on {t} — today only', 'Your {t} discount is waiting', '{t} is here — up to 40% off'],
    newsletter: ['This week in {t}', '{t}: what you missed', 'Your {t} roundup', 'Fresh updates on {t}'],
    launch: ['Introducing: {t}', '{t} just landed', 'It\'s here — {t}', 'Say hello to {t}'],
    reminder: ['Reminder: {t} ends soon', 'Last chance for {t}', '{t} — closing tonight', 'Don\'t forget: {t}'],
  };
  let list=[];
  function gen(){
    const t=(kwF.querySelector('input').value||'your offer').trim();
    list = TEMPLATES[typeF.sel.value].map(tpl=>tpl.replace('{t}', t));
    out.textContent = list.join('\n');
  }
  genBtn.onclick=gen; kwF.querySelector('input').addEventListener('input', debounce(gen,150)); typeF.sel.addEventListener('change',gen); copyBtn.onclick=()=>copyText(list.join('\n'),'Subject lines copied'); gen();
}
function fakeDataGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate placeholder records'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const countF=numField('Rows', 5, 1, 50); body.appendChild(controlsRow(countF));
  const out=h('div',{class:'result-box', style:'margin-top:14px;font-size:12px;'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const genBtn=h('button',{class:'btn btn-primary btn-sm'},'Generate'); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy as JSON'); actions.append(genBtn,copyBtn); body.appendChild(actions);
  const CITIES=['Lahore','Karachi','Islamabad','Austin','Berlin','Toronto','Nairobi','Manila'];
  let rows=[];
  function gen(){
    const n=clamp(parseInt(countF.inp.value)||5,1,50);
    rows = Array.from({length:n},()=>{
      const f=NAME_FIRST[Math.floor(Math.random()*NAME_FIRST.length)], l=NAME_LAST[Math.floor(Math.random()*NAME_LAST.length)];
      return { name:f+' '+l, email:(f+'.'+l).toLowerCase()+'@example.com', city:CITIES[Math.floor(Math.random()*CITIES.length)], id: crypto.randomUUID().slice(0,8) };
    });
    out.textContent = JSON.stringify(rows, null, 2);
  }
  genBtn.onclick=gen; countF.inp.addEventListener('change',gen); copyBtn.onclick=()=>copyText(JSON.stringify(rows,null,2),'Sample data copied'); gen();
}
function colorPaletteGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Generate a color palette'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const row=h('div',{class:'field-row'});
  const colorF=h('div',{class:'field',style:'margin:0;'}, h('label',null,'Base color'), h('input',{type:'color',value:'#1F6F78'}));
  const ruleF=selectField('Harmony',[['complementary','Complementary'],['analogous','Analogous'],['triadic','Triadic'],['monochrome','Monochrome']],'analogous');
  row.append(colorF, ruleF.wrap); body.appendChild(row);
  const swatches=h('div',{style:'display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;'}); body.appendChild(swatches);
  function run(){
    const base = colorF.querySelector('input').value;
    const rgb = hexToRgb(base); const hsl = rgbToHsl(rgb.r,rgb.g,rgb.b);
    let hexes=[];
    if(ruleF.sel.value==='complementary') hexes=[base, hslToHex((hsl.h+180)%360,hsl.s,hsl.l)];
    else if(ruleF.sel.value==='analogous') hexes=[-30,-15,0,15,30].map(d=>hslToHex((hsl.h+d+360)%360,hsl.s,hsl.l));
    else if(ruleF.sel.value==='triadic') hexes=[0,120,240].map(d=>hslToHex((hsl.h+d)%360,hsl.s,hsl.l));
    else hexes=[20,35,50,65,80].map(l=>hslToHex(hsl.h,hsl.s,clamp(l,5,95)));
    swatches.innerHTML='';
    hexes.forEach(hex=>{
      const card=h('div',{style:'text-align:center;'});
      const box=h('div',{style:`width:70px;height:70px;border-radius:8px;background:${hex};border:1px solid var(--line);cursor:pointer;`});
      box.onclick=()=>copyText(hex, hex+' copied');
      card.append(box, h('div',{style:'font-size:11.5px;margin-top:6px;font-family:var(--font-mono);'}, hex));
      swatches.appendChild(card);
    });
  }
  function hslToHex(h2,s,l){ const {r,g,b}=hslToRgb(h2,s,l); return rgbToHex(r,g,b); }
  colorF.querySelector('input').addEventListener('input', run); ruleF.sel.addEventListener('change', run);
  run();
}

/* ---- PDF & Documents (18 of 20 tools — Protect/Unlock need real PDF
   encryption, which pdf-lib does not support, so those two stay "coming
   soon" honestly rather than faked) ---- */
function pdfMerge(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload PDFs to merge — drag to reorder');
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const listHost = h('div',{style:'margin-top:14px;display:none;'}); body.appendChild(listHost);
  const actions = h('div',{class:'ws-actions'});
  const mergeBtn = h('button',{class:'btn btn-primary btn-sm'},'Merge & download');
  actions.appendChild(mergeBtn); body.appendChild(actions);
  let files = [];
  fileDropzone(uploadWrap, {accept:'application/pdf', multiple:true, label:'Click to upload or drag & drop PDF files', hint:'Select two or more PDFs — order below controls the merge order'}, (newFiles)=>{
    files = files.concat(newFiles);
    renderList();
  });
  function renderList(){
    listHost.style.display = files.length ? 'block' : 'none';
    listHost.innerHTML = '';
    files.forEach((f,i)=>{
      const row = h('div',{style:'display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);'});
      row.append(
        h('span',{style:'font-family:var(--font-mono);font-size:12px;color:var(--muted);width:18px;'}, (i+1)+'.'),
        h('span',{style:'flex:1;font-size:13.5px;'}, f.name),
        h('span',{style:'font-size:12px;color:var(--muted);'}, fmtBytes(f.size))
      );
      const up = h('button',{class:'btn btn-ghost btn-sm', type:'button'}, '↑'); if(i===0) up.disabled=true;
      up.onclick=()=>{ [files[i-1],files[i]]=[files[i],files[i-1]]; renderList(); };
      const down = h('button',{class:'btn btn-ghost btn-sm', type:'button'}, '↓'); if(i===files.length-1) down.disabled=true;
      down.onclick=()=>{ [files[i+1],files[i]]=[files[i],files[i+1]]; renderList(); };
      const rm = h('button',{class:'btn btn-ghost btn-sm', type:'button'}, '✕');
      rm.onclick=()=>{ files.splice(i,1); renderList(); };
      row.append(up, down, rm);
      listHost.appendChild(row);
    });
  }
  mergeBtn.onclick = async ()=>{
    if(files.length<2){ toast('Add at least two PDF files to merge'); return; }
    const orig=mergeBtn.textContent; mergeBtn.disabled=true; mergeBtn.textContent='Merging…';
    try{
      await loadPdfLib();
      const outDoc = await PDFLib.PDFDocument.create();
      for(const f of files){
        const srcDoc = await PDFLib.PDFDocument.load(await f.arrayBuffer(), {ignoreEncryption:true});
        const pages = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        pages.forEach(p=>outDoc.addPage(p));
      }
      const outBytes = await outDoc.save();
      download('merged.pdf', new Blob([outBytes],{type:'application/pdf'}));
      toast('Merged PDF downloaded');
    }catch(e){ console.error(e); toast('Could not merge these PDFs — '+e.message); }
    mergeBtn.disabled=false; mergeBtn.textContent=orig;
  };
}
function pdfSplit(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to split');
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const optsHost = h('div',{style:'margin-top:14px;display:none;'}); body.appendChild(optsHost);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'},'Split & download');
  actions.appendChild(runBtn); body.appendChild(actions);
  let file=null, pageCount=0;
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, async (files)=>{
    file = files[0];
    await loadPdfLib();
    const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
    pageCount = doc.getPageCount();
    optsHost.style.display='block'; optsHost.innerHTML='';
    optsHost.append(
      h('p',{class:'hint', style:'margin-bottom:10px;'}, `${pageCount} pages detected.`),
      h('div',{class:'field'}, h('label',null,'Split mode'), (()=>{ const s=h('select',null); s.append(h('option',{value:'every'},'Every page → separate PDF'), h('option',{value:'range'},'Custom ranges (one file per range)')); return s; })())
    );
    const modeSel = optsHost.querySelector('select');
    const rangeField = h('div',{class:'field'}, h('label',null,'Ranges (e.g. 1-3,4-6,7-10)'), h('input',{type:'text', placeholder:'1-3,4-6'}));
    rangeField.style.display='none';
    optsHost.appendChild(rangeField);
    modeSel.addEventListener('change', ()=>{ rangeField.style.display = modeSel.value==='range' ? 'block':'none'; });
    actions.style.display='flex';
  });
  runBtn.onclick = async ()=>{
    if(!file){ toast('Upload a PDF first'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Splitting…';
    try{
      await loadPdfLib();
      const srcBytes = await file.arrayBuffer();
      const modeSel = optsHost.querySelector('select');
      let ranges = [];
      if(modeSel.value==='every'){ for(let i=0;i<pageCount;i++) ranges.push([i]); }
      else{
        const raw = optsHost.querySelector('input').value;
        raw.split(',').map(s=>s.trim()).filter(Boolean).forEach(part=>{
          const idxs = parsePageRange(part, pageCount);
          if(idxs.length) ranges.push(idxs);
        });
        if(!ranges.length){ toast('Enter at least one valid page range'); runBtn.disabled=false; runBtn.textContent=orig; return; }
      }
      const outFiles = [];
      for(let r=0;r<ranges.length;r++){
        const srcDoc = await PDFLib.PDFDocument.load(srcBytes, {ignoreEncryption:true});
        const outDoc = await PDFLib.PDFDocument.create();
        const pages = await outDoc.copyPages(srcDoc, ranges[r]);
        pages.forEach(p=>outDoc.addPage(p));
        outFiles.push({ name:`split-${r+1}.pdf`, bytes: await outDoc.save() });
      }
      if(outFiles.length===1){
        download(outFiles[0].name, new Blob([outFiles[0].bytes],{type:'application/pdf'}));
      }else{
        await loadJsZip();
        const zip = new JSZip();
        outFiles.forEach(f=>zip.file(f.name, f.bytes));
        const blob = await zip.generateAsync({type:'blob'});
        download('split-pages.zip', blob, 'application/zip');
      }
      toast('Split complete — download started');
    }catch(e){ console.error(e); toast('Could not split this PDF — '+e.message); }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
}
function pdfRotate(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to rotate');
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const optsHost = h('div',{style:'margin-top:14px;display:none;'}); body.appendChild(optsHost);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'},'Rotate & download');
  actions.appendChild(runBtn); body.appendChild(actions);
  let file=null;
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, (files)=>{
    file=files[0];
    optsHost.style.display='block'; optsHost.innerHTML='';
    const angF = selectField('Rotate all pages by', [['90','90° clockwise'],['180','180°'],['270','270° clockwise']], '90');
    optsHost.appendChild(controlsRow(angF));
    optsHost._angF = angF;
    actions.style.display='flex';
  });
  runBtn.onclick = async ()=>{
    if(!file){ toast('Upload a PDF first'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Rotating…';
    try{
      await loadPdfLib();
      const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
      const deg = parseInt(optsHost._angF.sel.value);
      doc.getPages().forEach(p=>{ p.setRotation(PDFLib.degrees((p.getRotation().angle||0)+deg)); });
      const outBytes = await doc.save();
      download('rotated.pdf', new Blob([outBytes],{type:'application/pdf'}));
      toast('Rotated PDF downloaded');
    }catch(e){ console.error(e); toast('Could not rotate this PDF — '+e.message); }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
}
function pdfExtractOrDelete(mode){ return function(ws,tool){
  const body = pdfWorkspaceShell(ws, (mode==='extract'?'Upload a PDF to extract pages from':'Upload a PDF to delete pages from'));
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const optsHost = h('div',{style:'margin-top:14px;display:none;'}); body.appendChild(optsHost);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'}, mode==='extract'?'Extract & download':'Delete & download');
  actions.appendChild(runBtn); body.appendChild(actions);
  let file=null, pageCount=0;
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, async (files)=>{
    file=files[0];
    await loadPdfLib();
    const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
    pageCount = doc.getPageCount();
    optsHost.style.display='block'; optsHost.innerHTML='';
    optsHost.append(
      h('p',{class:'hint', style:'margin-bottom:10px;'}, `${pageCount} pages detected.`),
      h('div',{class:'field'}, h('label',null, mode==='extract' ? 'Pages to keep (e.g. 1-3,5)' : 'Pages to delete (e.g. 2,4-6)'), h('input',{type:'text', placeholder:'1-3,5'}))
    );
    actions.style.display='flex';
  });
  runBtn.onclick = async ()=>{
    if(!file){ toast('Upload a PDF first'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Working…';
    try{
      await loadPdfLib();
      const srcDoc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
      const rangeStr = optsHost.querySelector('input').value;
      const chosen = parsePageRange(rangeStr, pageCount);
      if(!chosen.length){ toast('Enter a valid page range'); runBtn.disabled=false; runBtn.textContent=orig; return; }
      const keepIdxs = mode==='extract' ? chosen : Array.from({length:pageCount},(_,i)=>i).filter(i=>!chosen.includes(i));
      if(!keepIdxs.length){ toast('That would remove every page — adjust the range'); runBtn.disabled=false; runBtn.textContent=orig; return; }
      const outDoc = await PDFLib.PDFDocument.create();
      const pages = await outDoc.copyPages(srcDoc, keepIdxs);
      pages.forEach(p=>outDoc.addPage(p));
      const outBytes = await outDoc.save();
      download((mode==='extract'?'extracted':'trimmed')+'.pdf', new Blob([outBytes],{type:'application/pdf'}));
      toast('Done — file downloaded');
    }catch(e){ console.error(e); toast('Something went wrong — '+e.message); }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
};}
function pdfReorderPages(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to reorder its pages');
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const listHost = h('div',{style:'margin-top:14px;display:none;max-height:360px;overflow:auto;'}); body.appendChild(listHost);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'},'Save reordered PDF');
  actions.appendChild(runBtn); body.appendChild(actions);
  let file=null, order=[];
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, async (files)=>{
    file=files[0];
    await loadPdfLib();
    const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
    order = Array.from({length:doc.getPageCount()},(_,i)=>i);
    renderList();
    actions.style.display='flex';
  });
  function renderList(){
    listHost.style.display='block'; listHost.innerHTML='';
    order.forEach((pageIdx,i)=>{
      const row = h('div',{style:'display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);'});
      row.append(h('span',{style:'flex:1;font-size:13.5px;'}, 'Page '+(pageIdx+1)));
      const up = h('button',{class:'btn btn-ghost btn-sm', type:'button'}, '↑'); if(i===0) up.disabled=true;
      up.onclick=()=>{ [order[i-1],order[i]]=[order[i],order[i-1]]; renderList(); };
      const down = h('button',{class:'btn btn-ghost btn-sm', type:'button'}, '↓'); if(i===order.length-1) down.disabled=true;
      down.onclick=()=>{ [order[i+1],order[i]]=[order[i],order[i+1]]; renderList(); };
      row.append(up, down);
      listHost.appendChild(row);
    });
  }
  runBtn.onclick = async ()=>{
    if(!file){ toast('Upload a PDF first'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Saving…';
    try{
      await loadPdfLib();
      const srcDoc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
      const outDoc = await PDFLib.PDFDocument.create();
      const pages = await outDoc.copyPages(srcDoc, order);
      pages.forEach(p=>outDoc.addPage(p));
      const outBytes = await outDoc.save();
      download('reordered.pdf', new Blob([outBytes],{type:'application/pdf'}));
      toast('Reordered PDF downloaded');
    }catch(e){ console.error(e); toast('Something went wrong — '+e.message); }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
}
function pdfPageNumbering(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to add page numbers');
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const optsHost = h('div',{style:'margin-top:14px;display:none;'}); body.appendChild(optsHost);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'},'Add numbers & download');
  actions.appendChild(runBtn); body.appendChild(actions);
  let file=null;
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, (files)=>{
    file=files[0];
    optsHost.style.display='block'; optsHost.innerHTML='';
    const posF = selectField('Position', [['bc','Bottom center'],['br','Bottom right'],['tr','Top right']], 'bc');
    const startF = numField('Start at', 1, 1, 9999);
    optsHost.appendChild(controlsRow(posF, startF));
    optsHost._posF=posF; optsHost._startF=startF;
    actions.style.display='flex';
  });
  runBtn.onclick = async ()=>{
    if(!file){ toast('Upload a PDF first'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Adding numbers…';
    try{
      await loadPdfLib();
      const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
      const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
      const start = parseInt(optsHost._startF.inp.value)||1;
      const pos = optsHost._posF.sel.value;
      doc.getPages().forEach((p,i)=>{
        const label = String(start+i);
        const size=10;
        const w = font.widthOfTextAtSize(label, size);
        const { width, height } = p.getSize();
        let x,y;
        if(pos==='bc'){ x=(width-w)/2; y=22; }
        else if(pos==='br'){ x=width-w-28; y=22; }
        else { x=width-w-28; y=height-32; }
        p.drawText(label, { x, y, size, font, color: PDFLib.rgb(0.25,0.27,0.31) });
      });
      const outBytes = await doc.save();
      download('numbered.pdf', new Blob([outBytes],{type:'application/pdf'}));
      toast('Page numbers added — file downloaded');
    }catch(e){ console.error(e); toast('Something went wrong — '+e.message); }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
}
function pdfWatermark(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to watermark');
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const optsHost = h('div',{style:'margin-top:14px;display:none;'}); body.appendChild(optsHost);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'},'Add watermark & download');
  actions.appendChild(runBtn); body.appendChild(actions);
  let file=null;
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, (files)=>{
    file=files[0];
    optsHost.style.display='block'; optsHost.innerHTML='';
    const textF = h('div',{class:'field'}, h('label',null,'Watermark text'), h('input',{type:'text', value:'CONFIDENTIAL'}));
    optsHost.appendChild(textF);
    const sizeF = numField('Font size', 60, 12, 200);
    const opF = numField('Opacity (0-1)', 0.15, 0.02, 1, 0.01);
    optsHost.appendChild(controlsRow(sizeF, opF));
    optsHost._textF=textF; optsHost._sizeF=sizeF; optsHost._opF=opF;
    actions.style.display='flex';
  });
  runBtn.onclick = async ()=>{
    if(!file){ toast('Upload a PDF first'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Stamping…';
    try{
      await loadPdfLib();
      const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
      const font = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      const text = optsHost._textF.querySelector('input').value || 'WATERMARK';
      const size = parseFloat(optsHost._sizeF.inp.value)||60;
      const opacity = parseFloat(optsHost._opF.inp.value)||0.15;
      doc.getPages().forEach(p=>{
        const { width, height } = p.getSize();
        const w = font.widthOfTextAtSize(text, size);
        p.drawText(text, { x:(width-w)/2, y:height/2, size, font, color:PDFLib.rgb(0.1,0.1,0.1), opacity, rotate:PDFLib.degrees(45) });
      });
      const outBytes = await doc.save();
      download('watermarked.pdf', new Blob([outBytes],{type:'application/pdf'}));
      toast('Watermarked PDF downloaded');
    }catch(e){ console.error(e); toast('Something went wrong — '+e.message); }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
}
function pdfProtect(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to add a password');
  body.appendChild(h('div',{class:'callout warn', style:'margin-bottom:14px;'},
    'pdf-lib (which powers the rest of this category) can\'t encrypt PDFs, so this works differently: each page is rendered as a high-resolution image and rebuilt into a new, genuinely password-protected PDF using standard PDF encryption. The trade-off is the output is image-based — text will no longer be selectable or searchable. For most "just keep this private" use cases that\'s a fine trade; for a document you still need to edit or search, protect a copy instead.'));
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const optsHost = h('div',{style:'margin-top:14px;display:none;'}); body.appendChild(optsHost);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'},'Protect & download');
  actions.appendChild(runBtn); body.appendChild(actions);
  let file=null;
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, (files)=>{
    file=files[0];
    optsHost.style.display='block'; optsHost.innerHTML='';
    const pwF = h('div',{class:'field'}, h('label',null,'Password'), h('input',{type:'password', placeholder:'Choose a password'}));
    const pw2F = h('div',{class:'field'}, h('label',null,'Confirm password'), h('input',{type:'password', placeholder:'Retype the password'}));
    optsHost.append(pwF, pw2F);
    optsHost._pwF=pwF; optsHost._pw2F=pw2F;
    actions.style.display='flex';
  });
  runBtn.onclick = async ()=>{
    if(!file){ toast('Upload a PDF first'); return; }
    const pw = optsHost._pwF.querySelector('input').value;
    const pw2 = optsHost._pw2F.querySelector('input').value;
    if(!pw){ toast('Enter a password'); return; }
    if(pw!==pw2){ toast('Passwords don\'t match'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Encrypting… (this can take a moment)';
    try{
      await loadPdfJs();
      const buf = await file.arrayBuffer();
      // eslint-disable-next-line no-undef
      const srcDoc = await pdfjsLib.getDocument({data:buf}).promise;
      const pageImages = [];
      for(let i=1;i<=srcDoc.numPages;i++){
        const page = await srcDoc.getPage(i);
        const unitVp = page.getViewport({scale:1});
        const renderVp = page.getViewport({scale:2});
        const canvas = document.createElement('canvas');
        canvas.width=renderVp.width; canvas.height=renderVp.height;
        await page.render({canvasContext:canvas.getContext('2d'), viewport:renderVp}).promise;
        pageImages.push({ dataUrl: canvas.toDataURL('image/jpeg',0.87), w:unitVp.width, h:unitVp.height });
      }
      await loadJsPdfLib();
      // eslint-disable-next-line no-undef
      const { jsPDF } = window.jspdf;
      const first = pageImages[0];
      const outDoc = new jsPDF({
        unit:'pt', format:[first.w,first.h],
        encryption: { userPassword: pw, ownerPassword: pw+'-owner', userPermissions:['print'] }
      });
      pageImages.forEach((p,i)=>{
        if(i>0) outDoc.addPage([p.w,p.h]);
        outDoc.addImage(p.dataUrl,'JPEG',0,0,p.w,p.h);
      });
      download('protected.pdf', outDoc.output('blob'), 'application/pdf');
      toast('Password-protected PDF downloaded');
    }catch(e){ console.error(e); toast('Could not protect this PDF — '+e.message); }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
}
function pdfUnlock(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to remove owner-level locks');
  body.appendChild(h('div',{class:'callout warn', style:'margin-bottom:14px;'},
    'This removes owner-password restrictions (printing/editing/copying locks) from a PDF that opens without a password. It genuinely cannot unlock a PDF that requires a password just to open — no tool running only in your browser can do that without knowing the password, since that would mean the encryption wasn\'t doing its job. If your file prompts for a password to view it at all, this won\'t work.'));
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'},'Remove locks & download');
  actions.appendChild(runBtn); body.appendChild(actions);
  let file=null;
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, (files)=>{ file=files[0]; actions.style.display='flex'; });
  runBtn.onclick = async ()=>{
    if(!file){ toast('Upload a PDF first'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Removing locks…';
    try{
      await loadPdfLib();
      const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
      const outBytes = await doc.save();
      download('unlocked.pdf', new Blob([outBytes],{type:'application/pdf'}));
      toast('Locks removed — file downloaded');
    }catch(e){
      console.error(e);
      toast('Could not process this file — it may require a password just to open, which this tool can\'t bypass.');
    }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
}
function pdfMetadataViewer(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to inspect its metadata');
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const statsWrap = h('div',{class:'stat-list', style:'margin-top:16px;display:none;'}); body.appendChild(statsWrap);
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, async (files)=>{
    const file=files[0];
    try{
      await loadPdfLib();
      const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
      const rows = [
        ['Title', doc.getTitle()||'—'], ['Author', doc.getAuthor()||'—'], ['Subject', doc.getSubject()||'—'],
        ['Keywords', (doc.getKeywords()||'')||'—'], ['Creator', doc.getCreator()||'—'], ['Producer', doc.getProducer()||'—'],
        ['Pages', doc.getPageCount()], ['File size', fmtBytes(file.size)],
      ];
      statsWrap.style.display='grid'; statsWrap.innerHTML='';
      rows.forEach(([l,v])=>statsWrap.appendChild(h('div',{class:'item'},h('b',null,String(v)),h('span',null,l))));
    }catch(e){ toast('Could not read this PDF — '+e.message); }
  });
}
function pdfMetadataRemover(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to strip its metadata');
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'},'Clean & download');
  actions.appendChild(runBtn); body.appendChild(actions);
  let file=null;
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, (files)=>{ file=files[0]; actions.style.display='flex'; });
  runBtn.onclick = async ()=>{
    if(!file){ toast('Upload a PDF first'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Cleaning…';
    try{
      await loadPdfLib();
      const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
      doc.setTitle(''); doc.setAuthor(''); doc.setSubject(''); doc.setKeywords([]); doc.setProducer(''); doc.setCreator('');
      const outBytes = await doc.save();
      download('cleaned.pdf', new Blob([outBytes],{type:'application/pdf'}));
      toast('Metadata removed — file downloaded');
    }catch(e){ console.error(e); toast('Something went wrong — '+e.message); }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
}
function pdfSizeAnalyzer(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to analyze its size');
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const statsWrap = h('div',{class:'stat-list', style:'margin-top:16px;display:none;'}); body.appendChild(statsWrap);
  const note = h('div',{class:'callout', style:'margin-top:14px;display:none;'}); body.appendChild(note);
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, async (files)=>{
    const file=files[0];
    try{
      await loadPdfLib();
      const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
      const pages = doc.getPageCount();
      const avg = file.size/Math.max(1,pages);
      statsWrap.style.display='grid'; statsWrap.innerHTML='';
      [['File size', fmtBytes(file.size)],['Pages', pages],['Avg. per page', fmtBytes(avg)]].forEach(([l,v])=>statsWrap.appendChild(h('div',{class:'item'},h('b',null,String(v)),h('span',null,l))));
      note.style.display='block';
      note.textContent = avg>400000 ? 'High size-per-page — this PDF likely contains large, uncompressed images. Try PDF Compress.' : 'This looks like a reasonably efficient PDF for its page count.';
    }catch(e){ toast('Could not read this PDF — '+e.message); }
  });
}
function pdfCompress(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to optimize');
  body.appendChild(h('div',{class:'callout', style:'margin-bottom:14px;'},'This re-packs the PDF\'s internal structure and strips metadata to shave off size. It can\'t recompress already-embedded images the way a dedicated image codec can — for image-heavy PDFs, expect a modest reduction, not a dramatic one.'));
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const statsWrap = h('div',{class:'stat-list', style:'margin-top:16px;display:none;'}); body.appendChild(statsWrap);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'},'Compress & download');
  actions.appendChild(runBtn); body.appendChild(actions);
  let file=null;
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, (files)=>{ file=files[0]; actions.style.display='flex'; });
  runBtn.onclick = async ()=>{
    if(!file){ toast('Upload a PDF first'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Compressing…';
    try{
      await loadPdfLib();
      const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true});
      doc.setTitle(''); doc.setAuthor(''); doc.setSubject(''); doc.setKeywords([]); doc.setProducer(''); doc.setCreator('');
      const outBytes = await doc.save({ useObjectStreams:true });
      statsWrap.style.display='grid'; statsWrap.innerHTML='';
      const pct = Math.max(0, Math.round((1 - outBytes.length/file.size)*100));
      [['Original', fmtBytes(file.size)],['Optimized', fmtBytes(outBytes.length)],['Reduced by', pct+'%']].forEach(([l,v])=>statsWrap.appendChild(h('div',{class:'item'},h('b',null,String(v)),h('span',null,l))));
      download('compressed.pdf', new Blob([outBytes],{type:'application/pdf'}));
      toast('Optimized PDF downloaded');
    }catch(e){ console.error(e); toast('Something went wrong — '+e.message); }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
}
function imagesToPdf(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload images to combine into a PDF');
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const listHost = h('div',{style:'margin-top:14px;display:none;'}); body.appendChild(listHost);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'},'Create PDF & download');
  actions.appendChild(runBtn); body.appendChild(actions);
  let files = [];
  fileDropzone(uploadWrap, {accept:'image/jpeg,image/png', multiple:true, label:'Click to upload or drag & drop JPG/PNG images', hint:'One page per image, in the order added'}, (newFiles)=>{
    files = files.concat(newFiles); renderList(); actions.style.display='flex';
  });
  function renderList(){
    listHost.style.display='block'; listHost.innerHTML='';
    files.forEach((f,i)=>{
      const row = h('div',{style:'display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);'});
      row.append(h('span',{style:'flex:1;font-size:13.5px;'}, (i+1)+'. '+f.name), h('span',{style:'font-size:12px;color:var(--muted);'}, fmtBytes(f.size)));
      const rm = h('button',{class:'btn btn-ghost btn-sm', type:'button'}, '✕');
      rm.onclick=()=>{ files.splice(i,1); renderList(); };
      row.appendChild(rm);
      listHost.appendChild(row);
    });
  }
  runBtn.onclick = async ()=>{
    if(!files.length){ toast('Add at least one image'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Building PDF…';
    try{
      await loadPdfLib();
      const doc = await PDFLib.PDFDocument.create();
      for(const f of files){
        const bytes = await f.arrayBuffer();
        const isPng = f.type==='image/png' || f.name.toLowerCase().endsWith('.png');
        const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, {x:0,y:0,width:img.width,height:img.height});
      }
      const outBytes = await doc.save();
      download('images.pdf', new Blob([outBytes],{type:'application/pdf'}));
      toast('PDF created — file downloaded');
    }catch(e){ console.error(e); toast('Could not build the PDF — '+e.message); }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
}
function textToPdf(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Turn plain text into a PDF');
  const ta = h('textarea',{rows:12, placeholder:'Type or paste your text here…'});
  body.append(h('label',{style:'font-size:12.5px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;'},'Text'), ta);
  const actions = h('div',{class:'ws-actions'});
  const runBtn = h('button',{class:'btn btn-primary btn-sm'},'Create PDF & download');
  actions.appendChild(runBtn); body.appendChild(actions);
  runBtn.onclick = async ()=>{
    if(!ta.value.trim()){ toast('Type some text first'); return; }
    const orig=runBtn.textContent; runBtn.disabled=true; runBtn.textContent='Building PDF…';
    try{
      await loadPdfLib();
      const doc = await PDFLib.PDFDocument.create();
      const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
      const size=11, lineHeight=15, margin=50, pageW=595.28, pageH=841.89;
      const maxWidth = pageW - margin*2;
      const paragraphs = ta.value.split('\n');
      const lines = [];
      paragraphs.forEach(para=>{
        if(para.trim()===''){ lines.push(''); return; }
        const words = para.split(' ');
        let cur='';
        words.forEach(w=>{
          const test = cur ? cur+' '+w : w;
          if(font.widthOfTextAtSize(test, size) > maxWidth){ lines.push(cur); cur=w; }
          else cur=test;
        });
        if(cur) lines.push(cur);
      });
      let page = doc.addPage([pageW,pageH]);
      let y = pageH - margin;
      lines.forEach(line=>{
        if(y < margin){ page = doc.addPage([pageW,pageH]); y = pageH - margin; }
        page.drawText(line, {x:margin, y, size, font, color:PDFLib.rgb(0.08,0.09,0.1)});
        y -= lineHeight;
      });
      const outBytes = await doc.save();
      download('document.pdf', new Blob([outBytes],{type:'application/pdf'}));
      toast('PDF created — file downloaded');
    }catch(e){ console.error(e); toast('Something went wrong — '+e.message); }
    runBtn.disabled=false; runBtn.textContent=orig;
  };
}
function pdfToText(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to extract its text');
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const outBox = h('div',{class:'result-box empty', style:'margin-top:16px;max-height:340px;overflow:auto;'}, 'Extracted text will appear here.'); body.appendChild(outBox);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const copyBtn = h('button',{class:'btn btn-secondary btn-sm'},'Copy text');
  const dlBtn = h('button',{class:'btn btn-secondary btn-sm'},'Download .txt');
  actions.append(copyBtn, dlBtn); body.appendChild(actions);
  let extracted='';
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, async (files)=>{
    const file=files[0];
    outBox.className='result-box'; outBox.textContent='Extracting text…';
    try{
      await loadPdfJs();
      const buf = await file.arrayBuffer();
      // eslint-disable-next-line no-undef
      const doc = await pdfjsLib.getDocument({data:buf}).promise;
      let text = '';
      for(let i=1;i<=doc.numPages;i++){
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it=>it.str).join(' ') + '\n\n--- Page '+i+' ---\n\n';
      }
      extracted = text.trim();
      outBox.textContent = extracted || 'No extractable text found (this PDF may be scanned images).';
      actions.style.display='flex';
    }catch(e){ console.error(e); outBox.textContent='Could not extract text — '+e.message; }
  });
  copyBtn.onclick=()=>copyText(extracted, 'Text copied');
  dlBtn.onclick=()=>{ if(!extracted){ toast('Nothing to download yet'); return; } download('extracted.txt', extracted); };
}
function pdfToImageMaker(format){ return function(ws,tool){
  const body = pdfWorkspaceShell(ws, 'Upload a PDF to convert pages to '+format.toUpperCase());
  const uploadWrap = h('div'); body.appendChild(uploadWrap);
  const grid = h('div',{class:'tool-grid', style:'margin-top:16px;'}); body.appendChild(grid);
  const actions = h('div',{class:'ws-actions', style:'display:none;'});
  const dlAllBtn = h('button',{class:'btn btn-primary btn-sm'},'Download all as .zip');
  actions.appendChild(dlAllBtn); body.appendChild(actions);
  let pageBlobs = [];
  fileDropzone(uploadWrap, {accept:'application/pdf', label:'Click to upload or drag & drop a PDF'}, async (files)=>{
    const file=files[0];
    grid.innerHTML=''; pageBlobs=[]; actions.style.display='none';
    toast('Rendering pages…');
    try{
      await loadPdfJs();
      const buf = await file.arrayBuffer();
      // eslint-disable-next-line no-undef
      const doc = await pdfjsLib.getDocument({data:buf}).promise;
      for(let i=1;i<=doc.numPages;i++){
        const page = await doc.getPage(i);
        const viewport = page.getViewport({scale:1.5});
        const canvas = document.createElement('canvas');
        canvas.width=viewport.width; canvas.height=viewport.height;
        await page.render({canvasContext:canvas.getContext('2d'), viewport}).promise;
        const mime = format==='png' ? 'image/png' : 'image/jpeg';
        await new Promise(res=>canvas.toBlob(blob=>{
          pageBlobs.push({name:`page-${i}.${format}`, blob});
          const card = h('div',{class:'card', style:'padding:10px;text-align:center;'});
          const img = document.createElement('img'); img.src=URL.createObjectURL(blob); img.style.width='100%'; img.style.borderRadius='6px'; img.style.marginBottom='8px';
          const btn = h('button',{class:'btn btn-secondary btn-sm'},'Download page '+i);
          btn.onclick=()=>download(`page-${i}.${format}`, blob, mime);
          card.append(img, btn);
          grid.appendChild(card);
          res();
        }, mime, 0.92));
      }
      if(pageBlobs.length) actions.style.display='flex';
      toast('Done rendering '+pageBlobs.length+' page(s)');
    }catch(e){ console.error(e); toast('Could not render this PDF — '+e.message); }
  });
  dlAllBtn.onclick = async ()=>{
    if(!pageBlobs.length) return;
    await loadJsZip();
    const zip = new JSZip();
    pageBlobs.forEach(p=>zip.file(p.name, p.blob));
    const blob = await zip.generateAsync({type:'blob'});
    download('pdf-pages.zip', blob, 'application/zip');
  };
};}

/* ---- Color & Design (10 tools) ---- */
function colorSwatchPreview(hex){ return h('div',{style:`width:100%;height:64px;border-radius:8px;background:${hex};border:1px solid var(--line);margin-bottom:12px;`}); }
function hexToRgbTool(ws,tool){ renderTextTool(ws,tool,{
  toolbarLabel:'Enter a HEX color', placeholder:'#1F6F78', outputLabel:'RGB value',
  transform(v){ const rgb=hexToRgb(v.trim()); if(!rgb) throw new Error('Enter a valid HEX color like #1F6F78.'); return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`; }
});}
function rgbToHexTool(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Enter RGB values'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const row=h('div',{class:'field-row'});
  const rF=numField('R',31,0,255), gF=numField('G',111,0,255), bF=numField('B',120,0,255);
  row.append(rF.wrap,gF.wrap,bF.wrap); body.appendChild(row);
  const preview=h('div'); body.appendChild(preview);
  const out=h('div',{class:'big-result', style:'margin-top:12px;'}); body.appendChild(out);
  function run(){ const hex=rgbToHex(rF.inp.value,gF.inp.value,bF.inp.value); preview.innerHTML=''; preview.appendChild(colorSwatchPreview(hex)); out.textContent=hex.toUpperCase(); }
  [rF,gF,bF].forEach(f=>f.inp.addEventListener('input', debounce(run,80)));
  run();
}
function hexToHslTool(ws,tool){ renderTextTool(ws,tool,{
  toolbarLabel:'Enter a HEX color', placeholder:'#1F6F78', outputLabel:'HSL value',
  transform(v){ const rgb=hexToRgb(v.trim()); if(!rgb) throw new Error('Enter a valid HEX color like #1F6F78.'); const hsl=rgbToHsl(rgb.r,rgb.g,rgb.b); return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`; }
});}
function hslToHexTool(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Enter HSL values'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const row=h('div',{class:'field-row'});
  const hF=numField('H (0-360)',185,0,360), sF=numField('S (0-100)',70,0,100), lF=numField('L (0-100)',30,0,100);
  row.append(hF.wrap,sF.wrap,lF.wrap); body.appendChild(row);
  const preview=h('div'); body.appendChild(preview);
  const out=h('div',{class:'big-result', style:'margin-top:12px;'}); body.appendChild(out);
  function run(){ const {r,g,b}=hslToRgb(hF.inp.value,sF.inp.value,lF.inp.value); const hex=rgbToHex(r,g,b); preview.innerHTML=''; preview.appendChild(colorSwatchPreview(hex)); out.textContent=hex.toUpperCase(); }
  [hF,sF,lF].forEach(f=>f.inp.addEventListener('input', debounce(run,80)));
  run();
}
function colorPicker(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Pick a color'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const inp=h('input',{type:'color', value:'#1F6F78'});
  body.appendChild(inp);
  const preview=h('div',{style:'margin-top:14px;'}); body.appendChild(preview);
  const stats=h('div',{class:'stat-list', style:'margin-top:12px;'}); body.appendChild(stats);
  function run(){
    const hex=inp.value; const rgb=hexToRgb(hex); const hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);
    preview.innerHTML=''; preview.appendChild(colorSwatchPreview(hex));
    stats.innerHTML='';
    [['HEX',hex.toUpperCase()],['RGB',`${rgb.r}, ${rgb.g}, ${rgb.b}`],['HSL',`${hsl.h}, ${hsl.s}%, ${hsl.l}%`]].forEach(([l,v])=>{
      const item=h('div',{class:'item', style:'cursor:pointer;'}); item.append(h('b',null,v), h('span',null,l));
      item.onclick=()=>copyText(v,l+' copied');
      stats.appendChild(item);
    });
  }
  inp.addEventListener('input', run); run();
}
function colorContrastChecker(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Check WCAG contrast'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const row=h('div',{class:'field-row'});
  const fgF=h('div',{class:'field',style:'margin:0;'}, h('label',null,'Text color'), h('input',{type:'color',value:'#14161A'}));
  const bgF=h('div',{class:'field',style:'margin:0;'}, h('label',null,'Background color'), h('input',{type:'color',value:'#F6F5F1'}));
  row.append(fgF,bgF); body.appendChild(row);
  const preview=h('div',{style:'margin-top:14px;padding:24px;border-radius:8px;border:1px solid var(--line);text-align:center;font-size:18px;font-weight:600;'},'Sample text preview');
  body.appendChild(preview);
  const out=h('div',{class:'stat-list', style:'margin-top:14px;'}); body.appendChild(out);
  function run(){
    const fg=fgF.querySelector('input').value, bg=bgF.querySelector('input').value;
    preview.style.color=fg; preview.style.background=bg;
    const ratio=contrastRatio(fg,bg);
    const passAA = ratio>=4.5, passAAA = ratio>=7, passAALarge = ratio>=3;
    out.innerHTML='';
    [['Contrast ratio', ratio.toFixed(2)+':1'],['AA (normal text)', passAA?'Pass':'Fail'],['AA (large text)', passAALarge?'Pass':'Fail'],['AAA (normal text)', passAAA?'Pass':'Fail']]
      .forEach(([l,v])=>out.appendChild(h('div',{class:'item'}, h('b',{style: (v==='Pass'?'color:var(--success);':v==='Fail'?'color:var(--danger);':'')}, v), h('span',null,l))));
  }
  [fgF,bgF].forEach(f=>f.querySelector('input').addEventListener('input', run));
  run();
}
function paletteExtractor(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Upload an image to extract colors'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const uploadWrap=h('div'); body.appendChild(uploadWrap);
  const swatches=h('div',{style:'display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;'}); body.appendChild(swatches);
  imageDropzone(uploadWrap, file=>{
    loadImageFile(file).then(({img})=>{
      const c=document.createElement('canvas'); const size=80; c.width=size; c.height=size;
      const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,size,size);
      const data=ctx.getImageData(0,0,size,size).data;
      const buckets={};
      for(let i=0;i<data.length;i+=4){
        const r=Math.round(data[i]/32)*32, g=Math.round(data[i+1]/32)*32, b=Math.round(data[i+2]/32)*32;
        const key=r+','+g+','+b; buckets[key]=(buckets[key]||0)+1;
      }
      const top = Object.entries(buckets).sort((a,b)=>b[1]-a[1]).slice(0,6);
      swatches.innerHTML='';
      top.forEach(([key])=>{
        const [r,g,b]=key.split(',').map(Number); const hex=rgbToHex(r,g,b);
        const card=h('div',{style:'text-align:center;'});
        const box=h('div',{style:`width:70px;height:70px;border-radius:8px;background:${hex};border:1px solid var(--line);cursor:pointer;`});
        box.onclick=()=>copyText(hex, hex+' copied');
        card.append(box, h('div',{style:'font-size:11.5px;margin-top:6px;font-family:var(--font-mono);'}, hex));
        swatches.appendChild(card);
      });
    });
  });
}
function gradientGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Design a CSS gradient'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const row=h('div',{class:'field-row'});
  const typeF=selectField('Type',[['linear','Linear'],['radial','Radial']],'linear');
  const angF=numField('Angle (°)', 135, 0, 360);
  const c1F=h('div',{class:'field',style:'margin:0;'}, h('label',null,'Color 1'), h('input',{type:'color',value:'#1F6F78'}));
  const c2F=h('div',{class:'field',style:'margin:0;'}, h('label',null,'Color 2'), h('input',{type:'color',value:'#C6742B'}));
  row.append(typeF.wrap, angF.wrap, c1F, c2F); body.appendChild(row);
  const preview=h('div',{style:'height:160px;border-radius:10px;margin-top:16px;border:1px solid var(--line);'}); body.appendChild(preview);
  const out=h('div',{class:'result-box', style:'margin-top:14px;'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy CSS'); actions.appendChild(copyBtn); body.appendChild(actions);
  function run(){
    const c1=c1F.querySelector('input').value, c2=c2F.querySelector('input').value;
    const css = typeF.sel.value==='linear' ? `linear-gradient(${angF.inp.value}deg, ${c1}, ${c2})` : `radial-gradient(circle, ${c1}, ${c2})`;
    preview.style.background=css; out.textContent = 'background: '+css+';';
    angF.wrap.style.display = typeF.sel.value==='linear' ? 'flex':'none';
  }
  [typeF.sel, angF.inp].forEach(el=>el.addEventListener('input', debounce(run,60)));
  [c1F,c2F].forEach(f=>f.querySelector('input').addEventListener('input', run));
  copyBtn.onclick=()=>copyText(out.textContent,'CSS copied');
  run();
}
function cssBoxShadowGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Design a box-shadow'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const row=h('div',{class:'field-row'});
  const xF=numField('X offset',0,-60,60), yF=numField('Y offset',8,-60,60), blurF=numField('Blur',24,0,120), spreadF=numField('Spread',-4,-60,60);
  row.append(xF.wrap,yF.wrap,blurF.wrap,spreadF.wrap); body.appendChild(row);
  const row2=h('div',{class:'field-row', style:'margin-top:12px;'});
  const colorF=h('div',{class:'field',style:'margin:0;'}, h('label',null,'Color'), h('input',{type:'color',value:'#14161A'}));
  const opF=numField('Opacity (0-1)', 0.25, 0,1,0.05);
  const insetF=checkField('Inset', false);
  row2.append(colorF, opF.wrap, insetF.wrap); body.appendChild(row2);
  const preview=h('div',{style:'height:140px;margin-top:24px;display:flex;align-items:center;justify-content:center;'});
  const box=h('div',{style:'width:160px;height:80px;border-radius:10px;background:var(--panel);border:1px solid var(--line);'});
  preview.appendChild(box); body.appendChild(preview);
  const out=h('div',{class:'result-box'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy CSS'); actions.appendChild(copyBtn); body.appendChild(actions);
  function run(){
    const rgb=hexToRgb(colorF.querySelector('input').value);
    const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opF.inp.value})`;
    const css = `${insetF.inp.checked?'inset ':''}${xF.inp.value}px ${yF.inp.value}px ${blurF.inp.value}px ${spreadF.inp.value}px ${rgba}`;
    box.style.boxShadow = css;
    out.textContent = 'box-shadow: '+css+';';
  }
  [xF,yF,blurF,spreadF,opF].forEach(f=>f.inp.addEventListener('input', debounce(run,60)));
  colorF.querySelector('input').addEventListener('input', run);
  insetF.inp.addEventListener('change', run);
  copyBtn.onclick=()=>copyText(out.textContent,'CSS copied');
  run();
}
function cssBorderRadiusGenerator(ws,tool){
  const toolbar=h('div',{class:'ws-toolbar'}, h('strong',null,'Design custom corners'));
  const body=h('div',{class:'ws-body'}); ws.append(toolbar,body);
  const row=h('div',{class:'field-row'});
  const tl=numField('Top-left',24,0,200), tr=numField('Top-right',8,0,200), br=numField('Bottom-right',24,0,200), bl=numField('Bottom-left',8,0,200);
  row.append(tl.wrap,tr.wrap,br.wrap,bl.wrap); body.appendChild(row);
  const preview=h('div',{style:'height:160px;margin-top:20px;display:flex;align-items:center;justify-content:center;'});
  const box=h('div',{style:'width:180px;height:100px;background:var(--accent-soft);border:2px solid var(--accent);'});
  preview.appendChild(box); body.appendChild(preview);
  const out=h('div',{class:'result-box'}); body.appendChild(out);
  const actions=h('div',{class:'ws-actions'}); const copyBtn=h('button',{class:'btn btn-secondary btn-sm'},'Copy CSS'); actions.appendChild(copyBtn); body.appendChild(actions);
  function run(){
    const css = `${tl.inp.value}px ${tr.inp.value}px ${br.inp.value}px ${bl.inp.value}px`;
    box.style.borderRadius = css;
    out.textContent = 'border-radius: '+css+';';
  }
  [tl,tr,br,bl].forEach(f=>f.inp.addEventListener('input', debounce(run,60)));
  copyBtn.onclick=()=>copyText(out.textContent,'CSS copied');
  run();
}

/* =========================================================================
   11. DISPATCH — maps every LIVE tool id to its implementation.
   Anything not listed here (and in SOON above) is genuinely not built yet.
   ========================================================================= */
const DISPATCH = {
  // PDF & Documents
  'pdf-merge': pdfMerge, 'pdf-split': pdfSplit, 'pdf-compress': pdfCompress,
  'pdf-to-jpg': pdfToImageMaker('jpg'), 'pdf-to-png': pdfToImageMaker('png'),
  'jpg-to-pdf': imagesToPdf, 'png-to-pdf': imagesToPdf,
  'pdf-to-text': pdfToText, 'text-to-pdf': textToPdf, 'pdf-rotate': pdfRotate,
  'pdf-extract-pages': pdfExtractOrDelete('extract'), 'pdf-delete-pages': pdfExtractOrDelete('delete'),
  'pdf-reorder-pages': pdfReorderPages, 'pdf-page-numbering': pdfPageNumbering, 'pdf-watermark': pdfWatermark,
  'pdf-metadata-viewer': pdfMetadataViewer, 'pdf-metadata-remover': pdfMetadataRemover, 'pdf-size-analyzer': pdfSizeAnalyzer,
  'pdf-protect': pdfProtect, 'pdf-unlock': pdfUnlock,
  // Image
  'image-resize': imgResize, 'image-crop': imgCrop, 'image-rotate': imgRotate, 'image-flip': imgFlip,
  'image-converter': imgConvertMaker(null), 'jpg-to-png': imgConvertMaker('png'), 'png-to-jpg': imgConvertMaker('jpg'),
  'webp-to-jpg': imgConvertMaker('jpg'), 'jpg-to-webp': imgConvertMaker('webp'), 'png-to-webp': imgConvertMaker('webp'),
  'webp-to-png': imgConvertMaker('png'), 'image-compress': imgCompress, 'image-to-base64': imgToBase64,
  'base64-to-image': base64ToImage, 'image-grayscale': imgGrayscale, 'image-blur': imgBlur, 'image-pixelate': imgPixelate,
  'image-quality-analyzer': imgQualityAnalyzer, 'image-dimensions-viewer': imgDimensions, 'favicon-generator': faviconGenerator,
  // Text
  'word-counter': wordCounter, 'character-counter': characterCounter, 'sentence-counter': sentenceCounter,
  'paragraph-counter': paragraphCounter, 'reading-time-calculator': readingTimeCalculator,
  'case-converter': caseConverterMaker('all'), 'uppercase-converter': caseConverterMaker('upper'),
  'lowercase-converter': caseConverterMaker('lower'), 'title-case-converter': caseConverterMaker('title'),
  'remove-duplicate-lines': removeDuplicateLines, 'remove-extra-spaces': removeExtraSpaces,
  'text-sorter': textSorter, 'text-reverser': textReverser, 'slug-generator': slugGenerator,
  'lorem-ipsum-generator': loremIpsumGenerator,
  // Dev
  'json-formatter': jsonFormatter, 'json-validator': jsonValidator, 'json-minifier': jsonMinifier,
  'xml-formatter': xmlFormatter, 'xml-validator': xmlValidator, 'html-formatter': htmlFormatter,
  'css-formatter': cssFormatter, 'javascript-formatter': jsFormatter, 'html-minifier': htmlMinifier,
  'css-minifier': cssMinifier, 'javascript-minifier': jsMinifier, 'base64-encoder': base64Encoder,
  'base64-decoder': base64Decoder, 'url-encoder': urlEncoder, 'url-decoder': urlDecoder,
  'uuid-generator': uuidGenerator, 'jwt-decoder': jwtDecoder, 'regex-tester': regexTester,
  'unix-timestamp-converter': unixTimestampConverter, 'hash-generator': hashGenerator,
  // Calculators
  'percentage-calculator': percentageCalculator, 'percentage-change-calculator': percentageChangeCalculator,
  'average-calculator': averageCalculator, 'ratio-calculator': ratioCalculator, 'age-calculator': ageCalculator,
  'date-difference-calculator': dateDifferenceCalculator, 'time-difference-calculator': timeDifferenceCalculator,
  'bmi-calculator': bmiCalculator, 'bmr-calculator': bmrCalculator, 'calorie-calculator': calorieCalculator,
  'discount-calculator': discountCalculator, 'tip-calculator': tipCalculator, 'loan-calculator': loanCalculator,
  'mortgage-calculator': mortgageCalculator, 'compound-interest-calculator': compoundInterestCalculator,
  'simple-interest-calculator': simpleInterestCalculator, 'profit-margin-calculator': profitMarginCalculator,
  'markup-calculator': markupCalculator, 'salary-calculator': salaryCalculator, 'unit-converter': unitConverter,
  // SEO
  'meta-title-generator': metaTitleGenerator, 'meta-description-generator': metaDescriptionGenerator,
  'open-graph-generator': openGraphGenerator, 'robots-txt-generator': robotsTxtGenerator,
  'xml-sitemap-generator': xmlSitemapGenerator, 'keyword-density-checker': keywordDensityChecker,
  'serp-snippet-preview': serpSnippetPreview, 'canonical-tag-generator': canonicalTagGenerator,
  'hreflang-generator': hreflangGenerator, 'schema-markup-generator': schemaMarkupGenerator,
  'url-parser': urlParser, 'utm-builder': utmBuilder, 'keyword-suggestion-generator': keywordSuggestionGenerator,
  // Finance
  'roi-calculator': roiCalculator, 'roas-calculator': roasCalculator, 'revenue-calculator': revenueCalculator,
  'gross-profit-calculator': grossProfitCalculator, 'net-profit-calculator': netProfitCalculator,
  'break-even-calculator': breakEvenCalculator, 'vat-calculator': vatCalculator, 'sales-tax-calculator': salesTaxCalculator,
  'commission-calculator': commissionCalculator, 'invoice-generator': invoiceGenerator, 'quote-generator': quoteGenerator,
  'pricing-calculator': pricingCalculator, 'business-loan-calculator': businessLoanCalculator,
  'savings-calculator': savingsCalculator, 'investment-return-calculator': investmentReturnCalculator,
  // Generators
  'qr-code-generator': qrCodeGenerator, 'password-generator': passwordGenerator, 'username-generator': usernameGenerator,
  'random-number-generator': randomNumberGenerator, 'random-string-generator': randomStringGenerator,
  'barcode-generator': barcodeGenerator, 'color-palette-generator': colorPaletteGenerator,
  'fake-data-generator': fakeDataGenerator, 'name-generator': nameGenerator, 'business-name-generator': businessNameGenerator,
  'email-subject-generator': emailSubjectGenerator, 'pin-generator': pinGenerator,
  // Color
  'hex-to-rgb': hexToRgbTool, 'rgb-to-hex': rgbToHexTool, 'hex-to-hsl': hexToHslTool, 'hsl-to-hex': hslToHexTool,
  'color-picker': colorPicker, 'color-contrast-checker': colorContrastChecker, 'palette-extractor': paletteExtractor,
  'gradient-generator': gradientGenerator, 'css-box-shadow-generator': cssBoxShadowGenerator,
  'css-border-radius-generator': cssBorderRadiusGenerator,
};

/* ---------------------------------------------------------------------
   12. Integrity check (dev-time sanity, silent in production use) —
   confirms every non-SOON tool actually has a dispatcher, and logs any
   mismatch instead of silently showing a broken page.
   ------------------------------------------------------------------- */
(function integrityCheck(){
  const missing = TOOLS.filter(t=>!SOON.has(t.id) && !DISPATCH[t.id]);
  if(missing.length) console.warn('Toolworks: missing implementation for', missing.map(t=>t.id));
})();

export {
  CATEGORIES,
  CAT_BY_KEY,
  CAT_FEATURES,
  CAT_HOWTO,
  DISPATCH,
  KW_COUNTRIES,
  KW_LANGS,
  NAME_FIRST,
  NAME_LAST,
  PLATFORM_META,
  RAW_TOOLS,
  SOON,
  SOON_REASON,
  TOOLS,
  TOOL_BY_SLUG,
  UNIT_GROUPS,
  ageCalculator,
  averageCalculator,
  barcodeGenerator,
  base64Decoder,
  base64Encoder,
  base64ToImage,
  basicIndent,
  bmiCalculator,
  bmrCalculator,
  breakEvenCalculator,
  businessLoanCalculator,
  businessNameGenerator,
  calorieCalculator,
  canonicalTagGenerator,
  caseConverterMaker,
  characterCounter,
  checkField,
  clamp,
  colorContrastChecker,
  colorPaletteGenerator,
  colorPicker,
  colorSwatchPreview,
  commissionCalculator,
  compoundInterestCalculator,
  contrastRatio,
  controlsRow,
  convertUnit,
  copyText,
  countWords,
  cssBorderRadiusGenerator,
  cssBoxShadowGenerator,
  cssFormatter,
  cssMinifier,
  dateDifferenceCalculator,
  debounce,
  discountCalculator,
  download,
  drawFit,
  emailSubjectGenerator,
  esc,
  fakeDataGenerator,
  faviconGenerator,
  fileDropzone,
  fmtBytes,
  fmtNum,
  genFaq,
  genFeatures,
  genHowTo,
  gradientGenerator,
  grossProfitCalculator,
  h,
  hashGenerator,
  hexToHslTool,
  hexToRgb,
  hexToRgbTool,
  hreflangGenerator,
  hslToHexTool,
  hslToRgb,
  htmlFormatter,
  htmlMinifier,
  imageDropzone,
  imagesToPdf,
  imgBlur,
  imgCompress,
  imgConvertMaker,
  imgCrop,
  imgDimensions,
  imgFlip,
  imgGrayscale,
  imgPixelate,
  imgQualityAnalyzer,
  imgResize,
  imgRotate,
  imgToBase64,
  investmentReturnCalculator,
  invoiceGenerator,
  isLive,
  jsFormatter,
  jsMinifier,
  jsonFormatter,
  jsonMinifier,
  jsonValidator,
  jwtDecoder,
  keywordDensityChecker,
  keywordSuggestionGenerator,
  lineItemDocGenerator,
  loadCdnScript,
  loadImageFile,
  loadJsPdfLib,
  loadJsZip,
  loadPdfJs,
  loadPdfLib,
  loanCalculator,
  loremIpsumGenerator,
  markupCalculator,
  md5,
  metaDescriptionGenerator,
  metaTitleGenerator,
  mortgageCalculator,
  nameGenerator,
  netProfitCalculator,
  numField,
  openGraphGenerator,
  paletteExtractor,
  paragraphCounter,
  parsePageRange,
  passwordGenerator,
  pdfCompress,
  pdfExtractOrDelete,
  pdfMerge,
  pdfMetadataRemover,
  pdfMetadataViewer,
  pdfPageNumbering,
  pdfProtect,
  pdfReorderPages,
  pdfRotate,
  pdfSizeAnalyzer,
  pdfSplit,
  pdfToImageMaker,
  pdfToText,
  pdfUnlock,
  pdfWatermark,
  pdfWorkspaceShell,
  percentageCalculator,
  percentageChangeCalculator,
  pinGenerator,
  platformBadge,
  previewCanvas,
  pricingCalculator,
  profitMarginCalculator,
  qrCodeGenerator,
  qs,
  qsa,
  quoteGenerator,
  randomNumberGenerator,
  randomStringGenerator,
  ratioCalculator,
  readingTimeCalculator,
  regexTester,
  relLuminance,
  relatedTools,
  removeDuplicateLines,
  removeExtraSpaces,
  renderCalc,
  renderImageTool,
  renderSoon,
  renderTextTool,
  revenueCalculator,
  rgbToHex,
  rgbToHexTool,
  rgbToHsl,
  roasCalculator,
  robotsTxtGenerator,
  roiCalculator,
  salaryCalculator,
  salesTaxCalculator,
  savingsCalculator,
  schemaMarkupGenerator,
  selectField,
  sentenceCounter,
  serpSnippetPreview,
  shaHash,
  simpleInterestCalculator,
  slugGenerator,
  slugify,
  suggestExt,
  svgIcon,
  textReverser,
  textSorter,
  textToPdf,
  timeDifferenceCalculator,
  tipCalculator,
  toast,
  toolsInCategory,
  unitConverter,
  unixTimestampConverter,
  urlDecoder,
  urlEncoder,
  urlParser,
  usernameGenerator,
  utmBuilder,
  uuidGenerator,
  vatCalculator,
  wordCounter,
  xmlFormatter,
  xmlSitemapGenerator,
  xmlValidator,
};
