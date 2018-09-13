const fs = require('fs');
const { Client } = require('pg-parameters');
const { db } = require('./conf');

const moment = require('moment');
const { types } = require('pg');
const _ = require('lodash')

const TIMESTAMPTZ_OID = 1184
const parseFn = (val: any) => {
  return val === null ? null : moment(val)
}
types.setTypeParser(TIMESTAMPTZ_OID, parseFn)

const client = new Client(db)

const camelCaseFields = <T>(sourceObject: any): T => {
  const camelCasedObject: any = {}
  Object.keys(sourceObject).forEach(key => {
    camelCasedObject[_.camelCase(key)] = sourceObject[key]
  })
  return camelCasedObject as T
}

function buildQuery<Args, Result>(queryTsFile: string): ((args: Args) => Promise<Result[]>) {
  const queryFileName = queryTsFile.replace(/\.(ts|js|sql)$/, '.sql')
  const query = fs.readFileSync(queryFileName, { encoding: 'utf8' })
  return async (args: Args): Promise<Result[]> => {
    const response = await client.execute(query, args)
    const results: Result[] = response.rows.map(row => camelCaseFields<Result>(row))
    return results
  }
}

function buildQueryWithUniqueResult<Args, Result>(queryTsFile: string): ((args: Args) => Promise<Result | null>) {
  const queryFunction = buildQuery<Args, Result>(queryTsFile)
  return (args: Args) => {
    return queryFunction(args).then(results => {
      if (results.length > 0) {
        if (results.length > 1) {
          console.error('Query expected a single result but got multiple.', queryTsFile)
        }
        return results[0]
      }
      return null
    })
  }
}

function getClient() {
  return client
}

module.exports = { buildQuery, buildQueryWithUniqueResult, getClient }