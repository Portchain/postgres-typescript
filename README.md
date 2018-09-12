# Typescript generator for Postgresql SQL statements

> TLDR: This is somewhat similar to an ORM, but rather bridges typescript with SQL: write SQL statements and use these statements as typescript code.

This plugs into your application, reads SQL statements, database connection env variables and generates typescript files with functions matching SQl statements.

How to use it?

- step 1: create SQL files with annotations about the arguments (names & types) and the data returned (names & types)
- step 2: call `postgres-typescript-codegen <srcDir1> <srcDir2>`
- step 3: use typescript in your application logic

> for better developer experience, create a SQL file watcher that automatically calls `postgres-typescript-codegen`.

For example:

```sql
-- file ./queries/fetchUsers.query.sql
-- @arg company: string
-- @arg isActive: boolean
-- @return id: number
-- @return email: string
-- @return company: string
-- @return isActive: boolean
SELECT id, email, company, is_active
FROM app_users
WHERE company = :company  
  AND is_active = :isActive
```

Will generate the following files

```ts
// file ./queries/index.ts
export { fetchUsers, Result as fetchUsersResult, Arguments as fetchUsersArgs } from './fetchUsers.query'
```

```ts
// file ./queries/fetchUsers.query.ts
import { buildQuery } from 'postgres-typescript'

export interface Arguments {
  company: string
  isActive: boolean
}

export interface Result {
  id: number
  email: string
  company: string
  isActive: boolean
}

export const fetchUsers = buildQuery<Arguments, Result>(__filename)
```

which you can use in your application as follow:

```ts
import {fetchUsers, fetchUsersResult} from './queries'

fetchUsers({
  company: 'Example',
  isActive: true
}).then((users:fetchUsersResult[]) => {
  // users[0].id
  // users[0].email
  // users[0].company
  // users[0].active
  ...
}).catch((err:Error) => {
  ...
})
```

## Annotations

- `arg` describes an input of the SQL query. eg `@arg myInput:string`
- `return` describes an output object or field of the SQL query. eg. `@return id:number`
- `unique` flag the SQL query as returning only one row. When used, this will make the typescript function return a single object and not an array of objects. Usage: `@unique`

Note that when specifying `arg` or `return` data types, you can regroup the returned fields into a datatype you have defined in your typescript application by using directly the default export `@return ./User` or a specific export `@return ./DataTypes{User}`. You can do the same with external dependencies; for example `@return moment{Moment}`

As a practcal example, these 2 files would generate what you'd expect:

```ts
// file ./DataTypes.ts
export interface User {
  id: number
  email: string
  company: string
  isActive: boolean
}
```

```sql
-- file ./queries/fetchUsers.query.sql
-- @arg company: string
-- @arg isActive: boolean
-- @return ../DataTypes{User}
SELECT id, email, company, is_active
FROM app_users
WHERE company = :company  
  AND is_active = :isActive
```
