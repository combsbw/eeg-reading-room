/* ============ storage ============ */
const KEY='eegrr.v1';
const LISTS=['answers','locs','exams','mech','meas','q2','traj','desc','bgr'];
const store={load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Array.isArray(s.answers)){LISTS.forEach(k=>s[k]=s[k]||[]);s.path=s.path||{};return s}}catch(_){}const o={path:{},best:0};LISTS.forEach(k=>o[k]=[]);return o},
  save(s){try{s.answers=s.answers.slice(-900);s.locs=s.locs.slice(-400);['mech','meas','q2','traj','desc','bgr'].forEach(k=>s[k]=(s[k]||[]).slice(-600));localStorage.setItem(KEY,JSON.stringify(s))}catch(_){}}};
let DB=store.load();
function patStats(){const o={};P.forEach(p=>o[p.id]={n:0,ok:0});DB.answers.forEach(a=>{const s=o[a.pid];if(s){s.n++;if(a.ok)s.ok++}});return o}
