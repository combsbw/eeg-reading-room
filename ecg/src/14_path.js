
/* ============ ECG curriculum: tracks → modules → six stages ============ */
const TRACKS=[
 {id:'A',name:'Foundations: from ion channel to surface ECG',sum:'Start here. Everything else is built on these.',mods:['found','leads']},
 {id:'B',name:'Rhythm and conduction',sum:'Pacemakers, pathways and circuits.',mods:['auto','av','ivc','narrow','wide','pace']},
 {id:'C',name:'Coronary flow and ischemia',sum:'Supply, injury, occlusion and time.',mods:['supply','omi','evol']},
 {id:'D',name:'Structure, pericardium and genetics',sum:'Mass, load, inflammation and inherited channels.',mods:['mass','genetic','peri']},
 {id:'E',name:'Electrolytes, drugs and temperature',sum:'Systemic changes that move every cell at once.',mods:['k','camg','qt','tox','temp']},
 {id:'F',name:'Technical and synthesis',sum:'Trust the signal, then put it all together.',mods:['tech','synth']}];
const MODS={
 found:{name:'Action potential to surface ECG',sum:'Ion currents in each phase become P, QRS, ST and T.',intro:'The surface ECG is the voltage difference between cells that are at different phases of their action potentials. Phase 0 sodium entry writes the QRS, the calcium plateau the ST segment, potassium-driven phase 3 the T wave, and phase 4 in pacemaker cells sets the rate.',
  con:['restK','naAvail','plateau','repol','disp','seq','auto','autonom'],pats:['nsr','sarr','sbrady','stach','erp','athlete','child'],labs:[['ap','Action potential lab'],['rate','Rate & intervals']]},
 leads:{name:'Leads, vectors and axis',sum:'Each lead is a viewpoint on one moving dipole.',intro:'One cardiac dipole projected onto twelve viewpoints. A lead writes upward when the wave moves toward its positive pole. Axis, R-wave progression and lead reversal all follow from that single rule.',
  con:['seq','position','mass'],pats:['lafb','lpfb','dextro','lrrev','lallrev','rarl','v1v2high','vswap'],labs:[['lead','Leads & axis']]},
 auto:{name:'Automaticity, ectopy and escape',sum:'Who fires first, and why the fastest pacemaker wins.',intro:'Every pacemaker cell depolarizes in phase 4; the steepest slope reaches threshold first and leads. Ectopy is a focus whose slope or triggered activity briefly wins; escape is a slower one taking over when faster sites fail.',
  con:['auto','autonom','dad','fusion','refract'],pats:['pac','pvc','junct','accjunct','aivr','wap','eat','sinusarrest','saexit','mat'],labs:[['cond','Conduction lab']]},
 av:{name:'AV conduction and block',sum:'Decremental node versus all-or-none His–Purkinje.',intro:'The AV node is calcium-driven and decremental: it slows as it is stimulated faster and fails gradually (Wenckebach). The His–Purkinje system is sodium-driven and all-or-none: it fails abruptly (Mobitz II, complete block with wide escape). Where the block sits predicts behaviour and treatment.',
  con:['decrem','allnone','dissoc','refract','autonom'],pats:['avb1','wenck','mob2','avb21','hgavb','avb3','isodiss'],scn:['avbInf'],labs:[['cond','Conduction lab'],['rate','Ladder diagrams']]},
 ivc:{name:'Bundle branches, fascicles and pre-excitation',sum:'When activation leaves the fast highway.',intro:'Normal activation uses the Purkinje network to excite the ventricles within about 90 ms. If a bundle or fascicle fails, or an accessory pathway lets activation in early, the wave travels cell to cell instead: slower, wider, and pointing in a new direction, with repolarization following it (secondary ST-T change).',
  con:['bbb','fasc','accpath','secST','myo'],pats:['rbbb','lbbb','lafb','lpfb','bifasc','ivcd','altbbb','ashman','wpw'],labs:[['cond','Conduction lab']]},
 narrow:{name:'Narrow-complex tachycardias',sum:'Re-entry, automaticity and the AV node’s role.',intro:'A narrow QRS means the ventricles are activated through the normal His–Purkinje system, so the rhythm starts at or above the AV node. The question is the mechanism: re-entry that uses the node (AVNRT, AVRT), re-entry confined to the atria (flutter), or an automatic focus.',
  con:['reentry','decrem','auto','accpath'],pats:['stach','af','flutter','atypflut','svt','orthoavrt','pjrt','eat','atblock','mat'],scn:['svtAden','flutAden'],labs:[['cond','Conduction lab']]},
 wide:{name:'Wide-complex tachycardias and arrest rhythms',sum:'Myocardium-to-myocardium activation and how to tell VT.',intro:'A wide QRS means slow cell-to-cell activation: from a ventricular focus, a blocked bundle, an accessory pathway, or a poisoned Na⁺ channel. VT starts in muscle, so its initial forces are slow; aberrant SVT enters through Purkinje fibres, so its initial forces are fast. That is the basis of every VT algorithm.',
  con:['reentry','myo','accpath','naBlock','ead','dissoc','fusion'],pats:['vt','svtab','preaf','antidromic','fascvt','rvotvt','pmvt','tdp','vflutter','vf','bidir'],labs:[['cond','Conduction lab']]},
 pace:{name:'Pacing and devices',sum:'Capture, sensing and timing.',intro:'A pacemaker spike is an artificial phase 0 trigger. Capture depends on delivering enough current to bring nearby cells to threshold; the paced QRS is wide because it spreads from one point through muscle. Sensing failures put spikes in the wrong place; capture failures leave spikes alone.',
  con:['paced','fusion','myo','restK'],pats:['vpace','aai','crt','fcap','undersense','oversense','pmt','tcp','pacedmi']},
 supply:{name:'Supply, demand and the injury current',sum:'Why ischemic muscle bends the ST segment.',intro:'Coronary flow to the left ventricle happens mainly in diastole and reaches the subendocardium last. Ischemic cells lose K⁺ through K-ATP channels: their resting potential rises and their plateau falls. Current flows between injured and healthy cells. Subendocardial ischemia pulls the ST down; transmural ischemia points the ST vector toward the injured epicardium.',
  con:['supply','injury','recip','territory'],pats:['antstemi','infstemi','latstemi','poststemi','rvmi','avr'],labs:[['cor','Coronary lab']]},
 omi:{name:'Occlusion MI equivalents and subtle OMI',sum:'Occlusion without classic ST elevation.',intro:'STEMI criteria miss a quarter of coronary occlusions. Hyperacute T waves, de Winter, posterior, high-lateral and wraparound patterns, Sgarbossa in LBBB or pacing, and RBBB with occlusion all follow from the same injury-current physics seen through different geometry or conduction.',
  con:['hyperacute','injury','recip','territory','secST'],pats:['hyperT','dewinter','saflag','swirl','aslanger','shark','antsubtle','wraplad','stemirbbb','sgarb','pacedmi','wellens'],labs:[['cor','Coronary lab']]},
 evol:{name:'Evolution: necrosis, reperfusion and scar',sum:'Reading time on the ECG.',intro:'Each stage of infarction has its own cellular signature: K⁺ loss (hyperacute T), injury current (ST elevation), loss of living muscle (Q waves), delayed repolarization of stunned or recovering muscle (T inversion), and fixed scar. Serial tracings tell you which stage you are in and whether reperfusion worked.',
  con:['hyperacute','injury','necrosis','reperf','recip'],pats:['oldimi','lvan','wellens','hyperT'],scn:['antOMI','infReperf','wellensDyn','avbInf'],labs:[['evo','Evolution'],['cor','Coronary lab']]},
 mass:{name:'Mass, strain and chamber load',sum:'More muscle, more voltage; overloaded muscle repolarizes late.',intro:'QRS voltage grows with the mass of muscle activated and shrinks with insulation between heart and electrode (fluid, air, fat, infiltration). Thick or overloaded walls conduct and repolarize later, inverting the T wave opposite the dominant QRS (strain).',
  con:['mass','strain','rvload','atrial','insul'],pats:['lvh','rvh','pe','asd','copd','effusion','amyloid','hcm','apicalhcm']},
 genetic:{name:'Channelopathies and cardiomyopathies',sum:'One mutant protein, every cell affected.',intro:'An inherited defect exaggerates one phase of the action potential everywhere: a weak Na⁺ current or strong Ito (Brugada), a lazy IKs or IKr or persistent INa (long QT 1–3), an overactive K⁺ current (short QT), or replaced muscle (ARVC, HCM, amyloid).',
  con:['genetic','ito','naAvail','repol','ead'],pats:['brugada','brugada2','lqt3','shortqt','arvc','hcm','apicalhcm','takotsubo','amyloid'],scn:['takoCourse']},
 peri:{name:'Pericardium and mimics of injury',sum:'Diffuse injury, fluid and the brain.',intro:'Pericarditis injures a thin shell of epicardium everywhere, so the ST vector has no territory. Effusion insulates and swings. Early repolarization is a stable Ito gradient. Brain injury floods the heart with catecholamines and alters repolarization globally.',
  con:['inflam','ito','insul','catechol'],pats:['peric','erp','effusion','cerebralT'],scn:['pericStages']},
 k:{name:'Potassium',sum:'One ion sets the resting potential of every cell.',intro:'Extracellular K⁺ sets resting membrane potential through the K⁺ gradient and changes K⁺ channel conductance directly. High K⁺ speeds repolarization (peaked T), depolarizes cells and inactivates Na⁺ channels (lost P, wide QRS, sine wave). Low K⁺ slows repolarization (flat T, U waves, long QU) and promotes afterdepolarizations.',
  con:['restK','naAvail','repol','mg'],pats:['hyperk1','hyperk','hyperk3','hyperk2','brash','hypok','hypok2','renal'],scn:['hyperK','hypoK'],labs:[['ap','Action potential lab'],['evo','Evolution']]},
 camg:{name:'Calcium and magnesium',sum:'The plateau and the pump.',intro:'Extracellular Ca²⁺ sets how long the phase 2 plateau lasts: high Ca²⁺ shortens the ST segment and low Ca²⁺ stretches it while leaving the T wave itself normal. Magnesium is the cofactor for the Na⁺/K⁺-ATPase and steadies Ca²⁺ channels: low Mg²⁺ wastes K⁺ and invites torsades.',
  con:['plateau','mg','ead','restK'],pats:['hyperca','hypoca','hypomg','renal'],labs:[['ap','Action potential lab']]},
 qt:{name:'Repolarization reserve: QT and torsades',sum:'Many small hits on phase 3.',intro:'Repolarization has redundancy (IKr, IKs, IK1). Drugs that block IKr, low K⁺ or Mg²⁺, bradycardia, female sex and genetics each remove some of that reserve. When enough is gone, the plateau lasts long enough for L-type Ca²⁺ channels to reopen: early afterdepolarizations and torsades.',
  con:['ikrBlock','ead','repol','mg','genetic'],pats:['lqt','lqt3','tdp','hypomg','shortqt'],scn:['qtDrug'],labs:[['ap','Action potential lab']]},
 tox:{name:'Drugs and toxins',sum:'Na⁺-channel block, pump inhibition and nodal depression.',intro:'Toxins act on the same proteins as physiology: Na⁺-channel blockers slow phase 0 (wide QRS, terminal R in aVR), digoxin inhibits the Na⁺/K⁺-ATPase (Ca²⁺ overload, triggered rhythms with nodal block), beta-blockers and calcium-channel blockers flatten phase 4 and slow the node.',
  con:['naBlock','digoxin','dad','decrem','auto'],pats:['tca','flec','dig','digtox','bidir','atblock'],scn:['tcaOD','digCourse']},
 temp:{name:'Temperature',sum:'Cold slows every channel and pump.',intro:'Hypothermia slows phase 4 (bradycardia), conduction (long PR and QRS) and repolarization (long QT), while the epicardial Ito notch persists and appears as the Osborn wave. Below about 30 °C the heart becomes irritable.',
  con:['temp','ito','auto'],pats:['hypothermia'],scn:['hypothermiaCourse']},
 tech:{name:'Signal, artifact and lead errors',sum:'Know when the tracing is lying.',intro:'Before any diagnosis, confirm the signal: electrode placement, reversal, filters and artifact. Most errors are predictable from Einthoven’s triangle and from the frequency content of noise versus cardiac signals.',
  con:['artifact','position'],pats:['artifact','tremor','cpr','lrrev','lallrev','rarl','vswap','v1v2high'],labs:[['sig','Signal & filters'],['lead','Leads & axis']]},
 synth:{name:'Putting it together',sum:'Every module, mixed, timed and evolving.',intro:'The capstone draws from every module: mixed diagnoses, measurements, mechanisms, decisions and evolution. It reflects how tracings arrive in practice: unlabeled, sometimes evolving, and needing a reason as well as a name.',
  con:['seq','injury','restK','reentry','naBlock'],pats:[],scn:[],labs:[['sys','Systematic read']]}};
MODS.synth.pats=[...new Set(Object.values(MODS).flatMap(m=>m.pats||[]))];MODS.synth.scn=[...SCNL];
const CORE={student:null,ems:['found','leads','auto','av','narrow','wide','pace','supply','omi','evol','k','tox','tech','synth'],icu:['found','leads','auto','av','ivc','narrow','wide','pace','supply','omi','evol','k','camg','qt','tox','temp','tech','synth'],tech:['found','leads','auto','av','ivc','narrow','wide','pace','supply','mass','tech','synth'],clin:null};

/* ---- application questions: what the finding means for the patient ---- */
function caseQ(pid,seed){seed=seed??Math.floor(Math.random()*1e9);const r=mkRand(seed+29),rec=generate(pid,seed),p=PM[pid];
  if(p.q2){const a=typeof p.q2.a==='function'?p.q2.a(rec):p.q2.a,ids=shuffle(p.q2.opts.map((o,i)=>i),r);return{kind:'case',pid,seed,rec,m:{type:'case',q:p.q2.q,opts:ids.map(i=>p.q2.opts[i]),short:ids.map(i=>p.q2.opts[i]),a:ids.indexOf(a),why:p.q2.why},chosen:null,hint:0}}
  const right=firstS(p.sig),pool=[...(p.sim||[]),...shuffle(P.map(x=>x.id),r)].filter(x=>x!==pid&&PM[x]&&firstS(PM[x].sig)!==right),d=[];for(const x of pool){const t=firstS(PM[x].sig);if(!d.includes(t))d.push(t);if(d.length===3)break}
  const opts=shuffle([right,...d],r);return{kind:'case',pid,seed,rec,m:{type:'sig',q:'Which statement best describes what this tracing means for the patient?',opts,short:opts,a:opts.indexOf(right),why:`<b>${p.name}.</b> ${p.sig}`},chosen:null,hint:0}}
function renderCase(q,card,answered){const m=q.m,p=PM[q.pid];let h='';
  if(!answered)h=`<div class="row" style="justify-content:space-between"><h2 style="max-width:72ch">${m.q}</h2><span class="pill">Apply</span></div><p class="lbl" style="text-transform:none;letter-spacing:0">Read the tracing first: the answer depends on what it shows.</p><div class="qgrid long">${m.opts.map((o,i)=>`<button class="opt" data-mi="${i}"><kbd>${i+1}</kbd><span>${o}</span></button>`).join('')}</div>`;
  else{const ok=q.chosen===m.a;h=`<div class="verdict ${ok?'ok':'no'}">${ok?'Correct':q.chosen===-1?'Time ran out':'Not quite'}<span style="color:var(--ink);font-weight:500"> · ${p.name}</span><span class="pill">Apply</span></div><h2 style="max-width:72ch">${m.q}</h2>
    <div class="qgrid long">${m.opts.map((o,i)=>`<div class="opt ${i===m.a?'ok':i===q.chosen?'no':''}" style="opacity:${i===m.a||i===q.chosen?1:.55}"><span>${o}</span></div>`).join('')}</div><div class="note">${m.why}</div>
    ${p.mech?`<div class="stack" style="gap:8px"><h3>Why it looks this way</h3><p style="margin:0">${p.mech}</p>${conChips(p.con).replace('class="conwrap stack"',`class="conwrap stack" data-from="${q.pid}"`)}</div>`:''}
    <div class="row"><button class="btn primary" id="qNext">Next (N)</button><button class="btn" id="qAtlas">Open in Atlas</button></div>`}
  card.innerHTML=h;$$('.opt[data-mi]',card).forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.mi)));const nb=$('#qNext',card);if(nb)nb.addEventListener('click',next);const ab=$('#qAtlas',card);if(ab)ab.addEventListener('click',()=>openAtlas(q.pid,q.seed))}
function mechQ(pid,type,seed){seed=seed??Math.floor(Math.random()*1e9);const r=mkRand(seed+3),rec=generate(pid,seed),m=makeMech(rec,r,type);return m?{kind:'mech',pid,seed,rec,m,chosen:null,hint:0}:null}

/* ---- stage question makers ---- */
function pickItem(list,prefix,used){const d=LRN&&DB.srs?DB.srs:{},t=Date.now();const w=list.map(x=>{const it=d[prefix+x];let v=it?(it.b<2?3:it.due<=t?2:1/(1+it.b)):2.5;if(used&&used.has(x))v*=.08;return v});let s=w.reduce((a,b)=>a+b,0)*Math.random();for(let i=0;i<list.length;i++){s-=w[i];if(s<=0)return list[i]}return list[0]}
function anaQ(pid,r){const kinds=['meas','meas'];if(typeof leadQ==='function'&&leadQ.can(pid))kinds.push('lead','lead');if(typeof wctQ==='function'&&wctQ.can(pid))kinds.push('wct','wct');const k=kinds[Math.floor(r.u()*kinds.length)];
  if(k==='lead'){const q=leadQ(pid);if(q)return q}if(k==='wct'){const q=wctQ(pid);if(q)return q}const q=newQ(pid,'meas');return q.kind==='meas'?q:null}
function cumulPats(mid){const all=[...(MODS[mid].pats||[])],d=DB.path||{};Object.keys(MODS).forEach(m=>{if(m!==mid&&m!=='synth'&&d[m]&&d[m].rec&&d[m].rec.done)all.push(...(MODS[m].pats||[]))});return[...new Set(all)]}
function stageQ(mid,sk,i,sess){const m=MODS[mid],r=mkRand(Date.now()+i*977),used=sess.used||(sess.used=new Set()),pats=m.pats||[],take=(list,pre)=>{const x=pickItem(list,pre,used);used.add(x);return x};
  const withDiff=(d,f)=>{const o=S.diff;S.diff=d;try{return f()}finally{S.diff=o}};
  if(sk==='mech'){for(let k=0;k<6;k++){const q=mechQ(take(pats,'mech:'),'why');if(q)return q}return null}
  if(sk==='rec')return newQ(take(pats,'dx:'),'dx');
  if(sk==='ana'){for(let k=0;k<8;k++){const q=anaQ(take(pats,'meas:'),r);if(q)return q}return newQ(take(pats,'dx:'),'dx')}
  if(sk==='app')return caseQ(take(pats,'case:'));
  if(sk==='int'){const scn=(m.scn||[]),mode=i%3;
    if(mode===0&&scn.length){const s=scn[Math.floor(r.u()*scn.length)];return newTrajQ(Math.floor(Math.random()*1e9),null,s)}
    if(mode<=1){for(let k=0;k<6;k++){const q=mechQ(take(pats,'mech:'),'link');if(q&&q.m.type==='link')return q}}
    return withDiff('hard',()=>newQ(take(pats,'dx:'),'dx'))}
  if(sk==='mas'){const pool=cumulPats(mid),own=pats,src=r.u()<.6?own:pool,pid=take(src.length?src:own,'dx:'),k=['dx','dx','meas','mech','case','traj'][i%6];
    if(k==='traj'){const scn=m.scn&&m.scn.length?m.scn:null;return newTrajQ(Math.floor(Math.random()*1e9),null,scn?scn[Math.floor(r.u()*scn.length)]:null)}
    if(k==='case')return caseQ(pid);if(k==='mech'){const q=mechQ(pid,'why');if(q)return q}if(k==='meas'){const q=newQ(pid,'meas');if(q.kind==='meas')return q}return withDiff('hard',()=>newQ(pid,'dx'))}
  return null}
function reviewQ(key){const[k,id]=key.split(':');if(k==='traj')return SCN[id]?newTrajQ(Math.floor(Math.random()*1e9),null,id):null;if(!PM[id])return null;
  if(k==='mech')return mechQ(id,'why')||newQ(id,'dx');if(k==='case')return caseQ(id);if(k==='meas'){const q=newQ(id,'meas');return q}if(k==='lead'&&typeof leadQ==='function'){const q=leadQ(id);if(q)return q}return newQ(id,'dx')}
const qLabel=q=>{const n=q.pid&&PM[q.pid]?PM[q.pid].name:'';if(q.kind==='traj')return`${TT[q.tt]} · ${q.scn?SCN[q.scn].name:'stable pattern'}`;if(q.kind==='mech')return`${q.m.type==='why'?'Mechanism':'Integration'} · ${n}`;if(q.kind==='meas')return`${MT[q.m.type]} · ${n}`;if(q.kind==='case')return`Apply · ${n}`;if(q.kind==='lead')return`Leads · ${n}`;if(q.kind==='wct')return`Algorithm · ${n}`;return n};

/* ---- adapter for the shared path engine ---- */
const LCFG={app:'ecg',key:'ecgrr.v1',other:{key:'eegrr.v1',name:'EEG Reading Room',href:'../'},tracks:TRACKS,mods:MODS,core:CORE,
 db:()=>DB,save:()=>store.save(DB),patName:id=>PM[id]?PM[id].name:id,scnName:id=>SCN[id]?SCN[id].name:id,conName:c=>CON[c]?CON[c].n:c,conText:c=>CON[c]?CON[c].s:'',conLab:c=>CON[c]&&CON[c].lab,
 keysOf:q=>{if(q.kind==='traj')return q.scn?['traj:'+q.scn]:[];if(!q.pid)return[];return[{dx:'dx',mech:'mech',meas:'meas',case:'case',lead:'lead',wct:'meas'}[q.kind]+':'+q.pid]},
 validKey:k=>{const[a,b]=k.split(':');return a==='traj'?!!SCN[b]:!!PM[b]},label:qLabel,stageQ,reviewQ,
 beginSession:()=>{S.exam=null;S.drill=null;$('#qDrill').hidden=true},
 show:q=>{setTab('quiz');$('#qIntro').hidden=true;$('#qStage').hidden=false;$('#qMeta').hidden=false;showQ(q);window.scrollTo({top:0})},
 timeout:q=>{if(q.chosen!==null&&q.chosen!==undefined)return;if(q.kind==='dx')choose('__timeout__');else if(q.kind==='traj'&&q.tt==='seq')choose([]);else choose(-1)},
 showResult:(html,cb)=>{setTab('quiz');S.q=null;$('#qIntro').hidden=true;$('#qStage').hidden=false;$('#qViewer').hidden=true;$('#qMeta').hidden=true;const c=$('#qCard');c.innerHTML=html;$$('[data-lrn]',c).forEach(b=>b.addEventListener('click',()=>{$('#qViewer').hidden=false;$('#qMeta').hidden=false;cb(b.dataset.lrn)}));window.scrollTo({top:0})},
 openPath:mid=>{setTab('path');if(mid){const b=$(`#tab-path [data-mid="${mid}"]`);if(b)b.click()}},openScn:id=>openEvo(id,1),
 openSection:k=>{if(['ap','cond','cor'].includes(k))openLab(k);else{setTab('atlas');setSub(k)}},
 redraw:()=>{if(!$('#tab-path').hidden)LRN.render($('#tab-path'));if(S.q)qViewer.draw();if(!$('#tab-atlas').hidden)redrawSub()}};
