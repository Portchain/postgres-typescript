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
  console.info(`codegen: wrote ${filePath}`);
  return true;
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
      const fileContent = generateTypeScriptFromSQL(sqlFile, subdirItem)
      if(!fileContent) {
        return
      }
      const queryName = subdirItem.replace('.query.sql', '')
      const fileName = queryName + '.query.ts'
      const filePath = path.join(dirItemAbs, fileName)
      generatedQueryNames.push(queryName)
    })
    // Write exports file
    if(generatedQueryNames.length > 0) {
      const exportsFileBody = generatedQueryNames.map(queryName => `export { ${queryName}, Result as ${queryName}Result, Arguments as ${queryName}Args } from './${queryName}.query';`).join('\n') + '\n'
      writeIfChanged(path.join(dirItemAbs, 'sqlExports.ts'), codegenWarning + exportsFileBody)
    }
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
