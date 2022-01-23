import { Setting } from '@element-plus/icons-vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import { App } from 'vue'

export function init(app: App<Element>) {
    app.component(Setting.name, Setting)
    app.use(ElementPlus)
}
