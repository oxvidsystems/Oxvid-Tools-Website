/* Oxvid Tools engine — text category. Extracted by
   scripts/split-engine.mjs; re-run it if engine.js's tool implementations
   change. Loaded on demand by ToolWorkspace.jsx only when a tool from this
   category is visited. */

import {
  clamp,
  copyText,
  h,
  numField,
  renderTextTool,
  selectField,
  slugify,
} from './engine-core.js';

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

export const DISPATCH = {
  'word-counter': wordCounter,
  'character-counter': characterCounter,
  'sentence-counter': sentenceCounter,
  'paragraph-counter': paragraphCounter,
  'reading-time-calculator': readingTimeCalculator,
  'case-converter': caseConverterMaker('all'),
  'uppercase-converter': caseConverterMaker('upper'),
  'lowercase-converter': caseConverterMaker('lower'),
  'title-case-converter': caseConverterMaker('title'),
  'remove-duplicate-lines': removeDuplicateLines,
  'remove-extra-spaces': removeExtraSpaces,
  'text-sorter': textSorter,
  'text-reverser': textReverser,
  'slug-generator': slugGenerator,
  'lorem-ipsum-generator': loremIpsumGenerator,
};
