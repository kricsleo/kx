import { dots, weather } from 'cli-spinners'

interface SpinnerOptions {
  animation: { 
    interval: number,
    frames: string[]
  }
}
export class Spinner {
  private animation: SpinnerOptions['animation']
  private animationIdx = 0
  private timer: NodeJS.Timeout | null = null
  private stream = process.stderr
  constructor(options?: SpinnerOptions) {
    this.animation = options?.animation || dots
  }
  start(text?: string) {
    if(this.timer) {
      return
    }
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
    const frame = this.animation.frames[this.animationIdx % this.animation.frames.length]
    // TODO: process.stderr usage
    this.stream.cursorTo(0)
    this.stream.write(frame)
    this.animationIdx ++
    this.timer = setTimeout(() => this.animate(), this.animation.interval)
  }
  showCursor() {
    // If the stream is connected to a TTY (terminal) device.
    if(!this.stream.isTTY) {
      return
    }
    this.stream.write('\u001B[?25h')
  }
  hideCursor() {
    // If the stream is connected to a TTY (terminal) device.
    if(!this.stream.isTTY) {
      return
    }
    this.stream.write('\u001B[?25l')
  }
}

const spinner = new Spinner({ animation: weather })

spinner.start()