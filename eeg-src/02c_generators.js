/* ============ pattern generators ============ */
const GEN={};
GEN.awake=(R,r)=>{awakeBg(R,r);const b=[r.r(2,3),r.r(6,8)];blinks(R,r,b,60);
  R.ann.push({t0:0,t1:DUR,txt:'Posterior alpha ~10 Hz, symmetric, waxing and waning'});R.ann.push({t0:b[0]-.2,t1:b[0]+.4,txt:'Blink'});};
GEN.reactivity=(R,r)=>{const to=r.r(3.4,4.2),tc=to+r.r(3,3.4),w=wind([[0,to-.1],[tc,DUR]],.12);
  awakeBg(R,r,{win:w,A:42});addBand(R,r,W.all,14,30,3,inv(w));addBand(R,r,W.ant,18,30,2,inv(w));
  blinks(R,r,[to,to+1.4,to+2.5],95);
  R.ann.push({t0:0,t1:to-.1,txt:'Eyes closed: alpha'});R.ann.push({t0:to,t1:tc,txt:'Eyes open: alpha attenuates'});R.ann.push({t0:tc,t1:DUR,txt:'Eyes closed: returns'});};
GEN.drowsy=(R,r)=>{const tf=r.r(2.8,3.8),w=wind([[0,tf]],.9);awakeBg(R,r,{win:w,A:30});
  const ramp=new Float32Array(N);for(let n=0;n<N;n++)ramp[n]=ss(clamp((n/FS-1.5)/4,0,1));
  addBand(R,r,W.all.map((v,i)=>.6+.4*W.fc[i]),4,7.5,10,ramp);
  const f=r.r(.28,.38),ph=r.u()*6;const env=wind([[tf-.5,tf+4.5]],.8);
  const s=new Float32Array(N);for(let n=0;n<N;n++)s[n]=env[n]*Math.sin(2*Math.PI*f*n/FS+ph);
  addSig(R,one(['F7',1],['Fp1',.5],['T3',.3]),s,60);addSig(R,one(['F8',-1],['Fp2',-.5],['T4',-.3]),s,60);
  R.ann.push({t0:0,t1:tf,txt:'Alpha slows and fades'});R.ann.push({t0:tf,t1:DUR,txt:'Diffuse theta, no alpha'});R.ann.push({t0:tf-.3,t1:tf+4,txt:'Slow rolling eye movements F7/F8, out of phase',lvl:1});};
GEN.n2=(R,r)=>{addBg(R,r,{rms:1.6,lo:1,hi:20});addBand(R,r,W.all,4,7,4.5);addBand(R,r,W.fc,1,3,5);
  const tk=r.r(4.4,5.4),sp1=r.r(1.3,2.4),sp2=r.r(7.3,8.4);
  ev(R,r,[tk],T.kc,W.fc,190,{span:.9});const sw=one(['Cz',1],['C3',.8],['C4',.8],['Fz',.7],['F3',.4],['F4',.4],['P3',.2],['P4',.2],['Pz',.3]);
  ev(R,r,[tk+.65,sp1,sp2],T.spind,sw,48,{span:.8,jit:.12});
  ev(R,r,[r.r(.6,1)+0],T.vtx,W.fc,60,{span:.5});
  R.ann.push({t0:tk-.3,t1:tk+.5,txt:'K-complex',lvl:0});R.ann.push({t0:tk+.25,t1:tk+1.05,txt:'Spindle 12–14 Hz',lvl:1});R.ann.push({t0:sp1-.6,t1:sp1+.6,txt:'Spindle'});R.ann.push({t0:sp2-.6,t1:sp2+.6,txt:'Spindle'});};
GEN.n3=(R,r)=>{addBg(R,r,{rms:3,lo:1,hi:20});addBand(R,r,W.fc.map(v=>.3+.7*v),.5,2.5,36,waxwane(r,.25,[2,4]));
  ev(R,r,[r.r(2,3),r.r(6,8)],T.spind,one(['Cz',1],['C3',.7],['C4',.7],['Fz',.6]),18,{span:.8});
  R.ann.push({t0:0,t1:DUR,txt:'Continuous high-amplitude delta (0.5–2 Hz), frontal predominant'});};
GEN.mu=(R,r)=>{awakeBg(R,r,{A:12,f:r.r(9.6,10.2)});const P=phaseOf(r,r.r(9,10)),arch=p=>Math.cos(p)+.5*Math.cos(2*p);
  const tm=r.r(4.6,5.2),eL=wind([[.8,3.4],[4.2,6.6],[7.4,9.5]],.2),eR=mul(eL,inv(wind([[tm-.3,tm+2.2]],.2)));
  addOsc(R,blob(-.5,0,.32),P,mul(eL,waxwane(r,.3)),22,0,arch);addOsc(R,blob(.5,0,.32),P,mul(eR,waxwane(r,.3)),22,0,arch);
  R.ann.push({t0:.8,t1:3.4,txt:'Mu: arch-shaped, C3/C4'});R.ann.push({t0:tm-.3,t1:tm+2.2,txt:'Left-hand movement blocks right (C4) mu',lvl:1});};
function drowsyBg(R,r,o={}){const w=wind([[0,.6]],.5);awakeBg(R,r,{win:w,A:20,rms:2,beta:1.5});addBand(R,r,W.all,4,7.5,o.theta??5,null)}
GEN.wicket=(R,r)=>{drowsyBg(R,r);const sg=r.chance(.5)?-1:1,reg=blob(sg*.85,.1,.34),trains=[r.r(1.6,2.6),r.r(5.6,7)];
  for(const t of trains){const k=r.pick([5,6,7]);ev(R,r,per(r,t,t+k*.14,.14,.04),T.wick,reg,120,{span:.2})}
  R.ann.push({t0:trains[0]-.1,t1:trains[0]+.9,txt:'Wicket: 7 Hz arch train, no after-slow'});R.ann.push({t0:trains[1]-.1,t1:trains[1]+.9,txt:'Wicket train',lvl:1});};
GEN.posts=(R,r)=>{addBg(R,r,{rms:2,lo:1,hi:20});addBand(R,r,W.all,4,7,4);const tr=[r.r(1.4,2.6),r.r(5.2,6.8)];
  for(const t of tr){ev(R,r,per(r,t,t+r.pick([4,5,6])*.22,.22,.05),T.posts,blob(0,-.95,.5),45,{span:.15})}
  R.ann.push({t0:tr[0]-.1,t1:tr[0]+1.2,txt:'Positive triangles at O1/O2, 4–5 Hz'});R.ann.push({t0:tr[1]-.1,t1:tr[1]+1.2,txt:'POSTS',lvl:1});};
GEN.bets=(R,r)=>{drowsyBg(R,r,{theta:5});const ts=[],sd=r.chance(.5)?-1:1;let t=r.r(1,2);while(t<9){ts.push([t,r.chance(.5)?sd:-sd]);t+=r.r(1.6,2.6)}
  for(const[t,s]of ts)ev(R,r,[t],T.bets,blob(s*.85,.05,.4),60,{span:.2});
  ts.slice(0,3).forEach(([t],i)=>R.ann.push({t0:t-.15,t1:t+.2,txt:i?'BETS':'BETS: <50 µV, <50 ms, no after-slow',lvl:i%2}));};
GEN.blink=(R,r)=>{awakeBg(R,r,{A:30});const b=[];let t=r.r(.6,1.2);while(t<9.3){b.push(t);t+=r.r(1.3,2.2)}
  blinks(R,r,b,110);R.ann.push({t0:b[0]-.2,t1:b[0]+.45,txt:'Blink: Fp1/Fp2 in phase, fades posteriorly'});};
GEN.muscle=(R,r)=>{awakeBg(R,r,{A:30});const sp=[[r.r(1.8,2.6),r.r(4.2,4.8)],[r.r(6,6.6),r.r(8.2,9)]],e=wind(sp,.12),m=new Float32Array(N);
  const mw=r.r(1.8,2.6);for(let n=0;n<N;n++)m[n]=e[n]*(.65+.35*Math.sin(2*Math.PI*mw*n/FS));
  const w=blob(-.9,.1,.42).map((v,i)=>v+blob(.9,.1,.42)[i]+.55*blob(0,1,.5)[i]);addBand(R,r,w,28,90,26,m);
  R.ann.push({t0:sp[0][0],t1:sp[0][1],txt:'Muscle: fast, spiky, temporal/frontal'});R.ann.push({t0:sp[1][0],t1:sp[1][1],txt:'Chewing/tension burst',lvl:1});};
GEN.ecgart=(R,r)=>{awakeBg(R,r,{A:30});const w=one(['T3',1],['T5',.55],['F7',.55],['C3',.35],['Fp1',.2],['O1',.2],['T4',.12],['F8',.1]);
  ev(R,r,R.beats,t=>T.qrs(t)*1.0,w,48,{span:.3,jit:.04});R.ann.push({t0:R.beats[1]-.15,t1:R.beats[3]+.2,txt:'Spikes align with QRS in ECG row (red)'});};
GEN.pop=(R,r)=>{awakeBg(R,r,{A:32});const t=r.r(3.2,6.4);ev(R,r,[t],T.pop,one(['T3',1]),-170,{span:2.4,jit:0});ev(R,r,[t],t=>g(t,.01),one(['T3',1]),-60,{span:.2,jit:0});
  R.ann.push({t0:t-.1,t1:t+1.2,txt:'Electrode pop at T3: abrupt, one electrode only'});};
GEN.line=(R,r)=>{awakeBg(R,r,{A:32});const ph=r.u()*6.28,aff=[['F4',1],['C4',.9],['Fp2',.5]];for(const[k,v]of aff){const V=R.V[IX[k]];for(let n=0;n<N;n++)V[n]+=16*v*Math.sin(2*Math.PI*60*n/FS+ph)}
  R.ann.push({t0:.2,t1:DUR-.2,txt:'60 Hz fuzz on the right-sided channels; try the notch filter'});};
GEN.focal_slow=(R,r)=>{const sg=r.chance(.5)?-1:1;awakeBg(R,r,{A:34});R.loc=sg<0?'Left hemisphere':'Right hemisphere';
  addBand(R,r,blob(sg*.85,.1,.45),.8,3,34,waxwane(r,.4,[1.5,3.5]));
  R.ann.push({t0:0,t1:DUR,txt:(sg<0?'Left':'Right')+' temporal polymorphic delta, continuous; alpha preserved elsewhere'});};
GEN.firda=(R,r)=>{awakeBg(R,r,{A:20,f:8.2,theta:4});const runs=[[r.r(1.6,2.4),r.r(4.8,5.6)],[r.r(7,7.4),r.r(9.2,9.8)]],P=phaseOf(r,r.r(2.2,2.6),.03);
  addOsc(R,W.ant,P,wind(runs,.35),48,0,p=>Math.sin(p)+.2*Math.sin(2*p));R.loc='Generalized (bilateral, symmetric)';
  R.ann.push({t0:runs[0][0],t1:runs[0][1],txt:'FIRDA: rhythmic 2–3 Hz delta, frontal'});R.ann.push({t0:runs[1][0],t1:runs[1][1],txt:'FIRDA',lvl:1});};
GEN.temporal_spikes=(R,r)=>{const sg=r.chance(.5)?-1:1;awakeBg(R,r,{A:34});R.loc=sg<0?'Left hemisphere':'Right hemisphere';
  const ts=[];let t=r.r(1,1.8);while(t<9){ts.push(t);t+=r.r(1.8,3)}ev(R,r,ts,T.sharp,blob(sg*.82,.5,.33),130,{span:.5});
  ts.slice(0,3).forEach((t,i)=>R.ann.push({t0:t-.12,t1:t+.35,txt:i?'Spike + slow wave':(sg<0?'F7':'F8')+' phase reversal, after-going slow wave',lvl:i%2}));};
GEN.sw3=(R,r)=>{awakeBg(R,r,{A:26,f:9.2});const t0=r.r(1.8,3),t1=t0+r.r(5.2,6.2),ts=[];let t=t0;while(t<t1){ts.push(t);const f=3.3-.7*(t-t0)/(t1-t0);t+=1/f}
  addSig(R,W.all,new Float32Array(N),0);const dl=YY.map((y,i)=>.008*Math.hypot(XX[i],y-.3));
  const bw=wind([[t0,t1]],.04);for(let e=0;e<NE;e++){const V=R.V[e];for(let n=0;n<N;n++)V[n]*=1-.7*bw[n]*(W.post[e]>.5?1:.3)}
  ev(R,r,ts,T.sw,jw(r,blob(0,.35,.8).map(v=>.25+.75*v),.12),150,{span:.5,dly:dl,jit:.07});R.loc='Generalized (bilateral, symmetric)';
  R.ann.push({t0,t1,txt:'Generalized 3 Hz spike-and-wave: abrupt onset and offset'});R.ann.push({t0:t1-1.6,t1,txt:'Slows to ~2.7 Hz',lvl:1});};
GEN.hyps=(R,r)=>{R.sens=30;for(let e=0;e<NE;e++){const x=bandNoise(r,.5,3.5,75),y=bandNoise(r,8,20,10),V=R.V[e];for(let n=0;n<N;n++)V[n]+=x[n]+y[n]}
  for(let i=0;i<12;i++)ev(R,r,[r.r(.3,9.7)],T.sharp,blob(r.r(-.8,.8),r.r(-.8,.8),.28),r.pick([-1,1])*r.r(110,210)*-1+0,{span:.4,jit:0});
  R.loc='Bilateral independent';R.ann.push({t0:0,t1:DUR,txt:'Chaotic, asynchronous high-voltage slow waves with multifocal spikes'});};
GEN.lpd=(R,r)=>{const sg=r.chance(.5)?-1:1,h=hemi(sg);R.loc=sg<0?'Left hemisphere':'Right hemisphere';
  awakeBg(R,r,{A:26});addBand(R,r,h,.8,3,4.5,waxwane(r,.3));addBand(R,r,h,1,25,2);
  const p=r.r(.9,1.25),ts=per(r,r.r(.2,.8),9.8,p,.04),w=XX.map((x,i)=>.08+.92*h[i]*Math.exp(-((x-sg*.55)**2+(YY[i]-.15)**2)/(2*.8*.8)));
  ev(R,r,ts,T.sharp,jw(r,w,.12),230,{span:.5,jit:.07});
  R.ann.push({t0:0,t1:DUR,txt:'LPD ~'+(1/p).toFixed(1)+' Hz over the '+(sg<0?'left':'right')+' hemisphere; other side relatively spared'});};
GEN.gpd=(R,r)=>{R.sens=10;const p=r.r(.45,.85);addBg(R,r,{rms:2.5,lo:1,hi:25});const ts=per(r,r.r(.1,.5),9.9,p,.03),dl=YY.map((y,i)=>.012*Math.hypot(XX[i],y-.3));
  ev(R,r,ts,T.sharp,jw(r,blob(0,.3,.75).map(v=>.2+.8*v),.12),150,{span:.5,dly:dl,jit:.06});R.loc='Generalized (bilateral, symmetric)';
  R.ann.push({t0:0,t1:DUR,txt:'GPD ~'+(1/p).toFixed(1)+' Hz, bilateral and synchronous, almost no background between'});};
GEN.triphasic=(R,r)=>{R.sens=10;addBg(R,r,{rms:2,lo:1,hi:25});addBand(R,r,W.all,4,7,5);addBand(R,r,W.all,1,3,3.5);
  const p=r.r(.55,.8),ts=per(r,r.r(.1,.5),9.9,p,.05);ev(R,r,ts,T.tri,jw(r,blob(0,.45,.85).map(v=>.25+.75*v),.12),170,{span:.5,dly:lagA});R.loc='Generalized (bilateral, symmetric)';
  R.ann.push({t0:0,t1:DUR,txt:'Triphasic waves ~'+(1/p).toFixed(1)+' Hz, frontal lead, slow background'});R.ann.push({t0:ts[1]-.25,t1:ts[1]+.35,txt:'Neg–POS–neg; posterior channels lag',lvl:1});};
GEN.bs=(R,r)=>{R.sens=15;addBg(R,r,{rms:1.3,lo:1,hi:30});let t=r.r(.4,1),bursts=[];while(t<9.6){const d=r.r(1.2,2);bursts.push([t,Math.min(9.9,t+d)]);t+=d+r.r(3,4.2)}
  const bw=wind(bursts,.04),w=W.fc.map(v=>.3+.7*v);addBand(R,r,w,.6,4,50,bw);addBand(R,r,w,8,25,10,bw);
  for(const[a,b]of bursts)ev(R,r,[a+.2,a+.5*(b-a),b-.25],T.sharp,jw(r,w,.15),90,{span:.4});R.loc='Generalized (bilateral, symmetric)';
  bursts.forEach(([a,b],i)=>R.ann.push({t0:a,t1:b,txt:i?'Burst':'Burst: high-amplitude, generalized, abrupt'}));
  if(bursts.length)R.ann.push({t0:bursts[0][1]+.2,t1:bursts[1]?bursts[1][0]-.2:9.8,txt:'Suppression (<10 µV)',lvl:1});};
GEN.cjd=(R,r)=>{R.sens=10;addBg(R,r,{rms:3,lo:1,hi:25});addBand(R,r,W.all,3,7,9);addBand(R,r,W.all,1,3,8);
  const p=r.r(.9,1.05),ts=per(r,r.r(.2,.7),9.9,p,.015);ev(R,r,ts,T.sharp,jw(r,blob(0,.2,.8).map(v=>.25+.75*v),.1),115,{span:.5,jit:.04});R.loc='Generalized (bilateral, symmetric)';
  R.ann.push({t0:0,t1:DUR,txt:'Periodic sharp wave complexes ~1 Hz, very regular, slow low-voltage background'});};
GEN.alphacoma=(R,r)=>{addBg(R,r,{rms:2.5,lo:1,hi:25});const P=phaseOf(r,r.r(8.6,9.4),.02),w=W.all.map((v,i)=>.55+.45*W.ant[i]);
  addOsc(R,w,P,mul(ones(),waxwane(r,.1,[2,4])),34,.25);R.ann.push({t0:0,t1:DUR,txt:'Diffuse monotonous alpha, frontal predominant; no posterior gradient'});};
GEN.eci=(R,r)=>{R.sens=2;addBg(R,r,{rms:.7,lo:1,hi:40});const ph=r.u()*6;for(const k of['T3','Fp1','O2']){const V=R.V[IX[k]];for(let n=0;n<N;n++)V[n]+=.9*Math.sin(2*Math.PI*60*n/FS+ph)}
  ev(R,r,R.beats,T.qrs,one(['T3',1],['F7',.6],['T5',.5],['C3',.3]),4,{span:.3,jit:.03});R.ann.push({t0:0,t1:DUR,txt:'No cerebral activity at 2 µV/mm; only ECG and line artifact'});};
GEN.seizure=(R,r)=>{const sg=r.chance(.5)?-1:1;R.loc=sg<0?'Left hemisphere':'Right hemisphere';awakeBg(R,r,{A:28});const t0=r.r(1.6,2.6),t1=9.7;
  const fn=t=>t<t0?5.2:t<t0+3.2?5.2+2.4*(t-t0)/3.2:7.6-3.4*(t-t0-3.2)/(t1-t0-3.2),P=phaseOf(r,0,.02,fn),amp=new Float32Array(N),amp2=new Float32Array(N);
  for(let n=0;n<N;n++){const t=n/FS,u=clamp((t-t0)/(t1-t0),0,1),on=ss(clamp((t-t0)/.5,0,1))*ss(clamp((t1+.2-t)/.4,0,1));amp[n]=on*(.2+.8*u);amp2[n]=on*Math.max(0,u-.25)*1.3}
  const shape=p=>Math.sin(p)+.45*Math.sin(2*p+.6);const wF=blob(sg*.9,.1,.38),wB=blob(sg*.7,.1,1);
  addOsc(R,wF,P,amp,75,0,shape);addOsc(R,wB,P,amp2,55,0,shape);
  R.ann.push({t0:t0,t1:t0+1.6,txt:'Onset: rhythmic theta '+(sg<0?'T3':'T4')});R.ann.push({t0:t0+1.6,t1:t0+4.4,txt:'Evolves: faster, bigger, spreading',lvl:1});R.ann.push({t0:t0+4.4,t1:t1,txt:'Slows toward the end'});};
GEN.gen_slow=(R,r)=>{addBg(R,r,{rms:3,lo:1,hi:22});const P=phaseOf(r,r.r(5.6,6.8),.05);addOsc(R,W.post,P,waxwane(r,.35),32,1);
  addBand(R,r,W.all,4,7.5,22,waxwane(r,.35));addBand(R,r,W.all.map((v,i)=>.4+.6*W.ant[i]),1,3.5,22,waxwane(r,.5,[2,4]));
  R.ann.push({t0:0,t1:DUR,txt:'Posterior rhythm slowed to ~6 Hz with diffuse theta and delta'});};

function generate(pid,seed){const r=mkRand(seed*7919+hash(pid)),R=newRec(),e=makeEcg(r);R.ecg=e.sig;R.beats=e.beats;GEN[pid](R,r);R._c={};return R}

