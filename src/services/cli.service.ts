import cliProgress, { MultiBar, SingleBar } from 'cli-progress'
import colors from 'colors';

export default class CliService {
    bar: MultiBar;

    constructor() {
        const barFormat = {
            format: `${colors.cyan('{bar}')} {value}/{total} \t retries: {refreshCount}\t heap: {metrics} \t ${colors.gray('{status}')}`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        };

        this.bar = new cliProgress.MultiBar({
            clearOnComplete: false,
            hideCursor: true

        }, barFormat);
    }

    create(total: number, start: number): SingleBar {
        return this.bar.create(total, start);
    }

    stop() {
        this.bar.stop();
    }
}