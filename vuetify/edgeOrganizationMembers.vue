<script setup>
import { computed, inject, nextTick, reactive, watch } from 'vue'

const edgeFirebase = inject('edgeFirebase')

const state = reactive({
  loaded: true,
})

const users = computed(() => {
  const otherUsers = Object.values(edgeFirebase.state.users)

  return otherUsers
})
watch(users, async () => {
  state.loaded = false
  await nextTick()
  state.loaded = true
})
</script>

<template>
  <div>
    <g-input
      v-if="state.loaded"
      v-model="users"
      :disable-tracking="true"
      field-type="objectList"
      sub-field-type="users"
      label="Users"
      parent-tracker-id="users"
    />
  </div>
</template>

<style lang="scss" scoped>

</style>
