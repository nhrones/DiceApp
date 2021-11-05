
/** Subscription Object type */
export type SubscriptionObject = {
    callback: Function
    onlyOnce: boolean
}


/** View interface */
export interface View {

    id: number
    activeView: boolean
    index: number
    zOrder: number
    name: string
    geometry: Geometry
    enabled: boolean
    hovered: boolean
    selected: boolean
    path: Path2D

    update(): void
    render(state?: any): void
    touched(broadcast: boolean, x: number, y: number): void

}

/** a type used to contain the values    
 * required to build an `ActiveView` object 
 */
export type ElementDescriptor = {
    kind: string
    id: string
    idx: number | null
    pathGeometry: Geometry
    renderAttributes: RenderAttributes
}

/** a type used to contain a set of optional attributes   
 * that are used to configure a rendering context   
 * strokeColor, fillColor, fontColor, fontSize, borderWidth, text
 */
export type RenderAttributes = {
    strokeColor?: string
    color?: string
    fontColor?: string
    fontSize?: string
    borderWidth?: number
    text?: string
    isLeft?: boolean
}

/** a type that prescribes the geometry used   
 * to locate and size a Path2D object      
 * (used to render and hit-test a unique shape on a canvas)
 */
export type Geometry = {
    left: number
    top: number
    width: number
    height: number
    radius?: number
}

/** a type that describes a Player onject */
export type Player = {
    id: string
    idx: number
    playerName: string
    color: string
    score: number
    lastScore: string
}

export const LabelState = {
    Normal: 0,
    Hovered: 1,
    HoveredOwned: 2,
    Reset: 3 
}
