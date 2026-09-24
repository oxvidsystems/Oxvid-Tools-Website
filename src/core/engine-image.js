/* Oxvid Tools engine — image category. Extracted by
   scripts/split-engine.mjs; re-run it if engine.js's tool implementations
   change. Loaded on demand by ToolWorkspace.jsx only when a tool from this
   category is visited. */

import {
  checkField,
  clamp,
  controlsRow,
  copyText,
  debounce,
  download,
  fmtBytes,
  h,
  imageDropzone,
  loadImageFile,
  numField,
  selectField,
  toast,
} from './engine-core.js';

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

function drawFit(canvas, img, w, h){ canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,w,h); return ctx; }

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

export const DISPATCH = {
  'image-resize': imgResize,
  'image-crop': imgCrop,
  'image-rotate': imgRotate,
  'image-flip': imgFlip,
  'image-converter': imgConvertMaker(null),
  'jpg-to-png': imgConvertMaker('png'),
  'png-to-jpg': imgConvertMaker('jpg'),
  'webp-to-jpg': imgConvertMaker('jpg'),
  'jpg-to-webp': imgConvertMaker('webp'),
  'png-to-webp': imgConvertMaker('webp'),
  'webp-to-png': imgConvertMaker('png'),
  'image-compress': imgCompress,
  'image-to-base64': imgToBase64,
  'base64-to-image': base64ToImage,
  'image-grayscale': imgGrayscale,
  'image-blur': imgBlur,
  'image-pixelate': imgPixelate,
  'image-quality-analyzer': imgQualityAnalyzer,
  'image-dimensions-viewer': imgDimensions,
  'favicon-generator': faviconGenerator,
};
