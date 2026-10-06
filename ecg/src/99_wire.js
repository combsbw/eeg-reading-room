/* ============ tabs & atlas sub-sections ============ */
const SUBS={evo:buildEvo,mech:buildMech,sys:buildSys,lead:buildLead,rate:buildRate,sig:buildSig,hrv:h=>buildHrv(h||$('#aHrv')),case:h=>buildCase(h||$('#aCase'))},SID={pat:'#aPat',evo:'#aEvo',mech:'#aMech',sys:'#aSys',lead:'#aLead',rate:'#aRate',sig:'#aSig',hrv:'#aHrv',case:'#aCase'};
function redrawSub(){if(AX.cur==='pat'){aViewer.draw();return}(AX.draws[AX.cur]||[]).forEach(f=>f())}
function setSub(s){AX.cur=s;$$('#aSub button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sub===s)));Object.keys(SID).forEach(k=>$(SID[k]).hidden=k!==s);
  if(s!=='pat'&&!AX.built[s]){AX.built[s]=1;SUBS[s]($(SID[s]))}if(s==='pat'&&!aCur)showAtlas('nsr');redrawSub()}
$$('#aSub button').forEach(b=>b.addEventListener('click',()=>setSub(b.dataset.sub)));
let rzT=0;const rzF=()=>{cancelAnimationFrame(rzT);rzT=requestAnimationFrame(()=>{if(!$('#tab-atlas').hidden)redrawSub()})};
if(window.ResizeObserver)new ResizeObserver(rzF).observe($('#tab-atlas'));window.addEventListener('resize',rzF);
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{rzF();if(S.q)qViewer.draw()})}catch(_){}
function setTab(t){$$('.tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));['path','quiz','atlas','dash'].forEach(k=>$('#tab-'+k).hidden=k!==t);if(t==='path')LRN.render($('#tab-path'));
  if(t==='dash')renderDash();if(t==='atlas'){if(!aCur&&AX.cur==='pat')showAtlas('nsr');setTimeout(redrawSub,0)}if(t==='quiz')setTimeout(()=>qViewer.draw(),0);
  try{history.replaceState(null,'','#'+t)}catch(_){}}
$$('.tabs button').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
buildAtlasList();
LRN.applySettings();const h0=(location.hash||'').slice(1),hs=h0.split('/');if(['path','quiz','atlas','dash'].includes(hs[0]))setTab(hs[0]);else setTab('path');if(hs[0]==='atlas'&&SUBS[hs[1]])setSub(hs[1]);
window.__ecg={showQ,leadQ,wctQ,readQ,alarmQ,wctFeat,wctSteps,leadSets,LRN,MODS,stageQ,caseQ,SCN,SCNL,scnRec,newTrajQ,openEvo,diffSummary,GEN,generate,P,PM,CON,CIDX,makeMech,mkRand,DB:()=>DB,setTab,setSub,showAtlas,S,newQ,measOptions,showRec:(pid,seed)=>{const rec=generate(pid,seed??1);aViewer.setRec(rec);aViewer.setAnn(true);return{meta:rec.meta,ann:rec.ann.length}}};
})();
