/* Oxvid Tools engine — calc category. Extracted by
   scripts/split-engine.mjs; re-run it if engine.js's tool implementations
   change. Loaded on demand by ToolWorkspace.jsx only when a tool from this
   category is visited. */

import {
  controlsRow,
  debounce,
  fmtNum,
  h,
  numField,
  renderCalc,
  selectField,
} from './engine-core.js';

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

export const DISPATCH = {
  'percentage-calculator': percentageCalculator,
  'percentage-change-calculator': percentageChangeCalculator,
  'average-calculator': averageCalculator,
  'ratio-calculator': ratioCalculator,
  'age-calculator': ageCalculator,
  'date-difference-calculator': dateDifferenceCalculator,
  'time-difference-calculator': timeDifferenceCalculator,
  'bmi-calculator': bmiCalculator,
  'bmr-calculator': bmrCalculator,
  'calorie-calculator': calorieCalculator,
  'discount-calculator': discountCalculator,
  'tip-calculator': tipCalculator,
  'loan-calculator': loanCalculator,
  'mortgage-calculator': mortgageCalculator,
  'compound-interest-calculator': compoundInterestCalculator,
  'simple-interest-calculator': simpleInterestCalculator,
  'profit-margin-calculator': profitMarginCalculator,
  'markup-calculator': markupCalculator,
  'salary-calculator': salaryCalculator,
  'unit-converter': unitConverter,
};
