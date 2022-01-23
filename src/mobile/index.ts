import { App } from 'vue'
import { List, Tabbar, TabbarItem } from 'vant'

export function init(app: App<Element>) {
    console.debug(app)
    app.use(Tabbar)
    app.use(List)
    app.use(TabbarItem)
}
