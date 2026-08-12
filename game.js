const COLORS=["red","green","yellow","blue"];
const LABEL={red:"RED",green:"GREEN",yellow:"YELLOW",blue:"BLUE"};
const START={red:0,green:13,yellow:26,blue:39};
const DIE=["","1","2","3","4","5","6"];
const TRACK=[
 [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],
 [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
 [7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],
 [14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],
 [8,1],[8,0],[7,0]
];
const SAFE=[0,8,13,21,26,34,39,47];
const LANES={
 red:[[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
 green:[[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
 yellow:[[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
 blue:[[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]]
};
const YARD={
 red:[[2,2],[4,2],[2,4],[4,4]],
 green:[[11,2],[13,2],[11,4],[13,4]],
 yellow:[[11,11],[13,11],[11,13],[13,13]],
 blue:[[2,11],[4,11],[2,13],[4,13]]
};
const $=id=>document.getElementById(id);
const DICE_PIPS={1:[4],2:[1,9],3:[1,4,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
function setDiceFace(value){
 const face=$("diceFront"); if(!face)return;
 face.innerHTML="";
 (DICE_PIPS[value]||DICE_PIPS[1]).forEach(n=>{
  const pip=document.createElement("span");
  pip.className="dice-pip";
  pip.style.gridColumn=String(((n-1)%3)+1);
  pip.style.gridRow=String(Math.floor((n-1)/3)+1);
  face.appendChild(pip);
 });
 const cube=$("diceCube");
 const transforms={1:"rotateX(-18deg) rotateY(24deg)",2:"rotateX(-18deg) rotateY(-66deg)",3:"rotateX(-108deg) rotateY(24deg)",4:"rotateX(-18deg) rotateY(114deg)",5:"rotateX(72deg) rotateY(24deg)",6:"rotateX(-18deg) rotateY(204deg)"};
 if(cube&&value>=1)cube.style.transform=transforms[value];
}
const S={type:"classic",count:2,turn:0,dice:1,rolling:false,sound:true,vibration:true,computer:false,
 players:COLORS.map((color,i)=>({color,name:"Player "+(i+1),ai:false,t:[-1,-1,-1,-1],home:0}))};

function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove("show"),1700)}
function vibrate(n=30){if(S.vibration&&navigator.vibrate)navigator.vibrate(n)}
function beep(freq=560){if(!S.sound)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const a=new A(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;g.gain.value=.035;o.connect(g);g.connect(a.destination);o.start();setTimeout(()=>{o.stop();a.close()},90)}catch(e){}}
function show(id){["home","setup","game"].forEach(x=>$(x).classList.toggle("hidden",x!==id));window.scrollTo(0,0)}
function tokensPerPlayer(){return S.type==="quick"?1:4}

function openSetup(mode){
 S.computer=mode==="computer"; S.type=mode==="quick"?"quick":"classic"; S.count=mode==="computer"?2:2;
 show("setup"); renderEditor();
}
function renderEditor(){
 document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.type===S.type));
 document.querySelectorAll(".count").forEach(b=>{b.classList.toggle("active",+b.dataset.count===S.count);b.disabled=S.type==="team"});
 if(S.type==="team")S.count=4;
 const box=$("playerEditor");box.innerHTML="";
 for(let i=0;i<S.count;i++){
   const p=S.players[i];p.ai=S.computer&&i===1;
   const disabled=p.ai?"disabled":"";
   box.insertAdjacentHTML("beforeend",`<div class="editor"><span class="color-dot" style="background:var(--${p.color})"></span><input data-name="${i}" maxlength="14" value="${escapeHtml(p.name)}" ${disabled}><span>${p.ai?"🤖":"👤"}</span></div>`);
 }
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function buildBoard(){
 const track=$("track");track.innerHTML="";
 TRACK.forEach((q,i)=>{
   const d=document.createElement("div");d.className="track-cell";
   if(SAFE.includes(i)){d.classList.add("safe");d.textContent="★"}
   d.style.left=(q[1]/15*100)+"%";d.style.top=(q[0]/15*100)+"%";track.appendChild(d);
 });
 const lanes=$("lanes");lanes.innerHTML="";
 COLORS.forEach(c=>LANES[c].forEach(q=>{
   const d=document.createElement("div");d.className=`lane-cell ${c}`;
   d.style.left=(q[1]/15*100)+"%";d.style.top=(q[0]/15*100)+"%";lanes.appendChild(d);
 }));
}
function posToPercent(color,pos,index){
 if(pos<0){const q=YARD[color][index];return{x:(q[1]+.5)/15*100,y:(q[0]+.5)/15*100}}
 if(pos>=52){const q=LANES[color][Math.min(5,pos-52)];return{x:(q[1]+.5)/15*100,y:(q[0]+.5)/15*100}}
 const q=TRACK[(START[color]+pos)%52];return{x:(q[1]+.5)/15*100,y:(q[0]+.5)/15*100}
}
function canMove(p,i,d){
 const limit=57;
 if(i>=tokensPerPlayer()||p.t[i]===57)return false;
 if(p.t[i]<0)return d===6;
 return p.t[i]+d<=limit;
}
function render(){
 const p=S.players[S.turn],used=tokensPerPlayer();
 $("turnName").textContent=LABEL[p.color];
 $("turnPill").textContent=p.ai?"🤖":"●";
 setDiceFace(S.dice);
 $("roll").disabled=S.rolling||p.ai;
 $("gameMsg").textContent=S.rolling?`${p.name} — TAP A GLOWING TOKEN`:p.ai?`${p.name} is thinking…`:`${p.name}'s turn — roll the dice`;
 const layer=$("tokens");layer.innerHTML="";
 S.players.slice(0,S.count).forEach((pl,pi)=>{
   for(let i=0;i<4;i++){
     const b=document.createElement("button");b.className=`token ${pl.color}`;b.type="button";
     if(i>=used)b.style.display="none";
     const q=posToPercent(pl.color,pl.t[i],i);b.style.left=q.x+"%";b.style.top=q.y+"%";
     if(pi===S.turn&&S.rolling&&canMove(pl,i,S.dice))b.classList.add("movable");
     b.setAttribute("aria-label",`${pl.name} token ${i+1}`);
     b.onclick=()=>moveToken(pi,i);
     layer.appendChild(b);
   }
   $("score-"+pl.color).textContent=`${pl.home}/${used}`;
 });
 for(let i=S.count;i<4;i++)$("score-"+COLORS[i]).textContent="—";
}
function animateDice(done){
 S.rolling=true;render();vibrate(35);beep(650);let n=0;
 const diceButton=$("dice");
 if(diceButton)diceButton.classList.add("rolling");
 const id=setInterval(()=>{
  S.dice=1+Math.floor(Math.random()*6);
  setDiceFace(S.dice);
  if(++n>=12){
   clearInterval(id);
   setTimeout(()=>{
    if(diceButton)diceButton.classList.remove("rolling");
    setDiceFace(S.dice);
    done();
   },120);
  }
 },65);
}
function roll(){
 if(S.rolling||S.players[S.turn].ai)return;
 animateDice(finishRoll);
}
function finishRoll(){
 const p=S.players[S.turn],d=S.dice;
 const choices=p.t.map((_,i)=>canMove(p,i,d)?i:-1).filter(i=>i>=0);
 if(!choices.length){
   S.rolling=false;render();toast(d===6?"No move — roll again":"No legal move");
   setTimeout(()=>{if(d===6){S.dice=1;render();}else nextTurn()},700);
   return;
 }
 S.rolling=true;render();toast(d===6?"🎉 SIX! TAP A GLOWING TOKEN":"TAP A GLOWING TOKEN");
 if(p.ai)setTimeout(()=>computerMove(choices),500);
}
function moveToken(pi,ti){
 if(pi!==S.turn||!S.rolling)return;
 const p=S.players[pi],d=S.dice;if(!canMove(p,ti,d))return;
 p.t[ti]=p.t[ti]<0?0:p.t[ti]+d;
 S.rolling=false;vibrate(60);beep(780);
 const captured=capture(p,ti);
 if(p.t[ti]===57){p.home++;toast(`${p.name} reached HOME 🏠`)}
 const needed=tokensPerPlayer();
 render();
 if(p.home>=needed){setTimeout(()=>win(p),500);return}
 if(d===6||captured){setTimeout(()=>{toast("⭐ EXTRA TURN");S.dice=1;render();if(p.ai)computerTurn()},550)}
 else setTimeout(nextTurn,550);
}
function capture(p,ti){
 const pos=p.t[ti];if(pos<0||pos>=52)return false;
 const abs=(START[p.color]+pos)%52;if(SAFE.includes(abs))return false;
 let hit=false;
 S.players.slice(0,S.count).forEach(o=>{
   if(o===p)return;
   o.t.forEach((v,j)=>{if(v>=0&&v<52&&(START[o.color]+v)%52===abs){o.t[j]=-1;hit=true}});
 });
 if(hit){beep(300);vibrate(100);toast("⚔ TOKEN CAPTURED!")}
 return hit;
}
function nextTurn(){
 S.rolling=false;S.dice=1;S.turn=(S.turn+1)%S.count;render();
 if(S.players[S.turn].ai)setTimeout(computerTurn,650);
}
function computerTurn(){if(!S.players[S.turn].ai||S.rolling)return;animateDice(finishRoll)}
function computerMove(choices){
 const p=S.players[S.turn],d=S.dice;
 let pick=choices.find(i=>wouldCapture(p,i,d));
 if(pick===undefined)pick=choices.find(i=>p.t[i]<0);
 if(pick===undefined)pick=choices.find(i=>p.t[i]+d===57);
 if(pick===undefined)pick=choices.slice().sort((a,b)=>(p.t[b]<0?-1:p.t[b])-(p.t[a]<0?-1:p.t[a]))[0];
 setTimeout(()=>moveToken(S.turn,pick),450);
}
function wouldCapture(p,i,d){
 const old=p.t[i],np=old<0?0:old+d;if(np>=52)return false;
 const abs=(START[p.color]+np)%52;if(SAFE.includes(abs))return false;
 return S.players.slice(0,S.count).some(o=>o!==p&&o.t.some(v=>v>=0&&v<52&&(START[o.color]+v)%52===abs));
}
function win(p){
 const reward=S.type==="quick"?200:500;let coins=Number(localStorage.getItem("abhiCoins")||2550)+reward;
 localStorage.setItem("abhiCoins",coins);$("coins").textContent=coins;
 alert(`🏆 ${p.name} WINS!\n+${reward} coins`);
 show("home");
}
function startGame(){
 S.turn=0;S.dice=1;S.rolling=false;
 for(let i=0;i<S.count;i++){
   const input=document.querySelector(`[data-name="${i}"]`);
   if(input&&!input.disabled)S.players[i].name=input.value.trim()||`Player ${i+1}`;
   S.players[i].t=[-1,-1,-1,-1];S.players[i].home=0;S.players[i].ai=S.computer&&i===1;
 }
 buildBoard();show("game");render();
}
function showPanel(type){
 const m=$("panelModal"),c=$("panelContent"),coins=Number(localStorage.getItem("abhiCoins")||2550);
 const panels={
 tournament:`<h2>🏆 OFFLINE TOURNAMENT</h2><div class="panel-item">Play a local 4-player classic tournament.<br><button id="tourStart">START MATCH</button></div><div class="panel-item">Winner reward: 1000 coins.</div>`,
 events:`<h2>🎁 DAILY EVENT</h2><div class="panel-item">Claim 250 free coins once per day.<br><button id="daily">CLAIM REWARD</button></div>`,
 shop:`<h2>🛍 SHOP</h2><div class="panel-item">Balance: ${coins} coins</div><div class="panel-item">👑 Gold Dice — 500 coins<br><button data-buy="gold">BUY</button></div><div class="panel-item">✨ Star Token — 750 coins<br><button data-buy="star">BUY</button></div>`,
 inventory:`<h2>🎒 INVENTORY</h2><div id="inv"></div>`,
 help:`<h2>❓ HOW TO PLAY</h2><div class="panel-item">🎲 Roll the dice.</div><div class="panel-item">6 brings a token out.</div><div class="panel-item">After rolling, tap the glowing token.</div><div class="panel-item">★ cells are safe.</div><div class="panel-item">Capture an opponent for an extra turn.</div><div class="panel-item">Bring every token to HOME to win.</div>`,
 };
 c.innerHTML=panels[type]||`<h2>ABHI LUDO</h2>`;
 m.classList.remove("hidden");
 const ts=$("tourStart");if(ts)ts.onclick=()=>{m.classList.add("hidden");S.computer=false;S.type="classic";S.count=4;show("setup");renderEditor()};
 const db=$("daily");if(db)db.onclick=claimDaily;
 if(type==="inventory")renderInventory();
 document.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>buy(b.dataset.buy));
}
function renderInventory(){const items=JSON.parse(localStorage.getItem("abhiInventory")||"[]");$("inv").innerHTML=items.length?items.map(x=>`<div class="panel-item">✅ ${escapeHtml(x)}</div>`).join(""):`<div class="panel-item">Inventory is empty.</div>`}
function buy(kind){
 const price=kind==="gold"?500:750,name=kind==="gold"?"👑 Gold Dice":"✨ Star Token";
 let coins=Number(localStorage.getItem("abhiCoins")||2550),items=JSON.parse(localStorage.getItem("abhiInventory")||"[]");
 if(items.includes(name))return toast("Already owned");if(coins<price)return toast("Not enough coins");
 coins-=price;items.push(name);localStorage.setItem("abhiCoins",coins);localStorage.setItem("abhiInventory",JSON.stringify(items));$("coins").textContent=coins;toast("Purchased!");showPanel("shop");
}
function claimDaily(){
 const today=new Date().toISOString().slice(0,10);if(localStorage.getItem("dailyBonus")===today)return toast("Already claimed today");
 localStorage.setItem("dailyBonus",today);let coins=Number(localStorage.getItem("abhiCoins")||2550)+250;localStorage.setItem("abhiCoins",coins);$("coins").textContent=coins;toast("+250 coins 🎁");
}
function init(){
 $("coins").textContent=localStorage.getItem("abhiCoins")||2550;$("gems").textContent=localStorage.getItem("abhiGems")||50;
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>openSetup(b.dataset.mode));
 document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{S.type=b.dataset.type;if(S.type==="team")S.count=4;renderEditor()});
 document.querySelectorAll(".count").forEach(b=>b.onclick=()=>{if(S.type!=="team"){S.count=+b.dataset.count;renderEditor()}});
 document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>showPanel(b.dataset.panel));
 $("backSetup").onclick=()=>show("home");$("homeBtn").onclick=()=>show("home");$("exitGame").onclick=()=>show("home");$("startGame").onclick=startGame;$("roll").onclick=roll;
 $("settingsBtn").onclick=()=>$("settingsModal").classList.remove("hidden");$("closeSettings").onclick=()=>$("settingsModal").classList.add("hidden");$("closePanel").onclick=()=>$("panelModal").classList.add("hidden");
 $("soundToggle").onchange=e=>S.sound=e.target.checked;$("vibrationToggle").onchange=e=>S.vibration=e.target.checked;
 $("resetData").onclick=()=>{localStorage.clear();$("coins").textContent=2550;$("gems").textContent=50;toast("Local data reset")};
 renderEditor();
 setDiceFace(1);
}
init();
