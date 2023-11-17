<script setup>
import { computed, defineProps, inject, onMounted, reactive } from 'vue'

const props = defineProps({
  providers: {
    type: Array,
    default: () => ['email', 'microsoft'],
  },
})
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
  console.log(login.email)
  const result = await edgeFirebase.sendPasswordReset(login.email)
  state.passwordResetResult = result
  state.forgotPasswordDialog = false
}

const onSubmit = async () => {
  if (state.panel === 'email') {
    await edgeFirebase.logIn(login)
  }
  else if (state.panel === 'phone') {
    await sendPhoneCode()
  }
}
onMounted(() => {
  state.panel = props.providers[0]
})
</script>

<template>
  <logging-in v-if="edgeFirebase.user.loggingIn !== false || edgeFirebase.user.loggedIn" />

  <v-card v-else flat class="mx-auto px-6 py-8" title="Login" max-width="344">
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
      v-model="state.forgotPasswordDialog"
      persistent
      max-width="600"
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
            <p>If you entered the correct email, you will receive an email with a link to reset your password.</p>
            <v-text-field
              v-model="login.email"
              class="mt-4"
              :rules="[edgeGlobal.edgeRules.required]"
              label="Email"
              variant="underlined"
            />
            <g-error v-if="state.passwordResetResult.success === false" :error="state.passwordResetResult.message" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="blue-darken-1"
              variant="text"
              @click="state.forgotPasswordDialog = false"
            >
              Cancel
            </v-btn>
            <v-btn
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
