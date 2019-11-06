import { Client } from 'pg-parameters';
export declare function buildQuery<Args, Result>(queryTsFile: string): ((args: Args) => Promise<Result[]>);
export declare function buildQueryWithUniqueResult<Args, Result>(queryTsFile: string): ((args: Args) => Promise<Result | null>);
export declare function getClient(): Client;
