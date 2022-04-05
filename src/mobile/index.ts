import { App } from 'vue'
import {
    Button,
    Cell,
    CellGroup,
    Col,
    Collapse,
    CollapseItem,
    Icon,
    IndexAnchor,
    IndexBar,
    List,
    NavBar,
    Row,
    Search,
    Tabbar,
    TabbarItem,
} from 'vant'

export function init(app: App<Element>) {
    console.debug(app)
    app.use(Tabbar)
    app.use(List)
    app.use(TabbarItem)
    app.use(Row)
    app.use(Col)
    app.use(Collapse)
    app.use(CollapseItem)
    app.use(Button)
    app.use(Cell)
    app.use(CellGroup)
    app.use(IndexBar)
    app.use(IndexAnchor)
    app.use(Search)
    app.use(NavBar)
    app.use(Icon)
}
