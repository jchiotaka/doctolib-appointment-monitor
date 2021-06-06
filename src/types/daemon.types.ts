export interface Options {
    elementTimeout?: number,
    delayAfterAppointmentFound?: number,
    windowHeight?: number,
    windowWidth?: number,
    expandScopeToNext?: boolean,
    host?: string,
    maxHeapSize?: number,
    overkill?: boolean,
}

export interface Source {
    bookingLink: string,
    options?: Options,
    elementsToInteract?: Element[],
}

export interface Element {
    selector: string,
    type: ElementType,
    value: string,
}

export interface Sources {
    sources: Source[],
    options?: Options,
}

export enum ElementType {
    SELECT,
    INPUT,
    BUTTON,
}
