(function () {
  "use strict";
  var D = window.NafasDatabaseData;
  if (!D) return;
  var NS = "http://www.w3.org/2000/svg";
  var groupById = {};
  var tableByName = {};
  var activeSelection = { er: null, schema: null };
  var pinnedSelection = { er: null, schema: null };
  var zoomState = { er: { scale: 1, manual: false }, schema: { scale: 1, manual: false } };
  D.groups.forEach(function (g) { groupById[g.id] = g; });
  D.tables.forEach(function (t) { tableByName[t.name] = t; });

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function svgEl(tag, attrs, text) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function safeId(value) { return value.replace(/[^a-zA-Z0-9_-]/g, "-"); }
  function allColumns() { return D.tables.reduce(function (sum, t) { return sum + t.columns.length; }, 0); }
  function setCounts() {
    document.getElementById("table-count-badge").textContent = D.tables.length + " tables";
    document.getElementById("column-count-badge").textContent = allColumns() + " columns";
    document.getElementById("relationship-count-badge").textContent = D.relationships.length + " relationships";
  }
  function renderLegend(id) {
    var root = document.getElementById(id);
    root.replaceChildren();
    D.groups.forEach(function (g) {
      var item = el("span", "legend-item");
      var swatch = el("i", "legend-swatch group-swatch-" + g.color);
      item.append(swatch, document.createTextNode(g.name));
      root.append(item);
    });
  }
  function tableLayout(view, name) {
    var p = D.layout[view].positions[name];
    return { x: p[0], y: p[1], w: view === "er" ? 310 : 320, h: view === "er" ? 104 : 43 + tableByName[name].columns.length * 25 };
  }
  function relationVisible(r, view) {
    var box = document.getElementById("hide-users-relations-" + view);
    return !(box && box.checked && (r.sourceTable === "Users" || r.targetTable === "Users"));
  }
  function addCardinality(svg, x, y, type, angle, optional) {
    var g = svgEl("g", { transform: "translate(" + x + " " + y + ") rotate(" + angle + ")", class: "cardinality-mark" });
    var color = "#829691";
    if (optional) g.append(svgEl("circle", { cx: -11, cy: 0, r: 3, fill: "var(--surface-soft)", stroke: color, "stroke-width": 1.5 }));
    if (type === "many") {
      g.append(svgEl("line", { x1: -7, y1: 0, x2: 3, y2: -7, stroke: color, "stroke-width": 1.5 }));
      g.append(svgEl("line", { x1: -7, y1: 0, x2: 3, y2: 0, stroke: color, "stroke-width": 1.5 }));
      g.append(svgEl("line", { x1: -7, y1: 0, x2: 3, y2: 7, stroke: color, "stroke-width": 1.5 }));
    } else {
      g.append(svgEl("line", { x1: -2, y1: -6, x2: -2, y2: 6, stroke: color, "stroke-width": 1.6 }));
      g.append(svgEl("line", { x1: 3, y1: -6, x2: 3, y2: 6, stroke: color, "stroke-width": 1.6 }));
    }
    svg.append(g);
  }
  function anchorFor(view, tableName, columnName, otherX, otherY) {
    var box = tableLayout(view, tableName);
    var table = tableByName[tableName];
    var colIndex = table.columns.findIndex(function (c) { return c.name === columnName; });
    var header = view === "schema" ? 43 : 0;
    var rowHeight = view === "schema" ? 25 : 0;
    var cy = view === "schema" ? box.y + header + colIndex * rowHeight + rowHeight / 2 : box.y + box.h / 2;
    var cx = box.x + box.w / 2;
    if (Math.abs(otherX - cx) >= Math.abs(otherY - cy)) {
      return { x: otherX >= cx ? box.x + box.w : box.x, y: cy, side: otherX >= cx ? "right" : "left" };
    }
    return { x: cx, y: otherY >= cy ? box.y + box.h : box.y, side: otherY >= cy ? "bottom" : "top" };
  }
  function curveFor(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var bend = Math.max(55, Math.min(190, Math.abs(dx) * 0.42 + Math.abs(dy) * 0.12));
    var c1 = { x: a.x + (a.side === "right" ? bend : a.side === "left" ? -bend : 0), y: a.y + (a.side === "bottom" ? bend : a.side === "top" ? -bend : 0) };
    var c2 = { x: b.x + (b.side === "right" ? bend : b.side === "left" ? -bend : 0), y: b.y + (b.side === "bottom" ? bend : b.side === "top" ? -bend : 0) };
    var path = "M " + a.x + " " + a.y + " C " + c1.x + " " + c1.y + ", " + c2.x + " " + c2.y + ", " + b.x + " " + b.y;
    var mid = { x: (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8, y: (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8 };
    return { path: path, mid: mid, angleA: Math.atan2(c1.y - a.y, c1.x - a.x) * 180 / Math.PI, angleB: Math.atan2(b.y - c2.y, b.x - c2.x) * 180 / Math.PI };
  }
  function renderRelations(svg, view) {
    var links = D.relationships.filter(function (r) { return relationVisible(r, view); });
    links.forEach(function (r, index) {
      var source = tableLayout(view, r.sourceTable), target = tableLayout(view, r.targetTable);
      var a = anchorFor(view, r.sourceTable, r.sourceColumn, target.x + target.w / 2, target.y + target.h / 2);
      var b = anchorFor(view, r.targetTable, r.targetColumn, source.x + source.w / 2, source.y + source.h / 2);
      var c = curveFor(a, b);
      var relation = svgEl("g", { class: "relation-group", "data-rel-index": index, "data-source": r.sourceTable, "data-target": r.targetTable });
      relation.append(svgEl("path", { d: c.path, class: "relationship-path", "data-source": r.sourceTable, "data-target": r.targetTable }));
      var sourceTable = tableByName[r.sourceTable];
      var optional = sourceTable.columns.find(function (col) { return col.name === r.sourceColumn; }).null;
      addCardinality(relation, a.x, a.y, "many", c.angleA + 180, true);
      addCardinality(relation, b.x, b.y, "one", c.angleB + 180, r.targetCardinality === "zero or one");
      if (document.getElementById("show-labels-" + view).checked) {
        relation.append(svgEl("text", { x: c.mid.x, y: c.mid.y - 5, class: "relationship-label", "data-source": r.sourceTable, "data-target": r.targetTable, "text-anchor": "middle" }, r.label));
      }
      svg.append(relation);
    });
  }
  function createTableGroup(view, table) {
    var box = tableLayout(view, table.name);
    var group = groupById[table.group];
    var g = svgEl("g", { class: "diagram-table card-shadow group-color-" + group.color, tabindex: "0", role: "button", "aria-label": table.name + ", " + table.columns.length + " columns. Select to highlight relationships.", "data-table": table.name });
    g.append(svgEl("rect", { x: box.x, y: box.y, width: box.w, height: box.h, rx: 12, class: "table-outline" }));
    if (view === "er") {
      g.append(svgEl("path", { d: "M " + box.x + " " + (box.y + 12) + " Q " + box.x + " " + box.y + " " + (box.x + 12) + " " + box.y + " L " + (box.x + box.w - 12) + " " + box.y + " Q " + (box.x + box.w) + " " + box.y + " " + (box.x + box.w) + " " + (box.y + 12) + " L " + (box.x + box.w) + " " + (box.y + 50) + " L " + box.x + " " + (box.y + 50) + " Z", class: "er-table-header" }));
      g.append(svgEl("text", { x: box.x + 14, y: box.y + 24, class: "er-title" }, table.name));
      g.append(svgEl("text", { x: box.x + 14, y: box.y + 43, class: "er-subtitle" }, group.name));
      g.append(svgEl("text", { x: box.x + 14, y: box.y + 71, class: "er-key-text" }, table.columns.length + " columns"));
      var pk = table.columns.filter(function (c) { return c.pk; }).map(function (c) { return c.name; });
      var fk = table.columns.filter(function (c) { return c.fk; }).length;
      g.append(svgEl("text", { x: box.x + box.w - 14, y: box.y + 71, class: "er-key-text", "text-anchor": "end" }, "PK " + pk.join(", ") + "   ·   " + fk + " FK"));
    } else {
      g.append(svgEl("rect", { x: box.x, y: box.y, width: box.w, height: 42, rx: 10, class: "er-table-header" }));
      g.append(svgEl("rect", { x: box.x, y: box.y + 31, width: box.w, height: 11, class: "er-table-header" }));
      g.append(svgEl("text", { x: box.x + 12, y: box.y + 26, class: "schema-title" }, table.name));
      table.columns.forEach(function (c, i) {
        var y = box.y + 43 + i * 25;
        g.append(svgEl("rect", { x: box.x + 1, y: y, width: box.w - 2, height: 25, class: "schema-row-bg" + (c.fk ? " fk-row" : "") }));
        var flags = [];
        if (c.pk) flags.push(["PK", "#488476"]);
        if (c.fk) flags.push(["FK", "#7187b1"]);
        if (c.uq) flags.push(["UQ", "#ad8650"]);
        flags.forEach(function (flag, j) {
          g.append(svgEl("rect", { x: box.x + 9 + j * 28, y: y + 5, width: 24, height: 15, rx: 4, fill: flag[1] }));
          g.append(svgEl("text", { x: box.x + 21 + j * 28, y: y + 16, class: "diagram-key-chip", fill: "#fff", "text-anchor": "middle" }, flag[0]));
        });
        g.append(svgEl("text", { x: box.x + 12 + flags.length * 28, y: y + 16.5, class: "schema-column" }, c.name));
        g.append(svgEl("text", { x: box.x + box.w - 10, y: y + 16.5, class: "schema-type" }, c.type + (c.identity ? " IDENTITY" : "")));
      });
    }
    g.addEventListener("pointerenter", function () { activeSelection[view] = table.name; applyHighlight(view); showTableInfo(view, table.name); });
    g.addEventListener("pointerleave", function () { activeSelection[view] = pinnedSelection[view]; applyHighlight(view); if (!pinnedSelection[view]) showTableInfo(view, null); });
    g.addEventListener("click", function (event) { event.stopPropagation(); pinnedSelection[view] = pinnedSelection[view] === table.name ? null : table.name; activeSelection[view] = pinnedSelection[view]; applyHighlight(view); showTableInfo(view, activeSelection[view]); });
    g.addEventListener("keydown", function (event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
    return g;
  }
  function applyHighlight(view) {
    var selected = activeSelection[view];
    var svg = document.getElementById("diagram-" + view);
    svg.querySelectorAll(".diagram-table").forEach(function (node) {
      var name = node.getAttribute("data-table");
      node.classList.toggle("is-selected", name === selected);
      node.classList.toggle("is-dimmed", !!selected && name !== selected && !D.relationships.some(function (r) { return (r.sourceTable === selected && r.targetTable === name) || (r.targetTable === selected && r.sourceTable === name); }));
    });
    svg.querySelectorAll(".relationship-path, .relationship-label").forEach(function (node) {
      var touches = selected && (node.getAttribute("data-source") === selected || node.getAttribute("data-target") === selected);
      node.classList.toggle("is-highlighted", !!touches && node.classList.contains("relationship-path"));
      node.classList.toggle("is-dimmed", !!selected && !touches);
    });
  }
  function showTableInfo(view, tableName) {
    var bar = document.getElementById("table-info-" + view);
    if (!tableName) { bar.textContent = view === "er" ? "Select a table to inspect its connections." : "Select a table to inspect its columns and connections."; return; }
    var table = tableByName[tableName];
    var related = D.relationships.filter(function (r) { return r.sourceTable === tableName || r.targetTable === tableName; }).length;
    bar.textContent = tableName + " · " + table.columns.length + " columns · " + related + " relationships · " + table.description;
  }
  function renderDiagram(view) {
    var svg = document.getElementById("diagram-" + view);
    var layout = D.layout[view];
    svg.setAttribute("viewBox", "0 0 " + layout.canvasWidth + " " + layout.canvasHeight);
    svg.setAttribute("width", layout.canvasWidth);
    svg.setAttribute("height", layout.canvasHeight);
    svg.replaceChildren();
    renderRelations(svg, view);
    D.tables.forEach(function (t) { svg.append(createTableGroup(view, t)); });
    svg.onclick = function (event) { if (event.target === svg) { pinnedSelection[view] = null; activeSelection[view] = null; applyHighlight(view); showTableInfo(view, null); } };
    renderLegend("group-legend-" + view);
    updateHiddenCount(view);
    if (zoomState[view].manual) setZoom(view, zoomState[view].scale, false); else fitDiagram(view);
  }
  function updateHiddenCount(view) {
    var hidden = D.relationships.filter(function (r) { return !relationVisible(r, view); }).length;
    document.getElementById("hidden-count-" + view).textContent = hidden + " hidden";
  }
  function fitDiagram(view) {
    var viewport = document.getElementById("viewport-" + view);
    var layout = D.layout[view];
    var scale = Math.min((viewport.clientWidth - 18) / layout.canvasWidth, (viewport.clientHeight - 18) / layout.canvasHeight, 1);
    setZoom(view, Math.max(.35, scale), false);
    viewport.scrollTop = 0;
    viewport.scrollLeft = 0;
  }
  function setZoom(view, scale, manual) {
    scale = Math.max(.35, Math.min(1.6, scale));
    zoomState[view].scale = scale;
    if (manual) zoomState[view].manual = true;
    var svg = document.getElementById("diagram-" + view);
    svg.setAttribute("width", D.layout[view].canvasWidth * scale);
    svg.setAttribute("height", D.layout[view].canvasHeight * scale);
    document.getElementById("zoom-value-" + view).textContent = Math.round(scale * 100) + "%";
  }
  function renderTables() {
    var root = document.getElementById("table-groups");
    root.replaceChildren();
    D.groups.forEach(function (group) {
      var groupTables = D.tables.filter(function (t) { return t.group === group.id; });
      var section = el("section", "table-group-section");
      var heading = el("h3");
      var swatch = el("i", "legend-swatch group-swatch-" + group.color);
      heading.append(swatch, document.createTextNode(group.name));
      var grid = el("div", "table-card-grid");
      groupTables.forEach(function (table) { grid.append(renderTableCard(table)); });
      section.append(heading, grid);
      root.append(section);
    });
    document.getElementById("table-search").addEventListener("input", filterTables);
  }
  function relatedLinks(table, outgoing) {
    return D.relationships.filter(function (r) { return outgoing ? r.sourceTable === table.name : r.targetTable === table.name; });
  }
  function renderTableCard(table) {
    var group = groupById[table.group];
    var card = el("article", "table-card");
    card.id = "table-" + table.name;
    card.dataset.search = (table.name + " " + table.description + " " + table.columns.map(function (c) { return c.name + " " + c.type; }).join(" ")).toLowerCase();
    var head = el("div", "table-card-header"); head.classList.add("group-border-" + group.color);
    head.append(el("h4", "", table.name), el("span", "column-count", table.columns.length + " columns"));
    var desc = el("p", "table-description", table.description);
    var tableEl = el("table", "column-list");
    var thead = document.createElement("thead"), tr = document.createElement("tr");
    ["Column", "SQL Server type", "Keys"].forEach(function (label) { tr.append(el("th", "", label)); });
    thead.append(tr);
    var tbody = document.createElement("tbody");
    table.columns.forEach(function (c) {
      var row = document.createElement("tr");
      var name = el("td", "column-name", c.name + (c.identity ? " (IDENTITY)" : ""));
      var type = el("td", "column-type", c.type + (c.null ? " NULL" : " NOT NULL"));
      var flags = el("td", "column-flags");
      if (c.pk) flags.append(el("b", "key-chip pk", "PK"));
      if (c.fk) flags.append(el("b", "key-chip fk", "FK"));
      if (c.uq) flags.append(el("b", "key-chip uq", "UQ"));
      if (c.default) type.append(document.createTextNode(" · DEFAULT " + c.default));
      row.append(name, type, flags); tbody.append(row);
    });
    tableEl.append(thead, tbody);
    var constraintBox = el("div", "table-constraint-list");
    var constraintItems = (table.constraints.unique || []).map(function (u) { return "UNIQUE " + u.columns.join(", "); }).concat((table.constraints.checks || []).map(function (c) { return "CHECK " + c.expression; })).concat((table.constraints.indexes || []).map(function (i) { return (i.unique ? "UNIQUE INDEX " : "INDEX ") + i.name + " (" + i.columns.join(", ") + ")" + (i.filter ? " WHERE " + i.filter : ""); }));
    if (constraintItems.length) { constraintBox.append(el("h5", "", "Table constraints")); constraintItems.forEach(function (item) { constraintBox.append(el("code", "", item)); }); }
    var links = el("div", "table-links");
    links.append(renderRelatedSection("Points to", relatedLinks(table, true), true));
    links.append(renderRelatedSection("Referenced by", relatedLinks(table, false), false));
    if (constraintItems.length) card.append(head, desc, tableEl, constraintBox, links);
    else card.append(head, desc, tableEl, links);
    return card;
  }
  function renderRelatedSection(title, relationships, outgoing) {
    var section = el("section", ""); section.append(el("h5", "", title));
    if (!relationships.length) { section.append(el("span", "column-count", "None")); return section; }
    var ul = document.createElement("ul");
    relationships.forEach(function (r) {
      var targetTable = outgoing ? r.targetTable : r.sourceTable;
      var localCol = outgoing ? r.sourceColumn : r.targetColumn;
      var foreignCol = outgoing ? r.targetColumn : r.sourceColumn;
      var li = document.createElement("li"), a = el("a", "", targetTable);
      a.href = "#table-" + targetTable;
      a.textContent = targetTable + " (" + localCol + " → " + foreignCol + ")";
      li.append(a); ul.append(li);
    });
    section.append(ul); return section;
  }
  function filterTables() {
    var query = document.getElementById("table-search").value.trim().toLowerCase();
    var count = 0;
    document.querySelectorAll(".table-card").forEach(function (card) { var show = card.dataset.search.indexOf(query) !== -1; card.hidden = !show; if (show) count++; });
    document.querySelectorAll(".table-group-section").forEach(function (section) { section.hidden = !section.querySelector(".table-card:not([hidden])"); });
    var existing = document.getElementById("empty-table-results");
    if (!count && !existing) { existing = el("p", "empty-results", "No tables or columns match your search."); existing.id = "empty-table-results"; document.getElementById("table-groups").append(existing); }
    if (count && existing) existing.remove();
  }
  function quoteName(name) { return "[" + name.replace(/]/g, "]]" ) + "]"; }
  var fkNames = {
    "Users|RoleID": "FK_Users_Roles",
    "TherapistApplications|TherapistUserID": "FK_TherapistApplications_Users",
    "TherapistApplicationStatusHistory|ApplicationID": "FK_TherapistApplicationStatusHistory_Applications",
    "TherapistApplicationStatusHistory|ChangedByAdminUserID": "FK_TherapistApplicationStatusHistory_AdminUsers",
    "TherapistCredentials|ApplicationID": "FK_TherapistCredentials_Applications",
    "MoodEntries|UserID": "FK_MoodEntries_Users",
    "JournalEntries|UserID": "FK_JournalEntries_Users",
    "ActivityEntries|UserID": "FK_ActivityEntries_Users",
    "FamilyConnections|FamilyUserID": "FK_FamilyConnections_FamilyUser",
    "FamilyConnections|PersonalUserID": "FK_FamilyConnections_PersonalUser",
    "FamilySharingConsentHistory|ConnectionID": "FK_FamilySharingConsentHistory_Connections",
    "FamilySharingConsentHistory|SharingCategoryID": "FK_FamilySharingConsentHistory_Categories",
    "FamilySharingConsentHistory|ChangedByUserID": "FK_FamilySharingConsentHistory_Users",
    "ConsultationRequests|PersonalUserID": "FK_ConsultationRequests_PersonalUser",
    "ConsultationRequests|TherapistUserID": "FK_ConsultationRequests_TherapistUser",
    "ChatSessions|PersonalUserID": "FK_ChatSessions_Users",
    "ChatMessages|ChatSessionID": "FK_ChatMessages_ChatSessions",
    "SupportGroups|LeaderTherapistID": "FK_SupportGroups_LeaderUser",
    "SupportGroupMemberships|SupportGroupID": "FK_SupportGroupMemberships_Groups",
    "SupportGroupMemberships|PersonalUserID": "FK_SupportGroupMemberships_Users",
    "SupportGroupMessages|SupportGroupID": "FK_SupportGroupMessages_Groups",
    "SupportGroupMessages|MembershipID": "FK_SupportGroupMessages_Memberships",
    "SupportGroupMessages|TherapistLeaderUserID": "FK_SupportGroupMessages_LeaderUsers",
    "TherapistSessions|ConsultationRequestID": "FK_TherapistSessions_ConsultationRequests"
  };
  function generateSql() {
    var ordered = ["ChatSessions", "ChatMessages", "SupportGroups", "SupportGroupMemberships", "SupportGroupMessages", "TherapistSessions"];
    var chunks = ["USE NafasDB;", "GO", "", "-- Historical add-only script generated from the V2 documentation model, not reverse-generated from live SQL Server.", "-- Do not use this script as a current schema export; the project owner reports these six tables are already in NafasDB.", "-- Role/approval checks remain application or controlled-process rules."];
    ordered.forEach(function (tableName) {
      var t = tableByName[tableName];
      var lines = [];
      t.columns.forEach(function (c) {
        var line = "        " + quoteName(c.name) + " " + c.type + (c.identity ? " IDENTITY(1,1)" : "") + (c.null ? " NULL" : " NOT NULL");
        if (c.default) line += " CONSTRAINT " + quoteName("DF_" + t.name + "_" + c.name) + " DEFAULT (" + c.default + ")";
        lines.push(line);
      });
      var constraints = [];
      constraints.push("        CONSTRAINT " + quoteName("PK_" + t.name) + " PRIMARY KEY (" + t.primaryKey.map(quoteName).join(", ") + ")");
      (t.constraints.unique || []).forEach(function (u) { constraints.push("        CONSTRAINT " + quoteName(u.name) + " UNIQUE (" + u.columns.map(quoteName).join(", ") + ")"); });
      D.relationships.filter(function (r) { return r.sourceTable === t.name; }).forEach(function (r) {
        var fkName = fkNames[t.name + "|" + r.sourceColumn];
        constraints.push("        CONSTRAINT " + quoteName(fkName) + " FOREIGN KEY (" + quoteName(r.sourceColumn) + ") REFERENCES dbo." + quoteName(r.targetTable) + "(" + quoteName(r.targetColumn) + ")");
      });
      (t.constraints.checks || []).forEach(function (c) { constraints.push("        CONSTRAINT " + quoteName(c.name) + " CHECK (" + c.expression + ")"); });
      chunks.push("-- " + t.name);
      chunks.push("IF OBJECT_ID(N'dbo." + t.name + "', N'U') IS NULL\nBEGIN\n    CREATE TABLE dbo." + quoteName(t.name) + "\n    (\n" + lines.concat(constraints).join(",\n") + "\n    );\nEND;\nGO");
    });
    ordered.forEach(function (tableName) {
      var t = tableByName[tableName];
      (t.constraints.indexes || []).forEach(function (index) {
        var unique = index.unique ? "UNIQUE " : "";
        var filter = index.filter ? " WHERE " + index.filter : "";
        chunks.push("IF OBJECT_ID(N'dbo." + t.name + "', N'U') IS NOT NULL\n   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo." + t.name + "') AND name = N'" + index.name + "')\nBEGIN\n    CREATE " + unique + "NONCLUSTERED INDEX " + quoteName(index.name) + " ON dbo." + quoteName(t.name) + " (" + index.columns.map(quoteName).join(", ") + ")" + filter + ";\nEND;\nGO");
      });
    });
    chunks.push("-- Role, active-membership, and therapist-approval rules require controlled application/database logic.");
    return chunks.join("\n\n");
  }  function renderRules() {
    var root = document.getElementById("rules-grid");
    D.rules.forEach(function (rule) { var card = el("article", "rule-card"); card.append(el("h3", "", rule.title), el("p", "", rule.text)); root.append(card); });
    var statusBody = document.getElementById("status-map-body");
    D.statusMap.forEach(function (row) { var tr = document.createElement("tr"); row.forEach(function (value) { tr.append(el("td", "", value)); }); statusBody.append(tr); });
    var notes = document.getElementById("verification-notes");
    D.verificationNotes.forEach(function (text) { notes.append(el("li", "", text)); });
  }
  function activateTab(tab) {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
    tabs.forEach(function (item) {
      var selected = item === tab;
      item.setAttribute("aria-selected", selected ? "true" : "false");
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute("aria-controls")).hidden = !selected;
    });
    tab.focus();
    if (tab.id === "tab-er" || tab.id === "tab-schema") {
      var view = tab.id === "tab-er" ? "er" : "schema";
      requestAnimationFrame(function () { if (!zoomState[view].manual) fitDiagram(view); });
    }
  }
  function setupTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { activateTab(tab); });
      tab.addEventListener("keydown", function (event) {
        var next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault(); activateTab(tabs[next]);
      });
    });
  }
  function setupDiagramControls(view) {
    document.getElementById("hide-users-relations-" + view).addEventListener("change", function () { renderDiagram(view); });
    document.getElementById("show-labels-" + view).addEventListener("change", function () { renderDiagram(view); });
    document.querySelectorAll('[data-view="' + view + '"]').forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.dataset.zoom;
        if (action === "fit") { zoomState[view].manual = false; fitDiagram(view); }
        else setZoom(view, zoomState[view].scale + (action === "in" ? .1 : -.1), true);
      });
    });
    var resizeTimer;
    window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { if (!zoomState[view].manual && !document.getElementById("panel-" + view).hidden) fitDiagram(view); }, 120); });
  }
  function setupSql() {
    var output = document.getElementById("sql-output");
    output.textContent = generateSql();
    document.getElementById("copy-sql").addEventListener("click", function () {
      var feedback = document.getElementById("sql-feedback");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(output.textContent).then(function () { feedback.textContent = "Script copied to clipboard."; }).catch(function () { feedback.textContent = "Clipboard access was unavailable. Select and copy the script manually."; });
      } else feedback.textContent = "Clipboard access is unavailable here. Select and copy the script manually.";
    });
    document.getElementById("download-sql").addEventListener("click", function () {
      var blob = new Blob([output.textContent], { type: "text/sql;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a"); link.href = url; link.download = "NafasDB_Phase1_CreateTables.sql";
      document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      document.getElementById("sql-feedback").textContent = "SQL script downloaded.";
    });
  }
  function initialize() {
    setCounts();
    renderDiagram("er"); renderDiagram("schema");
    renderTables(); renderRules(); setupTabs();
    setupDiagramControls("er"); setupDiagramControls("schema"); setupSql();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize); else initialize();
})();









