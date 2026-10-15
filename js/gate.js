/* קוד גישה – נבדק מול גיבוב (hash), הקוד עצמו לא כתוב בקובץ.
   לשינוי הקוד: מחשבים hash(קוד חדש) ומחליפים את ACCESS_HASH.
   הערה: זו הגנה בסיסית בצד הלקוח בלבד – לא אבטחה אמיתית. */
(function(){
  const ACCESS_HASH=5539916872094632;
  const KEY='mikraot_access_v2';
  const hash=(s,seed=0)=>{
    let h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;
    for(let i=0,ch;i<s.length;i++){ch=s.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}
    h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
    h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
    return 4294967296*(2097151&h2)+(h1>>>0);
  };
  const gate=document.getElementById('gate');
  const unlock=()=>{document.body.classList.remove('locked');gate.remove();};
  let saved=null;try{saved=localStorage.getItem(KEY);}catch(e){}
  if(saved===String(ACCESS_HASH)){unlock();return;}
  const form=document.getElementById('gate-form'),input=document.getElementById('gate-input'),err=document.getElementById('gate-err');
  input.focus();
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(hash(input.value.trim())===ACCESS_HASH){
      try{localStorage.setItem(KEY,String(ACCESS_HASH));}catch(e){}
      unlock();
    }else{
      err.textContent='קוד שגוי, נסו שוב';
      gate.classList.remove('shake');void gate.offsetWidth;gate.classList.add('shake');
      input.value='';input.focus();
    }
  });
})();
