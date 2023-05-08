import { dots } from 'cli-spinners'

export class Spinner {
  private frames = dots.frames
  private interval = dots.interval
  private frameIdx = 0
  private timer: NodeJS.Timeout | null = null
  start(text?: string) {
    if(this.timer) {
      return
    }
    this.animate()
  }
  stop() {
    if(this.timer) {
      clearTimeout(this.timer)
    }
  }
  animate() {
    const frame = this.frames[this.frameIdx % this.frames.length]
    // TODO: process.stderr usage
    process.stderr.cursorTo(0)
    process.stderr.write(frame)
    this.frameIdx ++
    this.timer = setTimeout(() => this.animate(), this.interval)
  }
}

const spinner = new Spinner()

spinner.start()