"use strict";
document.documentElement.dataset.familyPage = "my-loved-ones";
document.addEventListener("DOMContentLoaded", function () {
  const key = "nafas.familyConnectionRequests.v1";
  let active;
  try { active = JSON.parse(sessionStorage.getItem("nafas.activeDemoAccount.v1") || "null"); } catch (error) {}
  const form = document.getElementById("connection-form"), feedback = document.getElementById("connection-feedback");
  const list = document.getElementById("family-request-list"), connected = document.getElementById("family-connected-list");
  function read() { try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch (error) { return []; } }
  function write(items) { try { localStorage.setItem(key, JSON.stringify(items)); return true; } catch (error) { return false; } }
  function node(tag, value) { const el = document.createElement(tag); el.textContent = value; return el; }
  function render() {
    if (!active || active.role !== "family" || !list || !connected) return;
    const requests = read().filter(item => item.familyEmail === active.email);
    list.replaceChildren(); connected.replaceChildren();
    const links = requests.filter(item => item.status === "accepted");
    if (!links.length) { const empty=node("div", ""); empty.className="empty-state"; empty.append(node("h3","No loved ones connected yet"),node("p","You can use all general Family resources without connecting. A connection becomes active only after the Personal User accepts.")); connected.append(empty); }
    links.forEach(item => { const card=node("article", ""); card.className="permission-row"; card.append(node("strong",item.targetName||"Connected Personal User"),node("span","Connected with consent")); const names=Object.entries(item.permissions||{}).filter(([,value])=>value).map(([name])=>({mood:"Latest mood summary",activities:"Daily self-care completion count",sessionStatus:"Session status"}[name]||name)); card.append(node("p",names.length?"Shared with you: "+names.join(", "):"No optional information is currently shared.")); connected.append(card); });
    if (!requests.length) { const empty=node("div",""); empty.className="empty-state compact-empty"; empty.append(node("h3","No requests available"),node("p","Requests you send will appear here.")); list.append(empty); }
    requests.forEach(item => { const card=node("article",""); card.className="permission-row"; const state={pending:"Awaiting Personal User response",accepted:"Accepted with consent",rejected:"Declined",cancelled:"Cancelled",revoked:"Sharing revoked by Personal User"}[item.status]||item.status; card.append(node("strong",item.targetName||item.targetEmail),node("span",state)); if(item.note)card.append(node("p",item.note)); if(item.status==="pending"){const cancel=node("button","Cancel request");cancel.type="button";cancel.className="secondary-button";cancel.addEventListener("click",function(){const all=read(),request=all.find(entry=>entry.id===item.id);if(request)request.status="cancelled";write(all);render();});card.append(cancel);} list.append(card); });
  }
  form?.addEventListener("submit", function (event) {
    event.preventDefault(); if (!form.reportValidity()) return;
    if (!active || active.role !== "family") { feedback.textContent="Sign in with a Family demo account to send a request."; return; }
    const name=document.getElementById("connection-name").value.trim(), email=document.getElementById("connection-email").value.trim().toLowerCase();
    if(email===active.email){feedback.textContent="Choose the Personal User's account email, not your Family account.";return;}
    const all=read();
    if(all.some(item=>item.familyEmail===active.email&&item.targetEmail===email&&["pending","accepted"].includes(item.status))){feedback.textContent="A request or connection for this account is already active.";return;}
    all.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),familyEmail:active.email,familyName:"Family demo member",targetEmail:email,targetName:name,status:"pending",createdAt:new Date().toISOString(),permissions:{mood:false,activities:false,sessionStatus:false}});
    if(!write(all)){feedback.textContent="Browser storage is unavailable; the demo request was not recorded.";return;}
    form.reset();feedback.textContent="Demo request recorded in this browser. No notification was sent. The Personal User must accept and select permissions.";render();
  });
  form?.addEventListener("reset",()=>{feedback.textContent="";});
  window.addEventListener("storage",event=>{if(event.key===key)render();});
  render();
});
