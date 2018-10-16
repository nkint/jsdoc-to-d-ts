const fs = require('fs')
const path = require('path')
const doctrine = require('doctrine')
const extract = require('extract-comments')
const espree = require('espree')

const namedir = 'gl-vec3'
const files = fs.readdirSync(path.join('.', namedir)).filter(name => {
  const extension = path.extname(name)
  return extension === '.js'
})

function toSignature(file, originalRedirect = null) {
  // console.log(`\ntoSignature -> file: ${file}, originalRedirect: ${originalRedirect}`)
  const filename = path.join('.', namedir, file)
  const filecontent = fs.readFileSync(filename, 'utf-8')

  const astCode = espree.parse(filecontent)

  // check if contains only a require
  const isAssignment = astCode.body[0].expression.right.type === 'CallExpression'
  if (isAssignment && astCode.body[0].expression.right.callee.name === 'require') {
    const arg = astCode.body[0].expression.right.arguments[0].value
    // console.log(`${filename} is a redirect`)
    const redirectFile = `${path.basename(arg)}.js`
    return toSignature(redirectFile, file)
  }

  const commentObject = extract(filecontent)[0]
  if (commentObject) {
    try {
      const comment = extract(filecontent)[0].value
      const functionname = path.basename(originalRedirect || file, '.js')
      const astComment = doctrine.parse([comment].join('\n'))
      const params = astComment.tags.filter(param => param.title === 'param')
      const returns = astComment.tags.filter(param => param.title === 'returns')[0]
      const signature = `export function ${functionname}(${params
        .map(p => `${p.name}: ${p.type.name}`)
        .join(', ')}): ${returns.type.name}`
      const ret = `\n/* ${comment} \n*/\n${signature}\n`
      return ret
    } catch (e) {
      console.error(`problem creating a signature with ${file}`, e)
      return ''
    }
  } else {
    console.error(`comment not found in ${file}`)
    return ''
  }
}

let moduleString = `declare module 'gl-vec3' {` + '\n\n'
files.forEach(filename => {
  const signature = toSignature(filename)
  moduleString += signature
})
moduleString += '\n}'

// console.log(moduleString)
