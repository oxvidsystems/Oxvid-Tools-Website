/* Oxvid Tools engine — finance category. Extracted by
   scripts/split-engine.mjs; re-run it if engine.js's tool implementations
   change. Loaded on demand by ToolWorkspace.jsx only when a tool from this
   category is visited. */

import {
  debounce,
  download,
  esc,
  fmtNum,
  h,
  renderCalc,
  toast,
} from './engine-core.js';

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

export const DISPATCH = {
  'roi-calculator': roiCalculator,
  'roas-calculator': roasCalculator,
  'revenue-calculator': revenueCalculator,
  'gross-profit-calculator': grossProfitCalculator,
  'net-profit-calculator': netProfitCalculator,
  'break-even-calculator': breakEvenCalculator,
  'vat-calculator': vatCalculator,
  'sales-tax-calculator': salesTaxCalculator,
  'commission-calculator': commissionCalculator,
  'invoice-generator': invoiceGenerator,
  'quote-generator': quoteGenerator,
  'pricing-calculator': pricingCalculator,
  'business-loan-calculator': businessLoanCalculator,
  'savings-calculator': savingsCalculator,
  'investment-return-calculator': investmentReturnCalculator,
};
