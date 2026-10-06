(()=>{
'use strict';
/* ============ constants & helpers ============ */
const FS=200,DUR=10,N=FS*DUR;
const $=(s,p=document)=>p.querySelector(s),$$=(s,p=document)=>[...p.querySelectorAll(s)];
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ss=x=>x*x*(3-2*x);
const g=(t,s)=>Math.exp(-t*t/(2*s*s));
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function mkRand(seed){const u=mulberry(seed>>>0);return{u,n(){let a=0;while(a===0)a=u();return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*u())},r(a,b){return a+(b-a)*u()},pick(a){return a[Math.floor(u()*a.length)]},chance(p){return u()<p}}}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r.u()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

