import puppeteer, {BrowserLaunchArgumentOptions} from "puppeteer";
import { Browser } from "puppeteer";
import {Options} from "../types/daemon.types";

export default class BrowserService {
    private options;

    constructor(options: Options) {
        this.options = options;
    }

    async initializeBrowserInstance(options?: BrowserLaunchArgumentOptions): Promise<Browser> {
        if (this.options.host) {
            return puppeteer.connect({
                browserWSEndpoint: this.options.host,
            })
        } else {
            const args = [
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                `--window-size=${this.options.windowWidth},${this.options.windowHeight}`,
              ];
            return puppeteer.launch(
                {
                    headless: false,
                    defaultViewport: {
                        width: 768,
                        height: 1024,
                    },
                    args,
                    ...options,
                });
        }
    }
}