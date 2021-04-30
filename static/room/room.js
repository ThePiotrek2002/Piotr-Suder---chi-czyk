import Lista_Graczy from "./components/Lista_Graczy.js";
import Kosc from "./components/Kosc.js";
import Plansza from "./components/Plansza.js";

class MasterClass {
    constructor() {
        this.playerBar = new Lista_Graczy(".gracze");
        this.plansza = new Plansza('.plansza', '/img/plansza.png');
        this.kosc = new Kosc('.kosc', '/img/kosc/');
    }

    init() {
        const callback = async () => {
            const data = await fetch('/api/room/status');
            const status = await data.json();
            this.plansza.update(status);
            this.kosc.update(status);
            this.playerBar.update(status);
            
        }
        callback();
        this.interval = setInterval(callback, 1000);
    }
}

const root = new MasterClass();
root.init();
