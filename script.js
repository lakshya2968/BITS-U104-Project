const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const CAMPUS_CENTER = [15.39155, 73.87845];

/*
  BITS Goa campus model.
  The landmark layout follows the published BITS Goa campus maps and recent
  BITS Goa walking information. Coordinates are still a student-project
  approximation; the routing network is intentionally explicit so paths can
  be corrected easily if a student provides a verified campus path map.
*/
const LOCATIONS = {
  "Main Gate": {lat:15.38895,lon:73.87595,type:"gate"},
  "Reception": {lat:15.38935,lon:73.87675,type:"service"},
  "Visitor's Guest House": {lat:15.38905,lon:73.87910,type:"guest"},
  "Central Lawns": {lat:15.39065,lon:73.87835,type:"open"},
  "Main Building / B-Dome": {lat:15.39205,lon:73.87825,type:"academic"},
  "Library Complex": {lat:15.39175,lon:73.87910,type:"academic"},
  "Computer Center": {lat:15.39205,lon:73.87900,type:"academic"},
  "Lecture Theatres 1 & 2": {lat:15.39240,lon:73.87935,type:"academic"},
  "Lecture Theatres 3 & 4": {lat:15.39295,lon:73.87735,type:"academic"},
  "Auditorium": {lat:15.39225,lon:73.87990,type:"academic"},
  "The Dome": {lat:15.39185,lon:73.87885,type:"academic"},
  "The Plaza": {lat:15.39135,lon:73.87895,type:"common"},
  "Workshop": {lat:15.39335,lon:73.87655,type:"academic"},
  "Student Activity Centre": {lat:15.39005,lon:73.87935,type:"student"},
  "Medical Centre": {lat:15.38975,lon:73.88005,type:"service"},
  "Shopping Complex": {lat:15.38955,lon:73.87945,type:"service"},
  "A-Mess": {lat:15.38995,lon:73.87720,type:"mess"},
  "C-Mess": {lat:15.38935,lon:73.88075,type:"mess"},
  "D-Mess": {lat:15.39555,lon:73.88315,type:"mess"},
  "Playground / Football Field": {lat:15.38985,lon:73.87535,type:"open"},

  // Boys / girls student housing clusters from current BITS Goa listings.
  "AH-1 Hostel": {lat:15.39020,lon:73.87675,type:"hostel"},
  "AH-2 Hostel": {lat:15.38975,lon:73.87655,type:"hostel"},
  "AH-3 Hostel": {lat:15.38925,lon:73.87635,type:"hostel"},
  "AH-4 Hostel": {lat:15.38885,lon:73.87645,type:"hostel"},
  "AH-5 Hostel": {lat:15.38855,lon:73.87690,type:"hostel"},
  "AH-6 Hostel": {lat:15.38835,lon:73.87745,type:"hostel"},
  "AH-7 Hostel": {lat:15.39035,lon:73.87735,type:"hostel"},
  "AH-8 Hostel": {lat:15.39010,lon:73.87765,type:"hostel"},
  "AH-9 Hostel": {lat:15.38985,lon:73.87795,type:"hostel"},

  "CH-1 Hostel": {lat:15.39015,lon:73.88075,type:"hostel"},
  "CH-2 Hostel": {lat:15.38985,lon:73.88105,type:"hostel"},
  "CH-3 Hostel": {lat:15.38950,lon:73.88135,type:"hostel"},
  "CH-4 Hostel": {lat:15.38910,lon:73.88145,type:"hostel"},
  "CH-5 Hostel": {lat:15.38880,lon:73.88125,type:"hostel"},
  "CH-6 Hostel": {lat:15.38865,lon:73.88085,type:"hostel"},
  "CH-7 Hostel": {lat:15.38890,lon:73.88035,type:"hostel"},

  "DH-1 Hostel": {lat:15.39465,lon:73.88230,type:"dhostel"},
  "DH-2 Hostel": {lat:15.39495,lon:73.88265,type:"dhostel"},
  "DH-3 Hostel": {lat:15.39525,lon:73.88300,type:"dhostel"},
  "DH-4 Hostel": {lat:15.39555,lon:73.88335,type:"dhostel"},
  "DH-5 Hostel": {lat:15.39585,lon:73.88355,type:"dhostel"},
  "DH-6 Hostel": {lat:15.39610,lon:73.88325,type:"dhostel"}
};

// Campus circulation nodes. These are kept separate from buildings so routes
// do not cut diagonally through buildings/lawns.
const PATH_NODES = {
  gate: ["Main Gate","Reception"],
  south: ["Reception","Central Lawns","Visitor's Guest House","Shopping Complex"],
  academic: ["Central Lawns","The Plaza","The Dome","Main Building / B-Dome","Library Complex","Computer Center","Lecture Theatres 1 & 2","Auditorium","Lecture Theatres 3 & 4","Workshop"],
  east: ["The Plaza","Student Activity Centre","Shopping Complex","Medical Centre","C-Mess","CH-1 Hostel","CH-2 Hostel","CH-3 Hostel","CH-4 Hostel","CH-5 Hostel","CH-6 Hostel","CH-7 Hostel"],
  west: ["Reception","Playground / Football Field","A-Mess","AH-1 Hostel","AH-2 Hostel","AH-3 Hostel","AH-4 Hostel","AH-5 Hostel","AH-6 Hostel","AH-7 Hostel","AH-8 Hostel","AH-9 Hostel"],
  d: ["Auditorium","D-Spine South","D-Spine Mid","D-Spine North","DH-1 Hostel","DH-2 Hostel","DH-3 Hostel","DH-4 Hostel","DH-5 Hostel","DH-6 Hostel","D-Mess"]
};

const ROUTE_NODES = {
  "D-Spine South": {lat:15.39225,lon:73.88025,type:"spine"},
  "D-Spine Mid": {lat:15.39310,lon:73.88115,type:"spine"},
  "D-Spine North": {lat:15.39415,lon:73.88205,type:"spine"}
};
Object.assign(LOCATIONS, ROUTE_NODES);

// Verified/documented covered-path concepts used by this project:
// 1) C-hostels -> Main Building/B-Dome covered pathway.
// 2) D-hostels -> D-Spine covered pathway.
// The BITS Goa 2026 conference map explicitly describes these two covered
// pathways for rain/humid weather.
const COVERED_EDGES = new Set([
  "CH-1 Hostel|CH-2 Hostel","CH-2 Hostel|CH-3 Hostel","CH-3 Hostel|CH-4 Hostel",
  "CH-4 Hostel|CH-5 Hostel","CH-5 Hostel|CH-6 Hostel","CH-6 Hostel|CH-7 Hostel",
  "CH-7 Hostel|Student Activity Centre","Student Activity Centre|The Plaza",
  "The Plaza|The Dome","The Dome|Main Building / B-Dome",
  "DH-1 Hostel|D-Spine North","DH-2 Hostel|DH-1 Hostel","DH-3 Hostel|DH-2 Hostel",
  "DH-4 Hostel|DH-3 Hostel","DH-5 Hostel|DH-4 Hostel","DH-6 Hostel|DH-5 Hostel",
  "D-Mess|DH-4 Hostel","D-Spine North|D-Spine Mid","D-Spine Mid|D-Spine South",
  "D-Spine South|Auditorium"
]);

// Main open circulation network. Covered edges are also usable in reality;
// the mode changes their weather-exposure cost rather than making them vanish.
const OPEN_EDGES = [
  ["Main Gate","Reception"],["Reception","Central Lawns"],["Central Lawns","The Plaza"],
  ["Central Lawns","Visitor's Guest House"],["Reception","Playground / Football Field"],
  ["Reception","A-Mess"],["A-Mess","AH-1 Hostel"],["AH-1 Hostel","AH-2 Hostel"],["AH-2 Hostel","AH-3 Hostel"],
  ["AH-3 Hostel","AH-4 Hostel"],["AH-4 Hostel","AH-5 Hostel"],["AH-5 Hostel","AH-6 Hostel"],
  ["AH-1 Hostel","AH-7 Hostel"],["AH-7 Hostel","AH-8 Hostel"],["AH-8 Hostel","AH-9 Hostel"],
  ["AH-9 Hostel","The Dome"],["The Plaza","The Dome"],["The Dome","Main Building / B-Dome"],
  ["Main Building / B-Dome","Library Complex"],["Library Complex","Computer Center"],
  ["Computer Center","Lecture Theatres 1 & 2"],["Main Building / B-Dome","Lecture Theatres 3 & 4"],
  ["Lecture Theatres 3 & 4","Workshop"],["Lecture Theatres 1 & 2","Auditorium"],["Auditorium","The Plaza"],
  ["The Plaza","Student Activity Centre"],["Student Activity Centre","Shopping Complex"],
  ["Shopping Complex","Medical Centre"],["Medical Centre","C-Mess"],["C-Mess","CH-1 Hostel"],
  ["CH-1 Hostel","CH-2 Hostel"],["CH-2 Hostel","CH-3 Hostel"],["CH-3 Hostel","CH-4 Hostel"],
  ["CH-4 Hostel","CH-5 Hostel"],["CH-5 Hostel","CH-6 Hostel"],["CH-6 Hostel","CH-7 Hostel"],
  ["Auditorium","D-Spine South"],["D-Spine South","D-Spine Mid"],["D-Spine Mid","D-Spine North"],
  ["D-Spine North","DH-1 Hostel"],["DH-1 Hostel","DH-2 Hostel"],["DH-2 Hostel","DH-3 Hostel"],
  ["DH-3 Hostel","DH-4 Hostel"],["DH-4 Hostel","DH-5 Hostel"],["DH-5 Hostel","DH-6 Hostel"],
  ["DH-4 Hostel","D-Mess"]
];

const SPINE_POINTS = [LOCATIONS["D-Spine South"], LOCATIONS["D-Spine Mid"], LOCATIONS["D-Spine North"]];

const els = Object.fromEntries([
  "start","destination","plan","reset","routeDecision","decisionText","temp","condition","feels","rain","rainProb","humidity","wind","recommendation","straightDistance","walkableDistance","primaryDistance","backupDistance","primaryRisk","backupRisk","checkpoints","avgTemp","maxRain","maxWind","weatherTable","download","weatherIcon","routeReason","primaryMode","backupMode","coveredRisk","openRisk","coverageValue","rainStatus","heatStatus","routeComparison","analysisRows"
].map(id => [id, document.getElementById(id)]));

let map, primaryLayer, backupLayer, checkpointLayer, endpointLayer, networkLayer, straightLayer;
let campusLayer;
let lastAnalysis = null;

function initMap(){
  const mapEl=document.getElementById("map");
  if(!mapEl || typeof L === "undefined"){
    console.error("Leaflet failed to load.");
    document.getElementById("routeDecision").textContent="Map library could not be loaded";
    document.getElementById("decisionText").textContent="Refresh the page or check your internet connection. The app needs Leaflet from unpkg.com.";
    return;
  }
  map=L.map(mapEl,{zoomControl:true}).setView(CAMPUS_CENTER,16.5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}).addTo(map);
  drawCampusNetwork();
  drawLandmarks();
}

function drawLandmarks(){
  const layer=L.layerGroup().addTo(map);
  Object.entries(LOCATIONS).forEach(([name,p])=>{
    const color=p.type==="dhostel"?"#7c3aed":p.type==="hostel"?"#e11d48":p.type==="academic"?"#155eef":p.type==="spine"?"#7c3aed":"#667085";
    L.circleMarker([p.lat,p.lon],{radius:p.type==="spine"?3:4,color,fillColor:"#fff",fillOpacity:.95,weight:2}).bindTooltip(name,{direction:"top",opacity:.95}).addTo(layer);
  });
}

function edgeKey(a,b){ return `${a}|${b}`; }
function edgeIsCovered(a,b){ return COVERED_EDGES.has(edgeKey(a,b)) || COVERED_EDGES.has(edgeKey(b,a)); }

function drawCampusNetwork(){
  networkLayer=L.layerGroup().addTo(map);
  OPEN_EDGES.forEach(([a,b])=>{
    const pa=LOCATIONS[a], pb=LOCATIONS[b];
    if(!pa||!pb)return;
    const covered=edgeIsCovered(a,b);
    L.polyline([[pa.lat,pa.lon],[pb.lat,pb.lon]],{
      color:covered?"#14b8a6":"#94a3b8",weight:covered?6:3,opacity:covered?.72:.38,
      dashArray:covered?"10 7":null
    }).bindTooltip(covered?"Covered path model":"Campus circulation path",{sticky:true}).addTo(networkLayer);
  });
  L.polyline(SPINE_POINTS.map(p=>[p.lat,p.lon]),{color:"#7c3aed",weight:7,opacity:.82,dashArray:"7 7"})
    .bindTooltip("D-Spine · covered D-hostel connection",{sticky:true})
    .bindPopup("<b>D-Spine</b><br>Covered-path corridor considered for D-side journeys.")
    .addTo(networkLayer);
}

function fillSelect(select, includeGate){
  select.innerHTML="";
  Object.keys(LOCATIONS).filter(name=>includeGate||name!=="Main Gate").forEach(name=>{
    const o=document.createElement("option");o.value=name;o.textContent=name;select.appendChild(o);
  });
}
function populate(){fillSelect(els.start,true);fillSelect(els.destination,false);els.start.value="Main Gate";els.destination.value="Library Complex";}

function distanceKm(a,b){
  const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLon=(b.lon-a.lon)*Math.PI/180;
  const lat1=a.lat*Math.PI/180,lat2=b.lat*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function totalDistance(points){return points.slice(1).reduce((s,p,i)=>s+distanceKm(points[i],p),0);}
function straightLineDistance(startName,endName){return distanceKm(LOCATIONS[startName],LOCATIONS[endName]);}
function drawStraightLine(){
  if(!map)return;
  const s=LOCATIONS[els.start.value],d=LOCATIONS[els.destination.value];
  straightLayer=L.polyline([[s.lat,s.lon],[d.lat,d.lon]],{color:"#111827",weight:3,opacity:.8,dashArray:"6 8"}).bindPopup(`<b>Straight-line distance</b><br>${straightLineDistance(els.start.value,els.destination.value).toFixed(2)} km<br><small>Geometric distance only — not a walking path.</small>`).addTo(map);
}

function nearestPointOnPath(target, names){
  return names.map(name=>({name,d:distanceKm(target,LOCATIONS[name])})).sort((a,b)=>a.d-b.d)[0];
}

function buildGraph(mode){
  const adj={};
  Object.keys(LOCATIONS).forEach(n=>adj[n]=[]);
  OPEN_EDGES.forEach(([a,b])=>{
    const covered=edgeIsCovered(a,b);
    let multiplier=1;
    if(mode==="covered") multiplier=covered?.72:1.18;
    else multiplier=covered?1.05:0.90;
    const d=distanceKm(LOCATIONS[a],LOCATIONS[b])*multiplier;
    adj[a].push({to:b,d,covered});adj[b].push({to:a,d,covered});
  });
  return adj;
}

function shortestPath(start,end,mode){
  const adj=buildGraph(mode),dist={},prev={},used=new Set();
  Object.keys(adj).forEach(n=>dist[n]=Infinity);dist[start]=0;
  while(used.size<Object.keys(adj).length){
    let u=null,best=Infinity;
    Object.keys(dist).forEach(n=>{if(!used.has(n)&&dist[n]<best){best=dist[n];u=n;}});
    if(!u||u===end)break;
    used.add(u);
    adj[u].forEach(e=>{const nd=dist[u]+e.d;if(nd<dist[e.to]){dist[e.to]=nd;prev[e.to]=u;}});
  }
  if(!Number.isFinite(dist[end]))return [start,end];
  const path=[];let cur=end;while(cur){path.unshift(cur);if(cur===start)break;cur=prev[cur];}
  return path;
}

function interpolate(a,b,t){return {lat:a.lat+(b.lat-a.lat)*t,lon:a.lon+(b.lon-a.lon)*t};}
function densifyPath(names){
  const out=[];
  for(let i=0;i<names.length-1;i++){
    const a=LOCATIONS[names[i]],b=LOCATIONS[names[i+1]];
    for(let j=0;j<8;j++)out.push(interpolate(a,b,j/8));
  }
  out.push(LOCATIONS[names.at(-1)]);return out;
}
function routeVia(start,end,mode){const nodes=shortestPath(start,end,mode);return {nodes,points:densifyPath(nodes)};}

function weatherText(code){
  const c=Number(code);if(c===0)return"Clear sky";if([1,2,3].includes(c))return"Cloudy / partly cloudy";if([45,48].includes(c))return"Foggy";if([51,53,55,56,57].includes(c))return"Drizzle";if([61,63,65,66,67].includes(c))return"Rain";if([80,81,82].includes(c))return"Rain showers";if([95,96,99].includes(c))return"Thunderstorm";return"Other conditions";
}
function weatherEmoji(code){const c=Number(code);if(c===0)return"☀️";if([1,2,3].includes(c))return"⛅";if([45,48].includes(c))return"🌫️";if([51,53,55,56,57].includes(c))return"🌦️";if([61,63,65,66,67,80,81,82].includes(c))return"🌧️";if([95,96,99].includes(c))return"⛈️";return"🌤️";}
function closestHourIndex(times,current){if(!times?.length||!current)return 0;const target=new Date(current).getTime();let best=0,diff=Infinity;times.forEach((t,i)=>{const d=Math.abs(new Date(t).getTime()-target);if(d<diff){diff=d;best=i;}});return best;}

async function fetchWeather(point){
  const params=new URLSearchParams({latitude:point.lat.toFixed(5),longitude:point.lon.toFixed(5),current:"temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m",hourly:"precipitation_probability,precipitation,rain,weather_code",forecast_days:"1",timezone:"auto"});
  const res=await fetch(`${WEATHER_URL}?${params}`);if(!res.ok)throw new Error(`Weather request failed (${res.status})`);const data=await res.json();
  const idx=closestHourIndex(data.hourly?.time,data.current?.time);
  return {lat:point.lat,lon:point.lon,temp:Number(data.current.temperature_2m),feels:Number(data.current.apparent_temperature),humidity:Number(data.current.relative_humidity_2m),rain:Number(data.current.rain??0),precipitation:Number(data.current.precipitation??0),rainProbability:Number(data.hourly?.precipitation_probability?.[idx]??0),wind:Number(data.current.wind_speed_10m),code:Number(data.current.weather_code),condition:weatherText(data.current.weather_code)};
}
function pointRisk(w){let s=0;s+=Math.min(w.rainProbability*.22,22);s+=Math.min(w.rain*10,30);if(w.code>=61&&w.code<=82)s+=22;if(w.code>=95)s+=45;if(w.temp>=32)s+=Math.min((w.temp-31)*3,15);if(w.temp>=36)s+=8;if(w.wind>=30)s+=8;return Math.min(100,Math.round(s));}
function routeRisk(weather,mode){const base=weather.reduce((s,w)=>s+pointRisk(w),0)/weather.length;const rain=weather.reduce((s,w)=>s+w.rainProbability+w.rain*20,0)/weather.length;const heat=weather.reduce((s,w)=>s+Math.max(0,w.temp-30),0)/weather.length;const storm=weather.filter(w=>w.code>=95).length/weather.length*25;let r=base;if(mode==="open")r+=Math.min(22,rain*.10+heat*1.7+storm);else r-=Math.min(16,rain*.07+heat*.9);return Math.max(0,Math.min(100,Math.round(r)));}

async function analyzeRoute(label,mode){const built=routeVia(els.start.value,els.destination.value,mode);const sampled=built.points.filter((_,i)=>i%8===0||i===built.points.length-1);const weather=await Promise.all(sampled.map(fetchWeather));return{name:label,mode,nodes:built.nodes,points:built.points,weather,distance:totalDistance(built.points),risk:routeRisk(weather,mode)};}
function clearLayers(){if(!map)return;[primaryLayer,backupLayer,checkpointLayer,endpointLayer,straightLayer].forEach(l=>l&&map.removeLayer(l));primaryLayer=backupLayer=checkpointLayer=endpointLayer=straightLayer=null;}
function drawRoute(route,primary){const layer=L.polyline(route.points.map(p=>[p.lat,p.lon]),{color:primary?"#155eef":"#64748b",weight:primary?7:5,opacity:primary?.95:.72,dashArray:primary?null:"11 9"}).addTo(map);const coveredEdges=route.nodes.slice(1).map((n,i)=>edgeIsCovered(route.nodes[i],n)).filter(Boolean).length;layer.bindPopup(`<b>${route.name}</b><br>${route.mode==="covered"?"Sheltered-first campus route":"Open-first campus route"}<br>Covered path sections used: ${coveredEdges}<br>Risk: ${route.risk}/100`);return layer;}
function riskColor(r){return r<30?"#159455":r<60?"#c47f00":"#d64545";}
function drawCheckpoints(routes){if(!map)return;checkpointLayer=L.layerGroup().addTo(map);routes.forEach(route=>route.weather.forEach((w,i)=>{const c=riskColor(pointRisk(w));L.circleMarker([w.lat,w.lon],{radius:7,color:c,fillColor:c,fillOpacity:.9,weight:2}).bindPopup(`<b>${route.name} · checkpoint ${i+1}</b><br>${w.condition}<br>${w.temp.toFixed(1)} °C · ${w.rainProbability}% rain probability<br>Rain: ${w.rain.toFixed(1)} mm · Wind: ${w.wind.toFixed(0)} km/h<br><b>Risk: ${pointRisk(w)}/100</b>`).addTo(checkpointLayer);}));}
function showEndpoints(){if(!map)return;endpointLayer=L.layerGroup().addTo(map);const s=LOCATIONS[els.start.value],d=LOCATIONS[els.destination.value];L.marker([s.lat,s.lon]).bindTooltip(`START · ${els.start.value}`,{permanent:true,direction:"top",offset:[0,-8]}).addTo(endpointLayer);L.marker([d.lat,d.lon]).bindTooltip(`DESTINATION · ${els.destination.value}`,{permanent:true,direction:"top",offset:[0,-8]}).addTo(endpointLayer);}
function fitRoutes(routes){if(!map)return;const all=routes.flatMap(r=>r.points.map(p=>[p.lat,p.lon]));map.fitBounds(L.latLngBounds(all),{padding:[32,32]});}
function choosePrimary(covered,open){if(covered.risk<open.risk)return[covered,open];if(open.risk<covered.risk)return[open,covered];return[covered,open];}
function average(v){return v.reduce((a,b)=>a+b,0)/Math.max(v.length,1);}

function updateSummary(primary,backup,allRoutes){
  const allWeather=allRoutes.flatMap(r=>r.weather),avgTemp=average(allWeather.map(w=>w.temp)),maxRain=Math.max(...allWeather.map(w=>w.rain)),maxWind=Math.max(...allWeather.map(w=>w.wind)),rainProb=Math.round(average(allWeather.map(w=>w.rainProbability)));
  const primaryLabel=primary.mode==="covered"?"Covered / sheltered":"Open / outdoor",backupLabel=backup.mode==="covered"?"Covered / sheltered":"Open / outdoor";
  els.routeDecision.textContent=`${primaryLabel} route recommended`;els.decisionText.textContent=`${primary.name} has the lower weather-risk score (${primary.risk}/100). ${backup.name} remains visible as the backup (${backup.risk}/100).`;
  const direct=straightLineDistance(els.start.value,els.destination.value); const walkable=Math.min(primary.distance,backup.distance); els.straightDistance.textContent=`${direct.toFixed(2)} km`; els.walkableDistance.textContent=`${walkable.toFixed(2)} km`; els.primaryDistance.textContent=`${primary.distance.toFixed(2)} km`;els.backupDistance.textContent=`${backup.distance.toFixed(2)} km`;els.primaryRisk.textContent=`${primary.risk}/100`;els.backupRisk.textContent=`${backup.risk}/100`;els.checkpoints.textContent=allWeather.length;els.avgTemp.textContent=`${avgTemp.toFixed(1)} °C`;els.maxRain.textContent=`${maxRain.toFixed(1)} mm`;els.maxWind.textContent=`${maxWind.toFixed(0)} km/h`;
  const covered=allRoutes.find(r=>r.mode==="covered"),open=allRoutes.find(r=>r.mode==="open");els.coveredRisk.textContent=`${covered.risk}/100`;els.openRisk.textContent=`${open.risk}/100`;els.coverageValue.textContent=primary.mode==="covered"?"Sheltered-first":"Open-first";els.rainStatus.textContent=rainProb>=50?"High":rainProb>=25?"Moderate":"Low";els.heatStatus.textContent=avgTemp>=35?"High":avgTemp>=31?"Moderate":"Low";els.routeComparison.textContent=`${primaryLabel} ${primary.risk}/100 vs ${backupLabel} ${backup.risk}/100`;
  els.recommendation.className=`recommendation ${primary.mode}`;els.recommendation.innerHTML=`<strong>Take the ${primary.mode==="covered"?"covered / sheltered":"open / outdoor"} route.</strong><br>${primary.risk<30?"Weather exposure is relatively low.":primary.risk<60?"Some weather caution is advised.":"Weather exposure is elevated; keep the backup route ready."}`;
  els.routeReason.textContent=primary.mode==="covered"?"The sheltered-path model received the lower weather-risk score. The documented C-hostel and D-hostel covered connections are included where the network supports them.":"The open-path model received the lower weather-risk score under the current weather conditions; the covered network remains available as backup.";
  const campus=allWeather[0];els.temp.textContent=campus.temp.toFixed(1);els.feels.textContent=`${campus.feels.toFixed(1)} °C`;els.rain.textContent=`${campus.rain.toFixed(1)} mm`;els.rainProb.textContent=`${campus.rainProbability}%`;els.humidity.textContent=`${campus.humidity}%`;els.wind.textContent=`${campus.wind.toFixed(0)} km/h`;els.condition.textContent=`${campus.condition} · ${campus.rainProbability}% rain probability`;els.weatherIcon.textContent=weatherEmoji(campus.code);els.primaryMode.textContent=primaryLabel;els.backupMode.textContent=backupLabel;
  els.weatherTable.innerHTML=allRoutes.map(route=>route.weather.map((w,i)=>{const r=pointRisk(w),t=r<30?"Good":r<60?"Caution":"Risk";return`<tr><td>${route.name}</td><td>${i+1}</td><td>${w.temp.toFixed(1)} °C</td><td>${w.rain.toFixed(1)} mm</td><td>${w.rainProbability}%</td><td>${w.wind.toFixed(0)} km/h</td><td>${w.condition}</td><td><span class="risk-chip ${t.toLowerCase()}">${t} · ${r}</span></td></tr>`}).join("")).join("");
  els.analysisRows.textContent=`${allWeather.length} weather checkpoints sampled across the two BITS Goa route networks.`;
}
function buildCsv(){if(!lastAnalysis)return;const rows=[["Start","Destination","Route","Mode","Checkpoint","Latitude","Longitude","Temperature C","Feels Like C","Rain mm","Rain probability %","Humidity %","Wind km/h","Condition","Risk score"]];lastAnalysis.routes.forEach(route=>route.weather.forEach((w,i)=>rows.push([els.start.value,els.destination.value,route.name,route.mode,i+1,w.lat.toFixed(5),w.lon.toFixed(5),w.temp.toFixed(1),w.feels.toFixed(1),w.rain.toFixed(2),w.rainProbability,w.humidity,w.wind.toFixed(1),w.condition,pointRisk(w)])));const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="bits-goa-weather-route-analysis.csv";a.click();URL.revokeObjectURL(url);}

async function planRoute(){
  if(els.start.value===els.destination.value){els.decisionText.textContent="Choose two different BITS Goa locations.";return;}
  els.plan.disabled=true;els.plan.textContent="Analyzing BITS Goa…";els.routeDecision.textContent="Analyzing campus weather…";els.decisionText.textContent="Sampling live weather on the campus path network, including covered pathways and the D-Spine where applicable.";
  try{const [covered,open]=await Promise.all([analyzeRoute("Covered route","covered"),analyzeRoute("Open route","open")]);const [primary,backup]=choosePrimary(covered,open);lastAnalysis={routes:[primary,backup],primary,backup};clearLayers();drawStraightLine();primaryLayer=drawRoute(primary,true);backupLayer=drawRoute(backup,false);drawCheckpoints([primary,backup]);showEndpoints();fitRoutes([primary,backup]);updateSummary(primary,backup,[primary,backup]);}
  catch(err){console.error(err);els.routeDecision.textContent="Weather data could not be loaded";els.decisionText.textContent="Check your internet connection and try again. Weather is supplied by Open-Meteo without an API key.";els.recommendation.className="recommendation warning";els.recommendation.textContent="No route recommendation was generated.";}
  finally{els.plan.disabled=false;els.plan.textContent="Plan route";}
}
function resetApp(){clearLayers();if(map)map.setView(CAMPUS_CENTER,16.5);els.routeDecision.textContent="Choose a BITS Goa route";els.decisionText.textContent="Select a campus start point and destination to compare covered and open route options.";els.recommendation.className="recommendation neutral";els.recommendation.textContent="Plan a route to see the weather-based recommendation.";[els.temp,els.feels,els.rain,els.rainProb,els.humidity,els.wind,els.straightDistance,els.walkableDistance,els.primaryDistance,els.backupDistance,els.primaryRisk,els.backupRisk,els.checkpoints,els.avgTemp,els.maxRain,els.maxWind,els.coveredRisk,els.openRisk].forEach(e=>e.textContent="--");els.condition.textContent="Waiting for route analysis…";els.weatherIcon.textContent="☁️";els.coverageValue.textContent="--";els.rainStatus.textContent="--";els.heatStatus.textContent="--";els.routeComparison.textContent="--";els.routeReason.textContent="--";els.primaryMode.textContent="--";els.backupMode.textContent="--";els.analysisRows.textContent="";els.weatherTable.innerHTML="";lastAnalysis=null;}

populate();initMap();els.plan.addEventListener("click",planRoute);els.reset.addEventListener("click",resetApp);els.download.addEventListener("click",buildCsv);
