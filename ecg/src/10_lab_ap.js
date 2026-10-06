
/* ============ mechanism lab: action potentials -> wedge ECG -> 12-lead ============ */
/* A deliberately simple, parametric model of endocardial, mid-myocardial (M) and epicardial
   action potentials. It is qualitative: the goal is to show *why* each ECG change happens. */
const APL={endo:{act:0,plat:190,d3:85,notch:4,col:'ac'},M:{act:11,plat:222,d3:95,notch:14,col:'pu'},epi:{act:27,plat:140,d3:75,notch:26,col:'mk'}};
const AP0={K:4,Ca:9.5,Mg:2,na:0,ikr:0,ito:1,temp:37,hr:60,isch:'none',dig:false,brug:false};
const APPRESET=[['Normal',{}],['Hyperkalemia 6.5',{K:6.5}],['Hyperkalemia 8.5',{K:8.5}],['Hypokalemia 2.5',{K:2.5}],['Hypercalcemia',{Ca:13.5}],['Hypocalcemia',{Ca:6.8}],['Sodium-channel block (TCA)',{na:.55,hr:115}],['IKr block (long QT)',{ikr:.65,hr:55}],['Low Mg with IKr block',{ikr:.5,Mg:1.1,hr:55}],['Brugada (RV epicardium)',{ito:2.6,na:.25,brug:true}],['Hypothermia 30 °C',{temp:30,hr:42}],['Transmural ischemia',{isch:'trans'}],['Subendocardial ischemia',{isch:'sub',hr:110}],['Digoxin',{dig:true}]];
const ghk=(K,iK=0)=>61.5*Math.log10((K+iK+1.47)/(140+.105));
const naAvail=(Vr,v12=-72)=>1/(1+Math.exp((Vr-v12)/5));
function apLayer(name,st){const b=APL[name],isch=(st.isch==='trans'&&name==='epi')||(st.isch==='sub'&&name==='endo'),Vr=ghk(st.K,isch?5:0),av=naAvail(Vr)*(1-st.na),avN=naAvail(ghk(4)),rel=Math.max(.05,av/avN),
  cold=37-st.temp,cvf=Math.sqrt(rel)*(1-.035*cold),Vpk=Vr+115*Math.pow(Math.min(1,rel),.6)*(isch?.85:1),
  mgAmp=1+Math.max(0,2-st.Mg)*.45,ikr=Math.min(.95,st.ikr*mgAmp);
  let notch=b.notch*st.ito*(1+.1*Math.max(0,cold))*(1+.8*st.na);if(st.brug&&name==='epi')notch*=1.6;notch=Math.min(notch,85);
  const dome=Math.min(95,Math.max(0,notch-32)*2.2),act=b.act/Math.max(.25,cvf);
  let plat=b.plat*Math.pow(60/st.hr,.35)*(1+.06*cold);plat+=(9.5-st.Ca)*22;
  plat*=name==='M'?1+.9*ikr:1+.45*ikr;
  if(st.K<4)plat*=(1+.18*(4-st.K))*(name==='M'?1+.25*(4-st.K):1);else plat*=1-.05*(st.K-4);
  if(isch)plat*=.7;if(st.dig)plat*=.85;plat-=.7*(act-b.act);plat=Math.max(30,plat)+dome;
  let d3=b.d3*(st.K>4?Math.max(.45,1-.12*(st.K-4)):1+.22*(4-st.K))*(1+.5*ikr)*(1+.04*Math.max(0,cold));d3=Math.max(28,d3);
  const Vpl=18-(isch?35:0)-(st.dig?(name==='endo'?14:8):0);
  return{name,Vr,av,rel,cvf,Vpk,notch,dome,plat,d3,Vpl,act,apd:plat+d3*.9,isch}}
function apV(L,t){/* t in ms from this layer's activation */if(t<0)return L.Vr;const up=1.2/Math.max(.2,L.rel);if(t<up)return L.Vr+(L.Vpk-L.Vr)*t/up;
  const Vn=Math.max(-28,L.Vpk-L.notch*1.3),tt=t-up;if(tt<L.dome+8){const nn=Math.min(1,tt/6);let v=L.Vpk+(Vn-L.Vpk)*nn;return v}
  const t2=tt-L.dome-8,dRise=22;let v;if(t2<dRise)v=Vn+(L.Vpl+4-Vn)*(1-Math.exp(-t2/7));else v=L.Vpl+4-6*(t2-dRise)/Math.max(1,L.plat);
  const t3=t-L.plat;if(t3>0){const u=t3/L.d3,f=1/(1+Math.exp(9*(u-.55))),f0=1/(1+Math.exp(-4.95));return L.Vr+(v-L.Vr)*Math.min(1,f/f0)}return v}
function apModel(st){const Ls={endo:apLayer('endo',st),M:apLayer('M',st),epi:apLayer('epi',st)},T0=-40,T1=Math.max(620,Ls.M.act+Ls.M.plat+Ls.M.d3*1.6+40),n=Math.round(T1-T0);
  const V={endo:new Float32Array(n),M:new Float32Array(n),epi:new Float32Array(n)},E=new Float32Array(n);
  for(let i=0;i<n;i++){const t=T0+i;for(const k of['endo','M','epi'])V[k][i]=apV(Ls[k],t-Ls[k].act);E[i]=(.55*(V.endo[i]-V.M[i])+(V.M[i]-V.epi[i]))/95}
  const disp=(Ls.M.act+Ls.M.apd)-(Ls.epi.act+Ls.epi.apd);let jw=0;for(let t=Ls.epi.act+3;t<Ls.epi.act+50;t++)jw=Math.max(jw,E[Math.round(t-T0)]-E[0]);
  return{Ls,V,E,T0,n,disp,jw,ead:(Ls.M.act+Ls.M.apd>470)||disp>140}}
/* map the cellular state onto the full 12-lead generator */
function apMorph(st){const m=apModel(st),L=m.Ls,cvf=L.epi.cvf,Vr=ghk(st.K),avA=naAvail(Vr,-75)*(1-st.na),pa=Math.max(.05,Math.pow(Math.min(1,avA/naAvail(ghk(4),-75)),2.2)),
  s=clamp(1/Math.max(.35,cvf),1,2.6),qt=clamp(.08+(L.M.act+L.M.apd)/1000*1.02,.22,.8),d3n=75,tw=clamp(L.epi.d3/d3n,.4,2.2),
  tA=clamp(.42*Math.pow(1/tw,.7)*(st.K<3.6?Math.max(.2,1-(3.6-st.K)*.6):1),.05,1.3),uA=Math.max(0,(L.M.apd-L.epi.apd-60)/100)*.12+(st.K<3.5?(3.5-st.K)*.13:0),
  xst=[],xq=[],loc=[];let stA=0,std=null;
  if(m.jw>.18&&!st.brug)xst.push({c:.09*s+.012,wl:.012,wr:.025,A:clamp((m.jw-.15)*.9,.05,.5),d:fv(55,-.15)});
  if(st.brug)loc.push({c:.094,wl:.008,wr:.085,A:.46,lm:{V1:1,V2:.9}},{c:.275,wl:.055,wr:.045,A:-.42,lm:{V1:1,V2:.8}});
  if(st.isch==='trans'){stA=.3;std=nrm([.35,-.2,.9])}else if(st.isch==='sub'){stA=-.26;std=nrm([.6,.65,.25])}
  if(st.dig)xst.push({c:.17,wl:.06,wr:.05,A:.17,d:neg(fv(55,-.25))});
  if(st.na>.15)xq.push({c:.07*s+.02,wl:.016*s,A:.75*st.na,d:nrm([-.8,-.55,.2])});
  const vm=V({axis:55,s,qt,tfix:1,twl:clamp(.068*Math.pow(tw,.8),.028,.14),twr:clamp(.042*tw,.025,.1),tA,td:fv(43,.6),uA:Math.min(.32,uA),stA,std,xst,xq,loc});
  const pm=Pw('n',.15*pa).map(b=>({...b,wl:b.wl*(1+.6*(1-Math.sqrt(pa))),c:b.c*(1+.4*(1-Math.sqrt(pa)))})),pr=clamp(.15+(1/cvf-1)*.06+Math.max(0,37-st.temp)*.007+(st.dig?.04:0),.12,.32);
  return{vm,pm,pr,model:m}}
function apRecord(st,seed=31){const R=newRec(seed),{vm,pm,pr,model}=apMorph(st);R.opt.emg=st.temp<34?.03:.009;sinus(R,{hr:st.hr,pr,vm,pm});R.tm={vm,pm,pr};R.L=deriveLeads(R);R.ms=measure(R);R.meta.rhy='Sinus rhythm';computeMeta(R);R._c={};R.pid='aplab';R.model=model;return R}
function apExplain(st,m){const L=m.Ls,o=[],Vr=ghk(st.K).toFixed(0),av=Math.round(L.epi.av*100);
  if(st.K>=5.5)o.push(`<b>High K⁺ (${st.K} mmol/L)</b> moves the resting potential from −87 to ${Vr} mV, so only ${av}% of Na⁺ channels are available. Phase 0 is slower, conduction slows, and the QRS widens; atrial cells are more sensitive, so P waves flatten first. High K⁺ also raises IKr conductance, so phase 3 is faster and shorter: a narrow, peaked T.`);
  if(st.K<=3.4)o.push(`<b>Low K⁺ (${st.K} mmol/L)</b> lowers IKr conductance, so phase 3 is slow and the action potential long, most of all in M cells and Purkinje fibers. The T flattens, late M-cell repolarization adds a U wave, the QU lengthens, and early afterdepolarizations become more likely.`);
  if(st.Ca>=11)o.push(`<b>High Ca²⁺</b> shortens the plateau (phase 2) through faster Ca²⁺-dependent inactivation of L-type channels: the ST segment shortens, so the QT shortens while the T keeps its shape.`);
  if(st.Ca<=8.4)o.push(`<b>Low Ca²⁺</b> lengthens the plateau: a long, flat ST segment and a long QT with a normal-looking T.`);
  if(st.na>=.15)o.push(`<b>Na⁺-channel block (${Math.round(st.na*100)}%)</b> slows phase 0 at every resting potential: wide QRS, and with drugs like TCAs a rightward terminal QRS (tall R in aVR). Less inward Na⁺ also leaves Ito unopposed, deepening the epicardial notch, which is how these drugs unmask Brugada.`);
  if(st.ikr>=.15)o.push(`<b>IKr block (${Math.round(st.ikr*100)}%)</b> delays phase 3, most in M cells, so the QT lengthens and transmural dispersion grows to ${Math.round(m.disp)} ms.${st.Mg<1.6?' Low Mg²⁺ amplifies this.':''}${m.ead?' <b>Early afterdepolarizations are likely: substrate for torsades.</b>':''}`);
  if(st.ito>=1.4&&!st.brug)o.push(`<b>Larger Ito</b> deepens the phase 1 notch in epicardium more than endocardium. During that notch the wall carries a voltage gradient, written as a J (Osborn) wave.`);
  if(st.brug)o.push(`<b>Brugada substrate:</b> in right-ventricular outflow epicardium a very large Ito notch with reduced Na⁺ current delays the dome. Endocardium is depolarized while epicardium is still notched, so the ST is coved upward in V1–V2; the delayed epicardial repolarization then inverts the T.`);
  if(st.temp<=34)o.push(`<b>Hypothermia (${st.temp} °C)</b> slows every channel: longer PR, QRS and QT, and a bigger Ito notch, producing Osborn waves. Shivering adds muscle artifact.`);
  if(st.isch==='trans')o.push(`<b>Transmural (epicardial) ischemia:</b> injured cells lose K⁺ (resting potential rises toward ${ghk(st.K,5).toFixed(0)} mV) and open K-ATP channels (lower, shorter plateau). Current flows between healthy and injured tissue in diastole and systole, so the ST segment rises in leads facing the injury and falls in leads facing away.`);
  if(st.isch==='sub')o.push(`<b>Subendocardial ischemia:</b> the same injury, but on the inner layer, so the gradient points away from the surface: ST depression in the leads over the wall. It does not localize the artery, and aVR often shows reciprocal elevation.`);
  if(st.dig)o.push(`<b>Digoxin</b> blocks Na⁺/K⁺-ATPase, raising intracellular Na⁺ and Ca²⁺: shorter plateau, sagging ST, short QT. In toxicity, Ca²⁺ overload triggers delayed afterdepolarizations (ectopy, bidirectional VT); vagal effects slow the AV node.`);
  if(st.hr>=100)o.push(`<b>Faster rate</b> shortens action potentials (restitution), so the QT shortens.`);
  if(!o.length)o.push('Normal: resting potential about −87 mV, full Na⁺-channel availability, epicardium repolarizing first. That transmural order is why the T wave points the same way as the QRS.');
  return o}
function buildApLab(host,opt={}){const st={...AP0,...(opt.state||{})};
  const c=el('div','card stack',`<div class="row" style="justify-content:space-between"><h2>Action potential lab: from ion channels to the ECG</h2><span class="lbl">Schematic model</span></div>
   <p style="max-width:88ch">Three layers of ventricular wall: endocardium, mid-myocardium (M cells) and epicardium. Their action potentials differ in Ito (phase 1 notch) and in duration. The ECG is the voltage <i>difference</i> across the wall: activation spreads from endocardium to epicardium (QRS), and the epicardium repolarizes first, so the T wave is upright. Change the ions and channels, then watch the cells, the wedge ECG and the full 12-lead.</p>
   <div class="row" id="apPre"></div><div class="aplab"><div class="stack" id="apS" style="gap:6px"></div><div><table class="mt" id="apR"></table></div></div>
   <div class="vwrap"><div id="apC1"></div></div><div class="vwrap"><div id="apC2"></div></div><ul class="f" id="apTx"></ul><h3>The same cells on the 12-lead</h3><div id="apV"></div>`);host.appendChild(c);
  const sl={};const add=(k,l,o)=>{sl[k]=slider($('#apS',c),l,o,v=>{st[k]=v;upd()})};
  add('K','K⁺ (mmol/L)',{min:1.8,max:9.5,step:.1,val:st.K,fmt:v=>v.toFixed(1)});add('Ca','Ca²⁺ total (mg/dL)',{min:5.5,max:15,step:.1,val:st.Ca,fmt:v=>v.toFixed(1)});add('Mg','Mg²⁺ (mg/dL)',{min:.8,max:3.5,step:.1,val:st.Mg,fmt:v=>v.toFixed(1)});
  add('na','Na⁺-channel block',{min:0,max:.8,step:.05,val:st.na,fmt:v=>Math.round(v*100)+'%'});add('ikr','IKr (hERG) block',{min:0,max:.8,step:.05,val:st.ikr,fmt:v=>Math.round(v*100)+'%'});add('ito','Ito (notch current)',{min:.3,max:3,step:.1,val:st.ito,fmt:v=>'× '+v.toFixed(1)});
  add('temp','Temperature (°C)',{min:26,max:39,step:.5,val:st.temp,fmt:v=>v.toFixed(1)});add('hr','Heart rate (/min)',{min:35,max:160,step:1,val:st.hr,fmt:v=>Math.round(v)});
  const r2=el('div','row');$('#apS',c).appendChild(r2);const isg=segment(r2,[['none','No ischemia'],['sub','Subendocardial'],['trans','Transmural']],st.isch,v=>{st.isch=v;upd()});
  const dg=el('input');dg.type='checkbox';dg.checked=st.dig;dg.id='apDig';dg.addEventListener('change',()=>{st.dig=dg.checked;upd()});const dl=el('label','row lbl','Digoxin');dl.style.cssText='gap:6px;text-transform:none;letter-spacing:0';dl.prepend(dg);r2.appendChild(dl);
  const bg=el('input');bg.type='checkbox';bg.checked=st.brug;bg.id='apBrug';bg.addEventListener('change',()=>{st.brug=bg.checked;upd()});const bl=el('label','row lbl','RV outflow epicardium (Brugada substrate)');bl.style.cssText='gap:6px;text-transform:none;letter-spacing:0';bl.prepend(bg);r2.appendChild(bl);
  APPRESET.forEach(([t,o])=>{const b=el('button','chip',t);b.type='button';b.addEventListener('click',()=>{Object.assign(st,AP0,o);Object.keys(sl).forEach(k=>sl[k].set(st[k]));dg.checked=st.dig;bg.checked=st.brug;$$('button',isg).forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.v===st.isch)));$$('#apPre .chip',c).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));upd()});$('#apPre',c).appendChild(b)});
  const c1=mkCanvas($('#apC1',c),250),c2=mkCanvas($('#apC2',c),150),vw=Viewer($('#apV',c),{foot:'Generated from the cellular state above. Drag to measure.'});let m=null,tm=0;
  function draw(){if(!m)return;const S=cvSetup(c1);if(S){const{g,w,h,C}=S,ml=46,mr=10,mt=10,mb=22,pw=w-ml-mr,ph=h-mt-mb,X=t=>ml+(t-m.T0)/m.n*pw,Y=v=>mt+(45-v)/145*ph,cols={endo:C.accent,M:'#8a5bd0',epi:C.mark};
      g.font='10.5px '+C.mono;g.fillStyle=C.muted;g.strokeStyle=C.grid;g.lineWidth=1;[40,0,-40,-80].forEach(v=>{g.beginPath();g.moveTo(ml,Y(v)+.5);g.lineTo(w-mr,Y(v)+.5);g.stroke();g.textAlign='right';g.fillText(v+' mV',ml-4,Y(v)+4)});
      for(let t=0;t<m.T0+m.n;t+=100){g.beginPath();g.moveTo(X(t)+.5,mt);g.lineTo(X(t)+.5,mt+ph);g.stroke();g.textAlign='center';g.fillText(t+' ms',X(t),h-6)}
      ['endo','M','epi'].forEach(k=>{g.strokeStyle=cols[k];g.lineWidth=2;g.beginPath();for(let i=0;i<m.n;i++){const x=X(m.T0+i),y=Y(m.V[k][i]);i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()});
      const L=m.Ls.epi,lab=(t,v,s)=>{g.fillStyle=C.ink;g.font='600 11px '+C.ui;g.textAlign='center';g.fillText(s,X(t),Y(v)-6)};lab(L.act+1,L.Vpk+8,'0');lab(L.act+6+L.dome/2,L.Vpk-L.notch*1.2+2,'1');lab(L.act+L.plat*.6,L.Vpl+12,'2');lab(L.act+L.plat+L.d3*.45,-25,'3');lab(L.act+L.plat+L.d3*1.4,L.Vr+12,'4');
      let lx=w-mr-330;[['Endocardium','endo'],['M cells','M'],['Epicardium','epi']].forEach(([t,k])=>{g.fillStyle=cols[k];g.fillRect(lx,mt+ph-30,14,4);g.fillStyle=C.ink;g.font='11px '+C.ui;g.textAlign='left';g.fillText(t,lx+18,mt+ph-24);lx+=g.measureText(t).width+34})}
    const S2=cvSetup(c2);if(S2){const{g,w,h,C}=S2,ml=46,mr=10,pw=w-ml-mr,X=t=>ml+(t-m.T0)/m.n*pw,base=h*.62,k=h*.42/Math.max(.6,...Array.from(m.E).map(Math.abs)),E=m.E;
      g.fillStyle=C.paper;g.fillRect(ml,0,pw,h);g.strokeStyle=C.gmin;g.lineWidth=1;for(let x=ml;x<w-mr;x+=8){g.beginPath();g.moveTo(x+.5,0);g.lineTo(x+.5,h);g.stroke()}g.strokeStyle=C.gmaj;g.beginPath();g.moveTo(ml,Math.round(base)+.5);g.lineTo(w-mr,Math.round(base)+.5);g.stroke();
      g.strokeStyle=C.trace;g.lineWidth=2;g.beginPath();for(let i=0;i<m.n;i++){const x=X(m.T0+i),y=base-E[i]*k;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();
      g.fillStyle=C.muted;g.font='11px '+C.ui;g.textAlign='left';g.fillText('Transmural (wedge) ECG = endocardium − epicardium voltage, weighted through the M cells',ml+6,14);
      let ti=0,tv=-9,ti2=0,tv2=9;const st0=Math.round(m.Ls.epi.act+60-m.T0);for(let i=st0;i<m.n;i++){if(E[i]>tv){tv=E[i];ti=i}if(E[i]<tv2){tv2=E[i];ti2=i}}
      const lab=(i,s,dy)=>{g.fillStyle=C.mark;g.font='600 11px '+C.ui;g.textAlign='center';g.fillText(s,X(m.T0+i),base-E[i]*k+dy)};lab(Math.round(m.Ls.M.act+4-m.T0),'QRS',-8);if(m.jw>.12)lab(Math.round(m.Ls.epi.act+12-m.T0),'J',-8);lab(Math.round(m.Ls.epi.act+m.Ls.epi.plat*.5-m.T0),'ST',-10);if(Math.abs(tv)>Math.abs(tv2))lab(ti,'T',-8);else lab(ti2,'T',18)}}
  function upd(){m=apModel(st);const L=m.Ls,row=(a,b)=>`<tr><td>${a}</td><td>${b}</td></tr>`;
    $('#apR',c).innerHTML=`<tbody>${row('Resting',`${L.endo.Vr.toFixed(0)} mV (E<sub>K</sub> ${(61.5*Math.log10(st.K/140)).toFixed(0)})`)}${row('Na⁺ avail.',Math.round(L.endo.av*100)+'%')}${row('Conduction',Math.round(L.epi.cvf*100)+'% of normal')}${row('APD endo/M/epi',`${Math.round(L.endo.apd)} / ${Math.round(L.M.apd)} / ${Math.round(L.epi.apd)} ms`)}${row('Dispersion',Math.round(m.disp)+' ms'+(m.ead?' <b style="color:var(--bad)">EAD risk</b>':''))}</tbody>`;
    $('#apTx',c).innerHTML=apExplain(st,m).map(x=>`<li>${x}</li>`).join('');draw();clearTimeout(tm);tm=setTimeout(()=>{const R=apRecord(st);vw.setRec(R);const M=R.meta;$('#apR tbody',c).insertAdjacentHTML('beforeend',`<tr><td>12-lead</td><td>PR ${M.pr} · QRS ${M.qrs} · QT ${M.qt} (QTc ${M.qtcB}) ms</td></tr>`)},90)}
  upd();return{draw:()=>{draw();vw.draw()},set:o=>{Object.assign(st,AP0,o);Object.keys(sl).forEach(k=>sl[k].set(st[k]));dg.checked=st.dig;bg.checked=st.brug;upd()}}}
