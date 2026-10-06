
/* ============ mechanism lab: conduction system animator ============ */
const CONDMODES=[['nsr','Normal sinus'],['avb1','First-degree block'],['wenck','Mobitz I'],['mob2','Mobitz II'],['avb3','Complete block'],['rbbb','RBBB'],['lbbb','LBBB'],['lafb','LAFB'],['wpw','WPW'],['pac','PAC'],['junct','Junctional'],['svt','AVNRT'],['flutter','Atrial flutter'],['af','Atrial fibrillation'],['pvc','PVC'],['vt','Ventricular tachycardia'],['vpace','Paced']];
const CONDTXT={nsr:'The SA node fires (automaticity: phase 4 depolarization through If channels). Atrial muscle conducts quickly (P wave). The AV node conducts slowly because its upstroke depends on Ca²⁺ channels, not Na⁺: that delay is the PR segment and lets the atria finish filling the ventricles. His–Purkinje fibers conduct fast (Na⁺-dependent) and activate the septum left-to-right first, then both ventricles from endocardium outward (QRS).',
 avb1:'Same sequence, but the AV node conducts more slowly (vagal tone, AV-nodal drugs, ischemia): a long PR with every impulse still arriving.',
 wenck:'Decremental conduction: each impulse reaches the AV node earlier in its recovery, so it conducts a little more slowly, until one fails. The pause lets the node recover. This is a property of Ca²⁺-dependent nodal tissue.',
 mob2:'His–Purkinje tissue is all-or-none (Na⁺-dependent): it conducts at a fixed speed or not at all. Diseased infranodal tissue drops beats suddenly with no PR warning, and the QRS is often already wide.',
 avb3:'Nothing crosses. The atria follow the SA node; the ventricles follow the fastest surviving subsidiary pacemaker: junctional (40–60, narrow) or ventricular (20–40, wide). Lower pacemakers have slower phase 4 depolarization.',
 rbbb:'The right bundle fails. The left side activates normally, then the impulse crosses the septum muscle-to-muscle (slowly) to reach the right ventricle late. Those late, unopposed rightward-anterior forces write R′ in V1 and wide S in I and V6.',
 lbbb:'The left bundle fails. The septum activates right-to-left (no septal q in I and V6), and the left ventricle is reached late through muscle: a broad, notched R in the lateral leads and deep S in V1.',
 lafb:'The anterior fascicle fails. The left ventricle is activated first through the posterior fascicle (inferior), then upward and leftward late: left axis deviation, qR in aVL and rS inferiorly.',
 wpw:'An accessory pathway (here left lateral) is fast muscle tissue without decremental delay. It reaches the ventricle before the AV node does: short PR and a slurred delta wave, then fusion with normal activation.',
 pac:'An irritable atrial focus fires early, so the P wave has a different shape. The impulse resets the SA node, so the next beat is not fully compensated.',
 junct:'The SA node is quiet or slow; the AV junction takes over at its intrinsic 40–60/min. Atria are activated backward (retrograde P, inverted in II, III, aVF) at the same time as the ventricles.',
 svt:'AV-nodal re-entry: two pathways in the node (slow and fast) form a circuit. The impulse circles, sending a wave down to the ventricles and up to the atria at the same moment, so the P hides at the end of the QRS.',
 flutter:'A macro-reentrant wave circles the right atrium around the tricuspid annulus about 300 times a minute. The AV node lets every second (or fourth) wave through, protecting the ventricles.',
 af:'Many wavelets wander chaotically through both atria at 350–600/min. The AV node receives impulses at random and conducts some of them: an irregularly irregular ventricular response.',
 pvc:'A ventricular focus fires early and spreads muscle-to-muscle rather than through Purkinje fibers: slow, wide, bizarre QRS with discordant ST-T. The sinus P still fires on time but meets refractory tissue.',
 vt:'A re-entrant circuit around ventricular scar drives the ventricles fast. The atria keep their own rhythm (AV dissociation); a well-timed sinus impulse can occasionally capture the ventricles through the normal system.',
 vpace:'A pacing lead in the right ventricle delivers the stimulus. Activation spreads from the RV apex through muscle: wide, LBBB-like QRS with a superior axis.'};
function condIntervals(R){const id=R.pid,I=[],add=(k,a,b,kind='d')=>I.push({k,a,b,kind});const qd=q=>q.m&&q.m.qrsd?q.m.qrsd:.1,qtt=q=>q.m&&q.m.qt?q.m.qt:.38;
  R.ev.p.forEach((p,i)=>{if(id==='af')return;const ect=p.k&&p.k!=='s'&&p.k!=='r';if(p.k==='r'){add('RA',p.t,p.t+.07);add('LA',p.t+.02,p.t+.09);return}
    if(!ect&&id!=='flutter')add('SA',p.t-.015,p.t+.01);if(ect&&id!=='flutter')add('AF',p.t-.01,p.t+.02);add('RA',p.t,p.t+.07);add('LA',p.t+.03,p.t+.1);
    const q=R.ev.q.find(q=>q.from===i);if(q){add('AVN',p.t+.05,q.t-.045);if(id==='wpw'){add('AP',p.t+.04,q.t+.005)}add('HIS',q.t-.045,q.t-.03)}
    else if(R.meta.prq!=='none'){const blkHis=id==='mob2'||(id==='avb21'&&R.tm&&R.tm.vm.qrsd>.12);add('AVN',p.t+.05,p.t+(blkHis?.15:.22));if(blkHis)add('HIS',p.t+.15,p.t+.4,'b');else add('AVN',p.t+.2,p.t+.42,'b')}});
  R.ev.q.forEach(q=>{const d=qd(q),qt=qtt(q),t=q.t;if(q.k==='s')return;
    if(q.k==='v'){add('FOC',t-.01,t+.02);add('LV',t+.0,t+d);add('RV',t+.03,t+d);add('SEP',t+.03,t+d*.8);add('VREP',t+d,t+qt,'p');return}
    if(q.k==='p'){add('PACE',t-.005,t+.01);add('RV',t,t+d*.8);add('SEP',t+.03,t+d*.85);add('LV',t+.04,t+d);add('VREP',t+d,t+qt,'p');return}
    if(q.from==null&&!['af','flutter','svt','junct'].includes(id)&&id!=='avb3'){}
    if(id==='svt')add('LOOP',t-.06,t+.02);
    if(q.from==null&&['junct','avb3','svt','flutter','af'].includes(id)){add('AVN',t-.05,t-.04);add('HIS',t-.04,t-.03)}
    if(id==='junct'||id==='svt'){add('RA',t+.0,t+.06);add('LA',t+.02,t+.08)}
    const rb=id!=='rbbb'&&id!=='mob2'&&id!=='bifasc',lb=id!=='lbbb',laf=lb&&id!=='lafb'&&id!=='bifasc',lpf=lb&&id!=='lpfb';
    if(rb)add('RBB',t-.03,t);else add('RBB',t-.03,t+d,'b');if(lb){add('LBB',t-.03,t-.012);if(laf)add('LAF',t-.015,t+.01);else add('LAF',t-.015,t+d,'b');if(lpf)add('LPF',t-.015,t+.01);else add('LPF',t-.015,t+d,'b')}else add('LBB',t-.03,t+d,'b');
    add('PK',t-.01,t+.035);
    if(id==='wpw'){add('LVL',t,t+.05);add('SEP',t+.03,t+.06);add('LV',t+.03,t+d);add('RV',t+.035,t+d*.85)}
    else if(id==='lbbb'){add('SEP',t,t+.05);add('RV',t+.01,t+.05);add('LV',t+.05,t+d)}
    else if(!rb){add('SEP',t,t+.025);add('LV',t+.01,t+.07);add('RV',t+.06,t+d)}
    else if(!laf){add('SEP',t,t+.025);add('LV',t+.015,t+.05);add('LVS',t+.05,t+d);add('RV',t+.015,t+.06)}
    else{add('SEP',t,t+.025);add('LV',t+.015,t+d);add('RV',t+.015,t+d*.8)}
    add('VREP',t+d,t+qt,'p')});
  return I}
function buildCondLab(host){const st={id:'nsr',rate:.35,t:0,play:true,rec:null,I:[],last:0};
  const c=el('div','card stack',`<div class="row" style="justify-content:space-between"><h2>Conduction system: where the impulse is, beat by beat</h2><div class="row" id="cdCtl"></div></div>
   <div class="row" id="cdModes"></div><div class="lead2"><div><svg id="cdSvg" viewBox="0 0 400 360" role="img" aria-label="Heart conduction system" style="width:100%;max-width:440px;display:block;margin:auto"></svg><div class="row" style="gap:6px 14px;justify-content:center;font-size:12px" id="cdLeg"></div></div><div class="stack" style="gap:10px;min-width:0"><p id="cdTx"></p><div class="note" id="cdNow"></div></div></div>
   <div class="vwrap" style="position:relative"><div class="vscroll" id="cdStrip" style="position:relative"></div></div>`);host.appendChild(c);
  const ctl=$('#cdCtl',c),pb=el('button','btn small','Pause');pb.type='button';pb.addEventListener('click',()=>{st.play=!st.play;pb.textContent=st.play?'Pause':'Play';st.last=performance.now()});ctl.appendChild(pb);
  segment(ctl,[['.15','0.15×'],['.35','0.35×'],['1','1×']],'.35',v=>st.rate=+v);
  CONDMODES.forEach(([k,t])=>{const b=el('button','chip',t);b.type='button';b.setAttribute('aria-pressed',String(k===st.id));b.addEventListener('click',()=>{st.id=k;$$('#cdModes .chip',c).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));load()});$('#cdModes',c).appendChild(b)});
  $('#cdLeg',c).innerHTML=[['var(--accent)','Depolarizing'],['color-mix(in srgb,var(--accent) 30%,var(--soft))','Plateau / refractory'],['var(--bad)','Blocked']].map(([col,t])=>`<span><i class="dot" style="background:${col}"></i>${t}</span>`).join('');
  const cv=el('canvas');$('#cdStrip',c).appendChild(cv);const cur=el('div','cdcur');$('#cdStrip',c).appendChild(cur);let geo=null;
  $('#cdStrip',c).addEventListener('pointerdown',e=>{if(!geo)return;const b=cv.getBoundingClientRect();st.t=clamp(((e.clientX-b.left)/geo.pm-geo.LM)/geo.s,0,DUR)});
  const svg=$('#cdSvg',c);
  svg.innerHTML=`<g id="cdBase" stroke="var(--muted)" stroke-width="1.5">
   <path id="r-RA" d="M70 120 C60 70 110 45 160 55 C200 62 205 110 195 150 C170 172 110 175 82 155 Z"/>
   <path id="r-LA" d="M210 70 C230 40 300 40 330 70 C345 95 330 140 300 150 C260 158 215 150 210 130 Z"/>
   <path id="r-RV" d="M85 175 C110 170 175 172 200 178 L208 315 C180 330 130 300 105 260 C90 235 82 200 85 175 Z"/>
   <path id="r-LV" d="M212 178 C250 170 320 168 335 185 C350 240 300 320 230 335 L212 320 Z"/>
   <path id="r-LVS" d="M235 182 C270 176 315 175 330 188 C334 205 333 220 328 232 L240 215 Z" stroke="none"/>
   <path id="r-LVL" d="M300 172 C320 172 335 180 338 196 C340 225 332 250 318 265 L298 235 Z" stroke="none"/>
   <path id="r-SEP" d="M198 178 L214 178 L218 318 L206 322 Z"/></g>
   <g id="cdCond" fill="none" stroke-linecap="round">
   <circle id="r-SA" cx="105" cy="64" r="9"/><circle id="r-AF" cx="280" cy="62" r="7"/><ellipse id="r-AVN" cx="203" cy="163" rx="12" ry="8"/>
   <path id="r-HIS" d="M204 171 L206 196" stroke-width="5"/><path id="r-RBB" d="M204 196 L196 255 L180 296 L160 302" stroke-width="4"/>
   <path id="r-LBB" d="M208 196 L218 214" stroke-width="5"/><path id="r-LAF" d="M218 214 L255 228 L292 214" stroke-width="4"/><path id="r-LPF" d="M218 214 L238 268 L268 300" stroke-width="4"/>
   <path id="r-PK" d="M160 302 L140 285 M160 302 L150 318 M292 214 L312 232 M292 214 L305 195 M268 300 L295 292 M268 300 L262 320" stroke-width="2"/>
   <path id="r-AP" d="M318 140 L322 176" stroke-width="5"/><circle id="r-FOC" cx="285" cy="282" r="9"/><circle id="r-PACE" cx="150" cy="298" r="7"/>
   <ellipse id="r-LOOP" cx="203" cy="163" rx="20" ry="13" stroke-dasharray="4 3" stroke-width="2.5"/><ellipse id="r-FLUT" cx="140" cy="135" rx="42" ry="26" stroke-dasharray="6 4" stroke-width="2.5"/><circle id="r-FDOT" r="6"/>
   </g><g font-family="var(--font-ui)" font-size="11" fill="var(--muted)"><text x="40" y="40">SA node</text><text x="222" y="160">AV node</text><text x="210" y="205" text-anchor="start" dx="12">His</text><text x="96" y="110">RA</text><text x="282" y="110">LA</text><text x="120" y="240">RV</text><text x="272" y="262">LV</text><text x="118" y="322">RBB</text><text x="296" y="210">LAF</text><text x="240" y="314">LPF</text></g>`;
  function load(){st.rec=generate(st.id,4242+CONDMODES.findIndex(m=>m[0]===st.id));st.I=condIntervals(st.rec);st.t=0;$('#cdTx',c).innerHTML=`<b>${CONDMODES.find(m=>m[0]===st.id)[1]}.</b> ${CONDTXT[st.id]}`;drawS()}
  function drawS(){const d=stripLead(st.rec,'II');geo=drawStrip(cv,[{data:d,label:'II'}],{t0:0,dur:DUR,rowMM:26,foot:'Tap the strip to jump'})}
  const show=(id,on)=>{const e=$('#r-'+id,svg);if(e)e.style.display=on?'':'none'};
  function paint(){const C=cssx(),t=st.t,act={},blk={};st.I.forEach(iv=>{if(t>=iv.a&&t<=iv.b){if(iv.kind==='b')blk[iv.k]=1;else act[iv.k]=Math.max(act[iv.k]||0,iv.kind==='p'?.3:1)}});
    const vrep=act.VREP;if(st.id!=='lafb'&&act.LV)act.LVS=Math.max(act.LVS||0,act.LV);if(act.LV)act.LVL=Math.max(act.LVL||0,act.LV);['RA','LA','RV','LV','SEP','LVS','LVL'].forEach(k=>{const e=$('#r-'+k,svg);let a=act[k]||((['RV','LV','SEP','LVS','LVL'].includes(k)&&vrep)?.28:0);if(st.id==='af'&&(k==='RA'||k==='LA'))a=.25+.55*Math.abs(Math.sin(t*37+(k==='LA'?1.7:0))*Math.sin(t*23.3));e.style.fill=a?`color-mix(in srgb,var(--accent) ${Math.round(a*85)}%,var(--soft))`:'var(--soft)';e.style.stroke=k==='LVS'||k==='LVL'?'none':'var(--muted)'});
    ['SA','AF','AVN','HIS','RBB','LBB','LAF','LPF','PK','AP','FOC','PACE','LOOP'].forEach(k=>{const e=$('#r-'+k,svg),on=act[k],b=blk[k],isC=e.tagName==='circle'||e.tagName==='ellipse';e.style.stroke=b?'var(--bad)':on?'var(--accent)':'var(--muted)';if(isC&&k!=='LOOP')e.style.fill=b?'var(--bad)':on?'var(--accent)':'var(--panel)';e.style.opacity=on||b?1:.55});
    show('AP',st.id==='wpw');show('FOC',['pvc','vt'].includes(st.id));show('PACE',st.id==='vpace');show('LOOP',st.id==='svt');show('FLUT',st.id==='flutter');show('FDOT',st.id==='flutter');show('AF',['pac'].includes(st.id));
    if(st.id==='flutter'){const per=60/(st.rec.meta.arate||300),ph=(t%per)/per*2*Math.PI,e=$('#r-FDOT',svg);e.setAttribute('cx',140+42*Math.cos(-ph));e.setAttribute('cy',135+26*Math.sin(-ph));e.style.fill='var(--accent)';$('#r-FLUT',svg).style.stroke='var(--accent)'}
    if(geo){cur.style.transform=`translateX(${geo.X(t)}px)`;cur.style.height=geo.H+'px'}
    const now=Object.keys(act).filter(k=>act[k]===1),names={SA:'SA node',AF:'ectopic atrial focus',RA:'right atrium',LA:'left atrium',AVN:'AV node',HIS:'His bundle',RBB:'right bundle',LBB:'left bundle',LAF:'anterior fascicle',LPF:'posterior fascicle',PK:'Purkinje fibers',SEP:'septum',RV:'right ventricle',LV:'left ventricle',LVS:'superior LV wall',LVL:'lateral LV wall',AP:'accessory pathway',FOC:'ventricular focus',PACE:'pacing lead',LOOP:'re-entry circuit in the AV node'};
    $('#cdNow',c).innerHTML=`<b>${t.toFixed(2)} s:</b> ${now.length?'depolarizing: '+now.map(k=>names[k]).filter(Boolean).join(', '):act.VREP?'ventricles repolarizing (ST–T)':'electrical diastole'}${Object.keys(blk).length?' · <b style="color:var(--bad)">blocked at '+Object.keys(blk).map(k=>names[k]).join(', ')+'</b>':''}`}
  function loop(now){if(!c.isConnected)return;if(c.offsetParent!==null){if(st.play){const dt=Math.min(.05,(now-(st.last||now))/1000);st.t+=dt*st.rate;if(st.t>DUR)st.t=0}paint()}st.last=now;requestAnimationFrame(loop)}
  load();requestAnimationFrame(loop);return{draw:()=>{drawS();paint()}}}
