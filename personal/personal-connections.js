"use strict";
document.addEventListener("DOMContentLoaded", function () {
  const manager=document.getElementById("family-connection-manager"),feedback=document.createElement("p");
  if(!manager)return;
  feedback.className="family-share-feedback";feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
  const sharing=window.NafasSharing;
  const user=sharing&&sharing.activeUser();
  if(!user){manager.textContent="Sign in as a Personal User to review connection requests.";return;}
  const make=(tag,value)=>{const el=document.createElement(tag);if(value!==undefined)el.textContent=value;return el;};
  function render(message){
    manager.replaceChildren();feedback.textContent=message||"";
    const requests=sharing.readRequests().filter(item=>item.targetEmail===user.email);
    const pending=requests.filter(item=>item.status==="pending");
    const active=requests.filter(item=>item.status==="accepted");
    const history=requests.filter(item=>["rejected","revoked","cancelled"].includes(item.status));
    const section=(title,items,emptyText)=>{const heading=make("h3",title);manager.append(heading);if(!items.length){const empty=make("p",emptyText);empty.className="family-share-card";manager.append(empty);}};
    section("Incoming requests",pending,"No pending family connection requests.");
    pending.forEach(request=>{
      const card=make("article","");card.className="family-share-card";card.append(make("h3",request.familyName||"Family member"),make("p",`${request.familyEmail} would like to connect. Nothing is shared unless you accept and choose a category.`));
      const label=make("label","");label.className="family-share-choice";const checkbox=make("input","");checkbox.type="checkbox";checkbox.checked=false;const copy=make("span","Share your latest mood label and update date. Mood notes, journals, AI conversations, and private messages are never shared.");label.append(checkbox,copy);card.append(label);
      const activityLabel=make("label","");activityLabel.className="family-share-choice";const activityBox=make("input","");activityBox.type="checkbox";activityBox.checked=false;const activityCopy=make("span","Optionally share a count of completed daily self-care check-ins. No task names or notes are shared.");activityLabel.append(activityBox,activityCopy);card.append(activityLabel);
      const actions=make("div","");actions.className="family-share-actions";
      const accept=make("button","Accept connection");accept.type="button";accept.className="primary-button";accept.addEventListener("click",function(){const all=sharing.readRequests(),current=all.find(item=>item.id===request.id);if(!current)return;current.status="accepted";current.acceptedAt=new Date().toISOString();current.permissions={mood:checkbox.checked,activities:activityBox.checked,sessionStatus:false};if(!sharing.writeRequests(all)){feedback.textContent="Browser storage is unavailable; your choice was not saved.";return;}sharing.syncUser(user.email);render(checkbox.checked||activityBox.checked?"Connection accepted with the categories you selected. Shared updates remain optional.":"Connection accepted with no wellbeing updates shared.");});
      const reject=make("button","Reject");reject.type="button";reject.addEventListener("click",function(){const all=sharing.readRequests(),current=all.find(item=>item.id===request.id);if(current){current.status="rejected";current.permissions={mood:false,activities:false,sessionStatus:false};}sharing.writeRequests(all);render("Request declined. No information was shared.");});actions.append(accept,reject);card.append(actions);manager.append(card);
    });
    section("Connected Family members",active,"No active family connections. You can use the platform without connecting anyone.");
    active.forEach(request=>{
      const card=make("article","");card.className="family-share-card";card.append(make("h3",request.familyName||"Family member"),make("p",request.familyEmail));
      const label=make("label","");label.className="family-share-choice";const checkbox=make("input","");checkbox.type="checkbox";checkbox.checked=Boolean(request.permissions&&request.permissions.mood);const copy=make("span","Share latest mood label and update date. Notes, journals, AI conversations, and private messages remain private.");label.append(checkbox,copy);card.append(label);
      const activityLabel=make("label","");activityLabel.className="family-share-choice";const activityBox=make("input","");activityBox.type="checkbox";activityBox.checked=Boolean(request.permissions&&request.permissions.activities);const activityCopy=make("span","Share a count of completed daily self-care check-ins. No task names or notes are shared.");activityLabel.append(activityBox,activityCopy);card.append(activityLabel);
      const actions=make("div","");actions.className="family-share-actions";
      const save=make("button","Save sharing choice");save.type="button";save.className="primary-button";save.addEventListener("click",function(){const all=sharing.readRequests(),current=all.find(item=>item.id===request.id);if(!current||current.status!=="accepted")return;current.permissions={mood:checkbox.checked,activities:activityBox.checked,sessionStatus:false};if(!sharing.writeRequests(all)){feedback.textContent="Browser storage is unavailable; the sharing choice was not saved.";return;}sharing.syncUser(user.email);render(checkbox.checked||activityBox.checked?"Sharing choice saved in this browser. Only the selected summary fields are included.":"Sharing is off. No wellbeing update is available to this family member.");});
      const revoke=make("button","Revoke connection and sharing");revoke.type="button";revoke.className="revoke-button";revoke.addEventListener("click",function(){if(!window.confirm("Revoke this Family connection? Their access to any shared demo summary will stop."))return;const all=sharing.readRequests(),current=all.find(item=>item.id===request.id);if(current){current.status="revoked";current.permissions={mood:false,activities:false,sessionStatus:false};}sharing.writeRequests(all);const summaries=sharing.readSummaries();delete summaries[request.id];sharing.writeSummaries(summaries);render("Connection revoked. No wellbeing data is shared with this Family member.");});actions.append(save,revoke);card.append(actions);manager.append(card);
    });
    if(history.length){section("Past requests",history,"");history.forEach(request=>{const card=make("article","");card.className="family-share-card";card.append(make("strong",request.familyName||"Family member"),make("span",({rejected:"Declined",revoked:"Connection revoked",cancelled:"Cancelled"})[request.status]||request.status));manager.append(card);});}
    manager.append(feedback);
  }
  window.addEventListener("storage",function(event){if(event.key===sharing.requestKey||event.key===sharing.summaryKey)render();});
  render();
});
