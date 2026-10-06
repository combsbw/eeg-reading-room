/* ============ pattern generators, part 2: sleep, age, variants, ICU artifacts, epilepsy, ACNS, encephalopathy, coma, neonatal ============ */
T.poly=t=>g(t+.075,.008)+.85*g(t+.045,.008)+g(t+.015,.009)-.25*g(t+.11,.02)-.8*g(t-.13,.07);
T.cts=t=>g(t,.02)-.3*g(t+.04,.02)-.35*g(t-.07,.04);
T.ssw=t=>g(t,.04)-.2*g(t+.07,.03)-.9*g(t-.22,.11);
T.saw=t=>{const u=t/.08;return u<-1||u>2.2?0:u<0?(1+u):1-(u)/2.2};
T.lam=t=>-(Math.max(0,1-Math.abs(t)/.07)-.25*g(t-.12,.04));
T.pos=t=>-g(t,.012);
T.drip=t=>t<0?0:(g(t,.01)*.9-Math.exp(-t/.06)*.25);
T.pulse=t=>t<0?0:Math.sin(Math.min(1,t/.35)*Math.PI)*(1-Math.min(1,t/.35))*1.6;
T.sp6=t=>.35*g(t,.006)-.2*g(t+.02,.008)-.55*g(t-.07,.035);
T.burst=t=>g(t,.05);
function ecgHR(R,r,hr0,hr1){const beats=[];let t=r.r(0,.4);while(t<DUR+.5){const hr=hr1==null?hr0:hr0+(hr1-hr0)*clamp(t/DUR,0,1);beats.push(t);t+=60/hr*(1+.02*r.n())}
  const s=new Float32Array(N);for(const b of beats){const i0=Math.max(0,Math.floor((b-.3)*FS)),i1=Math.min(N-1,Math.ceil((b+.5)*FS));for(let n=i0;n<=i1;n++)s[n]+=T.qrs(n/FS-b)}R.ecg=s;R.beats=beats}
function comaBg(R,r,o={}){const k=o.v??1;addBg(R,r,{rms:1.8*k,lo:1,hi:25});if(o.delta!==0)addBand(R,r,W.all.map((v,i)=>.6+.4*W.fc[i]),.6,3,(o.delta??12)*k,waxwane(r,.35,[2,4]));if(o.theta!==0)addBand(R,r,W.all,4,7,(o.theta??5)*k);if(o.beta)addBand(R,r,W.fc,13,25,o.beta*k)}
function stim(R,t,txt){R.ann.push({t0:t,t1:t+.35,txt:txt||'Stimulus: voice and sternal rub',lvl:1});R.stim=t}
function photicMark(R,t0,t1,f){R.ann.push({t0,t1,txt:`Photic stimulation ${f} Hz`,lvl:1});const s=new Float32Array(N);for(let n=0;n<N;n++){const t=n/FS;if(t>=t0&&t<=t1&&((t-t0)*f)%1<.12)s[n]=1}R.photic=s}
function flashes(R,r,t0,t1,f,amp){const ts=[];for(let t=t0;t<t1;t+=1/f)ts.push(t);ev(R,r,ts,t=>g(t-.1,.025)-.5*g(t-.16,.03),W.post,amp,{span:.3,jit:.05})}
function sideOf(sg){return sg<0?'Left hemisphere':'Right hemisphere'}
const GLOC='Generalized (bilateral, symmetric)';
function identBurst(r,dur){const rr=mkRand(Math.floor(r.u()*1e9)),sig=bandNoise(rr,.7,12,1),o=new Float32Array(Math.round(dur*FS));let m=0;for(let i=0;i<o.length;i++){const u=i/o.length;o[i]=sig[i+200]*Math.min(1,u/.08)*Math.min(1,(1-u)/.3);m+=o[i]}m/=o.length;for(let i=0;i<o.length;i++)o[i]-=m*Math.min(1,(i/o.length)/.08)*Math.min(1,(1-i/o.length)/.3);return o}

/* ---- normal, sleep and age ---- */
GEN.rem=(R,r)=>{addBg(R,r,{rms:2.4,lo:1,hi:25});addBand(R,r,W.all,4,7.5,6);addBand(R,r,W.post,8,11,3.5);addBand(R,r,W.ant,15,25,2.2);
  const st=r.r(3.2,5),P=phaseOf(r,r.r(2.6,3.4),.04);addOsc(R,W.fc.map((v,i)=>v*.8+.2*W.cen[i]),P,wind([[st,st+1.8]],.2),26,0,p=>{const x=((p/6.283)%1+1)%1;return x<.8?1-x/.8*2:-1+(x-.8)/.2*2});
  const em=[];let t=r.r(.6,1.4);while(t<9.4){em.push([t,r.chance(.5)?1:-1]);t+=r.r(.7,1.8)}
  for(const[tc,sgn]of em){const f=x=>x<0?0:(1-Math.exp(-x/.025))*Math.exp(-x/.55);ev(R,r,[tc],f,one(['F7',sgn],['Fp1',.45*sgn],['T3',.2*sgn],['F8',-sgn],['Fp2',-.45*sgn],['T4',-.2*sgn]),120,{span:2,jit:.1})}
  R.ann.push({t0:em[0][0]-.1,t1:em[0][0]+.5,txt:'Rapid eye movement: F7/F8 opposite, sharp onset'});R.ann.push({t0:st,t1:st+1.8,txt:'Sawtooth waves 2–3 Hz, vertex',lvl:1});R.ann.push({t0:0,t1:DUR,txt:'Low-voltage mixed frequencies, no spindles'});};
GEN.child=(R,r)=>{const f=r.r(8.1,8.7);awakeBg(R,r,{A:55,f,rms:4,theta:7});const ts=[];let t=r.r(.5,1.2);while(t<9.5){ts.push(t);t+=r.r(1.1,2.2)}
  ev(R,r,ts,t=>g(t,.13)-.2*g(t-.25,.1),W.post,48,{span:.6,jit:.2});R.meta={pdr:+f.toFixed(1),age:'child 6 years'};blinks(R,r,[r.r(4,6)],70);
  R.ann.push({t0:0,t1:DUR,txt:`Posterior rhythm ~${f.toFixed(1)} Hz: normal for a 6-year-old`});R.ann.push({t0:ts[1]-.3,t1:ts[1]+.4,txt:'Posterior slow wave of youth (delta fused with alpha)',lvl:1});};
GEN.lambda=(R,r)=>{addBg(R,r,{rms:3,lo:1,hi:25});addBand(R,r,W.ant,14,26,4);addBand(R,r,W.post,8,12,4);const ts=[];let t=r.r(.3,.8);while(t<9.6){ts.push(t);t+=r.r(.25,.6)}
  ev(R,r,ts,T.lam,W.post.map((v,i)=>v*(1+.04*XX[i])),42,{span:.3,jit:.25});R.ev=ts;R.ann.push({t0:ts[2]-.1,t1:ts[2]+.15,txt:'Lambda: positive (downward) occipital triangle'});R.ann.push({t0:0,t1:DUR,txt:'Eyes open, scanning a picture: alpha blocked',lvl:1});};
GEN.photic=(R,r)=>{awakeBg(R,r,{A:22});const f=r.pick([6,8,10,12,14,16]),t0=r.r(2,3),t1=t0+r.r(4.5,5.5);flashes(R,r,t0,t1,f,28);photicMark(R,t0,t1,f);R.meta={photic:f};
  R.ann.push({t0:t0+.5,t1,txt:`Occipital driving at the flash rate (${f} Hz)`});};
GEN.hvresp=(R,r)=>{awakeBg(R,r,{A:30,f:9,theta:4});const env=new Float32Array(N),t0=r.r(2,3.5);for(let n=0;n<N;n++)env[n]=ss(clamp((n/FS-t0)/4.5,0,1));const P=phaseOf(r,r.r(2.4,3.2),.08);
  addOsc(R,W.all.map((v,i)=>.45+.55*W.fc[i]),P,env,95,.15);addBand(R,r,W.fc,1,3,25,env);R.meta={age:'child 9 years'};R.ann.push({t0:0,t1:DUR,txt:'Hyperventilation, minute 2',lvl:1});R.ann.push({t0:t0,t1:DUR,txt:'Build-up: high-voltage rhythmic delta, frontal, no spikes'});};

/* ---- benign variants ---- */
GEN.sixfourteen=(R,r)=>{drowsyBg(R,r);const sg=r.chance(.5)?-1:1,w=blob(sg*.8,-.55,.33),tr=[r.r(1.2,2.5),r.r(5.5,7)];
  tr.forEach((t,i)=>{const f=i?6:14;ev(R,r,per(r,t,t+r.r(.6,.9),1/f,.02),T.pos,w,32,{span:.1,jit:.15});R.ann.push({t0:t-.05,t1:t+.85,txt:`${f} Hz positive spikes, ${sg<0?'T5':'T6'}`,lvl:i})});};
GEN.phantom=(R,r)=>{drowsyBg(R,r,{theta:4});const tr=[r.r(1.5,2.6),r.r(5.6,7.2)];tr.forEach((t,i)=>{ev(R,r,per(r,t,t+r.r(.9,1.3),1/6,.02),T.sp6,W.all.map((v,j)=>.4+.6*(W.fc[j]+W.post[j])/2),70,{span:.25});R.ann.push({t0:t,t1:t+1.2,txt:i?'Phantom spike-wave':'6 Hz spike-and-wave: tiny spike, brief, drowsy',lvl:i})});};
GEN.rmtd=(R,r)=>{drowsyBg(R,r,{theta:3});const sg=r.chance(.5)?-1:1,t0=r.r(1.4,2.4),t1=t0+r.r(5,6.5),P=phaseOf(r,r.r(5.3,6.3),.02);
  addOsc(R,blob(sg*.9,.05,.32),P,wind([[t0,t1]],.3),55,0,p=>Math.sin(p)+.35*Math.sin(2*p+1.2));R.ann.push({t0,t1,txt:`Rhythmic notched 5–6 Hz theta, ${sg<0?'left':'right'} midtemporal; does not evolve`});};
GEN.sreda=(R,r)=>{awakeBg(R,r,{A:26});const t0=r.r(2,3),P=phaseOf(r,0,.02,t=>t<t0+1.2?1.5+3*(t-t0)/1.2:5.2),w=blob(0,-.4,.6),env=wind([[t0,DUR+1]],.15);
  addOsc(R,w,P,env,62,0,p=>Math.sin(p)+.5*Math.sin(2*p+.8));R.meta={age:'adult 68 years'};R.ann.push({t0,t1:t0+1.2,txt:'Abrupt onset: sharp monophasic waves'});R.ann.push({t0:t0+1.2,t1:DUR,txt:'Sustained 5–6 Hz parietal rhythm, patient alert and normal',lvl:1});};
GEN.breach=(R,r)=>{const sg=r.chance(.5)?-1:1;awakeBg(R,r,{A:32});const w=blob(sg*.7,.05,.3),P=phaseOf(r,r.r(7,9),.05);
  addOsc(R,w,P,waxwane(r,.4),38,0,p=>Math.cos(p)+.45*Math.cos(2*p));addBand(R,r,w,14,30,12);R.fw=w;R.loc=sideOf(sg);
  R.ann.push({t0:0,t1:DUR,txt:`Higher, sharper, faster activity over the ${sg<0?'left':'right'} craniotomy (C3/T3 or C4/T4)`});};
GEN.hypnhyp=(R,r)=>{drowsyBg(R,r,{theta:6});const runs=[[r.r(1.6,2.5),0],[r.r(6,7),0]];runs.forEach(x=>x[1]=x[0]+r.r(1.6,2.4));
  const P=phaseOf(r,r.r(3.5,4.5),.05);addOsc(R,W.all.map((v,i)=>.45+.55*W.fc[i]),P,wind(runs,.35),85,.05);R.meta={age:'child 4 years'};runs.forEach(([a,b],i)=>R.ann.push({t0:a,t1:b,txt:i?'Hypnagogic burst':'Hypnagogic hypersynchrony: high-voltage 3–5 Hz, drowsy child',lvl:i}));};

/* ---- artifacts (ICU and physiologic) ---- */
GEN.lateye=(R,r)=>{addBg(R,r,{rms:3,lo:1,hi:25});addBand(R,r,W.ant,14,26,4);addBand(R,r,W.post,8,12,5);const ts=[];let t=r.r(.6,1.2),s=1;while(t<9.3){ts.push([t,s]);s=-s;t+=r.r(1,1.8)}
  for(const[tc,sgn]of ts){ev(R,r,[tc],x=>x<0?0:(1-Math.exp(-x/.03))*Math.exp(-x/2.5),one(['F7',sgn],['F8',-sgn],['Fp1',.3*sgn],['Fp2',-.3*sgn],['T3',.25*sgn],['T4',-.25*sgn]),110,{span:1.6,jit:.1});
    ev(R,r,[tc-.01],x=>g(x,.004)-.4*g(x-.012,.005),one(['F7',.8],['F8',.8]),30,{span:.05})}
  R.ann.push({t0:ts[0][0]-.1,t1:ts[0][0]+.6,txt:'Look left/right: F7 and F8 deflect in opposite directions'});R.ann.push({t0:ts[1][0]-.05,t1:ts[1][0]+.1,txt:'Lateral rectus spike',lvl:1});};
GEN.glosso=(R,r)=>{awakeBg(R,r,{A:28});const sp=[[r.r(1.6,2.5),0],[r.r(5.5,6.5),0]];sp.forEach(x=>x[1]=x[0]+r.r(2,2.8));const e=wind(sp,.25);
  addBand(R,r,W.all.map((v,i)=>.25+.75*Math.max(blob(-.75,.45,.45)[i],blob(.75,.45,.45)[i])),.7,3,48,e);addBand(R,r,blob(0,.2,.9),25,60,8,e);
  sp.forEach(([a,b],i)=>R.ann.push({t0:a,t1:b,txt:i?'Talking':'Glossokinetic delta: tongue is a dipole (tip negative); bilateral frontotemporal',lvl:i}));};
GEN.sweat=(R,r)=>{awakeBg(R,r,{A:30});const sg=r.chance(.5)?-1:1,w=blob(sg*.6,.55,.5);addBand(R,r,w,.12,.45,170);R.ann.push({t0:0,t1:DUR,txt:`Very slow sway (< 0.5 Hz) over ${sg<0?'left':'right'} frontal channels: sweat bridging. Try LFF 0.3 Hz`});};
GEN.pulse=(R,r)=>{awakeBg(R,r,{A:30});const k=r.pick(['T4','Fp2','T3','F8']),dl=r.r(.18,.26);ev(R,r,R.beats.map(b=>b+dl),T.pulse,one([k,1]),38,{span:.6,jit:.05});R.fw=one([k,1]);
  R.ann.push({t0:R.beats[1]+dl-.05,t1:R.beats[3]+dl+.35,txt:`Slow wave at ${k} ~${Math.round(dl*1000)} ms after each QRS: an electrode over a pulsating artery`});};
GEN.vent=(R,r)=>{comaBg(R,r,{v:.7});const rate=r.pick([12,14,16,18]),per_=60/rate,ts=[];let t=r.r(.3,1.2);while(t<9.6){ts.push(t);t+=per_}
  const sg=r.chance(.5)?-1:1,w=one([sg<0?'T3':'T4',1],[sg<0?'T5':'T6',.7],[sg<0?'F7':'F8',.4]);ev(R,r,ts,x=>x<0||x>1.4?0:Math.sin(Math.PI*x/1.4),w,55,{span:1.5,jit:.05});
  ts.forEach(tt=>{const e=wind([[tt+.1,tt+.9]],.1);addBand(R,r,w,3,6,10,e)});R.meta={state:'coma',vent:rate};R.ann.push({t0:ts[0],t1:ts[0]+1.4,txt:`Slow wave + rattle with every breath (${rate}/min): condensate in the ventilator tubing`});};
GEN.drip=(R,r)=>{awakeBg(R,r,{A:26});const k=r.pick(['C3','P4','F4','T5']),p=r.r(1,1.6),ts=per(r,r.r(.2,.8),9.8,p,.01);ev(R,r,ts,T.drip,one([k,1]),70,{span:.4,jit:.03});R.fw=one([k,1]);R.ev=ts;
  R.ann.push({t0:ts[1]-.05,t1:ts[1]+.2,txt:`Identical spikes at ${k} only, every ${p.toFixed(1)} s: IV drip charge on the line`});};

/* ---- epileptiform and epilepsy syndromes ---- */
GEN.cts=(R,r)=>{const sg=r.chance(.5)?-1:1;R.loc=sideOf(sg);addBg(R,r,{rms:2.2,lo:1,hi:20});addBand(R,r,W.all,4,7,6);ev(R,r,[r.r(5,6)],T.spind,one(['Cz',1],['C3',.8],['C4',.8],['Fz',.6]),40,{span:.8});
  const neg=blob(sg*.72,-.02,.26),pos=blob(sg*.35,.75,.32),w=neg.map((v,i)=>v-.55*pos[i]),ts=[];let t=r.r(.6,1.2);while(t<9.4){ts.push(t);if(r.chance(.35)){t+=r.r(.35,.6);ts.push(t)}t+=r.r(1,2.2)}
  ev(R,r,ts,T.cts,w,190,{span:.4,jit:.1});R.fw=w;R.ev=ts;R.meta={age:'child 8 years',state:'drowsy'};
  R.ann.push({t0:ts[0]-.1,t1:ts[0]+.25,txt:`Centrotemporal spike, max ${sg<0?'C3/T3':'C4/T4'}; positive frontally (horizontal dipole)`});R.ann.push({t0:0,t1:DUR,txt:'Activated by drowsiness; normal background',lvl:1});};
GEN.jme=(R,r)=>{awakeBg(R,r,{A:34});const runs=[[r.r(1.6,2.6),0],[r.r(6.2,7.3),0]];runs.forEach(x=>x[1]=x[0]+r.r(1,1.8));const w=blob(0,.4,.85).map(v=>.25+.75*v),dl=YY.map((y,i)=>.006*Math.hypot(XX[i],y-.4));
  runs.forEach(([a,b],i)=>{const ts=[];let t=a;while(t<b){ts.push(t);t+=1/r.r(3.8,5.5)}ev(R,r,ts,T.poly,jw(r,w,.15),150,{span:.4,dly:dl,jit:.15});R.ann.push({t0:a-.1,t1:b+.2,txt:i?'Polyspike-wave burst':'Generalized polyspike-and-wave 4–6 Hz, frontal maximum',lvl:i})});
  R.loc=GLOC;R.ev=[runs[0][0]];R.meta={age:'adolescent 16 years'};};
GEN.ppr=(R,r)=>{awakeBg(R,r,{A:26});const f=r.pick([14,16,18,20]),t0=r.r(1.8,2.4),t1=t0+r.r(4,5);flashes(R,r,t0,t1,f,14);photicMark(R,t0,t1,f);const a=t0+r.r(.8,1.3),b=Math.min(9.6,t1+r.r(.3,.9)),ts=[];let t=a;while(t<b){ts.push(t);t+=1/r.r(3,4)}
  ev(R,r,ts,T.poly,blob(0,.2,.9).map(v=>.3+.7*v),120,{span:.4,jit:.12});R.loc=GLOC;R.meta={photic:f};R.ann.push({t0:a,t1:b,txt:'Generalized (poly)spike-wave triggered by the flashes, outlasting them'});};
GEN.lgs=(R,r)=>{R.sens=10;comaBg(R,r,{v:1,delta:14,theta:10});R.meta={age:'child 7 years',state:'awake'};const ts=[];let t=r.r(.2,.6);const f=r.r(1.6,2.3);while(t<9.8){ts.push(t);t+=1/f*(1+.12*r.n())}
  ev(R,r,ts,T.ssw,jw(r,blob(0,.5,.9).map(v=>.3+.7*v),.15),190,{span:.6,jit:.15});R.loc=GLOC;R.acns={m1:'G',m2:'SW',f,plus:'none'};R.ann.push({t0:0,t1:DUR,txt:`Slow spike-and-wave ~${f.toFixed(1)} Hz on a slow background (awake)`});};
GEN.gpfa=(R,r)=>{addBg(R,r,{rms:2.5,lo:1,hi:20});addBand(R,r,W.fc,.6,3,30,waxwane(r,.3,[2,4]));const runs=[[r.r(1.5,2.5),0],[r.r(6,7),0]];runs.forEach(x=>x[1]=x[0]+r.r(1.3,2.2));
  const P=phaseOf(r,r.r(12,18),.05);addOsc(R,blob(0,.4,.85).map(v=>.3+.7*v),P,wind(runs,.08),55,.02);R.loc=GLOC;R.meta={state:'sleep'};runs.forEach(([a,b],i)=>R.ann.push({t0:a,t1:b,txt:i?'GPFA':'Generalized paroxysmal fast activity 10–20 Hz in sleep (tonic seizures)',lvl:i}));};
GEN.tirda=(R,r)=>{const sg=r.chance(.5)?-1:1;R.loc=sideOf(sg);awakeBg(R,r,{A:26,theta:3});const runs=[[r.r(1.2,2.2),0],[r.r(5.8,6.6),0]];runs.forEach(x=>x[1]=x[0]+r.r(2.4,3.2));const f=r.r(1.8,2.6),P=phaseOf(r,f,.03),w=blob(sg*.88,.35,.3);
  addOsc(R,w,P,wind(runs,.3),62,0);R.fw=w;R.acns={m1:'L',m2:'RDA',f,plus:'none',side:sg};runs.forEach(([a,b],i)=>R.ann.push({t0:a,t1:b,txt:i?'TIRDA':`Temporal intermittent rhythmic delta, ${sg<0?'F7/T3':'F8/T4'}`,lvl:i}));};
GEN.gtc=(R,r)=>{awakeBg(R,r,{A:30,win:wind([[0,1.6]],.1)});ecgHR(R,r,88,150);const a=1.6;addBand(R,r,W.all,15,30,10,wind([[a,a+1]],.08));
  addBand(R,r,blob(0,.3,1).map((v,i)=>.6+.4*Math.max(blob(-.9,.2,.4)[i],blob(.9,.2,.4)[i])),25,90,85,wind([[a+.9,a+4.2]],.1));const cl=[];let t=a+4.3,p=.25;while(t<8.6){cl.push(t);t+=p;p*=1.18}
  ev(R,r,cl,x=>g(x,.012)+.6*g(x+.03,.012)-.5*g(x-.12,.06),W.all,140,{span:.3});addBand(R,r,W.all,25,90,60,wind(cl.map(c=>[c-.04,c+.06]),.02));addBg(R,r,{rms:.6,lo:1,hi:30});
  R.ev=[a];R.evk='onset';R.loc=GLOC;R.ann.push({t0:a,t1:a+1,txt:'Onset: generalized attenuation with fast activity'});R.ann.push({t0:a+.9,t1:a+4.2,txt:'Tonic: muscle obscures everything',lvl:1});R.ann.push({t0:a+4.3,t1:8.6,txt:'Clonic: bursts slow down'});R.ann.push({t0:8.7,t1:DUR,txt:'Post-ictal suppression',lvl:1});
  for(let e=0;e<NE;e++){const V=R.V[e];for(let n=Math.floor(8.7*FS);n<N;n++)V[n]*=.18}};
GEN.eswas=(R,r)=>{addBg(R,r,{rms:2,lo:1,hi:20});addBand(R,r,W.fc,.6,3,22);const f=r.r(1.6,2.4),ts=[];let t=r.r(.1,.4);while(t<9.8){ts.push(t);t+=1/f*(1+.1*r.n());if(r.chance(.08))t+=r.r(.4,.8)}
  ev(R,r,ts,T.sw,jw(r,blob(0,.1,.9).map(v=>.35+.65*v),.25),150,{span:.5,jit:.2});R.loc=GLOC;R.meta={age:'child 7 years',state:'sleep',swi:90};R.acns={m1:'G',m2:'SW',f,plus:'none'};R.ann.push({t0:0,t1:DUR,txt:`Near-continuous spike-wave ~${f.toFixed(1)} Hz in non-REM sleep (spike-wave index > 85%)`});};
GEN.ncse=(R,r)=>{R.sens=10;comaBg(R,r,{v:.5,delta:8,theta:4});const f0=r.r(2.6,3.2),ts=[];let t=r.r(.1,.4);while(t<9.8){const f=f0*(1-.18*t/DUR);ts.push(t);t+=1/f*(1+.06*r.n())}const dl=YY.map((y,i)=>.008*Math.hypot(XX[i],y-.3));
  ev(R,r,ts,T.sw,jw(r,blob(0,.35,.85).map(v=>.3+.7*v),.15),125,{span:.5,dly:dl,jit:.12});R.loc=GLOC;R.meta={state:'coma',hist:'Confused for 2 days after a missed medication dose'};R.acns={m1:'G',m2:'SW',f:f0*.92,plus:'none',evo:'fluctuating'};R.ev=ts;
  R.ann.push({t0:0,t1:DUR,txt:`Continuous generalized spike-wave ~${f0.toFixed(1)} Hz in a confused patient: > 2.5 Hz for ≥ 10 s = electrographic seizure`});};

/* ---- ACNS rhythmic and periodic patterns ---- */
GEN.lrda=(R,r)=>{const sg=r.chance(.5)?-1:1,h=hemi(sg);R.loc=sideOf(sg);R.sens=10;comaBg(R,r,{v:.55});const f=r.r(1.1,2.2),P=phaseOf(r,f,.03),w=XX.map((x,i)=>.06+.94*h[i]*Math.exp(-((x-sg*.6)**2+(YY[i]-.2)**2)/(2*.65*.65)));
  const plusS=r.chance(.45);addOsc(R,w,P,mul(ones(),waxwane(r,.2,[3,5])),70,0,p=>Math.sin(p)+.15*Math.sin(2*p));if(plusS){const ts=[];for(let n=1;n<N;n++)if(Math.floor(P[n]/6.283)>Math.floor(P[n-1]/6.283)&&r.chance(.35))ts.push(n/FS-.05);ev(R,r,ts,T.sharp,w,80,{span:.3});}
  R.fw=w;R.acns={m1:'L',m2:'RDA',f,plus:plusS?'+S':'none',side:sg};R.meta={state:'coma'};R.ann.push({t0:0,t1:DUR,txt:`LRDA ~${f.toFixed(1)} Hz, ${sg<0?'left':'right'} hemisphere${plusS?', with superimposed sharp waves (+S)':''}`});};
GEN.grda=(R,r)=>{R.sens=10;comaBg(R,r,{v:.5,theta:6});const f=r.r(1.3,2.3),P=phaseOf(r,f,.03),runs=[[r.r(.3,1),r.r(4.5,6)],[r.r(7,7.5),DUR]];
  addOsc(R,W.all.map((v,i)=>.55+.45*W.fc[i]),P,wind(runs,.4),60,.03);R.loc=GLOC;R.acns={m1:'G',m2:'RDA',f,plus:'none'};R.meta={state:'coma'};R.ann.push({t0:runs[0][0],t1:runs[0][1],txt:`GRDA ~${f.toFixed(1)} Hz, bilateral and synchronous`});};
GEN.bipd=(R,r)=>{R.sens=10;comaBg(R,r,{v:.5,delta:10});const pL=r.r(.7,1.2),pR=pL*r.r(1.25,1.6),tL=per(r,r.r(.1,.6),9.8,pL,.05),tR=per(r,r.r(.2,.9),9.8,pR,.05),wL=blob(-.6,.1,.45),wR=blob(.62,-.15,.45);
  ev(R,r,tL,T.sharp,jw(r,wL,.12),170,{span:.5});ev(R,r,tR,T.sharp,jw(r,wR,.12),130,{span:.5});R.loc='Bilateral independent';R.acns={m1:'BI',m2:'PD',f:(1/pL+1/pR)/2,plus:'none'};R.meta={state:'coma'};
  R.ann.push({t0:0,t1:DUR,txt:`Left PDs ~${(1/pL).toFixed(1)} Hz and right PDs ~${(1/pR).toFixed(1)} Hz, out of step with each other`});};
GEN.lpdplus=(R,r)=>{const sg=r.chance(.5)?-1:1,h=hemi(sg);R.loc=sideOf(sg);R.sens=10;comaBg(R,r,{v:.5});addBand(R,r,h,.8,3,6,waxwane(r,.3));const p=r.r(.6,.95),ts=per(r,r.r(.2,.6),9.8,p,.04),w=XX.map((x,i)=>.06+.94*h[i]*Math.exp(-((x-sg*.6)**2+(YY[i]-.1)**2)/(2*.6*.6)));
  ev(R,r,ts,T.sharp,jw(r,w,.1),210,{span:.5,jit:.06});const fe=wind(ts.map(t=>[t-.04,t+.26]),.04);addBand(R,r,w,14,22,26,fe);R.fw=w;R.ev=ts;R.acns={m1:'L',m2:'PD',f:1/p,plus:'+F',side:sg};R.meta={state:'coma'};
  R.ann.push({t0:0,t1:DUR,txt:`LPD+F ~${(1/p).toFixed(1)} Hz: each discharge carries a burst of low-voltage fast activity`});};
GEN.lpdevol=(R,r)=>{const sg=r.chance(.5)?-1:1,h=hemi(sg);R.loc=sideOf(sg);R.sens=10;comaBg(R,r,{v:.5});const w=XX.map((x,i)=>.05+.95*h[i]*Math.exp(-((x-sg*.65)**2+(YY[i]-.2)**2)/(2*.55*.55)));
  const ts=[];let t=r.r(.2,.5);while(t<9.8){const f=t<3?1.1:t<7?1.1+2.4*(t-3)/4:3.5-.5*(t-7)/3;ts.push(t);t+=1/f*(1+.04*r.n())}
  ev(R,r,ts,T.sharp,w,200,{span:.4,jit:.08});const sp=wind([[3.5,9.6]],.6);addBand(R,r,w,.8,3,10,sp);R.fw=w;R.ev=[3.2];R.evk='onset';R.acns={m1:'L',m2:'PD',f:3.2,plus:'none',evo:'evolving',side:sg};R.meta={state:'coma'};
  R.ann.push({t0:0,t1:3,txt:'LPDs ~1 Hz'});R.ann.push({t0:3,t1:7,txt:'Accelerate past 2.5 Hz and spread: evolution',lvl:1});R.ann.push({t0:7,t1:DUR,txt:'Electrographic seizure'});};
GEN.gsw=(R,r)=>{R.sens=10;comaBg(R,r,{v:.5});const f=r.r(1.2,2.2),ts=[];let t=r.r(.2,.6);while(t<9.8){ts.push(t);t+=1/f*(1+.08*r.n())}ev(R,r,ts,T.sw,jw(r,blob(0,.35,.85).map(v=>.3+.7*v),.15),120,{span:.5,jit:.12});
  R.loc=GLOC;R.ev=ts;R.acns={m1:'G',m2:'SW',f,plus:'none'};R.meta={state:'coma'};R.ann.push({t0:0,t1:DUR,txt:`Generalized spike-and-wave ~${f.toFixed(1)} Hz: ictal–interictal continuum range`});};
GEN.sirpids=(R,r)=>{R.sens=10;comaBg(R,r,{v:.55});const ts0=r.r(3,3.8);stim(R,ts0,'Stimulus: suctioning and turning');const f=r.r(1.4,2),t1=ts0+r.r(.6,1),t2=Math.min(9.7,t1+r.r(4,5)),ts=per(r,t1,t2,1/f,.04);
  ev(R,r,ts,T.sharp,jw(r,blob(0,.3,.75).map(v=>.2+.8*v),.12),200,{span:.5,dly:YY.map((y,i)=>.01*Math.hypot(XX[i],y-.3))});R.loc=GLOC;R.ev=ts;R.acns={m1:'G',m2:'PD',f,plus:'none',si:1};R.meta={state:'coma',react:'SIRPIDs only'};R.ann.push({t0:t1,t1:t2,txt:'GPDs appear after the stimulus and fade: SI-GPDs (SIRPIDs)'});};
GEN.birds=(R,r)=>{const sg=r.chance(.5)?-1:1;R.loc=sideOf(sg);R.sens=10;comaBg(R,r,{v:.55});const w=blob(sg*.85,.25,.32),runs=[[r.r(1.4,2.4),0],[r.r(6,7.2),0]];runs.forEach(x=>x[1]=x[0]+r.r(1.4,2.6));
  ev(R,r,per(r,.5,9.5,r.r(2.5,4),.3).filter(t=>!runs.some(([a,b])=>t>a-.4&&t<b+.4)),T.sharp,w,110,{span:.4});runs.forEach(([a,b])=>{const P=phaseOf(r,0,.02,t=>5.5+2.5*clamp((t-a)/(b-a),0,1));addOsc(R,w,P,wind([[a,b]],.08),65,0,p=>Math.sin(p)+.4*Math.sin(2*p+.5))});
  R.fw=w;R.ev=runs.map(x=>x[0]);R.evk='onset';R.meta={state:'coma'};runs.forEach(([a,b],i)=>R.ann.push({t0:a,t1:b,txt:i?'BIRD':'BIRD: < 10 s of rhythmic sharply contoured activity > 4 Hz, evolving, same site as the spikes',lvl:i}));};

/* ---- encephalopathy, drugs, metabolic and structural ---- */
GEN.asym=(R,r)=>{const sg=r.chance(.5)?-1:1,h=hemi(sg);awakeBg(R,r,{A:34});for(let e=0;e<NE;e++){const k=1-.65*h[e],V=R.V[e];for(let n=0;n<N;n++)V[n]*=k}addBand(R,r,h,1,4,4);R.loc=sideOf(sg);R.fw=h;
  R.meta={sym:'marked'};R.ann.push({t0:0,t1:DUR,txt:`Every rhythm is lower over the ${sg<0?'left':'right'} hemisphere: attenuation (fluid or injured cortex between brain and electrode)`});};
GEN.enc_mild=(R,r)=>{const f=r.r(7,7.8);awakeBg(R,r,{A:30,f,theta:9,thetaEnv:waxwane(r,.5,[2,4])});addBand(R,r,W.fc,1.5,3.5,6,waxwane(r,.6,[3,5]));R.meta={pdr:+f.toFixed(1),grade:1};
  R.ann.push({t0:0,t1:DUR,txt:`Posterior rhythm ${f.toFixed(1)} Hz with intermittent theta; reactive`});};
GEN.enc_sev=(R,r)=>{addBg(R,r,{rms:3,lo:1,hi:20});addBand(R,r,W.all.map((v,i)=>.6+.4*W.fc[i]),.6,2.5,40,waxwane(r,.25,[2,4]));addBand(R,r,W.all,3,6,7);R.meta={grade:3,state:'coma'};stim(R,r.r(4.5,6),'Stimulus: sternal rub');
  R.ann.push({t0:0,t1:DUR,txt:'Continuous polymorphic delta, no posterior rhythm, little change with stimulation'});};
GEN.cape=(R,r)=>{const segs=[];let t=0,A=r.chance(.5);while(t<DUR){const d=r.r(2.2,3.2);segs.push([t,Math.min(DUR,t+d),A]);t+=d;A=!A}const wa=wind(segs.filter(s=>s[2]).map(s=>[s[0],s[1]]),.3),wb=inv(wa);
  addBg(R,r,{rms:1.6,lo:1,hi:25});addBand(R,r,W.all,4,7,5,wb);const P=phaseOf(r,r.r(1.6,2),.03);addOsc(R,W.all.map((v,i)=>.5+.5*W.fc[i]),P,wa,55,.04,p=>Math.sin(p)+.2*Math.sin(2*p));R.meta={state:'coma',grade:3};
  const s=segs.find(x=>x[2]);if(s)R.ann.push({t0:s[0],t1:s[1],txt:'Phase A: GRDA-like delta'});const s2=segs.find(x=>!x[2]);if(s2)R.ann.push({t0:s2[0],t1:s2[1],txt:'Phase B: low-voltage theta',lvl:1});R.ann.push({t0:0,t1:DUR,txt:'Spontaneous cycling every few seconds, no stimulus'});};
GEN.benzo=(R,r)=>{awakeBg(R,r,{A:22,beta:4,theta:4});const P=phaseOf(r,r.r(18,23),.08);addOsc(R,W.fc.map((v,i)=>.3+.7*Math.max(v,W.ant[i])),P,waxwane(r,.45),18,0);R.meta={drug:'lorazepam'};
  R.ann.push({t0:0,t1:DUR,txt:'Excess 18–25 Hz beta, frontocentral, symmetric'});};
GEN.propofol=(R,r)=>{addBg(R,r,{rms:2.2,lo:1,hi:25});const P=phaseOf(r,r.r(9.5,11.5),.04);addOsc(R,W.ant.map((v,i)=>.15+.85*Math.max(v,W.fc[i]*.9)),P,waxwane(r,.35),34,0);addBand(R,r,W.all.map((v,i)=>.6+.4*W.fc[i]),.5,1.5,30,waxwane(r,.3,[2,4]));
  R.meta={drug:'propofol',state:'sedated'};R.ann.push({t0:0,t1:DUR,txt:'Frontal alpha (anteriorization) riding on slow waves; no posterior alpha'});};
GEN.ketamine=(R,r)=>{addBg(R,r,{rms:3,lo:1,hi:40});addBand(R,r,W.all,26,40,9);addBand(R,r,W.fc,4,7,14,waxwane(r,.4));R.meta={drug:'ketamine',state:'sedated'};R.ann.push({t0:0,t1:DUR,txt:'Prominent fast 25–40 Hz activity with theta: NMDA blockade frees fast interneuron rhythms'});};
GEN.dexmed=(R,r)=>{addBg(R,r,{rms:1.8,lo:1,hi:20});addBand(R,r,W.all,3,6,6);addBand(R,r,W.fc,.6,2,16,waxwane(r,.4,[2,4]));const ts=[r.r(1,2),r.r(4,5),r.r(7.2,8.5)];
  ev(R,r,ts,T.spind,one(['Cz',1],['C3',.8],['C4',.8],['Fz',.85],['F3',.55],['F4',.55]),44,{span:.8});R.meta={drug:'dexmedetomidine',state:'sedated'};ts.forEach((t,i)=>R.ann.push({t0:t-.6,t1:t+.6,txt:i?'Spindle':'Spindles: sleep-like sedation',lvl:i%2}));};
GEN.edb=(R,r)=>{R.sens=10;comaBg(R,r,{v:.5,delta:6});const f=r.r(1.2,2.2),P=phaseOf(r,f,.04),w=W.all.map((v,i)=>.5+.5*W.fc[i]);addOsc(R,w,P,ones(),60,.02);
  const br=new Float32Array(N);for(let n=0;n<N;n++){const ph=((P[n]/6.283)%1+1)%1;br[n]=Math.exp(-((ph-.25)**2)/(2*.07*.07))}addBand(R,r,w,20,30,22,br);R.loc=GLOC;R.acns={m1:'G',m2:'RDA',f,plus:'+F'};R.meta={state:'coma'};
  R.ann.push({t0:0,t1:DUR,txt:`Extreme delta brush: ~${f.toFixed(1)} Hz delta with 20–30 Hz beta riding each wave`});};
GEN.hypotherm=(R,r)=>{const T0=r.pick([24,26,28]);addBg(R,r,{rms:1.6,lo:1,hi:20});const segs=[];let t=r.r(.2,.8);while(t<9.6){const d=r.r(2,3.2);segs.push([t,Math.min(9.9,t+d)]);t+=d+r.r(.9,1.6)}const bw=wind(segs,.2);
  addBand(R,r,W.all,.6,4,22,bw);addBand(R,r,W.all,4,8,5,bw);ecgHR(R,r,44);R.meta={temp:T0,state:'coma',cont:'discont'};R.ann.push({t0:0,t1:DUR,txt:`Core ${T0} °C: low-voltage slow activity with flat stretches; heart rate 44`});};

/* ---- coma and post-arrest backgrounds ---- */
GEN.lowvolt=(R,r)=>{addBg(R,r,{rms:2.4,lo:1,hi:20});addBand(R,r,W.all,3,7,3);addBand(R,r,W.all,.8,3,4);stim(R,r.r(4.5,6));R.sens=3;R.meta={state:'coma'};R.ann.push({t0:0,t1:DUR,txt:'Everything under 20 µV; no change with stimulation (note the sensitivity)'});};
GEN.discont=(R,r)=>{const segs=[];let t=0;while(t<DUR){const d=r.r(1.8,3);segs.push([t,Math.min(DUR,t+d)]);t+=d+r.r(.6,1.1)}const bw=wind(segs,.1);addBg(R,r,{rms:1.2,lo:1,hi:25});
  addBand(R,r,W.all.map((v,i)=>.6+.4*W.fc[i]),.6,3,20,bw);addBand(R,r,W.all,4,8,7,bw);R.meta={state:'coma',cont:'discont'};R.ann.push({t0:0,t1:DUR,txt:'Activity interrupted by brief flat (< 10 µV) periods: 10–49% of the page'});};
GEN.bs_ident=(R,r)=>{R.sens=15;addBg(R,r,{rms:1,lo:1,hi:30});const d=r.r(.8,1.2),tpl=EL.map(()=>identBurst(r,d)),w=W.all.map((v,i)=>.5+.5*W.fc[i]),ts=[];let t=r.r(.3,1);while(t<9.6-d){ts.push(t);t+=r.r(2.6,3.6)}
  for(const t0 of ts){const i0=Math.floor(t0*FS);for(let e=0;e<NE;e++){const V=R.V[e],b=tpl[e];for(let k=0;k<b.length&&i0+k<N;k++)V[i0+k]+=b[k]*48*w[e]}}
  R.loc=GLOC;R.ev=ts;R.meta={state:'coma',cont:'bs'};ts.forEach((t,i)=>R.ann.push({t0:t,t1:t+d,txt:i?'Same burst':'Burst: every burst is the same shape (identical bursts)',lvl:i%2}));};
GEN.bs_epi=(R,r)=>{R.sens=15;addBg(R,r,{rms:1.1,lo:1,hi:30});let t=r.r(.4,.9);const bursts=[];while(t<9.4){const d=r.r(1,1.6);bursts.push([t,Math.min(9.9,t+d)]);t+=d+r.r(2,3)}const w=W.all.map((v,i)=>.4+.6*W.fc[i]);
  addBand(R,r,w,.8,4,26,wind(bursts,.05));bursts.forEach(([a,b])=>{const ts=[];for(let x=a+.08;x<b-.1;x+=r.r(.22,.35))ts.push(x);ev(R,r,ts,T.poly,jw(r,w,.15),100,{span:.3})});R.loc=GLOC;R.meta={state:'coma',cont:'bs'};
  R.ann.push({t0:bursts[0][0],t1:bursts[0][1],txt:'Bursts built from spikes and polyspikes (highly epileptiform bursts)'});};
GEN.supp_pd=(R,r)=>{R.sens=7;addBg(R,r,{rms:1.1,lo:1,hi:30});const p=r.r(.85,1.25),ts=per(r,r.r(.1,.5),9.9,p,.03),dl=YY.map((y,i)=>.01*Math.hypot(XX[i],y-.3));ev(R,r,ts,T.sharp,jw(r,blob(0,.3,.8).map(v=>.25+.75*v),.1),95,{span:.45,dly:dl});
  stim(R,r.r(4,6));R.loc=GLOC;R.ev=ts;R.acns={m1:'G',m2:'PD',f:1/p,plus:'none'};R.meta={state:'coma',cont:'supp',volt:'supp'};R.ann.push({t0:0,t1:DUR,txt:'GPDs on a suppressed (< 10 µV) background; no reactivity'});};
GEN.react_coma=(R,r)=>{const ts=r.r(4,5.5),pre=wind([[0,ts+.3]],.3),post=inv(pre);addBg(R,r,{rms:2.2,lo:1,hi:25});addBand(R,r,W.all.map((v,i)=>.6+.4*W.fc[i]),.6,3,26,pre);addBand(R,r,W.all.map((v,i)=>.6+.4*W.fc[i]),.6,3,10,post);
  addBand(R,r,W.all,4,8,8);addBand(R,r,W.all,13,25,6,post);addBand(R,r,W.all.map((v,i)=>blob(-.9,.2,.4)[i]+blob(.9,.2,.4)[i]),30,80,8,wind([[ts+.1,ts+1.2]],.1));stim(R,ts,'Stimulus: name, then sternal rub');R.meta={state:'coma',react:'yes'};
  R.ann.push({t0:ts+.3,t1:DUR,txt:'After the stimulus: slower activity attenuates, faster activity appears'});};
GEN.unreact=(R,r)=>{comaBg(R,r,{v:.9,delta:20,theta:7});const ts=r.r(4,5.5);stim(R,ts,'Stimulus: name, then sternal rub');R.meta={state:'coma',react:'no'};R.ann.push({t0:ts+.3,t1:DUR,txt:'No change in frequency or amplitude after the stimulus'});};

/* ---- neonatal ---- */
GEN.trace_alt=(R,r)=>{addBg(R,r,{rms:9,lo:.5,hi:20});const segs=[];let t=r.r(0,.8);while(t<DUR){const d=r.r(2.5,3.5);segs.push([t,Math.min(DUR,t+d)]);t+=d+r.r(2.5,3.5)}const bw=wind(segs,.4);
  addBand(R,r,W.all,.5,3,55,bw);addBand(R,r,W.all,4,8,14,bw);R.sens=10;R.meta={age:'term newborn, 40 weeks',state:'quiet sleep'};segs.slice(0,2).forEach(([a,b],i)=>R.ann.push({t0:a,t1:b,txt:i?'Burst':'High-voltage burst (quiet sleep)',lvl:i}));
  R.ann.push({t0:segs[0][1],t1:segs[1]?segs[1][0]:DUR,txt:'Lower but not flat (> 25 µV) between bursts',lvl:1});};
GEN.trace_disc=(R,r)=>{addBg(R,r,{rms:2.4,lo:.5,hi:20});const segs=[];let t=r.r(.2,1);while(t<9.5){const d=r.r(1.2,2);segs.push([t,Math.min(9.9,t+d)]);t+=d+r.r(3.5,5)}const bw=wind(segs,.15);
  addBand(R,r,W.all,.5,2,90,bw);const br=new Float32Array(N);for(let n=0;n<N;n++)br[n]=bw[n]*(.5+.5*Math.sin(2*Math.PI*.8*n/FS));addBand(R,r,W.all,10,20,18,br);R.sens=15;R.meta={age:'preterm, 28 weeks',state:'sleep'};
  R.ann.push({t0:segs[0][0],t1:segs[0][1],txt:'Burst of high-voltage delta with fast brushes'});if(segs[1])R.ann.push({t0:segs[0][1],t1:segs[1][0],txt:'Interburst interval: near-flat, normal at this age',lvl:1});};
GEN.dbrush=(R,r)=>{addBg(R,r,{rms:6,lo:.5,hi:20});const P=phaseOf(r,r.r(.6,1),.1),w=W.all.map((v,i)=>.4+.6*Math.max(W.cen[i],W.post[i]));addOsc(R,w,P,waxwane(r,.4,[2,3]),70,0);
  const br=new Float32Array(N);for(let n=0;n<N;n++){const ph=((P[n]/6.283)%1+1)%1;br[n]=Math.exp(-((ph-.25)**2)/(2*.08*.08))}addBand(R,r,w,9,18,22,br);R.sens=15;R.meta={age:'preterm, 32 weeks'};
  R.ann.push({t0:0,t1:DUR,txt:'Delta brushes: slow delta with 8–20 Hz fast riding on it (normal in prematurity)'});};
GEN.neosz=(R,r)=>{const sg=r.chance(.5)?-1:1;R.loc=sideOf(sg);addBg(R,r,{rms:8,lo:.5,hi:20});addBand(R,r,W.all,.5,3,18);const w=blob(sg*.5,0,.28),t0=r.r(1,2),P=phaseOf(r,0,.02,t=>t<t0?1:2.2-.9*clamp((t-t0)/8,0,1));
  const env=new Float32Array(N);for(let n=0;n<N;n++){const t=n/FS;env[n]=ss(clamp((t-t0)/1.2,0,1))}addOsc(R,w,P,env,110,0,p=>Math.sin(p)+.5*Math.sin(2*p+.6));R.fw=w;R.ev=[t0];R.evk='onset';R.sens=15;R.meta={age:'term newborn, day 2'};
  R.ann.push({t0,t1:DUR,txt:`Rhythmic sharp waves at ${sg<0?'C3':'C4'}, slowing as they continue: electrographic seizure (≥ 10 s, evolving)`});};
