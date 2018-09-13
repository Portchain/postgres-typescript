var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fs = require('fs');
const { Client } = require('pg-parameters');
const { db } = require('./conf');
const moment = require('moment');
const { types } = require('pg');
const _ = require('lodash');
const TIMESTAMPTZ_OID = 1184;
const parseFn = (val) => {
    return val === null ? null : moment(val);
};
types.setTypeParser(TIMESTAMPTZ_OID, parseFn);
const client = new Client(db);
const camelCaseFields = (sourceObject) => {
    const camelCasedObject = {};
    Object.keys(sourceObject).forEach(key => {
        camelCasedObject[_.camelCase(key)] = sourceObject[key];
    });
    return camelCasedObject;
};
function buildQuery(queryTsFile) {
    const queryFileName = queryTsFile.replace(/\.(ts|js|sql)$/, '.sql');
    const query = fs.readFileSync(queryFileName, { encoding: 'utf8' });
    return (args) => __awaiter(this, void 0, void 0, function* () {
        const response = yield client.execute(query, args);
        const results = response.rows.map(row => camelCaseFields(row));
        return results;
    });
}
function buildQueryWithUniqueResult(queryTsFile) {
    const queryFunction = buildQuery(queryTsFile);
    return (args) => {
        return queryFunction(args).then(results => {
            if (results.length > 0) {
                if (results.length > 1) {
                    console.error('Query expected a single result but got multiple.', queryTsFile);
                }
                return results[0];
            }
            return null;
        });
    };
}
function getClient() {
    return client;
}
module.exports = { buildQuery, buildQueryWithUniqueResult, getClient };
//# sourceMappingURL=postgres-typescript.js.map