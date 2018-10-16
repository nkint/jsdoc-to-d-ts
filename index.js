const fs = require('fs')
const path = require('path')
const doctrine = require('doctrine')
const extract = require('extract-comments')
const espree = require('espree')

const namedir = process.argv[2] // './gl-vec3'
const outdir = process.argv[3] // '/tmp'

const splittedNamedir = namedir.split('/')
const moduleName = splittedNamedir[splittedNamedir.length - 1]

const files = fs
  .readdirSync(path.join('.', namedir))
  .filter(name => {
    const extension = path.extname(name)
    return extension === '.js'
  })
  .filter(name => name !== 'index.js')

function toSignature(file, originalRedirect = null) {
  // console.log({ file, originalRedirect })

  const filename = path.join('.', namedir, file)
  const filecontent = fs.readFileSync(filename, 'utf-8')
  const astCode = espree.parse(filecontent)

  // check if contains only a require and redirect to a different file
  const isAssignment =
    astCode.body[0].expression && astCode.body[0].expression.right.type === 'CallExpression'
  if (isAssignment && astCode.body[0].expression.right.callee.name === 'require') {
    const arg = astCode.body[0].expression.right.arguments[0].value
    const redirectFile = `${path.basename(arg)}.js`

    if (redirectFile === file) {
      console.error(`some problem in redirect file in ${file}`)
      return `__PROBLEM:REDIRECT:${file}__`
    }

    return toSignature(redirectFile, file)
  }

  const commentObject = extract(filecontent)[0]
  if (commentObject) {
    try {
      const comment = extract(filecontent)[0].value
      // seems that doctrine can not handle params like [arg] so remove `[]`
      const commentNoBrackets = comment.replace(/((\[\s*)|(\s*\]))/g, '')
      const functionname = path.basename(originalRedirect || file, '.js')
      const astComment = doctrine.parse([commentNoBrackets].join('\n'))
      const params = astComment.tags.filter(param => param.title === 'param')
      const returns = astComment.tags.filter(param => param.title === 'returns')[0]
      const signature = `export function ${functionname}(${params
        .map(p => `${p.name}: ${p.type.name}`)
        .join(', ')}): ${returns.type.name}`
      const ret = `\n/* ${comment} \n*/\n${signature}\n`
      return ret
    } catch (e) {
      console.error(`problem creating a signature with ${file}`, e)
      return `__PROBLEM:SIGNATURE:${file}__`
    }
  } else {
    console.error(`comment not found in ${file}`)
    return `__PROBLEM:COMMENT:${file}__`
  }
}

let moduleString = `declare module '${moduleName}' {` + '\n\n'
files
  // .slice(16, 17)
  .forEach(filename => {
    const signature = toSignature(filename)
    moduleString += signature
  })
moduleString += '\n}\n\n'

const outfile = path.join(outdir, `${moduleName}.d.ts`)
fs.writeFileSync(outfile, moduleString)
