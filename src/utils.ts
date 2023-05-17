import { moon } from 'cli-spinners'
// 'node:readline/promises' is supportted from NodeJS 17.4.0
// import { createInterface } from 'node:readline/promises'
import { createInterface } from 'node:readline'
import Fuse from 'fuse.js'
import chalk from 'chalk'
import { createRequire } from 'node:module'
import repl from 'node:repl'

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
// console.log(chalk.yellow('Your are working at:'), getExecutingFilepath())


function myRequire(path: string, relativePath: string) {
  // import.meta.url 👉🏻 file://<filepath>
  // why `createRequire` not `import`?
  // because path for `import` must be static,
  // but when `zx` is installed in user's computer,
  // the path for 'package.json' varies from one person to another,
  // it can't be static.
  return createRequire(path)(relativePath)
}
// console.log('require tsconfig.json', myRequire(import.meta.url, '../tsconfig.json'))


async function readContentFromStdin() {
  // process.stdin.isTTY 是一个属性，用于表示 Node.js 进程的标准输入（stdin）是否连接到终端或控制台。在 Node.js 中，process.stdin 是一个可读流，它提供了从标准输入读取数据的功能。
  // 当 process.stdin.isTTY 的值为 true 时，这意味着标准输入流（stdin）连接到了一个终端（TTY）或控制台。这通常表示应用程序在交互模式下运行，允许用户直接输入数据。
  // 当 process.stdin.isTTY 的值为 false 或 undefined 时，这意味着标准输入流（stdin）没有连接到一个终端或控制台，可能是由于数据从文件或其他程序中传输。这通常表示应用程序在非交互模式下运行，从其他来源接收数据，而不是直接从用户那里获取。
  if(process.stdin.isTTY) {
    throw new Error('Is connected to a terminal, can not read from it.')
  }
  //   process.stdin.setEncoding('utf8') 是一个 Node.js 方法，用于设置进程的标准输入流（stdin）的字符编码。在这个例子中，它将字符编码设置为 'utf8'。
  // 当设置了字符编码后，从标准输入流（stdin）读取的数据将被解码为字符串，而不是原始的 Buffer 对象。这使得处理输入的文本数据变得更加方便，因为你无需手动将 Buffer 转换为字符串。
  process.stdin.setEncoding('utf8')
  let content
  for await (const chunk of process.stdin) {
    content += chunk
  }
  if(!content) {
    throw new Error('Empty read in.')
  }
  return content
}

function startRepl() {
  // Stands from `Read-Eval-Print-Loop`
  // Read：这一步将读取用户输入的数据，解析成JavaScript数据结构，然后存储在内存中。
  // Eval：这一步取出存储的数据，对其进行求值。
  // Print：接着，输出结果。
  // Loop：重复上述过程，直到用户退出REPL环境。

  // start an interactive terminal to read from user input(or other read in)
  // eval the code 
  // return the result to user terminal(or other ouput)
  const r = repl.start({
    prompt: chalk.bold.yellow('Enter your code') + ': ',
    useGlobal: true,
    preview: true,
  })
}
// startRepl()


class MyPromise<Value> extends Promise<Value> {
  private stopped = false
  then<R, E>(
    resolve?: ((v: Value) => R | PromiseLike<R>) | null | undefined, 
    reject?: ((e: E) => E| PromiseLike<E>) | null | undefined
  ) {
    if(this.stopped) {
      throw new Error('Stopped')
    }
    return super.then(resolve, reject)
  }
  stop() {
    this.stopped = true
  }
}

// const c = new MyPromise((rs, rj) => {
//   setTimeout(() => {
//     c.stop()
//   }, 1000)
// });

// (async () => {
//   c.stop()
//   await c
// })()