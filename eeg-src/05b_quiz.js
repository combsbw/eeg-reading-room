/* ============ question types ============ */
const MT={pdr:'Posterior rhythm',rate:'Discharge frequency',desc:'ACNS descriptor',loc:'Field maximum',click:'Find the event',bg:'Background read'};
const DESCP=['lpd','gpd','firda','triphasic','cjd','sw3','lgs','tirda','eswas','ncse','lrda','grda','bipd','lpdplus','lpdevol','gsw','sirpids','edb','supp_pd'];
const LOCP=['temporal_spikes','focal_slow','seizure','pop','lpd','breach','pulse','drip','cts','tirda','lrda','lpdplus','lpdevol','birds','asym','neosz'];
const CLKD=['temporal_spikes','lpd','gpd','triphasic','cjd','pop','lambda','drip','cts','gsw','sirpids','supp_pd','lpdplus','bs_ident'],CLKO=['seizure','sw3','gtc','lpdevol','neosz','birds','jme'];
const PDRP=['awake','child','enc_mild','gen_slow'];
const lc=t=>/^[A-Z][A-Z0-9]/.test(t)?t:t.charAt(0).toLowerCase()+t.slice(1);
const firstS=t=>{const m=t.match(/^.*?[.!?](\s|$)/);return m?m[0].trim():t};
const can={desc:p=>DESCP.includes(p),loc:p=>LOCP.includes(p),click:p=>CLKD.includes(p)||CLKO.includes(p),bg:p=>BGREAD.includes(p),meas:p=>PDRP.includes(p)||DESCP.includes(p)};
/* ---- concept chips ---- */
function conChips(ids,from){const l=(ids||[]).filter(c=>CON[c]);if(!l.length)return'';return`<div class="conwrap stack" style="gap:8px" data-from="${from||''}"><div class="row" style="gap:6px">${l.map(c=>`<button class="chip con" type="button" data-con="${c}" aria-pressed="false"><span class="dot d-${CON[c].d}"></span>${CON[c].n}</button>`).join('')}</div><div class="conbox" hidden></div></div>`}
const LABN={field:'dipoles & fields',thal:'thalamus & rhythms',syn:'synapses & drugs',cbf:'blood flow',map:'regions & semiology'};
function conPanel(c,from){const k=CON[c],mates=CIDX[c].filter(x=>x!==from);return`<div class="note stack" style="gap:8px"><div><span class="lbl">${DOM[k.d]}</span><div style="margin-top:2px"><b>${k.n}.</b> ${k.s}</div></div>${mates.length?`<div><span class="lbl">Same mechanism, different tracing</span><div class="row" style="gap:6px;margin-top:4px">${mates.map(x=>`<button class="chip" type="button" data-pat="${x}">${PM[x].name}</button>`).join('')}</div></div>`:''}${k.lab?`<div><button class="btn small" type="button" data-lab="${k.lab}">See it in the ${LABN[k.lab]} lab</button></div>`:''}</div>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-con]');if(b){const w=b.closest('.conwrap'),box=w&&$('.conbox',w);if(!box)return;const on=b.getAttribute('aria-pressed')!=='true';$$('[data-con]',w).forEach(x=>x.setAttribute('aria-pressed','false'));if(on){b.setAttribute('aria-pressed','true');box.innerHTML=conPanel(b.dataset.con,w.dataset.from||'');box.hidden=false}else box.hidden=true;return}
  const pb=e.target.closest('[data-pat]');if(pb&&PM[pb.dataset.pat]&&!pb.closest('.lmodal')){openAtlas(pb.dataset.pat);return}const lb=e.target.closest('[data-lab]');if(lb&&typeof openLab==='function'){openLab(lb.dataset.lab)}});
/* ---- mechanism and integration ---- */
function makeMech(R,r,type){const p=PM[R.pid],cs=p.con.filter(c=>CON[c]);if(!cs.length)return null;const linkable=cs.filter(c=>CIDX[c].length>1);
  type=type||(linkable.length&&r.u()<.45?'link':'why');if(type==='link'&&!linkable.length)type='why';const hide=S.diff==='hard';
  if(type==='why'){const c=cs[0],avoid=new Set(cs),cand=[];(p.sim||[]).forEach(x=>{const q=PM[x];if(q&&q.con[0])cand.push(q.con[0])});
    shuffle(Object.keys(CON).filter(k=>CON[k].d===CON[c].d),r).forEach(k=>cand.push(k));shuffle(Object.keys(CON),r).forEach(k=>cand.push(k));
    const d=[];for(const k of cand){if(!avoid.has(k)&&!d.includes(k))d.push(k);if(d.length===3)break}const ids=shuffle([c,...d],r);
    return{type:'why',c,ids,q:hide?'Which mechanism best explains this tracing?':`Tracing: ${p.name}. Which mechanism best explains what you see (${lc(p.feats[0])})?`,opts:ids.map(k=>CON[k].s),short:ids.map(k=>CON[k].n),a:ids.indexOf(c),
      why:p.mech,extra:d.map(k=>{const ex=CIDX[k].filter(x=>x!==p.id);return`<li><b>${CON[k].n}</b>${ex.length?` drives ${ex.slice(0,2).map(x=>lc(PM[x].name)).join(' and ')}`:''}.</li>`}).join('')}}
  const c=linkable[Math.floor(r.u()*linkable.length)],mates=CIDX[c].filter(x=>x!==p.id),other=mates.filter(x=>PM[x].cat!==p.cat),pl=other.length?other:mates,ans=pl[Math.floor(r.u()*pl.length)];
  const not=x=>x!==p.id&&!PM[x].con.includes(c),d=[...new Set([...shuffle((p.sim||[]).filter(not),r),...shuffle(P.map(x=>x.id).filter(not),r)])].slice(0,3),ids=shuffle([ans,...d],r);
  return{type:'link',c,ids,q:`${hide?'':`Tracing: ${p.name}. `}Which of these runs on the same core mechanism, <i>${lc(CON[c].n)}</i>?`,opts:ids.map(x=>PM[x].name),short:ids.map(x=>PM[x].name),a:ids.indexOf(ans),
    why:`<b>${PM[ans].name}.</b> ${PM[ans].mech}`,extra:`<li><b>Shared mechanism: ${CON[c].n}.</b> ${CON[c].s}</li>`+d.map(x=>{const k=PM[x].con[0];return`<li><b>${PM[x].name}</b>${k&&CON[k]?` runs mainly on ${lc(CON[k].n)}`:''}${(p.sim||[]).includes(x)?' (a look-alike with a different mechanism)':''}.</li>`}).join('')}}
/* ---- measurement ---- */
const FB=['0.5','1','1.5','2','2.5','3','3.5','4','>4'];
function makeMeas(R,r){const M=R.meta,opts=[];let type,q,a,why;
  if(R.acns&&(r.u()<.7||M.pdr==null)){type='rate';const fb=R.acns.fb,i=FB.indexOf(fb),pool=FB.filter(x=>Math.abs(FB.indexOf(x)-i)>=1&&Math.abs(FB.indexOf(x)-i)<=3);const o=[fb,...shuffle(pool,r).slice(0,3)].sort((x,y)=>FB.indexOf(x)-FB.indexOf(y));
    q=R.acns.m2==='RDA'?'What is the frequency of the rhythmic delta?':'How many discharges per second (typical rate)?';a=o.indexOf(fb);opts.push(...o.map(x=>x==='>4'?'More than 4 /s':x+' /s'));
    why=`Measured rate about ${R.acns.f.toFixed(2)} /s, reported to the nearest 0.5 (ACNS). Drag the calipers across several complexes and divide their number by the time: n ÷ Δt is more accurate than one interval.`}
  else{type='pdr';const f=M.pdr,b=f<4?0:f<6?1:f<8?2:f<10?3:4,L=['Under 4 Hz','4 to under 6 Hz','6 to under 8 Hz','8 to under 10 Hz','10 Hz or faster'];q='What is the frequency of the posterior dominant rhythm (eyes closed)?';opts.push(...L);a=b;
    why=`Posterior rhythm about ${f} Hz. Count the waves in one second over O1/O2 (or measure several cycles). An adult rhythm under 8 Hz is slow; in children judge against age (about 8 Hz by 3 years).`}
  return{type,q,opts,a,why}}
/* ---- ACNS descriptor builder ---- */
const DROWS=[['m1','Main term 1',[['G','G: generalized'],['L','L: lateralized'],['BI','BI: bilateral independent'],['UI','UI: unilateral independent'],['Mf','Mf: multifocal']]],
 ['m2','Main term 2',[['PD','PDs: periodic discharges'],['RDA','RDA: rhythmic delta'],['SW','SW: spike-and-wave']]],
 ['fb','Frequency',FB.map(x=>[x,x==='>4'?'> 4 /s':x+' /s'])],
 ['plus','Plus modifier',[['none','None'],['+F','+F fast'],['+R','+R rhythmic'],['+S','+S sharp']]],
 ['si','Stimulus-induced',[['no','No'],['SI','Yes (SI- prefix)']]],
 ['evo','Evolution',[['static','Static'],['fluctuating','Fluctuating'],['evolving','Evolving']]]];
const DWHY={m1:'Main term 1 is the distribution: G when bilateral and synchronous, L when one side or clearly more on one side, BI when each side fires independently.',m2:'Main term 2: PDs are discharges with a quiet interval between them; RDA is wave after wave without an interval; SW is a spike followed by a slow wave, repeating.',
 fb:'Report the typical rate to the nearest 0.5 per second. Above 2.5 /s for 10 s or more, PDs or SW meet seizure criteria.',plus:'+F superimposed fast activity, +R superimposed rhythmic activity (PDs only), +S superimposed sharp waves (RDA only). Plus features raise the association with seizures.',
 si:'SI- is used when the pattern is consistently brought on by alerting stimuli (SIRPIDs).',evo:'Evolving: unequivocal change in frequency, morphology or location; fluctuating: changes without a clear evolution; static: no change.'};
function descTruth(R){const A=R.acns;return{m1:A.m1,m2:A.m2,fb:A.fb,plus:A.plus||'none',si:A.si?'SI':'no',evo:A.evo||'static'}}
function descTerm(t){return`${t.si==='SI'?'SI-':''}${t.m1}${t.m2==='PD'?'PDs':t.m2}${t.plus!=='none'?t.plus:''} · ${t.fb==='>4'?'> 4':t.fb} /s${t.evo!=='static'?' · '+t.evo:''}`}
function descQ(pid,seed){seed=seed??Math.floor(Math.random()*1e9);const rec=generate(pid,seed);if(!rec.acns)return null;return{kind:'desc',pid,seed,rec,sel:{},chosen:null,truth:descTruth(rec)}}
function descScore(q){const t=q.truth,s=q.sel,ok={};DROWS.forEach(([k])=>{ok[k]=k==='fb'?(s.fb&&Math.abs(FB.indexOf(s.fb)-FB.indexOf(t.fb))<=1):s[k]===t[k]});return ok}
const descOk=q=>{const o=descScore(q);return Object.values(o).every(Boolean)};
/* ---- background read ---- */
const BROWS=[['pdr','Posterior rhythm',[['8','8 Hz or faster'],['4','4 to under 8 Hz'],['none','None identifiable']]],
 ['cont','Continuity',[['cont','Continuous'],['discont','Discontinuous (10–49% flat)'],['bs','Burst-suppression (50–99%)'],['supp','Suppressed (> 99%)']]],
 ['volt','Voltage',[['normal','Normal'],['low','Low (< 20 µV)'],['supp','Suppressed (< 10 µV)']]],
 ['sym','Symmetry',[['sym','Symmetric'],['mild','Mild asymmetry'],['marked','Marked asymmetry']]],
 ['react','Reactivity',[['yes','Reactive'],['no','Unreactive'],['SIRPIDs only','SIRPIDs only'],['nt','Not tested on this page']]]];
function bgTruth(R){const M=R.meta,t={};t.pdr=M.pdr==null?'none':M.pdr>=8?'8':M.pdr>=4?'4':'none';t.cont=M.cont||'cont';t.volt=M.volt||'normal';t.sym=M.sym||'sym';t.react=R.stim!=null||R.pid==='reactivity'?(M.react||'yes'):'nt';return t}
function bgQ(pid,seed){seed=seed??Math.floor(Math.random()*1e9);const r=mkRand(seed+11),rec=generate(pid,seed),p=PM[pid];const d=[...(p.sim||[]),...shuffle(BGREAD,r)].filter(x=>x!==pid&&PM[x]);const opts=shuffle([pid,...[...new Set(d)].slice(0,3)],r);
  return{kind:'bg',pid,seed,rec,sel:{},chosen:null,truth:bgTruth(rec),opts}}
function bgScore(q){const o={};BROWS.forEach(([k])=>o[k]=q.sel[k]===q.truth[k]);o.dx=q.sel.dx===q.pid;return o}
const bgOk=q=>{const o=bgScore(q),v=Object.values(o);return o.dx&&v.filter(Boolean).length/v.length>=.8};
/* ---- localization on the head map ---- */
function headSvg(o={}){const X=x=>50+41*x,Y=y=>52-41*y;const w=o.w||null,mx=w?Math.max(...w.map(Math.abs)):1;
  return`<svg viewBox="0 0 100 104" class="head" role="group" aria-label="Electrode map"><circle cx="50" cy="52" r="45" fill="var(--panel)" stroke="var(--line)" stroke-width="1.2"/><path d="M45 7.5 L50 1.5 L55 7.5" fill="none" stroke="var(--line)" stroke-width="1.2"/><path d="M5 45 q-3 7 0 14 M95 45 q3 7 0 14" fill="none" stroke="var(--line)" stroke-width="1.2"/>
  ${EL.map(([n,x,y],i)=>{const v=w?Math.abs(w[i])/mx:0,cls=['el',o.sel===n?'sel':'',o.ans===n?'ans':'',o.wrong===n?'wrong':''].join(' ');return`<g class="${cls}" data-el="${n}" ${o.click?'tabindex="0" role="button"':''} aria-label="${n}"><circle cx="${X(x)}" cy="${Y(y)}" r="6.2" style="${w?`fill:color-mix(in srgb,var(${w[i]>=0?'--mark':'--accent'}) ${Math.round(v*85)}%,var(--panel))`:''}"/><text x="${X(x)}" y="${Y(y)+1.9}" text-anchor="middle">${n}</text></g>`}).join('')}</svg>`}
function locQ(pid,seed){seed=seed??Math.floor(Math.random()*1e9);const rec=generate(pid,seed);if(!rec.fw)return null;return{kind:'loc',pid,seed,rec,chosen:null}}
const locOk=q=>{if(!q.chosen||q.chosen==='__timeout__')return false;const w=q.rec.fw,m=Math.max(...w.map(Math.abs));return Math.abs(w[IX[q.chosen]])>=.72*m};
/* ---- find the event on the tracing ---- */
function clickQ(pid,seed){seed=seed??Math.floor(Math.random()*1e9);const rec=generate(pid,seed);if(!rec.ev||!rec.ev.length)return null;const onset=CLKO.includes(pid)||rec.evk==='onset';return{kind:'click',pid,seed,rec,onset,chosen:null}}
const clickOk=q=>{if(typeof q.chosen!=='number'||q.chosen<0)return false;const tol=q.onset?.7:q.pid==='bs_ident'?.35:.14;return q.rec.ev.some(t=>Math.abs(q.chosen-t-(q.onset?0:0))<=tol||(q.pid==='bs_ident'&&q.chosen>=t&&q.chosen<=t+1.2))};
/* ---- application ---- */
function caseQ(pid,seed){seed=seed??Math.floor(Math.random()*1e9);const r=mkRand(seed+29),rec=generate(pid,seed),p=PM[pid];
  if(p.q2){const ids=shuffle(p.q2.opts.map((o,i)=>i),r);return{kind:'case',pid,seed,rec,m:{type:'case',q:p.q2.q,opts:ids.map(i=>p.q2.opts[i]),short:ids.map(i=>p.q2.opts[i]),a:ids.indexOf(p.q2.a),why:p.q2.why},chosen:null}}
  const right=firstS(p.sig),pool=[...(p.sim||[]),...shuffle(P.map(x=>x.id),r)].filter(x=>x!==pid&&PM[x]&&firstS(PM[x].sig)!==right),d=[];for(const x of pool){const t=firstS(PM[x].sig);if(!d.includes(t))d.push(t);if(d.length===3)break}
  const opts=shuffle([right,...d],r);return{kind:'case',pid,seed,rec,m:{type:'sig',q:'Which statement best describes what this tracing means for the patient?',opts,short:opts,a:opts.indexOf(right),why:`<b>${p.name}.</b> ${p.sig}`},chosen:null}}
function mechQ(pid,type,seed){seed=seed??Math.floor(Math.random()*1e9);const r=mkRand(seed+3),rec=generate(pid,seed),m=makeMech(rec,r,type);return m?{kind:'mech',pid,seed,rec,m,chosen:null}:null}
function anaQ(pid,seed){const r=mkRand((seed??Math.floor(Math.random()*1e9))+5),ks=[];if(can.desc(pid))ks.push('desc','desc');if(can.loc(pid))ks.push('loc','loc');if(can.click(pid))ks.push('click');if(can.bg(pid))ks.push('bg','bg');if(can.meas(pid))ks.push('meas');
  for(const k of shuffle(ks,r)){const q=k==='desc'?descQ(pid,seed):k==='loc'?locQ(pid,seed):k==='click'?clickQ(pid,seed):k==='bg'?bgQ(pid,seed):newQ(pid,'meas',seed);if(q&&q.kind===k)return q}return null}

/* ============ quiz engine ============ */
const S={mode:'practice',qt:'dx',diff:'standard',cats:Object.fromEntries(Object.keys(CAT).map(k=>[k,1])),drill:null,q:null,exam:null,streak:0,seen:[]};
const qViewer=Viewer($('#qViewer')),aViewer=Viewer($('#aViewer'));
const catOf=id=>CAT[PM[id].cat];
function pool(){let l=P.filter(p=>S.cats[p.cat]);if(S.drill)l=l.filter(p=>S.drill.includes(p.id));return l.length?l:P}
function pickPattern(f){const st=patStats(),base=pool().filter(p=>!f||f(p.id)),pl=base.filter(p=>!S.seen.slice(-4).includes(p.id)),l=pl.length?pl:base.length?base:pool();
  const w=l.map(p=>{const s=st[p.id];return s.n===0?2.2:1+2*(1-s.ok/s.n)});let t=w.reduce((a,b)=>a+b,0)*Math.random();for(let i=0;i<l.length;i++){t-=w[i];if(t<=0)return l[i].id}return l[0].id}
function options(pid,r){const p=PM[pid],all=P.map(x=>x.id).filter(x=>x!==pid),sameCat=all.filter(x=>PM[x].cat===p.cat),other=all.filter(x=>PM[x].cat!==p.cat),sim=p.sim||[];let d;
  if(S.diff==='hard')d=[...shuffle(sim,r),...shuffle(sameCat,r),...shuffle(other,r)];
  else if(S.diff==='easy'){d=[...shuffle(other,r),...shuffle(sameCat,r)];d=d.filter(x=>!sim.includes(x)).concat(d.filter(x=>sim.includes(x)))}
  else d=[...shuffle(sim.slice(0,2),r),...shuffle(sameCat,r),...shuffle(other,r)];
  d=[...new Set(d)].slice(0,3);return shuffle([pid,...d],r)}
function newQ(pid,kind,seed){seed=seed??Math.floor(Math.random()*1e9);
  if(kind==='traj'&&typeof newTrajQ==='function')return newTrajQ(seed);
  if(kind==='ana'){const q=anaQ(pid,seed);if(q)return q;kind='dx'}
  if(kind==='desc'){const q=descQ(pid,seed);if(q)return q;kind='dx'}if(kind==='loc'){const q=locQ(pid,seed);if(q)return q;kind='dx'}if(kind==='click'){const q=clickQ(pid,seed);if(q)return q;kind='dx'}if(kind==='bg'&&can.bg(pid))return bgQ(pid,seed);if(kind==='case')return caseQ(pid,seed);
  const r=mkRand(seed+3),rec=generate(pid,seed);
  if(kind==='meas'&&(rec.acns||rec.meta.pdr!=null))return{kind,pid,seed,rec,m:makeMeas(rec,r),chosen:null};
  if(kind==='mech'){const m=makeMech(rec,r);if(m)return{kind,pid,seed,rec,m,chosen:null}}
  return{kind:'dx',pid,seed,rec,opts:options(pid,r),chosen:null,hint:0,loc:null,q2c:null}}
const KF={desc:can.desc,loc:can.loc,click:can.click,bg:can.bg,meas:can.meas};
const kindNow=()=>{if(S.qt!=='mix')return S.qt;const x=Math.random();return x<.32?'dx':x<.47?'mech':x<.6?'ana':x<.72?'case':x<.86?'traj':'desc'};
function nextPid(kind){return pickPattern(KF[kind]||(kind==='ana'?(id=>Object.values(can).some(f=>f(id))):null))}
function setStage(){$('#qIntro').hidden=!!S.q||!!S.exam&&S.exam.done;$('#qStage').hidden=!S.q&&!(S.exam&&S.exam.done)}
function showQ(q){S.q=q;S.seen.push(q.pid);setStage();const noV=q.kind==='traj'||q.kind==='trend';$('#qViewer').hidden=noV;if(!noV){qViewer.pick=null;qViewer.setRec(q.rec);qViewer.setAnn(false)}$('#qAnn').checked=false;$('#qAnn').disabled=false;renderCard()}
const isOk=q=>q.kind==='traj'||q.kind==='trend'?trajOk(q):q.kind==='desc'?descOk(q):q.kind==='bg'?bgOk(q):q.kind==='loc'?locOk(q):q.kind==='click'?clickOk(q):q.kind==='dx'?q.chosen===q.pid:q.chosen===q.m.a;
function recordAnswer(q,mode){const ok=isOk(q),ts=Date.now();
  if(q.kind==='dx')DB.answers.push({pid:q.pid,ch:q.chosen,ok,h:q.hint>0?1:0,m:mode,ts});else if(q.kind==='mech')DB.mech.push({pid:q.pid,t:q.m.type,c:q.m.c,ok,ts});else if(q.kind==='case')DB.q2.push({pid:q.pid,ok,ts,c:1});
  else if(q.kind==='desc')DB.desc.push({pid:q.pid,ok,ts});else if(q.kind==='bg')DB.bgr.push({pid:q.pid,ok,ts});else if(q.kind==='loc'||q.kind==='click')DB.locs.push({pid:q.pid,ok,t:q.kind,ts});
  else if(q.kind==='traj'||q.kind==='trend')DB.traj.push({scn:q.scn||q.pid,tt:q.tt,ok,ts});else DB.meas.push({pid:q.pid,t:q.m.type,ok,ts});
  if(mode==='practice'){S.streak=ok?S.streak+1:0;DB.best=Math.max(DB.best||0,S.streak)}store.save(DB);LRN.record(q,ok);return ok}
function startQuiz(){S.streak=0;S.seen=[];if(S.mode==='exam'){const r=mkRand(Date.now()),qs=[];for(let i=0;i<15;i++){const k=kindNow();qs.push(newQ(nextPid(k),k));S.seen.push(qs[i].pid)}S.exam={qs,i:0,done:false};showQ(qs[0])}
  else{S.exam=null;const k=kindNow();showQ(newQ(nextPid(k),k))}$('#qStart').textContent='Restart'}
const yesno=ok=>ok?'<b style="color:var(--good)">Correct.</b>':'<b style="color:var(--bad)">Not quite.</b>';
function verdict(q,ok,label,tag){return`<div class="verdict ${ok?'ok':'no'}">${ok?'Correct':q.chosen==='__timeout__'||q.chosen===-1?'Time ran out':'Not quite'}<span style="color:var(--ink);font-weight:500"> · ${label}</span>${tag?`<span class="pill">${tag}</span>`:''}</div>`}
const nextRow=q=>`<div class="row"><button class="btn primary" id="qNext">Next (N)</button>${q.pid&&PM[q.pid]?'<button class="btn" id="qAtlas">Open in Atlas</button>':''}</div>`;
const whyBlock=p=>p.mech?`<div class="stack" style="gap:8px"><h3>Why it looks this way</h3><p style="margin:0">${p.mech}</p>${conChips(p.con,p.id)}</div>`:'';
function metaTable(R){const M=R.meta||{},rows=[];if(M.age)rows.push(['Age',M.age]);if(M.state)rows.push(['State',M.state]);if(M.pdr!=null)rows.push(['Posterior rhythm',M.pdr+' Hz']);if(M.drug)rows.push(['Medication',M.drug]);if(M.temp)rows.push(['Temperature',M.temp+' °C']);if(M.photic)rows.push(['Photic',M.photic+' Hz']);if(M.hist)rows.push(['History',M.hist]);
  if(R.acns)rows.push(['ACNS term',descTerm(descTruth(R))]);if(R.loc)rows.push(['Distribution',R.loc]);if(R.mx)rows.push(['Field maximum',R.mx]);if(!rows.length)return'';return`<table class="mt"><tbody>${rows.map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</tbody></table>`}
function renderCard(){const q=S.q,card=$('#qCard'),p=PM[q.pid],ex=!!S.exam&&!S.exam.done,answered=q.chosen!==null&&!ex;
  $('#qCount').textContent=ex?`Question ${S.exam.i+1} of ${S.exam.qs.length}`:`Practice · streak ${S.streak}`;$('#qProgWrap').hidden=!ex;if(ex)$('#qProg').style.width=(S.exam.i/S.exam.qs.length*100)+'%';$('#qAnn').disabled=ex||(q.kind==='click'&&!answered);
  if(q.kind==='traj'||q.kind==='trend'){renderTraj(q,card,answered);LRN.afterRender(q,answered);return}
  let h='';const ctx=(q.rec&&q.rec.meta)||{},ctxs=[ctx.age,ctx.state&&ctx.state!=='awake'?ctx.state:null,ctx.drug?'on '+ctx.drug:null,ctx.temp?ctx.temp+' °C':null,ctx.hist].filter(Boolean),ctxH=ctxs.length?`<p class="lbl" style="text-transform:none;letter-spacing:0">Context: ${ctxs.join(' · ')}</p>`:'';
  if(q.kind==='mech'||q.kind==='case'||q.kind==='meas'){const m=q.m,tag=q.kind==='case'?'Apply':q.kind==='meas'?MT[m.type]:m.type==='why'?'Mechanism':'Integration',long=q.kind!=='meas'&&(q.kind==='case'||m.type==='why');
    if(!answered){h+=`<div class="row" style="justify-content:space-between"><h2 style="max-width:72ch">${m.q}</h2><span class="pill">${tag}</span></div>${q.kind==='meas'?'<p class="lbl" style="text-transform:none;letter-spacing:0">Drag across the tracing to measure Δt; n cycles ÷ Δt gives the frequency.</p>':q.kind==='case'?'<p class="lbl" style="text-transform:none;letter-spacing:0">Read the tracing first: the answer depends on what it shows.</p>':''}${ctxH}<div class="qgrid ${long?'long':''}">${m.opts.map((o,i)=>`<button class="opt" data-mi="${i}"><kbd>${i+1}</kbd><span>${o}</span></button>`).join('')}</div>`}
    else{const ok=isOk(q);h+=verdict(q,ok,m.short?m.short[m.a]:m.opts[m.a],tag)+`<div class="qgrid ${long?'long':''}">${m.opts.map((o,i)=>`<div class="opt ${i===m.a?'ok':i===q.chosen?'no':''}" style="opacity:${i===m.a||i===q.chosen?1:.55}"><span>${o}</span></div>`).join('')}</div>`;
      if(q.kind==='mech')h+=`<div class="two"><div><h3>${m.type==='why'?'Why it looks this way':'The connection'}</h3><p style="margin-top:6px">${m.why}</p></div><div><h3>${m.type==='why'?'Where the other mechanisms show up':'How the options differ'}</h3><ul class="f">${m.extra}</ul></div></div>${conChips(p.con,p.id)}`;
      else h+=`<div class="note">${m.why}</div>${q.kind==='case'?whyBlock(p):metaTable(q.rec)}`;
      h+=`<p class="lbl" style="text-transform:none;letter-spacing:0">The tracing shows: <b>${p.name}</b>.</p>`+nextRow(q)}}
  else if(q.kind==='desc'){const t=q.truth;
    if(!answered){h+=`<div class="row" style="justify-content:space-between"><h2>Describe it in ACNS terms</h2><span class="pill">${MT.desc}</span></div><p class="lbl" style="text-transform:none;letter-spacing:0">American Clinical Neurophysiology Society 2021 critical care terminology: main term 1 (where) + main term 2 (what) + modifiers. Measure the rate with the calipers.</p>${ctxH}
      <div class="rform">${DROWS.map(([k,lab,os])=>`<div class="rrow"><span class="lbl">${lab}</span><div class="seg ${k==='fb'?'wrapseg':''}" data-dk="${k}">${os.map(([v,t])=>`<button type="button" data-v="${v}" aria-pressed="${q.sel[k]===v}">${t}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="row"><button class="btn primary" id="dsCheck" ${DROWS.every(([k])=>q.sel[k])?'':'disabled'}>Check description</button><span class="lbl" id="dsTerm" style="text-transform:none;letter-spacing:0">${DROWS.every(([k])=>q.sel[k])?'Your term: <b>'+descTerm(q.sel)+'</b>':'Choose one option in every row'}</span></div>`}
    else{const ok=descOk(q),sc=descScore(q);h+=verdict(q,ok,descTerm(t),MT.desc)+`<div class="rform">${DROWS.map(([k,lab,os])=>`<div class="rrow"><span class="lbl">${lab}</span><div class="seg ${k==='fb'?'wrapseg':''}">${os.map(([v,tx])=>`<button type="button" disabled class="${v===t[k]?'rk-ok':v===q.sel[k]?'rk-no':''}">${tx}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="note stack" style="gap:6px"><div>Correct term: <b>${descTerm(t)}</b> (${p.name}).${t.fb!==q.sel.fb&&sc.fb?' Your frequency was within 0.5 /s, which counts.':''}</div>${DROWS.filter(([k])=>!sc[k]).map(([k,lab])=>`<div><b>${lab}.</b> ${DWHY[k]}</div>`).join('')}</div>${whyBlock(p)}`+nextRow(q)}}
  else if(q.kind==='bg'){const t=q.truth;
    if(!answered){h+=`<div class="row" style="justify-content:space-between"><h2>Read the background</h2><span class="pill">${MT.bg}</span></div><p class="lbl" style="text-transform:none;letter-spacing:0">The core of every ICU and post-arrest report. Check the sensitivity before judging voltage; look for a stimulus marker before judging reactivity.</p>${ctxH}
      <div class="rform">${BROWS.map(([k,lab,os])=>`<div class="rrow"><span class="lbl">${lab}</span><div class="seg" data-bk="${k}">${os.map(([v,tx])=>`<button type="button" data-v="${v}" aria-pressed="${q.sel[k]===v}">${tx}</button>`).join('')}</div></div>`).join('')}
      <div class="rrow"><span class="lbl">Main finding</span><div class="seg rdx" data-bk="dx">${q.opts.map(id=>`<button type="button" data-v="${id}" aria-pressed="${q.sel.dx===id}">${PM[id].name}</button>`).join('')}</div></div></div>
      <div class="row"><button class="btn primary" id="bgCheck" ${BROWS.every(([k])=>q.sel[k])&&q.sel.dx?'':'disabled'}>Check read</button></div>`}
    else{const ok=bgOk(q),sc=bgScore(q),n=Object.values(sc).filter(Boolean).length;h+=verdict(q,ok,`${Math.round(n/6*100)}% of fields · ${p.name}`,MT.bg)+`<div class="rform">${BROWS.map(([k,lab,os])=>`<div class="rrow"><span class="lbl">${lab}</span><div class="seg">${os.map(([v,tx])=>`<button type="button" disabled class="${v===t[k]?'rk-ok':v===q.sel[k]?'rk-no':''}">${tx}</button>`).join('')}</div></div>`).join('')}
      <div class="rrow"><span class="lbl">Main finding</span><div class="seg rdx">${q.opts.map(id=>`<button type="button" disabled class="${id===q.pid?'rk-ok':id===q.sel.dx?'rk-no':''}">${PM[id].name}</button>`).join('')}</div></div></div>
      <div class="note">${p.sig}</div>${whyBlock(p)}`+nextRow(q)}}
  else if(q.kind==='loc'){const ok=answered&&locOk(q);
    if(!answered)h+=`<div class="row" style="justify-content:space-between"><h2>Where is the field maximum?</h2><span class="pill">${MT.loc}</span></div><p class="lbl" style="text-transform:none;letter-spacing:0">Find the phase reversal in the double banana (or the tallest channel in average reference), then click that electrode.</p>${ctxH}<div class="headwrap">${headSvg({click:true})}</div>`;
    else h+=verdict(q,ok,`maximum at ${q.rec.mx}`,MT.loc)+`<div class="two"><div class="headwrap">${headSvg({w:q.rec.fw,ans:q.rec.mx,wrong:ok?null:q.chosen,sel:q.chosen})}</div><div class="stack" style="gap:10px"><p style="margin:0">${ok?`You chose <b>${q.chosen}</b>, inside the maximum of the field.`:`You chose <b>${q.chosen==='__timeout__'?'nothing':q.chosen}</b>. The maximum is at <b>${q.rec.mx}</b>.`} The map shades each electrode by the generator’s field there: <span style="color:var(--mark)">orange = surface negative</span>, <span style="color:var(--accent)">blue = surface positive</span>.</p>
      <p style="margin:0">In the double banana, the two channels that share <b>${q.rec.mx}</b> deflect in opposite directions (phase reversal). Switch the montage to average reference to see it as the tallest channel.</p><p class="lbl" style="text-transform:none;letter-spacing:0">The tracing shows: <b>${p.name}</b>.</p></div></div>${whyBlock(p)}`+nextRow(q)}
  else if(q.kind==='click'){const ok=answered&&clickOk(q);
    if(!answered)h+=`<div class="row" style="justify-content:space-between"><h2>${q.onset?'Click where it begins':'Click on one of the discharges'}</h2><span class="pill">${MT.click}</span></div><p class="lbl" style="text-transform:none;letter-spacing:0">${q.onset?'Tap the tracing at the earliest point where the abnormal activity starts (within about 0.7 s).':'Tap the tracing at the peak of any discharge (within about 0.15 s). Teaching marks are hidden until you answer.'}</p>${ctxH}`;
    else h+=verdict(q,ok,p.name,MT.click)+`<p>${ok?'On target.':q.chosen<0?'No click recorded.':`Your click was at ${q.chosen.toFixed(2)} s.`} ${q.onset?`It begins at about ${q.rec.ev[0].toFixed(1)} s (dashed line).`:`Dashed lines mark each discharge; there ${q.rec.ev.length===1?'is 1':'are '+q.rec.ev.length} on this page.`}</p><div class="note">${p.feats[0]}. ${p.feats[1]}.</div>${whyBlock(p)}`+nextRow(q)}
  else if(!answered){h+=`<div class="row" style="justify-content:space-between"><h2>What is the main finding?</h2>${q.hint<p.hints.length?`<button class="btn small" id="qHint">Hint (H)</button>`:''}</div>${ctxH}`;
    if(q.hint>0)h+=`<div class="note">${p.hints.slice(0,q.hint).map(x=>`<div>${x}</div>`).join('')}</div>`;
    h+=`<div class="qgrid">${q.opts.map((id,i)=>`<button class="opt" data-id="${id}"><kbd>${i+1}</kbd><span><b style="font-weight:500">${PM[id].name}</b><span class="cat">${catOf(id)}</span></span></button>`).join('')}</div>`}
  else{const ok=q.chosen===q.pid;
    h+=`<div class="verdict ${ok?'ok':'no'}">${ok?'Correct':'Not quite'}<span style="color:var(--ink);font-weight:500"> · ${p.name}</span><span class="pill ${p.cat}">${catOf(q.pid)}</span></div>`;
    h+=`<div class="qgrid">${q.opts.map(id=>`<div class="opt ${id===q.pid?'ok':id===q.chosen?'no':''}" style="opacity:${id===q.pid||id===q.chosen?1:.55}"><span><b style="font-weight:500">${PM[id].name}</b></span></div>`).join('')}</div>`;
    h+=`<div class="two"><div><h3>What to look for</h3><ul class="f">${p.feats.map(f=>`<li>${f}</li>`).join('')}</ul></div><div class="stack" style="gap:10px">`;
    if(!ok&&!PM[q.chosen])h+=`<div class="note"><b>Time ran out.</b> Under time pressure: state first (awake, asleep, coma), then background, then anything that repeats.</div>`;else if(!ok){const t=(p.vs&&p.vs[q.chosen])||(PM[q.chosen].vs&&PM[q.chosen].vs[q.pid])||`Compare the defining feature of ${lc(PM[q.chosen].name)} (“${PM[q.chosen].feats[0]}”) with this tracing.`;h+=`<div class="note"><b>Versus ${PM[q.chosen].name}.</b> ${t}</div>`}
    h+=`<div><h3>Clinical note</h3><p style="margin-top:6px">${p.sig}</p></div></div></div>${whyBlock(p)}`;
    if(p.askLoc&&q.rec.loc){h+=`<div><h3>Distribution</h3><div class="row" style="margin-top:6px">${['Left hemisphere','Right hemisphere',GLOC,'Bilateral independent'].map(o=>`<button class="chip" data-loc="${o}" ${q.loc?'disabled':''} aria-pressed="${q.loc===o}">${o}</button>`).join('')}</div>${q.loc?`<p style="margin-top:8px">${yesno(q.loc===q.rec.loc)} This example is <b>${q.rec.loc}</b>.</p>`:''}</div>`}
    if(p.q2){const a=p.q2.a;h+=`<div><h3>Follow-up</h3><p style="margin:6px 0"><b>${p.q2.q}</b></p><div class="stack" style="gap:6px">${p.q2.opts.map((o,i)=>`<button class="chip" style="text-align:left;border-radius:8px" data-q2="${i}" ${q.q2c!=null?'disabled':''} aria-pressed="${q.q2c===i}">${o}</button>`).join('')}</div>${q.q2c!=null?`<p style="margin-top:8px">${yesno(q.q2c===a)} ${p.q2.opts[a]}. ${p.q2.why}</p>`:''}</div>`}
    h+=`<details><summary>About this example</summary>${metaTable(q.rec)||'<p class="lbl">Nothing extra recorded.</p>'}</details>`+nextRow(q)}
  card.innerHTML=h;
  $$('.opt[data-id]',card).forEach(b=>b.addEventListener('click',()=>choose(b.dataset.id)));$$('.opt[data-mi]',card).forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.mi)));
  const hb=$('#qHint',card);if(hb)hb.addEventListener('click',hint);
  $$('[data-loc]',card).forEach(b=>b.addEventListener('click',()=>{q.loc=b.dataset.loc;DB.locs.push({pid:q.pid,ok:q.loc===q.rec.loc,t:'side',ts:Date.now()});store.save(DB);renderCard()}));
  $$('[data-q2]',card).forEach(b=>b.addEventListener('click',()=>{q.q2c=+b.dataset.q2;DB.q2.push({pid:q.pid,ok:q.q2c===p.q2.a,ts:Date.now()});store.save(DB);renderCard()}));
  $$('[data-dk]',card).forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;q.sel[g.dataset.dk]=b.dataset.v;renderCard()}));
  $$('[data-bk]',card).forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;q.sel[g.dataset.bk]=b.dataset.v;renderCard()}));
  const dc=$('#dsCheck',card);if(dc)dc.addEventListener('click',()=>choose('done'));const bc=$('#bgCheck',card);if(bc)bc.addEventListener('click',()=>choose('done'));
  $$('.head [data-el]',card).forEach(g=>{if(q.kind!=='loc'||answered)return;const f=()=>choose(g.dataset.el);g.addEventListener('click',f);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();f()}})});
  if(q.kind==='click'){if(!answered){qViewer.pick=t=>{qViewer.pick=null;choose(t)}}else{qViewer.pick=null;const ms=q.rec.ev.map(t=>({t,c:'ans'}));if(q.chosen>=0)ms.push({t:q.chosen,c:clickOk(q)?'ok':'no',txt:'you'});qViewer.marks=ms;qViewer.draw()}}
  const nb=$('#qNext',card);if(nb)nb.addEventListener('click',next);const ab=$('#qAtlas',card);if(ab)ab.addEventListener('click',()=>openAtlas(q.pid,q.seed));LRN.afterRender(q,answered)}
function hint(){const q=S.q;if(!q||q.kind!=='dx'||q.chosen!==null&&!S.exam)return;if(q.hint<PM[q.pid].hints.length){q.hint++;renderCard()}}
function choose(v){const q=S.q;if(!q||q.chosen!==null&&!(S.exam&&!S.exam.done))return;
  if(S.exam&&!S.exam.done){q.chosen=v;recordAnswer(q,'exam');S.exam.i++;if(S.exam.i>=S.exam.qs.length)return finishExam();showQ(S.exam.qs[S.exam.i]);return}
  q.chosen=v;recordAnswer(q,'practice');if(q.kind!=='traj'&&q.kind!=='trend'){qViewer.setAnn(true);$('#qAnn').checked=true}renderCard()}
function next(){if(LRN.active()){LRN.next();return}if(S.exam&&!S.exam.done)return;const k=kindNow();showQ(newQ(nextPid(k),k))}
function qName(q){if(q.kind==='traj'||q.kind==='trend')return typeof TT!=='undefined'?TT[q.tt]:'Trajectory';return q.kind==='dx'?'Diagnosis':q.kind==='mech'?(q.m.type==='why'?'Mechanism':'Integration'):q.kind==='case'?'Apply':q.kind==='meas'?MT[q.m.type]:MT[q.kind]||q.kind}
function finishExam(){const e=S.exam,score=e.qs.filter(isOk).length;e.done=true;DB.exams.push({ts:Date.now(),score,n:e.qs.length});store.save(DB);
  S.q=null;setStage();$('#qStage').hidden=false;$('#qViewer').hidden=true;$('#qMeta').hidden=true;
  const c=$('#qCard');c.innerHTML=`<h2>Exam complete: ${score} of ${e.qs.length}</h2><div class="prog"><i style="width:${score/e.qs.length*100}%"></i></div>
  <div class="tw"><table><thead><tr><th>#</th><th>Question</th><th>Pattern</th><th></th></tr></thead><tbody>${e.qs.map((q,i)=>`<tr><td>${i+1}</td><td>${qName(q)}</td><td>${q.pid&&PM[q.pid]?PM[q.pid].name:q.scn&&typeof SCN!=='undefined'&&SCN[q.scn]?SCN[q.scn].name:''}</td><td>${isOk(q)?'<b style="color:var(--good)">Correct</b>':`<button class="btn small" data-rev="${i}">Review</button>`}</td></tr>`).join('')}</tbody></table></div>
  <div class="row"><button class="btn primary" id="exAgain">New exam</button><button class="btn" id="exDash">Open dashboard</button></div>`;
  $$('[data-rev]',c).forEach(b=>b.addEventListener('click',()=>{const q=e.qs[+b.dataset.rev];if((q.kind==='traj'||q.kind==='trend')&&q.scn&&typeof openEvo==='function')openEvo(q.scn);else if(q.pid&&PM[q.pid])openAtlas(q.pid,q.seed)}));
  $('#exAgain',c).addEventListener('click',()=>{$('#qViewer').hidden=false;$('#qMeta').hidden=false;startQuiz()});$('#exDash',c).addEventListener('click',()=>setTab('dash'))}
const segBind=(id,f)=>$(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;f(b.dataset.v);$$(id+' button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});
segBind('#segMode',v=>S.mode=v);segBind('#segType',v=>S.qt=v);segBind('#segDiff',v=>S.diff=v);
Object.keys(CAT).forEach(k=>{const b=el('button','chip',CAT[k]);b.type='button';b.setAttribute('aria-pressed','true');b.dataset.c=k;b.addEventListener('click',()=>{const on=b.getAttribute('aria-pressed')!=='true';const cnt=Object.values(S.cats).filter(Boolean).length;if(!on&&cnt<=1)return;S.cats[k]=on?1:0;b.setAttribute('aria-pressed',String(on))});$('#catChips').appendChild(b)});
$('#qStart').addEventListener('click',()=>{LRN.stop();$('#qViewer').hidden=false;$('#qMeta').hidden=false;startQuiz()});
$('#qAnn').addEventListener('change',e=>qViewer.setAnn(e.target.checked));
function setDrill(ids){S.drill=ids;const c=$('#qDrill');c.hidden=!ids;if(ids){c.innerHTML=`Drilling ${ids.length} weak patterns <button class="btn small" id="clrDrill" type="button" style="margin-left:6px">Clear</button>`;$('#clrDrill').addEventListener('click',()=>setDrill(null))}}
document.addEventListener('keydown',e=>{if($('#tab-quiz').hidden||!S.q||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;const k=e.key.toLowerCase(),q=S.q,open=q.chosen===null||S.exam&&!S.exam.done;
  if(['1','2','3','4'].includes(k)&&open){const i=+k-1;if(q.kind==='dx'){if(q.opts[i])choose(q.opts[i])}else if(q.m&&i<q.m.opts.length)choose(i);else if((q.kind==='traj'||q.kind==='trend')&&q.tt!=='seq'&&q.opts&&i<q.opts.length)choose(i)}
  else if(k==='h')hint();else if((k==='n'||k==='enter')&&q.chosen!==null&&!S.exam)next()});
