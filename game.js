const COLORS=["red","green","yellow","blue"];
const LABEL={red:"RED",green:"GREEN",yellow:"YELLOW",blue:"BLUE"};
const START={red:0,green:13,yellow:26,blue:39};
const DIE=["","⚀","⚁","⚂","⚃","⚄","⚅"];
const TRACK=[
 [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
 [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],
 [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
 [14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],
 [8,0],[7,0],[6,0]
];
const SAFE=[0,8,13,21,26,34,39,47];
const LANES={
 red:[[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
 green:[[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
 yellow:[[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
 blue:[[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]]
};
const YARD={
 red:[[7,7],[14,7],[7,14],[14,14]],green:[[86,7],[93,7],[86,14],[93,14]],
 yellow:[[86,86],[93,86],[86,93],[93,93]],blue:[[7,86],[14,86],[7,93],[14,93]]
};
const S={
 type:"classic",count:2,turn:0,dice:1,rolling:false,sound:true,vibration:true,computer:false,
 players:COLORS.map((color,i)=>({color,name:"Player "+(i+1),ai:false,t:[-1,-1,-1,-1],home:0}))
};
const $=id=>document.getElementById(id);
function toast(msg){const x=$("toast");x.textContent=msg;x.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.classList.remove("show"),1600)}
function vibrate(n=35){if(S.vibration&&navigator.vibrate)navigator.vibrate(n)}
function beep(freq=520){if(!S.sound)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const a=new AC(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;g.gain.value=.035;o.connect(g);g.connect(a.destination);o.start();setTimeout(()=>{o.stop();a.close()},75)}catch(e){}}
function show(id){["home","setup","game"].forEach(x=>$(x).classList.toggle("hidden",x!==id));window.scrollTo(0,0)}
function tokensPerPlayer(){return S.type==="quick"?1:4}
function openSetup(mode){
 S.computer=mode==="computer";
 S.type=mode==="quick"?"quick":"classic";
 if(mode==="local"||mode==="computer")S.count=2;
 show("setup");renderEditor();
}
function renderEditor(){
 document.querySelectorAll(".mode-tab").forEach(b=>b.classList.toggle("active",b.dataset.type===S.type));
 document.querySelectorAll(".count").forEach(b=>{b.classList.toggle("active",+b.dataset.count===S.count);b.disabled=S.type==="team"});
 const box=$("playerEditor");box.innerHTML="";
 for(let i=0;i<S.count;i++){
   const p=S.players[i];p.ai=S.computer&&i>0;
   box.insertAdjacentHTML("beforeend",`<div class="editor"><span class="color" style="background:var(--${p.color})"></span><input data-name="${i}" maxlength="14" value="${escapeHtml(p.name)}" ${p.ai?"disabled":""}><span>${p.ai?"🤖":"👤"}</span></div>`);
 }
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function buildBoard(){
 const track=$("track");track.innerHTML="";
 TRACK.forEach((q,i)=>{const d=document.createElement("div");d.className="track-cell";if(SAFE.includes(i)){d.classList.add("safe");d.textContent="★"}if(i===0)d.classList.add("red");if(i===13)d.classList.add("green");if(i===26)d.classList.add("yellow");if(i===39)d.classList.add("blue");d.style.left=(q[1]/15*100)+"%";d.style.top=(q[0]/15*100)+"%";track.appendChild(d)});
 const lanes=$("homeLanes");lanes.innerHTML="";
 COLORS.forEach(c=>LANES[c].forEach(q=>{const d=document.createElement("div");d.className="lane "+c;d.style.left=(q[1]/15*100)+"%";d.style.top=(q[0]/15*100)+"%";lanes.appendChild(d)}));
}
function position(color,pos,index){
 if(pos<0)return{x:YARD[color][index][0],y:YARD[color][index][1]};
 if(pos>=52){const q=LANES[color][Math.min(5,pos-52)];return{x:(q[1]+.5)/15*100,y:(q[0]+.5)/15*100}}
 const q=TRACK[(START[color]+pos)%52];return{x:(q[1]+.5)/15*100,y:(q[0]+.5)/15*100};
}
function canMove(p,index,d){
 const limit=57,used=tokensPerPlayer(),pos=p.t[index];
 if(index>=used||pos===limit)return false;
 return pos<0?d===6:pos+d<=limit;
}
function render(){
 const p=S.players[S.turn],used=tokensPerPlayer();
 $("turnName").textContent=LABEL[p.color];
 $("dice").textContent=DIE[S.dice];
 $("roll").disabled=S.rolling||p.ai;
 $("gameMsg").textContent=S.rolling?`${p.name} — choose a glowing token`:`${p.name}'s turn — roll the dice`;
 const layer=$("tokens");layer.innerHTML="";
 S.players.slice(0,S.count).forEach((pl,pi)=>{
   for(let i=0;i<4;i++){
     const b=document.createElement("button");b.className="token "+pl.color;
     if(i>=used)b.style.display="none";
     const q=position(pl.color,pl.t[i],i);b.style.left=q.x+"%";b.style.top=q.y+"%";
     if(pi===S.turn&&S.rolling&&canMove(pl,i,S.dice))b.classList.add("movable");
     b.onclick=()=>moveToken(pi,i);layer.appendChild(b);
   }
   $("score-"+pl.color).textContent=`${pl.home}/${used}`;
 });
 for(let i=S.count;i<4;i++)$("score-"+COLORS[i]).textContent="—";
}
function animateDice(done){
 S.rolling=true;vibrate();beep(650);let n=0;
 const id=setInterval(()=>{S.dice=1+Math.floor(Math.random()*6);$("dice").textContent=DIE[S.dice];if(++n>=10){clearInterval(id);done()}},65);
}
function roll(){
 if(S.rolling||S.players[S.turn].ai)return;
 animateDice(finishRoll);
}
function finishRoll(){
 const p=S.players[S.turn],d=S.dice;
 const choices=p.t.map((_,i)=>canMove(p,i,d)?i:-1).filter(i=>i>=0);
 if(!choices.length){
   S.rolling=false;render();toast(d===6?"No legal move — extra roll":"No legal move");
   if(d===6)setTimeout(()=>{S.dice=1;render();if(p.ai)computerTurn()},500);else setTimeout(nextTurn,500);
   return;
 }
 render();toast(d===6?"SIX! Select a token":"Select a glowing token");
 if(p.ai)setTimeout(()=>computerMove(choices),450);
}
function moveToken(pi,ti){
 if(pi!==S.turn||!S.rolling)return;
 const p=S.players[pi],d=S.dice;if(!canMove(p,ti,d))return;
 p.t[ti]=p.t[ti]<0?0:p.t[ti]+d;
 S.rolling=false;vibrate(55);beep(760);
 const captured=capture(p,ti);
 if(p.t[ti]===57){p.home++;toast(`${p.name} reached HOME! 🏠`)}
 const needed=tokensPerPlayer();
 render();
 if(p.home>=needed){setTimeout(()=>win(p),450);return}
 if(d===6||captured){setTimeout(()=>{toast("Extra turn!");if(p.ai)computerTurn();},450)}
 else setTimeout(nextTurn,450);
}
function capture(p,ti){
 const pos=p.t[ti];if(pos<0||pos>=52)return false;
 const absolute=(START[p.color]+pos)%52;if(SAFE.includes(absolute))return false;
 let hit=false;
 S.players.slice(0,S.count).forEach(o=>{
   if(o===p)return;
   o.t.forEach((v,j)=>{if(v>=0&&v<52&&(START[o.color]+v)%52===absolute){o.t[j]=-1;hit=true}});
 });
 if(hit){beep(330);vibrate(100);toast("TOKEN CAPTURED! ⚔")}
 return hit;
}
function nextTurn(){S.rolling=false;S.turn=(S.turn+1)%S.count;render();if(S.players[S.turn].ai)setTimeout(computerTurn,600)}
function computerTurn(){const p=S.players[S.turn];if(!p.ai||S.rolling)return;animateDice(finishRoll)}
function computerMove(choices){
 const p=S.players[S.turn],d=S.dice;
 let pick=choices.find(i=>wouldCapture(p,i,d));
 if(pick===undefined)pick=choices.find(i=>p.t[i]<0);
 if(pick===undefined)pick=choices.slice().sort((a,b)=>p.t[b]-p.t[a])[0];
 setTimeout(()=>moveToken(S.turn,pick),350);
}
function wouldCapture(p,i,d){
 const old=p.t[i],np=old<0?0:old+d;if(np>=52)return false;
 const absolute=(START[p.color]+np)%52;if(SAFE.includes(absolute))return false;
 return S.players.slice(0,S.count).some(o=>o!==p&&o.t.some(v=>v>=0&&v<52&&(START[o.color]+v)%52===absolute));
}
function win(p){
 const reward=S.type==="quick"?200:500;
 let coins=Number(localStorage.getItem("abhiCoins")||2550)+reward;
 localStorage.setItem("abhiCoins",coins);$("coins").textContent=coins;
 toast(`🏆 ${p.name} WINS! +${reward} coins`);
 setTimeout(()=>show("setup"),1200);
}
function startGame(){
 S.turn=0;S.dice=1;S.rolling=false;
 for(let i=0;i<S.count;i++){
   const input=document.querySelector(`[data-name="${i}"]`);
   if(input&&!input.disabled)S.players[i].name=input.value.trim()||`Player ${i+1}`;
   S.players[i].t=[-1,-1,-1,-1];S.players[i].home=0;S.players[i].ai=S.computer&&i>0;
 }
 buildBoard();show("game");render();
 if(S.players[0].ai)setTimeout(computerTurn,600);
}
function showPanel(type){
 const modal=$("panelModal"),c=$("panelContent"),coins=Number(localStorage.getItem("abhiCoins")||2550);
 if(type==="tournament")c.innerHTML=`<h2 class="panel-title">🏆 OFFLINE TOURNAMENT</h2><p class="muted">A local 4-player tournament. No internet is used.</p><div class="panel-list"><div class="panel-item"><b>ROUND 1</b><br>Start a classic 4-player match.<br><button id="startTournament">START</button></div><div class="panel-item"><b>PRIZE</b><br>Winner earns 1000 coins.</div></div>`;
 if(type==="events")c.innerHTML=`<h2 class="panel-title">🎁 DAILY EVENT</h2><p class="muted">Rewards are stored locally on this device.</p><div class="panel-item"><b>DAILY BONUS</b><br>Claim 250 coins once each day.<br><button id="dailyBonus">CLAIM</button></div>`;
 if(type==="shop")c.innerHTML=`<h2 class="panel-title">🛍 SHOP</h2><p class="muted">Balance: ${coins} coins</p><div class="panel-list"><div class="panel-item">👑 Gold Dice — 500 coins<br><button data-buy="gold">BUY</button></div><div class="panel-item">✨ Star Token — 750 coins<br><button data-buy="star">BUY</button></div></div>`;
 if(type==="inventory")c.innerHTML=`<h2 class="panel-title">🎒 INVENTORY</h2><div id="inventoryList" class="panel-list"></div>`;
 if(type==="social")c.innerHTML=`<h2 class="panel-title">💬 SOCIAL</h2><p class="muted">ABHI LUDO is offline-only. There is no online server or account system.</p><div class="panel-item">👥 Use Pass N Play to play with friends on the same device.</div>`;
 if(type==="help")c.innerHTML=`<h2 class="panel-title">❓ HOW TO PLAY</h2><div class="panel-list"><div class="panel-item">🎲 Roll a 6 to bring a token out.</div><div class="panel-item">👆 After rolling, tap a glowing token.</div><div class="panel-item">⚔️ Landing on an opponent captures it, except on safe stars.</div><div class="panel-item">🏠 Move a token to the final home lane and get all tokens home to win.</div><div class="panel-item">🤖 Computer mode is fully offline.</div></div>`;
 modal.classList.remove("hidden");
 if(type==="inventory")renderInventory();
 const st=$("startTournament");if(st)st.onclick=()=>{modal.classList.add("hidden");S.computer=false;S.type="classic";S.count=4;show("setup");renderEditor()};
 const db=$("dailyBonus");if(db)db.onclick=claimDaily;
 document.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>buy(b.dataset.buy));
}
function renderInventory(){
 const list=$("inventoryList"),items=JSON.parse(localStorage.getItem("abhiInventory")||"[]");
 list.innerHTML=items.length?items.map(x=>`<div class="panel-item">✅ ${escapeHtml(x)}</div>`).join(""):`<div class="panel-item">Inventory is empty.</div>`;
}
function buy(kind){
 const price=kind==="gold"?500:750,name=kind==="gold"?"👑 Gold Dice":"✨ Star Token";
 let coins=Number(localStorage.getItem("abhiCoins")||2550),items=JSON.parse(localStorage.getItem("abhiInventory")||"[]");
 if(items.includes(name))return toast("Already owned");
 if(coins<price)return toast("Not enough coins");
 coins-=price;items.push(name);localStorage.setItem("abhiCoins",coins);localStorage.setItem("abhiInventory",JSON.stringify(items));$("coins").textContent=coins;toast("Purchased!");showPanel("shop");
}
function claimDaily(){
 const today=new Date().toISOString().slice(0,10);
 if(localStorage.getItem("dailyBonus")===today)return toast("Already claimed today");
 localStorage.setItem("dailyBonus",today);let coins=Number(localStorage.getItem("abhiCoins")||2550)+250;localStorage.setItem("abhiCoins",coins);$("coins").textContent=coins;toast("+250 coins 🎁");showPanel("events");
}
function load(){
 buildBoard();
 $("coins").textContent=localStorage.getItem("abhiCoins")||2550;
 $("gems").textContent=localStorage.getItem("abhiGems")||50;
 renderEditor();
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>openSetup(b.dataset.mode));
 document.querySelectorAll(".mode-tab").forEach(b=>b.onclick=()=>{S.type=b.dataset.type;if(S.type==="team")S.count=4;renderEditor()});
 document.querySelectorAll(".count").forEach(b=>b.onclick=()=>{if(S.type!=="team"){S.count=+b.dataset.count;renderEditor()}});
 document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>showPanel(b.dataset.panel));
 document.querySelectorAll("[data-home]").forEach(b=>b.onclick=()=>show("home"));
 $("backSetup").onclick=()=>show("home");$("startGame").onclick=startGame;$("exitGame").onclick=()=>show("home");$("roll").onclick=roll;
 $("settingsBtn").onclick=()=>$("settingsModal").classList.remove("hidden");$("closeSettings").onclick=()=>$("settingsModal").classList.add("hidden");$("closePanel").onclick=()=>$("panelModal").classList.add("hidden");
 $("soundBtn").onclick=()=>{S.sound=!S.sound;$("soundBtn").textContent=S.sound?"🔊":"🔇"};
 $("soundToggle").onchange=e=>S.sound=e.target.checked;$("vibrationToggle").onchange=e=>S.vibration=e.target.checked;
 $("resetData").onclick=()=>{localStorage.clear();$("coins").textContent=2550;$("gems").textContent=50;toast("Local data reset")};
}
load();