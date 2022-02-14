<template>
  <div class="home">
    <form @submit.prevent="enterRoom">
      <input type="text" placeholder="Room ID" v-model="room">
      <button type="submit" :disabled="room.length < roomCodeMinLength">Enter Room</button>
    </form>
    <div class="history">
      <router-link v-for="room in rooms" :key="room.id" :to="`/room/${room.id}`">{{ room.name }}</router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component'
import store, { Room } from '@/store'

export default class Home extends Vue {
  roomCodeMinLength = 5
  room = ''

  enterRoom (): void {
    if (this.room.length >= this.roomCodeMinLength) {
      this.$router.push(`/room/${this.room}`)
    }
  }

  get rooms (): Room[] {
    return store.state.rooms
  }
}
</script>

<style lang="scss" scoped>
.history {
  display: flex;
  flex-direction: column;
}
</style>
