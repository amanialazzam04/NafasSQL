"use strict";
document.documentElement.dataset.familyPage = "family-dashboard";
document.addEventListener("DOMContentLoaded", function () {
  let active;
  try { active = JSON.parse(sessionStorage.getItem("nafas.activeDemoAccount.v1") || "null"); } catch (error) {}
  if (!active || active.role !== "family") return;
  let requests=[];
  try { requests=JSON.parse(localStorage.getItem("nafas.familyConnectionRequests.v1")||"[]"); } catch(error) {}
  const accepted=requests.filter(item=>item.familyEmail===active.email&&item.status==="accepted");
  let summaries={};try{summaries=JSON.parse(localStorage.getItem("nafas.familySharedWellness.v1")||"{}");}catch(error){}
  const shared=accepted.filter(item=>item.permissions&&((item.permissions.mood&&summaries[item.id]?.mood)||(item.permissions.activities&&summaries[item.id]?.activities)));
  const count=document.getElementById("family-connected-count"),sharing=document.getElementById("family-sharing-count"),status=document.getElementById("family-summary-status");
  if(count)count.textContent=String(accepted.length);if(sharing)sharing.textContent=String(shared.length);if(status)status.textContent=accepted.length?"Connected with consent":"Not connected";
  const dataStatus=document.getElementById("family-data-status"),empty=document.getElementById("family-dashboard-empty"),list=document.getElementById("family-dashboard-shared-updates");
  if(dataStatus)dataStatus.textContent=accepted.length?"Connected with consent":"No family data connected";
  if(list){list.replaceChildren();list.hidden=shared.length===0;if(empty)empty.hidden=shared.length>0;shared.forEach(item=>{const card=document.createElement("article"),title=document.createElement("strong");card.className="permission-row";title.textContent=item.targetName||"Personal User";card.append(title);if(item.permissions.mood&&summaries[item.id].mood){const mood=document.createElement("p");mood.textContent="Latest mood check-in shared: "+String(summaries[item.id].mood);card.append(mood);}if(item.permissions.activities&&summaries[item.id].activities){const activity=document.createElement("p");activity.textContent=`Daily self-care check-ins completed: ${Number(summaries[item.id].activities.completed)||0} of ${Number(summaries[item.id].activities.total)||0}`;card.append(activity);}list.append(card);});}
});
