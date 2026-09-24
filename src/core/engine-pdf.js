/* Oxvid Tools engine — pdf category. Extracted by
   scripts/split-engine.mjs; re-run it if engine.js's tool implementations
   change. Loaded on demand by ToolWorkspace.jsx only when a tool from this
   category is visited. */

import {
  controlsRow,
  copyText,
  download,
  fmtBytes,
  h,
  loadCdnScript,
  numField,
  selectField,
  svgIcon,
  toast,
} from './engine-core.js';

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

export const DISPATCH = {
  'pdf-merge': pdfMerge,
  'pdf-split': pdfSplit,
  'pdf-compress': pdfCompress,
  'pdf-to-jpg': pdfToImageMaker('jpg'),
  'pdf-to-png': pdfToImageMaker('png'),
  'jpg-to-pdf': imagesToPdf,
  'png-to-pdf': imagesToPdf,
  'pdf-to-text': pdfToText,
  'text-to-pdf': textToPdf,
  'pdf-rotate': pdfRotate,
  'pdf-extract-pages': pdfExtractOrDelete('extract'),
  'pdf-delete-pages': pdfExtractOrDelete('delete'),
  'pdf-reorder-pages': pdfReorderPages,
  'pdf-page-numbering': pdfPageNumbering,
  'pdf-watermark': pdfWatermark,
  'pdf-metadata-viewer': pdfMetadataViewer,
  'pdf-metadata-remover': pdfMetadataRemover,
  'pdf-size-analyzer': pdfSizeAnalyzer,
  'pdf-protect': pdfProtect,
  'pdf-unlock': pdfUnlock,
};
