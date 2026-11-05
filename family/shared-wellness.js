"use strict";
document.documentElement.dataset.familyPage = "shared-wellness";
document.addEventListener("DOMContentLoaded",function(){
  let active;try{active=JSON.parse(sessionStorage.getItem("nafas.activeDemoAccount.v1")||"null");}catch(error){}
  const list=document.getElementById("family-shared-list"),empty=document.getElementById("family-shared-empty"),status=document.getElementById("family-sharing-status"),summary=document.getElementById("family-sharing-summary");
  if(!list||!summary)return;
  function render(){
    let requests=[],summaries={};try{requests=JSON.parse(localStorage.getItem("nafas.familyConnectionRequests.v1")||"[]");}catch(error){}try{summaries=JSON.parse(localStorage.getItem("nafas.familySharedWellness.v1")||"{}");}catch(error){}
    const visible=Array.isArray(requests)?requests.filter(item=>active&&active.role==="family"&&item.familyEmail===active.email&&item.status==="accepted"&&item.permissions&&((item.permissions.mood&&summaries[item.id]?.mood)||(item.permissions.activities&&summaries[item.id]?.activities))):[];
    list.replaceChildren();summary.replaceChildren();
    if(!visible.length){if(empty)empty.hidden=false;if(status)status.textContent="No shared data";summary.append(document.createElement("p"));summary.children[0].textContent="Connected person: None · Shared categories: None available · Last update: Not available";return;}
    if(empty)empty.hidden=true;if(status)status.textContent=`${visible.length} shared update${visible.length===1?"":"s"}`;
    const names=[...new Set(visible.map(item=>item.targetName||"Personal User"))];const latest=visible.map(item=>summaries[item.id].updatedAt).sort().at(-1);
    const categories=new Set();visible.forEach(item=>{if(item.permissions.mood&&summaries[item.id].mood)categories.add("Latest mood summary");if(item.permissions.activities&&summaries[item.id].activities)categories.add("Daily self-care completion count");});
    [["Connected person:",names.join(", ")],["Shared categories:",[...categories].join(", ")],["Last update:",latest?new Date(latest).toLocaleString():"Not available"]].forEach(([label,value])=>{const p=document.createElement("p"),strong=document.createElement("strong");strong.textContent=label;p.append(strong,document.createTextNode(" "+value));summary.append(p);});
    visible.forEach(item=>{const data=summaries[item.id],card=document.createElement("article"),title=document.createElement("strong");card.className="permission-row";title.textContent=item.targetName||"Personal User";card.append(title);if(item.permissions.mood&&data.mood){const mood=document.createElement("p");mood.textContent="Latest mood check-in shared: "+String(data.mood);card.append(mood);}if(item.permissions.activities&&data.activities){const activity=document.createElement("p");activity.textContent=`Daily self-care check-ins completed: ${Number(data.activities.completed)||0} of ${Number(data.activities.total)||0}`;card.append(activity);}const date=document.createElement("small");date.textContent="Updated "+(data.updatedAt?new Date(data.updatedAt).toLocaleString():"recently");card.append(date);list.append(card);});
  }
  window.addEventListener("storage",event=>{if(["nafas.familyConnectionRequests.v1","nafas.familySharedWellness.v1"].includes(event.key))render();});
  render();
});
