<script setup>
import { computed, inject, nextTick, onBeforeMount, reactive, watch } from 'vue'

const edgeFirebase = inject('edgeFirebase')
const edgeGlobal = inject('edgeGlobal')

const state = reactive({
  username: '',
  newPassword: '',
  oldPassword: '',
  passwordForm: false,
  userForm: false,
  loaded: true,
  passwordVisible: false,
  passwordShow: false,
  passwordError: { success: true, message: '' },
  userError: { success: true, message: '' },
})
const updateUser = async (event) => {
  const results = await event
  if (results.valid) {
    state.userError = await edgeFirebase.updateEmail(state.username)
    if (state.userError.message === 'Firebase: Error (auth/email-already-in-use).') {
      state.userError = { success: false, message: 'Email already in use.' }
    }
    if (state.userError.message === 'Error (auth/requires-recent-login).') {
      state.userError = { success: false, message: 'Please log out and log back in to change your email.' }
    }
    state.userError = { success: state.userError.success, message: state.userError.message.replace('Firebase: ', '').replace(' (auth/invalid-email)', '') }
    if (state.userError.success) {
      state.userError = { success: true, message: 'Email successfully changed' }
    }
    edgeGlobal.edgeState.changeTracker = {}
    state.loaded = false
    await nextTick()
    state.loaded = true
  }
}
const updatePassword = async (event) => {
  const results = await event
  if (results.valid) {
    state.passwordError = await edgeFirebase.setPassword(state.oldPassword, state.newPassword)
    // TODO - Use gError here
    if (state.passwordError.message === 'Firebase: Error (auth/wrong-password).') {
      state.passwordError = { success: false, message: 'Old Password is incorrect.' }
    }
    state.passwordError = { success: state.passwordError.success, message: state.passwordError.message.replace('Firebase: ', '').replace(' (auth/weak-password)', '') }
    if (state.passwordError.success) {
      state.oldPassword = ''
      state.newPassword = ''
      state.passwordError = { success: true, message: 'Password successfully changed' }
    }
    edgeGlobal.edgeState.changeTracker = {}
    state.loaded = false
    await nextTick()
    state.loaded = true
  }
}
// const onSubmit = async (event) => {
//   const results = await event
//   if (results.valid) {
//     updatePassword()
//     edgeState.changeTracker = {}
//     state.loaded = false
//     await nextTick()
//     state.loaded = true
//   }
// }
const currentOrgName = computed(() => {
  if (edgeGlobal.objHas(edgeFirebase.data, edgeGlobal.edgeState.organizationDocPath) === false) {
    return ''
  }
  return edgeFirebase.data[edgeGlobal.edgeState.organizationDocPath].name
})
onBeforeMount(() => {
  if (edgeFirebase.user.firebaseUser.providerData.length === 0) {
    state.username = edgeFirebase.user.uid
  }
  else {
    state.username = edgeFirebase.user.firebaseUser.providerData[0].email
  }
})
watch(currentOrgName, async () => {
  state.org = currentOrgName.value
  edgeGlobal.edgeState.changeTracker = {}
  state.loaded = false
  await nextTick()
  state.loaded = true
})
</script>

<template>
  <v-card v-if="state.loaded" variant="flat">
    <v-card-text>
      <h3 class="mb-3">
        My Account
      </h3>
      <template v-if="edgeFirebase.user.firebaseUser.providerData.length === 0">
        <v-alert>
          Logged in as:
          <v-alert-title>{{ state.username }}</v-alert-title>
          <strong>Custom Provider</strong>
          <v-divider class="my-4" />
          Notice: You're signed in with a custom provider. Nothing to update here.
        </v-alert>
      </template>
      <template v-else-if="edgeFirebase.user.firebaseUser.providerData[0].providerId === 'password'">
        <span class="headline">Update Email</span>
        <v-form
          v-model="state.userForm"
          validate-on="submit"
          @submit.prevent="updateUser"
        >
          <g-input
            v-model="state.username"
            field-type="text"
            :rules="[edgeGlobal.edgeRules.required, edgeGlobal.edgeRules.email]"
            label="Username"
            parent-tracker-id="my-account"
            hint="Update your email address, which also serves as your username."
            persistent-hint
          />
          <v-alert
            v-if="state.userError.message !== ''"
            :type="state.userError.success ? 'success' : 'error'"
            dismissible
            class="mt-0 mb-3 text-caption" density="compact" variant="tonal"
          >
            {{ state.userError.message }}
          </v-alert>

          <v-btn
            type="submit"
            color="secondary"
            variant="text"
          >
            Update Email
          </v-btn>
        </v-form>
        <v-divider class="my-4" />
        <v-form
          v-model="state.passwordForm"
          validate-on="submit"
          @submit.prevent="updatePassword"
        >
          <span class="headline">Change Password</span>

          <v-text-field
            v-model="state.oldPassword"
            :rules="[edgeGlobal.edgeRules.required]"
            :type="state.passwordShow ? 'text' : 'password'"
            label="Old Password"
            placeholder="Enter your old password"
            variant="underlined"
            :append-inner-icon="state.passwordShow ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="state.passwordShow = !state.passwordShow"
          />
          <v-text-field
            v-model="state.newPassword"
            :rules="[edgeGlobal.edgeRules.password]"
            :type="state.passwordShow ? 'text' : 'password'"
            label="New Password"
            placeholder="Enter your new password"
            variant="underlined"
            :append-inner-icon="state.passwordShow ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="state.passwordShow = !state.passwordShow"
          />
          <v-alert
            v-if="state.passwordError.message !== ''"
            :type="state.passwordError.success ? 'success' : 'error'"
            dismissible
            class="mt-0 mb-3 text-caption" density="compact" variant="tonal"
          >
            {{ state.passwordError.message }}
          </v-alert>

          <v-btn
            type="submit"
            color="secondary"
            variant="text"
          >
            Update Password
          </v-btn>
        </v-form>
      </template>
      <template v-else>
        <v-alert>
          Logged in as:
          <v-alert-title>{{ edgeFirebase.user.firebaseUser.providerData[0].email }}</v-alert-title>
          <strong>Provider: {{ edgeFirebase.user.firebaseUser.providerData[0].providerId }}</strong>
          <v-divider class="my-4" />
          Notice: You're signed in with a third-party provider. To update your login information, please visit your provider's account settings. Changes cannot be made directly within this app.
        </v-alert>
      </template>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>

</style>
