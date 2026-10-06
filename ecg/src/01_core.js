(()=>{
'use strict';
/* ============ constants & helpers ============ */
const FS=500,DUR=10,N=FS*DUR,D2R=Math.PI/180;
const $=(s,p=document)=>p.querySelector(s),$$=(s,p=document)=>[...p.querySelectorAll(s)];
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function mkRand(seed){const u=mulberry(seed>>>0);return{u,n(){let a=0;while(a===0)a=u();return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*u())},r(a,b){return a+(b-a)*u()},pick(a){return a[Math.floor(u()*a.length)]},chance(p){return u()<p}}}
function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r.u()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const nrm=v=>{const m=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/m,v[1]/m,v[2]/m]};
const fv=(th,z=0)=>nrm([Math.cos(th*D2R),Math.sin(th*D2R),z]);
const neg=v=>[-v[0],-v[1],-v[2]];
const rot=(v,deg)=>{const c=Math.cos(deg*D2R),s=Math.sin(deg*D2R);return nrm([v[0]*c-v[1]*s,v[0]*s+v[1]*c,v[2]])};

/* ============ filters ============ */
function bq(type,f,Q,fs=FS){const w0=2*Math.PI*f/fs,c=Math.cos(w0),s=Math.sin(w0),al=s/(2*Q);let b0,b1,b2;
  if(type==='lp'){b0=(1-c)/2;b1=1-c;b2=(1-c)/2}else if(type==='hp'){b0=(1+c)/2;b1=-(1+c);b2=(1+c)/2}else{b0=1;b1=-2*c;b2=1}
  const a0=1+al;return[b0/a0,b1/a0,b2/a0,-2*c/a0,(1-al)/a0]}
function runbq(x,k){const y=new Float32Array(x.length);let x1=x[0],x2=x[0],y1=x[0]*(k[0]+k[1]+k[2])/(1+k[3]+k[4]),y2=y1;for(let i=0;i<x.length;i++){const v=k[0]*x[i]+k[1]*x1+k[2]*x2-k[3]*y1-k[4]*y2;y[i]=v;x2=x1;x1=x[i];y2=y1;y1=v}return y}
function ff(x,k){const n=x.length,P=Math.min(300,n-2),p=new Float64Array(n+2*P);for(let i=0;i<P;i++){p[i]=2*x[0]-x[P-i];p[n+P+i]=2*x[n-1]-x[n-2-i]}p.set(x,P);let y=runbq(p,k);y.reverse();y=runbq(y,k);y.reverse();return y.subarray(P,P+n)}
/* first-order RC (bilinear) high-pass / low-pass, causal */
function rc1(x,fc,type,fs=FS){const K=Math.tan(Math.PI*fc/fs),y=new Float32Array(x.length);let px=x[0],py=type==='lp'?x[0]:0;
  if(type==='lp'){const a=K/(1+K),b=(1-K)/(1+K);for(let i=0;i<x.length;i++){py=a*(x[i]+px)+b*py;px=x[i];y[i]=py}}
  else{const c=1/(1+K),b=(1-K)/(1+K);for(let i=0;i<x.length;i++){py=c*(x[i]-px)+b*py;px=x[i];y[i]=py}}return y}
function bandNoise(r,f1,f2,rms,len=N){const pad=f1>0&&f1<1.5?4000:300;let x=new Float64Array(len+2*pad);for(let i=0;i<x.length;i++)x[i]=r.n();
  if(f1>0)x=Float64Array.from(ff(x,bq('hp',f1,.707)));if(f2<FS*.45)x=Float64Array.from(ff(x,bq('lp',f2,.707)));
  const o=new Float32Array(len);let s=0;for(let i=0;i<len;i++){o[i]=x[i+pad];s+=o[i]*o[i]}const k=rms/Math.sqrt(s/len+1e-12);for(let i=0;i<len;i++)o[i]*=k;return o}

/* ============ lead model ============
   Heart vector in patient coordinates: x = patient's left, y = inferior (feet), z = anterior.
   Limb leads are Einthoven/Goldberger projections; precordial leads project onto unit
   directions in (mostly) the horizontal plane, each with its own gain (proximity). */
const LEADS=['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6'];
const LIMB=LEADS.slice(0,6),PREC=LEADS.slice(6),XL=['V4R','V7','V8','V9'],ALLL=LEADS.concat(XL);
const LG=.85;
const PV={V1:{d:nrm([-.32,.12,.94]),g:1.05},V2:{d:nrm([-.05,.12,1]),g:1.45},V3:{d:nrm([.35,.12,.93]),g:1.45},V4:{d:nrm([.7,.15,.7]),g:1.35},V5:{d:nrm([.93,.12,.36]),g:1.15},V6:{d:nrm([1,.1,.05]),g:.95},
  V4R:{d:nrm([-.75,.15,.62]),g:.9},V7:{d:nrm([.8,.1,-.6]),g:.7},V8:{d:nrm([.45,.1,-.9]),g:.6},V9:{d:nrm([.1,.1,-1]),g:.55}};
/* limb lead vectors (for projections outside the record builder) */
const LV={I:[LG,0,0],II:[.5*LG,.866*LG,0],III:[-.5*LG,.866*LG,0],aVR:[-.75*LG,-.433*LG,0],aVL:[.75*LG,-.433*LG,0],aVF:[0,.866*LG,0]};
PREC.concat(['V4R','V7','V8','V9']).forEach(k=>LV[k]=PV[k].d.map(x=>x*PV[k].g));
const proj=(v,lead)=>{const L=LV[lead];return v[0]*L[0]+v[1]*L[1]+v[2]*L[2]};

/* ============ waveform primitives ============
   A "bump" adds shape(t)·A along a heart-vector direction d (or, with lm, directly to named leads).
   Shapes: asymmetric Gaussian (c, wl, wr), plateau 'p' (a, ra, b, fb), pacing spike 'sp' (c). */
function brange(b){if(b.sh==='p')return[b.a,b.b+b.fb];if(b.sh==='sp')return[b.c,b.c+.008];return[b.c-4.5*b.wl,b.c+4.5*(b.wr??b.wl)]}
function bval(b,t){if(b.sh==='p'){if(t<b.a||t>b.b+b.fb)return 0;if(t<b.a+b.ra)return .5-.5*Math.cos(Math.PI*(t-b.a)/b.ra);if(t<=b.b)return 1;return .5+.5*Math.cos(Math.PI*(t-b.b)/b.fb)}
  if(b.sh==='sp'){const u=t-b.c;return u<0?0:u<.002?1:u<.006?-.18:0}
  const u=t-b.c,w=u<0?b.wl:(b.wr??b.wl);return Math.exp(-.5*u*u/(w*w))}
function addB(R,T,b){const[s,e]=brange(b),i0=Math.max(0,Math.ceil((T+s)*FS)),i1=Math.min(R.n-1,Math.floor((T+e)*FS));if(i1<i0||!b.A)return;
  if(b.lm){for(const k in b.lm){const L=R.loc[k]||(R.loc[k]=new Float32Array(R.n)),g=b.A*b.lm[k];for(let i=i0;i<=i1;i++)L[i]+=g*bval(b,i/FS-T)}return}
  if(b.el){const L=R.ela[b.el]||(R.ela[b.el]=new Float32Array(R.n));for(let i=i0;i<=i1;i++)L[i]+=b.A*bval(b,i/FS-T);return}
  const d=b.d,X=R.v[0],Y=R.v[1],Z=R.v[2];for(let i=i0;i<=i1;i++){const s_=b.A*bval(b,i/FS-T);X[i]+=s_*d[0];Y[i]+=s_*d[1];Z[i]+=s_*d[2]}}

/* ventricular complex template (times relative to QRS onset, seconds; amplitudes mV) */
function V(o={}){const s=o.s??1,A=o.amp??1,ax=o.axis??55,qt=o.qt??.39,m={q:[],st:[],t:[],loc:[],kind:o.kind||'n'};
  if(o.q)m.q=o.q.map(b=>({...b}));else{
    if(o.sep!==0)m.q.push({c:.014*s,wl:.008*s,A:.17*A*(o.sep??1),d:o.sepd||nrm([-.55,.15,.8])});
    m.q.push({c:.043*s,wl:.0135*s,A:1.35*A*(o.main??1),d:o.maind||fv(ax,o.z??-.42)});
    if(o.term!==0)m.q.push({c:.067*s,wl:.0105*s,A:.30*A*(o.term??1),d:o.termd||nrm([-.35,-.55,-.75])})}
  if(o.xq)m.q.push(...o.xq.map(b=>({...b})));
  let on=1,off=-1;m.q.forEach(b=>{if(b.sh==='sp')return;on=Math.min(on,b.c-2.4*b.wl);off=Math.max(off,b.c+2.4*(b.wr??b.wl))});on=Math.max(on,-.004);
  if(o.t)m.t=o.t.map(b=>({...b}));
  else if(o.tA!==0){const sc=o.tfix?1:qt/.39,wr=(o.twr??.042)*sc,wl=(o.twl??.068)*sc;m.t.push({c:qt-2.3*wr,wl,wr,A:o.tA??.4,d:o.td||fv(o.tax??ax-12,o.tz??.6)})}
  if(o.uA)m.t.push({c:qt+.085,wl:.04,wr:.035,A:o.uA,d:o.ud||fv(55,.9)});
  const tpk=m.t.length?m.t[0].c:qt-.1;
  if(o.stA)m.st.push({sh:'p',a:off-.012,ra:o.stra??.035,b:Math.max(off+.03,o.stb??tpk),fb:Math.max(.04,(o.stend??qt)-(o.stb??tpk)),A:o.stA,d:o.std});
  if(o.xst)m.st.push(...o.xst.map(b=>({...b})));
  if(o.loc)m.loc=o.loc.map(b=>({...b}));
  m.on=on;m.off=off;m.qt=qt;m.qrsd=off-on;return m}
/* P wave templates (times relative to P onset) */
function Pw(kind='n',A=.15,d){switch(kind){
  case 'mitrale':return[{c:.04,wl:.018,A:A*.9,d:nrm([.3,.9,.4])},{c:.09,wl:.02,A:A*1.3,d:nrm([.7,.4,-.75])}];
  case 'pulm':return[{c:.045,wl:.017,A:A*2.1,d:nrm([.12,.95,.4])},{c:.066,wl:.016,A:A*.6,d:nrm([.8,.45,-.5])}];
  case 'retro':return[{c:.035,wl:.017,A:A*.95,d:nrm([-.1,-.95,.3])}];
  case 'flat':return[{c:.05,wl:.026,A:A*.4,d:nrm([.4,.85,.25])}];
  case 'ect':return[{c:.04,wl:.018,A,d}];
  default:return[{c:.04,wl:.017,A,d:nrm([.3,.9,.4])},{c:.066,wl:.017,A:A*.85,d:nrm([.8,.45,-.5])}]}}

/* ============ record builder ============ */
function newRec(seed,n=N){return{r:mkRand(seed),seed,n,v:[new Float32Array(n),new Float32Array(n),new Float32Array(n)],loc:{},ela:{},ev:{p:[],q:[]},ann:[],meta:{},opt:{}}}
function addP(R,t,pm,o={}){pm.forEach(b=>addB(R,t,b));R.ev.p.push({t,cond:o.cond??true,k:o.k||'s'});return R.ev.p.length-1}
function addV(R,t,m,from=null){m.q.forEach(b=>addB(R,t,b));m.st.forEach(b=>addB(R,t,b));m.t.forEach(b=>addB(R,t,b));m.loc.forEach(b=>addB(R,t,b));R.ev.q.push({t,from,k:m.kind,m});return R.ev.q.length-1}
const hl=(R,leads,txt,k='a')=>R.ann.push({type:'hl',leads,txt,k});
const span=(R,t0,t1,txt)=>R.ann.push({type:'span',t0,t1,txt});
const pt=(R,t,txt)=>R.ann.push({type:'pt',t,txt});
const qtF=(hr,qtc=.40)=>qtc*Math.cbrt(60/hr); /* physiologic QT for a heart rate (Fridericia-shaped) */

/* regular sinus-type rhythm: o.hr, o.pr, o.vm (morph or fn), o.pm (P or fn), o.jit, o.resp */
function sinus(R,o){const r=R.r,rr0=60/o.hr;let t=o.t0??-r.r(.05,rr0*.9),i=0;
  while(t<(o.t1??DUR+.7)){const vm=typeof o.vm==='function'?o.vm(i,t):o.vm,pm=typeof o.pm==='function'?o.pm(i):o.pm,pr=typeof o.pr==='function'?o.pr(i):o.pr;
    let pi=null;if(pm)pi=addP(R,t-pr,pm);if(vm)addV(R,t,vm,pi);i++;
    t+=rr0*(1+(o.jit??.012)*r.n()+(o.resp??0)*Math.sin(2*Math.PI*t/(o.rper??4.2)+(o.rph??0)))}
  return t}

/* finalize: project to electrodes and leads, apply reversal/artifact, add noise */
function deriveLeads(R,noise=true){const n=R.n,X=R.v[0],Y=R.v[1],Z=R.v[2],mx=R.opt.mirror?-1:1,L={};
  const RA=new Float32Array(n),LA=new Float32Array(n),LL=new Float32Array(n);
  for(let i=0;i<n;i++){const x=X[i]*mx,I=LG*x,II=LG*(.5*x+.866*Y[i]);RA[i]=-(I+II)/3;LA[i]=(2*I-II)/3;LL[i]=(2*II-I)/3}
  const pv=R.opt.pv||{},pg=R.opt.pg||[1,1,1,1,1,1];
  PREC.forEach((k,j)=>{const d=pv[k]||PV[k].d,g=PV[k].g*pg[j],a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=g*(d[0]*X[i]*mx+d[1]*Y[i]+d[2]*Z[i]);L[k]=a});
  XL.forEach(k=>{const d=PV[k].d,g=PV[k].g,a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=g*(d[0]*X[i]*mx+d[1]*Y[i]+d[2]*Z[i]);L[k]=a});
  const E={RA,LA,LL};if(R.ela.RA)for(let i=0;i<n;i++)RA[i]+=R.ela.RA[i];if(R.ela.LA)for(let i=0;i<n;i++)LA[i]+=R.ela.LA[i];if(R.ela.LL)for(let i=0;i<n;i++)LL[i]+=R.ela.LL[i];
  const inp={RA,LA,LL};if(R.opt.swap){const[a,b]=R.opt.swap,src=k=>k==='RL'?LL:E[k];if(a!=='RL')inp[a]=src(b);if(b!=='RL')inp[b]=src(a)}
  const ra=inp.RA,la=inp.LA,ll=inp.LL,I=new Float32Array(n),II=new Float32Array(n),III=new Float32Array(n),aVR=new Float32Array(n),aVL=new Float32Array(n),aVF=new Float32Array(n);
  for(let i=0;i<n;i++){I[i]=la[i]-ra[i];II[i]=ll[i]-ra[i];III[i]=ll[i]-la[i];aVR[i]=ra[i]-(la[i]+ll[i])/2;aVL[i]=la[i]-(ra[i]+ll[i])/2;aVF[i]=ll[i]-(ra[i]+la[i])/2;
    const w=(ra[i]+la[i]+ll[i])/3;if(w){PREC.forEach(k=>L[k][i]-=w);XL.forEach(k=>L[k][i]-=w)}}
  Object.assign(L,{I,II,III,aVR,aVL,aVF});
  for(const k in R.loc)if(L[k]){const a=L[k],b=R.loc[k];for(let i=0;i<n;i++)a[i]+=b[i]}
  if(noise&&R.opt.noise!==0){const r=mkRand(R.seed*7+11),nz=R.opt.noise??1,emg=(R.opt.emg??.009)*nz,wan=(R.opt.wander??.05)*nz;
    const f1=r.r(.16,.3),p1=r.r(0,6.28);
    ALLL.forEach(k=>{const a=L[k],e=bandNoise(r,25,150,emg),f2=r.r(.3,.7),p2=r.r(0,6.28),a1=wan*r.r(.3,1),a2=wan*r.r(.1,.4),a3=r.r(.001,.003);
      for(let i=0;i<n;i++){const t=i/FS;a[i]+=e[i]+a1*Math.sin(2*Math.PI*f1*t+p1+(k.length*.7))+a2*Math.sin(2*Math.PI*f2*t+p2)+a3*Math.sin(2*Math.PI*60*t)}})}
  return L}

/* noise-free single-beat template, used for measurements and the systematic read */
function template(R){const tm=R.tm;if(!tm)return null;const T=newRec(R.seed,700);T.opt={...R.opt,noise:0};T.ela={};
  const t0=.45;if(tm.pm&&tm.pr!=null)tm.pm.forEach(b=>addB(T,t0-tm.pr,b));addV(T,t0,tm.vm);
  const L=deriveLeads(T,false);return{L,t0,vm:tm.vm,pr:tm.pr,n:700}}
function measure(R){const tp=template(R);if(!tp)return null;const{L,t0,vm}=tp,i0=Math.round((t0+vm.on)*FS),i1=Math.round((t0+vm.off)*FS),ib=Math.max(0,i0-8);
  const out={};ALLL.forEach(k=>{const a=L[k];if(!a)return;const b=a[ib];let mx=-9,mn=9,area=0;for(let i=i0;i<=i1;i++){const v=a[i]-b;mx=Math.max(mx,v);mn=Math.min(mn,v);area+=v}
    const j=a[i1]-b,st40=a[Math.min(tp.n-1,i1+20)]-b,st60=a[Math.min(tp.n-1,i1+30)]-b,st80=a[Math.min(tp.n-1,i1+40)]-b;let tmax=-9,tmin=9;const te=Math.round((t0+vm.qt)*FS);for(let i=i1+40;i<=Math.min(tp.n-1,te);i++){const v=a[i]-b;tmax=Math.max(tmax,v);tmin=Math.min(tmin,v)}
    let qd=0,qa=0;for(let i=i0;i<=i1;i++){const v=a[i]-b;if(v<-.015){qd++;qa=Math.min(qa,v)}else if(v>.015)break}
    let pa=0,pmin=0;if(tp.pr!=null){const ps=Math.round((t0-tp.pr)*FS);for(let i=Math.max(0,ps);i<i0;i++){pa=Math.max(pa,a[i]-b);pmin=Math.min(pmin,a[i]-b)}}
    out[k]={R:Math.max(0,mx),S:Math.max(0,-mn),area:area/FS,j,st40,st60,st80,tmax,tmin,qd:qd/FS,qa,pa,pmin}});
  const ax=Math.round(Math.atan2(out.aVF.area/.866,out.I.area)/D2R);return{leads:out,axis:ax}}
