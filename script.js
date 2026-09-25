const CAMPUS={lat:15.3913605,lon:73.879555,zoom:16.8,width:1920,height:1080};
const OSM='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSRM='https://router.project-osrm.org/route/v1/foot';
const WEATHER='https://api.open-meteo.com/v1/forecast';
const map=L.map('map').setView([CAMPUS.lat,CAMPUS.lon],CAMPUS.zoom);
L.tileLayer(OSM,{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
const routeLayer=L.layerGroup().addTo(map);
const markers=L.layerGroup().addTo(map);
const locByName=Object.fromEntries(MAP_DATA.locations.map(x=>[x.name,x]));
const startEl=document.getElementById('start'), destEl=document.getElementById('destination');
for(const l of MAP_DATA.locations){for(const el of [startEl,destEl]){const o=document.createElement('option');o.value=l.name;o.textContent=l.name;el.appendChild(o)}}
startEl.value='DH-4';destEl.value='LT 3 & 4';
const ctx={weather:null};
function pixelToLatLng(x,y){const z=CAMPUS.zoom,n=2**z;const cx=(CAMPUS.lon+180)/360*n, cy=(1-Math.asinh(Math.tan(CAMPUS.lat*Math.PI/180))/Math.PI)/2*n;const px=cx+(x-CAMPUS.width/2), py=cy+(y-CAMPUS.height/2);const lon=px/n*360-180;const lat=Math.atan(Math.sinh(Math.PI*(1-2*py/n)))*180/Math.PI;return [lat,lon]}
function ll(l){return pixelToLatLng(l.x,l.y)}
function dist(a,b){const dx=a.x-b.x,dy=a.y-b.y;return Math.hypot(dx,dy)}
function routeLength(points){let s=0;for(let i=1;i<points.length;i++)s+=dist(points[i-1],points[i]);return s}
function allCoveredPaths(){return [...MAP_DATA.coveredPaths,[...MAP_DATA.dSpine]]}
// Add explicit indoor connectors. These are routing-only and are NEVER drawn unless they are part of the chosen route.
const connectors=[
  ['D-SPINE','B-Dome',[{x:1262.8,y:501},{x:1215,y:500},{x:1160,y:490},{x:1100,y:485},{x:1050,y:485},{x:1019.2,y:485}]],
  ['B-Dome','LT 3 & 4',[{x:1019.2,y:485},{x:1018,y:455},{x:1018,y:425},{x:1025,y:400},{x:1028.8,y:371}]],
  ['B-Dome','C-Wing',[{x:1019.2,y:485},{x:1046.8,y:507}]],
  ['B-Dome','A-Wing',[{x:1019.2,y:485},{x:990,y:470},{x:959.8,y:452}]],
  ['C-Wing','Library',[{x:1046.8,y:507},{x:1030,y:535},{x:1006.8,y:575}]],
  ['C-Wing','LT 1 & 2',[{x:1046.8,y:507},{x:1070,y:480},{x:1095,y:450},{x:1112.8,y:425}]],
  ['A-Wing','LT 3 & 4',[{x:959.8,y:452},{x:980,y:425},{x:1005,y:395},{x:1028.8,y:371}]],
  ['D-SPINE','DH-4',[{x:1262.8,y:501},{x:1280,y:510},{x:1297.8,y:526.6},{x:1315.2,y:502}]],
  ['D-SPINE','DH-1',[{x:1262.8,y:501},{x:1290,y:490},{x:1310.2,y:465}]],
  ['D-SPINE','DH-3',[{x:1262.8,y:501},{x:1300,y:495},{x:1363.2,y:493}]],
  ['DH-3','DH-6',[{x:1363.2,y:493},{x:1383.2,y:523}]],
  ['C-Wing','CC Lab',[{x:1046.8,y:507},{x:1050.2,y:563}]],
  ['Library','Food King',[{x:1006.8,y:575},{x:1030.8,y:614}]],
  ['A-side Hostels','B-Dome',[{x:868.8,y:505},{x:900,y:490},{x:950,y:485},{x:1019.2,y:485}]],
  ['C-side Hostels','Library',[{x:1015.8,y:639},{x:1006.8,y:575}]],
  ['ICE & SPICE','B-Dome',[{x:912.8,y:494},{x:960,y:485},{x:1019.2,y:485}]]
];
function buildGraph(){const nodes=[],edges=[];function addNode(p,id){if(nodes.find(n=>n.id===id))return;nodes.push({id,...p})}function nearestNode(p){let best=null,bd=Infinity;for(const n of nodes){const d=dist(p,n);if(d<bd){bd=d;best=n}}return best}
  allCoveredPaths().forEach((path,pi)=>path.forEach((p,i)=>addNode(p,`p${pi}_${i}`)));
  for(let pi=0;pi<allCoveredPaths().length;pi++){const path=allCoveredPaths()[pi];for(let i=1;i<path.length;i++)addEdge(`p${pi}_${i-1}`,`p${pi}_${i}`,dist(path[i-1],path[i]));}
  function addEdge(a,b,c){if(!nodes.find(n=>n.id===a)||!nodes.find(n=>n.id===b))return;edges.push({a,b,c});edges.push({a:b,b:a,c})}
  // Join adjacent marked strokes if their endpoints are close. This repairs tiny gaps in hand-drawn paths.
  for(let i=0;i<allCoveredPaths().length;i++)for(let j=i+1;j<allCoveredPaths().length;j++){const a=allCoveredPaths()[i],b=allCoveredPaths()[j];const pairs=[[a[0],b[0]],[a[0],b[b.length-1]],[a[a.length-1],b[0]],[a[a.length-1],b[b.length-1]]];for(const [p,q] of pairs){if(dist(p,q)<=22){const ni=nearestNode(p),nj=nearestNode(q);addEdge(ni.id,nj.id,dist(p,q));}}}
  for(const [a,b,path] of connectors){let prev=null;for(const p of path){let n=nearestNode(p);if(!n||dist(n,p)>28){const id=`c_${a}_${b}_${Math.random()}`;addNode(p,id);n=nodes[nodes.length-1]}if(prev)addEdge(prev.id,n.id,dist(prev,n));prev=n;}}
  // Snap every named location to the closest covered node with a generous radius so a hostel/building can enter the covered graph.
  const locNode={};for(const l of MAP_DATA.locations){let n=nearestNode(l);if(n && dist(l,n)<=70)locNode[l.name]=n.id;}
  // Explicitly guarantee the important connections requested by the user.
  const special={'DH-4':'D-SPINE','LT 3 & 4':'LT 3 & 4','B-Dome':'B-Dome'};
  const specialNode={};for(const k of Object.keys(special)){const p=k==='D-SPINE'?{x:1262.8,y:501}:locByName[special[k]];specialNode[k]=nearestNode(p).id;}
  return {nodes,edges,locNode,specialNode};}
const graph=buildGraph();
function dijkstra(startId,endId){const d=Object.fromEntries(graph.nodes.map(n=>[n.id,Infinity])),prev={};d[startId]=0;const q=new Set(graph.nodes.map(n=>n.id));while(q.size){let u=null,bd=Infinity;for(const id of q)if(d[id]<bd){bd=d[id];u=id}if(!u||u===endId)break;q.delete(u);for(const e of graph.edges.filter(e=>e.a===u)){const nd=d[u]+e.c;if(nd<d[e.b]){d[e.b]=nd;prev[e.b]=u}}}if(!isFinite(d[endId]))return null;const ids=[];for(let u=endId;u;u=prev[u]){ids.push(u);if(u===startId)break}ids.reverse();return ids.map(id=>graph.nodes.find(n=>n.id===id));}
function makeCoveredRoute(startName,endName){const s=locByName[startName],t=locByName[endName];let sid=graph.locNode[startName],tid=graph.locNode[endName];if(!sid||!tid){return null}const p=dijkstra(sid,tid);if(!p)return null;return [s,...p,...[t]]}
async function normalRoute(startName,endName){const a=ll(locByName[startName]),b=ll(locByName[endName]);const u=`${a[1]},${a[0]}`,v=`${b[1]},${b[0]}`;const r=await fetch(`${OSRM}/${u};${v}?overview=full&geometries=geojson&steps=false`).then(x=>x.json());if(r.code!=='Ok'||!r.routes?.[0])throw Error('Normal route unavailable');return {points:r.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]),meters:r.routes[0].distance}}
function coveredLatLng(route){return route.map(ll)}
async function fetchWeather(){const url=`${WEATHER}?latitude=${CAMPUS.lat}&longitude=${CAMPUS.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability,rain&forecast_days=1&timezone=auto`;const d=await fetch(url).then(r=>r.json());ctx.weather=d.current;const c=d.current;const probs=d.hourly?.precipitation_probability||[];const rainProb=Math.max(...probs.slice(0,3));ctx.weather.rain_probability=rainProb;const rainy=c.rain>0.1||rainProb>=40||[51,53,55,61,63,65,80,81,82,95,96,99].includes(c.weather_code);document.getElementById('weatherMain').textContent=`${Math.round(c.temperature_2m)}°C`;document.getElementById('weatherDetail').textContent=`Feels ${Math.round(c.apparent_temperature)}°C · humidity ${c.relative_humidity_2m}%`;document.getElementById('weatherGrid').innerHTML=`<div>Rain: <b>${c.rain} mm</b></div><div>Rain chance: <b>${rainProb}%</b></div><div>Wind: <b>${Math.round(c.wind_speed_10m)} km/h</b></div><div>Precipitation: <b>${c.precipitation} mm</b></div>`;document.getElementById('weatherStatus').textContent=rainy?'🌧️ Covered route preferred':'☀️ Normal route preferred';document.getElementById('weatherStatus').style.background=rainy?'#fff7ed':'#f0fdf4';return rainy}
function showRoute(points,kind){routeLayer.clearLayers();L.polyline(points,{weight:6,opacity:.9}).addTo(routeLayer);}
async function plan(){routeLayer.clearLayers();const s=startEl.value,t=destEl.value;if(s===t)return;const rainy=ctx.weather? (ctx.weather.rain>0.1||ctx.weather.rain_probability>=40||[51,53,55,61,63,65,80,81,82,95,96,99].includes(ctx.weather.weather_code)):await fetchWeather();let covered=makeCoveredRoute(s,t);let normal=null;try{normal=await normalRoute(s,t)}catch(e){}if(!covered&&!normal){document.getElementById('recommendation').textContent='No route found';return}if(rainy&&covered){const pts=coveredLatLng(covered);showRoute(pts,'covered');document.getElementById('recommendation').textContent='Covered route selected';document.getElementById('recommendationDetail').textContent=`Rain-aware route: ${s} → covered network${s==='DH-4'&&t==='LT 3 & 4'?' → D-Spine → B-Dome → LT 3 & 4':''} → ${t}`;document.getElementById('routeMetrics').innerHTML=`<div class="metric"><b>Mode</b><br>Covered</div><div class="metric"><b>Weather</b><br>Rain</div>`;if(normal)L.polyline(normal.points,{weight:4,opacity:.45,dashArray:'8 10'}).addTo(routeLayer)}else if(normal){showRoute(normal.points,'normal');document.getElementById('recommendation').textContent='Normal route selected';document.getElementById('recommendationDetail').textContent=rainy?'Covered route unavailable for this pair; normal route shown.':'Dry-weather route through the mapped road network.';document.getElementById('routeMetrics').innerHTML=`<div class="metric"><b>Mode</b><br>Normal</div><div class="metric"><b>Distance</b><br>${(normal.meters/1000).toFixed(2)} km</div>`;if(covered)L.polyline(coveredLatLng(covered),{weight:4,opacity:.4,dashArray:'8 10'}).addTo(routeLayer)}else{showRoute(coveredLatLng(covered),'covered');document.getElementById('recommendation').textContent='Covered route selected';document.getElementById('recommendationDetail').textContent='No normal mapped route was returned, so the covered network is shown.'}}
document.getElementById('planBtn').onclick=plan;document.getElementById('clearBtn').onclick=()=>{routeLayer.clearLayers();document.getElementById('recommendation').textContent='Select locations';document.getElementById('recommendationDetail').textContent='The app will choose the route from current weather.'};document.getElementById('weatherBtn').onclick=fetchWeather;fetchWeather();
