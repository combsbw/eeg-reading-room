
/* ============ evolution & trajectory: parametric builders ============ */
/* Every scenario step is a function of one physiological variable (time since occlusion, serum K⁺,
   sodium-channel block, temperature...). Steps share a seed, so rate and noise stay those of one patient
   and only the variable under study changes between tracings. */
function finRec(R,pid){R.L=deriveLeads(R);R.ms=measure(R);computeMeta(R);autoST(R);R._c={};R.pid=pid||R.pid||'traj';return R}
function sameNoise(R,ns){R.seed=ns;return R}
/* re-run a catalogue generator with identical morphology and timing but fresh noise (a "repeat tracing") */
function genAlt(pid,seed,ns){const R=newRec(seed>>>0);GEN[pid](R);R.seed=ns>>>0;R.L=deriveLeads(R);R.ms=measure(R);computeMeta(R);if(R.autoST)autoST(R);R.pid=pid;R._c={};return R}
const jitterless=(R,o)=>sinus(R,{jit:.008,...o});

/* --- coronary occlusion with an explicit stage (st, hyp, q, tinv in 0..1) --- */
function corStage(occ,s,seed,o={}){const segs=occSegs(occ,o.dom||'right',o.wrap),R=newRec(seed),hr=o.hr||76,vm=corMorph(segs,s,qtF(hr,o.qtc||.41)),pm=Pw('n',.15),pr=o.pr||.16;
  if(o.rhythm){o.rhythm(R,vm,pm,hr)}else{jitterless(R,{hr,pr,vm,pm});R.tm={vm,pm,pr}}if(!R.tm)R.tm={vm,pm,pr};R.meta.rhy=R.meta.rhy||'Sinus rhythm';R.segs=segs;R.stage=s;return finRec(R,'cor')}
function occAt(occ,tm,tr,seed,o={}){const s={...occStage(tm,tr)};if(tr!=null&&tm>tr+4320){const f=Math.exp(-(tm-tr-4320)/25000);s.tinv*=f;s.q*=.85}return corStage(occ,s,seed,o)}

/* --- AV conduction on top of any ventricular morph --- */
function rhyAVB(type,o={}){return(R,vm,pm,hr)=>{const r=R.r,pp=60/(o.ahr||hr);
  if(type==='avb1'){jitterless(R,{hr,pr:o.pr||.3,vm,pm});R.tm={vm,pm,pr:o.pr||.3};R.meta.rhy='Sinus rhythm with first-degree AV block';return}
  if(type==='wenck'){const g=o.g||4,b0=.2,inc=[0,.11,.16,.19,.21];let t=.25,k=0;while(t<DUR+.5){const j=k%g;if(j<g-1){const pi=addP(R,t,pm);addV(R,t+b0+inc[j],vm,pi)}else addP(R,t,pm,{cond:false});t+=pp;k++}
    R.tm={vm,pm,pr:b0};R.meta.rhy=`Second-degree AV block, Mobitz I (${g}:${g-1})`;R.meta.prq='var';R.meta.reg='regirr';return}
  if(type==='avb3'){const rv=60/(o.vhr||44);let t=.3;while(t<DUR+.6){addV(R,t,vm);t+=rv}let tp=.05;while(tp<DUR){addP(R,tp,pm,{cond:false});tp+=pp}R.tm={vm,pm:null,pr:null};R.meta.rhy='Complete AV block with junctional escape';R.meta.prq='none';return}
  jitterless(R,{hr,pr:.16,vm,pm});R.tm={vm,pm,pr:.16}}}

/* --- potassium: one serum value drives every component --- */
function kRec(K,seed,o={}){const ca=o.ca||0,R=newRec(seed),x=Math.max(0,K-5),wid=Math.max(0,K-6.4)*(1-.65*ca),hr=Math.round(clamp(80-Math.max(0,K-7.2)*16*(1-.4*ca),42,80));
  if(K<4){const d=4-K,qt=qtF(hr,.41+d*.02),vm=V({axis:55,qt,tfix:1,tA:.38*clamp(1-d*.5,.1,1),uA:.03+d*.14,stA:-d*.065,std:fv(55,.5)}),pm=Pw('n',.15+d*.03);
    jitterless(R,{hr,pr:.16,vm,pm});R.tm={vm,pm,pr:.16};R.meta.uw=d>.6?1:0;
    if(o.pvc){const pv=V({q:[{c:.05,wl:.03,A:1.3,d:nrm([.15,.85,-.5])},{c:.112,wl:.025,A:.7,d:nrm([.45,.6,-.65])}],qt:.43,t:[{c:.33,wl:.075,wr:.05,A:.5,d:nrm([-.3,-.75,.55])}],kind:'v'});
      const qs=R.ev.q.filter(q=>q.t>1&&q.t<9);[2,5].forEach(i=>{if(qs[i])addV(R,qs[i].t+60/hr*.62,pv)})}
    R.meta.rhy=o.pvc?'Sinus rhythm with PVCs':'Sinus rhythm';R.meta.K=K;return finRec(R,'kRec')}
  if(K>=8.6&&ca<.5){const dA=fv(30,-.25),vm=V({q:[{c:.1,wl:.07,A:1.05,d:dA},{c:.34,wl:.09,A:-.85,d:dA},{c:.6,wl:.09,wr:.12,A:.45,d:dA}],qt:.72,t:[]});jitterless(R,{hr:Math.min(hr,52),vm});vm.qrsd=.24;R.tm={vm,pm:null,pr:null};
    R.meta.rhy='Sine-wave rhythm, no visible P waves';R.meta.prq='none';R.meta.noMeas=['qtc'];R.meta.K=K;return finRec(R,'kRec')}
  const tw=clamp(1-x*.16,.45,1),tA=clamp(.38+x*.24,.38,1.2),s=1+wid*.42,vm=V({axis:55,s,qt:.37+wid*.03,tfix:1,twl:.068*tw,twr:.042*tw,tA,td:fv(45,.8)});
  const pA=.15*clamp(1-(K-6.4)/1.4+ca*.35,0,1),pwid=1+Math.max(0,K-6)*.25,pm=pA>.012?[{c:.045*pwid,wl:.019*pwid,A:pA,d:nrm([.3,.9,.4])},{c:.072*pwid,wl:.019*pwid,A:pA*.8,d:nrm([.8,.45,-.5])}]:null,pr=.16+Math.max(0,K-5.8)*.035*(1-.4*ca);
  jitterless(R,{hr,pr,vm,pm});R.tm={vm,pm,pr:pm?pr:null};R.meta.rhy=pm?'Sinus rhythm':'Slow regular rhythm without visible P waves (sinoventricular)';if(!pm)R.meta.prq='none';R.meta.K=K;return finRec(R,'kRec')}

/* --- sodium-channel blockade (tricyclic, diphenhydramine, cocaine, class Ic) --- */
function naRec(nb,seed,o={}){const R=newRec(seed),hr=Math.round(o.hr||88+40*clamp(nb*1.4,0,1)),s=1+nb*.85,qt=.37+nb*.07,
  vm=V({axis:60+nb*20,s,qt,term:clamp(1-nb*1.6,0,1),xq:nb>.12?[{c:.069*s,wl:.012*s,A:clamp(nb*1.05,0,.95),d:nrm([-.8,-.55,.2])}]:[],tA:.3}),pm=nP(R.r,.15);
  jitterless(R,{hr,pr:.15+nb*.03,vm,pm});R.tm={vm,pm,pr:.15+nb*.03};R.meta.rhy=hr>100?'Sinus tachycardia':'Sinus rhythm';R.meta.nb=nb;return finRec(R,'naRec')}

/* --- pericarditis stages (Spodick) --- */
function pericRec(stage,seed){const R=newRec(seed),hr=[0,104,92,80,72][stage],qt=qtF(hr),d=nrm([.55,.75,.2]);
  const vm=V({axis:55,qt,stA:stage===1?.19:stage===2?.025:0,std:d,stra:.07,tA:stage===2?.12:stage===3?-.26:.4,td:stage===3?fv(48,.5):fv(43,.6)});
  const pm=[...Pw('n',.15),...(stage===1?[{sh:'p',a:.1,ra:.02,b:.155,fb:.02,A:.075,d:neg(d)}]:stage===2?[{sh:'p',a:.1,ra:.02,b:.155,fb:.02,A:.02,d:neg(d)}]:[])];
  jitterless(R,{hr,pr:.16,vm,pm});R.tm={vm,pm,pr:.16};R.meta.rhy=hr>100?'Sinus tachycardia':'Sinus rhythm';return finRec(R,'pericRec')}

/* --- stress (takotsubo) cardiomyopathy course --- */
function takoRec(day,seed){const R=newRec(seed),dA=nrm([.45,.15,.9]),hr=day<1?98:day<4?84:76,qtc=day<1?.43:day<4?.53:day<20?.47:.41,qt=qtF(hr,qtc);
  const ti=day<1?0:day<4?.95:day<20?.45:0,st=day<1?.24:day<4?.03:0;
  const vm=V({axis:55,qt,tfix:1,stA:st,std:dA,stra:.03,t:ti?[{c:qt-.13,wl:.085,wr:.065,A:-.78*ti,d:nrm([.55,.3,.8])}]:[{c:qt-.097,wl:.068,wr:.042,A:day<1?.62:.4,d:day<1?dA:fv(43,.6)}]}),pm=nP(R.r,.15);
  jitterless(R,{hr,pr:.15,vm,pm});R.tm={vm,pm,pr:.15};R.meta.rhy=hr>100?'Sinus tachycardia':'Sinus rhythm';return finRec(R,'takoRec')}

/* --- repolarization reserve: drug, potassium and rate effects on QT --- */
function qtRec(qtc,seed,o={}){const R=newRec(seed),hr=o.hr||74,qt=qtF(hr,qtc),ex=Math.max(0,qtc-.42),
  t=o.notch?[{c:qt-.22,wl:.07,wr:.05,A:.24,d:fv(45,.6)},{c:qt-.1,wl:.055,wr:.045,A:.22,d:fv(40,.6)}]:[{c:qt-.1-ex*.35,wl:.068+ex*.45,wr:.042+ex*.08,A:.4-ex*.5,d:fv(43,.6)}],
  vm=V({axis:55,qt,tfix:1,t,uA:o.u||0}),pm=nP(R.r,.15);jitterless(R,{hr,pr:.16,vm,pm});R.tm={vm,pm,pr:.16};
  if(o.pvc){const pv=V({q:[{c:.05,wl:.03,A:1.35,d:nrm([.15,.85,-.5])},{c:.112,wl:.025,A:.7,d:nrm([.45,.6,-.65])}],qt:.45,t:[{c:.34,wl:.075,wr:.05,A:.5,d:nrm([-.3,-.75,.55])}],kind:'v'});const q=R.ev.q.filter(x=>x.t>3&&x.t<7)[0];if(q){addV(R,q.t+qt*.92,pv);pt(R,q.t+qt*.92,'R-on-T PVC')}}
  R.meta.rhy=hr<60?'Sinus bradycardia':'Sinus rhythm';return finRec(R,'qtRec')}

/* --- temperature --- */
function tempRec(T,seed){const R=newRec(seed),c=37-T,hr=Math.round(clamp(76-c*4.6,32,76)),ax=55,jA=clamp((35.6-T)*.075,0,.5),s=1+c*.025,qt=qtF(hr,.40)+c*.012,
  vm=V({axis:ax,s,qt,tfix:1,xst:jA>.02?[{c:.1*s,wl:.016,wr:.03,A:jA,d:fv(ax,-.15)}]:[]}),pm=nP(R.r,.13);R.opt.emg=T>=32.5&&T<=35.8?.035:.009;
  jitterless(R,{hr,pr:.16+c*.011,vm,pm});R.tm={vm,pm,pr:.16+c*.011};R.meta.rhy=hr<60?'Sinus bradycardia':'Sinus rhythm';R.meta.T=T;return finRec(R,'tempRec')}

/* --- digoxin: therapeutic effect with optional ectopy --- */
function digRec(seed,o={}){const R=newRec(seed),hr=o.hr||66,ax=55,vm=V({axis:ax,qt:.34,tfix:1,tA:.12,twl:.05,twr:.04,xst:[{c:.17,wl:.06,wr:.05,A:.17,d:neg(fv(ax,-.25))}]}),pm=nP(R.r,.14),pr=o.pr||.2;
  if(o.big){const rr=60/hr,pv=V({q:[{c:.05,wl:.03,A:1.3,d:nrm([-.3,.75,.6])},{c:.12,wl:.028,A:.6,d:nrm([-.5,.3,.65])}],qt:.4,t:[{c:.3,wl:.075,wr:.05,A:.45,d:nrm([.4,-.6,-.6])}],kind:'v'});let t=.3;
    while(t<DUR+.6){const pi=addP(R,t-pr,pm);addV(R,t,vm,pi);addV(R,t+rr*.55,pv);t+=2*rr}R.meta.rhy='Sinus rhythm with ventricular bigeminy';R.meta.reg='regirr'}
  else{jitterless(R,{hr,pr,vm,pm});R.meta.rhy='Sinus rhythm'}R.tm={vm,pm,pr};return finRec(R,'digRec')}

/* --- adenosine at the AV node --- */
function adenRec(kind,phase,seed){const R=newRec(seed),r=R.r,vm=sinMorph(r,{qt:.3,axis:55,amp:1}),pm=nP(r,.15);
  if(kind==='svt'){const vs=sinMorph(r,{qt:.27,axis:55,amp:1,xst:[{c:.1,wl:.011,A:.11,d:nrm([-.1,-.9,.45])}]});
    if(phase===0){jitterless(R,{hr:178,vm:vs});R.tm={vm:vs,pm:null,pr:null};R.meta.rhy='Regular narrow-complex tachycardia (AVNRT)';R.meta.prq='none'}
    else if(phase===1){let t=.2;while(t<3.4){addV(R,t,vs);t+=60/178}const p0=t+1.9;let ts=p0;while(ts<DUR+.6){const pi=addP(R,ts-.17,pm);addV(R,ts,vm,pi);ts+=60/(64+ (ts-p0)*3)}
      span(R,t-.1,p0-.2,'Re-entry interrupted: pause');R.tm={vm,pm,pr:.17};R.meta.rhy='AVNRT terminating to sinus rhythm after a pause';R.meta.reg='irr'}
    else{jitterless(R,{hr:84,pr:.16,vm,pm});R.tm={vm,pm,pr:.16};R.meta.rhy='Sinus rhythm'}return finRec(R,'adenRec')}
  /* flutter */const cyc=60/300,f=new Float64Array(N),F=[];let ph=.3;for(let i=0;i<N;i++){ph+=1/(cyc*FS);if(ph>=1){ph-=1;F.push(i/FS)}f[i]=(ph<.72?ph/.72:1-(ph-.72)/.28)-.5}
  const fs=Float32Array.from(ff(f,bq('lp',22,.707)));for(let i=0;i<N;i++)fs[i]*=.26;addCont(R,fs,nrm([-.1,-.9,.5]));
  F.forEach((t,i)=>{const blocked=phase===1&&t>2.4&&t<7.1;if(!blocked&&i%2===0)addV(R,t+.24,vm)});if(phase===1)span(R,2.6,7.2,'Transient AV block: flutter waves unmasked');
  R.tm={vm,pm:null,pr:null};R.meta.rhy=phase===1?'Atrial flutter with transient high-grade AV block':'Regular narrow-complex tachycardia at 150 (flutter with 2:1 block)';R.meta.prq='none';R.meta.arate=300;if(phase===1)R.meta.reg='irr';return finRec(R,'adenRec')}

/* ============ scenario library ============ */
/* step: t (time label), ev (what happened before it), mk(seed) → record, chg (what changed vs the prior tracing),
   why (the mechanism of that change), dir ('worse' | 'better' | 'same' | 'base'). keys: leads for compact panels. */
const SCN={
antOMI:{name:'Anterior occlusion, never reperfused',cat:'isch',con:['hyperacute','injury','recip','necrosis','territory'],keys:['I','aVL','III','V1','V2','V3','V4','V5'],
 intro:'Proximal LAD occlusion followed from the first minutes to one month with no reperfusion. Each tracing reflects a different cellular stage: ischemic K⁺ loss, then injury current, then necrosis and scar.',
 steps:[
 {t:'Baseline (last year)',mk:s=>occAt('pLAD',0,null,s),chg:'Normal baseline.',why:'Normal activation and repolarization.',dir:'base'},
 {t:'10 minutes',ev:'Sudden chest pain at rest',mk:s=>corStage('pLAD',{st:.04,hyp:.8,q:0,tinv:0},s),chg:'Precordial T waves become broad, tall and bulky relative to the QRS; the ST segment is only slightly lifted.',why:'Within minutes, ischemic myocytes lose K⁺ through K-ATP channels, raising local extracellular K⁺ and shortening the action potential: repolarization in the ischemic zone ends early, and the T wave swells before the ST segment moves.',dir:'worse'},
 {t:'30 minutes',mk:s=>occAt('pLAD',30,null,s),chg:'New ST elevation in V1–V4, I and aVL with reciprocal depression in III and aVF.',why:'Injured cells now sit at a less negative resting potential and a lower plateau than healthy cells. Current flows between them, toward the injured epicardium during the ST segment, so leads facing the territory rise and leads opposite fall.',dir:'worse'},
 {t:'6 hours',mk:s=>occAt('pLAD',360,null,s),chg:'ST elevation persists while the T waves lose their bulk; Q waves begin as anterior R waves shrink.',why:'Myocytes that have died no longer depolarize. The electrical window over the infarct now looks through dead tissue to the far wall, so initial forces point away from the infarct: Q waves.',dir:'worse'},
 {t:'2 days',mk:s=>occAt('pLAD',2880,null,s),chg:'QS complexes V1–V3, ST elevation falling, T waves inverting.',why:'The injury current fades as cells either recover or die. Repolarization in the border zone is now delayed rather than early, reversing the T wave.',dir:'worse'},
 {t:'1 month',mk:s=>occAt('pLAD',43200,null,s),chg:'Q waves remain; small residual ST elevation and inverted T waves.',why:'Scar replaces muscle. Persistent ST elevation weeks later reflects a thin, dyskinetic wall (aneurysm physiology) rather than ongoing injury.',dir:'same'}]},
infReperf:{name:'Inferior occlusion, primary PCI at 90 minutes',cat:'isch',con:['injury','recip','reperf','territory','necrosis'],keys:['II','III','aVF','aVL','I','V1','V2','V5'],
 intro:'Proximal RCA occlusion opened at 90 minutes. Compare with the never-reperfused course: reperfusion stops the clock on necrosis and produces its own signature.',
 steps:[
 {t:'Baseline',mk:s=>occAt('pRCA',0,90,s),chg:'Normal baseline.',why:'Normal.',dir:'base'},
 {t:'15 minutes',ev:'Crushing chest pain, diaphoresis',mk:s=>occAt('pRCA',15,90,s),chg:'Early ST elevation in III > II and aVF with reciprocal depression in aVL; inferior T waves enlarging.',why:'Inferior-wall injury current points down and rightward, toward III more than II, and away from aVL, which mirrors it as depression.',dir:'worse'},
 {t:'60 minutes',mk:s=>occAt('pRCA',60,90,s),chg:'Inferior ST elevation larger, ST elevation in V1 (right ventricle), deeper aVL depression.',why:'The occlusion is proximal to the RV branch: right-ventricular injury adds a rightward, anterior vector that lifts V1 (and V4R).',dir:'worse'},
 {t:'30 minutes after PCI',ev:'Primary PCI opens the RCA at 90 minutes',mk:s=>occAt('pRCA',120,90,s),chg:'ST elevation has fallen by more than half; terminal T inversion begins inferiorly.',why:'Restored flow washes out K⁺ and restores ATP, so resting potential and plateau normalize and the injury current collapses. Rapid ST resolution is the bedside marker of successful reperfusion.',dir:'better'},
 {t:'24 hours',mk:s=>occAt('pRCA',1530,90,s),chg:'Inferior T waves deeply inverted, ST near baseline, only small Q waves.',why:'Reperfused (stunned) myocardium repolarizes late. The delayed repolarization inverts the T wave in leads facing it: reperfusion T waves, the same physiology as Wellens.',dir:'better'},
 {t:'2 months',mk:s=>occAt('pRCA',86400,90,s),chg:'T waves upright again; ECG nearly normal.',why:'Stunning resolves as calcium handling and repolarization recover in salvaged myocardium.',dir:'better'}]},
wellensDyn:{name:'Wellens: a critical LAD lesion that opens and closes',cat:'isch',con:['reperf','hyperacute','injury'],keys:['I','aVL','V1','V2','V3','V4','V5','V6'],
 intro:'A ruptured plaque in the mid LAD intermittently occludes. The ECG changes with flow: occluded, reperfused, re-occluded, then stented.',
 steps:[
 {t:'During chest pain',mk:s=>corStage('mLAD',{st:.4,hyp:.85,q:0,tinv:0},s),chg:'Hyperacute anterior T waves with early ST elevation.',why:'The artery is occluded: ischemic K⁺ efflux shortens and lowers the action potential in the anterior wall.',dir:'base'},
 {t:'Pain-free, 2 hours later',ev:'Pain resolved spontaneously',mk:s=>corStage('mLAD',{st:.06,hyp:.2,q:0,tinv:.5},s),chg:'Biphasic T waves in V2–V3: up, then down (Wellens type A).',why:'Flow has returned. The reperfused zone now repolarizes late; the terminal part of the T wave inverts first.',dir:'better'},
 {t:'Pain-free, next morning',mk:s=>corStage('mLAD',{st:.03,hyp:0,q:0,tinv:.95},s),chg:'Deep symmetric T inversion V2–V4 (Wellens type B), R waves preserved.',why:'Fully reperfused, stunned myocardium repolarizes late. R waves are intact because little muscle has died: this is a warning of a critical lesion, not a completed infarct.',dir:'better'},
 {t:'Recurrent pain',ev:'Pain returns at rest',mk:s=>corStage('mLAD',{st:.12,hyp:.55,q:0,tinv:0},s),chg:'T waves are upright again and look almost normal (pseudonormalization).',why:'Re-occlusion pushes repolarization early again, which cancels the late repolarization that inverted the T. The ECG looks better while the patient is worse.',dir:'worse'},
 {t:'20 minutes later',mk:s=>corStage('mLAD',{st:.8,hyp:.7,q:0,tinv:0},s),chg:'Frank anterior ST elevation.',why:'Ongoing occlusion: full injury current.',dir:'worse'},
 {t:'After stenting',ev:'PCI to the mid LAD',mk:s=>corStage('mLAD',{st:.05,hyp:0,q:.08,tinv:1},s),chg:'ST resolved, deep anterior T inversion again.',why:'Reperfusion T waves return once flow is restored.',dir:'better'}]},
hyperK:{name:'Rising potassium, then treatment',cat:'meta',con:['restK','naAvail','repol'],keys:['II','V1','V2','V3','V4','aVR'],
 intro:'One variable, serum K⁺, rises and then falls with treatment. Every change follows from the resting membrane potential moving toward threshold.',
 steps:[
 {t:'K⁺ 4.2',mk:s=>kRec(4.2,s),chg:'Normal.',why:'Normal resting potential near −90 mV.',dir:'base'},
 {t:'K⁺ 6.3',mk:s=>kRec(6.3,s),chg:'Tall, narrow-based, peaked T waves; everything else normal.',why:'Higher extracellular K⁺ increases the conductance of IKr and IK1, so phase 3 repolarization is faster and more synchronous: a taller, narrower T. This is the first change because repolarizing K⁺ channels sense K⁺ directly.',dir:'worse'},
 {t:'K⁺ 7.2',mk:s=>kRec(7.2,s),chg:'P waves flatten and widen, PR lengthens, QRS starts to widen.',why:'The resting potential is now depolarized toward threshold. Partially depolarized cells inactivate some fast Na⁺ channels, so phase 0 rises more slowly; atrial muscle is most sensitive, so the P fades first.',dir:'worse'},
 {t:'K⁺ 8.1',mk:s=>kRec(8.1,s),chg:'P waves gone, QRS wide, rate slowing.',why:'Atrial myocytes are inexcitable, but the sinus node still drives the ventricles through internodal tracts (sinoventricular rhythm). Ventricular Na⁺ availability is falling, so conduction slows further.',dir:'worse'},
 {t:'K⁺ 8.8',mk:s=>kRec(8.8,s),chg:'Very wide QRS merging into the T: a sine wave.',why:'Conduction is so slow that depolarization and repolarization overlap. The next step is VF or asystole.',dir:'worse'},
 {t:'Two minutes after IV calcium',ev:'IV calcium given; K⁺ still 8.8',mk:s=>kRec(8.8,s,{ca:1}),chg:'QRS narrows and P waves partly return; T waves still peaked.',why:'Calcium screens negative surface charge on the membrane and shifts Na⁺-channel gating and threshold back toward normal, restoring excitability within minutes. It does not lower K⁺, so the T waves stay peaked and the effect wears off in 30–60 minutes.',dir:'better'},
 {t:'One hour after insulin, glucose and albuterol',ev:'Insulin with dextrose and nebulized albuterol',mk:s=>kRec(6.4,s,{ca:.5}),chg:'QRS normal, P normal; residual peaked T waves.',why:'Insulin and beta-2 agonists stimulate the Na⁺/K⁺-ATPase and move K⁺ into cells. Total body K⁺ is unchanged until it is removed.',dir:'better'},
 {t:'After dialysis',ev:'Hemodialysis',mk:s=>kRec(4.5,s),chg:'Normal ECG.',why:'K⁺ removed; resting potential and repolarization restored.',dir:'better'}]},
hypoK:{name:'Falling potassium, then repletion',cat:'meta',con:['restK','repol','mg','ead'],keys:['II','V1','V2','V3','V5','V6'],
 intro:'Low extracellular K⁺ paradoxically reduces K⁺ conductance, slowing repolarization. Watch the T wave shrink and the U wave grow.',
 steps:[
 {t:'K⁺ 4.0',mk:s=>kRec(4.0,s),chg:'Normal.',why:'Normal.',dir:'base'},
 {t:'K⁺ 3.1',mk:s=>kRec(3.1,s),chg:'T waves flatten; a small U wave appears.',why:'Low extracellular K⁺ reduces IKr conductance, so phase 3 is slower and less synchronous: a flatter, broader T. The U wave reflects late repolarization (Purkinje fibers or mid-myocardial cells, or an after-potential).',dir:'worse'},
 {t:'K⁺ 2.6',mk:s=>kRec(2.6,s),chg:'ST depression, U wave now larger than T, long QU interval.',why:'Repolarization is prolonged and dispersed. The apparent long "QT" is really T and U fused.',dir:'worse'},
 {t:'K⁺ 2.1',mk:s=>kRec(2.1,s,{pvc:1}),chg:'Giant U waves and new ventricular ectopy.',why:'Prolonged, uneven repolarization lets L-type Ca²⁺ channels reopen (early afterdepolarizations); hypokalemia also reduces Na⁺/K⁺-ATPase activity and raises intracellular Ca²⁺ (delayed afterdepolarizations). Both trigger extra beats and risk torsades.',dir:'worse'},
 {t:'After K⁺ and Mg²⁺ repletion',ev:'IV potassium chloride and magnesium sulfate',mk:s=>kRec(3.9,s),chg:'T waves restored, U waves small, ectopy gone.',why:'Magnesium is needed by the Na⁺/K⁺-ATPase and limits renal K⁺ wasting; without it, K⁺ repletion fails.',dir:'better'}]},
tcaOD:{name:'Sodium-channel blocker overdose and bicarbonate',cat:'meta',con:['naBlock','naAvail'],keys:['I','aVR','II','V1','V2','V6'],
 intro:'A tricyclic overdose progressively blocks fast Na⁺ channels. The QRS width and the terminal R in aVR track the degree of block; sodium bicarbonate reverses it.',
 steps:[
 {t:'On arrival',mk:s=>naRec(.0,s,{hr:96}),chg:'Mild sinus tachycardia, narrow QRS.',why:'Anticholinergic (muscarinic block) effect raises the sinus rate before Na⁺ channels are affected.',dir:'base'},
 {t:'1 hour',mk:s=>naRec(.3,s),chg:'Sinus tachycardia; QRS widens to about 120 ms with a small terminal R in aVR.',why:'Drug binds fast Na⁺ channels (use-dependent, so tachycardia worsens it). Phase 0 slows; the right side of the conduction system shows it first, adding a terminal rightward force (R in aVR, S in I).',dir:'worse'},
 {t:'3 hours',mk:s=>naRec(.6,s),chg:'QRS about 150 ms, terminal R in aVR over 3 mm.',why:'More channels blocked: conduction through the whole ventricle slows. QRS over 100 ms predicts seizures and over 160 ms predicts ventricular arrhythmia.',dir:'worse'},
 {t:'4 hours',mk:s=>naRec(.85,s),chg:'QRS over 160 ms, large terminal R in aVR.',why:'Severe block: conduction is slow enough to allow re-entry (wide-complex tachycardia, VT) and contractility falls.',dir:'worse'},
 {t:'After 2 sodium bicarbonate boluses',ev:'IV sodium bicarbonate, target pH 7.45–7.55',mk:s=>naRec(.45,s),chg:'QRS narrows to about 140 ms; terminal R in aVR smaller.',why:'The sodium load increases the gradient driving Na⁺ through unblocked channels, and alkalosis increases the uncharged fraction of the drug, which unbinds from the channel.',dir:'better'},
 {t:'Bicarbonate infusion, 6 hours',mk:s=>naRec(.15,s,{hr:104}),chg:'QRS down to about 110 ms; mild tachycardia persists.',why:'Drug redistributes and is metabolized while the sodium and pH effect holds the channels open.',dir:'better'}]},
pericStages:{name:'Acute pericarditis: the four stages',cat:'mimic',con:['inflam','injury'],keys:['I','II','aVR','aVL','V2','V5'],
 intro:'Inflammation of the epicardium injures a thin layer of muscle over the whole heart. The changes are diffuse and evolve over weeks.',
 steps:[
 {t:'Day 1 (stage 1)',mk:s=>pericRec(1,s),chg:'Diffuse concave ST elevation with PR depression; aVR shows PR elevation and ST depression.',why:'Epicardial inflammation injures a thin shell of ventricular muscle everywhere, so the injury current points toward the apex and leftward with no single territory. Atrial epicardial injury depresses the PR segment.',dir:'base'},
 {t:'Day 7 (stage 2)',mk:s=>pericRec(2,s),chg:'ST back to baseline, PR normal, T waves flattening.',why:'Inflammation subsides and the injury current fades; repolarization in the affected shell remains slowed.',dir:'better'},
 {t:'Week 3 (stage 3)',mk:s=>pericRec(3,s),chg:'Diffuse T-wave inversion.',why:'Recovering epicardium repolarizes late, reversing the normal epicardium-first repolarization sequence everywhere.',dir:'same'},
 {t:'Week 8 (stage 4)',mk:s=>pericRec(4,s),chg:'Normal ECG.',why:'Repolarization normal again.',dir:'better'}]},
takoCourse:{name:'Stress (takotsubo) cardiomyopathy',cat:'chan',con:['catechol','disp'],keys:['I','aVR','II','V2','V3','V4','V5','V6'],
 intro:'A catecholamine surge stuns the apex. The ECG mimics anterior STEMI, then evolves through giant T inversion and long QT before normalizing.',
 steps:[
 {t:'Day 0',ev:'Chest pain after severe emotional stress',mk:s=>takoRec(0,s),chg:'Anterior and lateral ST elevation, no reciprocal depression except aVR.',why:'A catecholamine surge stuns the apical myocardium, a region beyond the territory of any single artery. The injury current points toward the apex, so few leads are reciprocal.',dir:'base'},
 {t:'Day 2',mk:s=>takoRec(2,s),chg:'ST resolved; deep, wide, diffuse T inversion with a long QT.',why:'Stunned apical myocardium repolarizes very late, giving deep T inversion and a long QT; this is the window for torsades.',dir:'same'},
 {t:'Week 2',mk:s=>takoRec(10,s),chg:'T inversion shallower, QT shortening.',why:'Wall motion and repolarization recover as the myocardium recovers from stunning.',dir:'better'},
 {t:'Month 2',mk:s=>takoRec(60,s),chg:'Normal ECG.',why:'Complete recovery is typical.',dir:'better'}]},
qtDrug:{name:'QT prolongation to torsades',cat:'meta',con:['ikrBlock','ead','repol','restK','mg'],keys:['II','V2','V3','V5','III','V6'],
 intro:'Repolarization reserve is spent one hit at a time: an IKr-blocking drug, then low potassium and bradycardia, then a pause.',
 steps:[
 {t:'Before the drug',mk:s=>qtRec(.41,s),chg:'Normal QT.',why:'Normal repolarization reserve.',dir:'base'},
 {t:'Day 2 of the drug',ev:'Started an IKr-blocking drug (for example haloperidol, methadone, or a macrolide)',mk:s=>qtRec(.48,s),chg:'QTc lengthens to about 480–500 ms with a broader, lower T wave.',why:'Blocking IKr slows phase 3, lengthening the action potential, more in mid-myocardial cells than in epicardium.',dir:'worse'},
 {t:'Day 4: diarrhea, K⁺ 2.9',ev:'Diarrhea; potassium 2.9, heart rate slows',mk:s=>qtRec(.58,s,{hr:54,notch:1,u:.1,pvc:1}),chg:'QTc over 550 ms, notched T and U waves, an R-on-T PVC.',why:'Low K⁺ further reduces IKr and bradycardia lengthens every action potential. L-type Ca²⁺ channels reopen during the long plateau: early afterdepolarizations trigger a PVC on the T wave.',dir:'worse'},
 {t:'Minutes later',mk:s=>generate('tdp',s),chg:'Polymorphic VT twisting around the baseline (torsades de pointes).',why:'An afterdepolarization fires during repolarization that is dispersed across the wall; re-entry through regions of different refractoriness produces the twisting axis.',dir:'worse'},
 {t:'After magnesium and drug stopped',ev:'IV magnesium, drug stopped, K⁺ repleted, pacing rate raised',mk:s=>qtRec(.44,s,{hr:84}),chg:'QTc back under 470 ms, no ectopy.',why:'Magnesium blocks the L-type Ca²⁺ current that drives afterdepolarizations; a faster rate shortens the action potential; K⁺ restores IKr.',dir:'better'}]},
digCourse:{name:'Digoxin: effect, then toxicity, then antidote',cat:'meta',con:['digoxin','dad','auto','decrem'],keys:['II','V1','V4','V5','V6','aVF'],
 intro:'Na⁺/K⁺-ATPase inhibition raises intracellular Ca²⁺ (more contraction), shortens the action potential and boosts vagal tone. Toxicity tips Ca²⁺ overload into triggered and enhanced automaticity while the AV node blocks.',
 steps:[
 {t:'Therapeutic level',mk:s=>digRec(s),chg:'Scooped ST depression and a short QT ("digoxin effect").',why:'A shorter action potential and earlier repolarization in endocardium sag the ST segment; this is effect, not toxicity.',dir:'base'},
 {t:'Level rising, K⁺ 3.2',ev:'Renal function worsening, diuretic-induced hypokalemia',mk:s=>digRec(s,{big:1}),chg:'Ventricular bigeminy.',why:'Ca²⁺ overload causes spontaneous Ca²⁺ release after repolarization: delayed afterdepolarizations trigger PVCs. Low K⁺ increases digoxin binding to the pump.',dir:'worse'},
 {t:'Next day',mk:s=>generate('atblock',s),chg:'Atrial tachycardia with 2:1 AV block.',why:'Enhanced atrial automaticity (triggered activity) with simultaneous vagal and direct AV-nodal slowing: fast atria, blocked node. Classic for digoxin.',dir:'worse'},
 {t:'Hours later',mk:s=>generate('bidir',s),chg:'Bidirectional VT: alternating QRS axis beat to beat.',why:'Triggered activity alternating between two foci in the fascicles. Seen almost only with digoxin toxicity and CPVT (both Ca²⁺-release disorders).',dir:'worse'},
 {t:'After digoxin immune Fab',ev:'Digoxin-specific antibody fragments given',mk:s=>digRec(s,{hr:72,pr:.18}),chg:'Sinus rhythm with mild residual ST sagging; ectopy gone.',why:'Antibody fragments bind free digoxin; the pump recovers and intracellular Ca²⁺ falls.',dir:'better'}]},
avbInf:{name:'Inferior MI with progressive AV block',cat:'cond',con:['decrem','autonom','territory','reperf'],keys:['II','III','aVF','aVL','V1','V2'],
 intro:'The RCA supplies the AV node in most people. Ischemia, adenosine release and vagal reflexes (Bezold–Jarisch) depress nodal conduction. Block is nodal, narrow-complex and usually transient.',
 steps:[
 {t:'30 minutes',mk:s=>occAt('pRCA',30,null,s,{hr:70,rhythm:rhyAVB('avb1',{pr:.29})}),chg:'Inferior ST elevation with a PR of about 290 ms.',why:'Ischemic AV-nodal cells release adenosine and the inferior wall triggers vagal reflexes: decremental nodal conduction slows.',dir:'base'},
 {t:'1 hour',mk:s=>occAt('pRCA',60,null,s,{hr:80,rhythm:rhyAVB('wenck',{g:4})}),chg:'Wenckebach: PR lengthens until a P wave drops.',why:'Nodal tissue conducts more slowly the faster it is stimulated, so each beat finds it less recovered until one fails. The QRS stays narrow: the block is above the His bundle.',dir:'worse'},
 {t:'2 hours',mk:s=>occAt('pRCA',120,null,s,{hr:84,rhythm:rhyAVB('avb3',{vhr:44})}),chg:'Complete heart block with a narrow junctional escape about 44/min.',why:'The node no longer conducts; the junction below the block becomes the pacemaker. Narrow escape at 40–60 is more reliable than the wide ventricular escape seen with infranodal block.',dir:'worse'},
 {t:'2 days after PCI',ev:'RCA stented at 3 hours',mk:s=>occAt('pRCA',2880,180,s,{hr:72}),chg:'Sinus rhythm, normal PR; inferior T inversion from reperfusion.',why:'Nodal ischemia and reflexes resolve, so conduction returns, as it usually does with inferior MI.',dir:'better'}]},
hypothermiaCourse:{name:'Accidental hypothermia and rewarming',cat:'meta',con:['temp','ito','auto'],keys:['II','V2','V3','V4','V5','I'],
 intro:'Cold slows every ion channel and pump. Watch the J (Osborn) wave grow as temperature falls and shrink as it rises.',
 steps:[
 {t:'35 °C',mk:s=>tempRec(35,s),chg:'Shivering artifact, small J point notching.',why:'Shivering is muscle activity. The transient outward current Ito is relatively preserved while other currents slow, so the epicardial notch grows.',dir:'base'},
 {t:'32 °C',mk:s=>tempRec(32,s),chg:'Sinus bradycardia, clear Osborn waves, long PR and QT.',why:'Slower pacemaker phase 4 (bradycardia) and slower conduction and repolarization (long PR, QRS, QT). The epicardial-endocardial notch difference produces the J wave.',dir:'worse'},
 {t:'29 °C',mk:s=>tempRec(29,s),chg:'Marked bradycardia, large Osborn waves, very long QT; shivering has stopped.',why:'Below about 30 °C shivering fails and the myocardium becomes irritable: VF risk rises with handling.',dir:'worse'},
 {t:'33 °C after rewarming',ev:'Active rewarming',mk:s=>tempRec(33,s),chg:'Rate rising, Osborn waves smaller.',why:'Channel kinetics speed up with temperature.',dir:'better'},
 {t:'37 °C',mk:s=>tempRec(37,s),chg:'Normal.',why:'Normal temperature restores channel kinetics.',dir:'better'}]},
svtAden:{name:'Adenosine for regular narrow-complex tachycardia (AVNRT)',cat:'rhythm',con:['reentry','decrem','autonom'],keys:['II','V1','III','aVF'],
 intro:'Adenosine opens IK-Ado channels in AV-nodal cells, transiently blocking the node. A circuit that uses the node stops; one that does not is unmasked.',
 steps:[
 {t:'Before adenosine',mk:s=>adenRec('svt',0,s),chg:'Regular narrow-complex tachycardia, no P waves, pseudo-r′ in V1.',why:'Re-entry within the AV node: slow pathway down, fast pathway up; atria and ventricles activate almost simultaneously.',dir:'base'},
 {t:'During adenosine',ev:'Adenosine 6 mg rapid IV push with flush',mk:s=>adenRec('svt',1,s),chg:'Tachycardia stops abruptly, a pause, then sinus rhythm.',why:'Adenosine hyperpolarizes nodal cells and blocks the slow pathway: the circuit needs the node, so it terminates.',dir:'better'},
 {t:'After',mk:s=>adenRec('svt',2,s),chg:'Sinus rhythm.',why:'Adenosine is gone within seconds; sinus rhythm persists because nothing re-triggers the circuit.',dir:'better'}]},
flutAden:{name:'Adenosine unmasks atrial flutter',cat:'rhythm',con:['reentry','decrem'],keys:['II','III','aVF','V1'],
 intro:'A regular rate of 150 should suggest flutter with 2:1 block. Adenosine does not stop an atrial circuit; it only blocks the node for a few seconds, showing what was hidden.',
 steps:[
 {t:'Before adenosine',mk:s=>adenRec('flut',0,s),chg:'Regular narrow-complex tachycardia at 150.',why:'Every second flutter wave conducts; the other hides in the QRS or T.',dir:'base'},
 {t:'During adenosine',ev:'Adenosine 6 mg rapid IV push',mk:s=>adenRec('flut',1,s),chg:'Several seconds of no QRS with sawtooth flutter waves continuing.',why:'The node is blocked, but the circuit lives in the right atrium (cavotricuspid isthmus), so atrial activity carries on and becomes visible.',dir:'same'},
 {t:'After',mk:s=>adenRec('flut',0,s),chg:'Back to 2:1 conduction at 150.',why:'Adenosine is diagnostic here, not therapeutic. Treat flutter by rate control, cardioversion or ablation.',dir:'same'}]}
};
/* stable patterns: same patient on two dates, morphology unchanged (for dynamic-versus-static questions) */
const STATIC=[['erp','Benign early repolarization','Stable over years: the J-point notch and concave ST elevation reflect a fixed epicardial Ito gradient, not injury.'],['lvan','LV aneurysm','Persistent ST elevation over QS waves without change: a fixed dyskinetic scar, not ongoing occlusion.'],
  ['lvh','LVH with strain','Strain is secondary repolarization from hypertrophy; it is stable unless ischemia or rate changes.'],['apicalhcm','Apical HCM','Giant T inversions that stay put over months: structural, not ischemic.'],['oldimi','Old inferior MI','Q waves and flat ST segments: completed scar.'],['lbbb','Chronic LBBB','Secondary ST-T changes that are proportional and discordant, and unchanged from before.']];
const SCNL=Object.keys(SCN);
function scnRec(id,i,seed){const st=SCN[id].steps[i];const R=st.mk(seed);R.scn=id;R.step=i;return R}
