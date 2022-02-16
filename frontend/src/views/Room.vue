<template>
  <div v-if="room">
    <header class="room-header">
      <h1>
        <ClickEdit v-model="roomName" placeholder="Room Name"/>
      </h1>

      <select id="room-timezone" v-model="timezone">
        <option v-for="tz in timezones" :value="tz" :key="tz">{{ tz }}</option>
      </select>

      <button @click="editInject(newInject)">Add Inject</button>
    </header>

    <Notice class="warning" v-if="room.injects.length === 0">
      <p>
        This room doesn't have any injects.
      </p>
    </Notice>

    <dialog ref="dialog" @close="cancelCreateInject">
      <form method="dialog" @submit="createInject" ref="inject">
        <h3>Edit Inject</h3>
        <div class="form-table">
          <div class="form-row">
            <label for="inject-name">Name</label>
            <input type="text" id="inject-name" placeholder="Inject Name" v-model="editingInject.name" />
          </div>
          <div class="form-row">
            <label for="inject-assignee">Assignee</label>
            <input type="text" id="inject-assignee" placeholder="Assignee" v-model="editingInject.assignee" />
          </div>
          <div class="form-row">
            <label for="inject-response">Response</label>
            <textarea id="inject-response" placeholder="Inject Response (supports markdown)" v-model="editingInject.response" />
          </div>
          <div class="form-row">
            <label for="inject-time">Due date</label>
            <TimeInput v-model="editingInject.dueDate" :timezone="timezone"/>
          </div>
          <div class="form-row">
            <label for="inject-status">Status</label>
            <select id="inject-status" v-model="editingInject.status">
              <option v-for="key in statuses" :value="key" :key="key">{{ key }}</option>
            </select>
          </div>
        </div>
        <div class="actions">
          <button type="button" @click.prevent="printInject(editingInject)">Print</button>
          <button type="reset" @click="cancelCreateInject">Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </dialog>

    <div v-for="state in statuses" :value="state" :key="state">
      <h2>{{ state }} Injects</h2>
      <p v-if="sortedInjects[state].length === 0">This room has no submitted injects.</p>
      <div v-else class="inject-list">
        <InjectCard v-for="inject of sortedInjects[state]" :key="inject.id" :inject="inject" @click="editInject(inject)"/>
      </div>
    </div>
  </div>
  <div v-else>
    Room pending...
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import ClickEdit from '@/components/ClickEdit.vue'
import InjectCard from '@/components/InjectCard.vue'
import Notice from '@/components/Notice.vue'
import TimeInput from '@/components/TimeInput.vue'
import { createInject, getRoom, Inject, InjectState, joinRoom, Room as RoomType, updateInject, updateRoom } from '@/store'
import moment from 'moment'
import { marked } from 'marked'

@Options({
  components: {
    ClickEdit,
    InjectCard,
    Notice,
    TimeInput
  }
})
export default class Room extends Vue {
  newInject: Inject = {
    id: '',
    name: '',
    assignee: '',
    response: '',
    status: InjectState.PENDING,
    dueDate: new Date().toISOString()
  }

  statuses = InjectState

  editingInject = { ...this.newInject }

  get room (): RoomType {
    return getRoom(this.$route.params.id as string)
  }

  get roomName (): string {
    return this.room.name
  }

  set roomName (name: string) {
    updateRoom(this.room.id, { name })
  }

  get timezone (): string {
    return this.room.timezone
  }

  set timezone (tz: string) {
    updateRoom(this.room.id, { timezone: tz })
  }

  get timezones (): string[] {
    return moment.tz.names()
  }

  get sortedInjects (): Record<InjectState, Inject[]> {
    const ret: Record<InjectState, Inject[]> = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      SUBMITTED: [],
      EXPIRED: []
    }
    console.log(this.room.injects)

    const sorted = this.room.injects.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    for (const i of sorted) {
      ret[i.status].push(i)
    }
    return ret
  }

  created (): void {
    joinRoom(this.$route.params.id as string)
  }

  createInject (): void {
    if (this.room.injects.find(i => i.id === this.editingInject.id)) {
      updateInject(this.room.id, this.editingInject)
    } else {
      createInject(this.room.id, this.editingInject)
    }
  }

  cancelCreateInject (): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.$refs.dialog as any).close()
    this.editingInject = { ...this.newInject }
  }

  editInject (i: Inject): void {
    this.editingInject = { ...i }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.$refs.dialog as any).showModal()
  }

  printInject (i: Inject): void {
    const w = window.open()
    if (w === null) {
      alert('Unable to print!')
      return
    }
    w.document.write(`
<h1>${i.name}</h1>
<h2>${this.room.name}</h2>
<hr>
<p>${marked(i.response, { gfm: true })}</p>
<style>
@page {
  margin: 2cm;
}
body {
  font-family: sans-serif;
}
h1, h2, h3, h4, h5 {
  margin: 0.25;
}
</style>
<script>
Promise.all(Array.from(document.querySelectorAll('img')).map(e => new Promise(res => {
  const image = new Image()
  image.onload = res
  image.onerror = res
  image.src = e.src
}))).then(() => {
  window.print()
  window.close()
})
</` + `script>
    `)
    // w.print()
    // w.close()
  }
}
</script>

<style lang="scss" scoped>
.room-header {
  display: flex;
  gap: 1em;
  align-items: center;

  h1 {
    flex-grow: 1;
  }
}

.inject-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20em, 1fr));
  gap: 1em;

  .inject-card {
    cursor: pointer;
  }
}
</style>
