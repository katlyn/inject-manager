<template>
  <input type="time" v-model="time">
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import moment from 'moment-timezone'

@Options({
  props: {
    modelValue: String,
    timezone: String
  },
  emits: ['update:modelValue']
})
export default class TimeInput extends Vue {
  modelValue!: string
  timezone!: string

  get time (): string {
    console.log(this.modelValue)
    return moment(this.modelValue).tz(this.timezone)?.format('HH:mm') ?? '0:0'
  }

  set time (v: string) {
    const [hour, min] = v.split(':').map(Number)
    const time = moment.tz(this.timezone).set('hour', hour).set('minute', min).toDate()
    this.$emit('update:modelValue', time)
  }
}
</script>
