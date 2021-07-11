import path from 'path';

import audio from 'sound-play';
import Alerts from '../types/alerts.types';

export default class AlertsService {
  audio;

  constructor() {
    this.audio = audio;
  }

  alert(alertType?: Alerts) {
    let soundFile: string;

    switch (alertType) {
      case Alerts.LOUD:
        soundFile = '../assets/notify.wav';
        break;

      case Alerts.QUIET:
        soundFile = '../assets/subtle.wav';
        break;

      case Alerts.TAP:
        soundFile = '../assets/tap.wav';
        break;

      case Alerts.READY:
        soundFile = '../assets/ready.wav';
        break;

      default:
        soundFile = '../assets/notify.wav';
        break;
    }

    return this.audio.play(path.join(__dirname, soundFile));
  }
}
