
/* ============ pattern generators ============ */
const GEN={};
const nP=(r,A)=>Pw('n',A??r.r(.13,.17));
const sinMorph=(r,o={})=>V({axis:o.axis??r.r(35,75),amp:o.amp??r.r(.88,1.12),qt:o.qt,stA:.035,std:nrm([.1,.1,1]),...o});
function beatNear(R,t){let b=R.ev.q[0];R.ev.q.forEach(q=>{if(Math.abs(q.t-t)<Math.abs(b.t-t))b=q});return b}
function addCont(R,f,d){const X=R.v[0],Y=R.v[1],Z=R.v[2];for(let i=0;i<R.n;i++){X[i]+=f[i]*d[0];Y[i]+=f[i]*d[1];Z[i]+=f[i]*d[2]}}

/* ---- normal & variants ---- */
GEN.nsr=R=>{const r=R.r,hr=r.r(62,92),pr=r.r(.13,.18),vm=sinMorph(r,{qt:qtF(hr,r.r(.39,.42))}),pm=nP(r);sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Normal sinus rhythm';
  const b=beatNear(R,5);span(R,b.t-pr,b.t,'PR');hl(R,['II'],'P upright, before every QRS');hl(R,['aVR'],'Everything negative in aVR','b')};
GEN.sarr=R=>{const r=R.r,hr=r.r(56,72),pr=r.r(.13,.17),vm=sinMorph(r,{qt:qtF(hr)}),pm=nP(r);sinus(R,{hr,pr,vm,pm,resp:r.r(.13,.17),rper:r.r(3.8,4.8),jit:.005});R.tm={vm,pm,pr};R.meta.rhy='Sinus arrhythmia';R.meta.reg='phasic';
  const q=R.ev.q.filter(x=>x.t>0&&x.t<DUR);let lo=1,hi=1;for(let i=1;i<q.length-1;i++){const d=q[i+1].t-q[i].t;if(d>q[hi+1].t-q[hi].t)hi=i;if(d<q[lo+1].t-q[lo].t)lo=i}
  span(R,q[hi].t,q[hi+1].t,'Longest R–R');span(R,q[lo].t,q[lo+1].t,'Shortest R–R');hl(R,['II'],'Identical P waves throughout')};
GEN.erp=R=>{const r=R.r,hr=r.r(50,68),pr=r.r(.14,.18),qt=qtF(hr,.40),ax=r.r(55,75),vm=V({axis:ax,amp:r.r(1.15,1.35),qt,tA:.62,td:fv(ax-10,.75),stA:.15,std:nrm([.25,.25,1]),stra:.07,xst:[{c:.088,wl:.006,wr:.012,A:.13,d:fv(ax,.25)}]}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';R.autoST=1;hl(R,['V4','V5','II'],'J-point notch','b')};

/* ---- rhythms ---- */
GEN.sbrady=R=>{const r=R.r,hr=r.r(38,52),pr=r.r(.14,.19),vm=sinMorph(r,{qt:qtF(hr)}),pm=nP(r);sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus bradycardia';
  const b=beatNear(R,4.5),q2=R.ev.q.find(q=>q.t>b.t);span(R,b.t,q2.t,'R–R over 1.2 s');hl(R,['II'],'Normal P before each QRS')};
GEN.stach=R=>{const r=R.r,hr=r.r(108,145),pr=r.r(.12,.15),vm=sinMorph(r,{qt:qtF(hr)}),pm=nP(r,.16);sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus tachycardia';
  const b=beatNear(R,5);span(R,b.t-pr,b.t,'P wave, often near the preceding T');hl(R,['II'],'Upright P in II')};
GEN.af=R=>{const r=R.r,hr=r.r(80,140),rr=60/hr,vm=sinMorph(r,{qt:qtF(hr)});let t=-r.r(0,.5);while(t<DUR+.6){addV(R,t,vm);t+=Math.max(.3,rr*(.55+.9*r.u()))}
  const A=r.r(.04,.09),f=bandNoise(r,4,9,A),g=bandNoise(r,4,9,A*.6);addCont(R,f,nrm([-.3,.35,.9]));addCont(R,g,nrm([.4,-.3,.4]));
  R.tm={vm,pm:null,pr:null};R.meta.rhy='Atrial fibrillation';R.meta.reg='irr';R.meta.prq='none';
  const q=R.ev.q.filter(x=>x.t>.3&&x.t<9.7);for(let i=0;i+1<q.length;i++){const d=q[i+1].t-q[i].t;if(d>rr*1.25){span(R,q[i].t,q[i+1].t,'Long R–R');break}}
  hl(R,['V1'],'Fibrillatory baseline, no P waves');hl(R,['II'],'Irregularly irregular','b')};
GEN.flutter=R=>{const r=R.r,cyc=1/r.r(4.6,5.4),A=r.r(.22,.3),mode=r.pick(['2','4','4','var','var']),f=new Float64Array(N),F=[];let ph=r.u();
  for(let i=0;i<N;i++){ph+=1/(cyc*FS);if(ph>=1){ph-=1;F.push(i/FS)}f[i]=(ph<.72?ph/.72:1-(ph-.72)/.28)-.5}
  const fs=Float32Array.from(ff(f,bq('lp',22,.707)));for(let i=0;i<N;i++)fs[i]*=A;addCont(R,fs,nrm([-.1,-.9,.5]));
  let tf=F[0]-cyc;while(tf>-1.2){F.unshift(tf);tf-=cyc}let tl=F[F.length-1];while(tl<DUR+.8){tl+=cyc;F.push(tl)}
  const seq=mode==='var'?shuffle([2,4,2,3,4,2,2,4,3,2,3],r):null,hr=60/(cyc*(mode==='var'?3:+mode)),vm=sinMorph(r,{qt:qtF(Math.min(hr,140))});
  let next=Math.floor(r.u()*2),gi=0;for(let i=0;i<F.length;i++){if(i===next){addV(R,F[i]+.24+.01*r.n(),vm);next=i+(seq?seq[gi%seq.length]:+mode);gi++}}
  R.tm={vm,pm:null,pr:null};R.meta.rhy='Atrial flutter '+(mode==='var'?'with variable block':'with '+mode+':1 block');R.meta.reg=mode==='var'?'irr':'reg';R.meta.prq='none';R.meta.arate=Math.round(60/cyc);
  F.filter(t=>t>.3&&t<9.7).slice(2,6).forEach(t=>pt(R,t+.72*cyc,'F'));hl(R,['II','III','aVF'],'Sawtooth F waves, about 300/min');hl(R,['V1'],'Discrete flutter waves','b')};
GEN.svt=R=>{const r=R.r,hr=r.r(160,210),qt=qtF(hr),vm=sinMorph(r,{qt,xst:[{c:.1,wl:.011,A:.11,d:nrm([-.1,-.9,.45])}],stA:-.07,std:fv(55,-.3)});sinus(R,{hr,vm,jit:.003});
  R.tm={vm,pm:null,pr:null};R.meta.rhy='Narrow-complex regular tachycardia (AVNRT)';R.meta.prq='none';hl(R,['V1'],'Pseudo r′ (retrograde P)');hl(R,['II','III','aVF'],'Pseudo S waves, no visible P','b')};
GEN.mat=R=>{const r=R.r,hr=r.r(105,130),rr=60/hr,vm=sinMorph(r,{qt:qtF(hr)}),dirs=[nrm([.3,.9,.4]),nrm([-.35,.9,.25]),nrm([.45,-.55,.5]),nrm([.8,.35,-.6]),nrm([.05,.95,-.35])];
  let t=-r.r(0,.4);const used=new Set();while(t<DUR+.6){const k=Math.floor(r.u()*dirs.length);used.add(k);const pr=r.r(.1,.2);addP(R,t-pr,Pw('ect',r.r(.11,.2),dirs[k]),{k:'e'+k});addV(R,t,vm,R.ev.p.length-1);t+=rr*r.r(.72,1.3)}
  R.tm={vm,pm:nP(r),pr:.15};R.meta.rhy='Multifocal atrial tachycardia';R.meta.reg='irr';R.meta.prq='var';
  R.ev.p.filter(p=>p.t>.4&&p.t<9.5).slice(0,4).forEach(p=>pt(R,p.t+.04,'P'));hl(R,['II'],'Three or more P-wave shapes, varying PR')};
GEN.junct=R=>{const r=R.r,hr=r.r(42,58),mode=r.pick(['before','after','none']),vm=sinMorph(r,{qt:qtF(hr)}),pm=Pw('retro',.13);
  sinus(R,{hr,vm,jit:.01});if(mode!=='none')R.ev.q.slice().forEach(q=>addP(R,q.t+(mode==='before'?-.08:.1),pm,{k:'r'}));
  R.tm={vm,pm:mode==='before'?pm:null,pr:mode==='before'?.08:null};R.meta.rhy='Junctional rhythm';R.meta.prq=mode==='before'?'short':'none';
  const b=beatNear(R,5);if(mode==='before')span(R,b.t-.08,b.t,'Inverted P, short PR');else if(mode==='after')span(R,b.t+.1,b.t+.18,'Retrograde P after QRS');hl(R,['II','III','aVF'],mode==='none'?'No P waves; narrow QRS at 40–60':'Inverted (retrograde) P')};
GEN.pac=R=>{const r=R.r,hr=r.r(64,84),rr=60/hr,pr=r.r(.14,.17),vm=sinMorph(r,{qt:qtF(hr)}),pm=nP(r),ed=r.pick([nrm([.45,-.6,.5]),nrm([-.3,.9,.3]),nrm([.85,.2,-.5])]);
  let t=-r.r(.1,.7),i=0;const pacs=new Set([2,6+Math.floor(r.u()*2),r.chance(.6)?10:99]);
  while(t<DUR+.7){if(pacs.has(i)){const tp=t-rr+rr*r.r(.55,.68);const pi=addP(R,tp-.15,Pw('ect',.15,ed),{k:'pac'});addV(R,tp,vm,pi);if(tp>.3&&tp<9.7)pt(R,tp-.12,'PAC');t=tp+rr}else{const pi=addP(R,t-pr,pm);addV(R,t,vm,pi);t+=rr*(1+.01*r.n())}i++}
  R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm with premature atrial complexes';R.meta.reg='irr';hl(R,['II'],'Early beat with a different P')};
GEN.pvc=R=>{const r=R.r,hr=r.r(66,86),rr=60/hr,pr=r.r(.14,.17),vm=sinMorph(r,{qt:qtF(hr)}),pm=nP(r),
  pv=V({q:[{c:.05,wl:.03,A:1.4,d:nrm([.15,.85,-.5])},{c:.112,wl:.025,A:.7,d:nrm([.45,.6,-.65])}],qt:.43,t:[{c:.33,wl:.075,wr:.05,A:.5,d:nrm([-.3,-.75,.55])}],stA:.12,std:nrm([-.25,-.8,.5]),kind:'v'});
  let t=-r.r(.1,.6);while(t<DUR+.8){const pi=addP(R,t-pr,pm);addV(R,t,vm,pi);const tv=t+rr*r.r(.5,.58);addV(R,tv,pv);if(tv>.2&&tv<9.8)pt(R,tv,'PVC');addP(R,t+rr-pr,pm,{cond:false});t+=2*rr}
  R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm with ventricular bigeminy';R.meta.reg='regirr';R.meta.vm2=pv;hl(R,['II','V1'],'Wide early beat, no P, discordant T')};
GEN.vt=R=>{const r=R.r,hr=r.r(140,185),rr=60/hr,qt=Math.min(.36,rr*.92),
  vrot=r.r(-14,14),vt=V({q:[{c:.05,wl:.032,A:1.3,d:rot(nrm([-.45,-.75,.55]),vrot)},{c:.118,wl:.03,A:.75,d:rot(nrm([-.55,-.35,.6]),vrot)}],qt,t:[{c:qt-.1,wl:.07,wr:.045,A:.45,d:nrm([.45,.7,-.5])}],kind:'v'}),
  vm=sinMorph(r,{qt:.34}),pm=nP(r,.16),hra=r.r(70,95);
  let t=-r.r(0,rr),tc=r.r(4.2,6.2),capDone=false;while(t<DUR+.6){if(!capDone&&t>tc){const tcap=t-rr+rr*.78;const pi=addP(R,tcap-.16,pm);addV(R,tcap,vm,pi);span(R,tcap-.02,tcap+.12,'Capture beat');t=tcap+rr*1.02;capDone=true;continue}addV(R,t,vt);t+=rr*(1+.006*r.n())}
  let tp=-r.r(0,.8);const pa=60/hra;while(tp<DUR){if(!R.ev.p.some(p=>Math.abs(p.t-tp)<.2))addP(R,tp,pm,{cond:false});tp+=pa}
  R.ev.p.filter(p=>p.t>.5&&p.t<9.5&&!p.cond).slice(1,4).forEach(p=>pt(R,p.t+.04,'P'));
  R.tm={vm:vt,pm:null,pr:null};R.meta.rhy='Monomorphic ventricular tachycardia';R.meta.prq='none';hl(R,['aVR'],'Dominant R in aVR (northwest axis)');hl(R,['V6'],'R/S < 1 in V6','b')};
GEN.tdp=R=>{const r=R.r,hr=r.r(58,70),rr=60/hr,qt=r.r(.58,.64),pr=.16,vm=sinMorph(r,{qt,tA:.42,twl:.08,twr:.05}),pm=nP(r);
  let t=r.r(.15,.35);const pi=addP(R,t-pr,pm);addV(R,t,vm,pi);t+=rr;const p2=addP(R,t-pr,pm);addV(R,t,vm,p2);
  const ts=t+qt-.08;let tt=ts,i=0;const base=nrm([.3,.85,.4]),nb=Math.floor(r.r(20,26)),per=r.r(7,9);
  while(i<nb){const a=Math.sin(Math.PI*(i+1)/per)*(.8+.3*Math.sin(i*.9)),d=rot(base,i*9),A=2.1*a;
    addV(R,tt,{q:[{c:.05,wl:.038,A,d},{c:.14,wl:.04,A:-.55*A,d}],st:[],t:[],loc:[],kind:'v',on:0,off:.2,qt:.24,qrsd:.2});tt+=r.r(.22,.27);i++}
  span(R,ts,tt,'Polymorphic VT twisting around the baseline');pt(R,ts,'R-on-T');
  let t3=tt+r.r(1,1.4);while(t3<DUR+.6){const pp=addP(R,t3-pr,pm);addV(R,t3,vm,pp);t3+=rr}
  R.tm={vm,pm,pr};R.meta.rhy='Torsades de pointes';R.meta.noMeas=['rate','axis','qrs','pr','qtc'];R.meta.prq='none';hl(R,['II'],'Long QT on the sinus beats','b')};
GEN.vf=R=>{const r=R.r,A=r.r(.3,.55),X=new Float32Array(N),Y=new Float32Array(N),Z=new Float32Array(N),comps=[0,1,2].map(k=>({f:r.r(3.8,7.2),m:bandNoise(r,.15,1.2,1),e:bandNoise(r,.1,.8,1),d:nrm([r.n(),r.n(),r.n()]),ph:r.r(0,6)})),nz=bandNoise(r,2.5,12,1);
  for(let i=0;i<N;i++){let sx=0,sy=0,sz=0;comps.forEach(c=>{c.ph+=2*Math.PI*c.f*(1+.18*c.m[i])/FS;const a=A*Math.max(.1,.65+.4*c.e[i])*Math.sin(c.ph);sx+=a*c.d[0];sy+=a*c.d[1];sz+=a*c.d[2]});X[i]=sx+.12*A*nz[i];Y[i]=sy;Z[i]=sz}
  addCont(R,X,[1,0,0]);addCont(R,Y,[0,1,0]);addCont(R,Z,[0,0,1]);R.tm=null;R.meta.rhy='Ventricular fibrillation';R.meta.noMeas=['rate','axis','qrs','pr','qtc'];R.meta.prq='none';R.meta.reg='irr';
  span(R,2,8,'Chaotic, no organized QRS');R.opt.wander=.02};
GEN.aivr=R=>{const r=R.r,hr=r.r(62,90),rr=60/hr,pr=.16,vm=sinMorph(r,{qt:qtF(hr-8)}),pm=nP(r),
  ivr=r.r(-20,20),iv=V({q:[{c:.05,wl:.03,A:1.2,d:rot(nrm([-.3,.75,.6]),ivr)},{c:.12,wl:.028,A:.6,d:rot(nrm([-.5,.3,.65]),ivr)}],qt:.41,t:[{c:.31,wl:.075,wr:.05,A:.45,d:nrm([.4,-.6,-.6])}],kind:'v'}),
  fu=V({q:[...vm.q.map(b=>({...b,A:b.A*.5})),...iv.q.map(b=>({...b,A:b.A*.5}))],qt:.4,t:[{c:.3,wl:.07,wr:.045,A:.15,d:fv(30,.2)}],kind:'f'});
  let t=r.r(.2,.5);const rs=rr*r.r(1.08,1.15);let pi=addP(R,t-pr,pm);addV(R,t,vm,pi);t+=rs;pi=addP(R,t-pr,pm);addV(R,t,fu,pi);span(R,t-.03,t+.14,'Fusion beat');
  let tv=t+rr;while(tv<DUR+.6){addV(R,tv,iv);tv+=rr*(1+.005*r.n())}let tp=t+rs;while(tp<DUR){if(!R.ev.q.some(q=>Math.abs(q.t-(tp+pr))<.12))addP(R,tp,pm,{cond:false});tp+=rs}
  R.tm={vm:iv,pm:null,pr:null};R.meta.rhy='Accelerated idioventricular rhythm';R.meta.prq='none';hl(R,['II'],'Wide, regular, 60–100/min')};

/* ---- conduction ---- */
GEN.avb1=R=>{const r=R.r,hr=r.r(56,84),pr=r.r(.26,.36),vm=sinMorph(r,{qt:qtF(hr)}),pm=nP(r);sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm with first-degree AV block';
  const b=beatNear(R,5);span(R,b.t-pr,b.t,'PR > 200 ms, constant');hl(R,['II'],'Every P conducts')};
GEN.wenck=R=>{const r=R.r,hra=r.r(75,95),pp=60/hra,g=r.pick([3,4,4,5]),b0=r.r(.17,.2),inc=[0,.12,.17,.2,.22],vm=sinMorph(r,{qt:qtF(hra*.85)}),pm=nP(r);
  let t=-r.r(0,pp)-pp*Math.floor(r.u()*g),k=0;while(t<DUR+.5){const j=k%g;if(j<g-1){const pi=addP(R,t,pm);addV(R,t+b0+inc[j],vm,pi)}else{addP(R,t,pm,{cond:false});if(t>.3&&t<9.6)pt(R,t+.04,'Dropped')}t+=pp;k++}
  R.tm={vm,pm,pr:b0};R.meta.rhy=`Second-degree AV block, Mobitz I (${g}:${g-1})`;R.meta.prq='var';R.meta.reg='regirr';
  const blk=R.ev.p.find(p=>!p.cond&&p.t>2);if(blk){const prev=R.ev.q.filter(q=>q.t<blk.t);if(prev.length)span(R,prev[prev.length-1].t-b0-inc[g-2],prev[prev.length-1].t,'Longest PR before the drop')}hl(R,['II'],'PR lengthens, then a P fails to conduct')};
GEN.mob2=R=>{const r=R.r,hra=r.r(70,90),pp=60/hra,pr=r.r(.16,.2),g=r.pick([3,4,4,5]),vm=rbbbM(r,{qt:qtF(hra*.8)}),pm=nP(r);
  let t=-r.r(0,pp)-pp*Math.floor(r.u()*g),k=0;while(t<DUR+.5){if(k%g!==g-1){const pi=addP(R,t,pm);addV(R,t+pr,vm,pi)}else{addP(R,t,pm,{cond:false});if(t>.3&&t<9.6)pt(R,t+.04,'Dropped')}t+=pp;k++}
  R.tm={vm,pm,pr};R.meta.rhy=`Second-degree AV block, Mobitz II (${g}:${g-1})`;R.meta.reg='regirr';hl(R,['II'],'Constant PR, then a sudden non-conducted P');hl(R,['V1'],'Wide QRS (RBBB): infranodal disease','b')};
GEN.avb21=R=>{const r=R.r,hra=r.r(78,100),pp=60/hra,pr=r.r(.17,.24),wide=r.chance(.5),vm=wide?rbbbM(r,{qt:qtF(hra/2)}):sinMorph(r,{qt:qtF(hra/2)}),pm=nP(r);
  let t=-r.r(0,pp),k=0;while(t<DUR+.5){if(k%2===0){const pi=addP(R,t,pm);addV(R,t+pr,vm,pi)}else{addP(R,t,pm,{cond:false});if(t>.3&&t<9.6&&k<6)pt(R,t+.04,'Blocked P')}t+=pp;k++}
  R.tm={vm,pm,pr};R.meta.rhy='Second-degree AV block, 2:1';hl(R,['II'],'Every other P is not conducted')};
GEN.avb3=R=>{const r=R.r,hra=r.r(70,100),pp=60/hra,wide=r.chance(.5),hrv=wide?r.r(28,40):r.r(40,55),rv=60/hrv,pm=nP(r),
  vm=wide?V({q:[{c:.05,wl:.03,A:1.2,d:nrm([.25,.8,-.55])},{c:.115,wl:.028,A:.7,d:nrm([.5,.5,-.7])}],qt:.46,t:[{c:.36,wl:.08,wr:.05,A:.45,d:nrm([-.3,-.7,.6])}],kind:'v'}):sinMorph(r,{qt:qtF(hrv)});
  let t=-r.r(0,rv);while(t<DUR+.6){addV(R,t,vm);t+=rv*(1+.004*r.n())}let tp=-r.r(0,pp);while(tp<DUR){addP(R,tp,pm,{cond:false});tp+=pp*(1+.01*r.n())}
  R.tm={vm,pm:null,pr:null};R.meta.rhy=`Third-degree (complete) AV block, ${wide?'ventricular':'junctional'} escape`;R.meta.prq='none';
  R.ev.p.filter(p=>p.t>.3&&p.t<9.6).slice(0,6).forEach(p=>pt(R,p.t+.04,'P'));hl(R,['II'],'P waves march through; no fixed PR')};
const rbbbM=(r,o={})=>V({axis:o.axis??r.r(15,50),amp:r.r(.9,1.1),xq:[{c:.098,wl:.02,wr:.017,A:.8,d:nrm([-.65,-.05,.75])}],term:.5,td:nrm([.75,.5,-.45]),tA:.33,qt:o.qt,...o});
const lbbbM=(r,o={})=>V({q:[{c:.03,wl:.02,A:.5,d:nrm([.85,.15,-.05])},{c:.075,wl:.024,A:1.4*(o.amp??1),d:nrm([.5,.3,-.8])},{c:.118,wl:.018,A:.95*(o.amp??1),d:nrm([.8,.05,-.6])}],qt:o.qt??.44,stA:.17,std:nrm([-.6,-.15,.8]),stra:.03,t:[{c:(o.qt??.44)-.11,wl:.08,wr:.048,A:.42,d:nrm([-.65,-.25,.7])}],...o});
GEN.rbbb=R=>{const r=R.r,hr=r.r(60,90),pr=r.r(.14,.18),vm=rbbbM(r,{qt:qtF(hr,.43)}),pm=nP(r);sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm with right bundle branch block';
  hl(R,['V1','V2'],'rsR′ (“M”) with T inversion');hl(R,['I','V6'],'Wide slurred S wave','b')};
GEN.lbbb=R=>{const r=R.r,hr=r.r(60,88),pr=r.r(.15,.19),vm=lbbbM(r,{qt:qtF(hr,.45)}),pm=nP(r);sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm with left bundle branch block';
  hl(R,['I','aVL','V6'],'Broad notched R, no septal q');hl(R,['V1','V2','V3'],'Deep QS, discordant ST elevation','b')};
GEN.lafb=R=>{const r=R.r,hr=r.r(60,90),pr=r.r(.14,.18),ax=r.r(-70,-50),vm=V({axis:ax,amp:r.r(.9,1.1),sepd:nrm([-.2,.85,.45]),sep:1.4,z:-.3,qt:qtF(hr),td:fv(25,.6)}),pm=nP(r);sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm with left anterior fascicular block';
  hl(R,['I','aVL'],'qR');hl(R,['II','III','aVF'],'rS: left axis deviation','b')};
GEN.lpfb=R=>{const r=R.r,hr=r.r(60,90),pr=r.r(.14,.18),ax=r.r(105,120),vm=V({axis:ax,amp:r.r(.9,1.1),sepd:nrm([.45,-.75,.3]),sep:1.3,z:-.35,qt:qtF(hr),td:fv(70,.6)}),pm=nP(r);sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm with left posterior fascicular block';
  hl(R,['I','aVL'],'rS');hl(R,['III','aVF'],'qR: right axis deviation','b')};
GEN.bifasc=R=>{const r=R.r,hr=r.r(60,88),pr=r.r(.15,.2),vm=V({axis:r.r(-55,-45),sepd:nrm([-.2,.85,.45]),sep:1.4,z:-.3,xq:[{c:.098,wl:.02,wr:.017,A:.7,d:nrm([-.6,.15,.78])}],term:.3,td:nrm([.7,.4,-.4]),tA:.33,qt:qtF(hr,.43)}),pm=nP(r);sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm, RBBB with left anterior fascicular block';
  hl(R,['V1'],'RBBB: rsR′');hl(R,['II','III','aVF'],'LAFB: rS, left axis','b')};
GEN.wpw=R=>{const r=R.r,hr=r.r(62,90),pr=r.r(.085,.105),vm=V({q:[{c:.07,wl:.032,wr:.012,A:.7,d:nrm([-.35,.5,.8])},{c:.098,wl:.014,A:1.15,d:fv(r.r(55,75),-.25)},{c:.122,wl:.011,A:.3,d:nrm([-.35,-.55,-.75])}],qt:qtF(hr,.42),td:nrm([.6,.35,-.5]),tA:.3}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm with ventricular pre-excitation';const b=beatNear(R,5);span(R,b.t-pr,b.t,'Short PR');pt(R,b.t+.03,'Delta wave');hl(R,['V1','V2'],'Positive delta, tall R');hl(R,['I','aVL'],'Negative delta (pseudo-Q)','b')};
const pacedM=r=>V({q:[{sh:'sp',c:0,A:r.r(.7,1.3)*(r.chance(.5)?1:-1),d:nrm([.35,-.4,-.85])},{c:.045,wl:.026,A:1.2,d:nrm([.2,-.75,-.6])},{c:.105,wl:.028,A:.8,d:nrm([.45,-.55,-.65])}],qt:.45,stA:.12,std:nrm([-.35,.65,.6]),t:[{c:.34,wl:.08,wr:.05,A:.45,d:nrm([-.4,.65,.6])}],kind:'p'});
GEN.vpace=R=>{const r=R.r,hr=r.r(62,82),av=.16,apace=r.chance(.5),vm=pacedM(r),pm=nP(r),ap={sh:'sp',c:0,A:r.r(.5,.9),d:nrm([.3,.85,.3])};
  sinus(R,{hr,pr:av,vm,pm:apace?[ap,...Pw('n',.12).map(b=>({...b,c:b.c+.015}))]:pm});R.tm={vm,pm:apace?null:pm,pr:apace?null:av};R.meta.rhy=apace?'AV sequential (dual-chamber) paced rhythm':'Atrial-sensed, ventricular-paced rhythm';R.meta.prq=apace?'none':'normal';R.meta.paced=1;
  const b=beatNear(R,5);pt(R,b.t,'Pacing spike');if(apace)pt(R,b.t-av,'Atrial spike');hl(R,['V1','V2'],'Wide, LBBB-like paced QRS');hl(R,['II','III','aVF'],'Negative: RV apical pacing (superior axis)','b')};
GEN.fcap=R=>{const r=R.r,hr=r.r(60,72),iv=60/hr,esc=r.r(1.5,1.8),vm=pacedM(r),nat=sinMorph(r,{qt:.42}),sp={q:[{sh:'sp',c:0,A:r.r(.8,1.2),d:nrm([.35,-.4,-.85])}],st:[],t:[],loc:[],kind:'s'};
  let tn=r.r(.1,.6),last=-1,fails=0;const fail=new Set();while(tn<DUR+.5){const capture=r.u()>.45;if(last>-1&&tn-last>esc&&last+esc<tn){const te=last+esc;addV(R,te,nat);span(R,te-.02,te+.1,'Escape beat');last=te;tn=te+iv;continue}
    if(capture){addV(R,tn,vm);last=tn}else{addV(R,tn,sp);if(tn>.2&&tn<9.7){pt(R,tn,'No capture');fails++}}tn+=iv}
  R.tm={vm,pm:null,pr:null};R.meta.rhy='Ventricular pacing with intermittent failure to capture';R.meta.prq='none';R.meta.noMeas=['rate','pr','qtc'];R.meta.paced=1;hl(R,['II'],'Spikes not followed by a QRS')};

/* ---- ischemia & infarction ---- */
GEN.antstemi=R=>{const r=R.r,hr=r.r(75,105),pr=r.r(.13,.17),qt=qtF(hr,.42),vm=V({axis:r.r(30,70),amp:r.r(.9,1.1),qt,sep:0,xq:[{c:.02,wl:.01,A:.32,d:nrm([-.15,.1,-.95])}],stA:r.r(.26,.34),std:nrm([.45,-.42,.8]),stra:.025,t:[{c:qt-.115,wl:.075,wr:.05,A:.52,d:nrm([.35,-.15,.9])}]}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';R.autoST=1};
GEN.infstemi=R=>{const r=R.r,hr=r.r(52,78),pr=r.r(.15,.21),qt=qtF(hr,.42),vm=V({axis:r.r(55,80),qt,xq:[{c:.018,wl:.009,A:.24,d:nrm([.1,-1,.1])}],stA:r.r(.26,.34),std:nrm([-.22,1,-.05]),stra:.025,t:[{c:qt-.115,wl:.075,wr:.05,A:.5,d:nrm([-.05,1,.5])}]}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';R.autoST=1};
GEN.latstemi=R=>{const r=R.r,hr=r.r(70,100),pr=r.r(.13,.17),qt=qtF(hr,.42),vm=V({axis:r.r(25,55),qt,stA:r.r(.24,.3),std:nrm([.85,-.5,-.25]),stra:.025,t:[{c:qt-.115,wl:.075,wr:.05,A:.5,d:nrm([.8,-.3,.25])}]}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';R.autoST=1};
GEN.poststemi=R=>{const r=R.r,hr=r.r(65,95),pr=r.r(.14,.18),qt=qtF(hr,.42),vm=V({axis:r.r(40,70),qt,z:-.08,xq:[{c:.034,wl:.014,A:.45,d:nrm([-.1,.1,1])}],stA:r.r(.24,.3),std:nrm([.25,.25,-1]),stra:.02,t:[{c:qt-.11,wl:.07,wr:.048,A:.55,d:nrm([.3,.3,1])}]}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';R.autoST=1;hl(R,['V1','V2'],'Tall R, upright T','b')};
GEN.dewinter=R=>{const r=R.r,hr=r.r(68,95),pr=r.r(.13,.17),qt=qtF(hr,.42),vm=V({axis:r.r(40,70),qt,xst:[{c:.1,wl:.012,wr:.07,A:.26,d:nrm([-.5,0,-.85])}],t:[{c:qt-.115,wl:.05,wr:.05,A:.9,d:nrm([.35,.25,.9])}]}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';hl(R,['V2','V3','V4'],'Upsloping J-point depression into tall symmetric T');hl(R,['aVR'],'Slight ST elevation','b')};
GEN.wellens=R=>{const r=R.r,hr=r.r(58,82),pr=r.r(.14,.18),qt=qtF(hr,.43),typeA=r.chance(.3),
  t=typeA?[{c:qt-.15,wl:.035,A:.28,d:nrm([.2,.1,1])},{c:qt-.07,wl:.033,A:.5,d:nrm([.15,.1,-1])}]:[{c:qt-.115,wl:.055,wr:.05,A:.72,d:nrm([.35,.3,-.88])}],
  vm=V({axis:r.r(40,70),qt,stA:.05,std:nrm([.1,0,1]),t}),pm=nP(r);sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';R.meta.variant=typeA?'A':'B';
  hl(R,['V2','V3'],typeA?'Type A: biphasic T (up, then down)':'Type B: deep, symmetric T inversion');hl(R,['V1','V2','V3','V4'],'R waves preserved, minimal ST elevation','b')};
GEN.avr=R=>{const r=R.r,hr=r.r(92,118),pr=r.r(.13,.16),qt=qtF(hr,.42),vm=V({axis:r.r(40,70),qt,stA:-r.r(.28,.34),std:nrm([.6,.65,.25]),stra:.02,tA:.2}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus tachycardia';R.autoST=1};
GEN.sgarb=R=>{const r=R.r,hr=r.r(70,95),pr=r.r(.15,.19),vm=lbbbM(r,{qt:qtF(hr,.45),xst:[{sh:'p',a:.15,ra:.03,b:.3,fb:.12,A:.42,d:nrm([.92,-.25,-.1])}]}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm with left bundle branch block';hl(R,['I','aVL','V5','V6'],'Concordant ST elevation (same direction as QRS)');hl(R,['III','aVF'],'Reciprocal depression','b')};
GEN.oldimi=R=>{const r=R.r,hr=r.r(60,82),pr=r.r(.14,.18),qt=qtF(hr),vm=V({axis:r.r(-15,15),qt,xq:[{c:.022,wl:.012,A:.6,d:nrm([.05,-1,.1])}],td:fv(5,.6),tA:.32}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';hl(R,['II','III','aVF'],'Pathologic Q waves (≥ 40 ms), no ST elevation')};
GEN.lvan=R=>{const r=R.r,hr=r.r(65,90),pr=r.r(.14,.18),qt=qtF(hr,.42),vm=V({axis:r.r(20,60),qt,sep:0,xq:[{c:.025,wl:.016,A:.75,d:nrm([-.25,.05,-.95])}],stA:.2,std:nrm([.2,-.1,1]),stra:.03,tA:.16,td:nrm([.3,0,.9])}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';hl(R,['V1','V2','V3','V4'],'QS waves with persistent ST elevation, small T')};

/* ---- chamber & structure ---- */
GEN.lvh=R=>{const r=R.r,hr=r.r(62,85),pr=r.r(.15,.19),qt=qtF(hr,.42),vm=V({axis:r.r(-5,35),amp:r.r(1.6,1.9),z:-.55,qt,s:1.08,stA:.13,std:nrm([-.55,-.3,.55]),td:nrm([-.6,-.35,.55]),tA:.36,twl:.08,twr:.04}),pm=Pw('mitrale',.14);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';hl(R,['V1','V2'],'Deep S');hl(R,['V5','V6','I','aVL'],'Tall R with strain (asymmetric ST-T inversion)','b')};
GEN.rvh=R=>{const r=R.r,hr=r.r(70,95),pr=r.r(.13,.17),qt=qtF(hr),vm=V({axis:r.r(108,130),z:.55,amp:r.r(1.05,1.25),sep:.6,term:.4,qt,td:nrm([.45,.3,-.85]),tA:.32}),pm=Pw('pulm',.14);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';hl(R,['V1','V2'],'Dominant R with T inversion (RV strain)');hl(R,['I','V6'],'Deep S; right axis deviation','b')};
GEN.hcm=R=>{const r=R.r,hr=r.r(60,82),pr=r.r(.15,.18),qt=qtF(hr,.42),vm=V({axis:r.r(10,45),amp:r.r(1.5,1.75),z:-.5,qt,sep:0,xq:[{c:.016,wl:.007,A:.55,d:nrm([-.55,-.6,.6])}],tA:.38}),pm=Pw('mitrale',.14);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';hl(R,['I','aVL','V5','V6','II','III','aVF'],'Deep, narrow "dagger" Q waves');hl(R,['V1','V2'],'High voltage','b')};
GEN.pe=R=>{const r=R.r,hr=r.r(104,128),pr=r.r(.12,.15),qt=qtF(hr),vm=V({axis:r.r(85,100),qt,sepd:nrm([.5,-.6,.6]),sep:1.5,termd:nrm([-.8,.2,.35]),term:1.9,z:-.3,td:nrm([.6,-.2,-.75]),tA:.32}),pm=Pw('pulm',.12);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus tachycardia';hl(R,['I'],'S wave in I');hl(R,['III'],'Q wave and inverted T in III');hl(R,['V1','V2','V3','V4'],'T inversion V1–V4 (RV strain)','b')};
GEN.effusion=R=>{const r=R.r,hr=r.r(102,125),pr=r.r(.12,.15),qt=qtF(hr),A=r.r(.28,.36),va=V({axis:r.r(50,70),amp:A*1.18,qt,tA:.14}),vb=V({axis:r.r(30,45),amp:A*.8,z:-.2,qt,tA:.12}),pm=nP(r,.1);
  sinus(R,{hr,pr,vm:i=>i%2?vb:va,pm});R.tm={vm:va,pm,pr};R.meta.rhy='Sinus tachycardia';R.opt.wander=.03;hl(R,['I','II','III','aVR','aVL','aVF'],'Low voltage (< 5 mm in every limb lead)');hl(R,['V3','V4'],'Electrical alternans','b')};
GEN.dextro=R=>{const r=R.r,hr=r.r(62,88),pr=r.r(.14,.18),vm=sinMorph(r,{qt:qtF(hr),axis:r.r(25,45)}),pm=nP(r);R.opt.mirror=1;R.opt.pg=[1,.9,.75,.62,.52,.44];sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';
  hl(R,['I'],'P, QRS and T all inverted in I');hl(R,['aVR'],'Upright aVR');hl(R,['V3','V4','V5','V6'],'Shrinking R from V1 to V6 (no progression)','b')};

/* ---- electrolytes, drugs, temperature ---- */
GEN.hyperk=R=>{const r=R.r,hr=r.r(60,88),pr=r.r(.2,.24),qt=r.r(.36,.4),vm=V({axis:r.r(40,70),s:1.22,qt,tfix:1,twl:.034,twr:.03,tA:r.r(.9,1.1),td:fv(45,.8)}),pm=Pw('flat',.15);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';hl(R,['V2','V3','V4','II'],'Tall, narrow, peaked ("tented") T');hl(R,['II'],'Flattened P, long PR, QRS widening','b')};
GEN.hyperk2=R=>{const r=R.r,hr=r.r(55,70),dA=fv(r.r(-10,40),-.25),vm=V({q:[{c:.1,wl:.07,A:1.05,d:dA},{c:.34,wl:.09,A:-.85,d:dA},{c:.6,wl:.09,wr:.12,A:.45,d:dA}],qt:.72,t:[]});
  sinus(R,{hr,vm,jit:.006});vm.qrsd=.24;R.tm={vm,pm:null,pr:null};R.meta.rhy='Sine-wave rhythm (no visible P waves)';R.meta.prq='none';R.meta.noMeas=['qtc'];hl(R,['II','V2'],'Very wide QRS merging into T: sine wave')};
GEN.hypok=R=>{const r=R.r,hr=r.r(62,90),pr=r.r(.15,.2),qt=r.r(.37,.41),vm=V({axis:r.r(40,70),qt,tfix:1,tA:.1,uA:r.r(.17,.22),stA:-.07,std:fv(55,.5)}),pm=Pw('n',.18);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';R.meta.uw=1;const b=beatNear(R,5);span(R,b.t+qt+.03,b.t+qt+.17,'Prominent U wave');hl(R,['V2','V3'],'Flat T, U wave larger than T');hl(R,['II','V5','V6'],'ST depression','b')};
GEN.hyperca=R=>{const r=R.r,hr=r.r(60,85),pr=r.r(.14,.18),qt=.29*Math.cbrt(60/hr),vm=V({axis:r.r(40,70),qt,tfix:1,twl:.05,twr:.04}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';const b=beatNear(R,5);span(R,b.t,b.t+qt,'Short QT: T begins right after QRS');hl(R,['II','V3'],'Short or absent ST segment')};
GEN.hypoca=R=>{const r=R.r,hr=r.r(60,85),pr=r.r(.14,.18),qt=r.r(.5,.54)*Math.cbrt(60/hr),vm=V({axis:r.r(40,70),qt,tfix:1}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';const b=beatNear(R,5);span(R,b.t+.1,b.t+qt-.17,'Long, flat ST segment');hl(R,['II','V3'],'Normal T shape, late')};
GEN.lqt=R=>{const r=R.r,hr=r.r(55,72),pr=r.r(.14,.18),qt=r.r(.54,.6)*Math.cbrt(60/hr),notch=r.chance(.5),vm=V({axis:r.r(40,70),qt,t:notch?[{c:qt-.2,wl:.07,wr:.05,A:.28,d:fv(45,.6)},{c:qt-.1,wl:.05,wr:.045,A:.24,d:fv(40,.6)}]:[{c:qt-.115,wl:.11,wr:.05,A:.36,d:fv(45,.6)}]}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';const b=beatNear(R,5);span(R,b.t,b.t+qt,'QT');hl(R,['II','V5'],notch?'Broad, notched T':'Broad T, long QT')};
GEN.dig=R=>{const r=R.r,hr=r.r(56,74),pr=r.r(.18,.22),qt=r.r(.33,.36),ax=r.r(40,70),vm=V({axis:ax,qt,tfix:1,tA:.12,twl:.05,twr:.04,xst:[{c:.17,wl:.06,wr:.05,A:.17,d:neg(fv(ax,-.25))}]}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';hl(R,['II','V4','V5','V6'],'Scooped ("reverse tick") ST depression, short QT')};
GEN.tca=R=>{const r=R.r,hr=r.r(112,138),pr=r.r(.14,.17),qt=r.r(.36,.39),vm=V({axis:r.r(50,80),s:1.3,qt,term:0,xq:[{c:.11,wl:.017,A:.72,d:nrm([-.8,-.55,.2])}],tA:.3}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus tachycardia';hl(R,['aVR'],'Tall terminal R in aVR (> 3 mm)');hl(R,['I','aVL'],'Deep terminal S; wide QRS','b')};
GEN.hypothermia=R=>{const r=R.r,hr=r.r(36,50),pr=r.r(.22,.28),qt=r.r(.54,.6),ax=r.r(45,70),vm=V({axis:ax,qt,tfix:1,xst:[{c:.105,wl:.016,wr:.03,A:.36,d:fv(ax,-.15)}]}),pm=nP(r,.12);
  R.opt.emg=.03;sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus bradycardia';const b=beatNear(R,5);pt(R,b.t+.1,'Osborn (J) wave');hl(R,['II','V3','V4','V5','V6'],'Positive hump at the J point');hl(R,['I','V1'],'Shivering artifact','b')};

/* ---- mimics & technical ---- */
GEN.peric=R=>{const r=R.r,hr=r.r(90,112),pr=r.r(.13,.16),qt=qtF(hr),vm=V({axis:r.r(40,70),qt,stA:r.r(.16,.2),std:nrm([.55,.75,.2]),stra:.07}),pm=[...nP(r),{sh:'p',a:.1,ra:.02,b:pr-.005,fb:.02,A:.07,d:nrm([-.45,-.75,-.4])}];
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus tachycardia';R.autoST=1;hl(R,['aVR'],'PR elevation, ST depression','b')};
GEN.brugada=R=>{const r=R.r,hr=r.r(58,80),pr=r.r(.15,.19),qt=qtF(hr),cv=[{c:.094,wl:.008,wr:.085,A:.46,lm:{V1:1,V2:.9}},{c:.275,wl:.055,wr:.045,A:-.42,lm:{V1:1,V2:.8}}],vm=sinMorph(r,{qt,loc:cv}),pm=nP(r);
  sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm';hl(R,['V1','V2'],'Coved ST elevation ≥ 2 mm into an inverted T')};
GEN.lrrev=R=>{const r=R.r,hr=r.r(62,90),pr=r.r(.14,.18),vm=sinMorph(r,{qt:qtF(hr),axis:r.r(20,45)}),pm=nP(r);R.opt.swap=['LA','RA'];sinus(R,{hr,pr,vm,pm});R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm (limb leads reversed)';
  hl(R,['I'],'P, QRS and T all negative in I');hl(R,['aVR'],'Positive aVR');hl(R,['V1','V2','V3','V4','V5','V6'],'Normal R-wave progression (unlike dextrocardia)','b')};
GEN.artifact=R=>{const r=R.r,hr=r.r(68,88),pr=r.r(.14,.17),vm=sinMorph(r,{qt:qtF(hr)}),pm=nP(r);sinus(R,{hr,pr,vm,pm});
  const a=new Float32Array(N),t0=r.r(.3,.8),t1=t0+r.r(4.6,5.6),m=bandNoise(r,.2,1,1),e=bandNoise(r,.3,1.2,1),fr=r.r(4.8,6.2);let ph=0;
  for(let i=0;i<N;i++){const t=i/FS;ph+=2*Math.PI*fr*(1+.12*m[i])/FS;if(t>t0&&t<t1){const w=Math.min(1,(t-t0)/.25,(t1-t)/.25);a[i]=w*(.62*(1+.35*e[i])*Math.sin(ph)+.12*Math.sin(3*ph+1))}}R.ela.RA=a;
  R.tm={vm,pm,pr};R.meta.rhy='Sinus rhythm with motion artifact';span(R,t0,t1,'Artifact: narrow QRS complexes keep marching through');hl(R,['III'],'Lead III clean: the right-arm electrode is moving');hl(R,['I','II','aVR'],'Leads that use the right arm','b')};
