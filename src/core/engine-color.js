/* Oxvid Tools engine — color category. Extracted by
   scripts/split-engine.mjs; re-run it if engine.js's tool implementations
   change. Loaded on demand by ToolWorkspace.jsx only when a tool from this
   category is visited. */

import {
  checkField,
  copyText,
  debounce,
  h,
  hexToRgb,
  hslToRgb,
  imageDropzone,
  loadImageFile,
  numField,
  renderTextTool,
  rgbToHex,
  rgbToHsl,
  selectField,
} from './engine-core.js';

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

export const DISPATCH = {
  'hex-to-rgb': hexToRgbTool,
  'rgb-to-hex': rgbToHexTool,
  'hex-to-hsl': hexToHslTool,
  'hsl-to-hex': hslToHexTool,
  'color-picker': colorPicker,
  'color-contrast-checker': colorContrastChecker,
  'palette-extractor': paletteExtractor,
  'gradient-generator': gradientGenerator,
  'css-box-shadow-generator': cssBoxShadowGenerator,
  'css-border-radius-generator': cssBorderRadiusGenerator,
};
