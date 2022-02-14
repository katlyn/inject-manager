<!-- https://stackoverflow.com/questions/51503633/click-and-edit-text-input-with-vue -->
<template>
  <div>
    <input
      type="text"
      class="text"
      v-if="edit"
      :value="editingValue"
      @blur="saveEdit"
      @keyup.enter="ev => ev.target.blur()"
      @keyup.esc="cancelEdit"
      v-bind="$attrs"
      v-focus
    />
    <div v-else class="text" @click="edit = true" @focus="edit = true" tabindex="0">
      <span>
        {{modelValue}} <font-awesome-icon icon="edit" />
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

@Options({
  name: 'ClickEdit',
  inheritAttrs: false,
  directives: {
    focus: {
      mounted: (el) => {
        el.focus()
        el.select()
      }
    }
  },
  props: {
    modelValue: String
  },
  emits: ['update:modelValue']
})
export default class ClickEdit extends Vue {
  modelValue!: string
  editingValue = this.modelValue

  edit = false

  saveEdit (ev: InputEvent): void {
    if (!this.edit) {
      return
    }
    this.edit = false
    this.editingValue = (ev.target as HTMLInputElement).value
    this.$emit('update:modelValue', this.editingValue)
  }

  cancelEdit (): void {
    this.edit = false
  }
}
</script>

<style lang="scss" scoped>
.text {
  padding: 0.25em;
  border: none;
  border-radius: 0.25em;
  cursor: pointer;
  font-size: inherit;
  font-style: inherit;
  font-weight: inherit;
}

input.text {
  cursor: initial;
}

input {
  outline: none;
  display: block;
  width: 100%;
}
</style>
