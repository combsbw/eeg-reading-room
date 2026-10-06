/* ============ quiz ============ */
const S={mode:'practice',diff:'standard',cats:{normal:1,variant:1,artifact:1,abnormal:1},drill:null,q:null,exam:null,streak:0,seen:[]};
const qViewer=Viewer($('#qViewer')),aViewer=Viewer($('#aViewer'));
const catOf=id=>CAT[PM[id].cat];
function pool(){let l=P.filter(p=>S.cats[p.cat]);if(S.drill)l=l.filter(p=>S.drill.includes(p.id));return l.length?l:P}
function pickPattern(){const st=patStats(),pl=pool().filter(p=>!S.seen.slice(-3).includes(p.id)),l=pl.length?pl:pool();
  const w=l.map(p=>{const s=st[p.id];return s.n===0?2.2:1+2*(1-s.ok/s.n)});let t=w.reduce((a,b)=>a+b,0)*Math.random();for(let i=0;i<l.length;i++){t-=w[i];if(t<=0)return l[i].id}return l[0].id}
function options(pid,r){const p=PM[pid],all=P.map(x=>x.id).filter(x=>x!==pid);let d=[];
  const sameCat=all.filter(x=>PM[x].cat===p.cat),other=all.filter(x=>PM[x].cat!==p.cat),sim=(p.sim||[]).filter(x=>S.cats[PM[x].cat]||true);
  if(S.diff==='hard'){d=[...shuffle(sim,r),...shuffle(sameCat,r),...shuffle(other,r)]}
  else if(S.diff==='easy'){d=[...shuffle(other,r),...shuffle(sameCat,r)];d=d.filter(x=>!(p.sim||[]).includes(x)).concat(d.filter(x=>(p.sim||[]).includes(x)))}
  else{d=[...shuffle(sim.slice(0,2),r),...shuffle(sameCat,r),...shuffle(other,r)]}
  d=[...new Set(d)].slice(0,3);return shuffle([pid,...d],r)}
function newQ(pid,seed){seed=seed??Math.floor(Math.random()*1e9);const r=mkRand(seed+3);return{pid,seed,opts:options(pid,r),chosen:null,hint:0,rec:generate(pid,seed),loc:null,locAsked:false}}
function setStage(){$('#qIntro').hidden=!!S.q||!!S.exam&&S.exam.done;$('#qStage').hidden=!S.q&&!(S.exam&&S.exam.done)}
function showQ(q){S.q=q;S.seen.push(q.pid);setStage();qViewer.setRec(q.rec);qViewer.setAnn(false);$('#qAnn').checked=false;renderCard()}
function recordAnswer(q,mode){const ok=q.chosen===q.pid;DB.answers.push({pid:q.pid,ch:q.chosen,ok,h:q.hint>0?1:0,m:mode,ts:Date.now()});
  if(mode==='practice'){S.streak=ok?S.streak+1:0;DB.best=Math.max(DB.best||0,S.streak)}store.save(DB);return ok}
function startQuiz(){S.streak=0;S.seen=[];if(S.mode==='exam'){const r=mkRand(Date.now());const byCat={};pool().forEach(p=>(byCat[p.cat]=byCat[p.cat]||[]).push(p.id));
    let ids=[];const st=patStats();const weights=pool().map(p=>({id:p.id,w:(st[p.id].n?1+2*(1-st[p.id].ok/st[p.id].n):2)*r.u()}));ids=weights.sort((a,b)=>b.w-a.w).slice(0,Math.min(10,weights.length)).map(x=>x.id);ids=shuffle(ids,r);
    S.exam={qs:ids.map(id=>newQ(id)),i:0,done:false};showQ(S.exam.qs[0])}else{S.exam=null;showQ(newQ(pickPattern()))}
  $('#qStart').textContent='Restart'}
function renderCard(){const q=S.q,card=$('#qCard'),p=PM[q.pid],ex=!!S.exam&&!S.exam.done,answered=q.chosen!==null&&!ex;
  $('#qCount').textContent=ex?`Question ${S.exam.i+1} of ${S.exam.qs.length}`:`Practice · streak ${S.streak}`;$('#qProgWrap').hidden=!ex;if(ex)$('#qProg').style.width=(S.exam.i/S.exam.qs.length*100)+'%';
  $('#qAnn').disabled=ex;
  let h='';
  if(!answered){h+=`<div class="row" style="justify-content:space-between"><h2>What is this pattern?</h2>${q.hint<p.hints.length?`<button class="btn small" id="qHint">Hint (H)</button>`:''}</div>`;
    if(q.hint>0)h+=`<div class="note">${p.hints.slice(0,q.hint).map(x=>`<div>${x}</div>`).join('')}</div>`;
    h+=`<div class="qgrid">${q.opts.map((id,i)=>`<button class="opt" data-id="${id}"><kbd>${i+1}</kbd><span><b style="font-weight:500">${PM[id].name}</b><span class="cat">${catOf(id)}</span></span></button>`).join('')}</div>`}
  else{const ok=q.chosen===q.pid;
    h+=`<div class="verdict ${ok?'ok':'no'}">${ok?'Correct':'Not quite'}<span style="color:var(--ink);font-weight:500"> · ${p.name}</span><span class="pill ${p.cat}">${catOf(q.pid)}</span></div>`;
    h+=`<div class="qgrid">${q.opts.map(id=>`<div class="opt ${id===q.pid?'ok':id===q.chosen?'no':''}" style="opacity:${id===q.pid||id===q.chosen?1:.55}"><span><b style="font-weight:500">${PM[id].name}</b></span></div>`).join('')}</div>`;
    h+=`<div class="two"><div><h3>What to look for</h3><ul class="f">${p.feats.map(f=>`<li>${f}</li>`).join('')}</ul></div><div class="stack" style="gap:10px">`;
    if(!ok){const t=(p.vs&&p.vs[q.chosen])||(PM[q.chosen].vs&&PM[q.chosen].vs[q.pid])||`You chose “${PM[q.chosen].name}”. Compare its first feature, “${PM[q.chosen].feats[0]}”, with this pattern's: “${p.feats[0]}”.`;h+=`<div class="note"><b>Versus ${PM[q.chosen].name}.</b> ${t}</div>`}
    h+=`<div><h3>Clinical note</h3><p style="margin-top:6px">${p.sig}</p></div></div></div>`;
    if(p.askLoc){h+=`<div><h3>Distribution</h3><div class="row" style="margin-top:6px" id="locRow">${['Left hemisphere','Right hemisphere','Generalized (bilateral, symmetric)','Bilateral independent'].map(o=>`<button class="chip" data-loc="${o}" ${q.loc?'disabled':''} aria-pressed="${q.loc===o}">${o}</button>`).join('')}</div>${q.loc?`<p style="margin-top:8px">${q.loc===q.rec.loc?'<b style="color:var(--good)">Correct.</b>':'<b style="color:var(--bad)">Not quite.</b>'} This example is <b>${q.rec.loc}</b>.</p>`:''}</div>`}
    h+=`<div class="row"><button class="btn primary" id="qNext">Next (N)</button><button class="btn" id="qAtlas">Open in Atlas</button></div>`}
  card.innerHTML=h;
  $$('.opt[data-id]',card).forEach(b=>b.addEventListener('click',()=>choose(b.dataset.id)));
  const hb=$('#qHint',card);if(hb)hb.addEventListener('click',hint);
  $$('[data-loc]',card).forEach(b=>b.addEventListener('click',()=>{q.loc=b.dataset.loc;DB.locs.push({pid:q.pid,ok:q.loc===q.rec.loc,ts:Date.now()});store.save(DB);renderCard()}));
  const nb=$('#qNext',card);if(nb)nb.addEventListener('click',next);const ab=$('#qAtlas',card);if(ab)ab.addEventListener('click',()=>openAtlas(q.pid,q.seed))}
function hint(){const q=S.q;if(!q||q.chosen!==null&&!S.exam)return;if(q.hint<PM[q.pid].hints.length){q.hint++;renderCard()}}
function choose(id){const q=S.q;if(!q||q.chosen!==null&&!(S.exam&&!S.exam.done))return;
  if(S.exam&&!S.exam.done){q.chosen=id;recordAnswer(q,'exam');S.exam.i++;if(S.exam.i>=S.exam.qs.length)return finishExam();showQ(S.exam.qs[S.exam.i]);return}
  q.chosen=id;recordAnswer(q,'practice');qViewer.setAnn(true);$('#qAnn').checked=true;renderCard();}
function next(){if(S.exam&&!S.exam.done)return;showQ(newQ(pickPattern()))}
function finishExam(){const e=S.exam,score=e.qs.filter(q=>q.chosen===q.pid).length;e.done=true;DB.exams.push({ts:Date.now(),score,n:e.qs.length});store.save(DB);
  S.q=null;setStage();$('#qStage').hidden=false;$('#qViewer').hidden=true;$('#qMeta').hidden=true;
  const c=$('#qCard');c.innerHTML=`<h2>Exam complete: ${score} of ${e.qs.length}</h2><div class="prog"><i style="width:${score/e.qs.length*100}%"></i></div>
  <div class="tw"><table><thead><tr><th>#</th><th>Pattern</th><th>Your answer</th><th></th></tr></thead><tbody>${e.qs.map((q,i)=>`<tr><td>${i+1}</td><td>${PM[q.pid].name}</td><td>${PM[q.chosen].name}</td><td>${q.chosen===q.pid?'<b style="color:var(--good)">Correct</b>':`<button class="btn small" data-rev="${i}">Review</button>`}</td></tr>`).join('')}</tbody></table></div>
  <div class="row"><button class="btn primary" id="exAgain">New exam</button><button class="btn" id="exDash">Open dashboard</button></div>`;
  $$('[data-rev]',c).forEach(b=>b.addEventListener('click',()=>{const q=e.qs[+b.dataset.rev];openAtlas(q.pid,q.seed)}));
  $('#exAgain',c).addEventListener('click',()=>{$('#qViewer').hidden=false;$('#qMeta').hidden=false;startQuiz()});$('#exDash',c).addEventListener('click',()=>setTab('dash'))}

$('#segMode').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.mode=b.dataset.v;$$('#segMode button').forEach(x=>x.setAttribute('aria-pressed',x===b))});
$('#segDiff').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.diff=b.dataset.v;$$('#segDiff button').forEach(x=>x.setAttribute('aria-pressed',x===b))});
Object.keys(CAT).forEach(k=>{const b=el('button','chip',CAT[k]);b.type='button';b.setAttribute('aria-pressed','true');b.dataset.c=k;b.addEventListener('click',()=>{const on=b.getAttribute('aria-pressed')!=='true';const cnt=Object.values(S.cats).filter(Boolean).length;if(!on&&cnt<=1)return;S.cats[k]=on?1:0;b.setAttribute('aria-pressed',on)});$('#catChips').appendChild(b)});
$('#qStart').addEventListener('click',()=>{$('#qViewer').hidden=false;$('#qMeta').hidden=false;startQuiz()});
$('#qAnn').addEventListener('change',e=>qViewer.setAnn(e.target.checked));
function setDrill(ids){S.drill=ids;const c=$('#qDrill');c.hidden=!ids;if(ids){c.innerHTML=`Drilling ${ids.length} weak patterns <button class="btn small" id="clrDrill" type="button" style="margin-left:6px">Clear</button>`;$('#clrDrill').addEventListener('click',()=>setDrill(null))}}
document.addEventListener('keydown',e=>{if(!$('#tab-quiz').hidden&&S.q&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){const k=e.key.toLowerCase();
  if(['1','2','3','4'].includes(k)){const q=S.q;if(q.chosen===null||S.exam&&!S.exam.done){const id=q.opts[+k-1];if(id)choose(id)}}else if(k==='h')hint();else if((k==='n'||k==='enter')&&S.q.chosen!==null&&!S.exam)next()}});

