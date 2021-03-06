// WARNING: THIS CODE IS AUTO-GENERATED BY postgres-typescript. ANY MANUAL EDITS WILL BE OVERWRITTEN WITHOUT WARNING
/* tslint:disable */
import DataTypeTest1 from '../DataTypeTest1';
import DataTypeTest2, { User, PortCall } from '../../DataTypeTest2';
import { Moment } from 'moment';
import { buildQuery } from 'postgres-typescript';

export interface Arguments {
  name: string;
  def: DataTypeTest1;
  user: User;
  def2: DataTypeTest2;
  ids: number[];
  bool: boolean;
  date: Moment;
}

export interface Result extends DataTypeTest2 {
  user: User;
  portCalls: PortCall[];
}

export const data1 = buildQuery<Arguments, Result>(__filename);