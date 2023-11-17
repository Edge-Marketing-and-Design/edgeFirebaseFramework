<script setup>
import { computed, defineProps, inject, nextTick, onBeforeMount, onMounted, reactive, ref, watch } from 'vue'
const props = defineProps({
  disableTracking: {
    type: Boolean,
    default: false,
  },
  parentTrackerId: {
    type: String,
    default: '',
  },
  helper: {
    type: String,
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
  fieldType: {
    type: String,
    default: 'text',
  },
  fieldTypes: {
    type: Array,
    default: () => [],
  },
  subFieldType: {
    type: String,
    default: '',
  },
  collectionPath: {
    type: String,
    default: '',
  },
  collectionTitleField: {
    type: String,
    default: '',
  },
  collectionValueField: {
    type: String,
    default: 'docId',
  },
  modelValue: {
    type: [Number, String, Array, Object, Boolean],
  },
  rules: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: '',
  },
  rows: {
    type: String,
    default: '1',
  },
  hint: {
    type: String,
    default: '',
  },
  persistentHint: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  passThroughProps: {
    type: [Number, String, Array, Object, Boolean],
    required: false,
    default: null,
  },
  maskOptions: {
    type: [Object],
    required: false,
    default: null,
  },
  bindings: {
    type: [Object],
    required: false,
    default: () => ({ variant: 'underlined' }),
  },
})
const emit = defineEmits(['update:modelValue'])
const edgeGlobal = inject('edgeGlobal')
const edgeFirebase = inject('edgeFirebase')
const state = reactive({
  loaded: false,
  afterMount: false,
  trackerKey: '',
  helper: false,
  fieldsTypes: ['string', 'boolean', 'array', 'object', 'number'],
  fieldInsert: { key: '', type: 'string' },
  fieldInsertKeyRequired: false,
  fieldInsertDialog: false,
  removeField: null,
  fieldErrorMessage: '',
  keyMenu: false,
  newKey: null,
  currentKey: null,
  order: [],
  orderUpdateFromWatcher: false,
  objectListOriginalOrder: {},
})

const returnObject = computed(() => {
  if (props.bindings && props.bindings['return-object']) {
    return props.bindings['return-object']
  }
  return false
})

const fieldTypes = computed(() => {
  if (props.fieldTypes.length > 0) {
    return props.fieldTypes
  }
  return state.fieldsTypes
})

// eslint-disable-next-line vue/no-dupe-keys
const modelValue = ref(null)

const addField = () => {
  if (props.fieldType === 'object') {
    state.order.push({ key: state.fieldInsert.key })
  }
  if (props.fieldType === 'array') {
    let arrayValue = null
    if (state.fieldInsert.type === 'string') {
      arrayValue = ''
    }
    else if (state.fieldInsert.type === 'boolean') {
      arrayValue = false
    }
    else if (state.fieldInsert.type === 'array') {
      arrayValue = []
    }
    else if (state.fieldInsert.type === 'object') {
      arrayValue = {}
    }
    else if (state.fieldInsert.type === 'number') {
      arrayValue = 0
    }
    if (modelValue.value === null) {
      modelValue.value = []
    }
    modelValue.value.push(arrayValue)
    state.order = modelValue.value.map((value, index) => {
      return {
        key: index,
        value,
      }
    })
    // state.order.push({ key: state.order.length, value: arrayValue })

    state.fieldInsert.key = ''
    state.fieldInsert.type = 'string'
    state.fieldInsertDialog = false
    state.fieldInsertKeyRequired = false
    state.fieldErrorMessage = ''
    return
  }
  if (state.fieldInsert.key === '') {
    state.fieldInsertKeyRequired = true
    state.fieldErrorMessage = 'Key is required'
    return
  }

  if (Object.keys(modelValue.value).some((k) => {
    return k.toLowerCase() === state.fieldInsert.key.toLowerCase()
  })) {
    state.fieldInsertKeyRequired = true
    state.fieldErrorMessage = 'Key already exists'
    return
  }
  if (state.fieldInsert.type === 'string') {
    modelValue.value[state.fieldInsert.key] = ''
  }
  else if (state.fieldInsert.type === 'boolean') {
    modelValue.value[state.fieldInsert.key] = false
  }
  else if (state.fieldInsert.type === 'array') {
    modelValue.value[state.fieldInsert.key] = []
  }
  else if (state.fieldInsert.type === 'object') {
    modelValue.value[state.fieldInsert.key] = {}
  }
  else if (state.fieldInsert.type === 'number') {
    modelValue.value[state.fieldInsert.key] = 0
  }
  state.fieldInsert.key = ''
  state.fieldInsert.type = 'string'
  state.fieldInsertDialog = false
  state.fieldInsertKeyRequired = false
  state.fieldErrorMessage = ''
}

const removeField = (key) => {
  if (props.fieldType === 'array') {
    modelValue.value.splice(key, 1)
    if (modelValue.value.length === 0) {
      modelValue.value = []
      state.order = []
    }
    else {
      state.order = modelValue.value.map((value, index) => {
        return {
          key: index,
          value,
        }
      })
    }
    state.removeField = null
    return
  }
  delete modelValue.value[key]
  state.order = state.order.filter((k) => {
    return k.key !== key
  })
  state.removeField = null
}

const undo = async () => {
  modelValue.value = edgeGlobal.dupObject(edgeGlobal.edgeState.changeTracker[state.trackerKey])
  if (props.fieldType === 'array') {
    if (modelValue.value === null) {
      state.order = []
    }
    else {
      state.order = modelValue.value.map((value, index) => {
        return {
          key: index,
          value,
        }
      })
    }
  }
  if (props.fieldType === 'object') {
    if (!edgeGlobal.objHas(modelValue.value, 'flingKeyOrder')) {
      state.order = Object.entries(modelValue.value).map(([key, value]) => {
        return {
          key,
        }
      }).filter((k) => {
        return k.key !== 'flingKeyOrder'
      })
    }
    else {
      state.order = edgeGlobal.dupObject(modelValue.value.flingKeyOrder)
    }
  }
  state.loaded = false
  await nextTick()
  state.loaded = true
}

onBeforeMount(async () => {
  modelValue.value = edgeGlobal.dupObject(props.modelValue)
  if (props.fieldType === 'objectList') {
    props.modelValue.forEach((item, index) => {
      state.objectListOriginalOrder[item.id] = index
    })
  }
  if (props.fieldType === 'object') {
    if (!edgeGlobal.objHas(props.modelValue, 'flingKeyOrder')) {
      if (props.modelValue === null) {
        state.order = []
      }
      else {
        state.order = Object.entries(props.modelValue).map(([key, value]) => {
          return {
            key,
          }
        }).filter((k) => {
          return k.key !== 'flingKeyOrder'
        })
      }
    }
    else {
      state.order = edgeGlobal.dupObject(props.modelValue.flingKeyOrder)
    }
  }
  if (props.fieldType === 'array') {
    if (props.modelValue === null) {
      state.order = []
    }
    else {
      state.order = props.modelValue.map((value, index) => {
        return {
          key: index,
          value,
        }
      })
    }
  }
  if (props.fieldType === 'collection') {
    if (props.collectionPath) {
      // only if startSnapshot is not already running
      if (edgeGlobal.objHas(edgeFirebase.data, props.collectionPath) === false) {
        console.log('startSnapshot')
        await edgeFirebase.startSnapshot(props.collectionPath)
        console.log(edgeFirebase.data[props.collectionPath])
      }
    }
  }
  state.loaded = true
})

const collectionItems = computed(() => {
  if (!props.collectionPath || !props.collectionTitleField) {
    return []
  }
  if (edgeGlobal.objHas(edgeFirebase.data, props.collectionPath) === false) {
    return []
  }
  // if collection props.collectionValueField is the same as props.collectionTitleField return an a array of vaules of the title field
  if (props.collectionValueField === props.collectionTitleField) {
    return Object.values(edgeFirebase.data[props.collectionPath]).map(item => item[props.collectionTitleField])
  }
  return Object.values(edgeFirebase.data[props.collectionPath]).map(item => ({
    title: item[props.collectionTitleField],
    value: item.docId,
  }))
})

const removeFieldDialogShow = computed(() => {
  if (state.removeField !== null) {
    return true
  }
  return false
})
const originalCompare = computed(() => {
  if (props.fieldType === 'objectList' || props.fieldType === 'object' || props.fieldType === 'array' || returnObject) {
    return JSON.stringify(edgeGlobal.edgeState.changeTracker[state.trackerKey])
  }
  else {
    return edgeGlobal.edgeState.changeTracker[state.trackerKey]
  }
})

const isTracked = computed(() => {
  return edgeGlobal.objHas(edgeGlobal.edgeState.changeTracker, state.trackerKey)
})

const modelCompare = computed(() => {
  if (props.fieldType === 'objectList' || props.fieldType === 'object' || props.fieldType === 'array' || returnObject) {
    return JSON.stringify(modelValue.value)
  }
  else {
    return modelValue.value
  }
})

const getArrayObjectLabel = (key) => {
  if (props.fieldType === 'object') {
    return key
  }
  else {
    return `Array Item #${key + 1}`
  }
}

const openKeyMenu = (key) => {
  state.keyMenu = true
  state.currentKey = key
  state.newKey = key
}

const updateKey = async () => {
  const keyArray = Object.keys(modelValue.value)
  const keyIndex = keyArray.findIndex(k => k === state.currentKey)
  keyArray[keyIndex] = state.newKey

  const value = modelValue.value[state.currentKey]
  delete modelValue.value[state.currentKey]

  const newObject = {}
  keyArray.forEach((k) => {
    if (k === state.newKey) {
      newObject[k] = value
    }
    else {
      newObject[k] = modelValue.value[k]
    }
  })

  const newItem = { key: state.newKey }
  const index = state.order.findIndex(item => item.key === state.currentKey)
  if (index !== -1) {
    state.order.splice(index, 1, newItem)
  }
  modelValue.value = newObject
  state.keyMenu = false
}

const isNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value)
}

onMounted(() => {
  state.trackerKey = (`${props.parentTrackerId}-${props.label.replaceAll(' ', '-')}`).toLowerCase()
  if (!edgeGlobal.objHas(edgeGlobal.edgeState.changeTracker, state.trackerKey)) {
    if (!props.disableTracking) {
      edgeGlobal.edgeState.changeTracker[state.trackerKey] = edgeGlobal.dupObject(modelValue.value)
    }
  }
  state.afterMount = true
})

const userItem = (id) => {
  if (!edgeGlobal.objHas(edgeFirebase.state.users, id)) {
    return ''
  }
  if (!edgeGlobal.objHas(edgeFirebase.state.users[id], 'meta')) {
    return ''
  }
  if (!edgeGlobal.objHas(edgeFirebase.state.users[id].meta, 'name')) {
    return ''
  }
  return edgeFirebase.state.users[id].meta.name
}

const collectionItem = (id) => {
  if (!props.collectionPath || !props.collectionTitleField) {
    return ''
  }
  if (!edgeGlobal.objHas(edgeFirebase.data, props.collectionPath)) {
    return ''
  }
  if (!edgeGlobal.objHas(edgeFirebase.data[props.collectionPath], id)) {
    return ''
  }
  if (!edgeGlobal.objHas(edgeFirebase.data[props.collectionPath][id], props.collectionTitleField)) {
    return ''
  }
  return edgeFirebase.data[props.collectionPath][id][props.collectionTitleField]
}

const validateInput = (event) => {
  // Allow keys that don't result in character input.
  if (['Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
    return
  }

  // Create a copy of the value that would result from this keypress.
  const proposedValue = event.target.value + event.key

  // Create a regex that matches valid inputs: up to one decimal point, and up to two digits after the decimal point.
  const regex = /^\d*\.?\d{0,2}$/

  // If the proposed value doesn't match the regex, prevent the keypress.
  if (!regex.test(proposedValue)) {
    event.preventDefault()
  }
}

watch(() => state.order, () => {
  if (props.fieldType === 'object') {
    modelValue.value.flingKeyOrder = edgeGlobal.dupObject(state.order)
  }

  if (props.fieldType === 'array') {
    if (!state.orderUpdateFromWatcher) {
      if (state.order.length > 0) {
        const currentValues = edgeGlobal.dupObject(modelValue.value)
        modelValue.value = state.order.map((item) => {
          return currentValues[item.key]
        })

        state.orderUpdateFromWatcher = true
        if (modelValue.value.some(item => typeof item !== 'object' || item === null)) {
          state.order = modelValue.value.map((value, index) => {
            return {
              key: index,
              value,
            }
          })
        }
      }
    }
  }
},
{ deep: true })

watch(() => state.fieldInsertDialog, () => {
  if (state.fieldInsertDialog) {
    if (props.fieldType === 'array') {
      if (props.fieldTypes.length === 1) {
        addField()
      }
    }
  }
},
{ deep: true })

// const propsModelValue = computed(() => {
//   return props.modelValue
// })

// watch(propsModelValue, () => {
//   state.afterMount = false
//   modelValue.value = edgeGlobal.dupObject(props.modelValue)
//   state.afterMount = true
// }, { deep: true })

watch(modelValue, () => {
  if (state.afterMount) {
    emit('update:modelValue', modelValue.value)
  }
  if (props.fieldType === 'array') {
    state.orderUpdateFromWatcher = false
  }
}, { deep: true })
</script>

<template>
  <div v-if="state.loaded">
    <template v-if="props.fieldType === 'collection'">
      <v-combobox
        v-if="props.collectionValueField === props.collectionTitleField"
        v-model="modelValue"
        :rules="props.rules"
        :clearable="true"
        :label="props.label"
        :items="collectionItems"
        v-bind="props.bindings"
        :return-object="false"
        :disabled="props.disabled"
      >
        <template v-if="props.helper" #append>
          <helper :helper="props.helper" />
        </template>
      </v-combobox>
      <v-select
        v-else
        v-model="modelValue"
        :rules="props.rules"
        :clearable="true"
        :label="props.label"
        :items="collectionItems"
        v-bind="props.bindings"
        :return-object="false"
        :disabled="props.disabled"
      >
        <template v-if="props.helper" #append>
          <helper :helper="props.helper" />
        </template>
      </v-select>
    </template>
    <v-select
      v-if="props.fieldType === 'users'"
      v-model="modelValue"
      :rules="props.rules"
      :clearable="true"
      :label="props.label"
      :items="Object.values(edgeFirebase.state.users).filter(user => user.userId !== '')"
      v-bind="props.bindings"
      item-title="meta.name"
      item-value="userId"
      :disabled="props.disabled"
    >
      <template v-if="props.helper" #append>
        <helper :helper="props.helper" />
      </template>
    </v-select>
    <v-input
      v-if="props.fieldType === 'number'"
      v-model="modelValue"
      v-bind="props.bindings"
      :rules="props.rules"
      :label="props.label"
      :hint="props.hint"
      :persistent-hint="props.persistentHint"
      :disabled="props.disabled"
      class="mt-1"
    >
      <vue-number-input
        v-model="modelValue"
        :step=".1"
        controls
        size="medium"
        v-bind="props.bindings"
        :rules="props.rules"
        :disabled="props.disabled"
      />
    </v-input>
    <v-text-field
      v-if="props.fieldType === 'money'"
      v-model="modelValue"
      v-maska:[props.maskOptions]
      v-bind="props.bindings"
      :rules="props.rules"
      :label="props.label"
      :hint="props.hint"
      :persistent-hint="props.persistentHint"
      :disabled="props.disabled"
      prefix="$"
      @keydown="validateInput"
    >
      <template v-if="props.helper" #append-inner>
        <helper :helper="props.helper" />
      </template>
    </v-text-field>
    <v-text-field
      v-if="props.fieldType === 'text'"
      v-model="modelValue"
      v-maska:[props.maskOptions]
      v-bind="props.bindings"
      :rules="props.rules"
      :label="props.label"
      :hint="props.hint"
      :persistent-hint="props.persistentHint"
      :disabled="props.disabled"
    >
      <template v-if="props.helper" #append-inner>
        <helper :helper="props.helper" />
      </template>
    </v-text-field>
    <v-checkbox
      v-if="props.fieldType === 'boolean'"
      v-model="modelValue"
      :rules="props.rules"
      :label="props.label"
      v-bind="props.bindings"
    />
    <v-select
      v-if="props.fieldType === 'select'"
      v-model="modelValue"
      :rules="props.rules"
      :clearable="true"
      :label="props.label"
      :items="props.items"
      v-bind="props.bindings"
      :return-object="returnObject"
      :disabled="props.disabled"
    >
      <template v-if="props.helper" #append>
        <helper :helper="props.helper" />
      </template>
    </v-select>
    <v-textarea
      v-if="props.fieldType === 'textarea'"
      v-model="modelValue"
      :rules="props.rules"
      :label="props.label"
      auto-grow
      :rows="props.rows"
      v-bind="props.bindings"
    >
      <template v-if="props.helper" #append-inner>
        <helper :helper="props.helper" />
      </template>
    </v-textarea>
    <template v-if="props.fieldType === 'object' || props.fieldType === 'array'">
      <v-dialog v-model="state.keyMenu" :max-width="300">
        <v-card>
          <v-toolbar density="compact">
            <v-toolbar-title v-if="props.fieldType === 'object'">
              Update Key
            </v-toolbar-title>
            <v-toolbar-title v-else>
              Add Item
            </v-toolbar-title>
            <v-spacer />
            <v-btn icon @click="state.fieldInsertDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text>
            <v-text-field
              v-model="state.newKey"
              class="mb-1"
              label="Key"
              v-bind="props.bindings"
              hide-details
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="state.keyMenu = false">
              Cancel
            </v-btn>
            <v-btn color="primary" @click="updateKey">
              Update
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-card :rounded="0" flat class="fill-height">
        <v-toolbar class="mb-2" density="compact" flat>
          <v-icon v-if="props.fieldType === 'object'" class="mx-4">
            mdi-set-merge
          </v-icon>
          <v-icon v-else class="mx-4">
            mdi-code-array
          </v-icon>
          {{ props.label }}
          <v-spacer />

          <v-btn v-bind="props">
            <template v-if="props.fieldType === 'object'">
              Add Field
            </template>
            <template v-else>
              Add Item
            </template>
            <v-dialog v-model="state.fieldInsertDialog" max-width="400" activator="parent">
              <v-card>
                <v-toolbar density="compact">
                  <v-toolbar-title v-if="props.fieldType === 'object'">
                    Add Field
                  </v-toolbar-title>
                  <v-toolbar-title v-else>
                    Add Item
                  </v-toolbar-title>
                  <v-spacer />
                  <v-btn icon @click="state.fieldInsertDialog = false">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </v-toolbar>
                <v-card-text>
                  <v-text-field
                    v-if="props.fieldType === 'object'"
                    v-model="state.fieldInsert.key"
                    :error="state.fieldInsertKeyRequired"
                    v-bind="props.bindings"
                    label="Field Key"
                    :error-messages="state.fieldErrorMessage"
                  />
                  <v-select
                    v-model="state.fieldInsert.type"
                    v-bind="props.bindings"
                    :items="fieldTypes"
                    label="Type"
                    hide-details
                  />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn @click="state.fieldInsertDialog = false">
                    Cancel
                  </v-btn>
                  <v-btn color="primary" @click="addField">
                    Insert
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-btn>
          <helper v-if="props.helper" :helper="props.helper" />
        </v-toolbar>
        <v-card-text class="pt-0">
          <draggable
            v-model="state.order"
            handle=".handle"
            item-key="key"
          >
            <template #item="{ element }">
              <div>
                <v-container v-if="typeof modelValue[element.key] === 'object' && !Array.isArray(modelValue[element.key])" :key="`object-${element.key}`" style="position: relative;">
                  <v-btn style="position: absolute;right:0px; top:0px;z-index: 99;" size="x-small" icon @click="state.removeField = element.key">
                    <v-icon size="x-large">
                      mdi-delete
                    </v-icon>
                  </v-btn>
                  <v-btn
                    v-if="props.fieldType === 'object'"
                    style="position: absolute;left:66px; top:26px;z-index: 99;"
                    size="small"
                    class="py-0"
                    @click="openKeyMenu(element.key)"
                  >
                    {{ element.key }}
                  </v-btn>
                  <v-icon class="pointer handle" style="position: absolute;left:-8px; top:26px;z-index: 99;">
                    mdi-format-align-justify
                  </v-icon>
                  <g-input v-model="modelValue[element.key]" :label="getArrayObjectLabel(element.key)" :disable-tracking="true" field-type="object" />
                </v-container>
                <v-container v-else-if="Array.isArray(modelValue[element.key])" :key="`array-${element.key}`" style="position: relative;">
                  <v-btn style="position: absolute;right:0px; top:0px;z-index: 99;" size="x-small" icon @click="state.removeField = element.key">
                    <v-icon size="x-large">
                      mdi-delete
                    </v-icon>
                  </v-btn>
                  <v-btn
                    v-if="props.fieldType === 'object'"
                    style="position: absolute;left:66px; top:26px;z-index: 99;"
                    size="small"
                    class="py-0"
                    @click="openKeyMenu(element.key)"
                  >
                    {{ element.key }}
                  </v-btn>
                  <v-icon class="pointer handle" style="position: absolute;left:-8px; top:26px;z-index: 99;">
                    mdi-format-align-justify
                  </v-icon>
                  <g-input v-model="modelValue[element.key]" :bindings="props.bindings" :label="getArrayObjectLabel(element.key)" :disable-tracking="true" field-type="array" />
                </v-container>
                <v-container v-else :key="`others-${element.key}`" class="py-1">
                  <v-row dense>
                    <v-col class="text-right pt-6" cols="1">
                      <v-icon class="handle pointer">
                        mdi-format-align-justify
                      </v-icon>
                    </v-col>
                    <v-col
                      v-show="props.fieldType !== 'array'"
                      class="pt-5"
                      cols="5"
                    >
                      <v-btn size="small" variant="outlined" class="py-0" block @click="openKeyMenu(element.key)">
                        {{ element.key }}
                      </v-btn>
                    </v-col>
                    <v-col class="py-0">
                      <v-text-field
                        v-if="typeof modelValue[element.key] === 'string'"
                        v-model="modelValue[element.key]"
                        class="mb-1"
                        :label="getArrayObjectLabel(element.key)"
                        v-bind="props.bindings"
                        placeholder="Enter value here"
                        hide-details
                      />
                      <v-checkbox
                        v-else-if="typeof modelValue[element.key] === 'boolean'"
                        :key="`select-${element.key}`"
                        v-model="modelValue[element.key]"
                        class="mb-1"
                        hide-details
                        :label="getArrayObjectLabel(element.key)"
                        v-bind="props.bindings"
                      />
                      <vue-number-input
                        v-else-if="isNumber(modelValue[element.key])"
                        :key="`number-${element.key}`"
                        v-model="modelValue[element.key]"
                        :step=".1"
                        class="mt-3"
                        controls
                        size="medium"
                        v-bind="props.bindings"
                      />
                    </v-col>
                    <v-col class="pt-4" cols="1">
                      <v-btn variant="text" size="small" icon @click="state.removeField = element.key">
                        <v-icon size="x-large">
                          mdi-delete
                        </v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-container>
              </div>
            </template>
          </draggable>

          <v-dialog
            v-model="removeFieldDialogShow"
            persistent
            max-width="600"
            transition="fade-transition"
          >
            <v-card>
              <v-toolbar density="compact" flat>
                <v-icon class="mx-4">
                  mdi-delete
                </v-icon>
                Delete "{{ getArrayObjectLabel (state.removeField) }}"
                <v-spacer />

                <v-btn
                  type="submit"
                  color="primary"
                  icon
                  @click="state.removeField = null"
                >
                  <v-icon> mdi-close</v-icon>
                </v-btn>
              </v-toolbar>
              <v-card-title>Are you sure you want to delete "{{ getArrayObjectLabel(state.removeField) }}"?</v-card-title>
              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="blue-darken-1"
                  variant="text"
                  @click="state.removeField = null"
                >
                  Cancel
                </v-btn>
                <v-btn
                  type="submit"
                  color="error"
                  variant="text"
                  @click="removeField(state.removeField)"
                >
                  Delete
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-card-text>
      </v-card>
    </template>
    <template v-if="props.fieldType === 'objectList'">
      <v-card :rounded="0" flat class="fill-height">
        <v-card-text class="pa-0">
          <v-toolbar density="compact" color="transparent" flat>
            <v-toolbar-title>{{ props.label }}</v-toolbar-title>
            <v-spacer />
            <component :is="`form-subtypes-${props.subFieldType}`" v-model:items="modelValue" :pass-through-props="passThroughProps" />
            <helper v-if="props.helper" :helper="props.helper" />
          </v-toolbar>
          <v-list class="mt-0 pt-0" bg-color="transparent">
            <draggable
              v-model="modelValue"
              handle=".handle"
              item-key="id"
            >
              <template #item="{ element, index }">
                <div>
                  <component :is="`form-subtypes-${props.subFieldType}`" v-model:items="modelValue" :item="element" :pass-through-props="passThroughProps" />
                  <v-fade-transition>
                    <v-alert v-if="isTracked && state.afterMount && (JSON.stringify(modelValue[index]) !== JSON.stringify(edgeGlobal.edgeState.changeTracker[state.trackerKey][state.objectListOriginalOrder[element.id]]))" class="mt-0 mb-3 text-caption" density="compact" variant="tonal" type="warning">
                      <v-row dense class="pa-0 ma-0">
                        <v-col v-if="props.fieldType === 'objectList'">
                          This item has been modified
                        </v-col>
                        <v-col v-else>
                          Modified from "{{ originalCompare }}"
                        </v-col>
                        <v-col cols="4" class="text-right">
                          <v-btn variant="tonal" class="ml-8" size="x-small" @click="modelValue[index] = edgeGlobal.edgeState.changeTracker[state.trackerKey][state.objectListOriginalOrder[element.id]]">
                            Undo
                          </v-btn>
                          <!-- <v-btn v-else variant="text" class="ml-8" size="x-small" @click="modelValue = edgeState.changeTracker[state.trackerKey]">
                            Undo
                          </v-btn> -->
                        </v-col>
                      </v-row>
                    </v-alert>
                  </v-fade-transition>
                  <v-divider
                    inset
                  />
                </div>
              </template>
            </draggable>
          </v-list>
        </v-card-text>
      </v-card>
      <v-input
        v-model="modelValue"
        density="compact"
        :rules="props.rules"
        v-bind="props.bindings"
      />
    </template>
    <v-fade-transition>
      <v-alert v-if="isTracked && state.afterMount && (modelCompare !== originalCompare)" class="mt-0 mb-3 text-caption" density="compact" variant="tonal" type="warning">
        <v-row dense class="pa-0 ma-0">
          <template v-if="props.fieldType === 'objectList' || props.fieldType === 'object' || props.fieldType === 'array' || returnObject">
            <v-col>
              {{ props.label }} has been modified
            </v-col>
            <v-btn variant="tonal" class="ml-8" size="x-small" @click="undo()">
              Undo All
            </v-btn>
          </template>
          <template v-else>
            <v-col v-if="props.fieldType === 'collection'">
              <template v-if="props.collectionTitleField !== props.collectionValueField">
                Modified to "{{ collectionItem(modelValue) }}"
              </template>
              <template v-else>
                Modified from "{{ originalCompare }}" to "{{ modelValue }}"
              </template>
            </v-col>
            <v-col v-else-if="props.fieldType === 'users'">
              Modified to "{{ userItem(modelValue) }}"
            </v-col>
            <v-col v-else>
              Modified from "{{ originalCompare }}" to "{{ modelValue }}"
            </v-col>
            <v-col cols="4" class="text-right">
              <v-btn variant="tonal" class="ml-8" size="x-small" @click="undo()">
                Undo
              </v-btn>
            </v-col>
          </template>
        </v-row>
      </v-alert>
    </v-fade-transition>
  </div>
</template>

<style lang="scss">
.vue-number-input input {
  background-color: transparent !important;
}
.pointer {
  cursor: move;
}
</style>
