/* ============ storage ============ */
const KEY='eegrr.v1';
const store={load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Array.isArray(s.answers))return s}catch(_){}return{answers:[],locs:[],exams:[],best:0}},
  save(s){try{s.answers=s.answers.slice(-600);s.locs=s.locs.slice(-300);localStorage.setItem(KEY,JSON.stringify(s))}catch(_){}}};
let DB=store.load();
function patStats(){const o={};P.forEach(p=>o[p.id]={n:0,ok:0});DB.answers.forEach(a=>{const s=o[a.pid];if(s){s.n++;if(a.ok)s.ok++}});return o}

