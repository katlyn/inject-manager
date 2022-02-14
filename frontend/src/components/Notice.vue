<template>
  <div class="notice">
    <slot />
  </div>
</template>

<style lang="scss">
.notice {
  border: solid 1px var(--secondary);
  padding: 1em;
  margin: 2em 0;

  &.warning {
    border-color: var(--warning-dark);
  }
}
</style>
