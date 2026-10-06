
/* ============ HRV biofeedback: resonance-breathing trainer ============
   A breathing pacer drives either a simulated person (vagal respiratory gating plus a baroreflex
   resonator, beats by integrate-and-fire) or a real Bluetooth heart-rate strap (0x180D / 0x2A37).
   R–R intervals go through artifact rejection, then time-domain metrics, a Welch spectrum of the
   4 Hz resampled R–R series, a coherence score and a stepped resonance-rate protocol.
   Teaching model only: not a medical device. */
const HRV=(()=>{
const RATES=[6.5,6,5.5,5,4.5],STEP=120,SKIP=20,REJ=.2,RFS=4,DT=.01;
const PATS=[['nsr','Normal sinus rhythm'],['sarr','Sinus arrhythmia'],['sbrady','Sinus bradycardia'],['stach','Sinus tachycardia'],['athlete',"Athlete's heart"]];
const pal=()=>{const s=getComputedStyle(document.documentElement),v=(n,f)=>s.getPropertyValue(n).trim()||f;
  return{ink:v('--ink','#16212c'),muted:v('--muted','#5a6b7b'),line:v('--line','#d2d9e0'),panel:v('--panel','#fbfcfd'),soft:v('--soft','#e4e9ee'),accent:v('--accent','#1f5fcf'),mark:v('--mark','#bf4a10'),good:v('--good','#17744a'),bad:v('--bad','#b3261e'),warn:v('--warn','#8f5a00'),trace:v('--trace','#18232e'),grid:v('--grid','#e3e8ed'),paper:v('--paper','#fffdfb'),gmin:v('--gmin','rgba(226,104,104,.2)'),gmaj:v('--gmaj','rgba(214,64,64,.46)'),ui:v('--font-ui','system-ui,sans-serif'),mono:v('--font-mono','monospace')}};
function setup(c){const r=c.getBoundingClientRect();if(r.width<2||r.height<2)return null;const d=window.devicePixelRatio||1,w=Math.round(r.width),h=Math.round(r.height);
  if(c.width!==Math.round(w*d)||c.height!==Math.round(h*d)){c.width=Math.round(w*d);c.height=Math.round(h*d)}const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);return{g,w,h}}
const rmo=()=>document.documentElement.classList.contains('rmo')||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const mmss=t=>{t=Math.max(0,Math.floor(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
const median=a=>{const b=a.slice().sort((x,y)=>x-y),n=b.length;return n?(n%2?b[n>>1]:(b[n/2-1]+b[n/2])/2):NaN};
const mean=a=>a.reduce((s,x)=>s+x,0)/(a.length||1);

/* ---- breathing shape: phase (cycles) -> lung volume 0..1; inhale fraction fi ---- */
function vol(ph,fi){ph-=Math.floor(ph);return ph<fi?.5-.5*Math.cos(Math.PI*ph/fi):.5+.5*Math.cos(Math.PI*(ph-fi)/(1-fi))}

/* ---- Bluetooth Heart Rate Measurement (0x2A37) parser ----
   flags bit0: HR is uint16 (else uint8); bit1-2: sensor contact (bit2 = supported, bit1 = detected);
   bit3: energy expended present (uint16, skipped); bit4: one or more R–R intervals (uint16, 1/1024 s). */
function parse2A37(v){const dv=v instanceof DataView?v:new DataView(v.buffer?v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength):v);
  const f=dv.getUint8(0);let i=1;const hr=f&1?dv.getUint16(i,true):dv.getUint8(i);i+=f&1?2:1;
  const contact=f&4?!!(f&2):null;let energy=null;if(f&8){energy=dv.getUint16(i,true);i+=2}
  const rr=[];if(f&16)for(;i+1<dv.byteLength;i+=2)rr.push(dv.getUint16(i,true)*1000/1024);
  return{hr,rr,contact,energy,flags:f}}

/* ---- spectral tools ---- */
function fft(re,im){const n=re.length;for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t}}
  for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a),h=len>>1;for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let k=0;k<h;k++){const p=i+k,q=p+h,tr=re[q]*cr-im[q]*ci,ti=re[q]*ci+im[q]*cr;re[q]=re[p]-tr;im[q]=im[p]-ti;re[p]+=tr;im[p]+=ti;const t=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t}}}}
/* Welch PSD (Hann, 50% overlap, zero-padded to nfft), one-sided, units²/Hz */
function welch(x,fs,seg=256,nfft=1024){const n=x.length;seg=Math.min(seg,n);while(nfft<seg)nfft*=2;const hop=Math.max(1,seg>>1),w=new Float64Array(seg);let U=0;
  for(let i=0;i<seg;i++){w[i]=.5-.5*Math.cos(2*Math.PI*i/(seg-1));U+=w[i]*w[i]}const P=new Float64Array(nfft/2+1);let K=0;
  for(let s0=0;s0+seg<=n;s0+=hop){const re=new Float64Array(nfft),im=new Float64Array(nfft);let m=0;for(let i=0;i<seg;i++)m+=x[s0+i];m/=seg;for(let i=0;i<seg;i++)re[i]=(x[s0+i]-m)*w[i];fft(re,im);
    for(let k=0;k<=nfft/2;k++)P[k]+=(re[k]*re[k]+im[k]*im[k])*(k&&k<nfft/2?2:1)/(fs*U);K++}
  for(let k=0;k<P.length;k++)P[k]/=K||1;return{P,df:fs/nfft}}
/* accepted beats -> evenly sampled R–R (ms) at fs, linearly interpolated and linearly detrended */
function resample(bs,fs){if(bs.length<4)return null;const t0=bs[0].t,n=Math.floor((bs[bs.length-1].t-t0)*fs)+1,x=new Float64Array(n);let j=0;
  for(let i=0;i<n;i++){const t=t0+i/fs;while(j<bs.length-2&&bs[j+1].t<t)j++;const a=bs[j],b=bs[j+1],u=clamp((t-a.t)/((b.t-a.t)||1),0,1);x[i]=a.rr+(b.rr-a.rr)*u}
  let sx=0,sy=0,sxx=0,sxy=0;for(let i=0;i<n;i++){sx+=i;sy+=x[i];sxx+=i*i;sxy+=i*x[i]}const d=n*sxx-sx*sx,b=d?(n*sxy-sx*sy)/d:0,a=(sy-b*sx)/n;for(let i=0;i<n;i++)x[i]-=a+b*i;return x}
const bandP=(S,f1,f2)=>{let s=0;for(let k=0;k<S.P.length;k++){const f=k*S.df;if(f>=f1&&f<f2)s+=S.P[k]*S.df}return s};
function peakIn(S,f1,f2){let k0=-1,m=-1;for(let k=1;k<S.P.length-1;k++){const f=k*S.df;if(f<f1||f>f2)continue;if(S.P[k]>m){m=S.P[k];k0=k}}if(k0<0)return null;
  const a=S.P[k0-1],b=S.P[k0],c=S.P[k0+1],den=a-2*b+c,dl=den?clamp(.5*(a-c)/den,-.5,.5):0;return{f:(k0+dl)*S.df,p:b}}

/* ---- R–R pipeline: classify each interval against the median of its neighbours ----
   reject if < 300 ms, > 2000 ms, or more than 20% away from the median of the two intervals
   before and the two after (a centred window, so steep but genuine RSA is not rejected). */
function mkSeries(){return{b:[],brk:true}}
function addRR(Sr,t,rr,o={}){const b={t,rr,s:'p',brk:Sr.brk||!!o.brk,approx:!!o.approx,i:Sr.b.length};Sr.brk=false;Sr.b.push(b);const n=Sr.b.length;if(n>=3)classify(Sr,n-3,false);return b}
function classify(Sr,i,final){const B=Sr.b,b=B[i];if(!b||b.s!=='p')return;if(b.rr<300||b.rr>2000){b.s='x';b.why=b.rr<300?'< 300 ms':'> 2000 ms';return}
  const nb=[];for(let k=i-1;k>=Math.max(0,i-2);k--){if(B[k+1].brk)break;nb.push(B[k].rr)}for(let k=i+1;k<=Math.min(B.length-1,i+2);k++){if(B[k].brk)break;nb.push(B[k].rr)}
  const ok=nb.filter(r=>r>=300&&r<=2000);if(ok.length<(final?1:3)&&!final&&i+2>=B.length)return;
  if(!ok.length){b.s='o';return}const m=median(ok);if(Math.abs(b.rr-m)/m>REJ){b.s='x';b.why=Math.round(100*(b.rr-m)/m)+'% from local median'}else b.s='o'}
function finalize(Sr){for(let i=Math.max(0,Sr.b.length-3);i<Sr.b.length;i++)classify(Sr,i,true)}
function lowIdx(B,t){let lo=0,hi=B.length;while(lo<hi){const m=(lo+hi)>>1;if(B[m].t<t)lo=m+1;else hi=m}return lo}

/* ---- analysis of a window [t0,t1] ---- */
function analyze(Sr,t0,t1,breaths,fb,spec=true){const B=Sr.b,i0=lowIdx(B,t0),all=[];for(let i=i0;i<B.length&&B[i].t<=t1;i++)all.push(i);
  const cls=all.filter(i=>B[i].s!=='p'),ok=cls.filter(i=>B[i].s==='o').map(i=>B[i]),rej=cls.length-ok.length,o={n:cls.length,rej,span:0};if(ok.length<5)return o;
  /* analyse only the last unbroken stretch */
  let s0=0;for(let k=1;k<ok.length;k++)if(ok[k].brk||ok[k].t-ok[k-1].t>6)s0=k;const seg=ok.slice(s0);if(seg.length<5)return o;
  const rr=seg.map(b=>b.rr),mu=mean(rr);o.span=seg[seg.length-1].t-seg[0].t;o.hr=60000/mu;o.sdnn=Math.sqrt(mean(rr.map(x=>(x-mu)**2)));
  const d=[];for(let k=1;k<seg.length;k++){const a=seg[k-1],b=seg[k];if(b.i-a.i===1)d.push((b.rr-a.rr)**2)}o.rmssd=d.length?Math.sqrt(mean(d)):NaN;
  const amps=[];for(let k=0;k+1<breaths.length;k++){const a=breaths[k],e=breaths[k+1];if(a<seg[0].t||e>seg[seg.length-1].t)continue;const hs=seg.filter(b=>b.t>=a&&b.t<e).map(b=>60000/b.rr);if(hs.length>=3)amps.push(Math.max(...hs)-Math.min(...hs))}
  o.rsa=amps.length?mean(amps):NaN;o.nb=amps.length;
  if(spec&&o.span>=30){const x=resample(seg,RFS),S=welch(x,RFS,256,1024);o.S=S;o.vlf=bandP(S,.0033,.04);o.lf=bandP(S,.04,.15);o.hf=bandP(S,.15,.4);o.tot=bandP(S,.0033,.4);
    const pk=peakIn(S,.04,.26);if(pk){o.pf=pk.f;o.ppk=bandP(S,pk.f-.015,pk.f+.015);o.coh=100*o.ppk/(o.tot||1)}const lp=peakIn(S,.04,.15);if(lp){o.lff=lp.f;o.lfpk=bandP(S,lp.f-.015,lp.f+.015)}o.fb=fb}
  return o}

/* ---- simulated person ----
   HR = HRmean + Kr·LP(resp) + B·resonator(resp + vasomotor noise) + VLF drift.
   LP: vagal respiratory gating (τ 0.5 s, acetylcholine is fast). Resonator: band-pass at the
   person's baroreflex resonance fr (0.08–0.11 Hz) with damping ζ, unity gain at resonance. */
function mkPerson(seed){const r=mkRand(seed*7919+13);return{seed,fr:r.r(.08,.11),zeta:r.r(.14,.22),hr0:r.r(-5,5),kr:r.r(.85,1.15),kb:r.r(.85,1.15)}}
function mkSim(pp,seed){const r=mkRand(seed);return{pp,r,t:0,lag:0,dep:0,fq:0,sph:r.u(),pfl:null,lp:0,x1:0,x2:0,m:0,vlf:r.n()*1.2,th:r.u(),thr:1,supp:false,ect:null,hr:70,v:.5}}
function hrPars(P,pp){const vt=P.vt,sy=P.sym;return{hrm:86-28*vt+34*sy+pp.hr0,kr:(2+13*vt)*(1-.6*sy)*pp.kr,kb:(2.5+17*vt)*(1-.65*sy)*pp.kb}}
function simStep(S,P,pph,fi,out){const r=S.r,pp=S.pp,dt=DT,ou=(x,tau,sd)=>x-x*dt/tau+sd*Math.sqrt(2*dt/tau)*r.n();
  S.lag=ou(S.lag,8,.07*P.irr);S.dep=ou(S.dep,6,.22*P.irr);S.fq=ou(S.fq,10,.06+.1*P.irr);
  let ph,depth,f_=fi;if(P.spont){S.sph+=dt*(13/60)*(1+S.fq);ph=S.sph;depth=.45*clamp(1+S.dep,.5,1.6);f_=.42}else{ph=pph+S.lag;depth=clamp(1+S.dep,.5,1.5)}
  const fl=Math.floor(ph);if(S.pfl!=null&&fl>S.pfl)out.breath(S.t+dt);S.pfl=fl;
  const v=depth*vol(ph,f_),u=v-.5*depth;S.v=v;
  const H=hrPars(P,pp),w=2*Math.PI*pp.fr,z=pp.zeta;
  S.lp+=(u-S.lp)*dt/.5;S.m=ou(S.m,2,.4);S.x2+=(u+S.m-2*z*w*S.x2-w*w*S.x1)*dt;S.x1+=S.x2*dt;S.vlf=ou(S.vlf,25,1.6);
  const hr=clamp(H.hrm+H.kr*S.lp+H.kb*2*z*w*S.x2+S.vlf,35,190);S.hr=hr;
  if(S.ect!=null&&S.ect<S.t+dt){out.beat(S.ect,'v',true);S.ect=null}
  const f=hr/60;S.th+=f*dt;
  if(S.th>=S.thr){const tb=S.t+dt-(S.th-S.thr)/f;S.th-=S.thr;S.thr=1+.007*r.n();
    if(S.supp){S.supp=false;out.beat(tb,'b',false)}
    else{const miss=r.u()<.012*P.ect;out.beat(tb,'n',!miss);
      if(r.u()<.035*P.ect){S.ect=tb+r.r(.55,.7)*60/hr;S.supp=true}}}
  S.t+=dt}

/* ================= UI ================= */
function build(host){host=host||$('#aHrv');if(!host)return;host.innerHTML='';let C=pal();
  const st={src:'sim',run:false,fast:false,br:6,fi:.4,win:90,mode:'hr',P:{vt:.6,sym:.2,irr:.3,ect:.35,spont:false},seed:1+Math.floor(Math.random()*9e5),
    t:0,pph:0,last:0,lastReal:0,Sr:mkSeries(),phys:[],rT:[],rP:[],rA:[],pB:[],sB:[],sim:null,pp:null,an:null,anAt:-1,proto:null,res:null,why:'',reveal:false,lastDet:null,sb:{lt:null},hrOnly:false};
  st.pp=mkPerson(st.seed);st.sim=mkSim(st.pp,st.seed);

  /* ---- card 1: mechanism ---- */
  const pats=PATS.filter(([id])=>typeof PM==='undefined'||PM[id]);
  const intro=el('div','card stack',`<div class="row" style="justify-content:space-between"><h2>HRV biofeedback: resonance breathing</h2><span class="lbl">Teaching simulator</span></div>
   <div class="hv-intro"><div class="stack" style="gap:10px">
   <p><b>Why heart rate follows the breath.</b> Heart rate rises during inspiration and falls during expiration: respiratory sinus arrhythmia (RSA). During inspiration, brainstem respiratory neurons inhibit the cardiac vagal motoneurons in the <b>nucleus ambiguus</b>, so vagal firing to the sinus node drops. Acetylcholine acts within a single beat: it opens I<sub>K,ACh</sub> channels and reduces the funny current (I<sub>f</sub>), flattening the phase 4 slope. Only the vagus is fast enough to follow each breath; sympathetic effects (β1, cAMP, steeper phase 4) take several seconds to build and fade, so they set the mean rate rather than tracking breaths.</p>
   <p><b>Why about 6 breaths a minute.</b> The baroreflex is a feedback loop: higher pressure stretches carotid and aortic baroreceptors, which slows the heart and relaxes vessels. The loop has a delay of about 5 s, so, like any delayed feedback loop, it resonates, near 0.1 Hz (one cycle every 10 s). Breathing at that frequency, about 6 breaths/min (individually about 4.5–7), drives the loop at resonance: the respiratory and baroreflex heart-rate oscillations add in phase and the swing in heart rate is largest (Vaschillo, Lehrer). That breathing rate is the person's <b>resonance frequency</b>.</p>
   </div>${loopSvg()}</div>
   <div class="note"><b>Evidence.</b> Resonance-breathing (HRV) biofeedback has randomized-trial evidence for some outcomes, for example self-reported anxiety and stress and blood-pressure reactivity, but trials are often small, hard to blind, and effects elsewhere are less consistent. This page is an educational demonstration, not a medical device or a treatment. Slow breathing should be gentle, not deep or forced: if you feel light-headed or short of breath, return to normal breathing.</div>
   ${pats.length?`<div class="row" style="gap:6px"><span class="lbl">Related patterns</span>${pats.map(([id,n])=>`<button class="chip" type="button" data-pat="${id}">${n}</button>`).join('')}</div>`:''}`);
  host.appendChild(intro);

  /* ---- card 2: trainer ---- */
  const tr=el('div','card stack',`<div class="row" style="justify-content:space-between"><h2>Pacer and live tachogram</h2><span class="lbl" id="hvClock">0:00</span></div>
   <div class="row" id="hvTop"></div>
   <div class="hv-main"><div class="hv-pacer"><canvas id="hvPc" role="img" aria-label="Breathing pacer: the circle grows as you breathe in and shrinks as you breathe out"></canvas><div class="hv-cue" id="hvCue">Press Start</div><div class="hv-sub" id="hvCue2"></div></div>
   <div class="stack" style="gap:6px;min-width:0"><div class="row" style="justify-content:space-between;gap:8px"><span class="lbl" id="hvTl">Heart rate, last 90 s</span><div class="row" id="hvTc" style="gap:8px"></div></div>
   <canvas id="hvTa" class="hv-cv" style="height:230px" role="img" aria-label="Tachogram: heart rate for each beat over time, with the breathing curve behind it"></canvas>
   <div class="hv-leg"><span><i class="ln"></i>Heart rate (each dot a beat)</span><span><i class="ar"></i>Breathing, inhale up</span><span><i class="pc"></i>Pacer</span><span><i class="xx">×</i>Rejected interval</span></div></div></div>
   <div class="stack" style="gap:4px"><span class="lbl" id="hvEl">Synthetic ECG, last seconds: R–R intervals in ms</span><canvas id="hvEc" class="hv-cv" style="height:118px" role="img" aria-label="Synthetic single-lead ECG strip with the R–R interval of each beat labelled in milliseconds"></canvas></div>
   <div class="hv-ctl"><div class="stack" style="gap:8px" id="hvPace"><h3>Pacer</h3></div><div class="stack" style="gap:8px" id="hvSrc"></div></div>`);
  host.appendChild(tr);
  const cvP=$('#hvPc',tr),cvT=$('#hvTa',tr),cvE=$('#hvEc',tr);
  const top=$('#hvTop',tr);
  const srcSeg=segment(top,[['sim','Simulated person'],['sensor','Heart-rate strap']],'sim',v=>{setSrc(v)});
  const bStart=el('button','btn primary','Start');bStart.type='button';top.appendChild(bStart);
  const bReset=el('button','btn small','Reset');bReset.type='button';top.appendChild(bReset);
  const fastL=el('label','row lbl hv-chk','<input type="checkbox" id="hvFast"> Fast ×10 (simulation only)');top.appendChild(fastL);const fastC=$('input',fastL);
  const stat=el('span','hv-stat','');top.appendChild(stat);
  segment($('#hvTc',tr),[['60','60 s'],['90','90 s'],['120','120 s']],'90',v=>{st.win=+v;$('#hvTl',tr).textContent=(st.mode==='hr'?'Heart rate':'R–R interval')+', last '+v+' s';drawTach()});
  segment($('#hvTc',tr),[['hr','HR'],['rr','R–R']],'hr',v=>{st.mode=v;$('#hvTl',tr).textContent=(v==='hr'?'Heart rate':'R–R interval')+', last '+st.win+' s';drawTach()});
  const pace=$('#hvPace',tr);
  const sBr=slider(pace,'Rate (breaths/min)',{min:3.5,max:8,step:.1,val:st.br,fmt:v=>v.toFixed(1)+'/min'},v=>{st.br=v;cue();if(!st.run)drawPacer()});
  const ieRow=el('div','row');ieRow.innerHTML='<span class="lbl">In : out</span>';pace.appendChild(ieRow);
  segment(ieRow,[['.5','1 : 1'],['.4','4 : 6'],['.333','1 : 2']],'.4',v=>{st.fi=+v;cue();if(!st.run)drawPacer()});
  pace.appendChild(el('p','hv-small','A slightly longer exhale is common and comfortable. Breathe through the nose, low and easy; the pacer sets the rhythm, not the depth.'));
  const srcBox=$('#hvSrc',tr);
  const simBox=el('div','stack','<h3>Simulated person</h3>');simBox.style.gap='8px';srcBox.appendChild(simBox);
  const sl={};const addS=(k,l,o)=>{sl[k]=slider(simBox,l,o,v=>{st.P[k]=v})};
  addS('vt','Vagal tone',{min:0,max:1,step:.05,val:st.P.vt,fmt:v=>v<.3?'low':v<.7?'moderate':'high'});
  addS('sym','Stress (sympathetic)',{min:0,max:1,step:.05,val:st.P.sym,fmt:v=>v<.3?'calm':v<.7?'tense':'high'});
  addS('irr','Breathing irregularity',{min:0,max:1,step:.05,val:st.P.irr,fmt:v=>Math.round(v*100)+'%'});
  addS('ect','Ectopic beats, missed beats',{min:0,max:1,step:.05,val:st.P.ect,fmt:v=>v?'≈'+(3.5*v).toFixed(1)+'%':'none'});
  const spL=el('label','row lbl hv-chk','<input type="checkbox"> Ignore the pacer: breathe spontaneously, about 13/min');simBox.appendChild(spL);const spC=$('input',spL);spC.addEventListener('change',()=>{st.P.spont=spC.checked});
  const pr=el('div','row');pr.style.gap='8px';simBox.appendChild(pr);
  const bNew=el('button','btn small','New person');bNew.type='button';pr.appendChild(bNew);const bRev=el('button','btn small','Reveal resonance');bRev.type='button';pr.appendChild(bRev);
  const revTx=el('p','hv-small','');simBox.appendChild(revTx);
  const senBox=el('div','stack','<h3>Heart-rate strap</h3>');senBox.style.gap='8px';senBox.hidden=true;srcBox.appendChild(senBox);
  const hasBT=!!(navigator.bluetooth&&navigator.bluetooth.requestDevice);
  senBox.insertAdjacentHTML('beforeend',hasBT?`<p class="hv-small">Uses the standard Bluetooth Heart Rate service (0x180D, measurement characteristic 0x2A37). Most chest straps send R–R intervals, which is what HRV needs; many wrist and arm sensors send only an averaged heart rate.</p><div class="row" style="gap:8px"><button class="btn small primary" type="button" id="hvCon">Connect heart-rate strap</button><button class="btn small" type="button" id="hvDis" hidden>Disconnect</button></div><p class="hv-small" id="hvBle" aria-live="polite">Not connected.</p><p class="hv-small mono" id="hvPkt"></p>`
    :`<div class="note"><b>Web Bluetooth is not available in this browser.</b> Safari on iPhone and iPad and Firefox do not support it; Chrome or Edge on a computer or on Android do. The simulator works everywhere.</div>`);

  /* ---- card 3: metrics and spectrum ---- */
  const mc=el('div','card stack',`<div class="row" style="justify-content:space-between"><h2>What the numbers mean</h2><span class="lbl" id="hvArt">0 beats</span></div>
   <div class="tiles hv-tiles" id="hvTiles"></div>
   <p class="hv-small">Time-domain values and peak–trough use the last 60 s; the spectrum, peak frequency and coherence use the last 120 s. Intervals are rejected if shorter than 300 ms, longer than 2000 ms, or more than 20% away from the median of the two intervals on each side (ectopic beats, missed or double-counted beats). Rejected intervals are left out and the gap is interpolated.</p>
   <div class="row" style="justify-content:space-between"><h3>Spectrum of the R–R series</h3><span class="lbl" id="hvSl"></span></div>
   <canvas id="hvSp" class="hv-cv" style="height:230px" role="img" aria-label="Power spectrum of the R–R intervals with the VLF, LF and HF bands shaded and the breathing frequency marked"></canvas>
   <p class="hv-small">R–R intervals resampled at 4 Hz, linearly detrended, Welch periodogram (64 s Hann segments, 50% overlap). <b>VLF</b> 0.0033–0.04 Hz: slow thermoregulatory, hormonal and drift components. <b>LF</b> 0.04–0.15 Hz: the baroreflex band, where resonance breathing puts its peak; it is <i>not</i> a pure index of sympathetic tone. <b>HF</b> 0.15–0.4 Hz: respiratory (vagal) band at ordinary breathing rates. At 6 breaths/min the respiratory peak moves from HF into LF.</p>`);
  host.appendChild(mc);
  const TL=[['hr','Mean HR','60 000 ÷ the mean R–R interval.'],['rmssd','RMSSD','Root mean square of successive R–R differences: beat-to-beat change, mostly vagal.'],['sdnn','SDNN','Standard deviation of accepted R–R intervals: all variability in the window.'],
    ['pf','Peak frequency','Tallest spectral peak between 0.04 and 0.26 Hz; × 60 gives cycles per minute.'],['rsa','Peak–trough HR','Highest minus lowest heart rate within each breath, averaged: the RSA amplitude.'],['coh','Coherence','Power within ±0.015 Hz of that peak ÷ total power 0.0033–0.4 Hz. 100% would be one pure oscillation.']];
  $('#hvTiles',mc).innerHTML=TL.map(([k,n,d])=>`<div class="card tile"><div class="lbl">${n}</div><div class="n" id="hvM-${k}">–</div><div class="s">${d}</div></div>`).join('');
  const cvS=$('#hvSp',mc);

  /* ---- card 4: resonance protocol ---- */
  const pc=el('div','card stack',`<div class="row" style="justify-content:space-between"><h2>Find your resonance rate</h2><span class="lbl" id="hvPs">5 steps × 2 min</span></div>
   <p style="max-width:88ch">Breathe with the pacer at 6.5, 6.0, 5.5, 5.0 and 4.5 breaths/min for 2 minutes each. For each rate the first 20 s are skipped (settling), then the protocol records the peak–trough heart rate (RSA amplitude) and the LF peak power (power within ±0.015 Hz of the LF peak). The recommended rate is the one with the largest peak–trough HR; if two are within 5%, the larger LF peak breaks the tie. In the simulator, tick Fast ×10 to run the 10 minutes in one.</p>
   <div class="row"><button class="btn primary" type="button" id="hvPg">Start protocol</button><div class="prog" style="width:180px"><i id="hvPb" style="width:0"></i></div><span class="hv-small" id="hvPt"></span></div>
   <div class="hv-proto"><canvas id="hvPcv" class="hv-cv" style="height:200px" role="img" aria-label="Bar chart of peak to trough heart rate for each breathing rate tested"></canvas><div class="tw"><table class="hv-tab" id="hvPtab"></table></div></div>
   <div id="hvRec"></div>`);
  host.appendChild(pc);const cvB=$('#hvPcv',pc);

  /* ---- data recording ---- */
  const out={breath:t=>st.sB.push(t),beat:(t,k,det)=>onBeat(t,k,det)};
  function onBeat(t,k,det,o={}){const ph={t,k,det,b:null};if(det&&k!=='b'){if(st.lastDet!=null)ph.b=addRR(st.Sr,t,(t-st.lastDet)*1000,o);st.lastDet=t}st.phys.push(ph);if(st.phys.length>600)st.phys.splice(0,200)}
  function reset(){stop();st.t=0;st.pph=0;st.Sr=mkSeries();st.phys=[];st.rT=[];st.rP=[];st.rA=[];st.pB=[];st.sB=[];st.lastDet=null;st.sb.lt=null;st.an=null;st.anAt=-1;st.sim=mkSim(st.pp,st.seed+(Date.now()%9973));st.proto=null;st.why='';st.hrOnly=false;sBr.input.disabled=false;redraw()}
  function advance(dt){let n=Math.max(1,Math.round(dt/DT));while(n--){const p0=Math.floor(st.pph);st.pph+=DT*st.br/60;if(Math.floor(st.pph)>p0)st.pB.push(st.t+DT);
      if(st.src==='sim')simStep(st.sim,st.P,st.pph,st.fi,out);st.t+=DT;
      if(Math.round(st.t/DT)%10===0){st.rT.push(st.t);st.rP.push(vol(st.pph,st.fi));st.rA.push(st.src==='sim'?st.sim.v:NaN)}
      if(st.proto&&!st.proto.done&&st.t-st.proto.t0>=STEP-1e-9){protoStep();if(!st.run)return}}
    if(st.rT.length>24000){const k=12000;st.rT.splice(0,k);st.rP.splice(0,k);st.rA.splice(0,k)}}

  /* ---- loop ---- */
  let raf=0,lastUI=0;
  function frame(now){raf=0;if(!st.run)return;if(host.offsetParent===null){stop('Paused because the page was hidden. Press Resume to continue.');return}
    const dtr=Math.min(.25,Math.max(0,(now-(st.last||now))/1000));st.last=now;st.lastReal=performance.now();advance(dtr*(st.src==='sim'&&st.fast?10:1));if(!st.run){redraw();return}
    drawPacer();drawTach();drawEcg();cue();if(now-lastUI>450){lastUI=now;compute();drawSpec();metrics();protoUI();status()}raf=requestAnimationFrame(frame)}
  function start(){if(st.run)return;st.run=true;st.why='';st.last=0;bStart.textContent='Pause';bStart.setAttribute('aria-pressed','true');if(st.src==='sensor'){st.Sr.brk=true;st.sb.lt=null}raf=requestAnimationFrame(frame);status()}
  function stop(why){if(raf)cancelAnimationFrame(raf);raf=0;if(!st.run&&!why)return;st.run=false;if(why)st.why=why;finalize(st.Sr);bStart.textContent=st.t>0?'Resume':'Start';bStart.setAttribute('aria-pressed','false');
    status();compute(true);metrics();drawSpec();protoUI()}
  bStart.addEventListener('click',()=>st.run?stop():start());
  bReset.addEventListener('click',()=>reset());
  fastC.addEventListener('change',()=>{st.fast=fastC.checked;status()});
  bNew.addEventListener('click',()=>{st.seed=1+Math.floor(Math.random()*9e5);st.pp=mkPerson(st.seed);st.reveal=false;revTx.textContent='';reset()});
  bRev.addEventListener('click',()=>{st.reveal=!st.reveal;revealTx()});
  function revealTx(){revTx.innerHTML=st.reveal?`This person's baroreflex resonates at <b>${st.pp.fr.toFixed(3)} Hz = ${(st.pp.fr*60).toFixed(1)} breaths/min</b> (damping ζ ${st.pp.zeta.toFixed(2)}). Real people do not come labelled: that is what the protocol is for.`:'';bRev.textContent=st.reveal?'Hide resonance':'Reveal resonance'}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&st.run)stop('Paused because the browser tab was hidden.')});

  /* ---- source switching and Bluetooth ---- */
  const ble={dev:null,ch:null,manual:false,tries:0,on:false};
  function setSrc(v){if(v===st.src)return;stop();st.src=v;simBox.hidden=v!=='sim';senBox.hidden=v!=='sensor';fastC.disabled=v!=='sim';if(v!=='sim'){fastC.checked=false;st.fast=false}reset();
    $('#hvEl',tr).textContent=v==='sim'?'Synthetic ECG, last seconds: R–R intervals in ms':'Reconstructed from your R–R intervals, not your ECG: intervals in ms'}
  const bleTx=s=>{const e=$('#hvBle',senBox);if(e)e.textContent=s};
  async function connect(){if(!hasBT)return;try{bleTx('Choose your strap in the browser dialog…');const dev=await navigator.bluetooth.requestDevice({filters:[{services:[0x180D]}]});
      if(ble.dev&&ble.dev!==dev)ble.dev.removeEventListener('gattserverdisconnected',onDisc);ble.dev=dev;ble.manual=false;ble.tries=0;dev.addEventListener('gattserverdisconnected',onDisc);await attach()}
    catch(e){bleTx(e&&e.name==='NotFoundError'?'No strap was chosen.':'Could not connect: '+((e&&e.message)||e))}}
  async function attach(){bleTx('Connecting to '+(ble.dev.name||'strap')+'…');const srv=await ble.dev.gatt.connect(),svc=await srv.getPrimaryService(0x180D),ch=await svc.getCharacteristic(0x2A37);
    if(ble.ch)ble.ch.removeEventListener('characteristicvaluechanged',onPkt);ble.ch=ch;ch.addEventListener('characteristicvaluechanged',onPkt);await ch.startNotifications();ble.tries=0;ble.on=true;
    bleTx('Connected to '+(ble.dev.name||'strap')+'. Press Start when you are settled.');$('#hvCon',senBox).hidden=true;$('#hvDis',senBox).hidden=false}
  function onDisc(){ble.on=false;st.Sr.brk=true;st.sb.lt=null;$('#hvCon',senBox).hidden=false;$('#hvDis',senBox).hidden=true;$('#hvCon',senBox).textContent='Reconnect';
    if(ble.manual){bleTx('Disconnected.');return}if(ble.tries<2){ble.tries++;bleTx('Signal lost'+(st.t?' at '+mmss(st.t):'')+'. Trying to reconnect ('+ble.tries+' of 2)…');setTimeout(()=>{if(ble.dev&&!ble.manual)attach().catch(()=>onDisc())},1200)}
    else bleTx('Signal lost'+(st.t?' at '+mmss(st.t):'')+'. Check that the strap is moist and snug, then press Reconnect.')}
  function onPkt(e){let p;try{p=parse2A37(e.target.value)}catch(_){return}
    const pk=$('#hvPkt',senBox);if(pk)pk.textContent=`Last packet: HR ${p.hr}/min${p.rr.length?' · R–R '+p.rr.map(x=>Math.round(x)).join(', ')+' ms':' · no R–R intervals'}${p.contact===false?' · no skin contact':''}`;
    if(!st.run||st.src!=='sensor')return;const ta=st.t+(performance.now()-(st.lastReal||performance.now()))/1000;
    if(p.rr.length){const sum=p.rr.reduce((s,x)=>s+x,0)/1000;let T=st.sb.lt;if(T==null||Math.abs(T+sum-ta)>1.5){if(T!=null&&ta-T>4)st.Sr.brk=true;T=ta-sum;if(st.lastDet!=null&&T<st.lastDet)T=st.lastDet}
      for(const r of p.rr){T+=r/1000;const ph={t:T,k:'n',det:true,b:addRR(st.Sr,T,r)};st.lastDet=T;st.phys.push(ph)}st.sb.lt=T}
    else if(p.hr>0){st.hrOnly=true;const r=60000/p.hr,T=ta;st.phys.push({t:T,k:'n',det:true,b:addRR(st.Sr,T,r,{approx:true})});st.lastDet=T;st.sb.lt=T}
    if(st.phys.length>600)st.phys.splice(0,200)}
  if(hasBT){$('#hvCon',senBox).addEventListener('click',connect);$('#hvDis',senBox).addEventListener('click',()=>{ble.manual=true;try{ble.dev&&ble.dev.gatt.disconnect()}catch(_){}})}

  /* ---- protocol ---- */
  $('#hvPg',pc).addEventListener('click',()=>{if(st.proto&&!st.proto.done){Object.assign(st.proto,{done:true,aborted:true});sBr.input.disabled=false;stop('Protocol stopped.');return}reset();st.proto={i:0,t0:0,res:[],done:false};st.br=RATES[0];sBr.set(st.br);sBr.input.disabled=true;start();protoUI()});
  function protoStep(){const P_=st.proto,a=analyze(st.Sr,P_.t0+SKIP,st.t,st.src==='sim'?st.sB:st.pB,st.br/60);P_.res.push({rate:RATES[P_.i],rsa:a.rsa,lfpk:a.lfpk,lff:a.lff,coh:a.coh,hr:a.hr,n:a.n,rej:a.rej});
    P_.i++;P_.t0=st.t;if(P_.i<RATES.length){st.br=RATES[P_.i];sBr.set(st.br)}else{P_.done=true;sBr.input.disabled=false;recommend();stop('Protocol complete.')}}
  function recommend(){const R=st.proto.res.filter(r=>isFinite(r.rsa));if(!R.length){st.proto.best=null;return}const mx=Math.max(...R.map(r=>r.rsa)),near=R.filter(r=>r.rsa>=.95*mx);
    near.sort((a,b)=>(b.lfpk||0)-(a.lfpk||0));st.proto.best=near[0].rate;st.proto.tie=near.length>1}
  function protoUI(){const P_=st.proto,bar=$('#hvPb',pc),tx=$('#hvPt',pc),bt=$('#hvPg',pc);
    if(!P_){bar.style.width='0';tx.textContent=st.src==='sim'?'10 min of simulated time.':'10 min with the strap.';bt.textContent='Start protocol';$('#hvRec',pc).innerHTML='';tab();drawBars();return}
    const prog=P_.done?(P_.aborted?P_.res.length/RATES.length:1):(P_.i+Math.min(1,(st.t-P_.t0)/STEP))/RATES.length;bar.style.width=Math.round(prog*100)+'%';
    bt.textContent=P_.done?'Run again':'Stop protocol';
    tx.textContent=P_.done?(P_.aborted?'Stopped after '+P_.res.length+' of 5 rates.':'Done.'):`Step ${P_.i+1} of 5: ${RATES[P_.i].toFixed(1)} breaths/min, ${mmss(STEP-(st.t-P_.t0))} left`;
    tab();drawBars();const rc=$('#hvRec',pc);
    if(P_.done&&!P_.aborted&&P_.best!=null){const b=P_.res.find(r=>r.rate===P_.best);rc.innerHTML=`<div class="note"><b>Recommended: ${P_.best.toFixed(1)} breaths/min</b> (${(P_.best/60).toFixed(3)} Hz). Peak–trough HR ${b.rsa.toFixed(1)} bpm, the largest of the five${P_.tie?'; another rate was within 5%, so the larger LF peak decided':''}. ${st.src==='sim'?`This simulated person's true resonance is ${(st.pp.fr*60).toFixed(1)} breaths/min: the protocol can only choose among the rates it tested, and noise makes neighbouring rates close.`:'Results vary from day to day; repeating the protocol on another day and choosing the rate that wins most often is more reliable than one run.'}</div><div class="row" style="margin-top:8px"><button class="btn small" type="button" id="hvUse">Breathe at ${P_.best.toFixed(1)}/min</button></div>`;
      $('#hvUse',rc).addEventListener('click',()=>{st.br=P_.best;sBr.set(st.br);cue();drawPacer()})}else if(!P_.done)rc.innerHTML='';else if(P_.aborted)rc.innerHTML=''}
  function tab(){const R=st.proto?st.proto.res:[],best=st.proto&&st.proto.best,cur=st.proto&&!st.proto.done?st.proto.i:-1,f=(v,d=1)=>isFinite(v)?v.toFixed(d):'–';
    $('#hvPtab',pc).innerHTML=`<thead><tr><th>Rate /min</th><th>Peak–trough HR</th><th>LF peak (ms²)</th><th>Peak Hz</th><th>Coherence</th><th>Mean HR</th></tr></thead><tbody>${RATES.map((r,i)=>{const x=R[i];return`<tr${i===cur?' aria-current="true"':''}${x&&best===r?' class="best"':''}><td>${r.toFixed(1)}</td><td>${x?f(x.rsa)+' bpm':'–'}</td><td>${x?f(x.lfpk,0):'–'}</td><td>${x?f(x.lff,3):'–'}</td><td>${x?f(x.coh,0)+'%':'–'}</td><td>${x?f(x.hr,0):'–'}</td></tr>`}).join('')}</tbody>`}

  /* ---- drawing ---- */
  function cue(){const c=$('#hvCue',tr),c2=$('#hvCue2',tr),ph=st.pph-Math.floor(st.pph),per=60/st.br,ins=per*st.fi,exs=per-ins;
    if(!st.run&&!st.t){c.textContent='Press Start';c2.textContent=`In ${ins.toFixed(1)} s · out ${exs.toFixed(1)} s`;return}
    if(!st.run){c.textContent='Paused';c2.textContent=`In ${ins.toFixed(1)} s · out ${exs.toFixed(1)} s`;return}
    if(st.fast&&st.src==='sim'){c.textContent=ph<st.fi?'In':'Out';c2.textContent='Fast simulation: watch, don’t follow';return}
    const inh=ph<st.fi,left=inh?(st.fi-ph)*per:(1-ph)*per;const t1=inh?'Breathe in':'Breathe out',t2=Math.ceil(left-1e-6)+' s · '+st.br.toFixed(1)+'/min';if(c.textContent!==t1)c.textContent=t1;if(c2.textContent!==t2)c2.textContent=t2}
  function drawPacer(){const S=setup(cvP);if(!S)return;const{g,w,h}=S,cx=w/2,cy=h/2,R=Math.min(w,h)/2-6,r0=R*.3,v=st.t>0?vol(st.pph,st.fi):0,inh=(st.pph-Math.floor(st.pph))<st.fi;
    if(rmo()){/* reduced motion: a fixed ring whose fill rises and falls, no size change */const bw=Math.min(54,w*.25),bh=h-24,x=cx-bw/2,y=12;g.strokeStyle=C.line;g.lineWidth=1.5;g.strokeRect(x+.5,y+.5,bw,bh);g.fillStyle=C.accent;g.globalAlpha=.3;g.fillRect(x+1,y+bh*(1-v),bw-1,bh*v);g.globalAlpha=1;return}
    g.strokeStyle=C.line;g.lineWidth=1.5;g.setLineDash([3,5]);g.beginPath();g.arc(cx,cy,R,0,7);g.stroke();g.beginPath();g.arc(cx,cy,r0,0,7);g.stroke();g.setLineDash([]);
    const r=r0+(R-r0)*v,gr=g.createRadialGradient(cx,cy,r*.2,cx,cy,r);gr.addColorStop(0,C.panel);gr.addColorStop(1,C.accent);g.globalAlpha=.18+.2*v;g.fillStyle=gr;g.beginPath();g.arc(cx,cy,r,0,7);g.fill();g.globalAlpha=.9;g.strokeStyle=C.accent;g.lineWidth=2.5;g.beginPath();g.arc(cx,cy,r,0,7);g.stroke();g.globalAlpha=1;
    if(st.t>0){g.fillStyle=C.accent;g.font='600 12px '+C.ui;g.textAlign='center';g.fillText(inh?'▲ in':'▼ out',cx,cy+4)}}
  function drawTach(){const S=setup(cvT);if(!S)return;const{g,w,h}=S,ml=42,mr=8,mt=8,mb=22,pw=w-ml-mr,ph=h-mt-mb,tE=Math.max(st.t,st.win),tS=tE-st.win,X=t=>ml+(t-tS)/st.win*pw;
    const B=st.Sr.b,i0=lowIdx(B,tS-2),vis=[],val=b=>st.mode==='hr'?60000/b.rr:b.rr;for(let i=i0;i<B.length;i++)vis.push(B[i]);
    const vs=vis.filter(b=>b.s!=='x'&&b.t>=tS).map(val);let lo=vs.length?Math.min(...vs):st.mode==='hr'?55:700,hi=vs.length?Math.max(...vs):st.mode==='hr'?85:1000;const span=st.mode==='hr'?14:180;if(hi-lo<span){const m=(hi+lo)/2;lo=m-span/2;hi=m+span/2}const pad=(hi-lo)*.12;lo-=pad;hi+=pad;
    const Y=v=>mt+(hi-v)/(hi-lo)*ph;
    /* breathing behind the trace */
    const j0=bsearch(st.rT,tS);if(st.rT.length){const yb=v=>mt+ph-(v/1.5)*ph*.92;
      const hasA=st.src==='sim';if(hasA){g.beginPath();g.moveTo(X(Math.max(tS,st.rT[j0]||tS)),mt+ph);for(let j=j0;j<st.rT.length;j++)g.lineTo(X(st.rT[j]),yb(st.rA[j]));g.lineTo(X(st.rT[st.rT.length-1]),mt+ph);g.closePath();g.fillStyle=C.accent;g.globalAlpha=.11;g.fill();g.globalAlpha=1}
      g.strokeStyle=C.accent;g.globalAlpha=.55;g.lineWidth=1.2;g.setLineDash([5,4]);g.beginPath();for(let j=j0;j<st.rT.length;j++){const x=X(st.rT[j]),y=yb(st.rP[j]);j===j0?g.moveTo(x,y):g.lineTo(x,y)}g.stroke();g.setLineDash([]);g.globalAlpha=1}
    /* grid */
    g.font='10.5px '+C.mono;g.fillStyle=C.muted;g.strokeStyle=C.grid;g.lineWidth=1;const stp=niceStep((hi-lo)/4);for(let v=Math.ceil(lo/stp)*stp;v<=hi;v+=stp){const y=Math.round(Y(v))+.5;g.beginPath();g.moveTo(ml,y);g.lineTo(w-mr,y);g.stroke();g.textAlign='right';g.fillText(Math.round(v)+'',ml-5,y+3.5)}
    g.save();g.translate(11,mt+ph/2);g.rotate(-Math.PI/2);g.textAlign='center';g.fillText(st.mode==='hr'?'beats/min':'R–R ms',0,0);g.restore();
    const ts=st.win>90?20:10;for(let t=Math.ceil(tS/ts)*ts;t<=tE;t+=ts){const x=Math.round(X(t))+.5;g.strokeStyle=C.grid;g.beginPath();g.moveTo(x,mt);g.lineTo(x,mt+ph);g.stroke();g.textAlign='center';g.fillStyle=C.muted;g.fillText(mmss(t),x,h-6)}
    /* trace */
    g.save();g.beginPath();g.rect(ml,mt,pw,ph);g.clip();const okv=vis.filter(b=>b.s!=='x');g.strokeStyle=C.trace;g.lineWidth=1.8;g.lineJoin='round';g.beginPath();let first=true;
    okv.forEach(b=>{const x=X(b.t),y=Y(val(b));if(first||b.brk){g.moveTo(x,y);first=false}else g.lineTo(x,y)});g.stroke();
    okv.forEach(b=>{const x=X(b.t),y=Y(val(b));g.beginPath();g.arc(x,y,b.s==='p'?3:2.2,0,7);if(b.s==='p'){g.strokeStyle=C.muted;g.lineWidth=1.2;g.stroke()}else{g.fillStyle=C.trace;g.fill()}});
    vis.filter(b=>b.s==='x').forEach(b=>{const x=X(b.t),y=clamp(Y(val(b)),mt+6,mt+ph-6);g.strokeStyle=C.bad;g.lineWidth=2;g.beginPath();g.moveTo(x-4,y-4);g.lineTo(x+4,y+4);g.moveTo(x+4,y-4);g.lineTo(x-4,y+4);g.stroke()});g.restore();
    if(!B.length){g.fillStyle=C.muted;g.font='13px '+C.ui;g.textAlign='center';g.fillText(st.src==='sensor'?'Connect the strap, then press Start':'Press Start: the simulated person breathes with the pacer',ml+pw/2,mt+ph/2)}}
  function drawEcg(){const S=setup(cvE);if(!S)return;const{g,w,h}=S,dur=clamp(Math.round(w/110),4,9),tNow=st.t-(st.src==='sensor'?1.5:0),tE=Math.max(tNow,dur),tS=tE-dur,X=t=>(t-tS)/dur*w,base=h*.66,mv=h*.42;
    g.fillStyle=C.paper;g.fillRect(0,0,w,h);const pxs=w/dur;g.lineWidth=1;if(pxs*.04>=3.5){g.strokeStyle=C.gmin;g.beginPath();for(let t=Math.ceil(tS/.04)*.04;t<=tE;t+=.04){const x=Math.round(X(t))+.5;g.moveTo(x,0);g.lineTo(x,h)}for(let y=h;y>0;y-=pxs*.04){g.moveTo(0,Math.round(y)+.5);g.lineTo(w,Math.round(y)+.5)}g.stroke()}
    g.strokeStyle=C.gmaj;g.beginPath();for(let t=Math.ceil(tS/.2)*.2;t<=tE+1e-9;t+=.2){const x=Math.round(X(t))+.5;g.moveTo(x,0);g.lineTo(x,h)}for(let y=h;y>0;y-=pxs*.2){g.moveTo(0,Math.round(y)+.5);g.lineTo(w,Math.round(y)+.5)}g.stroke();
    const ph=st.phys.filter(p=>p.t>tS-1&&p.t<tE+.6),fs=Math.min(400,Math.max(120,Math.round(2*pxs))),n=Math.ceil(dur*fs),y=new Float32Array(n);
    const G=(t,s)=>Math.exp(-t*t/(2*s*s));for(const p of ph){const tq=p.k==='v'?.42:.3,i0=Math.max(0,Math.floor((p.t-.3-tS)*fs)),i1=Math.min(n-1,Math.ceil((p.t+.55-tS)*fs));
      for(let i=i0;i<=i1;i++){const u=tS+i/fs-p.t;let v;if(p.k==='v')v=1.05*G(u,.032)-.45*G(u-.075,.03)-.32*G(u-tq,.07);else if(p.k==='b')v=.12*G(u+.16,.025);else v=.12*G(u+.16,.025)-.08*G(u+.024,.008)+G(u,.011)-.24*G(u-.024,.01)+.26*G(u-tq,.05);y[i]+=v}}
    if(st.src==='sim'&&st.rT.length){const j0=bsearch(st.rT,tS);for(let i=0;i<n;i++){const j=Math.min(st.rT.length-1,j0+Math.floor(i/fs*10));y[i]-=.08*((st.rA[j]||0)-.5)}}
    g.strokeStyle=C.trace;g.lineWidth=1.4;g.lineJoin='round';g.beginPath();const iE=Math.min(n,Math.ceil((tNow-tS)*fs));for(let i=0;i<iE;i++){const x=i/fs*pxs,yy=base-y[i]*mv;i?g.lineTo(x,yy):g.moveTo(x,yy)}g.stroke();
    g.font='600 11px '+C.mono;g.textAlign='center';let prev=null;for(const p of ph){if(p.t>tNow)continue;if(p.det&&p.k!=='b'){if(prev&&p.b){const x0=X(prev.t),x1=X(p.t),yb=13,col=p.b.s==='x'?C.bad:p.b.s==='p'?C.muted:C.ink;
          g.strokeStyle=col;g.lineWidth=1;g.beginPath();g.moveTo(x0+2,yb+4);g.lineTo(x0+2,yb);g.lineTo(x1-2,yb);g.lineTo(x1-2,yb+4);g.stroke();const s=Math.round(p.b.rr)+'',tw=g.measureText(s).width;if(x1-x0>tw+6){g.fillStyle=C.paper;g.fillRect((x0+x1)/2-tw/2-3,yb-6,tw+6,12);g.fillStyle=col;g.fillText(s,(x0+x1)/2,yb+4)}}prev=p}
      if(p.k==='v'){g.fillStyle=C.bad;g.font='600 10.5px '+C.ui;g.fillText('ectopic',X(p.t),h-6);g.font='600 11px '+C.mono}
      else if(!p.det&&p.k==='n'){g.fillStyle=C.warn;g.font='600 10.5px '+C.ui;g.fillText('missed by detector',X(p.t),h-6);g.font='600 11px '+C.mono}}}
  function drawSpec(){const S=setup(cvS);if(!S)return;const{g,w,h}=S,ml=48,mr=10,mt=20,mb=34,pw=w-ml-mr,ph=h-mt-mb,F=.5,X=f=>ml+f/F*pw,a=st.an;
    [[.0033,.04,C.muted,'VLF'],[.04,.15,C.accent,'LF'],[.15,.4,C.mark,'HF']].forEach(([f1,f2,c,n])=>{g.fillStyle=c;g.globalAlpha=.09;g.fillRect(X(f1),mt,X(f2)-X(f1),ph);g.globalAlpha=1;g.fillStyle=c;g.font='600 11px '+C.ui;g.textAlign='center';g.fillText(n,(X(f1)+X(f2))/2,mt-6)});
    g.strokeStyle=C.line;g.lineWidth=1;g.beginPath();g.moveTo(ml,mt+ph+.5);g.lineTo(w-mr,mt+ph+.5);g.stroke();g.font='10.5px '+C.mono;g.fillStyle=C.muted;
    for(let f=0;f<=F+1e-9;f+=.1){const x=Math.round(X(f))+.5;g.strokeStyle=C.grid;g.beginPath();g.moveTo(x,mt);g.lineTo(x,mt+ph);g.stroke();g.textAlign=f===0?'left':f>=F-1e-9?'right':'center';g.fillText(f.toFixed(1)+' Hz',x,mt+ph+13);g.fillText(Math.round(f*60)+'/min',x,mt+ph+26)}
    const fb=st.P.spont&&st.src==='sim'?null:st.br/60;if(fb){const x=X(fb);g.strokeStyle=C.mark;g.lineWidth=1.5;g.setLineDash([4,3]);g.beginPath();g.moveTo(x,mt);g.lineTo(x,mt+ph);g.stroke();g.setLineDash([])}
    if(!a||!a.S){g.fillStyle=C.muted;g.font='13px '+C.ui;g.textAlign='center';g.fillText('Needs at least 30 s of clean beats',ml+pw/2,mt+ph/2);$('#hvSl',mc).textContent='';return}
    const P=a.S.P,df=a.S.df,km=Math.floor(F/df);let mx=0;for(let k=1;k<=km;k++)mx=Math.max(mx,P[k]);mx=mx*1.12||1;const Y=v=>mt+ph-v/mx*ph;
    g.fillStyle=C.muted;g.textAlign='right';g.font='10.5px '+C.mono;const sp=niceStep(mx/3);for(let v=sp;v<mx;v+=sp){const y=Math.round(Y(v))+.5;g.strokeStyle=C.grid;g.beginPath();g.moveTo(ml,y);g.lineTo(w-mr,y);g.stroke();g.fillText(fmtK(v),ml-5,y+3.5)}
    g.save();g.translate(11,mt+ph/2);g.rotate(-Math.PI/2);g.textAlign='center';g.fillText('ms²/Hz',0,0);g.restore();
    g.beginPath();g.moveTo(X(0),Y(0));for(let k=0;k<=km;k++)g.lineTo(X(k*df),Y(P[k]));g.lineTo(X(km*df),Y(0));g.closePath();g.fillStyle=C.trace;g.globalAlpha=.12;g.fill();g.globalAlpha=1;
    g.strokeStyle=C.trace;g.lineWidth=1.8;g.beginPath();for(let k=0;k<=km;k++){const x=X(k*df),y=Y(P[k]);k?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();
    g.font='600 11px '+C.ui;if(fb){g.fillStyle=C.mark;g.textAlign=fb>.35?'right':'left';g.fillText('pacer '+fb.toFixed(3)+' Hz',X(fb)+(fb>.35?-5:5),mt+12)}
    if(a.pf){const k=Math.round(a.pf/df),x=X(a.pf),y=Y(P[k]);g.fillStyle=C.accent;g.beginPath();g.arc(x,y,4,0,7);g.fill();g.textAlign=a.pf>.3?'right':'left';g.fillText('peak '+a.pf.toFixed(3)+' Hz',x+(a.pf>.3?-7:7),Math.max(mt+26,y-4))}
    $('#hvSl',mc).textContent=`${a.n} intervals · LF ${fmtK(a.lf)} · HF ${fmtK(a.hf)} ms²`}
  function drawBars(){const S=setup(cvB);if(!S)return;const{g,w,h}=S,R=st.proto?st.proto.res:[],ml=40,mr=46,mt=14,mb=34,pw=w-ml-mr,ph=h-mt-mb,n=RATES.length,bw=pw/n;
    const mx=Math.max(10,...R.map(r=>isFinite(r.rsa)?r.rsa:0))*1.15,ml2=Math.max(1,...R.map(r=>r.lfpk||0))*1.15,Y=v=>mt+ph-v/mx*ph,Y2=v=>mt+ph-v/ml2*ph;
    g.font='10.5px '+C.mono;g.fillStyle=C.muted;g.strokeStyle=C.grid;g.lineWidth=1;const sp=niceStep(mx/4);for(let v=0;v<mx;v+=sp){const y=Math.round(Y(v))+.5;g.beginPath();g.moveTo(ml,y);g.lineTo(w-mr,y);g.stroke();g.textAlign='right';g.fillText(v+'',ml-5,y+3.5)}
    g.save();g.translate(10,mt+ph/2);g.rotate(-Math.PI/2);g.textAlign='center';g.fillText('peak–trough bpm',0,0);g.restore();g.save();g.translate(w-8,mt+ph/2);g.rotate(Math.PI/2);g.textAlign='center';g.fillStyle=C.mark;g.fillText('LF peak ms²',0,0);g.restore();
    const cur=st.proto&&!st.proto.done?st.proto.i:-1,best=st.proto&&st.proto.best;
    RATES.forEach((r,i)=>{const x=ml+i*bw+bw*.2,ww=bw*.6,x0=R[i];g.fillStyle=C.muted;g.textAlign='center';g.fillText(r.toFixed(1)+'/min',x+ww/2,h-18);
      if(x0&&isFinite(x0.rsa)){g.fillStyle=best===r?C.good:C.accent;g.globalAlpha=best===r?.9:.55;g.fillRect(x,Y(x0.rsa),ww,Y(0)-Y(x0.rsa));g.globalAlpha=1;g.fillStyle=C.ink;g.fillText(x0.rsa.toFixed(1),x+ww/2,Y(x0.rsa)-4)}
      if(i===cur){g.strokeStyle=C.accent;g.lineWidth=1.5;g.setLineDash([4,3]);g.strokeRect(x+.5,mt+.5,ww,ph);g.setLineDash([])}});
    const pts=R.map((x,i)=>x&&x.lfpk?[ml+i*bw+bw/2,Y2(x.lfpk)]:null).filter(Boolean);g.strokeStyle=C.mark;g.fillStyle=C.mark;g.lineWidth=1.5;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();pts.forEach(p=>{g.beginPath();g.arc(p[0],p[1],3.5,0,7);g.fill()});
    g.fillStyle=C.muted;g.textAlign='center';g.fillText('bars: peak–trough HR · line: LF peak power',ml+pw/2,h-4)}
  function compute(force){if(!force&&st.t-st.anAt<.4)return;st.anAt=st.t;const aT=analyze(st.Sr,st.t-60,st.t,st.src==='sim'?st.sB:st.pB,0,false),aS=analyze(st.Sr,st.t-120,st.t,[],st.br/60);
    st.an=Object.assign({},aS,{hr:aT.hr,rmssd:aT.rmssd,sdnn:aT.sdnn,rsa:aT.rsa,n:aS.n,rej:aS.rej})}
  function metrics(){const a=st.an||{},f=(v,d,u)=>isFinite(v)?v.toFixed(d)+(u?'<small> '+u+'</small>':''):'–',set=(k,s)=>{const e=$('#hvM-'+k,mc);if(e.innerHTML!==s)e.innerHTML=s};
    set('hr',f(a.hr,0,'bpm'));set('rmssd',f(a.rmssd,0,'ms'));set('sdnn',f(a.sdnn,0,'ms'));set('pf',isFinite(a.pf)?a.pf.toFixed(3)+'<small> Hz · '+(a.pf*60).toFixed(1)+'/min</small>':'–');set('rsa',f(a.rsa,1,'bpm'));set('coh',f(a.coh,0,'%'));
    const B=st.Sr.b,cl=B.filter(b=>b.s!=='p'),rj=cl.filter(b=>b.s==='x').length;$('#hvArt',mc).textContent=`${cl.length} intervals · ${rj} rejected${cl.length?' ('+(100*rj/cl.length).toFixed(1)+'%)':''}${st.hrOnly?' · heart rate only: HRV approximate':''}`}
  function status(){$('#hvClock',tr).textContent=mmss(st.t)+(st.fast&&st.src==='sim'?' · ×10':'');stat.textContent=st.why||(st.run?(st.src==='sim'?'Recording the simulated person.':ble.on?'Recording from the strap.':'Pacer only: no strap connected.'):'')}
  function redraw(){C=pal();drawPacer();drawTach();drawEcg();compute(true);drawSpec();metrics();cue();status();protoUI()}

  /* atlas chips: a document-level handler opens the atlas; if nothing navigated, open it here */
  host.addEventListener('click',e=>{const b=e.target.closest('[data-pat]');if(!b)return;const id=b.dataset.pat;setTimeout(()=>{if(host.offsetParent===null||typeof openAtlas!=='function')return;try{if(typeof setSub==='function')setSub('pat')}catch(_){}openAtlas(id)},0)});
  AX.draws.hrv=[redraw];redraw();
  return{redraw,_st:st}}

function bsearch(a,t){let lo=0,hi=a.length;while(lo<hi){const m=(lo+hi)>>1;if(a[m]<t)lo=m+1;else hi=m}return lo}
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x||1))),m=x/p;return(m<1.5?1:m<3.5?2:m<7.5?5:10)*p}
function fmtK(v){return v>=1e4?(v/1e3).toFixed(0)+'k':v>=1e3?(v/1e3).toFixed(1)+'k':v>=10?v.toFixed(0):v.toFixed(1)}
function loopSvg(){const box=(x,y,w,t1,t2,hl)=>`<rect x="${x}" y="${y}" width="${w}" height="40" rx="7" fill="${hl?'color-mix(in srgb,var(--accent) 12%,var(--panel))':'var(--soft)'}" stroke="${hl?'var(--accent)':'var(--line)'}"/><text x="${x+w/2}" y="${y+17}" text-anchor="middle" font-weight="600" fill="var(--ink)">${t1}</text><text x="${x+w/2}" y="${y+31}" text-anchor="middle" fill="var(--muted)" font-size="10">${t2}</text>`;
  const ar=(d,lab,lx,ly,anc='middle',dash)=>`<path d="${d}" fill="none" stroke="var(--muted)" stroke-width="1.5" marker-end="url(#hvAr)"${dash?' stroke-dasharray="4 3"':''}/>${lab?`<text x="${lx}" y="${ly}" text-anchor="${anc}" fill="var(--mark)" font-size="10">${lab}</text>`:''}`;
  return`<svg class="hv-svg" viewBox="0 0 400 236" role="img" aria-label="Diagram: breathing gates the vagal motoneurons that slow the sinus node; heart rate changes blood pressure, which the baroreceptors feed back to the brainstem with a delay of about 5 seconds" font-family="var(--font-ui)" font-size="11">
   <defs><marker id="hvAr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>
   ${box(26,8,110,'Breathing','lung stretch, chest')}${box(200,8,154,'Nucleus ambiguus','cardiac vagal neurons',1)}${box(200,98,154,'Sinus node','ACh: I_K,ACh ↑, I_f ↓',1)}${box(200,188,154,'Heart rate','beat to beat')}${box(26,188,110,'Blood pressure','stroke volume, tone')}${box(26,98,110,'Baroreceptors','carotid sinus, aorta')}
   ${ar('M136 28 L198 28','inhibits',167,22)}${ar('M277 48 L277 96','vagus: same beat',283,76,'start')}${ar('M277 138 L277 186','',0,0)}${ar('M198 208 L138 208','',0,0)}${ar('M81 186 L81 140','',0,0)}${ar('M136 112 L198 42','≈ 5 s loop delay',126,76,'end')}${ar('M26 22 L12 22 L12 208 L24 208','',0,0,'middle',1)}
   <text transform="translate(9 118) rotate(-90)" text-anchor="middle" fill="var(--mark)" font-size="10">chest pressure</text>
   <text x="180" y="232" text-anchor="middle" fill="var(--muted)" font-size="10">The loop resonates near 0.1 Hz: breathe at that rate and the two paths add.</text></svg>`}
return{build,parse2A37,_t:{mkPerson,mkSim,simStep,mkSeries,addRR,finalize,analyze,vol,welch,resample}};
})();
function buildHrv(host){return HRV.build(host)}
