#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

const {
  generateTypeScriptFromSQL,
  codegenWarning
} = require('./codegenHelper')



function writeIfChanged(filePath, fileContent) {
  try {
    const oldContent = fs.readFileSync(filePath, 'utf8');
    if (oldContent == fileContent) return;
  } catch (error) {
    // File doesn't exist. Continue
  }
  fs.writeFileSync(filePath, fileContent);
  console.info(`postgres-typescript: wrote ${filePath}`);
  return true;
}

function processDirectoryQueries(absoluteDirPath) {
  const generatedQueryNames = []
  fs.readdirSync(absoluteDirPath).forEach(file => {
    fileAbsPath = path.join(absoluteDirPath, file)
    if (fs.statSync(fileAbsPath).isDirectory() || !fileAbsPath.endsWith('.query.sql')) {
      return
    }
    const sqlFile = fs.readFileSync(fileAbsPath, 'utf8')
    const filePathWithoutExtension = fileAbsPath.replace(/\.query\.sql$/, '')
    const queryName = path.basename(filePathWithoutExtension)
    const filePath = filePathWithoutExtension + '.query.ts'
    
    const fileContent = generateTypeScriptFromSQL(sqlFile, fileAbsPath)
    if(!fileContent) {
      return
    }
    fs.writeFileSync(filePath, fileContent)
    console.info(`postgres-typescript: wrote ${filePath}`)
    generatedQueryNames.push(queryName)
  })
  // Write exports file
  if(generatedQueryNames.length > 0) {
    const exportsFileBody = generatedQueryNames.map(queryName => `export { ${queryName}, Result as ${queryName}Result, Arguments as ${queryName}Args } from './${queryName}.query';`).join('\n') + '\n'
    writeIfChanged(path.join(absoluteDirPath, 'sqlExports.ts'), codegenWarning + exportsFileBody)
  }
}

function processDirectory(absoluteDirPath) {
  fs.readdirSync(absoluteDirPath).forEach(dirItem => {
    const dirItemAbsPath = path.join(absoluteDirPath, dirItem)
    if (fs.statSync(dirItemAbsPath).isDirectory()) {
      processDirectory(dirItemAbsPath)
    }
  })
  processDirectoryQueries(absoluteDirPath)
}

const directories = []

if(argv && argv._ && argv._.length > 0) {
  argv._.forEach(dirPath => {
    if(path.isAbsolute(dirPath)) {
      directories.push(dirPath)
    } else {
      directories.push(path.join(process.cwd(), dirPath))
    }
  })
} else {
  directories.push(process.cwd())
}

directories.forEach((dir) => {
  console.info('postgres-typescript: processing source code at', dir)
  processDirectory(dir)
})
