<script setup>
import { defineProps, inject, onBeforeMount, watch } from 'vue'

import login from './auth/login.vue'
import register from './auth/register.vue'
const props = defineProps({
  type: {
    type: String,
    default: 'login',
  },
  registrationCode: {
    type: String,
    default: '',
  },
  providers: {
    type: Array,
    default: () => ['email'],
  },
  title: {
    type: String,
    default: 'Organization',
  },
  joinMessage: {
    type: String,
    default: 'Join an existing organization',
  },
  termsLinks: {
    type: String,
    default: '',
  },
  singleOrganization: {
    type: Boolean,
    default: false,
  },
  showRequestedOrgId: {
    type: Boolean,
    default: false,
  },
  requestedOrgIdLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:auth'])

const edgeFirebase = inject('edgeFirebase')
const edgeGlobal = inject('edgeGlobal')

const doLogin = async () => {
  edgeGlobal.edgeState.user = edgeFirebase.user
  emit('update:auth', edgeFirebase.user)
  if (edgeFirebase.user.loggedIn) {
    await edgeGlobal.getOrganizations(edgeFirebase)
    const storedOrganization = localStorage.getItem('organizationID')
    if (storedOrganization && edgeGlobal.edgeState.organizations.some(org => org.docId === storedOrganization)) {
      await edgeGlobal.setOrganization(storedOrganization, edgeFirebase)
    }
    else if (edgeGlobal.edgeState.currentOrganization) {
      await edgeGlobal.setOrganization(edgeGlobal.edgeState.currentOrganization, edgeFirebase)
    }
    else if (edgeGlobal.edgeState.organizations.length > 0) {
      await edgeGlobal.setOrganization(edgeGlobal.edgeState.organizations[0].docId, edgeFirebase)
    }
  }
}
onBeforeMount(() => {
  doLogin()
})
watch(edgeFirebase.user, async () => {
  doLogin()
})
</script>

<template>
  <v-container style="height: calc(100vh - 150px); overflow: scroll;" fluid>
    <v-row align="center" class="fill-height" justify="center">
      <v-col cols="12" class="center-align">
        <v-card
          class="mx-auto fill-height"
          max-width="500"
          variant="flat"
        >
          <v-container>
            <v-row
              class="fill-height"
              align-content="center"
              justify="center"
            >
              <v-col
                class="text-center"
                cols="12"
              >
                <login
                  v-if="props.type === 'login'"
                  :providers="props.providers"
                />
                <register
                  v-else-if="props.type === 'register'"
                  :single-organization="props.singleOrganization"
                  :registration-code="props.registrationCode"
                  :title="props.title"
                  :join-message="props.joinMessage"
                  :providers="props.providers"
                  :terms-links="props.termsLinks"
                  :show-requested-org-id="props.showRequestedOrgId"
                  :requested-org-id-label="props.requestedOrgIdLabel"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>

</style>
