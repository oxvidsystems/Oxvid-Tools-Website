/* Oxvid Tools engine — dev category. Extracted by
   scripts/split-engine.mjs; re-run it if engine.js's tool implementations
   change. Loaded on demand by ToolWorkspace.jsx only when a tool from this
   category is visited. */

import {
  clamp,
  controlsRow,
  copyText,
  debounce,
  h,
  numField,
  qs,
  renderTextTool,
} from './engine-core.js';

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

export const DISPATCH = {
  'json-formatter': jsonFormatter,
  'json-validator': jsonValidator,
  'json-minifier': jsonMinifier,
  'xml-formatter': xmlFormatter,
  'xml-validator': xmlValidator,
  'html-formatter': htmlFormatter,
  'css-formatter': cssFormatter,
  'javascript-formatter': jsFormatter,
  'html-minifier': htmlMinifier,
  'css-minifier': cssMinifier,
  'javascript-minifier': jsMinifier,
  'base64-encoder': base64Encoder,
  'base64-decoder': base64Decoder,
  'url-encoder': urlEncoder,
  'url-decoder': urlDecoder,
  'uuid-generator': uuidGenerator,
  'jwt-decoder': jwtDecoder,
  'regex-tester': regexTester,
  'unix-timestamp-converter': unixTimestampConverter,
  'hash-generator': hashGenerator,
};
