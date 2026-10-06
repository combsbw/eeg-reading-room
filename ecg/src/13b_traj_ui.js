
/* ============ evolution: drawing, comparison and questions ============ */
/* compact panel: selected leads in rows of up to four, 2.5 s each, on ECG paper */
function drawCells(cv,rec,leads,o={}){const cols=leads.length===6||leads.length===3?3:Math.min(4,leads.length),rows=Math.ceil(leads.length/cols),sec=o.sec||2.5,s=25,g=10,rowMM=o.rowMM||24,LM=3,Wmm=LM+cols*sec*s+2,
  pm=Math.max(o.minPm||2.4,((cv.parentElement&&cv.parentElement.clientWidth)||560)/Wmm),W=Math.round(Wmm*pm),Hmm=rows*rowMM+2,H=Math.round(Hmm*pm);cv.style.width=W+'px';
  const S=cvSetup(cv,H);if(!S)return;const{g:ctx,C}=S,D=leadData(rec,{filt:'diag',notch:false});ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,H);
  if(pm>=2.3){ctx.strokeStyle=C.gmin;ctx.lineWidth=1;ctx.beginPath();for(let m=0;m<=Wmm;m++){if(m%5===0)continue;const x=Math.round(m*pm)+.5;ctx.moveTo(x,0);ctx.lineTo(x,H)}for(let m=0;m<=Hmm;m++){if(m%5===0)continue;const y=Math.round(m*pm)+.5;ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke()}
  ctx.strokeStyle=C.gmaj;ctx.beginPath();for(let m=0;m<=Wmm;m+=5){const x=Math.round(m*pm)+.5;ctx.moveTo(x,0);ctx.lineTo(x,H)}for(let m=0;m<=Hmm;m+=5){const y=Math.round(m*pm)+.5;ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();
  ctx.lineJoin='round';leads.forEach((ld,k)=>{const r=Math.floor(k/cols),c=k%cols,t0=c*sec+(o.off||0),base=(r*rowMM+rowMM*.62)*pm,x0=(LM+c*sec*s)*pm,d=D[ld];if(!d)return;ctx.strokeStyle=C.trace;ctx.lineWidth=Math.max(1,pm*.34)*LRN.tw();ctx.beginPath();
    const i0=Math.round(t0*FS),i1=Math.min(N-1,Math.round((t0+sec)*FS));for(let i=i0;i<=i1;i++){const x=x0+(i-i0)/FS*s*pm,y=base-d[i]*g*pm;i===i0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke();
    if(c>0){ctx.beginPath();ctx.moveTo(x0,base-3*pm);ctx.lineTo(x0,base+3*pm);ctx.stroke()}ctx.fillStyle=C.ink;ctx.font=`600 ${Math.max(11,Math.round(pm*3))}px `+C.ui;ctx.textAlign='left';ctx.fillText(ld,x0+pm*1.2,r*rowMM*pm+pm*4.2)})}
/* median-beat comparison: prior (dashed) and current (solid), aligned at QRS onset */
function beatOf(R){const tp=template(R);if(!tp)return null;const{L,t0,vm}=tp,i0=Math.round((t0+vm.on)*FS),ib=Math.max(0,i0-8),o={};Object.keys(L).forEach(k=>{const a=L[k],b=a[ib],w=new Float32Array(Math.round(1.05*FS));for(let i=0;i<w.length;i++){const j=i0-Math.round(.25*FS)+i;w[i]=(j>=0&&j<a.length?a[j]:a[a.length-1])-b}o[k]=w});return{w:o,on:.25,off:.25+vm.qrsd,qt:.25+vm.qt-vm.on}}
function drawBeats(cv,prev,now,leads){const cols=Math.min(4,leads.length),rows=Math.ceil(leads.length/cols),s=50,g=10,rowMM=32,Wmm=cols*1.05*s+2,pm=Math.max(2.4,((cv.parentElement&&cv.parentElement.clientWidth)||560)/Wmm),W=Math.round(Wmm*pm),H=Math.round((rows*rowMM+2)*pm);cv.style.width=W+'px';
  const S=cvSetup(cv,H);if(!S)return;const{g:ctx,C}=S;ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,H);const a=prev&&beatOf(prev),b=now&&beatOf(now);
  ctx.strokeStyle=C.gmin;ctx.lineWidth=1;ctx.beginPath();for(let m=0;m<=W/pm;m++){if(m%5===0)continue;const x=Math.round(m*pm)+.5;ctx.moveTo(x,0);ctx.lineTo(x,H)}for(let m=0;m<=H/pm;m++){if(m%5===0)continue;const y=Math.round(m*pm)+.5;ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();
  ctx.strokeStyle=C.gmaj;ctx.beginPath();for(let m=0;m<=W/pm;m+=5){const x=Math.round(m*pm)+.5;ctx.moveTo(x,0);ctx.lineTo(x,H)}for(let m=0;m<=H/pm;m+=5){const y=Math.round(m*pm)+.5;ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();
  if(!b){ctx.fillStyle=C.ink;ctx.font='13px '+C.ui;ctx.fillText('No single organized beat to compare on this tracing.',12,24);return}
  const plot=(B,lead,x0,base,col,dash,lw)=>{const w=B.w[lead];if(!w)return;ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.setLineDash(dash);ctx.beginPath();for(let i=0;i<w.length;i++){const x=x0+i/FS*s*pm,y=base-w[i]*g*pm;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.setLineDash([])};
  leads.forEach((ld,k)=>{const r=Math.floor(k/cols),c=k%cols,x0=(1+c*1.05*s)*pm,base=(r*rowMM+rowMM*.6)*pm;
    if(a)plot(a,ld,x0,base,C.muted,[5,4],Math.max(1.2,pm*.35));plot(b,ld,x0,base,C.accent,[],Math.max(1.4,pm*.45));
    ctx.fillStyle=C.ink;ctx.font=`600 ${Math.max(11,Math.round(pm*3))}px `+C.ui;ctx.textAlign='left';ctx.fillText(ld,x0+pm,r*rowMM*pm+pm*4.5);
    if(a&&prev.ms&&now.ms&&prev.ms.leads[ld]&&now.ms.leads[ld]){const d=(now.ms.leads[ld].st40-prev.ms.leads[ld].st40)*10;if(Math.abs(d)>=.5){ctx.fillStyle=d>0?C.mark:C.accent;ctx.font=`600 ${Math.max(10,Math.round(pm*2.6))}px `+C.mono;ctx.textAlign='right';ctx.fillText(`ST ${d>0?'+':''}${d.toFixed(1)} mm`,x0+1.02*s*pm,r*rowMM*pm+pm*4.5)}}});
  ctx.fillStyle=C.muted;ctx.font='11px '+C.ui;ctx.textAlign='right';ctx.fillText('dashed: prior · solid: current · 50 mm/s',W-6,H-5)}
/* automatic change summary: what a reader should notice between two tracings */
function diffSummary(A,B){const out=[];if(!A||!B)return out;const Ma=A.meta,Mb=B.meta;
  if(Ma.rhy!==Mb.rhy)out.push(['Rhythm',`${Ma.rhy} → ${Mb.rhy}`]);if(Ma.hr&&Mb.hr&&Math.abs(Ma.hr-Mb.hr)>=10)out.push(['Rate',`${Ma.hr} → ${Mb.hr}/min`]);
  const prA=Ma.pr!=null&&!['var','none'].includes(Ma.prq),prB=Mb.pr!=null&&!['var','none'].includes(Mb.prq);if(prA&&!prB)out.push(['P waves','Lost or no longer related to the QRS']);else if(!prA&&prB)out.push(['P waves','Now visible and conducting']);else if(prA&&prB&&Math.abs(Ma.pr-Mb.pr)>=30)out.push(['PR',`${Ma.pr} → ${Mb.pr} ms`]);
  if(Ma.qrs&&Mb.qrs&&Math.abs(Ma.qrs-Mb.qrs)>=15)out.push(['QRS',`${Ma.qrs} → ${Mb.qrs} ms`]);if(Ma.qtcB&&Mb.qtcB&&Math.abs(Ma.qtcB-Mb.qtcB)>=25&&!(Mb.noMeas||[]).includes('qtc'))out.push(['QTc',`${Ma.qtcB} → ${Mb.qtcB} ms (Bazett)`]);
  if(A.ms&&B.ms){const up=[],dn=[],tinv=[],tup=[],tall=[],flat=[],nq=[],rl=[];LEADS.forEach(k=>{const a=A.ms.leads[k],b=B.ms.leads[k];if(!a||!b)return;const d=(b.st40-a.st40)*10;if(d>=1)up.push(`${k} +${d.toFixed(1)}`);else if(d<=-1)dn.push(`${k} ${d.toFixed(1)}`);
      const ta=Math.abs(a.tmin)>a.tmax?a.tmin:a.tmax,tb=Math.abs(b.tmin)>b.tmax?b.tmin:b.tmax;if(k!=='aVR'){if(ta>.05&&tb<-.08)tinv.push(k);else if(ta<-.05&&tb>.08)tup.push(k);else if(tb>.3&&tb>ta*1.6)tall.push(k);else if(Math.abs(ta)>.15&&Math.abs(tb)<Math.abs(ta)*.55&&Math.sign(ta)===Math.sign(tb||ta))flat.push(k)}
      if(b.qd>=.03&&b.qa<-.1&&!(a.qd>=.03&&a.qa<-.1)&&k!=='aVR')nq.push(k);if(PREC.includes(k)&&a.R>.25&&b.R<a.R*.5)rl.push(k)});
    if(up.length)out.push(['ST up (mm)',up.join(', ')]);if(dn.length)out.push(['ST down (mm)',dn.join(', ')]);if(tall.length)out.push(['T taller',tall.join(', ')]);if(flat.length)out.push(['T flatter',flat.join(', ')]);if(B.meta.uw&&!A.meta.uw)out.push(['U waves','New prominent U waves']);if(tinv.length)out.push(['T newly inverted',tinv.join(', ')]);if(tup.length)out.push(['T upright again',tup.join(', ')]);
    if(nq.length)out.push(['New Q waves',nq.join(', ')]);if(rl.length)out.push(['R-wave loss',rl.join(', ')])}
  return out}
const diffHtml=(A,B)=>{const d=diffSummary(A,B);return d.length?`<table class="mt"><tbody>${d.map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</tbody></table>`:'<p class="lbl" style="text-transform:none;letter-spacing:0">No measurable change.</p>'};

/* ============ atlas: Evolution ============ */
const SCNCAT={isch:'Ischemia & reperfusion',meta:'Electrolytes, drugs & temperature',cond:'Conduction',rhythm:'Rhythm & drugs',mimic:'Mimics',chan:'Cardiomyopathy'};
function buildEvo(){const H=$('#aEvo');H.innerHTML='';const st={id:'antOMI',i:1,seed:4242,cmp:true,play:0};
  const top=el('div','card stack',`<div class="row" style="justify-content:space-between"><h2>Evolution: the same heart over time</h2><div class="row" id="evCtl"></div></div>
   <p style="max-width:90ch">Each scenario changes one thing (time since occlusion, potassium, drug level, temperature) and keeps the patient otherwise the same. Step through it and compare each tracing with the one before: the dashed beat is the prior tracing, the solid beat is now, and the table lists what changed. The explanation under each step names the cellular mechanism for that change.</p>
   <div class="row" id="evSteps" style="gap:6px"></div><div class="note" id="evNow"></div>`);H.appendChild(top);
  const sel=el('select');Object.keys(SCNCAT).forEach(c=>{const ids=SCNL.filter(k=>SCN[k].cat===c);if(!ids.length)return;const og=document.createElement('optgroup');og.label=SCNCAT[c];ids.forEach(k=>og.appendChild(new Option(SCN[k].name,k)));sel.appendChild(og)});sel.value=st.id;
  const lb=el('label','row lbl','Scenario');lb.style.cssText='gap:6px;text-transform:none;letter-spacing:0';lb.appendChild(sel);$('#evCtl',top).appendChild(lb);
  const pb=el('button','btn small','Play');pb.type='button';$('#evCtl',top).appendChild(pb);const nb=el('button','btn small','New patient');nb.type='button';$('#evCtl',top).appendChild(nb);
  const vh=el('div');H.appendChild(vh);const vw=Viewer(vh,{foot:'Teaching marks on. Drag to measure.'});
  const cmp=el('div','card stack',`<div class="row" style="justify-content:space-between"><h3>Compared with the prior tracing</h3><span class="lbl" id="evPair"></span></div><div class="two"><div class="vwrap"><div class="vscroll"><canvas></canvas></div></div><div id="evDiff"></div></div>`);H.appendChild(cmp);
  const why=el('div','card stack');H.appendChild(why);const bcv=$('canvas',cmp);const cache={};
  const rec=i=>{const k=st.id+'|'+i+'|'+st.seed;return cache[k]||(cache[k]=scnRec(st.id,i,st.seed))};
  function render(){const sc=SCN[st.id],steps=sc.steps;st.i=clamp(st.i,0,steps.length-1);
    $('#evSteps',top).innerHTML=steps.map((s,i)=>`<button class="chip" type="button" data-i="${i}" aria-pressed="${i===st.i}">${s.t}</button>`).join('');$$('#evSteps .chip',top).forEach(b=>b.addEventListener('click',()=>{st.i=+b.dataset.i;stop();render()}));
    const s=steps[st.i],R=rec(st.i),P_=st.i>0?rec(st.i-1):null;$('#evNow',top).innerHTML=`<b>${sc.name}.</b> ${sc.intro}${s.ev?`<br><b>Event before this tracing:</b> ${s.ev}`:''}`;
    vw.setRec(R);vw.setAnn(true);$('#evPair',cmp).textContent=P_?`${steps[st.i-1].t} → ${s.t}`:'first tracing';
    drawBeats(bcv,P_,R,sc.keys.length>=8?sc.keys:LEADS);$('#evDiff',cmp).innerHTML=P_?diffHtml(P_,R):'<p class="lbl" style="text-transform:none;letter-spacing:0">This is the first tracing of the scenario.</p>';
    why.innerHTML=`<div class="row" style="justify-content:space-between"><h3>${s.t}: what changed and why</h3>${s.dir&&s.dir!=='base'?`<span class="pill ${s.dir==='worse'?'isch':s.dir==='better'?'normal':''}">${{worse:'Worsening',better:'Improving',same:'Evolving'}[s.dir]}</span>`:''}</div><p style="margin:0;max-width:96ch"><b>${s.chg}</b> ${s.why}</p>${conChips(sc.con).replace('class="conwrap stack"','class="conwrap stack" data-from=""')}`}
  function stop(){clearInterval(st.play);st.play=0;pb.textContent='Play'}
  pb.addEventListener('click',()=>{if(st.play){stop();return}pb.textContent='Pause';st.play=setInterval(()=>{if(st.i>=SCN[st.id].steps.length-1){stop();return}st.i++;render()},3500)});
  sel.addEventListener('change',()=>{stop();st.id=sel.value;st.i=1;render()});nb.addEventListener('click',()=>{st.seed=Math.floor(Math.random()*1e9);render()});
  AX.evoOpen=(id,i)=>{if(SCN[id]){st.id=id;sel.value=id;st.i=i||1;render()}};
  render();AX.draws.evo=[()=>{vw.draw();const sc=SCN[st.id];drawBeats(bcv,st.i>0?rec(st.i-1):null,rec(st.i),sc.keys.length>=8?sc.keys:LEADS)}]}
function openEvo(id,i){setTab('atlas');setSub('evo');if(AX.evoOpen)AX.evoOpen(id,i)}

/* ============ trajectory questions ============ */
const TT={seq:'Sequence',next:'Predict the next tracing',diff:'What changed',dir:'Trajectory'};
function trajPool(){const cats=S&&S.cats?S.cats:null;let l=SCNL.filter(k=>!cats||cats[SCN[k].cat]!==0);if(S&&S.trajScn)l=l.filter(k=>S.trajScn.includes(k));return l.length?l:SCNL}
function newTrajQ(seed,type,force){const r=mkRand(seed+17),pool=force&&SCN[force]?[force]:trajPool();if(!type){const ts=['seq','next','diff','dir','dir','seq','next','diff'].filter(t=>t!=='seq'||pool.some(k=>SCN[k].steps.length>=4));type=r.pick(ts)}
  if(type==='dir'&&!force&&r.u()<.3){const[pid,name,why]=r.pick(STATIC),A=genAlt(pid,seed,seed+1),B=genAlt(pid,seed,seed+2);
    return{kind:'traj',tt:'dir',scn:null,pid,seed,panels:[{rec:A,lab:'Six months ago'},{rec:B,lab:'Today'}],opts:['Worsening','Improving','No meaningful change'],a:2,chosen:null,why:`<b>${name}.</b> ${why} A pattern that looks alarming but has not changed from a prior tracing is reassuring; one that changes over minutes to hours is the danger.`,keys:LEADS}}
  const id=r.pick(pool.filter(k=>type!=='seq'||SCN[k].steps.length>=4)),sc=SCN[id],n=sc.steps.length,mk=i=>scnRec(id,i,seed);
  if(type==='seq'){let idx=[...Array(n).keys()];if(n>4){const keep=new Set([0]);while(keep.size<4)keep.add(1+Math.floor(r.u()*(n-1)));idx=[...keep].sort((a,b)=>a-b)}
    const order=shuffle(idx,r);return{kind:'traj',tt:'seq',scn:id,seed,idx,order,panels:order.map(i=>({rec:mk(i),i})),pick:[],chosen:null,keys:sc.keys}}
  if(type==='next'){const k=1+Math.floor(r.u()*(n-2)),ctx=[Math.max(0,k-1),k].filter((v,i,a)=>a.indexOf(v)===i),ans=k+1;
    const cand=[k,ans+1<n?ans+1:null,k-1>=0?k-1:null].filter(x=>x!=null&&x!==ans),opts=[ans];for(const c of cand){if(!opts.includes(c))opts.push(c);if(opts.length===3)break}
    let other=null;const o2=pool.filter(x=>x!==id);if(o2.length){const oid=r.pick(o2),os=SCN[oid].steps;other={rec:scnRec(oid,1+Math.floor(r.u()*(os.length-1)),seed),from:oid}}
    const list=shuffle(opts.map(i=>({rec:mk(i),i})).concat(other?[{rec:other.rec,i:-1,from:other.from}]:[]),r);
    return{kind:'traj',tt:'next',scn:id,seed,ctx:ctx.map(i=>({rec:mk(i),i})),ans,ev:sc.steps[ans].ev,opts:list,a:list.findIndex(o=>o.i===ans),chosen:null,keys:sc.keys}}
  const ok=[...Array(n).keys()].filter(i=>i>0&&(type!=='dir'||['worse','better'].includes(sc.steps[i].dir)));const k=r.pick(ok.length?ok:[1]);
  if(type==='dir'){const d=sc.steps[k].dir;return{kind:'traj',tt:'dir',scn:id,seed,k,panels:[{rec:mk(k-1),lab:sc.steps[k-1].t},{rec:mk(k),lab:sc.steps[k].t}],opts:['Worsening','Improving','No meaningful change'],a:d==='worse'?0:d==='better'?1:2,chosen:null,keys:sc.keys}}
  const right=sc.steps[k].chg,dis=[];shuffle(SCNL.filter(x=>x!==id),r).forEach(x=>SCN[x].steps.forEach((s,i)=>{if(i>0&&s.chg!==right&&!/^Normal/.test(s.chg))dis.push(s.chg)}));
  const opts=shuffle([right,...shuffle(dis,r).slice(0,3)],r);
  return{kind:'traj',tt:'diff',scn:id,seed,k,panels:[{rec:mk(k-1),lab:sc.steps[k-1].t},{rec:mk(k),lab:sc.steps[k].t}],opts,a:opts.indexOf(right),chosen:null,keys:sc.keys}}
function trajOk(q){if(q.tt==='seq')return q.chosen&&q.chosen.join()===q.idx.join();return q.chosen===q.a}
function panelHtml(i,lab,sel){return`<div class="tpanel ${sel?'sel':''}" data-p="${i}"><div class="tphead"><span class="tpl">${String.fromCharCode(65+i)}</span><span class="lbl" style="text-transform:none;letter-spacing:0">${lab||''}</span><button class="btn small tpfull" type="button" data-full="${i}">Full 12-lead</button></div><div class="vscroll"><canvas></canvas></div></div>`}
function renderTraj(q,card,answered){const sc=q.scn?SCN[q.scn]:null;let h='';const head=t=>`<div class="row" style="justify-content:space-between"><h2 style="max-width:72ch">${t}</h2><span class="pill">${TT[q.tt]}</span></div>`;
  const all=[];let groups='';
  if(q.tt==='seq'){h+=head(`${sc.name}. Put these tracings in time order.`)+`<p class="lbl" style="text-transform:none;letter-spacing:0">Tap the tracings from earliest to latest. ${q.pick.length?`Your order: <b>${q.pick.map(i=>String.fromCharCode(65+i)).join(' → ')}</b>`:''}</p>`;
    q.panels.forEach((p,i)=>{all.push(p.rec);const pos=q.pick.indexOf(i);groups+=panelHtml(i,answered?`${sc.steps[p.i].t}`:(pos>=0?`#${pos+1}`:''),pos>=0&&!answered)});
    h+=`<div class="tpgrid">${groups}</div>`;if(!answered)h+=`<div class="row"><button class="btn small" id="tqReset" type="button">Clear order</button><button class="btn primary" id="tqCheck" type="button" ${q.pick.length===q.panels.length?'':'disabled'}>Check order</button></div>`}
  else if(q.tt==='next'){h+=head(`${sc.name}. Which tracing comes next?`);q.ctx.forEach(c=>{all.push(c.rec)});
    h+=`<div class="stack" style="gap:8px">${q.ctx.map((c,j)=>`<div class="tpanel ctx" data-c="${j}"><div class="tphead"><span class="lbl" style="text-transform:none;letter-spacing:0"><b>${sc.steps[c.i].t}</b>${sc.steps[c.i].ev?` · ${sc.steps[c.i].ev}`:''}</span></div><div class="vscroll"><canvas></canvas></div></div>`).join('')}</div>`;
    h+=`<div class="note"><b>Next:</b> ${q.ev?q.ev+' — ':''}${sc.steps[q.ans].t}</div>`;q.opts.forEach((o,i)=>{all.push(o.rec);groups+=panelHtml(i,answered?(o.i>=0?sc.steps[o.i].t:`From another scenario (${SCN[o.from].name})`):'',q.chosen===i)});h+=`<div class="tpgrid">${groups}</div>`}
  else{const t=q.tt==='dir'?(sc?`${sc.name}. Compared with the earlier tracing, is this patient`:'Same patient, two dates. Compared with the earlier tracing, is this'):`${sc.name}. What changed between these tracings?`;h+=head(t+(q.tt==='dir'?' getting worse, better, or unchanged?':''));
    q.panels.forEach((p,i)=>{all.push(p.rec);groups+=panelHtml(i,p.lab,false)});h+=`<div class="stack" style="gap:8px">${groups}</div>`;
    if(!answered)h+=`<div class="qgrid ${q.tt==='diff'?'long':''}">${q.opts.map((o,i)=>`<button class="opt" data-mi="${i}"><kbd>${i+1}</kbd><span>${o}</span></button>`).join('')}</div>`}
  if(answered){const ok=trajOk(q);h=`<div class="verdict ${ok?'ok':'no'}">${ok?'Correct':'Not quite'}</div>`+h;
    if(q.tt==='seq')h+=`<div class="note"><b>Correct order:</b> ${q.idx.map(i=>`${String.fromCharCode(65+q.order.indexOf(i))} (${sc.steps[i].t})`).join(' → ')}</div><ol class="f">${q.idx.map(i=>`<li><b>${sc.steps[i].t}.</b> ${sc.steps[i].chg} ${i>0?sc.steps[i].why:''}</li>`).join('')}</ol>`;
    else if(q.tt==='next'){const s=sc.steps[q.ans];h+=`<div class="note"><b>${String.fromCharCode(65+q.a)} comes next: ${s.chg}</b> ${s.why}</div>`}
    else{h+=`<div class="qgrid ${q.tt==='diff'?'long':''}">${q.opts.map((o,i)=>`<div class="opt ${i===q.a?'ok':i===q.chosen?'no':''}" style="opacity:${i===q.a||i===q.chosen?1:.55}"><span>${o}</span></div>`).join('')}</div>`;
      if(q.why)h+=`<div class="note">${q.why}</div>`;else{const s=sc.steps[q.k];h+=`<div class="note"><b>${s.chg}</b> ${s.why}</div>`}
      h+=`<details open><summary>Measured change</summary>${diffHtml(q.panels[0].rec,q.panels[1].rec)}</details>`}
    if(sc)h+=conChips(sc.con).replace('class="conwrap stack"','class="conwrap stack" data-from=""');
    h+=`<div class="row"><button class="btn primary" id="qNext">Next (N)</button>${sc?'<button class="btn" id="qEvo">Open in Evolution</button>':''}</div>`}
  card.innerHTML=h;
  const cvs=$$('.tpanel canvas',card),recs=q.tt==='next'?[...q.ctx.map(c=>c.rec),...q.opts.map(o=>o.rec)]:(q.tt==='seq'?q.panels.map(p=>p.rec):q.panels.map(p=>p.rec));
  const drawAll=()=>cvs.forEach((c,i)=>drawCells(c,recs[i],q.keys));requestAnimationFrame(drawAll);q._draw=drawAll;
  $$('[data-full]',card).forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const i=+b.dataset.full,src=q.tt==='next'?q.opts[i].rec:q.panels[i].rec;$('#qViewer').hidden=false;qViewer.setRec(src);qViewer.setAnn(false);$('#qViewer').scrollIntoView({behavior:'smooth',block:'start'})}));
  if(!answered){if(q.tt==='seq'){$$('.tpanel[data-p]',card).forEach(p=>p.addEventListener('click',()=>{const i=+p.dataset.p;if(q.pick.includes(i))return;q.pick.push(i);renderCard()}));
      const rs=$('#tqReset',card);if(rs)rs.addEventListener('click',()=>{q.pick=[];renderCard()});const ck=$('#tqCheck',card);if(ck)ck.addEventListener('click',()=>choose(q.pick.map(i=>q.order[i])))}
    else if(q.tt==='next')$$('.tpanel[data-p]',card).forEach(p=>p.addEventListener('click',()=>choose(+p.dataset.p)));
    else $$('.opt[data-mi]',card).forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.mi)))}
  const nb=$('#qNext',card);if(nb)nb.addEventListener('click',next);const eb=$('#qEvo',card);if(eb)eb.addEventListener('click',()=>openEvo(q.scn,q.k||1))}
