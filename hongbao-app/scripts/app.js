'use strict';
const equipmentOptions = [
  { type: 'basic-shield', label: 'Basic Shield', emoji: '🧱', category: 'defensive', effect: 'Blocks one loss from Lucky Spin', cost: 1 },
  { type: 'ultimate-lock', label: 'Ultimate Lock', emoji: '🔐', category: 'defensive', effect: 'You cannot gain or lose Hongbao until unlocked', cost: 2 },
  { type: 'lucky-spin-insurance', label: 'Lucky Spin Insurance', emoji: '🎲', category: 'defensive', effect: 'Recover half of lost Hongbao from a spin', cost: 2 },
  { type: 'swap-blocker', label: 'Swap Blocker', emoji: '🚫🔄', category: 'defensive', effect: 'Blocks one Super Swap', cost: 5 },
  { type: 'reactive-shield', label: 'Reactive Shield', emoji: '⚡🛡', category: 'defensive', effect: 'Automatically blocks one loss', cost: 3 },
  { type: 'double-reward', label: 'Double Reward', emoji: '✨', category: 'active', effect: 'Double your next Hongbao win (no Jackpot)', cost: 3 },
  { type: 'lucky-boost', label: 'Lucky Boost', emoji: '🍀', category: 'active', effect: '+2 bonus if you win on Lucky Spin (same lesson)', cost: 1 },
  { type: 'extra-spin', label: 'Extra Spin', emoji: '🎡', category: 'active', effect: 'Buy one extra spin if you missed out', cost: 1 },
  { type: 'sword', label: 'Sword', emoji: '⚔️', category: 'active', effect: 'Double your steal amount once', cost: 2 }
];
const equipmentMap = equipmentOptions.reduce((map, item) => { map[item.type] = item; return map; }, {});

const levelRules = [
  { min: 30, name: 'Legend', thumb: 'images/legend-thumb.jpg', preview: 'images/legend-preview.jpg', label: 'Legend' },
  { min: 20, name: 'Master', thumb: 'images/master-thumb.jpg', preview: 'images/master-preview.jpg', label: 'Master' },
  { min: 10, name: 'Skilled', thumb: 'images/skilled-thumb.jpg', preview: 'images/skilled-preview.jpg', label: 'Skilled' },
  { min: 0, name: 'Beginner', thumb: 'images/beginner-thumb.jpg', preview: 'images/beginner-preview.jpg', label: 'Beginner' }
];


const keys=['year7','year8','year9','year10'];
const $=id=>document.getElementById(id);
let data=null, loading=false, selectedYear="";
function finite(value,fallback=0){return typeof value==='number'&&Number.isFinite(value)?value:fallback;}
function levelFor(s){const peak=Math.max(0,finite(s.peakHongbao,finite(s.hongbao)),finite(s.hongbao));return levelRules.find(l=>peak>=l.min)||levelRules[levelRules.length-1];}
function validate(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid JSON data.');
 const out={updatedAt:raw.updatedAt};
 for(const key of keys){
  if(!raw[key]||!Array.isArray(raw[key].students))throw Error('Missing class data: '+key);
  out[key]={students:raw[key].students.map(s=>{
   if(!s||typeof s.name!=='string'||typeof s.hongbao!=='number'||!Number.isFinite(s.hongbao))throw Error('Invalid student record in '+key);
   return {name:s.name,hongbao:s.hongbao,peakHongbao:finite(s.peakHongbao,s.hongbao),active:s.active!==false,equipment:Array.isArray(s.equipment)?s.equipment.map(e=>typeof e==='string'?e:e&&e.type).filter(e=>typeof e==='string'):[]};
  })};
 }
 return out;
}
function timeLabel(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))return 'Data updated: time not provided';
 return 'Data updated: '+new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Brisbane',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}).format(new Date(value))+' (Brisbane)';
}
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function image(path,alt,cls){const n=node('img',undefined,cls);n.src=path;n.alt=alt;n.addEventListener('error',()=>{n.hidden=true;},{once:true});return n;}
function badge(s){const l=levelFor(s),b=node('div',undefined,'badge');b.append(image(l.thumb,l.name+' badge'),node('strong',l.name));return b;}
function showDetail(s){
 const b=$('detailBody');b.replaceChildren();const l=levelFor(s);
 b.append(node('p','MY HONGBAO','eyebrow'),node('h2',s.name),node('div','🧧 '+s.hongbao,'balance'),badge(s),image(l.preview,l.name+' level artwork','level-preview'),node('p','Level is based on your highest Hongbao balance, as in the classroom app.','muted'),node('h3','My equipment'));
 if(!s.equipment.length)b.append(node('p','No equipment yet.'));
 for(const type of s.equipment){const e=equipmentMap[type],card=node('div',undefined,'equipment');card.append(node('strong',e?e.emoji+' '+e.label:type),node('p',e?e.effect:'Equipment details are unavailable.'));b.append(card);}
 b.append(node('p','Read only. Ask Mr Wen about changes or redemptions.','muted'));$('detail').showModal();
}
function rankedStudents(key){
 const sorted=data[key].students.slice().sort((a,b)=>b.hongbao-a.hongbao||a.name.localeCompare(b.name,'en-AU'));
 let rank=0,last=null;
 return sorted.map((student,index)=>{if(index===0||student.hongbao!==last)rank=index+1;last=student.hongbao;return {student,rank,key};});
}
function render(){
 const results=$('results'),tiles=$('tiles');results.replaceChildren();tiles.replaceChildren();if(!data)return;
 const q=$('search').value.trim().toLocaleLowerCase();
 $('back').hidden=!selectedYear;
 $('boardTitle').textContent=selectedYear?'Year '+selectedYear.slice(4)+' Chinese':q?'Search across all year levels':'Choose your class';
 if(!selectedYear){for(const key of keys){const tile=node('button',undefined,'year-tile');tile.type='button';tile.append(node('span','🧧'),node('h3','Year '+key.slice(4)+' Chinese'),node('small',data[key].students.length+' students · View leaderboard →'));tile.addEventListener('click',()=>{selectedYear=key;$('search').value='';render();});tiles.append(tile);}}
 if(!selectedYear&&!q){$('status').textContent='Choose a year tile to see the full leaderboard, or search all students above.';return;}
 const scope=selectedYear?[selectedYear]:keys;
 const matches=scope.flatMap(key=>rankedStudents(key)).filter(x=>!q||x.student.name.toLocaleLowerCase().includes(q));
 if(!selectedYear)matches.sort((a,b)=>b.student.hongbao-a.student.hongbao||a.student.name.localeCompare(b.student.name,'en-AU'));
 $('status').textContent=matches.length?matches.length+' student'+(matches.length===1?'':'s')+' · Highest balance first · Equal balances share a rank.': 'No matching students. Try another name.';
 const wrap=node('div',undefined,'table-scroll'),table=node('table',undefined,'leaderboard-table');
 const caption=node('caption',selectedYear?'Year '+selectedYear.slice(4)+' Chinese - Hong Bao Leaderboard':'Search results - Hong Bao Leaderboard');table.append(caption);
 const head=node('thead'),hr=node('tr');for(const title of ['Rank','Level','Name','Inventory','Hong Bao Balance','Total']){const th=node('th',title);th.scope='col';hr.append(th);}head.append(hr);table.append(head);
 const body=node('tbody');
 for(const {student:s,rank,key} of matches){
  const row=node('tr');
  const rankCell=node('td');rankCell.append(node('span',String(rank),'rank-badge'));
  const levelCell=node('td'),levelButton=node('button',undefined,'level-button');levelButton.type='button';const l=levelFor(s);levelButton.setAttribute('aria-label',s.name+' — '+l.name+' level');levelButton.title=l.name;levelButton.append(image(l.thumb,l.name,'level-thumb'));levelButton.addEventListener('click',()=>showDetail(s));levelCell.append(levelButton);
  const nameCell=node('td',undefined,'student-name');nameCell.append(node('strong',s.name));if(!selectedYear)nameCell.append(node('small','Year '+key.slice(4),'year-note'));
  const inventoryCell=node('td'),inventoryButton=node('button',undefined,'backpack-button');inventoryButton.type='button';inventoryButton.title='View inventory';inventoryButton.setAttribute('aria-label','View inventory for '+s.name);inventoryButton.append(image(s.equipment.length?'images/backpack-full.png':'images/backpack-empty.png','Inventory','backpack-icon'));inventoryButton.addEventListener('click',()=>showDetail(s));inventoryCell.append(inventoryButton);
  const balanceCell=node('td',undefined,'hongbao-balance'),tokens=node('div',undefined,'hongbao-tokens');tokens.setAttribute('aria-label',s.hongbao+' Hong Bao');
  if(s.hongbao>0){for(let i=0;i<Math.min(40,Math.floor(s.hongbao));i++){const token=node('span','🧧','hongbao-token');token.setAttribute('aria-hidden','true');tokens.append(token);}if(s.hongbao>40)tokens.append(node('span','…','overflow-tokens'));}
  else tokens.append(node('span',s.hongbao<0?'Balance owing':'—',s.hongbao<0?'negative-total':'muted'));balanceCell.append(tokens);
  const totalCell=node('td');totalCell.append(node('span',String(s.hongbao),s.hongbao<0?'total-badge negative-total':'total-badge'));
  row.append(rankCell,levelCell,nameCell,inventoryCell,balanceCell,totalCell);body.append(row);
 }
 table.append(body);wrap.append(table);results.append(wrap);

}
function applyData(raw){
 const next=validate(raw);data=next;
 $('updated').textContent=timeLabel(data.updatedAt);
 $('search').disabled=false;
 $('status').className='';render();
}
async function load(){
 if(location.protocol==='file:'){
  $('localPreview').hidden=false;
  $('updated').textContent=data?timeLabel(data.updatedAt):'Local preview';
  $('status').textContent=data?'Local preview loaded. Choose a year tile or search students.':'Choose the exported JSON file below to preview rewards. Online hosting loads it automatically.';
  return;
 }

 if(loading)return;loading=true;$('refresh').disabled=true;$('search').disabled=true;$('detail').close();$('results').replaceChildren();$('status').className='';$('status').textContent='Loading published data…';
 try{const response=await fetch('./2026-hongbao-data.json',{cache:'no-store'});if(!response.ok)throw Error('Data file could not be loaded (HTTP '+response.status+').');data=validate(await response.json());$('updated').textContent=timeLabel(data.updatedAt);$('search').disabled=false;render();}
 catch(e){data=null;$('updated').textContent='Published data unavailable';$('status').className='error';$('status').textContent='Unable to load rewards. Please try Refresh data or contact Mr Wen. '+(location.protocol==='file:'?'Open this app through a web server, not by double-clicking index.html.':'');console.error(e);}
 finally{loading=false;$('refresh').disabled=false;}
}
$('back').addEventListener('click',()=>{selectedYear='';$('search').value='';render();});$('search').addEventListener('input',render);$('refresh').addEventListener('click',load);$('close').addEventListener('click',()=>$('detail').close());

$('localJson').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 try{if(file.size>10*1024*1024)throw Error('File exceeds 10 MB.');
  applyData(JSON.parse(await file.text()));
 }catch(error){$('status').className='error';$('status').textContent='Could not read this JSON: '+error.message;}
 event.target.value='';
});
load();
