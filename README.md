# jsdoc-to-d-ts

Highly unstable experiment to generate typescript definition from jsdoc.

⚠️ More an experiment then something real.

## MOTIVATION

Typescript helps me a lot finding error and bugs faster then I do,
but handling with untyped js library can be boring.

Luckly I have some libraries where jsdoc are really well written
so I think I can infer ts definitions (formally `.d.ts` files) from there
with some parsing and AST shaking.

Based on [doctrine](https://github.com/eslint/doctrine) and [espree](https://github.com/eslint/espree), really funny piece of software 🔨👩‍🔬.

Warning: this is not to have exact definition file but more to have some baseline
and manually refine.

## USAGE

```bash
npm i
mkdir module
cp my-js-module-well-documented module/
node index.js ./module/my-js-module-well-documented ./module
```

## NOTE

See here for advice on AST https://astexplorer.net/
