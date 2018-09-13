// WARNING: THIS CODE IS AUTO-GENERATED. ANY MANUAL EDITS WILL BE OVERWRITTEN WITHOUT WARNING
/* tslint:disable */
import { User, PortCall } from 'DataType'
import { buildQueryWithUniqueResult } from 'postgres-typescript'

interface Arguments extends User {
  
}

interface Result extends PortCall {
  
}

export const data2 = buildQueryWithUniqueResult<Arguments, Result>(__filename)