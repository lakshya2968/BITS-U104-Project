const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const CAMPUS_CENTER = [15.39110, 73.87820];

/*
  BITS Goa Weather-Aware Route Planner v9
  --------------------------------------
  Reference hierarchy:
  1) User-supplied BITS Goa map screenshots: yellow = covered paths, red = D-Spine.
  2) BITS Goa campus/admin maps and published campus information for landmark naming/layout.

  Important model rule:
  - Straight line is ONLY a geometric comparison.
  - Walking routes use the explicit campus network below.
  - D-Spine is INCLUDED in the covered network.
  - Covered paths are not treated as decoration; they participate in route selection.
*/

const LOCATIONS = {
  // Academic / central campus
  // Coordinates below marked "calibrated" were re-derived from the user's Google Maps
  // screenshot annotations using two real GPS anchor points (Main Gate area / DH-6 and
  // SAC), a similarity (scale+rotation) fit, and are more trustworthy than the original
  // placeholder estimates. Nodes not present in that screenshot were left untouched.
  "A-Wing": {lat:15.39291,lon:73.87978,type:"academic",group:"Academic"}, // calibrated
  "B-Dome": {lat:15.39261,lon:73.88035,type:"academic",group:"Academic"}, // calibrated
  "C-Wing": {lat:15.39241,lon:73.88061,type:"academic",group:"Academic"}, // calibrated
  "LT-1": {lat:15.39297,lon:73.88117,type:"academic",group:"Academic"}, // calibrated
  "LT-2": {lat:15.39337,lon:73.88130,type:"academic",group:"Academic"}, // calibrated
  "LT-3": {lat:15.39356,lon:73.88063,type:"academic",group:"Academic"}, // calibrated
  "LT-4": {lat:15.39376,lon:73.88023,type:"academic",group:"Academic"}, // calibrated
  "Auditorium": {lat:15.39210,lon:73.87805,type:"academic",group:"Academic"},
  "Library": {lat:15.39178,lon:73.88023,type:"academic",group:"Academic"}, // calibrated
  "Computer Centre": {lat:15.39120,lon:73.87975,type:"academic",group:"Academic"},
  "CC-Lab": {lat:15.39189,lon:73.88065,type:"academic",group:"Academic"}, // new · calibrated
  "Workshop": {lat:15.39270,lon:73.87645,type:"academic",group:"Academic"},
  "The Plaza": {lat:15.39095,lon:73.87800,type:"common",group:"Campus Facilities"},
  "SAC": {lat:15.39218,lon:73.87548,type:"student",group:"Campus Facilities"}, // calibrated
  "Medical Centre": {lat:15.38995,lon:73.87990,type:"service",group:"Campus Facilities"},
  "Shopping Complex": {lat:15.38955,lon:73.87905,type:"service",group:"Campus Facilities"},
  "Sub Spot": {lat:15.39187,lon:73.88073,type:"food",group:"Campus Facilities"}, // new · calibrated
  "ICE & SPICE": {lat:15.39252,lon:73.87933,type:"food",group:"Campus Facilities"}, // new · calibrated
  "Food King": {lat:15.39142,lon:73.88046,type:"food",group:"Campus Facilities"}, // new · calibrated
  "C-Mess": {lat:15.39077,lon:73.87910,type:"mess",group:"Mess"}, // calibrated
  "D-Mess": {lat:15.39380,lon:73.88305,type:"mess",group:"Mess"},
  "A-Mess": {lat:15.39072,lon:73.87769,type:"mess",group:"Mess"}, // new · calibrated
  "Football Field": {lat:15.39065,lon:73.87520,type:"open",group:"Sports"},
  "Main Gate": {lat:15.38855,lon:73.87495,type:"gate",group:"Campus Facilities"},
  "Visitor Guest House": {lat:15.38910,lon:73.87710,type:"guest",group:"Campus Facilities"},

  // A-side hostels
  "AH-1": {lat:15.38895,lon:73.87610,type:"hostel",group:"A-side hostels"},
  "AH-2": {lat:15.38865,lon:73.87645,type:"hostel",group:"A-side hostels"},
  "AH-3": {lat:15.38845,lon:73.87690,type:"hostel",group:"A-side hostels"},
  "AH-4": {lat:15.38835,lon:73.87745,type:"hostel",group:"A-side hostels"},
  "AH-5": {lat:15.38855,lon:73.87790,type:"hostel",group:"A-side hostels"},
  "AH-6": {lat:15.38885,lon:73.87815,type:"hostel",group:"A-side hostels"},
  "AH-7": {lat:15.38925,lon:73.87765,type:"hostel",group:"A-side hostels"},
  "AH-8": {lat:15.38945,lon:73.87790,type:"hostel",group:"A-side hostels"},
  "AH-9": {lat:15.38965,lon:73.87815,type:"hostel",group:"A-side hostels"},

  // C-side hostels visible/confirmed in the campus references
  "CH-1": {lat:15.38925,lon:73.88055,type:"hostel",group:"C-side hostels"},
  "CH-2": {lat:15.38895,lon:73.88090,type:"hostel",group:"C-side hostels"},
  "CH-3": {lat:15.38865,lon:73.88115,type:"hostel",group:"C-side hostels"},
  "CH-4": {lat:15.38835,lon:73.88120,type:"hostel",group:"C-side hostels"},
  "CH-5": {lat:15.38815,lon:73.88090,type:"hostel",group:"C-side hostels"},
  "CH-6": {lat:15.38810,lon:73.88045,type:"hostel",group:"C-side hostels"},
  "CH-7": {lat:15.38835,lon:73.87995,type:"hostel",group:"C-side hostels"},

  // D-side hostels shown in the user's supplied map reference.
  // DH-1/3/4/6 were directly calibrated from the screenshot. DH-2/DH-5 weren't
  // individually marked in that screenshot, so they're nudged by the same average
  // offset as their calibrated neighbors to keep the hostel row visually consistent
  // rather than left stranded ~150-200m away from the rest of the row.
  "DH-1": {lat:15.39281,lon:73.88313,type:"dhostel",group:"D-side hostels"}, // calibrated
  "DH-2": {lat:15.39247,lon:73.88296,type:"dhostel",group:"D-side hostels"}, // interpolated
  "DH-3": {lat:15.39255,lon:73.88364,type:"dhostel",group:"D-side hostels"}, // calibrated
  "DH-4": {lat:15.39247,lon:73.88318,type:"dhostel",group:"D-side hostels"}, // calibrated
  "DH-5": {lat:15.39267,lon:73.88406,type:"dhostel",group:"D-side hostels"}, // interpolated
  "DH-6": {lat:15.39228,lon:73.88383,type:"dhostel",group:"D-side hostels"}, // calibrated

  // Network waypoints. These are deliberately separated from destinations so that
  // the walking graph can follow bends rather than cutting across buildings.
  "J-Gate": {lat:15.38900,lon:73.87590,type:"path"},
  "J-SAC": {lat:15.38955,lon:73.87620,type:"path"},
  "J-AHostel": {lat:15.38935,lon:73.87820,type:"path"},
  "J-A": {lat:15.39135,lon:73.87675,type:"path"},
  "J-A2": {lat:15.39185,lon:73.87660,type:"path"},
  "J-LT": {lat:15.39210,lon:73.87725,type:"path"},
  "J-BDome": {lat:15.39170,lon:73.87810,type:"path"},
  "J-C": {lat:15.39145,lon:73.87865,type:"path"},
  "J-L1": {lat:15.39130,lon:73.87900,type:"path"},
  "J-Lib": {lat:15.39095,lon:73.87900,type:"path"},
  "J-South": {lat:15.39020,lon:73.87820,type:"path"},
  "J-CH": {lat:15.38925,lon:73.87960,type:"path"},
  "J-CH7": {lat:15.38870,lon:73.87955,type:"path"},

  // New covered-path junction nodes traced from the user's Google Maps screenshot
  // (bits-goa-map-data.json / bits-goa-map-data (1).json). Coordinates derived from
  // the same screenshot calibration as the buildings above.
  // D-hostel covered loop (DH-4 <-> DH-6, two parallel walkways):
  "DL-1": {lat:15.39284,lon:73.88282,type:"path"}, "DL-2": {lat:15.39310,lon:73.88381,type:"path"},
  "DL-3": {lat:15.39304,lon:73.88395,type:"path"}, "DL-4": {lat:15.39296,lon:73.88400,type:"path"},
  "DL-5": {lat:15.39292,lon:73.88404,type:"path"}, "DL-6": {lat:15.39281,lon:73.88406,type:"path"},
  "DL-7": {lat:15.39276,lon:73.88409,type:"path"}, "DL-8": {lat:15.39268,lon:73.88409,type:"path"},
  "DL-9": {lat:15.39266,lon:73.88410,type:"path"}, "DL-10": {lat:15.39253,lon:73.88416,type:"path"},
  "DL-11": {lat:15.39247,lon:73.88412,type:"path"},
  "DL2-1": {lat:15.39226,lon:73.88324,type:"path"}, "DL2-2": {lat:15.39228,lon:73.88353,type:"path"},
  "DL2-3": {lat:15.39228,lon:73.88364,type:"path"},
  // Academic-corridor covered path: LT-3/4 -> B-Dome -> C-Wing -> LT-1/2
  "AC1-1": {lat:15.39339,lon:73.88056,type:"path"}, "AC1-2": {lat:15.39331,lon:73.88049,type:"path"},
  "AC1-3": {lat:15.39328,lon:73.88048,type:"path"}, "AC1-4": {lat:15.39322,lon:73.88040,type:"path"},
  "AC1-5": {lat:15.39317,lon:73.88036,type:"path"}, "AC1-6": {lat:15.39314,lon:73.88036,type:"path"},
  "AC1-7": {lat:15.39311,lon:73.88036,type:"path"}, "AC1-8": {lat:15.39302,lon:73.88032,type:"path"},
  "AC4-1": {lat:15.39278,lon:73.88082,type:"path"}, "AC4-2": {lat:15.39279,lon:73.88100,type:"path"},
  // New covered walkway: B-Dome / ICE & SPICE -> A-side hostel area -> A-Mess
  "AWC-1": {lat:15.39270,lon:73.88031,type:"path"}, "AWC-2": {lat:15.39280,lon:73.88022,type:"path"},
  "AWC-3": {lat:15.39292,lon:73.87993,type:"path"}, "AWC-4": {lat:15.39292,lon:73.87964,type:"path"},
  "AWC-5": {lat:15.39240,lon:73.87901,type:"path"}, "AWC-6": {lat:15.39269,lon:73.87880,type:"path"},
  "AWC-7": {lat:15.39249,lon:73.87864,type:"path"}, "AWC-8": {lat:15.39245,lon:73.87856,type:"path"},
  "AWC-9": {lat:15.39225,lon:73.87830,type:"path"}, "AWC-10": {lat:15.39217,lon:73.87826,type:"path"},
  "AWC-11": {lat:15.39191,lon:73.87815,type:"path"}, "AWC-12": {lat:15.39182,lon:73.87818,type:"path"},
  "AWC-13": {lat:15.39179,lon:73.87824,type:"path"}, "AWC-14": {lat:15.39148,lon:73.87854,type:"path"},
  "AWC-15": {lat:15.39198,lon:73.87813,type:"path"}, "AWC-16": {lat:15.39183,lon:73.87787,type:"path"},
  "AWC-17": {lat:15.39147,lon:73.87750,type:"path"}, "AWC-18": {lat:15.39147,lon:73.87763,type:"path"},
  "AWC-19": {lat:15.39138,lon:73.87780,type:"path"},
  // Short D-Spine bridge segment (from the "dspine"-typed path in the screenshot data),
  // connecting the existing D-Spine (near D-5) into the recalibrated DH-4:
  "DSPBR-1": {lat:15.39242,lon:73.88259,type:"path"}, "DSPBR-2": {lat:15.39242,lon:73.88266,type:"path"},

  // D-Spine follows the long west-east corridor visible in the supplied map.
  "D-West": {lat:15.39148,lon:73.87900,type:"path"},
  "D-1": {lat:15.39155,lon:73.87955,type:"path"},
  "D-2": {lat:15.39165,lon:73.88025,type:"path"},
  "D-3": {lat:15.39178,lon:73.88100,type:"path"},
  "D-4": {lat:15.39192,lon:73.88180,type:"path"},
  "D-5": {lat:15.39208,lon:73.88255,type:"path"},
  "D-6": {lat:15.39228,lon:73.88320,type:"path"},
  "D-East": {lat:15.39255,lon:73.88355,type:"path"},
  "D-South": {lat:15.39325,lon:73.88335,type:"path"},
  "D-Dorm": {lat:15.39355,lon:73.88255,type:"path"}
};

// Red line in the supplied screenshot = D-Spine. User explicitly asked that
// it be considered covered, so EVERY edge here is a covered edge.
const D_SPINE = [
  ["D-West","D-1","D-2","D-3","D-4","D-5","D-6","D-East"],
  // Bridge segment traced from the user's screenshot ("dspine"-typed path), linking
  // the existing spine near D-5 directly into the recalibrated DH-4.
  ["D-5","DSPBR-1","DSPBR-2","DH-4"]
];

// Yellow lines in the supplied screenshots = covered/sheltered corridors.
const COVERED_PATHS = [
  // A/B dome / auditorium cluster
  ["A-Wing","J-A","J-A2","J-LT","Auditorium"],
  ["J-A2","LT-3","LT-4","Workshop"],
  ["B-Dome","J-BDome","J-A2"],
  ["B-Dome","J-BDome","J-C"],
  ["J-LT","B-Dome"],

  // C-Wing / LT1 / Library corridor
  ["C-Wing","J-C","J-L1","LT-1"],
  ["J-C","J-Lib","Library"],
  ["LT-1","J-L1","J-Lib"],

  // D-Spine itself is covered and therefore part of this network too.
  ...D_SPINE,

  // D-side covered connections shown in the reference
  ["DH-1","DH-2","DH-3","DH-4","DH-5","DH-6"],
  ["DH-2","D-Dorm","D-East"],
  ["D-Mess","D-East","D-South"],
  ["DH-5","D-South","D-East"],
  ["D-South","D-Dorm"],

  // C-side covered connection into the academic core
  ["CH-7","J-CH7","J-CH","J-C"],
  ["CH-1","J-CH","J-Lib","Library"],

  // --- Traced from the user's Google Maps screenshot annotations ---
  // D-hostel covered loop: two parallel sheltered walkways between DH-4 and DH-6.
  ["DH-4","DL-1","DL-2","DL-3","DL-4","DL-5","DL-6","DL-7","DL-8","DL-9","DL-10","DL-11","DH-6"],
  ["DH-4","DL2-1","DL2-2","DL2-3","DH-6"],
  // Academic corridor refinement: LT-3/4 -> B-Dome -> C-Wing -> LT-1/2
  ["LT-3","AC1-1","AC1-2","AC1-3","AC1-4","AC1-5","AC1-6","AC1-7","AC1-8","B-Dome"],
  ["B-Dome","C-Wing"],
  ["C-Wing","AC4-1","AC4-2","LT-1"],
  // New covered walkway connecting the academic core to A-side hostels and A-Mess
  ["B-Dome","AWC-1","AWC-2","AWC-3","AWC-4","AWC-5","ICE & SPICE","AWC-6","AWC-7","AWC-8","AWC-9","AWC-10","AWC-11","AWC-12","AWC-13","AWC-14","AWC-15","AWC-16","AWC-17","AWC-18","AWC-19","A-Mess"]
];

// Open/outdoor network. It intentionally follows broad campus circulation and
// does not use the geometric straight line as a walking path.
const OPEN_PATHS = [
  ["Main Gate","J-Gate","Visitor Guest House","J-South","The Plaza"],
  ["J-Gate","J-SAC","SAC","Football Field","J-South"],
  ["J-South","J-AHostel","AH-9","AH-8","AH-7"],
  ["AH-7","AH-6","AH-5","AH-4","AH-3","AH-2","AH-1"],
  ["J-AHostel","B-Dome","A-Wing"],
  ["The Plaza","B-Dome","J-C"],
  ["The Plaza","Shopping Complex","Medical Centre","C-Mess","J-CH"],
  ["J-CH","CH-1","CH-2","CH-3","CH-4","CH-5","CH-6","CH-7"],
  ["B-Dome","Library","Computer Centre","LT-2","C-Wing"],
  ["B-Dome","J-LT","LT-3","LT-4","Workshop"],
  ["LT-1","LT-2"],
  ["C-Wing","J-C","D-West"],
  ["D-East","D-Mess"],
  ["D-Dorm","DH-1","DH-2","DH-3","DH-4","DH-5","DH-6"],

  // Open/outdoor alternatives for the new screenshot-derived spots, so an open
  // route stays possible even where a covered walkway also exists.
  ["Computer Centre","CC-Lab","Library"],
  ["Library","Sub Spot"],
  ["J-C","Food King","C-Mess"],
  ["A-Wing","ICE & SPICE","J-AHostel"],
  ["J-AHostel","A-Mess","AH-1"],
  ["A-Mess","SAC"]
];

const els = Object.fromEntries([
  "start","destination","planBtn","resetBtn","routeDecision","decisionText","temp","condition","feels","rain","rainProb","humidity","wind","recommendation","straightDistance","walkableDistance","primaryDistance","backupDistance","primaryRisk","backupRisk","weatherTable","downloadBtn","weatherIcon","routeReason","primaryMode","backupMode","coveredRisk","openRisk","coverageValue","rainStatus","heatStatus","routeComparison","analysisRows","checkpoints","avgTemp","maxRain","maxWind"
].map(id => [id, document.getElementById(id)]));

let map, primaryLayer, backupLayer, checkpointLayer, endpointLayer, networkLayer, straightLayer, coveredLayer, spineLayer;
let lastAnalysis = null;

function initMap(){
  if(!document.getElementById("map") || typeof L === "undefined"){
    els.routeDecision.textContent="Map library could not be loaded";
    els.decisionText.textContent="Refresh the page or check your internet connection.";
    return;
  }
  map=L.map("map",{zoomControl:true}).setView(CAMPUS_CENTER,16.8);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}).addTo(map);
  drawReferenceNetwork();
}

function drawReferenceNetwork(){
  networkLayer=L.layerGroup().addTo(map);
  OPEN_PATHS.forEach(path=>drawPath(path,"#94a3b8",2.5,0.35,null,"Open / campus circulation",networkLayer));

  coveredLayer=L.layerGroup().addTo(map);
  COVERED_PATHS.forEach(path=>drawPath(path,"#f2c500",6,0.92,"8 5","Covered pathway",coveredLayer));

  spineLayer=L.layerGroup().addTo(map);
  D_SPINE.forEach(path=>drawPath(path,"#e11d48",6,0.98,null,"D-Spine · treated as covered",spineLayer));

  const dMid=LOCATIONS["D-4"];
  L.marker([dMid.lat,dMid.lon],{icon:L.divIcon({className:"path-label",html:"D-Spine · covered",iconSize:[118,22],iconAnchor:[59,11]})}).addTo(spineLayer);
  const cMid=LOCATIONS["J-C"];
  L.marker([cMid.lat,cMid.lon],{icon:L.divIcon({className:"path-label covered-label",html:"Covered paths",iconSize:[95,22],iconAnchor:[47,11]})}).addTo(coveredLayer);
  drawLandmarks();
}

function drawPath(path,color,weight,opacity,dashArray,tooltip,layer){
  const coords=path.map(n=>LOCATIONS[n]).filter(Boolean).map(p=>[p.lat,p.lon]);
  if(coords.length<2)return;
  L.polyline(coords,{color,weight,opacity,dashArray,lineCap:"round",lineJoin:"round"}).bindTooltip(tooltip,{sticky:true}).addTo(layer);
}

function drawLandmarks(){
  const layer=L.layerGroup().addTo(map);
  Object.entries(LOCATIONS).forEach(([name,p])=>{
    if(p.type==="path")return;
    let color="#667085";
    if(p.type==="dhostel")color="#7c3aed";
    else if(p.type==="hostel")color="#e11d48";
    else if(p.type==="academic")color="#155eef";
    L.circleMarker([p.lat,p.lon],{radius:5,color,fillColor:"#fff",fillOpacity:.95,weight:2}).bindTooltip(name,{direction:"top",opacity:.95}).addTo(layer);
  });
}

function edgeKey(a,b){return `${a}|${b}`;}
const coveredPairs=new Set();
function addPathEdges(path,isCovered){
  for(let i=0;i<path.length-1;i++){
    const a=path[i],b=path[i+1];
    if(!LOCATIONS[a]||!LOCATIONS[b])continue;
    if(isCovered){coveredPairs.add(edgeKey(a,b));coveredPairs.add(edgeKey(b,a));}
  }
}
COVERED_PATHS.forEach(p=>addPathEdges(p,true));
OPEN_PATHS.forEach(p=>addPathEdges(p,false));
function isCovered(a,b){return coveredPairs.has(edgeKey(a,b));}

function buildEdges(){
  const edges=[]; const seen=new Set();
  [...OPEN_PATHS,...COVERED_PATHS].forEach(path=>{
    for(let i=0;i<path.length-1;i++){
      const a=path[i],b=path[i+1]; if(!LOCATIONS[a]||!LOCATIONS[b])continue;
      const k=[a,b].sort().join("|"); if(seen.has(k))continue; seen.add(k);
      edges.push([a,b,isCovered(a,b)]);
    }
  });
  return edges;
}
const EDGES=buildEdges();

function fillSelect(select,defaultValue){
  select.innerHTML="";
  const groups={"Campus Facilities":[],"Academic":[],"A-side hostels":[],"C-side hostels":[],"D-side hostels":[],"Mess":[],"Sports":[]};
  Object.entries(LOCATIONS).forEach(([name,p])=>{if(p.type!=="path" && groups[p.group])groups[p.group].push(name);});
  ["Campus Facilities","Academic","A-side hostels","C-side hostels","D-side hostels","Mess","Sports"].forEach(g=>{
    if(!groups[g].length)return;
    const og=document.createElement("optgroup");og.label=g;
    groups[g].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).forEach(name=>{
      const o=document.createElement("option");o.value=name;o.textContent=name;og.appendChild(o);
    });
    select.appendChild(og);
  });
  if(defaultValue)select.value=defaultValue;
}
function populate(){fillSelect(els.start,"Main Gate");fillSelect(els.destination,"Library");}

function distanceKm(a,b){
  const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLon=(b.lon-a.lon)*Math.PI/180;
  const la1=a.lat*Math.PI/180,la2=b.lat*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function totalDistance(points){return points.slice(1).reduce((s,p,i)=>s+distanceKm(points[i],p),0);}
function straightLineDistance(){return distanceKm(LOCATIONS[els.start.value],LOCATIONS[els.destination.value]);}
function drawStraightLine(){
  const s=LOCATIONS[els.start.value],d=LOCATIONS[els.destination.value];
  straightLayer=L.polyline([[s.lat,s.lon],[d.lat,d.lon]],{color:"#111827",weight:3,opacity:.8,dashArray:"7 8"})
    .bindPopup(`<b>Straight-line distance</b><br>${straightLineDistance().toFixed(2)} km<br><small>Geometric comparison only — not a walking path.</small>`).addTo(map);
}

function graphFor(mode){
  const adj={}; Object.keys(LOCATIONS).forEach(n=>adj[n]=[]);
  EDGES.forEach(([a,b,covered])=>{
    const base=distanceKm(LOCATIONS[a],LOCATIONS[b]);
    // D-Spine is marked covered, so covered mode strongly prefers it.
    let cost=base;
    if(mode==="covered") cost*=covered?0.70:1.22;
    else cost*=covered?1.12:0.90;
    adj[a].push({to:b,cost,covered}); adj[b].push({to:a,cost,covered});
  });
  return adj;
}

function shortestPath(start,end,mode){
  const adj=graphFor(mode),dist={},prev={},used=new Set(),names=Object.keys(adj);
  names.forEach(n=>dist[n]=Infinity); dist[start]=0;
  while(used.size<names.length){
    let u=null,b=Infinity;
    for(const n of names)if(!used.has(n)&&dist[n]<b){b=dist[n];u=n;}
    if(!u)break;
    if(u===end)break;
    used.add(u);
    for(const e of adj[u]){
      const nd=dist[u]+e.cost;
      if(nd<dist[e.to]){dist[e.to]=nd;prev[e.to]=u;}
    }
  }
  if(!Number.isFinite(dist[end]))return [start,end];
  const path=[]; let cur=end;
  while(cur){path.unshift(cur);if(cur===start)break;cur=prev[cur];}
  return path;
}
function routeVia(mode){const nodes=shortestPath(els.start.value,els.destination.value,mode);return{nodes,points:nodes.map(n=>LOCATIONS[n])};}

function weatherText(code){
  const c=Number(code);
  if(c===0)return"Clear sky"; if([1,2,3].includes(c))return"Cloudy / partly cloudy";
  if([45,48].includes(c))return"Foggy"; if([51,53,55,56,57].includes(c))return"Drizzle";
  if([61,63,65,66,67].includes(c))return"Rain"; if([80,81,82].includes(c))return"Rain showers";
  if([95,96,99].includes(c))return"Thunderstorm"; return"Other conditions";
}
function weatherEmoji(code){
  const c=Number(code); if(c===0)return"☀️"; if([1,2,3].includes(c))return"⛅"; if([45,48].includes(c))return"🌫️";
  if([51,53,55,56,57].includes(c))return"🌦️"; if([61,63,65,66,67,80,81,82].includes(c))return"🌧️";
  if([95,96,99].includes(c))return"⛈️"; return"🌤️";
}
function closestHourIndex(times,current){
  if(!times?.length||!current)return 0; const target=new Date(current).getTime(); let best=0,diff=Infinity;
  times.forEach((t,i)=>{const d=Math.abs(new Date(t).getTime()-target);if(d<diff){diff=d;best=i;}}); return best;
}
async function fetchWeather(point){
  const params=new URLSearchParams({latitude:point.lat.toFixed(5),longitude:point.lon.toFixed(5),current:"temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m",hourly:"precipitation_probability,precipitation,rain,weather_code",forecast_days:"1",timezone:"auto"});
  const res=await fetch(`${WEATHER_URL}?${params}`); if(!res.ok)throw new Error(`Weather request failed (${res.status})`);
  const data=await res.json(); const idx=closestHourIndex(data.hourly?.time,data.current?.time);
  return{lat:point.lat,lon:point.lon,temp:Number(data.current.temperature_2m),feels:Number(data.current.apparent_temperature),humidity:Number(data.current.relative_humidity_2m),rain:Number(data.current.rain??0),precipitation:Number(data.current.precipitation??0),rainProbability:Number(data.hourly?.precipitation_probability?.[idx]??0),wind:Number(data.current.wind_speed_10m),code:Number(data.current.weather_code),condition:weatherText(data.current.weather_code)};
}

function pointRisk(w){
  let s=0;
  s+=Math.min(w.rainProbability*.24,24);
  s+=Math.min(w.rain*10,30);
  if(w.code>=51&&w.code<=82)s+=22;
  if(w.code>=95)s+=50;
  if(w.temp>=32)s+=Math.min((w.temp-31)*3,15);
  if(w.wind>=30)s+=8;
  return Math.min(100,Math.round(s));
}
function routeRisk(weather,mode,coveredFraction){
  const avg=weather.reduce((s,w)=>s+pointRisk(w),0)/Math.max(1,weather.length);
  const rain=weather.reduce((s,w)=>s+w.rainProbability+w.rain*20,0)/Math.max(1,weather.length);
  const heat=weather.reduce((s,w)=>s+Math.max(0,w.temp-30),0)/Math.max(1,weather.length);
  let r=avg;
  if(mode==="open")r+=Math.min(25,rain*.13+heat*1.5);
  else r-=Math.min(25,rain*.14+heat*.8+coveredFraction*10);
  return Math.max(0,Math.min(100,Math.round(r)));
}
function pathCoveredFraction(nodes){
  let covered=0,total=0;
  for(let i=0;i<nodes.length-1;i++){const d=distanceKm(LOCATIONS[nodes[i]],LOCATIONS[nodes[i+1]]);total+=d;if(isCovered(nodes[i],nodes[i+1]))covered+=d;}
  return total?covered/total:0;
}
function sampleRoute(points,count=8){
  if(points.length<=count)return points;
  const out=[]; for(let i=0;i<count;i++){const idx=Math.round(i*(points.length-1)/(count-1));out.push(points[idx]);} return out;
}
async function analyzeRoute(label,mode){
  const built=routeVia(mode); const sampled=sampleRoute(built.points,Math.min(8,built.points.length));
  const weather=await Promise.all(sampled.map(fetchWeather)); const cf=pathCoveredFraction(built.nodes);
  return{name:label,mode,nodes:built.nodes,points:built.points,weather,distance:totalDistance(built.points),coveredFraction:cf,risk:routeRisk(weather,mode,cf)};
}

function clearLayers(){
  if(!map)return;
  [primaryLayer,backupLayer,checkpointLayer,endpointLayer,straightLayer].forEach(l=>l&&map.removeLayer(l));
  primaryLayer=backupLayer=checkpointLayer=endpointLayer=straightLayer=null;
}
function drawRoute(route,primary){
  const layer=L.polyline(route.points.map(p=>[p.lat,p.lon]),{color:primary?"#155eef":"#64748b",weight:primary?7:5,opacity:primary?.96:.72,dashArray:primary?null:"11 9"}).addTo(map);
  layer.bindPopup(`<b>${route.name}</b><br>${route.mode==="covered"?"Covered-first walkable route":"Open-first walkable route"}<br>Covered section share: ${(route.coveredFraction*100).toFixed(0)}%<br>Risk: ${route.risk}/100`);
  return layer;
}
function riskColor(r){return r<30?"#159455":r<60?"#c47f00":"#d64545";}
function drawCheckpoints(routes){
  checkpointLayer=L.layerGroup().addTo(map);
  routes.forEach(route=>route.weather.forEach((w,i)=>{
    const c=riskColor(pointRisk(w));
    L.circleMarker([w.lat,w.lon],{radius:7,color:c,fillColor:c,fillOpacity:.9,weight:2}).bindPopup(`<b>${route.name} · checkpoint ${i+1}</b><br>${w.condition}<br>${w.temp.toFixed(1)} °C · ${w.rainProbability}% rain probability<br>Rain: ${w.rain.toFixed(1)} mm · Wind: ${w.wind.toFixed(0)} km/h<br><b>Risk: ${pointRisk(w)}/100</b>`).addTo(checkpointLayer);
  }));
}
function showEndpoints(){
  endpointLayer=L.layerGroup().addTo(map); const s=LOCATIONS[els.start.value],d=LOCATIONS[els.destination.value];
  L.marker([s.lat,s.lon]).bindTooltip(`START · ${els.start.value}`,{permanent:true,direction:"top",offset:[0,-8]}).addTo(endpointLayer);
  L.marker([d.lat,d.lon]).bindTooltip(`DESTINATION · ${els.destination.value}`,{permanent:true,direction:"top",offset:[0,-8]}).addTo(endpointLayer);
}
function fitRoutes(routes){const all=routes.flatMap(r=>r.points.map(p=>[p.lat,p.lon]));if(all.length)map.fitBounds(L.latLngBounds(all),{padding:[32,32]});}
function choosePrimary(covered,open){return covered.risk<=open.risk?[covered,open]:[open,covered];}
function average(v){return v.reduce((a,b)=>a+b,0)/Math.max(v.length,1);}

function updateSummary(primary,backup,allRoutes){
  const allWeather=allRoutes.flatMap(r=>r.weather);
  const avgTemp=average(allWeather.map(w=>w.temp));
  const maxRain=Math.max(...allWeather.map(w=>w.rain));
  const maxWind=Math.max(...allWeather.map(w=>w.wind));
  const rainProb=Math.round(average(allWeather.map(w=>w.rainProbability)));
  const primaryLabel=primary.mode==="covered"?"Covered / sheltered":"Open / outdoor";
  const backupLabel=backup.mode==="covered"?"Covered / sheltered":"Open / outdoor";

  els.routeDecision.textContent=`${primaryLabel} route recommended`;
  els.decisionText.textContent=`${primary.name} has the lower weather-risk score (${primary.risk}/100). ${backup.name} remains the backup route (${backup.risk}/100).`;

  const direct=straightLineDistance();
  els.straightDistance.textContent=`${direct.toFixed(2)} km`;
  els.walkableDistance.textContent=`${Math.min(primary.distance,backup.distance).toFixed(2)} km`;
  els.primaryDistance.textContent=`${primary.distance.toFixed(2)} km`;
  els.backupDistance.textContent=`${backup.distance.toFixed(2)} km`;
  els.primaryRisk.textContent=`${primary.risk}/100`;
  els.backupRisk.textContent=`${backup.risk}/100`;

  els.checkpoints.textContent=allWeather.length;
  els.avgTemp.textContent=`${avgTemp.toFixed(1)} °C`;
  els.maxRain.textContent=`${maxRain.toFixed(1)} mm`;
  els.maxWind.textContent=`${maxWind.toFixed(0)} km/h`;

  const covered=allRoutes.find(r=>r.mode==="covered"),open=allRoutes.find(r=>r.mode==="open");
  els.coveredRisk.textContent=`${covered.risk}/100`;
  els.openRisk.textContent=`${open.risk}/100`;
  els.coverageValue.textContent=`${Math.round(primary.coveredFraction*100)}% covered on primary`;
  els.rainStatus.textContent=rainProb>=50?"High":rainProb>=25?"Moderate":"Low";
  els.heatStatus.textContent=avgTemp>=35?"High":avgTemp>=31?"Moderate":"Low";
  els.routeComparison.textContent=`Covered ${covered.risk}/100 vs Open ${open.risk}/100`;

  els.recommendation.className=`recommendation ${primary.mode}`;
  if(primary.mode==="open"){
    els.recommendation.innerHTML=`<strong>Take the open / outdoor route.</strong><br>If rain starts, switch to the covered route shown as the backup.`;
    els.routeReason.textContent="Current weather exposure gives the open route a lower modeled risk. The D-Spine and other covered corridors remain available as the rain fallback.";
  }else{
    els.recommendation.innerHTML=`<strong>Take the covered / sheltered route.</strong><br>If conditions dry up, the open route remains available as the alternative.`;
    els.routeReason.textContent="Current weather exposure makes shelter more valuable. The yellow covered corridors and the red D-Spine are included in the covered network.";
  }

  const campus=allWeather[0];
  els.temp.textContent=campus.temp.toFixed(1);
  els.feels.textContent=`${campus.feels.toFixed(1)} °C`;
  els.rain.textContent=`${campus.rain.toFixed(1)} mm`;
  els.rainProb.textContent=`${campus.rainProbability}%`;
  els.humidity.textContent=`${campus.humidity}%`;
  els.wind.textContent=`${campus.wind.toFixed(0)} km/h`;
  els.condition.textContent=`${campus.condition} · ${campus.rainProbability}% rain probability`;
  els.weatherIcon.textContent=weatherEmoji(campus.code);
  els.primaryMode.textContent=primaryLabel;
  els.backupMode.textContent=backupLabel;

  els.weatherTable.innerHTML=allRoutes.map(route=>route.weather.map((w,i)=>{
    const r=pointRisk(w),t=r<30?"Good":r<60?"Caution":"Risk";
    return `<tr><td>${route.name}</td><td>${i+1}</td><td>${w.temp.toFixed(1)} °C</td><td>${w.rain.toFixed(1)} mm</td><td>${w.rainProbability}%</td><td>${w.wind.toFixed(0)} km/h</td><td>${w.condition}</td><td><span class="risk-chip ${t.toLowerCase()}">${t} · ${r}</span></td></tr>`;
  }).join("")).join("");
  els.analysisRows.textContent=`${allWeather.length} weather checkpoints sampled across the two walkable BITS Goa route options.`;
}

function buildCsv(){
  if(!lastAnalysis)return;
  const rows=[["Start","Destination","Route","Mode","Checkpoint","Latitude","Longitude","Temperature C","Feels Like C","Rain mm","Rain probability %","Humidity %","Wind km/h","Condition","Risk score","Covered fraction"]];
  lastAnalysis.routes.forEach(route=>route.weather.forEach((w,i)=>rows.push([els.start.value,els.destination.value,route.name,route.mode,i+1,w.lat.toFixed(5),w.lon.toFixed(5),w.temp.toFixed(1),w.feels.toFixed(1),w.rain.toFixed(2),w.rainProbability,w.humidity,w.wind.toFixed(1),w.condition,pointRisk(w),(route.coveredFraction*100).toFixed(0)+"%"])));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="bits-goa-weather-route-analysis.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function planRoute(){
  if(!els.start.value||!els.destination.value||els.start.value===els.destination.value){els.decisionText.textContent="Choose two different BITS Goa locations.";return;}
  els.planBtn.disabled=true;
  els.planBtn.textContent="Analyzing campus…";
  els.routeDecision.textContent="Checking current campus weather…";
  els.decisionText.textContent="Comparing covered and open walkable networks, with the D-Spine treated as covered.";
  try{
    const [covered,open]=await Promise.all([analyzeRoute("Covered route","covered"),analyzeRoute("Open route","open")]);
    const [primary,backup]=choosePrimary(covered,open);
    lastAnalysis={routes:[primary,backup],primary,backup};
    clearLayers();
    drawStraightLine();
    primaryLayer=drawRoute(primary,true);
    backupLayer=drawRoute(backup,false);
    drawCheckpoints([primary,backup]);
    showEndpoints();
    fitRoutes([primary,backup]);
    updateSummary(primary,backup,[primary,backup]);
  }catch(err){
    console.error(err);
    els.routeDecision.textContent="Weather data could not be loaded";
    els.decisionText.textContent="The campus route network is available, but the live weather request failed. Check your internet connection and try again.";
    els.recommendation.className="recommendation warning";
    els.recommendation.textContent="No weather-based recommendation was generated.";
  }finally{
    els.planBtn.disabled=false;
    els.planBtn.textContent="Plan route";
  }
}

function resetApp(){
  clearLayers();
  if(map)map.setView(CAMPUS_CENTER,16.8);
  els.routeDecision.textContent="Choose a BITS Goa route";
  els.decisionText.textContent="Select a campus start point and destination to compare covered and open route options.";
  els.recommendation.className="recommendation neutral";
  els.recommendation.textContent="Plan a route to see the weather-based recommendation.";
  [els.temp,els.feels,els.rain,els.rainProb,els.humidity,els.wind,els.straightDistance,els.walkableDistance,els.primaryDistance,els.backupDistance,els.primaryRisk,els.backupRisk,els.checkpoints,els.avgTemp,els.maxRain,els.maxWind,els.coveredRisk,els.openRisk].forEach(e=>e.textContent="--");
  els.condition.textContent="Waiting for route analysis…";
  els.weatherIcon.textContent="☁️";
  els.coverageValue.textContent="--";
  els.rainStatus.textContent="--";
  els.heatStatus.textContent="--";
  els.routeComparison.textContent="--";
  els.routeReason.textContent="--";
  els.primaryMode.textContent="--";
  els.backupMode.textContent="--";
  els.analysisRows.textContent="";
  els.weatherTable.innerHTML="";
  lastAnalysis=null;
}

populate();
initMap();
els.planBtn.addEventListener("click",planRoute);
els.resetBtn.addEventListener("click",resetApp);
els.downloadBtn.addEventListener("click",buildCsv);
