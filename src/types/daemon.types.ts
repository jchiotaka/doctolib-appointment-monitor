export interface Options {
    elementTimeout?: number,
    elementTimeoutOffset?: number,
    delayAfterAppointmentFound?: number,
    windowHeight?: number,
    windowWidth?: number,
    expandScopeToNext?: boolean,
}

export interface Source {
    bookingLink: string,
    options?: Options,
    selects?: Element[],
    inputs?: Element[],
}

export interface Element {
    selector: string,
    value: string,
}

export interface Sources {
    sources: Source[],
    options?: Options,
}

export enum Alerts {
    LOUD,
    QUIET,
    TAP,
    READY,
}