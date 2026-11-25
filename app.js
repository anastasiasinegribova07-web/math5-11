{
/* ---------- данные ---------- */
const LEVELS=[
 {id:"56",name:"5–6 классы",grades:["5","6"],desc:"Натуральные числа, дроби, проценты, рациональные числа, первые уравнения и координаты."},
 {id:"79",name:"7–9 классы",grades:["7","8","9"],desc:"Алгебра, геометрия, вероятность и статистика."},
 {id:"1011",name:"10–11 классы",grades:["10","11"],desc:"Математика по учебнику Алимова: алгебра и начала анализа, комбинаторика, вероятность и статистика."}
];
const SUBJ={math:"Математика",alg:"Алгебра",geo:"Геометрия",vs:"Вероятность и статистика",ana:"Математика"};
const SUBJ_ORDER=["math","alg","ana","geo","vs"];
const lvlOf=g=>LEVELS.find(l=>l.grades.includes(g));

function parseBook(b){
  const secs=[];let sec=null,top=null;
  for(const raw of b.text.split("\n")){
    const s=raw.trim();if(!s)continue;
    const k=s[0],v=s.slice(1).trim();
    if(k==="#"){sec={name:v,topics:[]};secs.push(sec);}
    else if(k==="@"){const m=v.match(/^(\S+)\s+(.*)$/);top={num:m?m[1].replace(/\.$/,""):"",title:m?m[2]:v,th:[],qs:[]};if(!sec){sec={name:"",topics:[]};secs.push(sec);}sec.topics.push(top);}
    else if(k==="!"&&top)top.th.push(v);
    else if(k==="?"&&top){const p=v.split(" ~ ").map(x=>x.trim());if(p.length>=3)top.qs.push(p);}
  }
  return {...b,sections:secs};
}
const BOOKS=(window.BOOKS||[]).map(parseBook);
const findBook=(g,s)=>BOOKS.find(b=>b.grade===g&&b.subj===s);

/* ---------- утилиты ---------- */
const $=s=>document.querySelector(s);
const view=$("#view");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function fmt(s){
  let h=esc(s);
  const C="\u0003";let prev;
  /* \u0004…\u0005 — временные метки для <sup>, \u0006…\u0007 — для <sub>: так степень внутри корня или дроби (√{2^{10}}) тоже раскрывается */
  do{prev=h;h=h.replace(/\{([^{}\/]+)\/([^{}]+)\}/g,'<span class="fr"><span>$1'+C+'<span>$2'+C+C).replace(/√\{([^{}]+)\}/g,'√<span class="rt">$1'+C).replace(/\^\{([^{}]+)\}/g,"\u0004$1\u0005").replace(/_\{([^{}]+)\}/g,"\u0006$1\u0007")}while(h!==prev);
  h=h.split(C).join("</span>").split("\u0004").join("<sup>").split("\u0005").join("</sup>").split("\u0006").join("<sub>").split("\u0007").join("</sub>");
  h=h.replace(/([A-Z]{1,2}|[a-z]|0)\u20D7/g,'<span class="vec">$1</span>');
  h=h.replace(/\^\{([^{}]+)\}/g,"<sup>$1</sup>").replace(/\^(-?\d+|[a-zA-Zα-ω])/g,"<sup>$1</sup>");
  h=h.replace(/_\{([^{}]+)\}/g,"<sub>$1</sub>").replace(/_(\d+|[a-zA-Z])/g,"<sub>$1</sub>");
  return h;
}
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.random()*a.length|0];
let cleanup=null;
function clearView(){if(cleanup){cleanup();cleanup=null}view.innerHTML=""}
let store={};try{store=JSON.parse(localStorage.getItem("mg-done")||"{}")}catch(e){}
function mark(key){store[key]=1;try{localStorage.setItem("mg-done",JSON.stringify(store))}catch(e){}}
function toItem(q){const opts=shuffle(q.slice(1));return {q:q[0],a:q[1],opts}}

/* ---------- разминка: устный счёт ---------- */
function numOpts(a){const s=new Set([a]);let t=0;while(s.size<4&&t<50){t++;const d=pick([1,2,3,5,10,-1,-2,-3,-5,-10]);const v=Number.isInteger(a)?a+d:+(a+d/10).toFixed(2);s.add(v)}return shuffle([...s]).map(String)}
function W(q,a,opts){return {q,a:String(a),opts:opts||numOpts(a)}}
const GEN={
 g5:[()=>{const a=rnd(120,880),b=rnd(15,99);return W(`${a} + ${b} = ?`,a+b)},
     ()=>{const a=rnd(300,999),b=rnd(15,250);return W(`${a} − ${b} = ?`,a-b)},
     ()=>{const a=rnd(12,49),b=rnd(2,9);return W(`${a} · ${b} = ?`,a*b)},
     ()=>{const b=rnd(2,9),c=rnd(11,60);return W(`${b*c} : ${b} = ?`,c)},
     ()=>{const a=rnd(2,12);return W(`${a}^2 = ?`,a*a)}],
 g6:[()=>{const a=rnd(-20,20),b=rnd(-20,20);return W(`${a} + (${b}) = ?`,a+b)},
     ()=>{const a=rnd(-12,12),b=rnd(-9,9);return W(`${a} · (${b}) = ?`,a*b)},
     ()=>{const d=pick([4,5,6,8,10,12]),x=rnd(1,d-2),y=rnd(1,d-1-x);return W(`{${x}/${d}} + {${y}/${d}} = ?`,`{${x+y}/${d}}`,shuffle([`{${x+y}/${d}}`,`{${x+y}/${d*2}}`,`{${x*y}/${d}}`,`{${x+y+1}/${d}}`]))},
     ()=>{const p=pick([10,20,25,50,75]),n=pick([40,80,120,200,400]);return W(`${p}% от ${n} = ?`,n*p/100)},
     ()=>{const a=rnd(-30,30);return W(`|${a}| = ?`,Math.abs(a),shuffle([String(Math.abs(a)),String(-Math.abs(a)||1),String(Math.abs(a)+1),String(Math.abs(a)+10)]))}],
 alg7:[()=>{const a=rnd(-9,9),b=rnd(-9,9);return W(`(${a}) · (${b}) = ?`,a*b)},
     ()=>{const n=rnd(2,8);return W(`2^${n} = ?`,2**n)},
     ()=>{const k=pick([2,3,4,5,-2,-3]),x=rnd(-6,9);return W(`${k}x = ${k*x}. x = ?`,x)},
     ()=>{const a=rnd(-5,5);return W(`Значение 3x − 1 при x = ${a}`,3*a-1)},
     ()=>{const a=rnd(11,19);return W(`${a}^2 = ?`,a*a)}],
 alg8:[()=>{const a=rnd(2,20);return W(`√{${a*a}} = ?`,a)},
     ()=>{const a=rnd(11,25);return W(`${a}^2 = ?`,a*a)},
     ()=>{const a=rnd(2,9);return W(`Положительный корень уравнения x^2 = ${a*a}`,a)},
     ()=>{const a=rnd(-8,8),b=rnd(-8,8);return W(`(${a}) − (${b}) = ?`,a-b)},
     ()=>{const n=rnd(1,4);return W(`10^{-${n}} = ?`,(10**-n).toFixed(n).replace(".",","),shuffle([(10**-n).toFixed(n),String(-10*n),String(10**n),(10**-(n+1)).toFixed(n+1)].map(x=>x.replace(".",","))))}],
 alg9:[()=>{const a=rnd(-5,10),d=rnd(-4,6);return W(`${a}; ${a+d}; ${a+2*d}; … Следующий член`,a+3*d)},
     ()=>{const b=pick([1,2,3,-2]),q=pick([2,3,-2]);return W(`${b}; ${b*q}; ${b*q*q}; … Следующий член`,b*q**3)},
     ()=>{const a=rnd(11,30),b=rnd(1,10);return W(`${a}^2 − ${b}^2 = ?`,a*a-b*b)},
     ()=>{const a=rnd(-6,6);return W(`f(x) = x^2 − 2x. f(${a}) = ?`,a*a-2*a)},
     ()=>{const x1=rnd(-5,5),x2=rnd(-5,5);return W(`x^2 + ${-(x1+x2)}x + ${x1*x2} = 0. Сумма корней`,x1+x2)}],
 geo7:[()=>{const a=rnd(20,160);return W(`Один из смежных углов ${a}°. Другой угол`,180-a)},
     ()=>{const a=rnd(20,90),b=rnd(20,160-a);return W(`Два угла треугольника ${a}° и ${b}°. Третий угол`,180-a-b)},
     ()=>{const a=rnd(10,170);return W(`Вертикальный угол к углу ${a}°`,a)},
     ()=>{const a=rnd(20,80);return W(`Угол при основании равнобедренного треугольника ${a}°. Угол при вершине`,180-2*a)}],
 geo8:[()=>{const a=rnd(3,15),b=rnd(2,12);return W(`Площадь прямоугольника ${a} × ${b}`,a*b)},
     ()=>{const t=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15]]);return W(`Катеты ${t[0]} и ${t[1]}. Гипотенуза`,t[2])},
     ()=>{const a=rnd(2,14)*2,h=rnd(2,12);return W(`Площадь треугольника: основание ${a}, высота ${h}`,a*h/2)},
     ()=>{const a=rnd(40,140);return W(`Угол параллелограмма ${a}°. Соседний угол`,180-a)}],
 geo9:[()=>{const n=pick([3,4,5,6,8,9,10,12]);return W(`Сумма углов выпуклого ${n}-угольника`,(n-2)*180)},
     ()=>{const v=pick([["sin 30°","{1/2}"],["cos 60°","{1/2}"],["sin 90°","1"],["cos 0°","1"],["cos 90°","0"],["tg 45°","1"],["cos 180°","−1"]]);return W(`${v[0]} = ?`,v[1],shuffle([...new Set([v[1],"{1/2}","1","0","−1"])].slice(0,4)))},
     ()=>{const x=rnd(-6,6),y=rnd(-6,6),u=rnd(-6,6),w=rnd(-6,6);return W(`a{${x}; ${y}} + b{${u}; ${w}}. Первая координата суммы`,x+u)},
     ()=>{const n=pick([3,4,5,6,8,10,12]);return W(`Угол правильного ${n}-угольника`,(n-2)*180/n)}],
 vs:[()=>{const a=rnd(1,9),b=rnd(1,9),c=rnd(1,9);const s=a+b+c;if(s%3)return W(`Сумма чисел ${a}, ${b}, ${c}`,s);return W(`Среднее арифметическое чисел ${a}, ${b}, ${c}`,s/3)},
     ()=>{const xs=Array.from({length:5},()=>rnd(1,20));const m=xs.slice().sort((p,q)=>p-q)[2];return W(`Медиана набора ${xs.join("; ")}`,m)},
     ()=>{const xs=Array.from({length:5},()=>rnd(1,30));return W(`Размах набора ${xs.join("; ")}`,Math.max(...xs)-Math.min(...xs))},
     ()=>{const k=rnd(1,5);return W(`Кубик бросают один раз. Вероятность, что выпадет число меньше ${k+1}`,`{${k}/6}`,shuffle([`{${k}/6}`,`{${6-k}/6}`,`{1/6}`,`{${k}/5}`]))},
     ()=>{const n=rnd(3,6),f={3:6,4:24,5:120,6:720}[n];return W(`${n}! = ?`,f)}],
 ana:[()=>{const n=rnd(2,6);return W(`log_2 ${2**n} = ?`,n)},
     ()=>{const n=rnd(2,4);return W(`8^{{1/3}} · ${n} = ?`,2*n)},
     ()=>{const v=pick([["sin {π/6}","{1/2}"],["cos {π/3}","{1/2}"],["cos 0","1"],["sin {π/2}","1"],["tg {π/4}","1"],["cos π","−1"],["sin π","0"]]);return W(`${v[0]} = ?`,v[1],shuffle([...new Set([v[1],"{1/2}","1","0","−1"])].slice(0,4)))},
     ()=>{const n=rnd(2,7);return W(`(x^${n})′ при x = 1`,n)},
     ()=>{const n=rnd(1,3);return W(`lg 10^${n} = ?`,n)}]
};
function genFor(g,s){
  if(g==="5")return GEN.g5; if(g==="6")return GEN.g6;
  if(s==="geo")return GEN["geo"+g]; if(s==="vs")return GEN.vs;
  if(g==="10"||g==="11")return GEN.ana;
  return GEN["alg"+g]||GEN.alg7;
}

/* ---------- общие элементы игр ---------- */
function mcq(box,item,onAnswer,opts={}){
  box.innerHTML=`<div class="q">${fmt(item.q)}</div><div class="opts">${item.opts.map((o,i)=>`<button class="opt" data-i="${i}" type="button">${fmt(o)}</button>`).join("")}</div><div class="fb" aria-live="polite"></div>`;
  const fb=box.querySelector(".fb");let locked=false;
  box.querySelectorAll(".opt").forEach(b=>b.addEventListener("click",()=>{
    if(locked)return;const o=item.opts[+b.dataset.i];const ok=o===item.a;
    if(ok||!opts.retry){locked=true;box.querySelectorAll(".opt").forEach(x=>{x.disabled=true;if(item.opts[+x.dataset.i]===item.a)x.classList.add("ok")})}
    if(!ok)b.classList.add("bad");
    fb.className="fb "+(ok?"ok":"bad");
    fb.innerHTML=ok?pick(["Верно!","Правильно!","Отлично!","Так держать!"]):(opts.retry?"Подумай ещё раз."+(opts.hint?`<div class="hint">${fmt(opts.hint)}</div>`:""):`Правильный ответ: ${fmt(item.a)}`);
    onAnswer(ok,locked);
  }));
}
function tfClaim(q){const truth=Math.random()<.5;const shown=truth?q[1]:pick(q.slice(2));return {q:q[0],shown,truth,a:q[1]}}
function tfRender(box,c,onAnswer){
  box.innerHTML=`<div class="claim">${fmt(c.q)}<span class="arrow">Ответ:</span><span class="ans">${fmt(c.shown)}</span></div><div class="tf"><button class="opt" data-v="1" type="button">Верно</button><button class="opt" data-v="0" type="button">Неверно</button></div><div class="fb" aria-live="polite"></div>`;
  const fb=box.querySelector(".fb");let done=false;
  box.querySelectorAll(".tf .opt").forEach(b=>b.addEventListener("click",()=>{
    if(done)return;done=true;const ok=(b.dataset.v==="1")===c.truth;
    b.classList.add(ok?"ok":"bad");box.querySelectorAll(".tf .opt").forEach(x=>x.disabled=true);
    fb.className="fb "+(ok?"ok":"bad");fb.innerHTML=(ok?"Верно! ":"Ошибка. ")+(c.truth?"Это правильный ответ.":`Правильный ответ: ${fmt(c.a)}`);
    onAnswer(ok);
  }));
}
function pairsRender(box,qs,onDone){
  const seen=new Set(),set=[];
  for(const q of shuffle(qs)){if(!seen.has(q[1])&&!seen.has(q[0])){seen.add(q[1]);set.push(q)}if(set.length===5)break}
  const right=shuffle(set.map((q,i)=>i));let sel=null,left=set.length,miss=0;
  box.innerHTML=`<p class="lead" style="margin:0 0 12px">Нажми на задание слева, потом на ответ справа.</p><div class="pairs"><div class="col">${set.map((q,i)=>`<button class="pc L" data-i="${i}" type="button">${fmt(q[0])}</button>`).join("")}</div><div class="col">${right.map(i=>`<button class="pc R" data-i="${i}" type="button">${fmt(set[i][1])}</button>`).join("")}</div></div><div class="fb" aria-live="polite"></div>`;
  const fb=box.querySelector(".fb");
  box.querySelectorAll(".pc.L").forEach(b=>b.addEventListener("click",()=>{if(b.classList.contains("ok"))return;box.querySelectorAll(".pc.L").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");sel=b}));
  box.querySelectorAll(".pc.R").forEach(b=>b.addEventListener("click",()=>{
    if(b.classList.contains("ok"))return;
    if(!sel){fb.className="fb";fb.textContent="Сначала выбери задание слева.";return}
    if(sel.dataset.i===b.dataset.i){sel.classList.remove("sel");sel.classList.add("ok");b.classList.add("ok");sel.disabled=b.disabled=true;sel=null;left--;fb.className="fb ok";fb.textContent="Пара найдена!";if(!left)onDone(set.length,miss)}
    else{miss++;b.classList.remove("bad");void b.offsetWidth;b.classList.add("bad");fb.className="fb bad";fb.textContent="Не подходит, попробуй другую карточку."}
  }));
  return set.length;
}
function stars(p){return p>=.9?"Отличный результат":p>=.7?"Хороший результат":p>=.5?"Неплохо, но тему стоит повторить":"Тему нужно разобрать ещё раз"}

/* ---------- экраны ---------- */
function setLvl(id){document.body.dataset.lvl=id||""}
function crumbs(list){
  const c=$("#crumbs");c.innerHTML=list.map((x,i)=>(i?"<span>/</span>":"")+`<button type="button" data-h="${x[1]}">${esc(x[0])}</button>`).join("");
  c.querySelectorAll("button").forEach(b=>b.onclick=()=>go(b.dataset.h));
}
function go(h){if(location.hash==="#"+h||(h===""&&!location.hash))route();else location.hash=h}

const art={
 "56":`<svg viewBox="0 0 300 96" aria-hidden="true"><rect x="8" y="22" width="64" height="64" rx="14" fill="#ffd54a"/><circle cx="40" cy="54" r="7" fill="#2a2140"/><circle cx="24" cy="38" r="6" fill="#2a2140"/><circle cx="56" cy="70" r="6" fill="#2a2140"/><path d="M96 86 L136 14 L176 86Z" fill="#ff6b4a"/><circle cx="226" cy="50" r="38" fill="#2bb3f3"/><path d="M226 12 A38 38 0 0 1 264 50 L226 50Z" fill="#9b5de5"/></svg>`,
 "79":`<svg viewBox="0 0 300 96" aria-hidden="true"><path d="M6 86 L70 10 L134 86Z" fill="none" stroke="#0f6b62" stroke-width="5"/><path d="M70 10 V86" stroke="#ff6f59" stroke-width="3" stroke-dasharray="6 5"/><path d="M150 80 Q190 -10 230 80" fill="none" stroke="#0f6b62" stroke-width="5"/><circle cx="268" cy="34" r="8" fill="#ff6f59"/><circle cx="252" cy="64" r="8" fill="#0f6b62"/><circle cx="284" cy="70" r="8" fill="#0f6b62"/></svg>`,
 "1011":`<svg viewBox="0 0 300 96" aria-hidden="true"><path d="M4 48 H296 M150 4 V92" stroke="#c9ced8" stroke-width="2"/><path d="M4 48 C40 -8 70 -8 104 48 S170 104 204 48 S270 -8 296 48" fill="none" stroke="#1f4fd1" stroke-width="4"/><text x="214" y="88" font-family="Literata,serif" font-size="20" fill="#16181d">y = sin x</text></svg>`
};

function home(){
  setLvl("");crumbs([["Главная",""]]);
  view.innerHTML=`<h1>Математика: игры по учебникам</h1><p class="lead">Выберите звено, затем класс и предмет. В каждой теме — игра для изучения, две игры на закрепление и игра на целый урок (40 минут) с таймером.</p>
  <div class="shelf">${LEVELS.map(l=>`<button class="tier" type="button" data-l="${l.id}">${art[l.id]}<b>${l.name}</b><p>${l.desc}</p><div class="chips">${l.grades.map(g=>`<i>${g} класс</i>`).join("")}</div></button>`).join("")}</div>
  <h2>Как устроены игры</h2>
  <div class="grid">
   <div class="card"><b>Изучаем</b><small>Правило по шагам из параграфа, затем вопросы с подсказками. Ошибку можно исправить.</small></div>
   <div class="card"><b>Найди пару</b><small>Закрепление: соединить задание и ответ.</small></div>
   <div class="card"><b>Верно или неверно</b><small>Закрепление: быстрая проверка, серия из 10 утверждений.</small></div>
   <div class="card"><b>Урок 40 минут</b><small>Практика с таймером: устный счёт, вопросы по теории, примеры, задания с вводом ответа, поиск ошибки, пары и итог.</small></div>
  </div>`;
  view.querySelectorAll(".tier").forEach(b=>b.onclick=()=>go("lvl-"+b.dataset.l));
}
function level(id){
  const l=LEVELS.find(x=>x.id===id);if(!l)return home();setLvl(id);
  crumbs([["Главная",""],[l.name,"lvl-"+id]]);
  view.innerHTML=`<h1>${l.name}</h1><p class="lead">Выберите класс.</p><div class="grid">${l.grades.map(g=>{const bs=BOOKS.filter(b=>b.grade===g);const n=bs.reduce((s,b)=>s+b.sections.reduce((t,x)=>t+x.topics.length,0),0);return `<button class="card" type="button" data-g="${g}"><span class="big">${g}</span><b>${g} класс</b><small>${bs.map(b=>SUBJ[b.subj]).join(", ")||"нет данных"}<br>Тем: ${n}</small></button>`}).join("")}</div>`;
  view.querySelectorAll(".card").forEach(b=>b.onclick=()=>go("g"+b.dataset.g));
}
function grade(g){
  const l=lvlOf(g);if(!l)return home();setLvl(l.id);
  crumbs([["Главная",""],[l.name,"lvl-"+l.id],[g+" класс","g"+g]]);
  const bs=BOOKS.filter(b=>b.grade===g).sort((a,b)=>SUBJ_ORDER.indexOf(a.subj)-SUBJ_ORDER.indexOf(b.subj));
  view.innerHTML=`<h1>${g} класс</h1><p class="lead">Выберите предмет.</p><div class="grid">${bs.map(b=>{const n=b.sections.reduce((t,x)=>t+x.topics.length,0);return `<button class="card" type="button" data-s="${b.subj}"><b>${SUBJ[b.subj]}</b><small>${esc(b.book)}</small><small>Тем: ${n}</small></button>`}).join("")}</div>`;
  view.querySelectorAll(".card").forEach(b=>b.onclick=()=>go(`g${g}-${b.dataset.s}`));
}
const GAMES=[["learn","Изучаем","изучение"],["pairs","Найди пару","закрепление"],["tf","Верно или неверно","закрепление"],["lesson","Урок 40 минут","на весь урок"]];
function subject(g,s){
  const b=findBook(g,s),l=lvlOf(g);if(!b||!l)return home();setLvl(l.id);
  crumbs([["Главная",""],[l.name,"lvl-"+l.id],[g+" класс","g"+g],[SUBJ[s],`g${g}-${s}`]]);
  view.innerHTML=`<h1>${SUBJ[s]}, ${g} класс</h1><p class="lead">Учебник: ${esc(b.book)}. Темы идут в порядке пунктов учебника.</p><input class="search" id="srch" type="search" placeholder="Найти тему по названию или номеру"><div id="tl"></div>`;
  const tl=$("#tl");
  const draw=f=>{f=(f||"").toLowerCase();tl.innerHTML=b.sections.map((sec,si)=>{const ts=sec.topics.map((t,ti)=>[t,ti]).filter(([t])=>!f||(t.num+" "+t.title).toLowerCase().includes(f));if(!ts.length)return"";return `<section class="sec"><h3>${esc(sec.name)}</h3>${ts.map(([t,ti])=>{const key=`${g}-${s}-${t.num}`;const d=GAMES.filter(x=>store[key+"-"+x[0]]).length;return `<div class="topic"><span class="no">${esc(t.num)}</span><div><div class="tt">${fmt(t.title)}</div>${d?`<span class="done">Пройдено игр: ${d} из 4</span>`:""}</div><div class="games">${GAMES.map(x=>`<button class="gbtn ${x[0]==="lesson"?"lesson":""}" type="button" data-s="${si}" data-t="${ti}" data-k="${x[0]}">${x[1]} <em>${x[2]}</em></button>`).join("")}</div></div>`}).join("")}</section>`}).join("")||`<p class="lead">Ничего не найдено.</p>`;
    tl.querySelectorAll(".gbtn").forEach(x=>x.onclick=()=>play(g,s,+x.dataset.s,+x.dataset.t,x.dataset.k));};
  draw("");$("#srch").addEventListener("input",e=>draw(e.target.value));
}

function gameShell(g,s,t,kind){
  const l=lvlOf(g);crumbs([["Главная",""],[l.name,"lvl-"+l.id],[g+" класс","g"+g],[SUBJ[s],`g${g}-${s}`]]);
  const nm=GAMES.find(x=>x[0]===kind)[1];
  view.innerHTML=`<div class="stage"><div class="ghead"><span class="gname">${nm}</span><span class="gt">${esc(t.num)}. ${fmt(t.title)}</span><button class="btn alt" type="button" id="back">К темам</button></div><div id="gb"></div></div>`;
  $("#back").onclick=()=>go(`g${g}-${s}`);
  return $("#gb");
}
function play(g,s,si,ti,kind){
  clearView();
  const b=findBook(g,s),t=b.sections[si].topics[ti],key=`${g}-${s}-${t.num}-${kind}`;
  const box=gameShell(g,s,t,kind);window.scrollTo(0,0);
  const again=()=>play(g,s,si,ti,kind);
  if(kind==="learn")learn(box,t,key,again);
  else if(kind==="pairs")pairsGame(box,t,key,again);
  else if(kind==="tf")tfGame(box,t,key,again);
  else lesson(box,t,key,g,s);
}
function finish(box,got,total,key,again,extra){
  if(got/Math.max(total,1)>=.5)mark(key);
  box.innerHTML=`<div class="result"><div class="big">${got} / ${total}</div><p class="q" style="margin:14px 0 6px">${stars(got/Math.max(total,1))}</p>${extra?`<p class="lead" style="margin:0 auto">${extra}</p>`:""}<div class="row" style="justify-content:center"><button class="btn" id="ag" type="button">Сыграть ещё раз</button></div></div>`;
  $("#ag").onclick=again;
}

/* Изучаем */
function learn(box,t,key,again){
  let i=0;
  const th=()=>{
    if(!t.th.length)return quiz();
    box.innerHTML=`<div class="bar"><i style="width:${(i+1)/t.th.length*100}%"></i></div><p class="lead" style="margin:0">Правило из учебника, шаг ${i+1} из ${t.th.length}</p><div class="theory">${fmt(t.th[i])}</div><div class="row">${i?`<button class="btn alt" id="pv" type="button">Назад</button>`:""}<button class="btn" id="nx" type="button">${i<t.th.length-1?"Дальше":"Проверим себя"}</button></div>`;
    $("#nx").onclick=()=>{i++;i<t.th.length?th():quiz()};if(i)$("#pv").onclick=()=>{i--;th()};
  };
  const quiz=()=>{
    const qs=shuffle(t.qs).slice(0,8);let k=0,first=0,tries=0;
    const one=()=>{
      if(k>=qs.length)return finish(box,first,qs.length,key,again,"Засчитаны ответы с первой попытки.");
      tries=0;box.innerHTML=`<div class="bar"><i style="width:${k/qs.length*100}%"></i></div><div id="qq"></div><div class="row"><button class="btn" id="nx" type="button" hidden>Следующий вопрос</button></div>`;
      mcq($("#qq"),toItem(qs[k]),(ok,locked)=>{tries++;if(ok&&tries===1)first++;if(locked)$("#nx").hidden=false},{retry:true,hint:t.th.length?"Подсказка: "+t.th[Math.min(k,t.th.length-1)]:""});
      $("#nx").onclick=()=>{k++;one()};
    };one();
  };
  th();
}
/* Найди пару */
function pairsGame(box,t,key,again){
  let round=0,tot=0,miss=0;
  const r=()=>{round++;box.innerHTML=`<div class="score"><span>Раунд ${round} из 2</span></div><div id="pp" style="margin-top:14px"></div>`;
    const n=pairsRender($("#pp"),t.qs,(cnt,m)=>{tot+=cnt;miss+=m;setTimeout(()=>round<2?r():finish(box,Math.max(tot-miss,0),tot,key,again,`Найдено пар: ${tot}. Ошибочных попыток: ${miss}.`),700)});
    if(n<2)finish(box,0,0,key,again,"В этой теме мало заданий для пар.");};
  r();
}
/* Верно или неверно */
function tfGame(box,t,key,again){
  const N=10;let k=0,got=0,streak=0,best=0;const pool=shuffle(t.qs);
  const one=()=>{
    if(k>=N)return finish(box,got,N,key,again,`Лучшая серия правильных ответов подряд: ${best}.`);
    box.innerHTML=`<div class="score"><span>Вопрос ${k+1} из ${N}</span><span>Очки: ${got}</span><span>Серия: ${streak}</span></div><div class="bar"><i style="width:${k/N*100}%"></i></div><div id="qq"></div><div class="row"><button class="btn" id="nx" type="button" hidden>Дальше</button></div>`;
    tfRender($("#qq"),tfClaim(pool[k%pool.length]),ok=>{if(ok){got++;streak++;best=Math.max(best,streak)}else streak=0;$("#nx").hidden=false});
    $("#nx").onclick=()=>{k++;one()};
  };one();
}
/* Урок 40 минут: индивидуальная практика */
const normAns=s=>String(s).trim().replace(/\.$/,"").toLowerCase().replace(/[{}\s °%]/g,"").replace(/[−–]/g,"-").replace(/\./g,",").replace(/(см|мм|дм|км|м|кг|г|л|ч|мин|с|р|шт|раз[а]?)(\^?\d)?$/,"");
const canType=a=>/^[−\-]?\{?\d[\d\s]*(,\d+)?(\/\d+\})?\s*(°|%|см|мм|дм|км|м|кг|г|л|ч|мин|р\.?)?(\^[23])?$/.test(String(a).trim());
function typeRender(box,item,onAnswer){
  box.innerHTML=`<div class="q">${fmt(item.q)}</div><form class="typein"><input id="ti" type="text" inputmode="text" autocomplete="off" placeholder="Впиши ответ"><button class="btn" type="submit">Проверить</button></form><p class="lead" style="margin:8px 0 0;font-size:14px">Дробь пиши через косую черту: 3/4. Десятичную — через запятую.</p><div class="fb" aria-live="polite"></div>`;
  const fb=box.querySelector(".fb"),inp=box.querySelector("#ti");let tries=0,done=false;inp.focus();
  box.querySelector("form").addEventListener("submit",e=>{e.preventDefault();if(done||!inp.value.trim())return;tries++;
    const ok=normAns(inp.value)===normAns(item.a.replace(/\.$/,""));
    if(ok||tries>=2){done=true;inp.disabled=true;fb.className="fb "+(ok?"ok":"bad");fb.innerHTML=ok?"Верно!":`Правильный ответ: ${fmt(item.a)}`;onAnswer(ok&&tries===1)}
    else{fb.className="fb bad";fb.textContent="Не так. Проверь вычисления, есть ещё одна попытка.";inp.select()}});
}
function lesson(box,t,key,g,s){
  const ST=[["Устный счёт",5,"warm"],["Вопросы по теории",5,"theory"],["Решаем примеры",10,"quiz"],["Задания с ответом",8,"type"],["Найди ошибку",5,"tf"],["Найди пару",4,"pairs"],["Итог урока",3,"end"]];
  const gens=genFor(g,s);const typeable=t.qs.filter(q=>canType(q[1]));
  let stage=-1,elapsed=0,stageStart=0,paused=false,timer=null;const sc=ST.map(()=>[0,0]);
  box.innerHTML=`<p class="lead">Урок по теме «${fmt(t.title)}» на 40 минут. Каждый работает сам; таймер показывает время урока и текущего этапа, этап можно переключить раньше.</p>
   <ol class="lead">${ST.map(x=>`<li>${x[0]} — ${x[1]} мин</li>`).join("")}</ol>
   <div class="row"><button class="btn" id="st1" type="button">Начать урок</button></div>`;
  $("#st1").onclick=()=>{timer=setInterval(()=>{if(paused)return;elapsed++;tick()},1000);next()};
  cleanup=()=>clearInterval(timer);
  const mm=x=>{x=Math.max(0,x);return `${String(x/60|0).padStart(2,"0")}:${String(x%60).padStart(2,"0")}`};
  const tick=()=>{const c=$("#clk");if(!c)return;c.innerHTML=`${mm(2400-elapsed)}<small>этап: ${mm(ST[stage][1]*60-(elapsed-stageStart))}</small>`;
    if(elapsed>=2400){clearInterval(timer);stage=ST.length-2;next();return}
    if(ST[stage][2]!=="end"&&elapsed-stageStart>=ST[stage][1]*60)next()};
  const award=ok=>{sc[stage][1]++;if(ok)sc[stage][0]++;drawScore()};
  const drawScore=()=>{const el=$("#tm");if(!el)return;const tot=sc.reduce((a,x)=>[a[0]+x[0],a[1]+x[1]],[0,0]);el.innerHTML=`<div class="team turn">На этом этапе: верно <span class="pts">${sc[stage][0]} / ${sc[stage][1]}</span></div><div class="team">За урок <span class="pts">${tot[0]} / ${tot[1]}</span></div>`};
  const loop=(sb,pool,render,btn)=>{let p=shuffle(pool),k=0;const one=()=>{if(k>=p.length){p=shuffle(pool);k=0}sb.innerHTML=`<div id="qq"></div><div class="row"><button class="btn" id="nx" type="button" hidden>${btn}</button></div>`;render($("#qq"),p[k],ok=>{award(ok);$("#nx").hidden=false;$("#nx").focus()});$("#nx").onclick=()=>{k++;one()}};one()};
  const next=()=>{
    stage++;stageStart=elapsed;if(stage>=ST.length)stage=ST.length-1;
    box.innerHTML=`<div class="lessonbar"><div class="clock" id="clk"></div><div><div class="steps">${ST.map((x,i)=>`<b class="${i===stage?"on":i<stage?"past":""}">${i+1}. ${x[0]}</b>`).join("")}</div><div class="row" style="margin-top:10px"><button class="btn alt" id="pz" type="button">Пауза</button>${stage<ST.length-1?`<button class="btn alt" id="sk" type="button">Следующий этап</button>`:""}</div></div></div>${ST[stage][2]!=="end"?`<div class="teams" id="tm"></div>`:""}<div id="sb"></div>`;
    tick();drawScore();
    $("#pz").onclick=e=>{paused=!paused;e.target.textContent=paused?"Продолжить":"Пауза"};
    if($("#sk"))$("#sk").onclick=next;
    const sb=$("#sb"),type=ST[stage][2];
    if(type==="warm"){const one=()=>{sb.innerHTML=`<div id="qq"></div><div class="row"><button class="btn" id="nx" type="button" hidden>Ещё пример</button></div>`;mcq($("#qq"),pick(gens)(),ok=>{award(ok);$("#nx").hidden=false});$("#nx").onclick=one};one()}
    else if(type==="theory"){
      const th=t.th.length?t.th:["Вспомним главное из пункта «"+t.title+"»."];let i=0;
      const card=()=>{sb.innerHTML=`<p class="lead" style="margin:0">Правило ${i+1} из ${th.length}. Прочитай и приведи свой пример.</p><div class="theory">${fmt(th[i])}</div><div class="row">${i?`<button class="btn alt" id="pv" type="button">Назад</button>`:""}<button class="btn" id="nx" type="button">${i<th.length-1?"Дальше":"Проверим теорию"}</button></div>`;$("#nx").onclick=()=>{if(i<th.length-1){i++;card()}else check()};if(i)$("#pv").onclick=()=>{i--;card()}};
      const check=()=>{const pool=t.qs.filter(q=>!/^[\d\s(−\-]/.test(q[0])&&!/=\s*\?/.test(q[0]));loop(sb,(pool.length>=3?pool:t.qs).map(toItem),(b,it,cb)=>mcq(b,it,cb),"Следующий вопрос")};
      card()}
    else if(type==="quiz")loop(sb,t.qs.map(toItem),(b,it,cb)=>mcq(b,it,cb),"Следующий пример");
    else if(type==="type"){if(typeable.length)loop(sb,typeable.map(q=>({q:q[0],a:q[1]})),typeRender,"Следующее задание");else{sb.innerHTML=`<p class="lead">В этой теме ответы словесные — решаем с выбором ответа.</p><div id="sb2"></div>`;loop($("#sb2"),t.qs.map(toItem),(b,it,cb)=>mcq(b,it,cb),"Следующее задание")}}
    else if(type==="tf")loop(sb,t.qs,(b,q,cb)=>tfRender(b,tfClaim(q),cb),"Дальше");
    else if(type==="pairs"){const one=()=>{sb.innerHTML=`<div id="pp"></div><div class="row"><button class="btn" id="nx" type="button" hidden>Новый набор пар</button></div>`;pairsRender($("#pp"),t.qs,(n,m)=>{sc[stage][0]+=Math.max(n-m,0);sc[stage][1]+=n;drawScore();$("#nx").hidden=false});$("#nx").onclick=one};one()}
    else{mark(key);clearInterval(timer);
      const rows=ST.slice(0,-1).map((x,i)=>`<tr><td>${x[0]}</td><td style="text-align:right">${sc[i][0]} / ${sc[i][1]}</td></tr>`).join("");
      const tot=sc.reduce((a,x)=>[a[0]+x[0],a[1]+x[1]],[0,0]);
      sb.innerHTML=`<div class="result"><div class="big">${tot[0]} / ${tot[1]}</div><p class="q" style="margin:12px 0">${stars(tot[0]/Math.max(tot[1],1))}</p><table class="sum"><tbody>${rows}</tbody></table><p class="lead" style="margin:18px auto 12px">Как прошёл урок? Выбери, что ближе.</p><div class="mood">${["Всё понятно, могу объяснить другому","Понятно, но нужна тренировка","Остались вопросы"].map(x=>`<button type="button">${x}</button>`).join("")}</div><p class="lead" style="margin:18px auto 0">Домашнее задание — упражнения к пункту ${esc(t.num)} учебника.</p></div>`;
      sb.querySelectorAll(".mood button").forEach(x=>x.onclick=()=>{sb.querySelectorAll(".mood button").forEach(y=>y.classList.remove("sel"));x.classList.add("sel")});}
  };
}

/* ---------- маршрутизация ---------- */
function route(){
  clearView();const h=location.hash.slice(1);let m;
  if(!h)home();
  else if(m=h.match(/^lvl-(\w+)$/))level(m[1]);
  else if(m=h.match(/^g(\d+)-(\w+)$/))subject(m[1],m[2]);
  else if(m=h.match(/^g(\d+)$/))grade(m[1]);
  else home();
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",route);
$("#homeBtn").onclick=()=>go("");
$("#fsBtn").onclick=()=>{try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{})}catch(e){}};
route();
}
