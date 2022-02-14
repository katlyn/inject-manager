<template>
  <div class="inject-card" :class="{
    warning: shouldWarn,
    blink: shouldBlink
  }">
    <h3>{{ inject.name }}</h3>
    <h4>{{ inject.assignee }}</h4>
    <p>Due {{relative}}</p>
  </div>
</template>

<script lang="ts">
import { Inject, InjectState } from '@/store'
import moment from 'moment'
import { Options, Vue } from 'vue-class-component'

@Options({
  props: {
    inject: Object
  }
})
export default class InjectCard extends Vue {
  inject!: Inject

  relative = ''
  shouldWarn = false
  shouldBlink = false
  interval!: number

  created (): void {
    this.updateTime()
    this.interval = setInterval(this.updateTime, 1e3)
  }

  updateTime (): void {
    this.relative = moment(this.inject.dueDate).fromNow()
    const diff = new Date(this.inject.dueDate).getTime() - Date.now()
    // 30 minute warning
    this.shouldWarn = diff < (30 * 60 * 1000)
    // 5 minute warning
    this.shouldBlink = diff < (5 * 60 * 1000)

    if (diff < 0 || this.inject.status === InjectState.SUBMITTED) {
      this.shouldWarn = false
      this.shouldBlink = false
    }
  }

  unmounted (): void {
    clearInterval(this.interval)
  }
}
</script>

<style scoped lang="scss">
.inject-card {
  padding: 1em;
  background-color: var(--secondary);

  h3, h4, p {
    margin: 0;
    margin-bottom: 0.25em;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.warning {
  background-color: var(--warning-dark);
}

.blink {
  animation: blink 1.5s step-end infinite;
}
@keyframes blink {
  50% {
    background-color: var(--secondary);
  }
}
</style>
