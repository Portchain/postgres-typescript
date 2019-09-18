const fs = require('fs')
const path = require('path')

const codegenWarning = '// WARNING: THIS CODE IS AUTO-GENERATED BY postgres-typescript. ANY MANUAL EDITS WILL BE OVERWRITTEN WITHOUT WARNING\n';
function packageToImportStatement(package) {
  let importDefault = package.imports.indexOf(undefined) > -1
  let subImports = package.imports.filter(i => !!i)
  let importStatement = 'import '
  if(importDefault) {
    importStatement += package.name
  }

  if(subImports.length > 0) {
    if(importDefault) {
      importStatement += ', '
    }
    importStatement += `{ ${subImports.join(', ')} }`
  }

  importStatement += ` from '${package.path}';`
  return importStatement
}

function buildExtendsStatement(extendTypes) {
  if(extendTypes && extendTypes.length > 0) {
    return `extends ${extendTypes.join(', ')} `
  }
  return ''
}

function getQueryTs(queryName, args, returns, helperFunction, packages) {
  let contents = codegenWarning + queryTsTempate
  contents = contents.replace(new RegExp('@extraImports', 'g'), Object.keys(packages).map(key => packages[key]).map(packageToImportStatement).join('\n'))
  contents = contents.replace(new RegExp('@queryName', 'g'), queryName)
  contents = contents.replace(new RegExp('@argumentFields', 'g'), '  ' + args.fields.map(field => `${field.name}: ${field.type};` ).join('\n  '))
  contents = contents.replace(new RegExp('@resultFields', 'g'), '  ' + returns.fields.map(field => `${field.name}: ${field.type};` ).join('\n  '))
  contents = contents.replace(new RegExp('@helperFunction', 'g'), helperFunction)
  contents = contents.replace(new RegExp('@extendArg ', 'g'), buildExtendsStatement(args.extends))
  contents = contents.replace(new RegExp('@extendResult ', 'g'), buildExtendsStatement(returns.extends))
  return contents
}

const queryTsTempate = fs.readFileSync(path.join(__dirname, 'query.ts.template'), 'utf8');

function getCodegenItems(sql) {
  let codegenItems = [];
  sql.split('\n').forEach(line => {
    const match = line.trim().match(new RegExp('--[\\s]*@([A-Za-z0-9]+)\s*(?:\s*(.*)\s*)?$'));
    if (match) {
      codegenItems.push({
        type: match[1].trim(),
        value: match[2] ? match[2].replace(/;+\s*$/, '').trim() : null
      });
    }
  });
  return codegenItems;
}

function unArray(str) {
  if(str) {
    return str.replace(/\[\]$/, '')
  } else {
    return str
  }
}

function extractImportDetails(str) {
  const match = str.match(/^([\.\/A-Za-z0-9]+)({([A-Za-z0-9\s]+(\[\])?)})?;?$/);
  if (match) {
    const packageName = path.basename(match[1])
    return {
      source: str,
      path: match[1],
      name: packageName,
      import: unArray(match[3]),
      datatype: match[3] || packageName
    }
  } else {
    return null
  }
}

function isBasicType(str) {
  return /^(boolean|number|string|any)(\[\])?(\s*\|\s*null)?$/.test(str) 
    || /^(\'.*\')*(\s*\|\s*\'[A-Za-z0-9]*\'\s*)?(\s*\|\s*null)?$/.test(str) 
}

function isInlineObjectTypeDefinition(str) {
  if(str) {
    return /^{.*}(\[\])?$/.test(str)
  }
  return false
}

function addPackage(existingPackages, packageInfo) {
  if(!existingPackages[packageInfo.name]) {
    existingPackages[packageInfo.name] = {
      path: packageInfo.path,
      name: packageInfo.name,
      imports: [],
      sources: []
    }
  }
  if(existingPackages[packageInfo.name].imports.indexOf(packageInfo.import) === -1) {
    existingPackages[packageInfo.name].imports.push(packageInfo.import)
  }
  existingPackages[packageInfo.name].sources.push(packageInfo.source)
}

function extractDataTypes(dataTypeAnnotations, commonPackages, sqlFilePath) {
  const data = {
    fields: [],
    extends: []
  }
  for(let i = 0 ; i < dataTypeAnnotations.length ; i++) {
    const annotation = dataTypeAnnotations[i]
    const fieldNameAndTypeMatch =  annotation.match(/^([A-Za-z0-9]+)\s*:(.+)$/)
    if(fieldNameAndTypeMatch && fieldNameAndTypeMatch[1] && fieldNameAndTypeMatch[2]) {
      const fieldName = fieldNameAndTypeMatch[1].trim()
      const fieldType = fieldNameAndTypeMatch[2].trim()
      if(isBasicType(fieldType) || isInlineObjectTypeDefinition(fieldType)) {
        data.fields.push({name: fieldName, type: fieldType})
      } else {
        const importInfo = extractImportDetails(fieldType)
        if(importInfo) {
          addPackage(commonPackages, importInfo)
          data.fields.push({name: fieldName, type: importInfo.datatype})
        } else {
          throw new Error(`Failed to parse @return [${annotation}] in SQL file [${sqlFilePath}]`)
        }
      }
    } else {
      const importInfo = extractImportDetails(annotation)
      if(importInfo) {
        addPackage(commonPackages, importInfo)
        data.extends.push(importInfo.datatype)
      } else {
        throw new Error(`Failed to parse @return [${annotation}] in SQL file [${sqlFilePath}]`)
      }
    }
  }
  return data
}


function generateTypeScriptFromSQL(sql, sqlFilePath) {
  
  const items = getCodegenItems(sql)
  if (items.length == 0) {
    return
  }
  const commonPackages = {}
  const argumentAnnotations = items.filter(item => item['type'] == 'arg').map(item => item['value'])
  const args = extractDataTypes(argumentAnnotations, commonPackages, sqlFilePath)
  const returnsAnnotations = items.filter(item => item['type'] == 'return').map(item => item['value'])
  const returns = extractDataTypes(returnsAnnotations, commonPackages, sqlFilePath)
  const helperFunction = items.filter(item => item['type'] == 'unique').length > 0 ? 'buildQueryWithUniqueResult' : 'buildQuery'
  const queryName = path.basename(sqlFilePath, '.query.sql')
  const fileContent = getQueryTs(queryName, args, returns, helperFunction, commonPackages)
  return fileContent
}

module.exports = {
  getQueryTs,
  getCodegenItems,
  extractImportDetails,
  isBasicType,
  addPackage,
  extractDataTypes,
  generateTypeScriptFromSQL,
  codegenWarning
}