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
    const oldContents = fs.readFileSync(filePath, 'utf8');
    if (oldContents == fileContent) return;
  } catch (error) {
    // File doesn't exist. Continue
  }
  fs.writeFileSync(filePath, fileContent);
  console.info(`codegen: wrote ${filePath}`);
}

function processDirectory(absoluteDirPath) {
  fs.readdirSync(absoluteDirPath).forEach(dirItem => {
    dirItemAbs = path.join(absoluteDirPath, dirItem)
    if (!fs.statSync(dirItemAbs).isDirectory()) {
      return
    }
  
    const generatedQueryNames = []
    // Create new ts files
    fs.readdirSync(dirItemAbs).forEach(subdirItem => {
      subdirItemAbs = path.join(dirItemAbs, subdirItem)
      if (fs.statSync(subdirItemAbs).isDirectory() || !subdirItemAbs.endsWith('.query.sql')) {
        return
      }
      const sqlFile = fs.readFileSync(subdirItemAbs, 'utf8')
      const fileContent = generateTypeScriptFromSQL(sqlFile, subdirItemAbs)
      if(!fileContent) {
        return
      }
      const fileName = queryName + '.query.ts'
      const filePath = path.join(dirItemAbs, fileName)
      writeIfChanged(filePath, fileContent)
      generatedQueryNames.push(queryName)
    })
    // Delete old ts files
    fs.readdirSync(dirItemAbs).forEach(subdirItem => {
      subdirItemAbs = path.join(dirItemAbs, subdirItem)
      if (fs.statSync(subdirItemAbs).isDirectory() || !subdirItemAbs.endsWith('.query.ts')) {
        return
      }
      const tsFile = fs.readFileSync(subdirItemAbs, 'utf8')
      const queryName = subdirItem.replace('.query.ts', '')
      if (tsFile.startsWith(codegenWarning) && !generatedQueryNames.includes(queryName)) {
        fs.unlinkSync(subdirItemAbs)
        console.info(`codegen: deleted ${subdirItemAbs}`)
      }
    })
    // Write exports file
    const exportsFileBody =
      generatedQueryNames.length > 0
        ? generatedQueryNames.map(queryName => `export { ${queryName}, Result as ${queryName}Result, Arguments as ${queryName}Args } from './${queryName}.query';`).join('\n') + '\n'
        : ''
    writeIfChanged(path.join(dirItemAbs, 'index.ts'), codegenWarning + exportsFileBody)
  })
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

directories.forEach(processDirectory)
