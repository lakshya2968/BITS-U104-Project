const CAMPUS={lat:15.3913605,lon:73.879555,zoom:16.8,width:1920,height:1080};
const OSM='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSRM='https://router.project-osrm.org/route/v1/foot';
const WEATHER='https://api.open-meteo.com/v1/forecast';

const map=L.map('map').setView([CAMPUS.lat,CAMPUS.lon],CAMPUS.zoom);
L.tileLayer(OSM,{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
const routeLayer=L.layerGroup().addTo(map);
const locByName=Object.fromEntries(MAP_DATA.locations.map(x=>[x.name,x]));
const startEl=document.getElementById('start'),destEl=document.getElementById('destination');
for(const l of MAP_DATA.locations){for(const el of [startEl,destEl]){const o=document.createElement('option');o.value=l.name;o.textContent=l.name;el.appendChild(o)}}
startEl.value=MAP_DATA.locations[0]?.name||'';destEl.value=MAP_DATA.locations[1]?.name||'';
const ctx={weather:null};

function pixelToLatLng(x,y){const z=CAMPUS.zoom,n=2**z;const cx=(CAMPUS.lon+180)/360*n,cy=(1-Math.asinh(Math.tan(CAMPUS.lat*Math.PI/180))/Math.PI)/2*n;const px=cx+(x-CAMPUS.width/2),py=cy+(y-CAMPUS.height/2);return [Math.atan(Math.sinh(Math.PI*(1-2*py/n)))*180/Math.PI,px/n*360-180]}
function ll(p){return pixelToLatLng(p.x,p.y)}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function cleanPoints(points){const out=[];for(const p of points){if(!out.length||dist(out[out.length-1],p)>0.5)out.push(p)}return out}

// Every manually marked stroke, including D-Spine, belongs to the same covered network.
function allCoveredPaths(){return [...(MAP_DATA.coveredPaths||[]), cleanPoints(MAP_DATA.dSpine||[])] .filter(p=>p.length>1)}

// These are routing-only indoor/covered connections. They are NEVER drawn on the base map.
const CONNECTORS=[
 ['D-SPINE','B-Dome',[[1262.8,501],[1240,500],[1210,495],[1170,490],[1125,487],[1080,486],[1045,485],[1019.2,485]]],
 ['B-Dome','LT 3 & 4',[[1019.2,485],[1018,455],[1018,425],[1023,398],[1028.8,371]]],
 ['B-Dome','C-Wing',[[1019.2,485],[1046.8,507]]],
 ['B-Dome','A-Wing',[[1019.2,485],[995,470],[980,460],[959.8,452]]],
 ['C-Wing','Library',[[1046.8,507],[1030,535],[1006.8,575]]],
 ['C-Wing','LT 1 & 2',[[1046.8,507],[1070,480],[1095,450],[1112.8,425]]],
 ['A-Wing','LT 3 & 4',[[959.8,452],[980,425],[1005,395],[1028.8,371]]],
 ['D-SPINE','DH-4',[[1262.8,501],[1280,510],[1297.8,526.6],[1315.2,502]]],
 ['D-SPINE','DH-1',[[1262.8,501],[1280,490],[1310.2,465]]],
 ['D-SPINE','DH-3',[[1262.8,501],[1300,495],[1363.2,493]]],
 ['DH-3','DH-6',[[1363.2,493],[1383.2,523]]],
 ['C-Wing','CC Lab',[[1046.8,507],[1050.2,563]]],
 ['Library','Food King',[[1006.8,575],[1030.8,614]]],
 ['A-side Hostels','B-Dome',[[868.8,505],[900,490],[950,485],[1019.2,485]]],
 ['C-side Hostels','Library',[[1015.8,639],[1006.8,575]]],
 ['ICE & SPICE','B-Dome',[[912.8,494],[960,485],[1019.2,485]]]
].map(([a,b,pts])=>({a,b,points:pts.map(([x,y])=>({x,y}))}));

function buildCoveredGraph(){
 const paths=allCoveredPaths();
 const nodes=[];const edges=[];const nodeById=new Map();let seq=0;
 const addNode=(p,id)=>{if(nodeById.has(id))return nodeById.get(id);const n={id,x:p.x,y:p.y};nodes.push(n);nodeById.set(id,n);return n};
 const addEdge=(a,b,c)=>{if(!a||!b||a.id===b.id)return;edges.push({a:a.id,b:b.id,c});edges.push({a:b.id,b:a.id,c})};
 const nearest=(p)=>{let best=null,bd=Infinity;for(const n of nodes){const d=dist(p,n);if(d<bd){bd=d;best=n}}return best};

 // 1. Add every marked path as a graph chain.
 paths.forEach((path,pi)=>{for(let i=0;i<path.length;i++)addNode(path[i],`path_${pi}_${i}`);for(let i=1;i<path.length;i++){const a=nodeById.get(`path_${pi}_${i-1}`),b=nodeById.get(`path_${pi}_${i}`);addEdge(a,b,dist(a,b))}});

 // 2. Join close endpoints of separate marked strokes.
 const endpointPairs=[];
 for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++){
   const a=paths[i],b=paths[j];
   for(const [p,q] of [[a[0],b[0]],[a[0],b.at(-1)],[a.at(-1),b[0]],[a.at(-1),b.at(-1)]]){
     if(dist(p,q)<=35)endpointPairs.push([p,q]);
   }
 }
 for(const [p,q] of endpointPairs)addEdge(nearest(p),nearest(q),dist(p,q));

 // 3. Add all indoor connectors. Their endpoints snap to the existing graph.
 const connectorNodeIds=[];
 for(const c of CONNECTORS){let prev=null;for(const p of c.points){let n=nearest(p);if(!n||dist(n,p)>30)n=addNode(p,`conn_${seq++}`);if(prev)addEdge(prev,n,dist(prev,n));prev=n}connectorNodeIds.push(c)}

 // 4. Every named location gets a virtual entrance node and is connected to the
 // nearest covered/indoor network point. This makes the algorithm work for ALL
 // locations instead of only a hard-coded start/end pair.
 const locNode={};
 for(const l of MAP_DATA.locations){
   const entrance=addNode(l,`loc_${l.name}`);
   const n=nearest(l);
   if(n){
     // Locations can be up to 180 px from a covered entrance because a building
     // marker represents the building, not its doorway.
     const d=dist(l,n);
     if(d<=180)addEdge(entrance,n,d);
   }
   locNode[l.name]=entrance.id;
 }

 // 5. Explicit D-Spine entrances guarantee that D-Spine is never treated as an
 // isolated stroke. These are also routing-only and invisible on the map.
 const dspinePoint={x:1262.8,y:501};
 const dnode=nearest(dspinePoint);
 for(const name of ['DH-1','DH-3','DH-4']){const l=locByName[name];if(l){const n=nodeById.get(locNode[name]);if(n&&dnode)addEdge(n,dnode,dist(l,dspinePoint));}}

 return {nodes,edges,locNode};
}
const graph=buildCoveredGraph();

function dijkstra(startId,endId){
 const adj=new Map(graph.nodes.map(n=>[n.id,[]]));
 for(const e of graph.edges)adj.get(e.a).push(e);
 const d=new Map(graph.nodes.map(n=>[n.id,Infinity])),prev=new Map();d.set(startId,0);
 const q=new Set(graph.nodes.map(n=>n.id));
 while(q.size){let u=null,best=Infinity;for(const id of q){const v=d.get(id);if(v<best){best=v;u=id}}if(!u||u===endId)break;q.delete(u);for(const e of adj.get(u)||[]){const nd=best+e.c;if(nd<d.get(e.b)){d.set(e.b,nd);prev.set(e.b,u)}}}
 if(!isFinite(d.get(endId)))return null;
 const ids=[];let cur=endId;while(cur){ids.push(cur);if(cur===startId)break;cur=prev.get(cur)}if(ids.at(-1)!==startId)return null;ids.reverse();return ids.map(id=>graph.nodes.find(n=>n.id===id));
}
function makeCoveredRoute(startName,endName){
 const sid=graph.locNode[startName],tid=graph.locNode[endName];if(!sid||!tid)return null;
 const p=dijkstra(sid,tid);if(!p)return null;
 return p.map(n=>({x:n.x,y:n.y}));
}

async function normalRoute(startName,endName){const a=ll(locByName[startName]),b=ll(locByName[endName]);const u=`${a[1]},${a[0]}`,v=`${b[1]},${b[0]}`;const r=await fetch(`${OSRM}/${u};${v}?overview=full&geometries=geojson&steps=false`).then(x=>x.json());if(r.code!=='Ok'||!r.routes?.[0])throw Error('Normal route unavailable');return {points:r.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]),meters:r.routes[0].distance}}

async function fetchWeather(){
 const url=`${WEATHER}?latitude=${CAMPUS.lat}&longitude=${CAMPUS.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability,rain&forecast_days=1&timezone=auto`;
 const d=await fetch(url).then(r=>r.json());ctx.weather=d.current||{};const c=ctx.weather;const probs=d.hourly?.precipitation_probability||[];const rainProb=Math.max(...probs.slice(0,3),0);c.rain_probability=rainProb;
 const rainy=c.rain>0.1||rainProb>=40||[51,53,55,61,63,65,80,81,82,95,96,99].includes(c.weather_code);
 document.getElementById('weatherMain').textContent=`${Math.round(c.temperature_2m)}°C`;
 document.getElementById('weatherDetail').textContent=`Feels ${Math.round(c.apparent_temperature)}°C · humidity ${c.relative_humidity_2m}%`;
 document.getElementById('weatherGrid').innerHTML=`<div>Rain: <b>${c.rain} mm</b></div><div>Rain chance: <b>${rainProb}%</b></div><div>Wind: <b>${Math.round(c.wind_speed_10m)} km/h</b></div><div>Precipitation: <b>${c.precipitation} mm</b></div>`;
 document.getElementById('weatherStatus').textContent=rainy?'🌧️ Covered route preferred':'☀️ Normal route preferred';return rainy;
}
function draw(points,opts={}){routeLayer.clearLayers();L.polyline(points,opts).addTo(routeLayer);}

async function plan(){
 routeLayer.clearLayers();const s=startEl.value,t=destEl.value;if(!s||!t||s===t)return;
 const rainy=ctx.weather? (ctx.weather.rain>0.1||ctx.weather.rain_probability>=40||[51,53,55,61,63,65,80,81,82,95,96,99].includes(ctx.weather.weather_code)) : await fetchWeather();
 const covered=makeCoveredRoute(s,t);let normal=null;try{normal=await normalRoute(s,t)}catch(e){}
 if(rainy&&covered){draw(covered.map(ll),{weight:6,opacity:.9});document.getElementById('recommendation').textContent='Covered route selected';document.getElementById('recommendationDetail').textContent=`${s} → covered network → ${t}`;document.getElementById('routeMetrics').innerHTML='<div class="metric"><b>Mode</b><br>Covered</div>';if(normal)L.polyline(normal.points,{weight:4,opacity:.35,dashArray:'8 10'}).addTo(routeLayer)}
 else if(normal){draw(normal.points,{weight:6,opacity:.9});document.getElementById('recommendation').textContent='Normal route selected';document.getElementById('recommendationDetail').textContent=rainy?'Covered route is not connected for this pair; normal route shown.':'Dry-weather route through the mapped road network.';document.getElementById('routeMetrics').innerHTML=`<div class="metric"><b>Mode</b><br>Normal</div><div class="metric"><b>Distance</b><br>${(normal.meters/1000).toFixed(2)} km</div>`;if(covered)L.polyline(covered.map(ll),{weight:4,opacity:.35,dashArray:'8 10'}).addTo(routeLayer)}
 else if(covered){draw(covered.map(ll),{weight:6,opacity:.9});document.getElementById('recommendation').textContent='Covered route selected';document.getElementById('recommendationDetail').textContent=`${s} → covered network → ${t}`;document.getElementById('routeMetrics').innerHTML='<div class="metric"><b>Mode</b><br>Covered</div>'}
 else{document.getElementById('recommendation').textContent='No route found';document.getElementById('recommendationDetail').textContent='Try another pair of campus locations.'}
}

document.getElementById('planBtn').onclick=plan;
document.getElementById('clearBtn').onclick=()=>{routeLayer.clearLayers();document.getElementById('recommendation').textContent='Select locations';document.getElementById('recommendationDetail').textContent='The app will choose the route from current weather.'};
document.getElementById('weatherBtn').onclick=fetchWeather;
fetchWeather();
