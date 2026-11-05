"use strict";
(function () {
  const requestKey="nafas.familyConnectionRequests.v1";
  const summaryKey="nafas.familySharedWellness.v1";
  function readRequests(){try{const value=JSON.parse(localStorage.getItem(requestKey)||"[]");return Array.isArray(value)?value:[];}catch(error){return[];}}
  function writeRequests(value){try{localStorage.setItem(requestKey,JSON.stringify(value));return true;}catch(error){return false;}}
  function readSummaries(){try{const value=JSON.parse(localStorage.getItem(summaryKey)||"{}");return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}catch(error){return{};}}
  function writeSummaries(value){try{localStorage.setItem(summaryKey,JSON.stringify(value));return true;}catch(error){return false;}}
  function activeUser(){try{const value=JSON.parse(sessionStorage.getItem("nafas.activeDemoAccount.v1")||"null");return value&&value.role==="user"?value:null;}catch(error){return null;}}
  function currentMood(){try{return sessionStorage.getItem("nafas.lastMood.v1")||"";}catch(error){return "";}}
  function currentActivities(){try{return JSON.parse(sessionStorage.getItem("nafas.latestActivitySummary.v1")||"null");}catch(error){return null;}}
  function syncUser(email){const requests=readRequests(),summaries=readSummaries(),mood=currentMood(),activities=currentActivities();let changed=false;requests.forEach(request=>{if(request.targetEmail!==email||request.status!=="accepted")return;const data={requestId:request.id,userEmail:email,displayName:request.targetName||"Personal User",updatedAt:new Date().toISOString()};if(request.permissions&&request.permissions.mood&&mood)data.mood=mood;if(request.permissions&&request.permissions.activities&&activities)data.activities=activities;if(data.mood||data.activities){summaries[request.id]=data;changed=true;}else if(summaries[request.id]){delete summaries[request.id];changed=true;}});if(changed)writeSummaries(summaries);}
  function saveMood(mood){if(!mood)return;try{sessionStorage.setItem("nafas.lastMood.v1",mood);}catch(error){}const user=activeUser();if(user)syncUser(user.email);}
  function saveActivities(){const boxes=[...document.querySelectorAll(".daily-task input[type='checkbox']")];if(!boxes.length)return;const summary={completed:boxes.filter(box=>box.checked).length,total:boxes.length,updatedAt:new Date().toISOString()};try{sessionStorage.setItem("nafas.latestActivitySummary.v1",JSON.stringify(summary));}catch(error){}const user=activeUser();if(user)syncUser(user.email);}
  window.NafasSharing={requestKey,summaryKey,readRequests,writeRequests,readSummaries,writeSummaries,activeUser,currentMood,currentActivities,syncUser,saveMood,saveActivities};
  document.addEventListener("click",function(event){const button=event.target.closest&&event.target.closest(".mood-option");if(button&&document.getElementById("mood-options")){const label=button.dataset.mood;const names={Great:"Great",Good:"Good",Okay:"Okay",Low:"Low",Anxious:"Anxious"};saveMood(names[label]||label);}});
  document.addEventListener("click",function(event){if(!event.target.closest||!event.target.closest("#save-mood"))return;const selected=document.querySelector(".mood-option.selected");if(selected)saveMood(({great:"Great",okay:"Okay",low:"Low",anxious:"Anxious"})[selected.dataset.mood]||selected.dataset.mood);});
  document.addEventListener("change",function(event){if(event.target.matches&&event.target.matches(".daily-task input[type='checkbox']"))saveActivities();});
})();
