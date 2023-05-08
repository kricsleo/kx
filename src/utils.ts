import { moon } from 'cli-spinners'

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
    const frame = animationFrame + this.text || '' + '\n'
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