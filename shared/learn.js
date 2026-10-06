
/* ============ learning path, mastery and settings (shared by both Reading Rooms) ============ */
/* The app supplies LCFG: tracks, modules, data access and question makers. Every answer anywhere in the app
   updates a spaced-repetition box for the items it touched; path sessions also count toward a stage. */
const LRN=(()=>{
const STG=[
 {k:'mech',n:'Mechanism',v:'Understand',d:'Read the mechanism cards and open the labs, then explain tracings by their cause. The anchor for everything after.',q:6,pass:.8},
 {k:'rec',n:'Recognize',v:'Recognize',d:'Name the pattern on fresh, randomized tracings, with look-alikes as distractors.',q:10,pass:.8},
 {k:'ana',n:'Analyze',v:'Analyze',d:'Measure and localize: intervals, axis, leads, fields, descriptors and algorithms computed from the tracing itself.',q:8,pass:.8},
 {k:'app',n:'Apply',v:'Apply',d:'Decide what the finding means for this patient: significance, culprit, level of block, first treatment.',q:8,pass:.8},
 {k:'int',n:'Integrate',v:'Integrate',d:'Connect across patterns and time: shared mechanisms, look-alikes from other modules, and how tracings evolve.',q:8,pass:.8},
 {k:'mas',n:'Master',v:'Master',d:'Timed, mixed and cumulative with earlier modules. Pass at 90% averaging under 20 seconds per question.',q:12,pass:.9,timed:25}];
const SK={};STG.forEach((s,i)=>{SK[s.k]=s;s.i=i});
const IV=[0,10*60e3,864e5,3*864e5,7*864e5,21*864e5,60*864e5];
const ROLES={student:'Student or new learner',ems:'Flight, EMS & transport',icu:'Critical care (RN, RT, intensivist)',tech:'Technologist',clin:'Physician or APP'};
let sess=null,timer=0;
const D=()=>{const d=LCFG.db();d.srs=d.srs||{};d.path=d.path||{};d.set=d.set||{};return d};
const save=()=>LCFG.save();
const now=()=>Date.now();
/* ---- spaced repetition ---- */
function touch(key,ok){const d=D(),it=d.srs[key]||(d.srs[key]={b:0,n:0,ok:0,due:0});it.n++;if(ok){it.ok++;it.b=Math.min(6,it.b+1)}else it.b=it.b>=3?2:1;it.due=now()+IV[it.b];it.last=now()}
function dueKeys(mid){const d=D(),t=now(),ok=mid?new Set(modKeys(mid)):null;return Object.keys(d.srs).filter(k=>d.srs[k].b>0&&d.srs[k].due<=t&&(!ok||ok.has(k))&&LCFG.validKey(k))}
function modKeys(mid){const m=LCFG.mods[mid],k=[];(m.pats||[]).forEach(p=>{k.push('dx:'+p,'mech:'+p)});(m.scn||[]).forEach(s=>k.push('traj:'+s));return k}
function retention(mid){const d=D(),ks=modKeys(mid);if(!ks.length)return 0;let s=0;ks.forEach(k=>{const it=d.srs[k];s+=it?Math.min(it.b,4)/4:0});return s/ks.length}
function stageRec(mid,sk){const d=D();return(d.path[mid]||{})[sk]||null}
function stagesDone(mid){return STG.filter(s=>{const r=stageRec(mid,s.k);return r&&r.done}).length}
function role(){return D().role||'student'}
function order(){const r=role(),core=LCFG.core&&LCFG.core[r];const all=[];LCFG.tracks.forEach(t=>t.mods.forEach(m=>all.push(m)));if(!core)return all;return[...all.filter(m=>core.includes(m)),...all.filter(m=>!core.includes(m))]}
function isCore(mid){const c=LCFG.core&&LCFG.core[role()];return!c||c.includes(mid)}
function nextUp(){for(const m of order()){for(const s of STG){const r=stageRec(m,s.k);if(!r||!r.done)return{m,s:s.k}}}return null}
/* ---- sessions ---- */
function start(mid,sk,o={}){stopTimer();const st=SK[sk]||{n:'Review',q:12,pass:.8};sess={mid,sk,n:o.n||st.q,i:0,ok:0,times:[],t0:now(),timed:st.timed||0,review:!!o.review,keys:o.keys||null,log:[]};LCFG.beginSession();go()}
function go(){if(!sess)return;if(sess.i>=sess.n)return finish();let q=null;try{q=sess.review?LCFG.reviewQ(sess.keys[sess.i%sess.keys.length]):LCFG.stageQ(sess.mid,sess.sk,sess.i,sess)}catch(e){console.warn(e)}
  if(!q){sess.n=Math.max(1,sess.i);return finish()}q._t0=now();q._sess=1;LCFG.show(q)}
function record(q,ok){(LCFG.keysOf(q)||[]).forEach(k=>touch(k,ok));if(sess&&q._sess&&!q._rec){q._rec=1;sess.i++;if(ok)sess.ok++;sess.times.push((now()-(q._t0||now()))/1000);sess.log.push({ok,lab:LCFG.label(q),pid:q.pid,scn:q.scn})}stopTimer();save()}
function next(){if(!sess)return false;go();return true}
function active(){return!!sess}
function stopTimer(){clearInterval(timer);timer=0}
function afterRender(q,answered){const host=document.getElementById('qCount');if(!sess||!q._sess)return;const st=SK[sess.sk];
  if(host)host.textContent=`${LCFG.mods[sess.mid]?LCFG.mods[sess.mid].name:'Review'} · ${sess.review?'Review':st.n} · ${Math.min(sess.i+(answered?0:1),sess.n)} of ${sess.n}`;
  const card=document.getElementById('qCard');if(!card)return;
  if(answered){const nb=document.getElementById('qNext');if(nb&&sess.i>=sess.n)nb.textContent='See results';return}
  if(sess.timed){let bar=card.querySelector('.ltimer');if(!bar){bar=document.createElement('div');bar.className='ltimer';bar.innerHTML='<i></i><span></span>';card.prepend(bar)}
    stopTimer();const lim=sess.timed*1000,t0=q._t0;const tick=()=>{const left=Math.max(0,lim-(now()-t0));bar.firstChild.style.width=(left/lim*100)+'%';bar.lastChild.textContent=Math.ceil(left/1000)+' s';if(left<=0){stopTimer();LCFG.timeout(q)}};tick();timer=setInterval(tick,200)}}
function finish(){stopTimer();const s=sess;sess=null;if(!s)return;const st=SK[s.sk],score=s.n?s.ok/s.n:0,avg=s.times.length?s.times.reduce((a,b)=>a+b,0)/s.times.length:0;
  let pass=false;if(!s.review&&st){pass=score>=st.pass&&(!st.timed||avg<=20);const d=D(),p=d.path[s.mid]||(d.path[s.mid]={}),prev=p[s.sk]||{};p[s.sk]={best:Math.max(prev.best||0,score),done:!!(prev.done||pass),ts:now(),tries:(prev.tries||0)+1,avg:Math.round(avg)};save()}
  const nx=nextUp(),m=LCFG.mods[s.mid];
  LCFG.showResult(`<div class="stack" style="gap:12px"><div class="row" style="justify-content:space-between"><h2>${s.review?'Review complete':`${m.name}: ${st.n} ${pass?'complete':'not yet passed'}`}</h2><span class="pill ${pass||s.review?'normal':'isch'}">${Math.round(score*100)}%${st&&st.timed?` · ${avg.toFixed(1)} s avg`:''}</span></div>
   <div class="prog"><i style="width:${score*100}%"></i></div>
   ${!s.review&&st?`<p>${pass?`Passed (${Math.round(st.pass*100)}% needed${st.timed?', under 20 s average':''}).`:`${Math.round(st.pass*100)}% is needed to pass${st.timed?', averaging under 20 s':''}. Missed items are now due for review and will come back sooner.`}</p>`:''}
   <ol class="f">${s.log.map(l=>`<li>${l.ok?'<b style="color:var(--good)">✓</b>':'<b style="color:var(--bad)">✗</b>'} ${l.lab}${!l.ok&&(l.pid||l.scn)?` <button class="btn small" type="button" ${l.scn&&!l.pid?`data-lscn="${l.scn}"`:`data-pat="${l.pid}"`}>Review</button>`:''}</li>`).join('')}</ol>
   <div class="row">${!s.review&&!pass?`<button class="btn primary" data-lrn="again">Try ${st.n} again</button>`:''}${nx?`<button class="btn ${!s.review&&!pass?'':'primary'}" data-lrn="next">Continue: ${LCFG.mods[nx.m].name} · ${SK[nx.s].n}</button>`:''}<button class="btn" data-lrn="path">Back to the path</button></div></div>`,
   a=>{if(a==='again')start(s.mid,s.sk);else if(a==='next'&&nx)start(nx.m,nx.s);else LCFG.openPath(s.mid)});document.querySelectorAll('[data-lscn]').forEach(b=>b.addEventListener('click',()=>LCFG.openScn(b.dataset.lscn)))}
function review(){const ks=dueKeys();if(!ks.length)return false;start(null,'rev',{review:true,keys:ks.slice(0,15),n:Math.min(15,ks.length)});return true}
function startReviewMod(mid){const ks=dueKeys(mid).concat(modKeys(mid).filter(k=>!(D().srs[k]&&D().srs[k].due>now())));if(!ks.length)return;start(mid,'rev',{review:true,keys:ks.slice(0,12),n:Math.min(12,ks.length)})}
/* ---- path page ---- */
let openMid=null;
function ring(p,size=46){return`<span class="lring" style="--p:${Math.round(p*100)};width:${size}px;height:${size}px"><b>${Math.round(p*100)}</b></span>`}
function render(host,scrollMod){const d=D(),nx=nextUp(),due=dueKeys().length,tot=Object.keys(LCFG.mods).length,doneMods=Object.keys(LCFG.mods).filter(m=>stagesDone(m)===6).length,mast=Object.values(d.srs).filter(i=>i.b>=4).length;
  let h=`<div class="card stack"><div class="row" style="justify-content:space-between;align-items:flex-start"><div class="stack" style="gap:6px;max-width:74ch"><h2>Your path</h2><p style="margin:0">Modules are grouped into tracks that build on each other. Each module runs the same six stages: understand the mechanism, recognize it, analyze and measure it, apply it to a patient, integrate it with other patterns and with time, then master it under time pressure. Anything you get wrong comes back for spaced review.</p></div>
   <div class="row" style="gap:8px"><button class="btn small" data-lrn="settings" type="button">Settings</button></div></div>
   <div class="tiles"><div class="card tile"><div class="lbl">Modules complete</div><div class="n">${doneMods} / ${tot}</div><div class="s">all six stages passed</div></div><div class="card tile"><div class="lbl">Items mastered</div><div class="n">${mast}</div><div class="s">answered correctly on 4+ spaced days</div></div><div class="card tile"><div class="lbl">Due for review</div><div class="n">${due}</div><div class="s">${due?'ready now':'nothing due'}</div></div></div>
   <div class="row"><span class="lbl">I am</span><div class="row" style="gap:6px">${Object.entries(ROLES).map(([k,v])=>`<button class="chip" type="button" data-role="${k}" aria-pressed="${role()===k}">${v}</button>`).join('')}</div></div>
   <div class="row">${nx?`<button class="btn primary" data-lrn="cont" type="button">Continue: ${LCFG.mods[nx.m].name} · ${SK[nx.s].n}</button>`:'<span class="pill normal">Every stage passed</span>'}${due?`<button class="btn" data-lrn="rev" type="button">Review ${Math.min(due,15)} due item${due===1?'':'s'}</button>`:''}${LCFG.other?otherCard():''}</div></div>`;
  LCFG.tracks.forEach(t=>{h+=`<div class="stack" style="gap:10px"><div class="row" style="justify-content:space-between"><h2>${t.name}</h2><span class="lbl" style="text-transform:none;letter-spacing:0">${t.sum||''}</span></div><div class="mgrid">${t.mods.map(mid=>{const m=LCFG.mods[mid],sd=stagesDone(mid),ret=retention(mid),cur=nx&&nx.m===mid;
    return`<button class="mcard ${cur?'cur':''} ${isCore(mid)?'':'elect'}" type="button" data-mid="${mid}"><div class="mhead"><div class="stack" style="gap:4px;min-width:0;text-align:left;flex:1"><b>${m.name}</b><span class="msum">${m.sum}</span></div>${ring(sd/6)}</div>
     <div class="sdots">${STG.map(s=>{const r=stageRec(mid,s.k);return`<span class="sd ${r&&r.done?'done':r?'tried':''}" title="${s.n}">${s.n.slice(0,4)}</span>`}).join('')}</div><div class="rbar" title="Retention"><i style="width:${ret*100}%"></i></div>${isCore(mid)?'':'<span class="lbl">Elective for your role</span>'}</button>`}).join('')}</div></div>`;if(openMid&&t.mods.includes(openMid))h+='<div id="lrnMod"></div>'});
  host.innerHTML=h+(openMid&&LCFG.tracks.some(t=>t.mods.includes(openMid))?'':'<div id="lrnMod"></div>');
  host.querySelectorAll('[data-role]').forEach(b=>b.addEventListener('click',()=>{D().role=b.dataset.role;save();render(host)}));
  host.querySelectorAll('[data-mid]').forEach(b=>b.addEventListener('click',()=>{openMid=openMid===b.dataset.mid?null:b.dataset.mid;render(host,true)}));
  const c=host.querySelector('[data-lrn=cont]');if(c)c.addEventListener('click',()=>start(nx.m,nx.s));const r=host.querySelector('[data-lrn=rev]');if(r)r.addEventListener('click',review);
  host.querySelector('[data-lrn=settings]').addEventListener('click',()=>settings());const oc=host.querySelector('[data-lrn=other]');if(oc)oc.addEventListener('click',()=>{location.href=LCFG.other.href});
  if(openMid)modPanel(host,!scrollMod)}
function otherCard(){try{const o=JSON.parse(localStorage.getItem(LCFG.other.key)||'null');if(!o||!o.path)return'';const n=Object.values(o.path).reduce((a,p)=>a+Object.values(p).filter(x=>x&&x.done).length,0),t=now(),due=Object.values(o.srs||{}).filter(i=>i.b>0&&i.due<=t).length;
  return`<button class="btn" data-lrn="other" type="button">${LCFG.other.name}: ${n} stage${n===1?'':'s'} passed${due?`, ${due} due`:''} →</button>`}catch(_){return''}}
function modPanel(host,keep){const mid=openMid,m=LCFG.mods[mid],box=host.querySelector('#lrnMod');if(!m||!box)return;const kd=dueKeys(mid).length;
  box.innerHTML=`<div class="card stack mpanel"><div class="row" style="justify-content:space-between;align-items:flex-start"><div class="stack" style="gap:4px;max-width:80ch"><span class="lbl">${(LCFG.tracks.find(t=>t.mods.includes(mid))||{}).name||''}</span><h2>${m.name}</h2><p style="margin:0">${m.intro||m.sum}</p></div><button class="btn small" data-x type="button">Close</button></div>
   <div class="stlist">${STG.map((s,i)=>{const r=stageRec(mid,s.k);return`<div class="strow ${r&&r.done?'done':''}"><span class="snum">${r&&r.done?'✓':i+1}</span><div class="stack" style="gap:2px;min-width:0"><b>${s.n}</b><span class="msum">${s.d}</span>${r?`<span class="lbl" style="text-transform:none;letter-spacing:0">Best ${Math.round(r.best*100)}%${r.avg&&s.timed?` · ${r.avg} s avg`:''} · ${r.tries} attempt${r.tries===1?'':'s'}</span>`:''}</div><button class="btn small ${!r||!r.done?'primary':''}" type="button" data-st="${s.k}">${r&&r.done?'Repeat':'Start'}</button></div>`}).join('')}</div>
   <div class="two"><div class="stack" style="gap:8px"><h3>Mechanism anchors</h3>${(m.con||[]).map(c=>`<div class="mcon"><b>${LCFG.conName(c)}.</b> ${LCFG.conText(c)}${LCFG.conLab(c)?` <button class="btn small" type="button" data-lab="${LCFG.conLab(c)}">Open the lab</button>`:''}</div>`).join('')}
    ${(m.labs||[]).length?`<div class="row" style="gap:6px">${m.labs.map(([k,t])=>`<button class="btn small" type="button" data-go="${k}">${t}</button>`).join('')}</div>`:''}</div>
    <div class="stack" style="gap:8px"><h3>Patterns</h3><div class="row" style="gap:6px">${(m.pats||[]).map(p=>{const it=D().srs['dx:'+p];return`<button class="chip" type="button" data-pat="${p}" title="${it?`box ${it.b}`:'not seen'}"><span class="lvl l${it?Math.min(it.b,4):0}"></span>${LCFG.patName(p)}</button>`}).join('')}</div>
    ${(m.scn||[]).length?`<h3>Evolution scenarios</h3><div class="row" style="gap:6px">${m.scn.map(s=>`<button class="chip" type="button" data-scn="${s}">${LCFG.scnName(s)}</button>`).join('')}</div>`:''}
    <div class="row"><button class="btn small" type="button" data-rm ${modKeys(mid).length?'':'disabled'}>Review this module${kd?` (${kd} due)`:''}</button></div></div></div></div>`;
  box.querySelector('[data-x]').addEventListener('click',()=>{openMid=null;render(host)});
  box.querySelectorAll('[data-st]').forEach(b=>b.addEventListener('click',()=>start(mid,b.dataset.st)));
  box.querySelectorAll('[data-scn]').forEach(b=>b.addEventListener('click',()=>LCFG.openScn(b.dataset.scn)));
  box.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>LCFG.openSection(b.dataset.go)));
  const rm=box.querySelector('[data-rm]');if(rm)rm.addEventListener('click',()=>startReviewMod(mid));
  if(!keep)box.scrollIntoView({behavior:'smooth',block:'start'})}
/* ---- settings ---- */
function applySettings(){const s=D().set,r=document.documentElement;if(s.theme==='light'||s.theme==='dark')r.setAttribute('data-theme',s.theme);else r.removeAttribute('data-theme');r.classList.toggle('cvd',!!s.cvd);r.classList.toggle('rmo',!!s.rmo);r.style.setProperty('--tw',s.tw||1)}
function tw(){const s=D().set;return s.tw||1}
function settings(){const s=D().set,dlg=document.createElement('div');dlg.className='lmodal';dlg.innerHTML=`<div class="card stack" role="dialog" aria-modal="true" aria-label="Settings"><div class="row" style="justify-content:space-between"><h2>Settings</h2><button class="btn small" data-x type="button">Close</button></div>
  <div class="row"><span class="lbl">Theme</span><div class="seg" data-k="theme">${[['system','System'],['light','Light'],['dark','Dark']].map(([v,t])=>`<button type="button" data-v="${v}" aria-pressed="${(s.theme||'system')===v}">${t}</button>`).join('')}</div></div>
  <label class="row"><input type="checkbox" id="lsCvd" ${s.cvd?'checked':''}> Colour-vision-safe palette (blue / orange instead of green / red)</label>
  <div class="row"><span class="lbl">Tracing weight</span><div class="seg" data-k="tw">${[[1,'Standard'],[1.4,'Bold'],[1.9,'Extra bold']].map(([v,t])=>`<button type="button" data-v="${v}" aria-pressed="${(s.tw||1)==v}">${t}</button>`).join('')}</div></div>
  <label class="row"><input type="checkbox" id="lsRmo" ${s.rmo?'checked':''}> Reduce motion (no autoplay or animated labs)</label>
  <h3>Progress</h3><p style="margin:0">Progress lives in this browser on this device. Export it to move it to another device, or keep a backup.</p>
  <div class="row"><button class="btn small" data-ex type="button">Download progress file</button><button class="btn small" data-cp type="button">Copy progress code</button><label class="btn small" style="cursor:pointer">Import file<input type="file" accept=".json,application/json" data-im hidden></label></div>
  <textarea data-tx rows="3" placeholder="Or paste a progress code here and press Import code" style="width:100%;font-family:var(--font-mono);font-size:12px"></textarea>
  <div class="row"><button class="btn small" data-ic type="button">Import code</button><span class="lbl" data-msg style="text-transform:none;letter-spacing:0"></span></div>
  <div class="row"><button class="btn small" data-rs type="button">Reset path and review progress</button></div></div>`;
  document.body.appendChild(dlg);const msg=t=>{dlg.querySelector('[data-msg]').textContent=t};const close=()=>{dlg.remove();LCFG.redraw()};
  dlg.addEventListener('click',e=>{if(e.target===dlg)close()});dlg.querySelector('[data-x]').addEventListener('click',close);
  dlg.querySelectorAll('.seg[data-k]').forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=g.dataset.k;s[k]=k==='tw'?+b.dataset.v:b.dataset.v;g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));save();applySettings();LCFG.redraw()}));
  dlg.querySelector('#lsCvd').addEventListener('change',e=>{s.cvd=e.target.checked;save();applySettings();LCFG.redraw()});dlg.querySelector('#lsRmo').addEventListener('change',e=>{s.rmo=e.target.checked;save();applySettings()});
  const payload=()=>{const o={v:1,ts:now()};[LCFG.key,LCFG.other&&LCFG.other.key].filter(Boolean).forEach(k=>{try{const x=localStorage.getItem(k);if(x)o[k]=JSON.parse(x)}catch(_){}});if(!o[LCFG.key])o[LCFG.key]=D();return JSON.stringify(o)};
  dlg.querySelector('[data-ex]').addEventListener('click',()=>{try{const b=new Blob([payload()],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`reading-room-progress-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();msg('Downloaded. If nothing appeared, use Copy progress code.')}catch(_){msg('Download is not available here; use Copy progress code.')}});
  dlg.querySelector('[data-cp]').addEventListener('click',()=>{const t=payload(),ta=dlg.querySelector('[data-tx]');ta.value=t;const p=navigator.clipboard&&navigator.clipboard.writeText(t);if(p)p.then(()=>msg('Copied to the clipboard.'),()=>{ta.select();msg('Selected: copy it manually.')});else{ta.select();msg('Selected: copy it manually.')}});
  const imp=txt=>{try{const o=JSON.parse(txt);let n=0;Object.keys(o).forEach(k=>{if(/^(ecg|eeg)rr\.v1$/.test(k)&&o[k]&&typeof o[k]==='object'){localStorage.setItem(k,JSON.stringify(o[k]));n++}});if(!n)throw 0;msg('Imported. Reloading…');setTimeout(()=>location.reload(),600)}catch(_){msg('That is not a Reading Room progress file.')}};
  dlg.querySelector('[data-im]').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const fr=new FileReader();fr.onload=()=>imp(fr.result);fr.readAsText(f)});
  dlg.querySelector('[data-ic]').addEventListener('click',()=>imp(dlg.querySelector('[data-tx]').value));
  const rs=dlg.querySelector('[data-rs]');rs.addEventListener('click',()=>{if(rs.dataset.arm){const d=D();d.srs={};d.path={};save();msg('Path and review progress cleared.');rs.dataset.arm='';rs.textContent='Reset path and review progress';LCFG.redraw()}else{rs.dataset.arm=1;rs.textContent='Click again to erase path progress'}})}
return{STG,SK,start,next,record,active,afterRender,render,review,settings,applySettings,tw,touch,dueKeys,retention,stagesDone,nextUp,modKeys,get sess(){return sess},stop:()=>{stopTimer();sess=null}}})();
