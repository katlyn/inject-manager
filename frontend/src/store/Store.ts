/* eslint-disable @typescript-eslint/ban-types */

import { reactive, watch, ref, Ref } from 'vue'

export class Store<T extends object> {
  state: T;

  constructor (data: T) {
    this.state = reactive(data) as T
    watch(() => this.state, val => console.log('Store change:', val), { deep: true })
  }
}

export class PersistentStore<T extends object> extends Store<T> {
  private isInitialized = ref(false);

  constructor (data: T, readonly storeName: string) {
    super(data)
    const storedState = window.localStorage.getItem(storeName)
    if (storedState) {
      Object.assign(this.state, JSON.parse(storedState))
    }
    watch(() => this.state, val => window.localStorage.setItem(storeName, JSON.stringify(val)), { deep: true })
  }

  getIsInitialized (): Ref<boolean> {
    return this.isInitialized
  }
}
