const fs = require('fs')
const path = require('path')
const assert = require('assert')
const {
  extractImportDetails,
  generateTypeScriptFromSQL
} = require('./codegenHelper')

describe('Extract import details', () => {

  it('dependency, default import', () => {
    const importDetails = extractImportDetails('foobar')
    assert.ok(importDetails)
    assert.equal(importDetails.name, 'foobar')
    assert.equal(importDetails.path, 'foobar')
    assert.equal(importDetails.import, null)
    assert.equal(importDetails.datatype, 'foobar')
  });

  it('dependency, subimport', () => {
    const importDetails = extractImportDetails('foo{bar}')
    assert.ok(importDetails)
    assert.equal(importDetails.name, 'foo')
    assert.equal(importDetails.path, 'foo')
    assert.equal(importDetails.import, 'bar')
    assert.equal(importDetails.datatype, 'bar')
  });

  it('subimport array', () => {
    const importDetails = extractImportDetails('foo{bar[]}')
    assert.ok(importDetails)
    assert.equal(importDetails.name, 'foo')
    assert.equal(importDetails.path, 'foo')
    assert.equal(importDetails.import, 'bar')
    assert.equal(importDetails.datatype, 'bar[]')
  });

  it('relative dependency [./], default import', () => {
    const importDetails = extractImportDetails('./foo')
    assert.ok(importDetails)
    assert.equal(importDetails.name, 'foo')
    assert.equal(importDetails.path, './foo')
    assert.equal(importDetails.import, null)
    assert.equal(importDetails.datatype, 'foo')
  });

  it('relative dependency [../], default import', () => {
    const importDetails = extractImportDetails('../foo')
    assert.ok(importDetails)
    assert.equal(importDetails.name, 'foo')
    assert.equal(importDetails.path, '../foo')
    assert.equal(importDetails.import, null)
    assert.equal(importDetails.datatype, 'foo')
  });

  it('relative dependency [../../foo], default import', () => {
    const importDetails = extractImportDetails('../../foo/bar')
    assert.ok(importDetails)
    assert.equal(importDetails.name, 'bar')
    assert.equal(importDetails.path, '../../foo/bar')
    assert.equal(importDetails.import, null)
    assert.equal(importDetails.datatype, 'bar')
  });

  it('relative dependency [../../foo], sub import', () => {
    const importDetails = extractImportDetails('../../foo/bar{User}')
    assert.ok(importDetails)
    assert.equal(importDetails.name, 'bar')
    assert.equal(importDetails.path, '../../foo/bar')
    assert.equal(importDetails.import, 'User')
    assert.equal(importDetails.datatype, 'User')
  });

});


describe('generate TS', () => {



  it('data1', () => {
    let testName = 'data1'
    const sqlFile = fs.readFileSync(path.join(__dirname, 'codegendata.spec', `${testName}.sql`), 'utf8')
    const expectedTSContent = fs.readFileSync(path.join(__dirname, 'codegendata.spec', `${testName}.ts`), 'utf8')

    const actualTSContent = generateTypeScriptFromSQL(sqlFile, testName)

    assert.equal(actualTSContent, expectedTSContent)
  });

  it('data2', () => {
    let testName = 'data2'
    const sqlFile = fs.readFileSync(path.join(__dirname, 'codegendata.spec', `${testName}.sql`), 'utf8')
    const expectedTSContent = fs.readFileSync(path.join(__dirname, 'codegendata.spec', `${testName}.ts`), 'utf8')

    const actualTSContent = generateTypeScriptFromSQL(sqlFile, testName)

    assert.equal(actualTSContent, expectedTSContent)
  });
})