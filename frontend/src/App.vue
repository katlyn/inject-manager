<template>
  <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </div>
  <router-view/>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import 'normalize.css'
import '@/assets/style.scss'
import '@/assets/lexend/include.css'

@Options({
  name: 'App'
})
export default class App extends Vue {}
</script>

<style lang="scss">
#app {
  padding: 4em;
}

#nav {
  display: flex;
  gap: 1em;
  justify-content: center;
}
</style>
