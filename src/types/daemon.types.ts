export interface Options {
    elementTimeout?: number,
    elementTimeoutOffset?: number,
    delayAfterAppointmentFound?: number,
    windowHeight?: number,
    windowWidth?: number,
    expandScopeToNext?: boolean,
    host?: string,
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
