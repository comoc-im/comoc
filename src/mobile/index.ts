import { App } from 'vue'
import {
    Cell,
    CellGroup,
    IndexAnchor,
    IndexBar,
    List,
    Search,
    Tabbar,
    TabbarItem,
} from 'vant'

export function init(app: App<Element>) {
    console.debug(app)
    app.use(Tabbar)
    app.use(List)
    app.use(TabbarItem)
    app.use(Cell)
    app.use(CellGroup)
    app.use(IndexBar)
    app.use(IndexAnchor)
    app.use(Search)
}
