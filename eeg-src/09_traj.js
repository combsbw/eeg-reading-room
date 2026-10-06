/* ============ EEG trajectories: brain state → raw page and quantitative trends ============ */
/* A state is a handful of physiological dials. The same state drives both the 10-s raw page and the
   hours-long trend, so what a trend shows can always be checked against the EEG behind it. */
const ST0={pdr:10,alpha:30,theta:3,delta:3,beta:4,volt:1,supp:0,ident:0,asym:0,aside:-1,fd:0,fside:-1,pd:null,rda:null,spind:0,react:1,tri:0,state:'awake',art:0};
const NUMK=['pdr','alpha','theta','delta','beta','volt','supp','asym','fd'];
function mkState(o){return Object.assign({},ST0,o)}
/* ---- raw page from a state ---- */
function composeRec(st,seed,o={}){const r=mkRand((seed>>>0)+13),R=newRec(),e=makeEcg(r);R.ecg=e.sig;R.beats=e.beats;R.meta={};R.st=st;const v=st.volt;
  addBg(R,r,{rms:1.6*v+.6,lo:1,hi:28});
  if(st.pdr>0&&st.alpha>0){const P=phaseOf(r,st.pdr,.04),w=st.state==='sedated'?W.ant.map((x,i)=>.2+.8*Math.max(x,W.fc[i])):W.post;addOsc(R,w,P,waxwane(r,.4),st.alpha*v,1)}
  if(st.theta>.3)addBand(R,r,W.all,4,7.5,st.theta*v,waxwane(r,.4));
  if(st.delta>.3)addBand(R,r,W.all.map((x,i)=>.6+.4*W.fc[i]),.6,3.2,st.delta*v,waxwane(r,.35,[2,4]));
  if(st.beta>.3)addBand(R,r,W.ant,14,26,st.beta*v,waxwane(r,.4));
  if(st.spind){const ts=[r.r(1,2.5),r.r(5,7)];ev(R,r,ts,T.spind,one(['Cz',1],['C3',.8],['C4',.8],['Fz',.7],['F3',.4],['F4',.4]),35*v,{span:.8})}
  if(st.state==='rem'){[r.r(1,3),r.r(5,8)].forEach((tc,i)=>{const s=i?1:-1;ev(R,r,[tc],x=>x<0?0:(1-Math.exp(-x/.025))*Math.exp(-x/.55),one(['F7',s],['F8',-s],['Fp1',.4*s],['Fp2',-.4*s]),110,{span:2})})}
  if(st.fd>.3){const w=blob(st.fside*.85,.1,.45);addBand(R,r,w,.7,3,st.fd*v,waxwane(r,.4,[1.5,3.5]))}
  if(st.asym>.02){const h=hemi(st.aside);for(let k=0;k<NE;k++){const g_=1-st.asym*h[k],V=R.V[k];for(let n=0;n<N;n++)V[n]*=g_}}
  if(st.pd){const p=st.pd,h=p.m1==='L'?hemi(p.side):null,w=h?XX.map((x,i)=>.06+.94*h[i]*Math.exp(-((x-p.side*.6)**2+(YY[i]-.15)**2)/(2*.65*.65))):blob(0,.3,.8).map(x=>.25+.75*x);
    const ts=per(r,r.r(.1,.6),9.8,1/p.f,.04),dl=p.m1==='G'?(p.tri?lagA:YY.map((y,i)=>.01*Math.hypot(XX[i],y-.3))):null;ev(R,r,ts,p.tri?T.tri:T.sharp,jw(r,w,.1),p.amp,{span:.5,dly:dl,jit:.06});R.ev=ts;if(h)R.fw=w;
    if(p.plus==='+F')addBand(R,r,w,14,22,p.amp*.12,wind(ts.map(t=>[t-.04,t+.25]),.04))}
  if(st.rda){const q=st.rda,w=q.m1==='L'?blob(q.side*.75,.25,.5):W.all.map((x,i)=>.55+.45*W.fc[i]),P=phaseOf(r,q.f,.03);addOsc(R,w,P,waxwane(r,.2,[3,5]),q.amp,0)}
  if(o.sz){const z=o.sz,t0=z.t0,t1=z.t1,fn=t=>{const u=clamp((t-z.on)/z.len,0,1);return z.f0+(z.f1-z.f0)*u},P=phaseOf(r,0,.02,fn),wF=z.gen?W.all.map(x=>.7):blob(z.cx??z.side*.85,z.cy??.15,z.sw??.38),wB=z.gen?W.all:blob(z.side*.6,.1,1),amp=new Float32Array(N),amp2=new Float32Array(N);
    for(let n=0;n<N;n++){const t=n/FS,on=ss(clamp((t-t0)/.5,0,1))*ss(clamp((t1-t)/.4,0,1)),u=clamp((t-z.on)/z.len,0,1);amp[n]=on*(.3+.7*Math.min(1,u*2));amp2[n]=on*Math.max(0,u-.2)}
    const sh=p=>Math.sin(p)+.45*Math.sin(2*p+.6);const ka=z.amp??1;addOsc(R,wF,P,amp,80*ka*Math.max(.6,v),0,sh);addOsc(R,wB,P,amp2,45*ka*Math.max(.6,v),0,sh);if(!z.gen)R.fw=wF;R.sz=z;
    if(t0>.3)R.ann.push({t0,t1:Math.min(DUR,t0+2),txt:'Seizure onset'});else R.ann.push({t0:0,t1:DUR,txt:'Ongoing electrographic seizure'})}
  if(st.supp>.02){const bursts=[];let t=r.r(0,1);const burst=Math.max(.6,(1-st.supp)*3.2),gap=burst*st.supp/(1-st.supp+.02);while(t<DUR){const d=burst*r.r(.8,1.2);bursts.push([t,Math.min(DUR,t+d)]);t+=d+gap*r.r(.8,1.2)}
    const bw=wind(bursts,.14);for(let k=0;k<NE;k++){const V=R.V[k];for(let n=0;n<N;n++)V[n]*=.06+.94*bw[n]}
    if(st.ident){const tpl=EL.map(()=>identBurst(r,1));for(const[a]of bursts){const i0=Math.floor(a*FS);for(let k=0;k<NE;k++){const V=R.V[k],b=tpl[k];for(let j=0;j<b.length&&i0+j<N;j++)V[i0+j]+=b[j]*55}}}
    else addBand(R,r,W.all.map((x,i)=>.5+.5*W.fc[i]),1,4,30,bw);R.bursts=bursts}
  if(o.stim){const ts=4.5;stim(R,ts);if(st.react){const post=wind([[ts+.3,DUR+1]],.3);addBand(R,r,W.all,13,25,6,post);for(let k=0;k<NE;k++){const V=R.V[k];for(let n=Math.floor((ts+.3)*FS);n<N;n++)V[n]*=.75}}}
  if(st.art==='muscle')addBand(R,r,blob(-.9,.1,.42).map((x,i)=>x+blob(.9,.1,.42)[i]),28,90,20,waxwane(r,.6,[1,2]));
  R.sens=v<.3?3:st.supp>.5?10:v<.5?5:st.pd&&st.pd.amp>120?10:7;
  R.meta={pdr:st.pdr>0&&st.alpha>3?st.pdr:null,cont:st.supp>.99?'supp':st.supp>=.5?'bs':st.supp>=.1?'discont':'cont',volt:v<.35?'supp':v<.6?'low':'normal',sym:st.asym>.45?'marked':st.asym>.2?'mild':'sym',react:o.stim?(st.react?'yes':'no'):null,state:st.state};
  R._c={};R.pid=null;return R}
/* ---- trend metrics from a state (analytic spectra, so hours compute instantly) ---- */
const FQ=[];for(let f=.5;f<=20;f+=.5)FQ.push(f);
const gs=(f,c,s)=>Math.exp(-((f-c)**2)/(2*s*s));
function specOf(st,side,szF,szAmt,r){const v=st.volt*(1-.92*Math.min(1,st.supp)),h=side===st.aside?1-st.asym:1,fdk=side===st.fside?st.fd:0;
  return FQ.map(f=>{let p=(st.delta**2)*gs(f,1.6,1.1)+(fdk**2)*gs(f,1.5,1)+(st.theta**2)*gs(f,5.5,1.4)+(st.beta**2)*gs(f,18,3.5)*.8+4/(f+.5);
    if(st.pdr>0)p+=(st.alpha**2)*.6*gs(f,st.pdr,.7);if(st.spind)p+=60*gs(f,13,.8);
    p*=v*v*h*h;
    if(st.pd&&(st.pd.m1==='G'||st.pd.side===side)){const a=(st.pd.amp/6)**2*(st.supp>.5?.4:1);for(let k=1;k<=6;k++)p+=a*gs(f,st.pd.f*k,.25)/k;p+=a*.15*gs(f,6,5)}
    if(st.rda&&(st.rda.m1==='G'||st.rda.side===side))p+=(st.rda.amp/3)**2*gs(f,st.rda.f,.3);
    if(szAmt>0)for(let k=1;k<=3;k++)p+=szAmt*1400*gs(f,szF*k,.5+.3*k)/k;
    return p*Math.exp(.25*r.n())})}
function trendPoint(st,sz,r){const szL=sz&&(sz.gen||sz.side<0)?sz.frac:0,szR=sz&&(sz.gen||sz.side>0)?sz.frac:0,f=sz?sz.f:0,L=specOf(st,-1,f,szL,r),Rr=specOf(st,1,f,szR,r);
  const band=(S,a,b)=>S.reduce((s,p,i)=>FQ[i]>=a&&FQ[i]<b?s+p:s,0),tot=S=>S.reduce((a,b)=>a+b,0),TL=tot(L),TR=tot(Rr);
  const amp=Math.sqrt((TL+TR)/2)*.9,bsr=Math.round(100*Math.min(1,st.supp)),upper=Math.max(2,amp*(1+.15*r.n())),lower=st.supp>.02?Math.max(.6,upper*.2*(1-st.supp)):upper*.42;
  const rhy=(sz?sz.frac:0)+(st.pd?.35*Math.min(1,st.pd.amp/150):0)+(st.rda?.25:0);
  return{L,R:Rr,up:upper,lo:lower,bsr,rhy:Math.min(1,rhy),adrL:band(L,8,13)/(band(L,1,4)+1e-6),adrR:band(Rr,8,13)/(band(Rr,1,4)+1e-6),ai:(TL-TR)/(TL+TR+1e-9)}}
/* ---- scenarios: keyframes of state (time in minutes), seizure rules, events, teaching steps ---- */
const SCN={
 statusEp:{name:'Focal status epilepticus and its treatment',sum:'Discrete seizures merge into status; benzodiazepine, second-line drug, anesthetic, then LPDs as the cortex recovers.',dur:720,
  kf:[[0,{pdr:8,alpha:22,theta:6,delta:6,state:'awake'}],[240,{pdr:0,alpha:0,theta:7,delta:12,state:'coma'}],[420,{pdr:0,alpha:0,theta:6,delta:10,state:'coma'}],[430,{supp:.75,volt:.8,state:'sedated'}],[600,{supp:.7,volt:.8,state:'sedated'}],[615,{supp:0,volt:.9,theta:6,delta:14,pd:{m1:'L',side:-1,f:1.2,amp:180},state:'coma'}],[720,{supp:0,theta:6,delta:12,pd:{m1:'L',side:-1,f:.7,amp:140},state:'coma'}]],
  sz:[{a:50,b:240,every:22,len:1.6,side:-1,f0:5,f1:3},{a:240,b:390,cont:1,side:-1,f0:3.5,f1:3},{a:398,b:418,every:6,len:2.5,side:-1,f0:4,f1:3}],
  events:[[45,'Confused, right arm twitching'],[300,'Lorazepam 4 mg'],[340,'Levetiracetam load'],[425,'Propofol infusion'],[605,'Propofol weaned']],
  steps:[{t:30,ev:'Admission: confused, no seizures yet',why:'Mild diffuse slowing: the posterior rhythm is slower than normal but present.',dir:'base'},
   {t:110,sz:1,ev:'First electrographic seizures',why:'A left hemisphere network escapes inhibition and recruits its neighbours: rhythmic activity that evolves in frequency, amplitude and field.',dir:'worse'},
   {t:330,ev:'Seizures have merged: status epilepticus',why:'With prolonged seizures, synaptic GABA-A receptors are internalized and NMDA receptors added, so the seizure sustains itself and the benzodiazepine fails.',dir:'worse'},
   {t:500,ev:'Propofol burst-suppression',why:'Deep GABA-A potentiation silences the cortex for seconds at a time: bursts separated by suppression (BSR about 70%), no seizures.',dir:'better'},
   {t:690,ev:'After weaning: LPDs on the left',why:'The injured left cortex fires periodic discharges that slow as it recovers; static LPDs at 0.7–1 Hz are interictal, not ictal.',dir:'better'}]},
 paGood:{name:'After cardiac arrest: recovering brain',sum:'Suppression from injury and sedation gives way to continuous, reactive activity within the first day.',dur:4320,
  kf:[[0,{pdr:0,alpha:0,theta:1,delta:2,volt:.25,supp:.6,state:'sedated',react:0}],[360,{volt:.45,supp:.25,theta:3,delta:5}],[720,{volt:.75,supp:0,theta:6,delta:10,react:1,state:'coma'}],[1440,{volt:.95,theta:7,delta:10,spind:1,react:1}],[2880,{pdr:6.5,alpha:14,theta:7,delta:7,state:'drowsy'}],[4320,{pdr:8,alpha:22,theta:5,delta:4,state:'awake',spind:0}]],sz:[],
  events:[[30,'Return of circulation; temperature control 36 °C, propofol'],[1440,'Sedation stopped'],[2880,'Following commands']],
  steps:[{t:60,ev:'1 h after return of circulation, sedated',why:'Early after arrest the cortex is depressed by ischemia and sedation; early suppression alone does not predict outcome.',dir:'base'},
   {t:600,ev:'10 h: continuity returns',why:'Surviving cortical networks resume activity as energy and synapses recover: continuous low-voltage activity by about 12 h is a favourable sign.',dir:'better'},
   {t:1500,ev:'25 h: reactive background with sleep spindles',why:'Spindles need an intact thalamus and reticular nucleus; reactivity needs brainstem–thalamus–cortex pathways. Both are reassuring.',dir:'better'},
   {t:4200,ev:'Day 3: posterior rhythm returns',why:'The thalamocortical loop organizes again: a reactive posterior rhythm.',dir:'better'}]},
 paPoor:{name:'After cardiac arrest: severe anoxic injury',sum:'Suppression that never resolves, identical bursts, then periodic discharges on a suppressed background.',dur:4320,
  kf:[[0,{pdr:0,alpha:0,theta:.5,delta:1,volt:.2,supp:.97,state:'sedated',react:0}],[600,{supp:.97}],[720,{supp:.8,ident:1,volt:.6,state:'coma'}],[1400,{supp:.8,ident:1}],[1500,{supp:.97,ident:0,volt:.25,pd:{m1:'G',side:0,f:1,amp:110}}],[4320,{supp:.97,volt:.2,pd:{m1:'G',side:0,f:.8,amp:100}}]],sz:[],
  events:[[30,'Return of circulation; temperature control 36 °C'],[700,'Sedation off'],[1500,'Generalized myoclonus']],
  steps:[{t:120,ev:'2 h: suppressed, sedated',why:'Early suppression is common and not yet prognostic: ischemia plus sedation and cooling.',dir:'base'},
   {t:900,ev:'15 h: burst-suppression with identical bursts',why:'So few cortical circuits survive that every burst follows the same path. Identical bursts are highly specific for poor outcome.',dir:'worse'},
   {t:2200,ev:'Day 2: GPDs on a suppressed background, unreactive',why:'A highly malignant pattern after 24 h without confounders: surviving cortex discharges periodically with nothing between. Prognosis still requires several modalities.',dir:'worse'},
   {t:4200,ev:'Day 3: unchanged',why:'No recovery of continuity or reactivity by 72 h.',dir:'same'}]},
 sahDCI:{name:'Subarachnoid hemorrhage: delayed cerebral ischemia',sum:'The left alpha/delta ratio falls hours before a clinical deficit; perfusion therapy restores it.',dur:4320,
  kf:[[0,{pdr:8,alpha:18,theta:6,delta:7,state:'drowsy'}],[1800,{pdr:8,alpha:18,theta:6,delta:7}],[2200,{fd:16,fside:-1,asym:.3,aside:-1}],[2700,{fd:24,fside:-1,asym:.45,aside:-1,pdr:7,alpha:12}],[3000,{fd:14,asym:.25}],[4320,{fd:8,asym:.12,pdr:8,alpha:16}]],sz:[],
  events:[[0,'Day 4 after aneurysmal SAH'],[2650,'New right arm weakness, aphasia'],[2760,'Induced hypertension, angioplasty']],
  steps:[{t:600,ev:'Day 4: stable baseline',why:'Mild slowing from the hemorrhage itself; symmetric.',dir:'base'},
   {t:2350,ev:'Day 5 night: left fast activity fading',why:'Vasospasm lowers left hemisphere flow toward 25–30 mL/100 g/min: fast activity fails first, delta grows, the alpha/delta ratio falls. No deficit yet.',dir:'worse'},
   {t:2700,ev:'Clinical deficit appears',why:'Flow now low enough to stop synaptic function in language and motor cortex.',dir:'worse'},
   {t:3900,ev:'After treatment: alpha/delta ratio recovering',why:'Restored perfusion returns synaptic activity before any infarct completes.',dir:'better'}]},
 sedation:{name:'Refractory status: titrating to burst-suppression',sum:'Midazolam, then propofol to a burst-suppression target, then a wean with breakthrough seizures.',dur:1440,
  kf:[[0,{pdr:0,alpha:0,theta:6,delta:12,state:'coma'}],[180,{beta:8}],[300,{supp:.5,volt:.85,state:'sedated'}],[360,{supp:.8}],[1080,{supp:.8}],[1140,{supp:.3}],[1200,{supp:0,beta:5}],[1440,{supp:0}]],
  sz:[{a:0,b:170,every:15,len:2,side:0,gen:1,f0:4,f1:2.5},{a:170,b:300,every:35,len:1.4,side:0,gen:1,f0:4,f1:2.5},{a:1150,b:1280,every:40,len:1.5,side:0,gen:1,f0:4,f1:2.5}],
  events:[[170,'Midazolam infusion'],[300,'Propofol added; target burst-suppression'],[1080,'Wean begins'],[1290,'Second-line drug increased']],
  steps:[{t:120,sz:1,ev:'Frequent generalized seizures',why:'Generalized seizures every 15 minutes: a seizure burden that needs escalation.',dir:'base'},
   {t:600,ev:'Burst-suppression, BSR about 80%',why:'Anesthetic suppression: down-states lasting seconds. The target is control of seizures, not a number.',dir:'better'},
   {t:1200,sz:1,ev:'During the wean: seizures return',why:'Withdrawal of GABAergic suppression unmasks the still-hyperexcitable network; the trend shows new flames as the BSR falls.',dir:'worse'},
   {t:1420,ev:'Seizure-free after drug adjustment',why:'Continuous background without seizures; drug beta from benzodiazepines.',dir:'better'}]},
 hepatic:{name:'Hepatic encephalopathy: ammonia up, then down',sum:'Slowing deepens into GPDs with triphasic morphology, then reverses with treatment.',dur:2880,
  kf:[[0,{pdr:8,alpha:18,theta:7,delta:5,state:'awake'}],[600,{pdr:6.5,alpha:12,theta:9,delta:10,state:'drowsy'}],[1100,{pdr:0,alpha:0,theta:8,delta:14,state:'coma',pd:{m1:'G',side:0,f:1.6,amp:150,tri:1}}],[1700,{pd:{m1:'G',side:0,f:1.4,amp:130,tri:1}}],[2300,{pd:null,pdr:6,alpha:10,theta:9,delta:10,state:'drowsy'}],[2880,{pdr:7.5,alpha:16,theta:7,delta:6,state:'awake'}]],sz:[],
  events:[[0,'Cirrhosis, GI bleed'],[1150,'Ammonia 140 µmol/L; lactulose, rifaximin'],[2400,'Following commands']],
  steps:[{t:200,ev:'Mild confusion',why:'Mild slowing of the posterior rhythm as ammonia rises.',dir:'base'},{t:800,ev:'Drowsy, asterixis',why:'Astrocytes convert ammonia to glutamine and swell; synaptic and thalamocortical function slows further.',dir:'worse'},
   {t:1400,ev:'Stuporous: GPDs with triphasic morphology',why:'Diffuse cortical and thalamic depression produce frontally led periodic discharges with a front-to-back lag.',dir:'worse'},{t:2600,ev:'Improving',why:'Lower ammonia: discharges disappear and the posterior rhythm returns.',dir:'better'}]},
 hypogly:{name:'Hypoglycemia and correction',sum:'Glucose falls: slowing, a seizure, then rapid recovery after dextrose.',dur:120,
  kf:[[0,{pdr:9.5,alpha:28,state:'awake'}],[30,{pdr:8,alpha:22,theta:8,delta:6}],[50,{pdr:0,alpha:0,theta:10,delta:18,state:'coma'}],[72,{pdr:0,alpha:0,theta:9,delta:20}],[78,{pdr:7,alpha:12,theta:8,delta:10,state:'drowsy'}],[120,{pdr:9.5,alpha:26,theta:4,delta:4,state:'awake'}]],
  sz:[{a:58,b:66,every:30,len:1.5,side:1,f0:5,f1:3}],events:[[0,'Insulin given, no food'],[45,'Glucose 2.1 mmol/L (38 mg/dL)'],[70,'Dextrose 50% IV']],
  steps:[{t:20,ev:'Glucose falling',why:'Neurons depend on glucose: synaptic activity slows first.',dir:'base'},{t:55,ev:'Unresponsive, diffuse delta',why:'Energy failure depresses cortex diffusely; excitability can also rise (seizures).',dir:'worse'},{t:62,sz:1,ev:'Focal seizure',why:'Energy-starved, disinhibited cortex can seize; the cause is metabolic, not structural.',dir:'worse'},{t:110,ev:'Minutes after dextrose',why:'Before membrane failure, restoring fuel restores synaptic function quickly.',dir:'better'}]},
 icpRise:{name:'Rising intracranial pressure',sum:'A right hemisphere mass: focal slowing, then bilateral delta, then suppression; osmotherapy reverses it.',dur:720,
  kf:[[0,{pdr:8,alpha:18,theta:5,delta:6,fd:18,fside:1,state:'drowsy'}],[300,{pdr:0,alpha:0,fd:26,theta:6,delta:14,rda:{m1:'G',f:2,amp:45},state:'coma'}],[460,{volt:.55,supp:.3,rda:null,delta:10}],[520,{volt:.8,supp:0,rda:{m1:'G',f:2,amp:35}}],[720,{pdr:7,alpha:12,fd:20,delta:9,rda:null,state:'drowsy'}]],sz:[],
  events:[[0,'Right frontal hemorrhage'],[450,'Pupil asymmetry'],[470,'Hypertonic saline, head up']],
  steps:[{t:100,ev:'Focal right slowing',why:'Cortex over and around the hematoma is deafferented: continuous polymorphic delta on the right.',dir:'base'},{t:380,ev:'Bilateral rhythmic delta',why:'Rising pressure distorts deep midline structures: generalized rhythmic delta.',dir:'worse'},
   {t:465,ev:'Voltage falls, flat stretches',why:'Perfusion pressure (MAP − ICP) is falling below what the cortex needs: synaptic failure.',dir:'worse'},{t:700,ev:'After osmotherapy',why:'Lower pressure, better perfusion: suppression resolves, focal slowing remains.',dir:'better'}]},
 hypothermCourse:{name:'Deep hypothermic circulatory arrest',sum:'Cooling slows, suppresses and silences the EEG; rewarming brings it back.',dur:360,
  kf:[[0,{pdr:0,alpha:0,theta:6,delta:8,beta:6,state:'sedated'}],[60,{theta:5,delta:12,beta:2,volt:.85}],[100,{supp:.6,volt:.6}],[130,{supp:1,volt:.1}],[190,{supp:1,volt:.1}],[230,{supp:.6,volt:.5}],[290,{supp:0,volt:.85,delta:12,theta:6}],[360,{supp:0,volt:1,theta:6,delta:8,beta:5}]],sz:[],
  events:[[0,'Anesthetized, 36 °C'],[120,'18 °C: circulatory arrest'],[175,'Reperfusion and rewarming']],
  steps:[{t:30,ev:'Anesthetized, normothermic',why:'Continuous anesthetic background.',dir:'base'},{t:90,ev:'Cooling to about 24 °C',why:'Cold slows channel kinetics, synapses and metabolism: slower, then discontinuous.',dir:'worse'},
   {t:160,ev:'18 °C: electrocerebral silence',why:'At deep temperatures cortical activity stops; metabolism is low enough to tolerate a brief circulatory arrest.',dir:'worse'},{t:340,ev:'Rewarmed',why:'Recovery of continuous activity during rewarming.',dir:'better'}]},
 sleepNight:{name:'A normal night of sleep',sum:'Cycles of N2, N3 and REM: what normal looks like on a trend.',dur:480,kf:[],sz:[],events:[[0,'Lights out']],
  steps:[{t:5,ev:'Awake, eyes closed',why:'Posterior alpha: the thalamocortical loop idles.',dir:'base'},{t:40,ev:'N2 sleep',why:'Reticular nucleus pacing makes spindles: a 12–14 Hz band on the trend.',dir:'same'},{t:70,ev:'N3 sleep',why:'Slow oscillation: high-amplitude delta, the brightest low-frequency band of the night.',dir:'same'},{t:110,ev:'REM sleep',why:'Cholinergic drive returns: low-voltage desynchronized activity with eye movements.',dir:'same'}]}};
(()=>{const S_={awake:{pdr:10,alpha:28,theta:3,delta:3,spind:0,state:'awake'},n1:{pdr:0,alpha:4,theta:8,delta:5,spind:0,state:'drowsy'},n2:{pdr:0,alpha:0,theta:7,delta:10,spind:1,state:'sleep'},n3:{pdr:0,alpha:0,theta:6,delta:38,spind:1,state:'sleep'},rem:{pdr:0,alpha:4,theta:7,delta:4,spind:0,state:'rem'}},o=[];let base=0;
  for(let c=0;c<4;c++){const seq=c?[['n2',0],['n3',20+c*6],['n2',50],['rem',60+c*4],['n2',85+c*8]]:[['awake',0],['n1',15],['n2',25],['n3',45],['n2',85],['rem',95],['n2',112]];seq.forEach(([st,d])=>{const x=Object.assign({},S_[st]);if(st==='n3')x.delta=Math.max(12,38-c*9);o.push([base+d,x])});base+=c?115:120}
  o.push([475,S_.awake]);SCN.sleepNight.kf=o})();
const SCNL=Object.keys(SCN);
function stepT(sc,i){const s=sc.steps[i];if(!s.sz)return s.t;const z=szList(sc).reduce((a,z)=>!a||Math.abs(z.a-s.t)<Math.abs(a.a-s.t)?z:a,null);return z?z.a+.5/60:s.t}
/* ---- state at a time, seizures at a time ---- */
function stateAt(sc,tm){const kf=sc.kf;let a=kf[0],b=kf[kf.length-1];for(let i=0;i<kf.length-1;i++)if(tm>=kf[i][0]&&tm<=kf[i+1][0]){a=kf[i];b=kf[i+1];break}
  const acc={};for(const k of kf){if(k[0]>tm)break;Object.assign(acc,k[1])}const sA=mkState(acc),bAcc=Object.assign({},acc,b[1]),sB=mkState(bAcc),u=b[0]>a[0]?clamp((tm-a[0])/(b[0]-a[0]),0,1):0,st=Object.assign({},sA);
  if(tm<=b[0]){NUMK.forEach(k=>st[k]=sA[k]+(sB[k]-sA[k])*u);if(!(sA.pdr>0&&sB.pdr>0))st.pdr=sA.pdr>0?sA.pdr:sB.pdr}if(sA.pd&&sB.pd&&tm<=b[0])st.pd=Object.assign({},sA.pd,{f:sA.pd.f+(sB.pd.f-sA.pd.f)*u,amp:sA.pd.amp+(sB.pd.amp-sA.pd.amp)*u});return st}
function szList(sc){if(sc._sz)return sc._sz;const r=mkRand(hash(sc.name)),o=[];(sc.sz||[]).forEach(z=>{if(z.cont){o.push({a:z.a,b:z.b,side:z.side,gen:z.gen,f0:z.f0,f1:z.f1});return}let t=z.a+r.r(0,z.every);while(t<z.b){const len=z.len*r.r(.7,1.3);o.push({a:t,b:t+len,side:z.side,gen:z.gen,f0:z.f0,f1:z.f1});t+=z.every*r.r(.6,1.4)}});return sc._sz=o}
function szAt(sc,tm){return szList(sc).find(z=>tm>=z.a&&tm<=z.b)}
function trendOf(sc){if(sc._tr)return sc._tr;const n=360,r=mkRand(hash(sc.name)+7),pts=[];for(let i=0;i<n;i++){const t0=sc.dur*i/n,t1=sc.dur*(i+1)/n,st=stateAt(sc,(t0+t1)/2);let frac=0,z=null;szList(sc).forEach(s=>{const ov=Math.max(0,Math.min(t1,s.b)-Math.max(t0,s.a));if(ov>0){frac+=ov/(t1-t0);z=s}});
  pts.push(trendPoint(st,z?{frac:Math.min(1,frac),f:(z.f0+z.f1)/2,side:z.side,gen:z.gen}:null,r))}return sc._tr=pts}
function scnPage(id,tm,seed){const sc=SCN[id],z=szList(sc).find(z=>tm>=z.a-8/60&&tm<=z.b);let sz=null,ps=tm*60;
  if(z){const into=(tm-z.a)*60;if(into<10)ps=z.a*60-2;const on=z.a*60-ps;sz={t0:Math.max(0,on),t1:Math.min(DUR+1,z.b*60-ps),on,len:(z.b-z.a)*60,f0:z.f0,f1:z.f1,side:z.side||-1,gen:z.gen}}
  const st=stateAt(sc,ps/60),R=composeRec(st,seed??hash(id+Math.round(tm)),{sz,stim:!!sc.stimAll});R.scn=id;R.tm=ps/60;return R}
const fmtT=(sc,m)=>sc.dur<=180?`${Math.round(m)} min`:m<60?`${Math.round(m)} min`:`${Math.floor(m/60)} h${m%60>=1&&sc.dur<=1440?' '+String(Math.round(m%60)).padStart(2,'0')+' min':''}`;
/* ---- describe what changed between two states ---- */
function diffState(A,B,zA,zB){const o=[],d=(x,y)=>y-x;
  if(!zA&&zB)o.push('Seizure activity has appeared');if(zA&&!zB)o.push('The seizure has stopped');
  if(d(A.supp,B.supp)>.25)o.push(B.supp>.95?'The background is now suppressed':'Suppression (flat time) has increased');if(d(A.supp,B.supp)<-.25)o.push('Continuity has returned (less flat time)');
  if(d(A.volt,B.volt)>.25)o.push('Voltage is higher');if(d(A.volt,B.volt)<-.25)o.push('Voltage is lower');
  const pA=A.pdr>0&&A.alpha>5,pB=B.pdr>0&&B.alpha>5;if(!pA&&pB)o.push('A posterior rhythm has returned');if(pA&&!pB)o.push('The posterior rhythm is gone');if(pA&&pB&&B.pdr-A.pdr<-.8)o.push('The posterior rhythm is slower');if(pA&&pB&&B.pdr-A.pdr>.8)o.push('The posterior rhythm is faster');
  if(!A.pd&&B.pd)o.push(`${B.pd.m1==='L'?'Lateralized':'Generalized'} periodic discharges have appeared`);if(A.pd&&!B.pd)o.push('The periodic discharges have resolved');if(A.pd&&B.pd&&B.pd.f-A.pd.f<-.25)o.push('The periodic discharges are slower');
  if(!A.rda&&B.rda)o.push('Rhythmic delta has appeared');if(A.rda&&!B.rda)o.push('The rhythmic delta has resolved');
  if(d(A.fd,B.fd)>6||d(A.asym,B.asym)>.15)o.push('Focal slowing and attenuation on one side have increased');if(d(A.fd,B.fd)<-6)o.push('The focal slowing has lessened');
  if(!A.spind&&B.spind)o.push('Sleep spindles have appeared');if(A.spind&&!B.spind)o.push('Spindles are gone');
  if(d(A.delta,B.delta)>8)o.push('More delta');if(d(A.delta,B.delta)<-8)o.push('Less delta');if(!A.ident&&B.ident)o.push('The bursts are now identical');
  return o}
