const CODE="7379";const $=id=>document.getElementById(id);
function unlock(){$('gate').remove();$('app').hidden=false;run()}
if(localStorage.wiok===CODE)unlock();
$('pin').oninput=()=>{const p=$('pin');if(p.value.length===4){if(p.value===CODE){localStorage.wiok=CODE;unlock()}else{$('bad').textContent='Wrong code';p.value=''}}};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button,.tab').forEach(x=>x.classList.remove('on'));b.classList.add('on');$('t-'+b.dataset.t).classList.add('on');if(b.dataset.t==='map')initMap();if(b.dataset.t==='log')renderLog();scrollTo(0,0)});
const HOME={lat:43.4722,lon:-91.2035};let P=HOME;const C={};
const f=d=>d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
const dir=d=>['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8];
function sunTimes(date,lat,lon){const r=Math.PI/180,J=date/864e5+2440587.5,n=Math.round(J-2451545-0.0009+lon/360),Js=2451545+0.0009-lon/360+n,M=(357.5291+0.98560028*(Js-2451545))%360,Cc=1.9148*Math.sin(M*r)+0.02*Math.sin(2*M*r)+0.0003*Math.sin(3*M*r),L=(M+102.9372+Cc+180)%360,Jt=Js+0.0053*Math.sin(M*r)-0.0069*Math.sin(2*L*r),d=Math.asin(Math.sin(L*r)*Math.sin(23.44*r)),w=Math.acos((Math.sin(-0.833*r)-Math.sin(lat*r)*Math.sin(d))/(Math.cos(lat*r)*Math.cos(d)))/r,t=j=>new Date((j-2440587.5)*864e5);return[t(Jt-w/360),t(Jt+w/360),t(Jt)]}
function moonAge(d){const syn=29.530588853;return(((d-Date.UTC(2000,0,6,18,14))/864e5)%syn+syn)%syn}
function moonName(a){return a<1.85?'New Moon 🌑':a<5.54?'Waxing Crescent 🌒':a<9.23?'First Quarter 🌓':a<12.92?'Waxing Gibbous 🌔':a<16.61?'Full Moon 🌕':a<20.3?'Waning Gibbous 🌖':a<23.99?'Last Quarter 🌗':a<27.68?'Waning Crescent 🌘':'New Moon 🌑'}
function sun(){const now=new Date(),[a,b,noon]=sunTimes(new Date(new Date().setHours(12,0,0,0)),P.lat,P.lon),m=6e4;C.sunrise=a;C.sunset=b;
$('sun').innerHTML='<table><tr><td>Sunrise</td><td class=big>'+f(a)+'</td></tr><tr><td>Sunset</td><td class=big>'+f(b)+'</td></tr><tr><td>Shooting hours</td><td><b>'+f(new Date(a-20*m))+' – '+f(new Date(+b+20*m))+'</b></td></tr></table>';
const age=moonAge(now);C.moon=moonName(age);const illum=Math.round((1-Math.cos(2*Math.PI*age/29.530588853))/2*100);
const tr=new Date(+noon+age/29.530588853*24.84*36e5),wins=[];
for(const k of[-1,0,1]){const t=new Date(+tr+k*24.84*36e5);wins.push(['Major',t]);wins.push(['Major',new Date(+t+12.42*36e5)]);wins.push(['Minor',new Date(+t-6.21*36e5)]);wins.push(['Minor',new Date(+t+6.21*36e5)])}
const today=wins.filter(w=>w[1].toDateString()===now.toDateString()).sort((x,y)=>x[1]-y[1]);C.inWindow=today.some(w=>Math.abs(w[1]-now)<(w[0]==='Major'?36e5:18e5));
$('moon').innerHTML='<table><tr><td>Moon</td><td><b>'+C.moon+'</b> '+illum+'%</td></tr>'+today.map(w=>'<tr><td>'+w[0]+' window</td><td>'+f(new Date(+w[1]-(w[0]==='Major'?36e5:18e5)))+' – '+f(new Date(+w[1]+(w[0]==='Major'?36e5:18e5)))+'</td></tr>').join('')+'</table>'}
async function usgs(site,par){const j=await(await fetch('https://waterservices.usgs.gov/nwis/iv/?format=json&period=P2D&sites='+site+'&parameterCd='+par)).json();const v=j.value.timeSeries[0].values[0].value.filter(x=>+x.value>-9000);return v}
async function river(){let h='<table>';
try{const v=await usgs('05386400','00065'),last=v[v.length-1],old=v.find(x=>new Date(x.dateTime)>Date.now()-864e5)||v[0],d=(+last.value)-(+old.value);C.stage=+last.value;C.trend=d;C.trendTxt=d>0.15?'Rising':d<-0.15?'Falling':'Stable';
h+='<tr><td>Brownsville, MN (Pool 8, USGS)</td><td><b>'+last.value+' ft</b><br><span class=s>24h: '+(d>=0?'+':'')+d.toFixed(2)+' ft · '+C.trendTxt+'</span></td></tr>'}catch(e){h+='<tr><td>Brownsville stage</td><td>unavailable</td></tr>'}
try{const v=await usgs('05389500','00060'),last=v[v.length-1];C.flow=+last.value;h+='<tr><td>Flow at McGregor, IA (USGS)</td><td><b>'+(+last.value).toLocaleString()+' cfs</b></td></tr>'}catch(e){}
try{const s=(await(await fetch('https://api.water.noaa.gov/nwps/v1/gauges/GENW3')).json()).status.observed;h+='<tr><td>Below L&amp;D 8, Genoa (NOAA)</td><td><b>'+s.primary+' ft</b> elev · '+s.secondary+' kcfs<br><span class=s>'+s.floodCategory.replace(/_/g,' ')+'</span></td></tr>'}catch(e){}
$('river').innerHTML=h+'</table><div class=s>No nearby Mississippi gauge reports water temperature. Links: <a href="https://waterdata.usgs.gov/monitoring-location/05386400/">USGS Brownsville</a> · <a href="https://water.noaa.gov/gauges/GENW3">NOAA Genoa</a> · <a href="https://water.noaa.gov/gauges/LACW3">NOAA La Crosse</a></div>';advise()}
async function wx(){try{const u='https://api.open-meteo.com/v1/forecast?latitude='+P.lat+'&longitude='+P.lon+'&current=temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,surface_pressure&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation_probability,surface_pressure&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=5&past_days=1';
const j=await(await fetch(u)).json(),c=j.current,now=Date.now();const hi=j.hourly.time.findIndex(t=>new Date(t)>now)-1;const p3=j.hourly.surface_pressure[hi-3];
Object.assign(C,{air:c.temperature_2m,wind:c.wind_speed_10m,windDir:dir(c.wind_direction_10m),gust:c.wind_gusts_10m,cloud:c.cloud_cover,pres:c.surface_pressure*0.02953,presTrend:c.surface_pressure-p3});
const pt=C.presTrend>1?'Rising':C.presTrend<-1?'Falling':'Steady';C.presTxt=pt;
let h='<div class=big>'+Math.round(c.temperature_2m)+'°F <span class=s>feels '+Math.round(c.apparent_temperature)+'°</span></div><div><b>Wind '+C.windDir+' '+Math.round(C.wind)+' mph</b>, gusts '+Math.round(C.gust)+'</div><div>Pressure '+C.pres.toFixed(2)+' inHg, <b>'+pt+'</b> (3h) · Clouds '+c.cloud_cover+'%</div><table>';
for(let i=hi+1;i<hi+9&&i<j.hourly.time.length;i++){h+='<tr><td>'+new Date(j.hourly.time[i]).toLocaleTimeString([],{hour:'numeric'})+'</td><td>'+Math.round(j.hourly.temperature_2m[i])+'° · '+dir(j.hourly.wind_direction_10m[i])+' '+Math.round(j.hourly.wind_speed_10m[i])+' · '+j.hourly.precipitation_probability[i]+'%</td></tr>'}
h+='</table><table>';j.daily.time.slice(1).forEach((d,i0)=>{const i=i0+1;h+='<tr><td>'+new Date(d+'T12:00').toLocaleDateString([],{weekday:'short'})+'</td><td>'+Math.round(j.daily.temperature_2m_min[i])+'–'+Math.round(j.daily.temperature_2m_max[i])+'° · '+dir(j.daily.wind_direction_10m_dominant[i])+' to '+Math.round(j.daily.wind_speed_10m_max[i])+' · '+j.daily.precipitation_probability_max[i]+'%</td></tr>'});
$('wx').innerHTML=h+'</table>'}catch(e){$('wx').textContent='Weather unavailable (no signal?)'}advise()}
function advise(){let s=50,why=[],where,how;const mo=new Date().getMonth()+1,wt=+localStorage.wiWT||null;
if(wt){C.wt=wt;if(mo>=9&&wt>=45&&wt<=60){s+=15;why.push('Water '+wt+'°F: prime fall feeding range')}else if(wt<40){s-=5;why.push('Cold water '+wt+'°F: slow fish, fish slow')}else why.push('Water '+wt+'°F')}
if(C.trendTxt){if(C.trendTxt==='Stable'){s+=10;why.push('River stable')}else if(C.trendTxt==='Falling'){s+=5;why.push('River falling slowly')}else{s-=10;why.push('River rising')}}
if(C.wind!=null){if(C.wind>=5&&C.wind<=15){s+=10;why.push('Good walleye chop ('+Math.round(C.wind)+' mph '+C.windDir+')')}else if(C.wind>20){s-=15;why.push('Strong wind: safety first')}else if(C.wind<5){s-=5;why.push('Calm, so fish low light')}}
if(C.presTxt==='Falling'){s+=10;why.push('Pressure falling (pre-front)')}else if(C.presTxt==='Rising'&&C.presTrend>2){s-=10;why.push('Pressure rising fast (post-front)')}
const now=new Date(),low=C.sunrise&&(Math.abs(now-C.sunrise)<5400e3||Math.abs(now-C.sunset)<5400e3);if(low){s+=10;why.push('Low-light period now')}else if(C.cloud>70){s+=5;why.push('Overcast')}
if(C.inWindow){s+=5;why.push('Inside a solunar window')}
s=Math.max(0,Math.min(100,s));
if(C.trendTxt==='Rising'){where='Backwater/slough mouths, behind islands and wing-dam tips with slack water, close to the bank.';how='Heavier jig (3/8–1/2 oz) with a minnow or bright plastic, worked slowly in the slack edges.'}
else if(mo>=10||mo<=3){where='Tailwater below Lock &amp; Dam 8 (Genoa). Stay out of posted restricted zones. Also deeper wing dams.';how='Vertical jig 3/8–1/2 oz with a minnow or plastic, staying just off the bottom. Slow down as the water cools. Three-way rig in heavy current.'}
else{where='Wing dams. Fish the upstream face and tips, plus rock and current breaks.';how='Jig and minnow/plastic or crawler on a three-way rig. Troll crankbaits along the wing dams in summer.'}
const cl=s>=70?'good':s>=45?'ok':'bad';C.score=s;
$('adv').innerHTML='<div class="score '+cl+'">'+s+'/100</div><div><b>Where:</b> '+where+'</div><div><b>How:</b> '+how+'</div><ul class=s>'+why.map(w=>'<li>'+w+'</li>').join('')+'</ul><label class=s>My water temp today °F: <input id=wt type=number value="'+(wt||'')+'" style="width:110px"></label><div class=s>Heuristics only, not a guarantee.</div>';
$('wt').onchange=e=>{localStorage.wiWT=e.target.value;localStorage.wiWTd=new Date().toDateString();advise()}}
if(localStorage.wiWTd!==new Date().toDateString())localStorage.removeItem('wiWT');
// LOG
const LK='wiLog';const getLog=()=>JSON.parse(localStorage[LK]||'[]'),setLog=l=>localStorage[LK]=JSON.stringify(l);
$('lDate').valueAsDate=new Date();
$('lSave').onclick=()=>{const l=getLog();l.push({id:Date.now(),date:$('lDate').value,spot:$('lSpot').value,fish:+$('lFish').value||0,big:$('lBig').value,bait:$('lBait').value,notes:$('lNotes').value,cond:{air:C.air,wind:C.wind,windDir:C.windDir,pres:C.pres&&+C.pres.toFixed(2),presTrend:C.presTxt,stage:C.stage,river:C.trendTxt,flow:C.flow,moon:C.moon,cloud:C.cloud,waterTemp:+$('lWT').value||C.wt||null,score:C.score}});setLog(l);['lSpot','lBig','lBait','lNotes','lWT'].forEach(i=>$(i).value='');$('lFish').value=0;renderLog();alert('Trip saved')};
function renderLog(){const l=getLog().sort((a,b)=>b.date.localeCompare(a.date));
$('lList').innerHTML=l.length?l.map(t=>'<div class=card style="background:#1b2816"><b>'+t.date+'</b> · '+(t.spot||'')+' · <b>'+t.fish+' walleye</b>'+(t.big?' (big '+t.big+'")':'')+'<div class=s>'+[t.bait,t.cond.windDir&&('wind '+t.cond.windDir+' '+Math.round(t.cond.wind)+' mph'),t.cond.presTrend&&('pressure '+t.cond.presTrend),t.cond.river&&('river '+t.cond.river),t.cond.moon,t.cond.waterTemp&&('water '+t.cond.waterTemp+'°')].filter(Boolean).join(' · ')+'</div>'+(t.notes?'<div class=s>'+t.notes.replace(/</g,'&lt;')+'</div>':'')+'<button onclick="delTrip('+t.id+')" style="background:#553;color:#eee;font-size:15px">Delete</button></div>').join(''):'<div class=s>No trips yet.</div>';
if(!l.length){$('lStats').textContent='No trips yet. After a few trips, this shows which conditions produced fish.';return}
const tot=l.reduce((a,t)=>a+t.fish,0);let h='<div>'+l.length+' trips · <b>'+tot+' walleye</b> · avg '+(tot/l.length).toFixed(1)+'/trip</div><table>';
const grp=(name,fn)=>{const g={};l.forEach(t=>{const k=fn(t);if(k==null||k==='')return;(g[k]=g[k]||[]).push(t.fish)});const rows=Object.entries(g).map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length,v.length]).sort((a,b)=>b[1]-a[1]);if(rows.length)h+='<tr><td colspan=2><b>'+name+'</b></td></tr>'+rows.map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1].toFixed(1)+' fish/trip ('+r[2]+')</td></tr>').join('')};
grp('Spot',t=>t.spot);grp('River',t=>t.cond.river);grp('Pressure',t=>t.cond.presTrend);grp('Wind',t=>t.cond.wind==null?null:t.cond.wind<5?'Calm <5':t.cond.wind<=15?'5–15 mph':'15+ mph');grp('Wind direction',t=>t.cond.windDir);grp('Moon',t=>t.cond.moon);grp('Bait',t=>t.bait);
$('lStats').innerHTML=h+'</table>'}
window.delTrip=id=>{if(confirm('Delete this trip?')){setLog(getLog().filter(t=>t.id!==id));renderLog()}};
$('lExp').onclick=async()=>{const data=JSON.stringify(getLog(),null,1),file=new File([data],'walleye-log-'+new Date().toISOString().slice(0,10)+'.json',{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'Walleye log'});return}catch(e){}}const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;a.click()};
$('lImp').onchange=async e=>{try{const inc=JSON.parse(await e.target.files[0].text()),l=getLog(),ids=new Set(l.map(t=>t.id));inc.forEach(t=>{if(t&&t.id&&!ids.has(t.id))l.push(t)});setLog(l);renderLog();alert('Imported')}catch(err){alert('Could not read that file')}};
// MAP
let map;const RAMPS=[[43.5383995,-91.276789,'Millstone Landing (IA)'],[43.4926842,-91.2485265,'New Albin Landing (IA)'],[43.4636212,-91.2233661],[43.4609728,-91.2252139],[43.4551287,-91.2238129],[43.5195029,-91.222548],[43.5515553,-91.2346949],[43.4177864,-91.1980302],[43.3909107,-91.1815235],[43.3670657,-91.2085855],[43.4742345,-91.2949722],[43.3490189,-91.1027336],[43.3480573,-91.2083674]];
function initMap(){if(map){setTimeout(()=>map.invalidateSize(),100);return}map=L.map('map').setView([HOME.lat,HOME.lon],12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map);
L.marker([HOME.lat,HOME.lon]).addTo(map).bindPopup('<b>Stevens Rd, Victory WI</b>');
RAMPS.forEach(r=>L.circleMarker([r[0],r[1]],{radius:9,color:'#f0a83a',fillOpacity:.8}).addTo(map).bindPopup('<b>'+(r[2]||'Boat ramp (unnamed in OSM)')+'</b><br>Mapped, not verified<br><a href="https://maps.apple.com/?daddr='+r[0]+','+r[1]+'">Directions</a>'));
navigator.geolocation&&navigator.geolocation.watchPosition(p=>{if(!map._me)map._me=L.circleMarker([0,0],{radius:7,color:'#4af'}).addTo(map);map._me.setLatLng([p.coords.latitude,p.coords.longitude])},()=>{})}
function run(){sun();wx();river()}
$('gps').onclick=e=>{e.preventDefault();navigator.geolocation.getCurrentPosition(p=>{P={lat:p.coords.latitude,lon:p.coords.longitude};$('loc').firstChild.textContent='Your GPS ('+P.lat.toFixed(3)+', '+P.lon.toFixed(3)+') · ';sun();wx()},()=>alert('Location not allowed'))};
$('home').onclick=e=>{e.preventDefault();P=HOME;$('loc').firstChild.textContent='Victory, WI (Stevens Rd) · ';sun();wx()};
