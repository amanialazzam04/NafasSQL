# Read-only SQL Server verification in SSMS

These steps inspect the live database catalog. They do not create, alter, or delete database objects. They require no `sqlcmd`.

## Option A — Inspect in Object Explorer

1. Open SQL Server Management Studio (SSMS) and connect to the SQL Server instance that contains Nafas.
2. In **Object Explorer**, expand **Databases** and confirm that `NafasDB` is present.
3. Expand `NafasDB` → **Tables**. Confirm the expected 18 `dbo` tables are listed.
4. Right-click a table and choose **Design** to inspect its columns, data types, nullability, identity properties, and keys. Close the designer without saving.
5. Expand a table's **Keys**, **Constraints**, and **Indexes** folders to inspect its keys, defaults, checks, and indexes. Expand **Foreign Keys** where shown to inspect references.

## Option B — Run read-only catalog queries

In SSMS, select `NafasDB` in the database dropdown, choose **New Query**, paste a query below, and press **Execute**. Each query is a `SELECT` against SQL Server system catalog views. `USE` only selects the database context.

### Tables and columns

```sql
USE NafasDB;
GO

SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    c.column_id AS ColumnOrder,
    c.name AS ColumnName,
    ty.name AS DataType,
    CASE
        WHEN ty.name IN (N'nvarchar', N'nchar') AND c.max_length <> -1 THEN c.max_length / 2
        WHEN ty.name IN (N'varchar', N'char', N'varbinary', N'binary') THEN c.max_length
        ELSE c.max_length
    END AS LengthInCharactersOrBytes,
    c.precision AS NumericPrecision,
    c.scale AS NumericScale,
    c.is_nullable AS IsNullable,
    c.is_identity AS IsIdentity,
    dc.definition AS DefaultDefinition
FROM sys.tables AS t
JOIN sys.schemas AS s ON s.schema_id = t.schema_id
JOIN sys.columns AS c ON c.object_id = t.object_id
JOIN sys.types AS ty ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.default_constraints AS dc
    ON dc.parent_object_id = c.object_id
   AND dc.parent_column_id = c.column_id
WHERE t.is_ms_shipped = 0
ORDER BY s.name, t.name, c.column_id;
```

### Primary keys and unique constraints

```sql
USE NafasDB;
GO

SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    kc.name AS ConstraintName,
    kc.type_desc AS ConstraintType,
    i.type_desc AS IndexType,
    c.name AS ColumnName,
    ic.key_ordinal AS KeyColumnOrder
FROM sys.key_constraints AS kc
JOIN sys.tables AS t ON t.object_id = kc.parent_object_id
JOIN sys.schemas AS s ON s.schema_id = t.schema_id
JOIN sys.indexes AS i
    ON i.object_id = kc.parent_object_id
   AND i.index_id = kc.unique_index_id
JOIN sys.index_columns AS ic
    ON ic.object_id = i.object_id
   AND ic.index_id = i.index_id
JOIN sys.columns AS c
    ON c.object_id = ic.object_id
   AND c.column_id = ic.column_id
WHERE t.is_ms_shipped = 0
  AND ic.key_ordinal > 0
ORDER BY s.name, t.name, kc.name, ic.key_ordinal;
```

### Foreign keys

```sql
USE NafasDB;
GO

SELECT
    fk.name AS ForeignKeyName,
    ps.name AS ParentSchema,
    pt.name AS ParentTable,
    pc.name AS ParentColumn,
    rs.name AS ReferencedSchema,
    rt.name AS ReferencedTable,
    rc.name AS ReferencedColumn,
    fkc.constraint_column_id AS ColumnOrder,
    fk.delete_referential_action_desc AS OnDeleteAction,
    fk.update_referential_action_desc AS OnUpdateAction,
    fk.is_disabled AS IsDisabled,
    fk.is_not_trusted AS IsNotTrusted
FROM sys.foreign_keys AS fk
JOIN sys.foreign_key_columns AS fkc ON fkc.constraint_object_id = fk.object_id
JOIN sys.tables AS pt ON pt.object_id = fk.parent_object_id
JOIN sys.schemas AS ps ON ps.schema_id = pt.schema_id
JOIN sys.columns AS pc
    ON pc.object_id = fkc.parent_object_id
   AND pc.column_id = fkc.parent_column_id
JOIN sys.tables AS rt ON rt.object_id = fk.referenced_object_id
JOIN sys.schemas AS rs ON rs.schema_id = rt.schema_id
JOIN sys.columns AS rc
    ON rc.object_id = fkc.referenced_object_id
   AND rc.column_id = fkc.referenced_column_id
ORDER BY ps.name, pt.name, fk.name, fkc.constraint_column_id;
```

### CHECK constraints

```sql
USE NafasDB;
GO

SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    cc.name AS ConstraintName,
    cc.definition AS CheckDefinition,
    cc.is_disabled AS IsDisabled,
    cc.is_not_trusted AS IsNotTrusted
FROM sys.check_constraints AS cc
JOIN sys.tables AS t ON t.object_id = cc.parent_object_id
JOIN sys.schemas AS s ON s.schema_id = t.schema_id
ORDER BY s.name, t.name, cc.name;
```

### Indexes (including filtered indexes)

```sql
USE NafasDB;
GO

SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_primary_key AS IsPrimaryKeyIndex,
    i.is_unique AS IsUnique,
    i.is_unique_constraint AS IsUniqueConstraintIndex,
    i.has_filter AS HasFilter,
    i.filter_definition AS FilterDefinition,
    i.is_disabled AS IsDisabled,
    c.name AS ColumnName,
    ic.key_ordinal AS KeyColumnOrder,
    ic.is_included_column AS IsIncludedColumn
FROM sys.indexes AS i
JOIN sys.tables AS t ON t.object_id = i.object_id
JOIN sys.schemas AS s ON s.schema_id = t.schema_id
LEFT JOIN sys.index_columns AS ic
    ON ic.object_id = i.object_id
   AND ic.index_id = i.index_id
LEFT JOIN sys.columns AS c
    ON c.object_id = ic.object_id
   AND c.column_id = ic.column_id
WHERE t.is_ms_shipped = 0
  AND i.index_id > 0
ORDER BY s.name, t.name, i.name, ic.key_ordinal, ic.index_column_id;
```

## Save a schema-only script for review (do not execute it)

1. Right-click `NafasDB` in Object Explorer → **Tasks** → **Generate Scripts**.
2. Choose **Select specific database objects** → **Tables**, then select the Nafas tables. Continue with **Next**.
3. Choose **Save to file** (or open in a new query window if you only want to inspect it). In **Advanced**, set **Types of data to script** to **Schema only**.
4. Ensure **Script Indexes**, **Script Primary Keys**, **Script Foreign Keys**, **Script Check Constraints**, **Script Defaults**, and **Script Unique Keys** are set to **True**. Continue through the wizard to generate the script.
5. Review or save the generated text. Do not press **Execute** or run the generated DDL. This exports definitions; it does not prove application-level privacy rules are enforced.

## Compare the output

Compare the catalog results and schema-only script with [`schema-verified.md`](schema-verified.md). The project owner has reported that the SSMS totals and major constraints were reviewed. The exact catalog export was not included with this documentation update; use it to reconcile table/column names, data types, lengths, nullability, identity, PK/UQ/FK/CHECK/DEFAULT definitions, delete/update actions, index key order, filters, and disabled/untrusted flags if a fully auditable object-by-object record is needed. These catalog checks do not verify public registration behavior, role authorization, consent-gated queries, journal/chat privacy, or group-message visibility rules.
