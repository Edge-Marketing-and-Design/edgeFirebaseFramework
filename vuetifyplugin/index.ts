import * as edgeGlobal from '../global'
import * as vuetifyComponents from '../vuetify'

export function getComponents(): typeof vuetifyComponents {
  return vuetifyComponents
}

export default {
  install: async (app: any) => {
    app.provide('edgeGlobal', edgeGlobal)
    const edgeComponents: any = getComponents()
    Object.keys(edgeComponents).forEach((componentName) => {
      app.component(componentName, edgeComponents[componentName])
    })
  },
}
