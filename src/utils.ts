import { moon } from 'cli-spinners'
// 'node:readline/promises' is supportted from NodeJS 17.4.0
// import { createInterface } from 'node:readline/promises'
import { createInterface } from 'node:readline'
import Fuse from 'fuse.js'
import chalk from 'chalk'
import { createRequire } from 'node:module'

interface SpinnerOptions {
  animation: { 
    interval: number,
    frames: string[]
  }
}
export class Spinner {
  private text?: string
  private animation: SpinnerOptions['animation']
  private animationIdx = 0
  private timer: NodeJS.Timeout | null = null
  private stream = process.stderr
  private isCursorHidden = false
  constructor(options?: SpinnerOptions) {
    this.animation = options?.animation || moon
  }
  start(text?: string) {
    if(this.timer && this.text === text) {
      return
    }
    this.text = text
    this.hideCursor()
    this.animate()
  }
  stop() {
    if(this.timer) {
      clearTimeout(this.timer)
    }
    this.showCursor()
  }
  private animate() {
    if(this.timer) {
      clearTimeout(this.timer)
    }
    const animationFrame = this.animation.frames[this.animationIdx % this.animation.frames.length]
    const frame = '\n' + animationFrame + this.text || '' + '\n'
    // TODO: process.stderr usage
    this.stream.cursorTo(0)
    this.stream.write(frame)
    this.animationIdx ++
    this.timer = setTimeout(() => this.animate(), this.animation.interval)
  }
  private showCursor() {
    // If the stream is connected to a TTY (terminal) device.
    if(!this.isCursorHidden || !this.stream.isTTY) {
      return
    }
    // https://github.com/sindresorhus/cli-cursor/blob/main/index.js#L14
    this.stream.write('\u001B[?25h')
    this.isCursorHidden = true
  }
  private hideCursor() {
    // If the stream is connected to a TTY (terminal) device.
    if(this.isCursorHidden || !this.stream.isTTY) {
      return
    }
    // https://github.com/sindresorhus/cli-cursor/blob/main/index.js#L24
    this.stream.write('\u001B[?25l')
    this.isCursorHidden = false
  }
}
// const spinner = new Spinner()
// spinner.start('hello')
// setTimeout(() => {
//   spinner.start('Got!')
//   setTimeout(() => {
//     spinner.stop()
//   }, 3000)
// }, 3000)

async function question(question: string, options: string[]) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
  })
  const fuse = new Fuse(options)

  function completer(linePartial: string) {
    const matches = fuse.search(linePartial)
    const completions = matches.length 
      ? matches.map(match => match.item)
      : options
    return [completions, linePartial]
  }
  return new Promise((rs, rj) => {
    rl.question(question, answer => {
      rl.close()
      rs(answer)
    })
  })
}
// question('What is your name?', ['json', 'kitty', 'bython'])
//   .then(answer => console.log('Your answer:', answer))


function getExecutingFilepath() {
  // Using Error stack
  // const from = new Error().stack!.split(/^\s*at\s/m)[2].trim()
  const lines = new Error().stack!.split(/\n/m)
  const from = lines[0].match(/(^.*)(?=:\d+$)/)
  if(!from) {
    throw new Error('Parsing filepath error')
  }
  return from[0]
}

console.log(chalk.yellow('Your are working at:'), getExecutingFilepath())


function myRequire(path: string, relativePath: string) {
  // import.meta.url 👉🏻 file://<filepath>
  // why `createRequire` not `import`?
  // because path for `import` must be static,
  // but when `zx` is installed in user's computer,
  // the path for 'package.json' varies from one person to another,
  // it can't be static.
  return createRequire(path)(relativePath)
}

console.log('require tsconfig.json', myRequire(import.meta.url, '../tsconfig.json'))