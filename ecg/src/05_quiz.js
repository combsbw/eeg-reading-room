
/* ============ storage ============ */
const KEY='ecgrr.v1';
const store={load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Array.isArray(s.answers)){s.meas=s.meas||[];s.q2=s.q2||[];s.exams=s.exams||[];return s}}catch(_){}return{answers:[],meas:[],q2:[],exams:[],best:0}},
  save(s){try{s.answers=s.answers.slice(-800);s.meas=s.meas.slice(-500);s.q2=s.q2.slice(-300);localStorage.setItem(KEY,JSON.stringify(s))}catch(_){}}};
let DB=store.load();
function patStats(){const o={};P.forEach(p=>o[p.id]={n:0,ok:0});DB.answers.forEach(a=>{const s=o[a.pid];if(s){s.n++;if(a.ok)s.ok++}});return o}

/* ============ measurement questions ============ */
const MT={rate:'Rate',rhythm:'Regularity',axis:'Axis',pr:'PR interval',qrs:'QRS width',qtc:'QTc'};
const near=(v,bs,tol)=>bs.some(b=>Math.abs(v-b)<tol);
function axisCat(a){return a>=-30&&a<=90?0:a<-30&&a>=-90?1:a>90&&a<=180?2:3}
function measOptions(R,r){const M=R.meta,no=M.noMeas||[],out=[];
  if(M.hr&&!no.includes('rate'))out.push('rate');
  if(['reg','regirr','irr'].includes(M.reg)&&M.hr&&!no.includes('rate'))out.push('rhythm');
  if(M.axis!=null&&!no.includes('axis')&&!near(M.axis,[-30,90,180,-180,-90],9))out.push('axis');
  if(!no.includes('pr')&&!M.paced&&!(M.pr!=null&&near(M.pr,[120,200],12)))out.push('pr');
  if(M.qrs&&!no.includes('qrs')&&!near(M.qrs,[110,120],8))out.push('qrs');
  if(M.qtcB&&!no.includes('qtc')&&M.hr>=50&&M.hr<=100&&!near(M.qtcB,[360,450,500],14))out.push('qtc');
  return out}
function makeMeas(R,type,r){const M=R.meta;let q,opts,a,why;const rr=M.hr?60000/M.hr:0;
  if(type==='rate'){const t=Math.max(20,Math.round(M.hr/5)*5),fs=shuffle([.55,.7,1.35,1.6,2],r);const o=[t];for(const f of fs){const c=Math.round(t*f/5)*5;if(c>=20&&c<=320&&o.every(x=>Math.abs(x-c)/Math.max(x,c)>.16))o.push(c);if(o.length===4)break}
    opts=shuffle(o,r);a=opts.indexOf(t);opts=opts.map(x=>x+' /min');q='What is the ventricular rate?';why=`Mean R–R about ${Math.round(rr)} ms: 60 000 ÷ ${Math.round(rr)} ≈ ${M.hr}/min. With 25 mm/s paper, 300 ÷ ${(rr/200).toFixed(1)} large boxes gives the same answer. For an irregular rhythm, count the complexes on the 10-second strip and multiply by 6.`}
  else if(type==='rhythm'){opts=['Regular','Regularly irregular (patterned or grouped)','Irregularly irregular'];a={reg:0,regirr:1,irr:2}[M.reg];q='How would you describe the ventricular rhythm?';why=`This tracing: ${M.rhy}. March the R waves out with calipers: identical spacing is regular; a repeating pattern (bigeminy, grouped beating) is regularly irregular; no pattern at all is irregularly irregular.`}
  else if(type==='axis'){opts=['Normal (−30° to +90°)','Left axis deviation (−30° to −90°)','Right axis deviation (+90° to +180°)','Extreme axis (−90° to ±180°)'];a=axisCat(M.axis);q='What is the frontal QRS axis?';
    const I=R.ms.leads.I.area,F=R.ms.leads.aVF.area,II=R.ms.leads.II.area,sg=v=>v>=0?'positive':'negative';why=`Net QRS: lead I ${sg(I)}, aVF ${sg(F)}, lead II ${sg(II)}. Computed axis about ${M.axis}°. Lead I and aVF give the quadrant; lead II separates normal from left axis deviation at −30°.`}
  else if(type==='pr'){opts=['Short (under 120 ms)','Normal (120–200 ms)','Prolonged (over 200 ms)','Variable or not measurable (changing, dissociated or absent P waves)'];a={short:0,normal:1,long:2,var:3,none:3}[M.prq];q='What is the PR interval?';
    why=M.pr!=null&&a<3?`PR about ${M.pr} ms (${(M.pr/40).toFixed(1)} small boxes), measured from the start of the P wave to the start of the QRS.`:`There is no fixed PR here (${M.rhy.toLowerCase()}): P waves are absent, variable or dissociated from the QRS.`}
  else if(type==='qrs'){opts=['Narrow (under 110 ms)','Intermediate (110–119 ms)','Wide (120 ms or more)'];a=M.qrs<110?0:M.qrs<120?1:2;q='How wide is the QRS?';why=`QRS about ${M.qrs} ms (${(M.qrs/40).toFixed(1)} small boxes). Measure in the lead where it looks widest, from the first deflection to the J point.`}
  else{opts=['Short (under 360 ms)','Normal (360–449 ms)','Borderline to prolonged (450–499 ms)','Markedly prolonged (500 ms or more)'];const v=M.qtcB;a=v<360?0:v<450?1:v<500?2:3;q='What is the corrected QT (QTc)?';why=`QT about ${M.qt} ms at a rate of ${M.hr}/min (R–R ${Math.round(rr)} ms). Bazett QTc ≈ ${M.qtcB} ms; Fridericia ≈ ${M.qtcF} ms. Quick check: a QT longer than half the R–R interval is usually prolonged.`}
  return{type,q,opts,a,why}}

/* ============ quiz ============ */
const S={mode:'practice',qt:'dx',diff:'standard',cats:Object.fromEntries(Object.keys(CAT).map(k=>[k,1])),drill:null,q:null,exam:null,streak:0,seen:[]};
const qViewer=Viewer($('#qViewer')),aViewer=Viewer($('#aViewer'));
const catOf=id=>CAT[PM[id].cat];
function pool(){let l=P.filter(p=>S.cats[p.cat]);if(S.drill)l=l.filter(p=>S.drill.includes(p.id));return l.length?l:P}
function pickPattern(){const st=patStats(),pl=pool().filter(p=>!S.seen.slice(-4).includes(p.id)),l=pl.length?pl:pool();
  const w=l.map(p=>{const s=st[p.id];return s.n===0?2.2:1+2*(1-s.ok/s.n)});let t=w.reduce((a,b)=>a+b,0)*Math.random();for(let i=0;i<l.length;i++){t-=w[i];if(t<=0)return l[i].id}return l[0].id}
function options(pid,r){const p=PM[pid],all=P.map(x=>x.id).filter(x=>x!==pid),sameCat=all.filter(x=>PM[x].cat===p.cat),other=all.filter(x=>PM[x].cat!==p.cat),sim=p.sim||[];let d;
  if(S.diff==='hard')d=[...shuffle(sim,r),...shuffle(sameCat,r),...shuffle(other,r)];
  else if(S.diff==='easy'){d=[...shuffle(other,r),...shuffle(sameCat,r)];d=d.filter(x=>!sim.includes(x)).concat(d.filter(x=>sim.includes(x)))}
  else d=[...shuffle(sim.slice(0,2),r),...shuffle(sameCat,r),...shuffle(other,r)];
  d=[...new Set(d)].slice(0,3);return shuffle([pid,...d],r)}
function newQ(pid,kind,seed){seed=seed??Math.floor(Math.random()*1e9);const r=mkRand(seed+3),rec=generate(pid,seed);
  if(kind==='meas'){const ts=measOptions(rec,r);if(ts.length){const t=ts[Math.floor(r.u()*ts.length)];return{kind,pid,seed,rec,m:makeMeas(rec,t,r),chosen:null,hint:0}}}
  return{kind:'dx',pid,seed,rec,opts:options(pid,r),chosen:null,hint:0,q2c:null}}
const kindNow=()=>S.qt==='mix'?(Math.random()<.45?'meas':'dx'):S.qt;
function setStage(){$('#qIntro').hidden=!!S.q||!!S.exam&&S.exam.done;$('#qStage').hidden=!S.q&&!(S.exam&&S.exam.done)}
function showQ(q){S.q=q;S.seen.push(q.pid);setStage();qViewer.setRec(q.rec);qViewer.setAnn(false);$('#qAnn').checked=false;renderCard()}
const isOk=q=>q.kind==='dx'?q.chosen===q.pid:q.chosen===q.m.a;
function recordAnswer(q,mode){const ok=isOk(q);if(q.kind==='dx')DB.answers.push({pid:q.pid,ch:q.chosen,ok,h:q.hint>0?1:0,m:mode,ts:Date.now()});else DB.meas.push({pid:q.pid,t:q.m.type,ok,m:mode,ts:Date.now()});
  if(mode==='practice'){S.streak=ok?S.streak+1:0;DB.best=Math.max(DB.best||0,S.streak)}store.save(DB);return ok}
function startQuiz(){S.streak=0;S.seen=[];if(S.mode==='exam'){const st=patStats(),r=mkRand(Date.now()),pl=pool();let ids=pl.map(p=>({id:p.id,w:(st[p.id].n?1+2*(1-st[p.id].ok/st[p.id].n):2)*r.u()})).sort((a,b)=>b.w-a.w).slice(0,Math.min(15,pl.length)).map(x=>x.id);
    while(ids.length<15)ids.push(pl[Math.floor(r.u()*pl.length)].id);ids=shuffle(ids,r);S.exam={qs:ids.map(id=>newQ(id,kindNow())),i:0,done:false};showQ(S.exam.qs[0])}
  else{S.exam=null;showQ(newQ(pickPattern(),kindNow()))}$('#qStart').textContent='Restart'}
function measTable(R){const M=R.meta;if(!R.tm&&!M.hr)return'<p class="lbl">No organized complexes to measure.</p>';
  const row=(k,v)=>`<tr><td>${k}</td><td>${v}</td></tr>`;return`<table class="mt"><tbody>${row('Rhythm',M.rhy)}${row('Rate',M.hr?M.hr+' /min'+(M.arate?` (atrial ${M.arate})`:''):'—')}${row('PR',M.pr!=null&&!['var','none'].includes(M.prq)?M.pr+' ms':'variable / none')}${row('QRS',M.qrs?M.qrs+' ms':'—')}${row('QT / QTc',M.qt?`${M.qt} ms / ${M.qtcB??'—'} Bazett, ${M.qtcF??'—'} Fridericia`:'—')}${row('Axis',M.axis!=null?M.axis+'°':'—')}</tbody></table>`}
function q2Html(q,interactive){const p=PM[q.pid];if(!p.q2)return'';const a=typeof p.q2.a==='function'?p.q2.a(q.rec):p.q2.a;
  if(!interactive)return`<div><h3>Key question</h3><p style="margin-top:6px"><b>${p.q2.q}</b> ${p.q2.opts[a]}. ${p.q2.why}</p></div>`;
  return`<div><h3>Follow-up</h3><p style="margin:6px 0"><b>${p.q2.q}</b></p><div class="row" style="gap:8px">${p.q2.opts.map((o,i)=>`<button class="chip" data-q2="${i}" ${q.q2c!=null?'disabled':''} aria-pressed="${q.q2c===i}" ${q.q2c!=null&&i===a?'style="border-color:var(--good)"':''}>${o}</button>`).join('')}</div>${q.q2c!=null?`<p style="margin-top:8px">${q.q2c===a?'<b style="color:var(--good)">Correct.</b>':'<b style="color:var(--bad)">Not quite.</b>'} ${p.q2.opts[a]}. ${p.q2.why}</p>`:''}</div>`}
function renderCard(){const q=S.q,card=$('#qCard'),p=PM[q.pid],ex=!!S.exam&&!S.exam.done,answered=q.chosen!==null&&!ex;
  $('#qCount').textContent=ex?`Question ${S.exam.i+1} of ${S.exam.qs.length}`:`Practice · streak ${S.streak}`;$('#qProgWrap').hidden=!ex;if(ex)$('#qProg').style.width=(S.exam.i/S.exam.qs.length*100)+'%';$('#qAnn').disabled=ex;
  let h='';
  if(q.kind==='meas'){const m=q.m;
    if(!answered){h+=`<div class="row" style="justify-content:space-between"><h2>${m.q}</h2><span class="pill">${MT[m.type]}</span></div><p class="lbl" style="text-transform:none;letter-spacing:0">Use the calipers: drag across the tracing to read Δt, rate and amplitude.</p><div class="qgrid">${m.opts.map((o,i)=>`<button class="opt" data-mi="${i}"><kbd>${i+1}</kbd><span><b style="font-weight:500">${o}</b></span></button>`).join('')}</div>`}
    else{const ok=isOk(q);h+=`<div class="verdict ${ok?'ok':'no'}">${ok?'Correct':'Not quite'}<span style="color:var(--ink);font-weight:500"> · ${m.opts[m.a]}</span></div><div class="qgrid">${m.opts.map((o,i)=>`<div class="opt ${i===m.a?'ok':i===q.chosen?'no':''}" style="opacity:${i===m.a||i===q.chosen?1:.55}"><span>${o}</span></div>`).join('')}</div>
      <div class="two"><div><h3>How to get it</h3><p style="margin-top:6px">${m.why}</p></div><div><h3>Measured on this tracing</h3>${measTable(q.rec)}</div></div><p class="lbl" style="text-transform:none;letter-spacing:0">The tracing shows: <b>${p.name}</b>.</p>
      <div class="row"><button class="btn primary" id="qNext">Next (N)</button><button class="btn" id="qAtlas">Open in Atlas</button></div>`}}
  else if(!answered){h+=`<div class="row" style="justify-content:space-between"><h2>What is the main finding?</h2>${q.hint<p.hints.length?`<button class="btn small" id="qHint">Hint (H)</button>`:''}</div>`;
    if(q.hint>0)h+=`<div class="note">${p.hints.slice(0,q.hint).map(x=>`<div>${x}</div>`).join('')}</div>`;
    h+=`<div class="qgrid">${q.opts.map((id,i)=>`<button class="opt" data-id="${id}"><kbd>${i+1}</kbd><span><b style="font-weight:500">${PM[id].name}</b><span class="cat">${catOf(id)}</span></span></button>`).join('')}</div>`}
  else{const ok=q.chosen===q.pid;
    h+=`<div class="verdict ${ok?'ok':'no'}">${ok?'Correct':'Not quite'}<span style="color:var(--ink);font-weight:500"> · ${p.name}</span><span class="pill ${p.cat}">${catOf(q.pid)}</span></div>`;
    h+=`<div class="qgrid">${q.opts.map(id=>`<div class="opt ${id===q.pid?'ok':id===q.chosen?'no':''}" style="opacity:${id===q.pid||id===q.chosen?1:.55}"><span><b style="font-weight:500">${PM[id].name}</b></span></div>`).join('')}</div>`;
    h+=`<div class="two"><div><h3>What to look for</h3><ul class="f">${p.feats.map(f=>`<li>${f}</li>`).join('')}</ul></div><div class="stack" style="gap:10px">`;
    if(!ok){const t=(p.vs&&p.vs[q.chosen])||(PM[q.chosen].vs&&PM[q.chosen].vs[q.pid])||`Compare the defining feature of ${PM[q.chosen].name.toLowerCase()} (“${PM[q.chosen].feats[0]}”) with this tracing.`;h+=`<div class="note"><b>Versus ${PM[q.chosen].name}.</b> ${t}</div>`}
    h+=`<div><h3>Clinical note</h3><p style="margin-top:6px">${p.sig}</p></div></div></div>${q2Html(q,true)}<details><summary>Measured on this tracing</summary>${measTable(q.rec)}</details>`;
    h+=`<div class="row"><button class="btn primary" id="qNext">Next (N)</button><button class="btn" id="qAtlas">Open in Atlas</button></div>`}
  card.innerHTML=h;
  $$('.opt[data-id]',card).forEach(b=>b.addEventListener('click',()=>choose(b.dataset.id)));$$('.opt[data-mi]',card).forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.mi)));
  const hb=$('#qHint',card);if(hb)hb.addEventListener('click',hint);
  $$('[data-q2]',card).forEach(b=>b.addEventListener('click',()=>{const a=typeof p.q2.a==='function'?p.q2.a(q.rec):p.q2.a;q.q2c=+b.dataset.q2;DB.q2.push({pid:q.pid,ok:q.q2c===a,ts:Date.now()});store.save(DB);renderCard()}));
  const nb=$('#qNext',card);if(nb)nb.addEventListener('click',next);const ab=$('#qAtlas',card);if(ab)ab.addEventListener('click',()=>openAtlas(q.pid,q.seed))}
function hint(){const q=S.q;if(!q||q.kind!=='dx'||q.chosen!==null&&!S.exam)return;if(q.hint<PM[q.pid].hints.length){q.hint++;renderCard()}}
function choose(v){const q=S.q;if(!q||q.chosen!==null&&!(S.exam&&!S.exam.done))return;
  if(S.exam&&!S.exam.done){q.chosen=v;recordAnswer(q,'exam');S.exam.i++;if(S.exam.i>=S.exam.qs.length)return finishExam();showQ(S.exam.qs[S.exam.i]);return}
  q.chosen=v;recordAnswer(q,'practice');if(q.kind==='dx'){qViewer.setAnn(true);$('#qAnn').checked=true}renderCard()}
function next(){if(S.exam&&!S.exam.done)return;showQ(newQ(pickPattern(),kindNow()))}
function finishExam(){const e=S.exam,score=e.qs.filter(isOk).length;e.done=true;DB.exams.push({ts:Date.now(),score,n:e.qs.length});store.save(DB);
  S.q=null;setStage();$('#qStage').hidden=false;$('#qViewer').hidden=true;$('#qMeta').hidden=true;
  const c=$('#qCard');c.innerHTML=`<h2>Exam complete: ${score} of ${e.qs.length}</h2><div class="prog"><i style="width:${score/e.qs.length*100}%"></i></div>
  <div class="tw"><table><thead><tr><th>#</th><th>Question</th><th>Answer</th><th>Your answer</th><th></th></tr></thead><tbody>${e.qs.map((q,i)=>{const dx=q.kind==='dx';return`<tr><td>${i+1}</td><td>${dx?'Diagnosis':MT[q.m.type]}</td><td>${dx?PM[q.pid].name:q.m.opts[q.m.a]}</td><td>${dx?PM[q.chosen].name:q.m.opts[q.chosen]}</td><td>${isOk(q)?'<b style="color:var(--good)">Correct</b>':`<button class="btn small" data-rev="${i}">Review</button>`}</td></tr>`}).join('')}</tbody></table></div>
  <div class="row"><button class="btn primary" id="exAgain">New exam</button><button class="btn" id="exDash">Open dashboard</button></div>`;
  $$('[data-rev]',c).forEach(b=>b.addEventListener('click',()=>{const q=e.qs[+b.dataset.rev];openAtlas(q.pid,q.seed)}));
  $('#exAgain',c).addEventListener('click',()=>{$('#qViewer').hidden=false;$('#qMeta').hidden=false;startQuiz()});$('#exDash',c).addEventListener('click',()=>setTab('dash'))}
const segBind=(id,f)=>$(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;f(b.dataset.v);$$(id+' button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});
segBind('#segMode',v=>S.mode=v);segBind('#segType',v=>S.qt=v);segBind('#segDiff',v=>S.diff=v);
Object.keys(CAT).forEach(k=>{const b=el('button','chip',CAT[k]);b.type='button';b.setAttribute('aria-pressed','true');b.addEventListener('click',()=>{const on=b.getAttribute('aria-pressed')!=='true',cnt=Object.values(S.cats).filter(Boolean).length;if(!on&&cnt<=1)return;S.cats[k]=on?1:0;b.setAttribute('aria-pressed',String(on))});$('#catChips').appendChild(b)});
$('#qStart').addEventListener('click',()=>{$('#qViewer').hidden=false;$('#qMeta').hidden=false;startQuiz()});
$('#qAnn').addEventListener('change',e=>qViewer.setAnn(e.target.checked));
function setDrill(ids){S.drill=ids;const c=$('#qDrill');c.hidden=!ids;if(ids){c.innerHTML=`Drilling ${ids.length} weak patterns <button class="btn small" id="clrDrill" type="button" style="margin-left:6px">Clear</button>`;$('#clrDrill').addEventListener('click',()=>setDrill(null))}}
document.addEventListener('keydown',e=>{if($('#tab-quiz').hidden||!S.q||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;const k=e.key.toLowerCase(),q=S.q;
  if(['1','2','3','4'].includes(k)){if(q.chosen===null||S.exam&&!S.exam.done){const i=+k-1;if(q.kind==='dx'){if(q.opts[i])choose(q.opts[i])}else if(i<q.m.opts.length)choose(i)}}else if(k==='h')hint();else if((k==='n'||k==='enter')&&q.chosen!==null&&!S.exam)next()});

/* ============ atlas: patterns ============ */
let aCur=null,aSeed=1;
function buildAtlasList(){const l=$('#aList'),sl=$('#aSel');l.innerHTML='';sl.innerHTML='';Object.keys(CAT).forEach(c=>{l.appendChild(el('h3',null,CAT[c]));const og=document.createElement('optgroup');og.label=CAT[c];P.filter(p=>p.cat===c).forEach(p=>{const b=el('button',null,p.name);b.type='button';b.dataset.id=p.id;b.addEventListener('click',()=>showAtlas(p.id));l.appendChild(b);og.appendChild(new Option(p.name,p.id))});sl.appendChild(og)});sl.addEventListener('change',()=>showAtlas(sl.value))}
function showAtlas(id,seed){aCur=id;aSeed=seed??Math.floor(Math.random()*1e9);const p=PM[id];$$('#aList button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.id===id)));$('#aSel').value=id;
  $('#aName').textContent=p.name;const pc=$('#aCat');pc.textContent=CAT[p.cat];pc.className='pill '+p.cat;
  const rec=generate(id,aSeed);aViewer.setRec(rec);aViewer.setAnn($('#aAnn').checked);
  const sim=(p.sim||[]).map(s=>{const t=(p.vs&&p.vs[s])||(PM[s].vs&&PM[s].vs[id]);return t?`<li><b>${PM[s].name}.</b> ${t}</li>`:''}).join('');
  $('#aInfo').innerHTML=`<div class="stack" style="gap:12px"><div><h3>What to look for</h3><ul class="f">${p.feats.map(f=>`<li>${f}</li>`).join('')}</ul></div><div><h3>Measured on this example</h3>${measTable(rec)}</div></div><div class="stack" style="gap:12px"><div><h3>Clinical note</h3><p style="margin-top:6px">${p.sig}</p></div>${q2Html({pid:id,rec},false)}${sim?`<div><h3>Do not confuse with</h3><ul class="f">${sim}</ul></div>`:''}</div>`}
$('#aNew').addEventListener('click',()=>aCur&&showAtlas(aCur));
$('#aAnn').addEventListener('change',e=>aViewer.setAnn(e.target.checked));
function openAtlas(id,seed){setTab('atlas');setSub('pat');showAtlas(id,seed)}

/* ============ dashboard ============ */
const pct=(a,b)=>b?Math.round(a/b*100):0;
function renderDash(){const d=$('#tab-dash'),A=DB.answers,st=patStats(),tot=A.length,ok=A.filter(a=>a.ok).length,unaided=A.filter(a=>!a.h),uok=unaided.filter(a=>a.ok).length,MS=DB.meas,mok=MS.filter(m=>m.ok).length,Q2=DB.q2,q2ok=Q2.filter(x=>x.ok).length;
  const tiles=`<div class="tiles"><div class="card tile"><div class="lbl">Diagnoses</div><div class="n">${tot}</div><div class="s">${DB.exams.length} ${DB.exams.length===1?'exam':'exams'} taken</div></div>
  <div class="card tile"><div class="lbl">Diagnosis accuracy</div><div class="n">${tot?pct(ok,tot)+'%':'–'}</div><div class="s">${unaided.length?`${pct(uok,unaided.length)}% without hints`:'no answers yet'}</div></div>
  <div class="card tile"><div class="lbl">Measurements</div><div class="n">${MS.length?pct(mok,MS.length)+'%':'–'}</div><div class="s">${MS.length} measurement answers</div></div>
  <div class="card tile"><div class="lbl">Follow-ups</div><div class="n">${Q2.length?pct(q2ok,Q2.length)+'%':'–'}</div><div class="s">culprit and management</div></div>
  <div class="card tile"><div class="lbl">Best streak</div><div class="n">${DB.best||0}</div><div class="s">in a row, practice mode</div></div></div>`;
  const cats=Object.keys(CAT).map(c=>{let n=0,o=0;P.filter(p=>p.cat===c).forEach(p=>{n+=st[p.id].n;o+=st[p.id].ok});return{c,n,o}});
  const bars=`<div class="card stack"><h3>Diagnosis by category</h3><div class="bars">${cats.map(c=>`<div class="bar"><span>${CAT[c.c]}</span><div class="track"><div class="fill" style="width:${pct(c.o,c.n)}%"></div></div><span class="v">${c.n?pct(c.o,c.n)+'% · '+c.n:'not seen'}</span></div>`).join('')}</div></div>`;
  const mbars=`<div class="card stack"><h3>Measurements by type</h3><div class="bars">${Object.keys(MT).map(t=>{const x=MS.filter(m=>m.t===t),o=x.filter(m=>m.ok).length;return`<div class="bar"><span>${MT[t]}</span><div class="track"><div class="fill" style="width:${pct(o,x.length)}%"></div></div><span class="v">${x.length?pct(o,x.length)+'% · '+x.length:'not seen'}</span></div>`}).join('')}</div></div>`;
  let trend='';const all=[...A.map(a=>({ok:a.ok,ts:a.ts})),...MS.map(m=>({ok:m.ok,ts:m.ts}))].sort((a,b)=>a.ts-b.ts),tn=all.length;
  if(tn>=4){const w=10,pts=[];for(let i=0;i<tn;i++){const s=all.slice(Math.max(0,i-w+1),i+1);pts.push(s.filter(a=>a.ok).length/s.length)}
    const W_=640,H_=140,pl=34,pb=22,pt_=10,pr=10,x=i=>pl+(tn>1?i/(tn-1):0)*(W_-pl-pr),y=v=>pt_+(1-v)*(H_-pt_-pb),line=pts.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)).join(' ');
    trend=`<div class="card stack"><div class="row" style="justify-content:space-between"><h3>Rolling accuracy (last 10 answers)</h3><span class="lbl">${tn} answers</span></div><div class="tw"><svg viewBox="0 0 ${W_} ${H_}" width="100%" style="min-width:420px;max-height:180px" role="img" aria-label="Rolling accuracy over time">${[0,.5,1].map(v=>`<line x1="${pl}" x2="${W_-pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid-major)" stroke-width="1"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end" font-size="11" font-family="var(--font-mono)" fill="var(--muted)">${v*100}%</text>`).join('')}<path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/><circle cx="${x(tn-1)}" cy="${y(pts[tn-1])}" r="4" fill="var(--accent)"/></svg></div></div>`}
  const heat=`<div class="card stack"><div class="row" style="justify-content:space-between"><h3>Every pattern</h3><span class="lbl">green 80%+ · amber 50–79% · red under 50%</span></div><div class="heat">${P.map(p=>{const s=st[p.id],a=s.n?s.ok/s.n:null,cls=a===null?'u':a>=.8?'g':a>=.5?'a':'r';return`<button class="cell ${cls}" type="button" data-open="${p.id}"><span class="nm">${p.name}</span><span class="pc">${s.n?pct(s.ok,s.n)+'% · '+s.n:'not seen'}</span></button>`}).join('')}</div></div>`;
  const conf={};A.filter(a=>!a.ok&&a.ch&&PM[a.ch]).forEach(a=>{const k=a.pid+'>'+a.ch;conf[k]=(conf[k]||0)+1});const cl=Object.entries(conf).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const confH=`<div class="card stack"><h3>Most common mix-ups</h3>${cl.length?`<div class="tw"><table><thead><tr><th>It was</th><th>You said</th><th>Times</th></tr></thead><tbody>${cl.map(([k,n])=>{const[a,b]=k.split('>');return`<tr><td>${PM[a].name}</td><td>${PM[b].name}</td><td>${n}</td></tr>`}).join('')}</tbody></table></div>`:'<p class="lbl" style="text-transform:none;letter-spacing:0">No mix-ups yet.</p>'}</div>`;
  const weak=P.map(p=>({p,s:st[p.id]})).filter(x=>x.s.n>=1&&x.s.ok/x.s.n<.8).sort((a,b)=>a.s.ok/a.s.n-b.s.ok/b.s.n||b.s.n-a.s.n).slice(0,6);
  const weakH=`<div class="card stack"><h3>Review next</h3>${weak.length?`<ul class="f" style="margin:0">${weak.map(w=>`<li>${w.p.name} <span class="lbl">${pct(w.s.ok,w.s.n)}% · ${w.s.n}</span></li>`).join('')}</ul><div class="row"><button class="btn primary" id="drillBtn" type="button">Drill these</button></div>`:'<p class="lbl" style="text-transform:none;letter-spacing:0">Nothing below 80% yet. Keep going.</p>'}</div>`;
  const exH=DB.exams.length?`<div class="card stack"><h3>Exam history</h3><div class="tw"><table><thead><tr><th>Date</th><th>Score</th></tr></thead><tbody>${DB.exams.slice(-6).reverse().map(e=>`<tr><td>${new Date(e.ts).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</td><td>${e.score} / ${e.n}</td></tr>`).join('')}</tbody></table></div></div>`:'';
  d.innerHTML=tiles+`<div class="two">${bars}${mbars}</div><div class="two">${weakH}${confH}</div>`+trend+heat+(exH?`<div class="two">${exH}<div></div></div>`:'')+`<div class="row"><button class="btn small" id="resetBtn" type="button">Reset progress</button></div>`;
  $$('[data-open]',d).forEach(b=>b.addEventListener('click',()=>openAtlas(b.dataset.open)));
  const db=$('#drillBtn',d);if(db)db.addEventListener('click',()=>{setDrill(weak.map(w=>w.p.id));setTab('quiz')});
  const rb=$('#resetBtn',d);rb.addEventListener('click',()=>{if(rb.dataset.arm){DB={answers:[],meas:[],q2:[],exams:[],best:0};store.save(DB);renderDash()}else{rb.dataset.arm=1;rb.textContent='Click again to erase all progress';setTimeout(()=>{rb.dataset.arm='';rb.textContent='Reset progress'},4000)}})}
