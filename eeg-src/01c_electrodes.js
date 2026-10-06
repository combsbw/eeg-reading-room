/* ============ electrode model ============ */
const EL=[['Fp1',-.31,.95],['Fp2',.31,.95],['F7',-.81,.59],['F3',-.42,.55],['Fz',0,.52],['F4',.42,.55],['F8',.81,.59],
['T3',-.95,0],['C3',-.5,0],['Cz',0,0],['C4',.5,0],['T4',.95,0],['T5',-.81,-.59],['P3',-.42,-.55],['Pz',0,-.52],['P4',.42,-.55],['T6',.81,-.59],['O1',-.31,-.95],['O2',.31,-.95]];
const NE=19,XX=EL.map(e=>e[1]),YY=EL.map(e=>e[2]),IX={};EL.forEach((e,i)=>IX[e[0]]=i);
const blob=(cx,cy,s)=>EL.map((e,i)=>Math.exp(-((XX[i]-cx)**2+(YY[i]-cy)**2)/(2*s*s)));
const mulW=(a,b)=>a.map((v,i)=>v*b[i]);
const hemi=sg=>XX.map(x=>1/(1+Math.exp(-(x*sg)/.18)));
const W={all:EL.map(()=>1),post:YY.map(y=>Math.exp(-((y+.95)**2)/.5)),ant:YY.map(y=>Math.exp(-((y-.8)**2)/.6)),cen:blob(0,0,.55),fc:blob(0,.25,.8)};
const one=(...n)=>{const w=new Array(NE).fill(0);n.forEach(([k,v])=>w[IX[k]]=v);return w};
const jw=(r,w,j=.2)=>w.map(v=>v*(1-j+2*j*r.u()));

