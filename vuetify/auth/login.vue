<script setup>
import { computed, defineProps, inject, onMounted, reactive } from 'vue'
const props = defineProps({
  providers: {
    type: Array,
    default: () => ['email', 'microsoft'],
  },
})

const route = useRoute()

const edgeFirebase = inject('edgeFirebase')
const edgeGlobal = inject('edgeGlobal')

const state = reactive({
  form: false,
  form2: false,
  phone: '',
  email: '',
  password: '',
  passwordVisible: false,
  passwordShow: false,
  panel: '',
  phoneConfirmDialog: false,
  phoneNumber: null,
  phoneCode: '',
  forgotPasswordDialog: false,
  passwordResetResult: { success: null, message: '' },
  passwordResetSent: false,
  passwordResetDialog: false,
})

const multipleProviders = computed(() => props.providers.length > 1)

const login = reactive({
  email: '',
  password: '',
})

const sendPhoneCode = async () => {
  state.phoneNumber = await edgeFirebase.sendPhoneCode(`${state.phone}`)
  if (state.phoneNumber !== false) {
    state.phoneConfirmDialog = true
  }
}

const phoneLogin = async () => {
  await edgeFirebase.logInWithPhone(state.phoneNumber, state.phoneCode)
}

const submitForgotPassword = async () => {
  const result = await edgeFirebase.sendPasswordReset(login.email)
  state.passwordResetResult = result
  state.passwordResetSent = true
}

const onSubmit = async () => {
  if (state.panel === 'email') {
    await edgeFirebase.logIn(login)
  }
  else if (state.panel === 'phone') {
    await sendPhoneCode()
  }
}

const resetPassword = async () => {
  let result = null
  if (route.query.mode === 'resetPassword') {
    result = await edgeFirebase.passwordReset(login.password, route.query.oobCode)
  }
  if (route.query.mode !== 'resetPassword') {
    result = await edgeFirebase.emailUpdate(route.query.oobCode)
  }
  state.passwordResetResult = result
}

onMounted(async () => {
  state.panel = props.providers[0]
  if (route.query.oobCode) {
    await edgeFirebase.logOut()
    state.passwordResetDialog = true
  }
})
</script>

<template>
  <logging-in v-if="edgeFirebase.user.loggingIn !== false || edgeFirebase.user.loggedIn" />

  <v-card v-else flat class="mx-auto px-0 py-8" title="Login" max-width="344">
    <v-form
      v-model="state.form"
      @submit.prevent="onSubmit"
    >
      <v-expansion-panels v-model="state.panel">
        <v-expansion-panel v-for="provider in props.providers" :key="provider" elevation="0" :value="provider">
          <v-expansion-panel-title v-if="multipleProviders" expand-icon="mdi-square-outline" class="py-0" collapse-icon="mdi-check">
            <template v-if="provider === 'email'">
              Sign in with Email
            </template>
            <template v-if="provider === 'microsoft'">
              Sign in with Microsoft
            </template>
            <template v-if="provider === 'phone'">
              Sign in with Phone
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <template v-if="provider === 'email'">
              <v-text-field
                v-model="login.email"
                :rules="[edgeGlobal.edgeRules.email]"
                class="mb-2"
                label="Email"
                variant="underlined"
              />

              <v-text-field
                v-model="login.password"
                :rules="[edgeGlobal.edgeRules.required]"
                :type="state.passwordShow ? 'text' : 'password'"
                label="Password"
                placeholder="Enter your password"
                variant="underlined"
                :append-inner-icon="state.passwordShow ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="state.passwordShow = !state.passwordShow"
              />
              <v-btn
                :disabled="!state.form"
                color="success"
                type="submit"
                block
              >
                Sign In
              </v-btn>
              <v-btn
                v-if="provider === 'email'"
                class="mt-4"
                color="primary"
                text
                block
                @click="state.forgotPasswordDialog = true"
              >
                Forgot Password?
              </v-btn>
            </template>
            <template v-if="provider === 'phone'">
              <g-input
                v-model="state.phone"
                :disable-tracking="true"
                field-type="text"
                :rules="[edgeGlobal.edgeRules.required]"
                label="Phone Number"
                :mask-options="{ mask: '(###) ###-####' }"
              />
              <v-btn
                :disabled="!state.form"
                color="success"
                type="submit"
                block
              >
                Sign In
              </v-btn>
            </template>
            <template v-if="provider === 'microsoft'">
              <v-btn color="success" block @click="edgeFirebase.logInWithMicrosoft()">
                Sign in with Microsoft
              </v-btn>
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-form>
    <g-error v-if="edgeFirebase.user.logInError" :error="edgeFirebase.user.logInErrorMessage" />
    <v-divider
      class="my-4"
    />
    Don't have an account?
    <v-btn color="success" small block to="/app/signup">
      Sign up here.
    </v-btn>
    <v-dialog
      v-model="state.passwordResetDialog"
      persistent
      max-width="400"
      transition="fade-transition"
    >
      <v-card>
        <v-form
          v-model="state.form2"
          validate-on="submit"
          @submit.prevent="resetPassword"
        >
          <v-toolbar flat>
            <v-icon class="mx-4">
              mdi-lock-reset
            </v-icon>
            <span v-if="route.query.mode === 'resetPassword'">
              Reset Password

            </span>
            <span v-else>
              Update Email Address
            </span>
            <v-spacer />

            <v-btn
              icon
              @click="state.passwordResetDialog = false"
            >
              <v-icon> mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text>
            <p v-if="route.query.mode === 'resetPassword'" class="mb-2">
              Enter your new password below and click "Reset Password".
            </p>
            <p v-else class="mb-2">
              To update your email address, click "Update Email Address".
            </p>
            <p class="mb-2">
              This will change your email address to the address that received the email with the link you clicked on to get here.
            </p>
            <v-text-field
              v-if="route.query.mode === 'resetPassword'"
              v-model="login.password"
              :rules="[edgeGlobal.edgeRules.required]"
              :type="state.passwordShow ? 'text' : 'password'"
              label="Password"
              placeholder="Enter your password"
              variant="underlined"
              :append-inner-icon="state.passwordShow ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="state.passwordShow = !state.passwordShow"
            />
            <g-error v-if="state.passwordResetResult.success === false" :error="state.passwordResetResult.message" />
            <v-alert v-if="state.passwordResetResult.success === true" color="success" class="mt-0 mb-3 text-caption" density="compact" variant="tonal" border="start">
              <span v-if="route.query.mode === 'resetPassword'">
                Your password has been reset. Close this dialog and log in with your new password.
              </span>
              <span v-else>
                Your email address has been updated. Close this dialog and log in with your updated address.
              </span>
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              v-if="state.passwordResetResult.success === true"
              color="success" variant="text"
              @click="state.passwordResetDialog = false"
            >
              Close
            </v-btn>
            <v-btn
              v-else
              color="blue-darken-1"
              variant="text"
              @click="state.passwordResetDialog = false"
            >
              Cancel
            </v-btn>
            <v-btn
              v-if="state.passwordResetResult.success !== true"
              type="submit"
              color="error"
              variant="text"
            >
              <span v-if="route.query.mode === 'resetPassword'">
                Reset Password
              </span>
              <span v-else>
                Update Email Address
              </span>
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="state.forgotPasswordDialog"
      persistent
      max-width="400"
      transition="fade-transition"
    >
      <v-card>
        <v-form
          v-model="state.form2"
          validate-on="submit"
          @submit.prevent="submitForgotPassword"
        >
          <v-toolbar flat>
            <v-icon class="mx-4">
              mdi-lock-reset
            </v-icon>
            Forgot Password
            <v-spacer />

            <v-btn
              icon
              @click="state.forgotPasswordDialog = false"
            >
              <v-icon> mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text>
            <p class="mb-2">
              If you forgot your password, please enter your email address below and click "Send Password Reset".
            </p>
            <v-text-field
              v-model="login.email"
              class="mt-4"
              :rules="[edgeGlobal.edgeRules.required]"
              label="Email"
              variant="underlined"
            />
            <v-alert v-if="state.passwordResetSent" color="success" class="mt-0 mb-3 text-caption" density="compact" variant="tonal" border="start">
              If you entered the correct email address, a password reset email has been sent to your email address. Please check your email and click the link to reset your password.
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              v-if="state.passwordResetSent === true"
              variant="text"
              @click="state.forgotPasswordDialog = false"
            >
              Close
            </v-btn>
            <v-btn
              v-else
              color="blue-darken-1"
              variant="text"
              @click="state.forgotPasswordDialog = false"
            >
              Cancel
            </v-btn>
            <v-btn
              v-if="state.passwordResetSent === false"
              type="submit"
              color="error"
              variant="text"
            >
              Send Password Reset
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="state.phoneConfirmDialog"
      persistent
      max-width="600"
      transition="fade-transition"
    >
      <v-card>
        <v-form
          v-model="state.form2"
          validate-on="submit"
          @submit.prevent="phoneLogin"
        >
          <v-toolbar flat>
            <v-icon class="mx-4">
              mdi-list-box
            </v-icon>
            Enter Confirmation Code
            <v-spacer />

            <v-btn
              color="primary"
              icon
              @click="state.phoneConfirmDialog = false"
            >
              <v-icon> mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-title>Enter Confirmation Code</v-card-title>
          <v-card-text>
            Please enter the confirmation code that you received via text message. This code is used to verify your phone number. If you did not receive a text message, please confirm that your phone number is correct and request a new code.
            <v-text-field
              v-model="state.phoneCode"
              :rules="[edgeGlobal.edgeRules.required]"
              color="primary"
              label="Confirmation Code"
              variant="underlined"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="blue-darken-1"
              variant="text"
              @click="state.phoneConfirmDialog = false"
            >
              Cancel
            </v-btn>
            <v-btn
              type="submit"
              color="error"
              variant="text"
            >
              Submit
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style lang="scss" scoped>
</style>
