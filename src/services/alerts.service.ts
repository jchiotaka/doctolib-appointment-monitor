import { Alerts } from "../types/alerts.types";
import path from 'path';
import Play from 'play-sound';

export default class AlertsService {
    // @ts-ignore
    private audio = new Play();

    alert(alertType?: Alerts) {
        let soundFile: string;
    
        switch (alertType) {
          case Alerts.LOUD:
            soundFile = `../assets/notify.wav`;
            break;
    
          case Alerts.QUIET:
            soundFile = `../assets/subtle.wav`;
            break;
    
          case Alerts.TAP:
            soundFile = `../assets/tap.wav`;
            break;
    
          case Alerts.READY:
            soundFile = `../assets/ready.wav`;
            break;
    
          default:
            soundFile = `../assets/notify.wav`;
            break;
        }
    
        return this.audio.play(path.join(__dirname, soundFile));
      }
}