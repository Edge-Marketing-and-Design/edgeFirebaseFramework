// DO NOT EDIT
import { computed, inject, reactive } from 'vue'

export const edgeState = reactive({
  currentOrganization: '',
  organizationDocPath: '',
  organizations: [],
  changeTracker: {},
  user: null,
  userRoles: [],
})

export const setOrganization = async (organization: string, edgeFirebase: any) => {
  if (organization) {
    edgeState.changeTracker = {}
    localStorage.setItem('organizationID', organization)
    edgeState.currentOrganization = organization
    await edgeFirebase.startUsersSnapshot(`organizations/${organization}`)
    edgeState.organizationDocPath = `organizations/${organization}`
  }
}

export const isDarkMode = () => {
  if (window.matchMedia) {
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)')
    return darkMode.matches
  }
  return false
}

export const generateShortId = () => {
  return Math.random().toString(36).substr(2, 6)
}

export const objHas = (obj: any, key: string): boolean => {
  if (obj === null || obj === undefined) {
    return false
  }
  return Object.prototype.hasOwnProperty.call(obj, key)
}

export const getOrganizations = async (edgeFirebase: any) => {
  console.log('getOrganizations')
  const orgs: any = []
  if (edgeFirebase.user.loggedIn) {
    for (const role of edgeFirebase.user.roles) {
      const segments = role.collectionPath.split('-')
      if (segments[0] === 'organizations' && segments.length === 2) {
        // TODO:  NEED TO MAKE startDocumentSnapshot acctually await
        await edgeFirebase.startDocumentSnapshot('organizations', segments[1])
        const org = await edgeFirebase.getDocData('organizations', segments[1])
        orgs.push(org)
      }
    }
  }
  edgeState.organizations = orgs
}

export const dupObject = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj))
}

export const currentOrganizationObject = computed(() => {
  const edgeFirebase: any = inject('edgeFirebase')
  if (edgeState.organizations.length > 0) {
    if (edgeState.currentOrganization) {
      return edgeFirebase.data[`organizations/${edgeState.currentOrganization}`]
    }
  }
  return ''
})

export const edgeRules = {
  forms: (value: any) => {
    if (!value.length) {
      return 'You must setup at least one form.'
    }
    return true
  },
  submits: (value: any) => {
    if (!value.length) {
      return 'You must setup at least one submit.'
    }
    return true
  },
  domains: (value: string) => {
    const domainPattern = /^https?:\/\/(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+(\.[a-zA-Z]{2,6})?(:\d{1,5})?$/i
    const localhostPattern = /^https?:\/\/localhost(:\d{1,5})?$/i
    const ipAddressPattern = /^https?:\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d{1,5})?$/
    const domains = value.split(',')
    for (const domain of domains) {
      if (
        !domainPattern.test(domain)
        && !localhostPattern.test(domain)
        && !ipAddressPattern.test(domain)
      ) {
        return `"${domain}" is not a valid domain or IP address. The domain or IP address must include the protocol (http or https).`
      }
    }
    return true
  },
  required: (value: any) => {
    if (typeof value === 'string' && !value) {
      return 'This field is required.'
    }
    else if (Array.isArray(value) && value.length === 0) {
      return 'This field is required.'
    }
    else if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
      return 'This field is required.'
    }
    else if (typeof value === 'boolean' && !value) {
      return 'This field is required.'
    }
    return true
  },
  email: (value: string) => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return pattern.test(value) || 'Invalid e-mail.'
  },
  emailOrField: (value: string) => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return pattern.test(value) || (value.startsWith('{{') && value.endsWith('}}')) || `Invalid e-mail or field. If you want to use a field, it must be wrapped in double curly braces, e.g. {{${value}}}`
  },
  toEmails: (value: string) => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    const emails = value.split(',')
    for (const email of emails) {
      if (!pattern.test(email)) {
        return `"${email}" is not a valid email address`
      }
    }
    return true
  },
  emailsOrFields: (value: string) => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    const emails = value.split(',')
    for (const email of emails) {
      if (!pattern.test(email) && !(email.startsWith('{{') && email.endsWith('}}'))) {
        return `"${email}" is not a valid email address or field. If you want to use a field, it must be wrapped in double curly braces, e.g. {{${email}}}`
      }
    }
    return true
  },
  password: (value: string) => {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return pattern.test(value) || 'Password must have at least 8 characters, including uppercase and lowercase letters, numbers, and a special character'
  },
}

export const edgeLogOut = async (edgeFirebase: any) => {
  edgeState.currentOrganization = ''
  edgeState.organizationDocPath = ''
  edgeState.organizations = []
  edgeState.changeTracker = {}
  edgeState.user = null
  await edgeFirebase.logOut()
}

interface UserRoleType {
  name: string
  roles: { collectionPath: string; role: string }[]
}

interface RoleType {
  collectionPath: string
  role: string
}

export const orgUserRoles = (orgId: string) => {
  orgId = orgId.replaceAll('/', '-')
  const orgPath = `organizations-${orgId}`
  // Create a copy of the data to avoid mutating the original array
  const newData = JSON.parse(JSON.stringify(edgeState.userRoles))

  // Iterate over each object in the array
  for (let i = 0; i < newData.length; i++) {
    const roles = newData[i].roles

    // Iterate over each role in the roles array
    for (let j = 0; j < roles.length; j++) {
      const role = roles[j]

      // Replace 'organizationDocPath' in the collectionPath property with orgName
      role.collectionPath = role.collectionPath.replace(/organizationDocPath/g, orgPath)
    }
  }

  return newData
}

export const getRoleName = (roles: RoleType[], orgId: string) => {
  const userRoles: UserRoleType[] = orgUserRoles(orgId)
  for (const user of userRoles) {
    let match = true
    for (const userRole of user.roles) {
      if (!roles.some(role => role.collectionPath === userRole.collectionPath && role.role === userRole.role)) {
        match = false
        break // exit the loop as soon as a non-match is found
      }
    }
    if (match) {
      return user.name
    }
  }
  return 'Unknown'
}
