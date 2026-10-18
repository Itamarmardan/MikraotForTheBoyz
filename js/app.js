/* בדיקת תקינות הבנק – שאלה פגומה מדווחת בקונסול ולא שוברת את המבחן */
Q.forEach((q,i)=>{
  const ok=q.t==='order'?(q.o&&q.o.length>=2):Array.isArray(q.a)?q.a.every(x=>q.o[x]!==undefined):q.o&&q.o[q.a]!==undefined;
  if(!CH[q.c]||!q.q||!Array.isArray(q.o)||!ok)console.warn('שאלה לא תקינה בבנק (מספר '+(i+1)+'):',q);
});

/* ======= STATE ======= */
let currentCh='all', activeQ=[], curIdx=0, answers={}, pending={}, nCorrect=0, nWrong=0;

/* סוגי שאלות: רגילה (a=מספר) · ריבוי תשובות (a=מערך) · סידור (t:'order', o=הפריטים בסדר הנכון) */
const isOrder=q=>q.t==='order';
const isMulti=q=>Array.isArray(q.a);
const needed=q=>isOrder(q)?q.o.length:isMulti(q)?q.a.length:1;
const correctSet=q=>isMulti(q)?q.a:[q.a];
const isRight=(q,ans)=>isOrder(q)?ans.every((v,i)=>v===i):isMulti(q)?(ans.length===q.a.length&&ans.every(x=>q.a.includes(x))):ans===q.a;
/* סדר תצוגה קבוע לכל שאלת סידור (מעורבב, אף פעם לא הסדר הנכון) */
function perm(q){
  if(!q._perm){let p;do{p=shuffle(q.o.map((_,i)=>i));}while(p.every((v,i)=>v===i));q._perm=p;}
  return q._perm;
}

const $=id=>document.getElementById(id);
const answeredCount=()=>Object.keys(answers).length;

function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function load(ch,override){
  currentCh=ch; answers={}; pending={}; Q.forEach(q=>delete q._perm); nCorrect=0; nWrong=0;
  activeQ=override?override: ch==='all'?shuffle([...Q]):ch==='mk_all'?shuffle(Q.filter(q=>q.c.startsWith('mk'))):shuffle(Q.filter(q=>q.c===ch));
  document.querySelectorAll('.ch-btn').forEach(b=>b.classList.toggle('active',b.dataset.chapter===ch));
  curIdx=0;
  updateStats();
  show(0);
  $('result-screen').classList.remove('show');
  $('q-card').style.display='';
  $('btn-skip').style.display='';
  $('progress-wrap').style.display='';
}

function show(idx,fresh=true){
  curIdx=idx;
  const q=activeQ[idx]; if(!q)return;
  const ans=answers[idx];
  const card=$('q-card');
  const list=$('options-list');
  const sel=pending[idx]||[];
  if(fresh){
    $('q-chapter-label').textContent=CH[q.c]||q.c;
    $('q-counter').textContent=`שאלה ${idx+1} מתוך ${activeQ.length}`;
    $('q-text').textContent=q.q;
    list.innerHTML='';
    (isOrder(q)?perm(q):q.o.map((_,i)=>i)).forEach(i=>{
      const btn=document.createElement('button');
      btn.className='opt-btn'; btn.dataset.i=i;
      btn.innerHTML=`<span class="opt-letter"></span><span>${q.o[i]}</span>`;
      btn.addEventListener('click',()=>pick(i));
      list.appendChild(btn);
    });
  }
  $('q-hint').textContent=ans!==undefined?'':isOrder(q)?`לחצו על הפריטים לפי הסדר הנכון (${sel.length}/${q.o.length})`:isMulti(q)?`יש לבחור ${q.a.length} תשובות (${sel.length}/${q.a.length})`:'';
  /* צביעה במקום – הכפתורים לא נבנים מחדש, ולכן הצבעים נכנסים בהדרגה (transition) */
  list.querySelectorAll('.opt-btn').forEach(btn=>{
    const i=+btn.dataset.i;
    const letter=btn.firstChild;
    let state='',txt=L[i];
    if(isOrder(q)){
      const pos=(ans!==undefined?ans:sel).indexOf(i);
      txt=pos>=0?pos+1:'';
      if(ans!==undefined)state=ans[pos]===pos?'correct':'wrong';
      else if(pos>=0)state='selected';
    }else if(ans!==undefined){
      const chosen=isMulti(q)?ans.includes(i):i===ans;
      if(correctSet(q).includes(i))state='correct';else if(chosen)state='wrong';
    }else if(isMulti(q)&&sel.includes(i))state='selected';
    btn.classList.remove('correct','wrong','selected');
    if(state)btn.classList.add(state);
    btn.disabled=ans!==undefined;
    if(letter.textContent!==String(txt))letter.textContent=txt;
  });
  const fb=$('feedback-box');
  if(ans!==undefined){
    const ok=isRight(q,ans);
    const wasShown=fb.classList.contains('show');
    fb.className='show '+(ok?'correct-fb':'wrong-fb')+(fresh||wasShown?' instant':'');
    fb.innerHTML=`<div id="feedback-verdict">${ok?'✓ נכון!':'✗ לא נכון'}</div>${isOrder(q)&&!ok?`<div><b>הסדר הנכון:</b><ol class="order-ans">${q.o.map(x=>`<li>${x}</li>`).join('')}</ol></div>`:''}${q.e?`<div>${q.e}</div>`:''}`;
  }else{fb.className='';fb.innerHTML='';}
  updateNav();
  const done=answeredCount();
  $('progress-bar-fill').style.width=(activeQ.length?(done/activeQ.length*100):0)+'%';
  $('progress-label').textContent=`${done} / ${activeQ.length}`;
}

/* כפתור "הבאה" – אף פעם לא מתקדם לבד, רק מודגש אחרי שנענתה השאלה */
function updateNav(){
  const last=curIdx>=activeQ.length-1;
  const allDone=answeredCount()===activeQ.length;
  const next=$('btn-next');
  $('btn-prev').disabled=(curIdx===0);
  next.textContent=last?'סיום ←':'הבאה ←';
  next.disabled=last?!allDone:false;
  next.classList.toggle('ready',answers[curIdx]!==undefined&&!next.disabled);
}

function pick(i){
  if(answers[curIdx]!==undefined)return;
  const q=activeQ[curIdx];
  if(isMulti(q)||isOrder(q)){
    const sel=pending[curIdx]=pending[curIdx]||[];
    const at=sel.indexOf(i); if(at>=0)sel.splice(at,1);else sel.push(i);
    if(sel.length<needed(q)){show(curIdx,false);return;}
    answers[curIdx]=isOrder(q)?[...sel]:[...sel].sort();
  }else answers[curIdx]=i;
  if(isRight(q,answers[curIdx]))nCorrect++;else nWrong++;
  updateStats(); show(curIdx,false);
  // גלילה עדינה כך שההסבר וכפתור "הבאה" ייראו
  $('nav-row').scrollIntoView({behavior:'smooth',block:'nearest'});
  // אין מעבר אוטומטי – המשתמש לוחץ על "הבאה" בעצמו
}

/* מעבר רך בין שאלות: דהייה קצרה החוצה, החלפת התוכן, דהייה פנימה */
let moving=false;
function fadeTo(fn){
  if(moving)return; moving=true;
  const card=$('q-card');
  card.classList.add('fade-out');
  setTimeout(()=>{fn();card.classList.remove('fade-out');setTimeout(()=>{moving=false;},260);},240);
}
const toCard=()=>$('q-card').scrollIntoView({behavior:'smooth',block:'start'});
function goNext(){
  if(curIdx<activeQ.length-1)fadeTo(()=>{show(curIdx+1);toCard();});
  else if(answeredCount()===activeQ.length)result();
}
function goPrev(){if(curIdx>0)fadeTo(()=>{show(curIdx-1);toCard();});}

function updateStats(){
  $('stat-total').textContent=activeQ.length;
  $('stat-answered').textContent=answeredCount();
  $('stat-correct').textContent=nCorrect;
  $('stat-wrong').textContent=nWrong;
}

function result(){
  $('q-card').style.display='none';
  $('btn-skip').style.display='none';
  $('progress-wrap').style.display='none';
  const pct=Math.round(nCorrect/activeQ.length*100);
  $('result-emoji').textContent=pct>=80?'🎉':pct>=60?'👍':'📚';
  $('result-title').textContent=pct>=80?'מצוין!':pct>=60?'טוב! עוד קצת':'יש להתחזק';
  $('result-score').textContent=pct+'%';
  $('result-detail').textContent=`${nCorrect} נכון מתוך ${activeQ.length} · ${nWrong} שגיאות`;
  $('btn-retry').classList.toggle('show',nWrong>0);
  $('result-screen').classList.add('show');
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ======= EVENTS ======= */
document.querySelectorAll('.ch-btn').forEach(b=>b.addEventListener('click',()=>{moving=false;load(b.dataset.chapter);}));
$('btn-prev').addEventListener('click',goPrev);
$('btn-next').addEventListener('click',goNext);
$('btn-skip').addEventListener('click',()=>{
  for(let i=0;i<activeQ.length;i++){const j=(curIdx+1+i)%activeQ.length;if(answers[j]===undefined){show(j);return;}}
});
$('btn-restart').addEventListener('click',()=>load(currentCh));
$('btn-retry').addEventListener('click',()=>{
  const wrong=activeQ.filter((q,i)=>answers[i]!==undefined&&!isRight(q,answers[i]));
  load(currentCh,shuffle(wrong));
});
document.addEventListener('keydown',e=>{
  if(document.body.classList.contains('locked')||/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||''))return;
  if($('result-screen').classList.contains('show'))return;
  // חיצים (RTL): ימין = הקודמת, שמאל = הבאה
  if(e.key==='ArrowRight'){goPrev();return;}
  if(e.key==='ArrowLeft'){if(!$('btn-next').disabled)goNext();return;}
  if(answers[curIdx]===undefined){
    const m={'1':0,'2':1,'3':2,'4':3,'א':0,'ב':1,'ג':2,'ד':3};
    const q=activeQ[curIdx];
    if(m[e.key]!==undefined&&m[e.key]<q.o.length)pick(isOrder(q)?perm(q)[m[e.key]]:m[e.key]);
  }
});

load('all');
