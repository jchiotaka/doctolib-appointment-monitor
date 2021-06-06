import ImpfDaemon from "./services/daemon.service";
import { berlinConfig } from "./configs/berlin.config";


(new ImpfDaemon(berlinConfig)).start().then(
  (result) => console.log(result)
).catch((error) => console.log(error));