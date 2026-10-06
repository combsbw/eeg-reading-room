/* ============ backgrounds ============ */
function awakeBg(R,r,o={}){
  addBg(R,r,{rms:o.rms??3,lo:1,hi:25});
  const P=phaseOf(r,o.f??r.r(9.5,10.5)),env=mul(waxwane(r,.45),o.win||ones());
  addOsc(R,W.post.map((v,i)=>v*(XX[i]>0?1.06:1)),P,env,o.A??40,1.0);
  addBand(R,r,W.ant,14,28,o.beta??3,waxwane(r,.4));
  if(o.theta)addBand(R,r,W.all,4,7,o.theta,o.thetaEnv)}
const blinkW=blob(0,1.15,.5);
function blinks(R,r,times,amp=110){ev(R,r,times,T.blink,blinkW,amp,{span:.7,jit:.15})}

