/* דף הסיכומים: מציג את SUMMARIES כפרקים נפתחים, עם חיפוש. */
(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  const list=$('sum-list'),index=$('sum-index'),search=$('sum-search');

  let lastG=null;
  SUMMARIES.forEach(ch=>{
    if(ch.group!==lastG){lastG=ch.group;
      const g=document.createElement('h2');g.className='grp';g.textContent=ch.group;list.appendChild(g);
      const gi=document.createElement('span');gi.className='grp-lbl';gi.textContent=ch.group+':';index.appendChild(gi);}
    const d=document.createElement('details');
    d.className='chap';d.id=ch.id;
    d.innerHTML='<summary>'+esc(ch.title)+'<span class="pg">עמ\' '+esc(ch.pages)+'</span></summary>'+
      '<div class="chap-body">'+ch.blocks.map(b=>
        '<h3>'+esc(b.h)+'</h3><ul>'+b.items.map(t=>'<li>'+md(t)+'</li>').join('')+'</ul>'
      ).join('')+'</div>';
    list.appendChild(d);
    const a=document.createElement('a');
    a.href='#'+ch.id;a.textContent=ch.title;
    a.addEventListener('click',()=>{d.open=true;});
    index.appendChild(a);
  });

  $('sum-open').onclick=()=>list.querySelectorAll('details').forEach(d=>d.open=true);
  $('sum-close').onclick=()=>list.querySelectorAll('details').forEach(d=>d.open=false);

  const original=new Map();
  list.querySelectorAll('li').forEach(li=>original.set(li,li.innerHTML));
  const mark=(html,q)=>html.replace(/(<[^>]+>)|([^<]+)/g,(m,tag,text)=>{
    if(tag)return tag;
    const i=text.toLowerCase().indexOf(q);
    if(i<0)return text;
    let out='',pos=0,i2,low=text.toLowerCase();
    while((i2=low.indexOf(q,pos))>=0){out+=text.slice(pos,i2)+'<mark>'+text.slice(i2,i2+q.length)+'</mark>';pos=i2+q.length;}
    return out+text.slice(pos);
  });
  search.addEventListener('input',()=>{
    const q=search.value.trim().toLowerCase();
    list.querySelectorAll('details').forEach(d=>{
      let hits=0;
      d.querySelectorAll('li').forEach(li=>{
        const txt=li.textContent.toLowerCase();
        const ok=!q||txt.includes(q);
        li.classList.toggle('hidden',!ok);
        li.innerHTML=q&&ok?mark(original.get(li),q):original.get(li);
        if(ok&&q)hits++;
      });
      d.querySelectorAll('h3').forEach(h=>{
        let n=h.nextElementSibling,any=false;
        n.querySelectorAll('li').forEach(li=>{if(!li.classList.contains('hidden'))any=true;});
        h.classList.toggle('hidden',!any);n.classList.toggle('hidden',!any);
      });
      d.classList.toggle('hidden',!!q&&hits===0);
      if(q)d.open=hits>0;
    });
  });
  search.addEventListener('input',()=>{
    list.querySelectorAll('h2.grp').forEach(h=>{
      let n=h.nextElementSibling,any=false;
      while(n&&!n.classList.contains('grp')){if(!n.classList.contains('hidden'))any=true;n=n.nextElementSibling;}
      h.classList.toggle('hidden',!any);
    });
  });
})();
