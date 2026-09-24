/* Oxvid Tools engine — gen category. Extracted by
   scripts/split-engine.mjs; re-run it if engine.js's tool implementations
   change. Loaded on demand by ToolWorkspace.jsx only when a tool from this
   category is visited. */

import {
  clamp,
  controlsRow,
  copyText,
  debounce,
  download,
  h,
  hexToRgb,
  hslToRgb,
  loadCdnScript,
  numField,
  renderCalc,
  rgbToHex,
  rgbToHsl,
  selectField,
  toast,
} from './engine-core.js';

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

export const DISPATCH = {
  'qr-code-generator': qrCodeGenerator,
  'password-generator': passwordGenerator,
  'username-generator': usernameGenerator,
  'random-number-generator': randomNumberGenerator,
  'random-string-generator': randomStringGenerator,
  'barcode-generator': barcodeGenerator,
  'color-palette-generator': colorPaletteGenerator,
  'fake-data-generator': fakeDataGenerator,
  'name-generator': nameGenerator,
  'business-name-generator': businessNameGenerator,
  'email-subject-generator': emailSubjectGenerator,
  'pin-generator': pinGenerator,
};
