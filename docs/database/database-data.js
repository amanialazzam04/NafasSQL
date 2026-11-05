(function (global) {
  "use strict";

  function col(name, type, options) {
    return Object.assign({ name: name, type: type, pk: false, fk: false, uq: false, null: false, identity: false }, options || {});
  }
  function table(name, group, description, columns, primaryKey, constraints) {
    return { name: name, group: group, description: description, columns: columns, primaryKey: primaryKey, constraints: constraints || {} };
  }

  var groups = [
    { id: "identity", name: "Identity & access", color: "teal" },
    { id: "therapist", name: "Therapist review", color: "blue" },
    { id: "wellness", name: "Personal wellness", color: "rose" },
    { id: "connections", name: "Connections & requests", color: "gold" },
    { id: "chat", name: "AI conversations", color: "blue" },
    { id: "support", name: "Support groups", color: "violet" },
    { id: "sessions", name: "Therapist sessions", color: "teal" }
  ];

  var tables = [
    table("Roles", "identity", "The four supported platform roles.", [
      col("RoleID", "int", { pk: true, identity: true }),
      col("RoleName", "nvarchar(30)", { uq: true })
    ], ["RoleID"], {
      unique: [{ name: "UQ_Roles_RoleName", columns: ["RoleName"] }],
      checks: [{ name: "CK_Roles_RoleName", expression: "RoleName IN (N'Personal User', N'Family Member', N'Therapist', N'Admin')" }]
    }),
    table("Users", "identity", "Account identity, role, password hash, and account status.", [
      col("UserID", "int", { pk: true, identity: true }),
      col("RoleID", "int", { fk: true }),
      col("Email", "nvarchar(254)", { uq: true }),
      col("PasswordHash", "nvarchar(255)"),
      col("DisplayName", "nvarchar(100)"),
      col("AccountStatus", "nvarchar(20)", { default: "N'Active'" }),
      col("CreatedAt", "datetime2", { default: "SYSDATETIME()" }),
      col("UpdatedAt", "datetime2", { null: true })
    ], ["UserID"], {
      unique: [{ name: "UQ_Users_Email", columns: ["Email"] }],
      checks: [{ name: "CK_Users_AccountStatus", expression: "AccountStatus IN (N'Active', N'Suspended', N'Closed')" }]
    }),
    table("TherapistApplications", "therapist", "One submitted application version for a therapist.", [
      col("ApplicationID", "int", { pk: true, identity: true }),
      col("TherapistUserID", "int", { fk: true }),
      col("ApplicationNumber", "int"),
      col("ProfessionalTitle", "nvarchar(100)"),
      col("Specialization", "nvarchar(120)"),
      col("ExperienceSummary", "nvarchar(1500)", { null: true }),
      col("SubmittedAt", "datetime2", { default: "SYSDATETIME()" })
    ], ["ApplicationID"], {
      unique: [{ name: "UQ_TherapistApplications_User_ApplicationNumber", columns: ["TherapistUserID", "ApplicationNumber"] }],
      checks: [{ name: "CK_TherapistApplications_ApplicationNumber", expression: "ApplicationNumber > 0" }]
    }),
    table("TherapistApplicationStatusHistory", "therapist", "Append-only status events for each therapist application.", [
      col("ApplicationStatusHistoryID", "int", { pk: true, identity: true }),
      col("ApplicationID", "int", { fk: true }),
      col("ApplicationStatus", "nvarchar(20)"),
      col("ChangedAt", "datetime2", { default: "SYSDATETIME()" }),
      col("ChangedByAdminUserID", "int", { fk: true, null: true }),
      col("ReviewNotes", "nvarchar(1000)", { null: true })
    ], ["ApplicationStatusHistoryID"], {
      checks: [
        { name: "CK_TherapistApplicationStatusHistory_Status", expression: "ApplicationStatus IN (N'Pending', N'Approved', N'Rejected')" },
        { name: "CK_TherapistApplicationStatusHistory_Reviewer", expression: "(ApplicationStatus = N'Pending' AND ChangedByAdminUserID IS NULL) OR (ApplicationStatus IN (N'Approved', N'Rejected') AND ChangedByAdminUserID IS NOT NULL)" }
      ]
    }),
    table("TherapistCredentials", "therapist", "Qualifications and certificate metadata tied to an application; files are stored externally.", [
      col("CredentialID", "int", { pk: true, identity: true }),
      col("ApplicationID", "int", { fk: true }),
      col("CredentialType", "nvarchar(30)"),
      col("CredentialName", "nvarchar(200)"),
      col("IssuingOrganization", "nvarchar(200)", { null: true }),
      col("CredentialReference", "nvarchar(100)", { null: true }),
      col("IssueDate", "date", { null: true }),
      col("FileReference", "nvarchar(500)", { null: true }),
      col("FileName", "nvarchar(255)", { null: true }),
      col("ContentType", "nvarchar(100)", { null: true }),
      col("FileSizeBytes", "bigint", { null: true }),
      col("UploadedAt", "datetime2", { default: "SYSDATETIME()" })
    ], ["CredentialID"], {
      checks: [
        { name: "CK_TherapistCredentials_CredentialType", expression: "CredentialType IN (N'Qualification', N'Certificate')" },
        { name: "CK_TherapistCredentials_FileSize", expression: "FileSizeBytes IS NULL OR FileSizeBytes >= 0" }
      ]
    }),
    table("MoodEntries", "wellness", "Private mood check-ins owned by a user.", [
      col("MoodEntryID", "int", { pk: true, identity: true }),
      col("UserID", "int", { fk: true }),
      col("MoodValue", "nvarchar(10)"),
      col("Reflection", "nvarchar(1000)", { null: true }),
      col("RecordedAt", "datetime2", { default: "SYSDATETIME()" })
    ], ["MoodEntryID"], {
      checks: [{ name: "CK_MoodEntries_MoodValue", expression: "MoodValue IN (N'Great', N'Good', N'Okay', N'Low', N'Anxious')" }]
    }),
    table("JournalEntries", "wellness", "Private journal entries; family members must never access them.", [
      col("JournalEntryID", "int", { pk: true, identity: true }),
      col("UserID", "int", { fk: true }),
      col("EntryDate", "date"),
      col("Title", "nvarchar(150)", { null: true }),
      col("EntryText", "nvarchar(max)"),
      col("CreatedAt", "datetime2", { default: "SYSDATETIME()" }),
      col("UpdatedAt", "datetime2", { null: true })
    ], ["JournalEntryID"], {}) ,
    table("ActivityEntries", "wellness", "User-owned activities used to calculate a rolling seven-day Activity Summary.", [
      col("ActivityEntryID", "int", { pk: true, identity: true }),
      col("UserID", "int", { fk: true }),
      col("ActivityName", "nvarchar(150)"),
      col("ActivityDate", "date"),
      col("IsCompleted", "bit", { default: "0" }),
      col("CompletedAt", "datetime2", { null: true }),
      col("RecordedAt", "datetime2", { default: "SYSDATETIME()" })
    ], ["ActivityEntryID"], {}),
    table("FamilyConnections", "connections", "A Family Member's request or connection to a Personal User.", [
      col("ConnectionID", "int", { pk: true, identity: true }),
      col("FamilyUserID", "int", { fk: true }),
      col("PersonalUserID", "int", { fk: true }),
      col("ConnectionStatus", "nvarchar(20)"),
      col("RequestedAt", "datetime2", { default: "SYSDATETIME()" }),
      col("RespondedAt", "datetime2", { null: true })
    ], ["ConnectionID"], {
      checks: [
        { name: "CK_FamilyConnections_Status", expression: "ConnectionStatus IN (N'Pending', N'Accepted', N'Rejected', N'Cancelled', N'Revoked')" },
        { name: "CK_FamilyConnections_NotSelf", expression: "FamilyUserID <> PersonalUserID" }
      ]
    }),
    table("SharingCategories", "connections", "The only family-shareable categories: Mood Summary and Activity Summary.", [
      col("SharingCategoryID", "int", { pk: true, identity: true }),
      col("CategoryName", "nvarchar(40)", { uq: true })
    ], ["SharingCategoryID"], {
      unique: [{ name: "UQ_SharingCategories_CategoryName", columns: ["CategoryName"] }],
      checks: [{ name: "CK_SharingCategories_CategoryName", expression: "CategoryName IN (N'Mood Summary', N'Activity Summary')" }]
    }),
    table("FamilySharingConsentHistory", "connections", "Append-only consent events; current consent is the latest event per connection and category.", [
      col("ConsentEventID", "int", { pk: true, identity: true }),
      col("ConnectionID", "int", { fk: true }),
      col("SharingCategoryID", "int", { fk: true }),
      col("ConsentAction", "nvarchar(10)"),
      col("ChangedAt", "datetime2", { default: "SYSDATETIME()" }),
      col("ChangedByUserID", "int", { fk: true })
    ], ["ConsentEventID"], {
      checks: [{ name: "CK_FamilySharingConsentHistory_Action", expression: "ConsentAction IN (N'Enabled', N'Revoked')" }]
    }),
    table("ConsultationRequests", "connections", "A request for therapist follow-up, not a confirmed appointment.", [
      col("ConsultationRequestID", "int", { pk: true, identity: true }),
      col("PersonalUserID", "int", { fk: true }),
      col("TherapistUserID", "int", { fk: true }),
      col("Topic", "nvarchar(120)", { null: true }),
      col("Message", "nvarchar(1000)", { null: true }),
      col("PreferredDateTime", "datetime2", { null: true }),
      col("RequestStatus", "nvarchar(20)", { default: "N'Pending'" }),
      col("CreatedAt", "datetime2", { default: "SYSDATETIME()" }),
      col("UpdatedAt", "datetime2", { null: true })
    ], ["ConsultationRequestID"], {
      checks: [
        { name: "CK_ConsultationRequests_Status", expression: "RequestStatus IN (N'Pending', N'Accepted', N'Declined', N'Withdrawn')" },
        { name: "CK_ConsultationRequests_NotSelf", expression: "PersonalUserID <> TherapistUserID" }
      ]
    }),
    table("ChatSessions", "chat", "Private AI conversation sessions owned by one Personal User.", [
      col("ChatSessionID", "int", { pk: true, identity: true }),
      col("PersonalUserID", "int", { fk: true }),
      col("CreatedAt", "datetime2", { default: "SYSDATETIME()" }),
      col("EndedAt", "datetime2", { null: true })
    ], ["ChatSessionID"], {
      checks: [{ name: "CK_ChatSessions_EndAfterCreation", expression: "EndedAt IS NULL OR EndedAt >= CreatedAt" }],
      indexes: [{ name: "IX_ChatSessions_PersonalUser_CreatedAt", columns: ["PersonalUserID", "CreatedAt"] }]
    }),
    table("ChatMessages", "chat", "User and AI messages in a private chat session.", [
      col("ChatMessageID", "int", { pk: true, identity: true }),
      col("ChatSessionID", "int", { fk: true }),
      col("SenderType", "nvarchar(10)"),
      col("MessageContent", "nvarchar(max)"),
      col("SentAt", "datetime2", { default: "SYSDATETIME()" })
    ], ["ChatMessageID"], {
      checks: [{ name: "CK_ChatMessages_SenderType", expression: "SenderType IN (N'User', N'AI')" }],
      indexes: [{ name: "IX_ChatMessages_Session_SentAt", columns: ["ChatSessionID", "SentAt"] }]
    }),
    table("SupportGroups", "support", "A support group with one assigned, approved Therapist Leader.", [
      col("SupportGroupID", "int", { pk: true, identity: true }),
      col("GroupName", "nvarchar(120)"),
      col("Description", "nvarchar(1000)", { null: true }),
      col("LeaderTherapistID", "int", { fk: true }),
      col("GroupStatus", "nvarchar(10)", { default: "N'Active'" }),
      col("CreatedAt", "datetime2", { default: "SYSDATETIME()" })
    ], ["SupportGroupID"], {
      checks: [{ name: "CK_SupportGroups_Status", expression: "GroupStatus IN (N'Active', N'Closed')" }],
      indexes: [
        { name: "IX_SupportGroups_Status", columns: ["GroupStatus"] },
        { name: "IX_SupportGroups_Leader", columns: ["LeaderTherapistID"] }
      ]
    }),
    table("SupportGroupMemberships", "support", "One membership period for a Personal User in a support group; rejoining creates a new period.", [
      col("MembershipID", "int", { pk: true, identity: true }),
      col("SupportGroupID", "int", { fk: true }),
      col("PersonalUserID", "int", { fk: true }),
      col("MembershipStartAt", "datetime2", { default: "SYSDATETIME()" }),
      col("MembershipEndAt", "datetime2", { null: true })
    ], ["MembershipID"], {
      checks: [{ name: "CK_SupportGroupMemberships_EndAfterStart", expression: "MembershipEndAt IS NULL OR MembershipEndAt > MembershipStartAt" }],
      indexes: [
        { name: "UX_SupportGroupMemberships_Active_Group_User", columns: ["SupportGroupID", "PersonalUserID"], unique: true, filter: "MembershipEndAt IS NULL" },
        { name: "IX_SupportGroupMemberships_Group_User_Period", columns: ["SupportGroupID", "PersonalUserID", "MembershipStartAt", "MembershipEndAt"] }
      ]
    }),
    table("SupportGroupMessages", "support", "Messages sent by a group member during a membership period or by that group's Therapist Leader.", [
      col("SupportGroupMessageID", "int", { pk: true, identity: true }),
      col("SupportGroupID", "int", { fk: true }),
      col("MembershipID", "int", { fk: true, null: true }),
      col("TherapistLeaderUserID", "int", { fk: true, null: true }),
      col("MessageContent", "nvarchar(max)"),
      col("SentAt", "datetime2", { default: "SYSDATETIME()" })
    ], ["SupportGroupMessageID"], {
      checks: [{ name: "CK_SupportGroupMessages_OneSender", expression: "(MembershipID IS NOT NULL AND TherapistLeaderUserID IS NULL) OR (MembershipID IS NULL AND TherapistLeaderUserID IS NOT NULL)" }],
      indexes: [
        { name: "IX_SupportGroupMessages_Group_SentAt", columns: ["SupportGroupID", "SentAt"] },
        { name: "IX_SupportGroupMessages_Membership_SentAt", columns: ["MembershipID", "SentAt"] },
        { name: "IX_SupportGroupMessages_Leader_SentAt", columns: ["TherapistLeaderUserID", "SentAt"] }
      ]
    }),
    table("TherapistSessions", "sessions", "A scheduled or completed therapist appointment linked to an accepted consultation request.", [
      col("TherapistSessionID", "int", { pk: true, identity: true }),
      col("ConsultationRequestID", "int", { fk: true }),
      col("SessionStartAt", "datetimeoffset(0)"),
      col("SessionEndAt", "datetimeoffset(0)"),
      col("SessionStatus", "nvarchar(20)", { default: "N'Scheduled'" }),
      col("CreatedAt", "datetime2", { default: "SYSDATETIME()" }),
      col("UpdatedAt", "datetime2", { null: true })
    ], ["TherapistSessionID"], {
      checks: [
        { name: "CK_TherapistSessions_EndAfterStart", expression: "SessionEndAt > SessionStartAt" },
        { name: "CK_TherapistSessions_Status", expression: "SessionStatus IN (N'Scheduled', N'Completed', N'Cancelled')" }
      ],
      indexes: [
        { name: "IX_TherapistSessions_Request_Start", columns: ["ConsultationRequestID", "SessionStartAt"] },
        { name: "IX_TherapistSessions_Start_Status", columns: ["SessionStartAt", "SessionStatus"] }
      ]
    })
  ];

  var relationships = [
    { sourceTable: "Users", sourceColumn: "RoleID", targetTable: "Roles", targetColumn: "RoleID", sourceCardinality: "many", targetCardinality: "one", label: "has role" },
    { sourceTable: "TherapistApplications", sourceColumn: "TherapistUserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "submitted by" },
    { sourceTable: "TherapistApplicationStatusHistory", sourceColumn: "ApplicationID", targetTable: "TherapistApplications", targetColumn: "ApplicationID", sourceCardinality: "many", targetCardinality: "one", label: "records status for" },
    { sourceTable: "TherapistApplicationStatusHistory", sourceColumn: "ChangedByAdminUserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "zero or one", label: "reviewed by (optional)" },
    { sourceTable: "TherapistCredentials", sourceColumn: "ApplicationID", targetTable: "TherapistApplications", targetColumn: "ApplicationID", sourceCardinality: "many", targetCardinality: "one", label: "submitted with" },
    { sourceTable: "MoodEntries", sourceColumn: "UserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "owned by" },
    { sourceTable: "JournalEntries", sourceColumn: "UserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "owned by (private)" },
    { sourceTable: "ActivityEntries", sourceColumn: "UserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "owned by" },
    { sourceTable: "FamilyConnections", sourceColumn: "FamilyUserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "requested by family member" },
    { sourceTable: "FamilyConnections", sourceColumn: "PersonalUserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "requested for personal user" },
    { sourceTable: "FamilySharingConsentHistory", sourceColumn: "ConnectionID", targetTable: "FamilyConnections", targetColumn: "ConnectionID", sourceCardinality: "many", targetCardinality: "one", label: "consent for connection" },
    { sourceTable: "FamilySharingConsentHistory", sourceColumn: "SharingCategoryID", targetTable: "SharingCategories", targetColumn: "SharingCategoryID", sourceCardinality: "many", targetCardinality: "one", label: "consent for category" },
    { sourceTable: "FamilySharingConsentHistory", sourceColumn: "ChangedByUserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "changed by personal user" },
    { sourceTable: "ConsultationRequests", sourceColumn: "PersonalUserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "requested by" },
    { sourceTable: "ConsultationRequests", sourceColumn: "TherapistUserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "requested with therapist" },
    { sourceTable: "ChatSessions", sourceColumn: "PersonalUserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "owned by Personal User" },
    { sourceTable: "ChatMessages", sourceColumn: "ChatSessionID", targetTable: "ChatSessions", targetColumn: "ChatSessionID", sourceCardinality: "many", targetCardinality: "one", label: "contains messages" },
    { sourceTable: "SupportGroups", sourceColumn: "LeaderTherapistID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "led by Therapist" },
    { sourceTable: "SupportGroupMemberships", sourceColumn: "SupportGroupID", targetTable: "SupportGroups", targetColumn: "SupportGroupID", sourceCardinality: "many", targetCardinality: "one", label: "membership in group" },
    { sourceTable: "SupportGroupMemberships", sourceColumn: "PersonalUserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "one", label: "Personal User member" },
    { sourceTable: "SupportGroupMessages", sourceColumn: "SupportGroupID", targetTable: "SupportGroups", targetColumn: "SupportGroupID", sourceCardinality: "many", targetCardinality: "one", label: "posted in group" },
    { sourceTable: "SupportGroupMessages", sourceColumn: "MembershipID", targetTable: "SupportGroupMemberships", targetColumn: "MembershipID", sourceCardinality: "many", targetCardinality: "zero or one", label: "sent by member (optional)" },
    { sourceTable: "SupportGroupMessages", sourceColumn: "TherapistLeaderUserID", targetTable: "Users", targetColumn: "UserID", sourceCardinality: "many", targetCardinality: "zero or one", label: "sent by Therapist Leader (optional)" },
    { sourceTable: "TherapistSessions", sourceColumn: "ConsultationRequestID", targetTable: "ConsultationRequests", targetColumn: "ConsultationRequestID", sourceCardinality: "many", targetCardinality: "one", label: "scheduled from request" },
  ];

  var layout = {
    er: {
      canvasWidth: 1760, canvasHeight: 1820,
      positions: {
        Roles: [50, 50], Users: [470, 50], TherapistApplications: [890, 50], TherapistApplicationStatusHistory: [1310, 50],
        MoodEntries: [50, 390], JournalEntries: [470, 390], ActivityEntries: [890, 390], TherapistCredentials: [1310, 390],
        FamilyConnections: [50, 760], SharingCategories: [470, 760], FamilySharingConsentHistory: [890, 760], ConsultationRequests: [1310, 760],
        ChatSessions: [50, 1120], ChatMessages: [470, 1120], SupportGroups: [890, 1120], SupportGroupMemberships: [1310, 1120],
        SupportGroupMessages: [50, 1470], TherapistSessions: [470, 1470]
      }
    },
    schema: {
      canvasWidth: 1760, canvasHeight: 2280,
      positions: {
        Roles: [50, 50], Users: [470, 50], TherapistApplications: [890, 50], TherapistApplicationStatusHistory: [1310, 50],
        MoodEntries: [50, 460], JournalEntries: [470, 460], ActivityEntries: [890, 460], TherapistCredentials: [1310, 460],
        FamilyConnections: [50, 970], SharingCategories: [470, 970], FamilySharingConsentHistory: [890, 970], ConsultationRequests: [1310, 970],
        ChatSessions: [50, 1440], ChatMessages: [470, 1440], SupportGroups: [890, 1440], SupportGroupMemberships: [1310, 1440],
        SupportGroupMessages: [50, 1840], TherapistSessions: [470, 1840]
      }
    }
  };

  var rules = [
    { title: "Roles and registration", text: "Each account has one of four roles: Personal User, Family Member, Therapist, or Admin. Admin accounts are not created through public self-registration. Account status is Active, Suspended, or Closed; closing an account does not automatically delete its records." },
    { title: "Therapist approval", text: "A therapist must have the Therapist role, an Active account, and an Approved status on the latest application to access the Therapist Portal. A rejected therapist can submit a new application; prior applications remain." },
    { title: "Application history", text: "Every application begins with a Pending status event. Review decisions are appended to status history. The latest application is determined by application number; its current status is the event with the highest status-history ID." },
    { title: "Credentials", text: "Credential files are stored outside SQL Server. The database stores metadata and a secure file reference. Do not expose file references in public documentation or UI." },
    { title: "Journal privacy", text: "Journal entries are private to their owner. Family members must never access journal entries. Family consent does not grant journal access." },
    { title: "Family connections", text: "Connection states are Pending, Accepted, Rejected, Cancelled, or Revoked. Users cannot connect to themselves. Duplicate active connections are prevented through controlled application/database logic." },
    { title: "Consent and sharing", text: "Only Mood Summary and Activity Summary can be shared, and only after explicit consent. The latest consent event per connection/category determines current permission. Revoked connections share no data. Summaries are calculated on demand; no persistent summary copy is kept." },
    { title: "Activity Summary period", text: "Activity Summary covers completed activities whose completion timestamp falls within the rolling seven days ending now (from the current time minus seven days through the current time)." },
    { title: "Consultation requests", text: "A request is not a confirmed booking or session. It may target only an Active Therapist whose latest application is Approved. Role and approval checks are performed by the application or a controlled database process." },
    { title: "AI conversations", text: "Each ChatSession belongs to one Personal User and contains User/AI messages. Only its owner may access it. Family sharing never grants access to private AI conversations." },
    { title: "Support group membership", text: "Support groups are for Personal Users and each group has one approved Therapist Leader. Each membership row represents one join period. Leaving prevents sending new messages; users can read only messages whose timestamps fall within one of their membership periods. Rejoining creates a new row." },
    { title: "Support group messages", text: "Messages are sent by an active member or the group Therapist Leader. The Leader can view group conversations and permanently delete inappropriate messages. Member access is limited by membership periods; family members and Admins are not regular participants." },
    { title: "Therapist sessions", text: "TherapistSessions stores actual scheduled appointments separately from ConsultationRequests. A request remains a request until a scheduled session row is created. Each session links to its request; therapist and Personal User are obtained through that request." }
  ];

  var statusMap = [
    ["AccountStatus", "Active", "Account may use features allowed for its role."],
    ["AccountStatus", "Suspended", "Account access is suspended."],
    ["AccountStatus", "Closed", "Account is closed; data is not automatically deleted."],
    ["ApplicationStatus", "Pending", "Application awaits Admin review; therapist portal access is blocked."],
    ["ApplicationStatus", "Approved", "Latest application is approved; portal access still requires Therapist role and Active account."],
    ["ApplicationStatus", "Rejected", "Application was rejected; account status is unchanged and portal access is blocked unless a later application is approved."],
    ["ConnectionStatus", "Pending", "Request awaits the Personal User's response."],
    ["ConnectionStatus", "Accepted", "Connection exists; each category still requires current enabled consent."],
    ["ConnectionStatus", "Rejected", "Connection request was declined."],
    ["ConnectionStatus", "Cancelled", "Connection request was cancelled."],
    ["ConnectionStatus", "Revoked", "Connection ended; no family sharing is allowed."],
    ["ConsentAction", "Enabled", "This category is currently permitted only if it is the latest event and connection is Accepted."],
    ["ConsentAction", "Revoked", "This category is not permitted if this is the latest event."],
    ["RequestStatus", "Pending", "Consultation request is awaiting therapist response."],
    ["RequestStatus", "Accepted", "Therapist accepted the request for follow-up; no appointment is confirmed."],
    ["RequestStatus", "Declined", "Therapist declined the request."],
    ["RequestStatus", "Withdrawn", "Personal User withdrew the request."],
    ["GroupStatus", "Active", "Group is open for membership and message actions allowed by role and membership rules."],
    ["GroupStatus", "Closed", "Group is closed; controlled logic should block new memberships and messages."],
    ["Membership period", "Active", "MembershipEndAt is NULL; the Personal User may read permitted group messages and send messages."],
    ["Membership period", "Ended", "MembershipEndAt is set; the user may read only messages timestamped within that membership period and may not send."],
    ["SessionStatus", "Scheduled", "An actual session has a scheduled start and end time."],
    ["SessionStatus", "Completed", "The scheduled therapist session has taken place."],
    ["SessionStatus", "Cancelled", "The scheduled session was cancelled."]
  ];

  global.NafasDatabaseData = {
    databaseName: "NafasDB",
    groups: groups,
    tables: tables,
    relationships: relationships,
    layout: layout,
    rules: rules,
    statusMap: statusMap,
    verificationNotes: [
      "The project owner reports an SSMS review of the live NafasDB: 18 tables, 110 columns, Primary Keys and Unique Constraints, Foreign Keys (all inspected FKs enabled and trusted), indexes, and CHECK constraints. The exact catalog export was not supplied; detailed model definitions should be reconciled against it for an auditable object-by-object record.",
      "Role, Active account, and latest Approved therapist checks are cross-table authorization rules. Foreign keys verify account existence, not role or application status.",
      "SupportGroupMessages references a group plus either a membership or a Therapist Leader account. Controlled write logic must verify that the member belongs to that group and is active at send time, or that the therapist is the group's assigned leader.",
      "Membership periods are preserved as separate rows. A filtered unique index prevents more than one current membership for the same user and group; controlled logic must also prevent overlapping historical periods.",
      "Group message visibility is time-bounded by membership start and end. A member can read messages only when SentAt falls within one of their own membership periods; the Leader can read the full group history.",
      "The model-generated V2 SQL is a historical add-only reference, not a reverse-generated export of the reviewed live database. Do not infer live object definitions from that script.",
      "The model documents index names, key columns, and filters where present. It does not specify all index types or clustered-index choices; use the SSMS catalog export for those details."
    ]
  };
})(window);











