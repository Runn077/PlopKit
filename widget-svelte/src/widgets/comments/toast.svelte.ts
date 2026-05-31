export class Toast {
  message = $state('')
  fading = $state(false)
  private timers: ReturnType<typeof setTimeout>[] = []

  show(msg: string) {
    this.timers.forEach(clearTimeout)
    this.timers = []
    this.message = msg
    this.fading = false
    this.timers.push(setTimeout(() => (this.fading = true), 2500))
    this.timers.push(setTimeout(() => {
      this.message = ''
      this.fading = false
    }, 3000))
  }
}