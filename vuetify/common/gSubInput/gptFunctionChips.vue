<script setup>
const props = defineProps({
  field: {
    type: Object,
    required: true,
  },
})
// Your JavaScript code goes here
</script>

<template>
  <div>
    <v-chip size="small" label color="primary" variant="tonal">
      Type: {{ field.type }}
    </v-chip>
    <v-chip v-if="field.required" size="small" class="ml-1" label color="error" variant="tonal">
      Required
    </v-chip>
    <v-menu
      v-if="field?.enum?.length"
    >
      <template #activator="{ props }">
        <v-chip size="small" class="ml-1" v-bind="props" label variant="tonal" append-icon="mdi-information">
          Enum
        </v-chip>
      </template>
      <v-alert min-width="300" max-width="300" border="start" density="compact">
        <template #title>
          Enum
        </template>
        {{ field.enum.join(', ') }}
      </v-alert>
    </v-menu>
    <v-menu
      v-if="field.description"
    >
      <template #activator="{ props }">
        <v-chip size="small" class="ml-1" v-bind="props" label variant="tonal" append-icon="mdi-information">
          Description
        </v-chip>
      </template>
      <v-alert min-width="300" max-width="300" border="start" density="compact">
        <template #title>
          Description
        </template>
        {{ field.description }}
      </v-alert>
    </v-menu>
  </div>
</template>

<style scoped>
</style>
