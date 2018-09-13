const fs = require('fs')
const path = require('path')

const codegenWarning = '// WARNING: THIS CODE IS AUTO-GENERATED. ANY MANUAL EDITS WILL BE OVERWRITTEN WITHOUT WARNING\n';
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

  importStatement += ` from '${package.path}'`
  return importStatement
}

function buildExtendsStatement(extendTypes) {
  if(extendTypes && extendTypes.length > 0) {
    return `extends ${extendTypes.join(', ')}`
  }
  return ''
}

function getQueryTs(queryName, args, results, helperFunction, packages) {
  let contents = codegenWarning + queryTsTempate
  contents = contents.replace(new RegExp('@extraImports', 'g'), Object.keys(packages).map(key => packages[key]).map(packageToImportStatement).join('\n'))
  contents = contents.replace(new RegExp('@queryName', 'g'), queryName)
  contents = contents.replace(new RegExp('@argumentFields', 'g'), '  ' + args.fields.map(field => `${field.name}: ${field.type}` ).join('\n  '))
  contents = contents.replace(new RegExp('@resultFields', 'g'), '  ' + results.fields.map(field => `${field.name}: ${field.type}` ).join('\n  '))
  contents = contents.replace(new RegExp('@helperFunction', 'g'), helperFunction)
  contents = contents.replace(new RegExp('@extendArg', 'g'), buildExtendsStatement(args.extends))
  contents = contents.replace(new RegExp('@extendResult', 'g'), buildExtendsStatement(results.extends))
  return contents
}

const queryTsTempate = fs.readFileSync(path.join(__dirname, 'query.ts.template'), 'utf8');

function getCodegenItems(sql) {
  let codegenItems = [];
  sql.split('\n').forEach(line => {
    const match = line.trim().match(new RegExp('--[\\s]*@([A-Za-z0-9]+)(?: (.*))?$'));
    if (match) {
      codegenItems.push({
        type: match[1],
        value: match[2]
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
  const match = str.match(/^([\.\/A-Za-z0-9]+)({([A-Za-z0-9\s]+(\[\])?)})?$/);
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

const TYPESCRIPT_BASIC_TYPES = [
  'boolean',
  'number',
  'string',
  'any'
]

function isBasicType(str) {
  return /^(boolean|number|string|any)(\[\])?$/.test(str)
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
    if(/:/.test(annotation)) {
      const fieldTypePair = annotation.split(':')
      const fieldName = fieldTypePair[0]
      const fieldType = fieldTypePair[1]
      if(isBasicType(fieldType)) {
        data.fields.push({name: fieldName, type: fieldType})
      } else {
        const importInfo = extractImportDetails(fieldType)
        if(importInfo) {
          addPackage(commonPackages, importInfo)
          data.fields.push({name: fieldName, type: importInfo.datatype})
        } else {
          throw new Error(`Failed to parse @result [${annotation}] in SQL file [${sqlFilePath}]`)
        }
      }
    } else {
      const importInfo = extractImportDetails(annotation)
      if(importInfo) {
        addPackage(commonPackages, importInfo)
        data.extends.push(importInfo.datatype)
      } else {
        throw new Error(`Failed to parse @result [${annotation}] in SQL file [${sqlFilePath}]`)
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
  const resultAnnotations = items.filter(item => item['type'] == 'result').map(item => item['value'])
  const results = extractDataTypes(resultAnnotations, commonPackages, sqlFilePath)
  const helperFunction = items.filter(item => item['type'] == 'unique').length > 0 ? 'buildQueryWithUniqueResult' : 'buildQuery'
  const queryName = sqlFilePath.replace('.query.sql', '')
  
  const fileContent = getQueryTs(queryName, args, results, helperFunction, commonPackages)
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