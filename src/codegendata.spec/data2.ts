// WARNING: THIS CODE IS AUTO-GENERATED BY postgres-typescript. ANY MANUAL EDITS WILL BE OVERWRITTEN WITHOUT WARNING
/* tslint:disable */
import { User, PortCall } from 'DataType';
import { buildQueryWithUniqueResult } from 'postgres-typescript';

export interface Arguments extends User {
  
}

export interface Result extends PortCall {
  
}

export const data2 = buildQueryWithUniqueResult<Arguments, Result>(__filename);