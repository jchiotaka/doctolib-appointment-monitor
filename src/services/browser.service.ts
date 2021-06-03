import puppeteer, {BrowserLaunchArgumentOptions} from "puppeteer";
import {Options} from "../types/daemon.types";

export default class BrowserService {
    private options;

    constructor(options: Options) {
        this.options = options;
    }

    async initializeBrowserInstance(options?: BrowserLaunchArgumentOptions) {
        if (this.options.host) {
            return puppeteer.connect({
                browserWSEndpoint: this.options.host,
            })
        } else {
            return puppeteer.launch(
                {
                    headless: true,
                    defaultViewport: null,
                    args: [`--window-size=${this.options.windowWidth},${this.options.windowHeight}`],
                    ...options,
                });
        }
    }
}