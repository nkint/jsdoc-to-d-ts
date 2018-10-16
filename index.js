const fs = require('fs')
const path = require('path')
const doctrine = require('doctrine')
const extract = require('extract-comments')

const namedir = 'gl-vec3'
const files = fs.readdirSync(path.join('.', namedir)).filter(name => {
  const extension = path.extname(name)
  return extension === '.js'
})

function toSignature(file) {
  const filename = path.join('.', namedir, file)
  const filecontent = fs.readFileSync(filename, 'utf-8')
  const commentObject = extract(filecontent)[0]
  if (commentObject) {
    try {
      const comment = extract(filecontent)[0].value
      const functionname = filename.split('/')[1].split('.')[0]
      const ast = doctrine.parse([comment].join('\n'))
      const params = ast.tags.filter(param => param.title === 'param')
      const returns = ast.tags.filter(param => param.title === 'returns')[0]
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
