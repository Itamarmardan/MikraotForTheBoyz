/* בדיקת תקינות הבנק – שאלה פגומה מדווחת בקונסול ולא שוברת את המבחן */
Q.forEach((q,i)=>{
  const ok=Array.isArray(q.a)?q.a.every(x=>q.o[x]!==undefined):q.o&&q.o[q.a]!==undefined;
  if(!CH[q.c]||!q.q||!Array.isArray(q.o)||!ok)console.warn('שאלה לא תקינה בבנק (מספר '+(i+1)+'):',q);
});

/* ======= STATE ======= */
let currentCh='all', activeQ=[], curIdx=0, answers={}, pending={}, nCorrect=0, nWrong=0;

const isMulti=q=>Array.isArray(q.a);
const correctSet=q=>isMulti(q)?q.a:[q.a];
const isRight=(q,ans)=>isMulti(q)?(ans.length===q.a.length&&ans.every(x=>q.a.includes(x))):ans===q.a;

const $=id=>document.getElementById(id);
const answeredCount=()=>Object.keys(answers).length;

function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function load(ch,override){
  currentCh=ch; answers={}; pending={}; nCorrect=0; nWrong=0;
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

function show(idx){
  curIdx=idx;
  const q=activeQ[idx]; if(!q)return;
  const ans=answers[idx];
  const card=$('q-card');
  card.classList.remove('enter'); void card.offsetWidth; card.classList.add('enter');
  $('q-chapter-label').textContent=CH[q.c]||q.c;
  $('q-counter').textContent=`שאלה ${idx+1} מתוך ${activeQ.length}`;
  $('q-text').textContent=q.q;
  $('q-hint').textContent=isMulti(q)&&ans===undefined?`יש לבחור ${q.a.length} תשובות (${(pending[idx]||[]).length}/${q.a.length})`:'';
  const list=$('options-list'); list.innerHTML='';
  q.o.forEach((opt,i)=>{
    const btn=document.createElement('button');
    btn.className='opt-btn';
    if(ans!==undefined){
      btn.disabled=true;
      const chosen=isMulti(q)?ans.includes(i):i===ans;
      if(correctSet(q).includes(i))btn.classList.add('correct');
      else if(chosen)btn.classList.add('wrong');
    }else if(isMulti(q)&&(pending[idx]||[]).includes(i))btn.classList.add('selected');
    btn.innerHTML=`<span class="opt-letter">${L[i]}</span><span>${opt}</span>`;
    btn.addEventListener('click',()=>pick(i));
    list.appendChild(btn);
  });
  const fb=$('feedback-box');
  if(ans!==undefined){
    const ok=isRight(q,ans);
    fb.className='show '+(ok?'correct-fb':'wrong-fb');
    fb.innerHTML=`<div id="feedback-verdict">${ok?'✓ נכון!':'✗ לא נכון'}</div>${q.e?`<div>${q.e}</div>`:''}`;
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
  if(isMulti(q)){
    const sel=pending[curIdx]=pending[curIdx]||[];
    const at=sel.indexOf(i); if(at>=0)sel.splice(at,1);else sel.push(i);
    if(sel.length<q.a.length){show(curIdx);return;}
    answers[curIdx]=[...sel].sort();
  }else answers[curIdx]=i;
  if(isRight(q,answers[curIdx]))nCorrect++;else nWrong++;
  updateStats(); show(curIdx);
  // אין מעבר אוטומטי – המשתמש לוחץ על "הבאה" בעצמו
}

function goNext(){
  if(curIdx<activeQ.length-1)show(curIdx+1);
  else if(answeredCount()===activeQ.length)result();
}
function goPrev(){if(curIdx>0)show(curIdx-1);}

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
document.querySelectorAll('.ch-btn').forEach(b=>b.addEventListener('click',()=>load(b.dataset.chapter)));
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
  if($('result-screen').classList.contains('show'))return;
  // חיצים (RTL): ימין = הקודמת, שמאל = הבאה
  if(e.key==='ArrowRight'){goPrev();return;}
  if(e.key==='ArrowLeft'){if(!$('btn-next').disabled)goNext();return;}
  if(answers[curIdx]===undefined){
    const m={'1':0,'2':1,'3':2,'4':3,'א':0,'ב':1,'ג':2,'ד':3};
    if(m[e.key]!==undefined&&m[e.key]<activeQ[curIdx].o.length)pick(m[e.key]);
  }
});

load('all');
