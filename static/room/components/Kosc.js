
export default class Kosc {
    constructor(selector, imgs) {
        this.ref = document.querySelector(selector);
        this.imgsPath = imgs;
        this.button = document.createElement('button');
        this.button.innerHTML = "Rzuć kostką!"
        this.button.addEventListener('click', () => this.buttonHandler());
        this.img = document.createElement('img');
        this.canRemoveImage = false;
        this.synth = window.speechSynthesis;

        const Syntezator = () => {
            this.voice = this.synth.getVoices().find(v => v.lang == "pl-PL");
        }
        this.synth.onvoiceschanged = Syntezator;
        Syntezator();
    }

    update({ room, gracz }) {
        if (room.focusPlayer && room.focusPlayer.color == gracz.color) {
            this.ref.innerHTML = '';
            this.isRolling = true;
            if (room.focusPlayer.movesToMake) {
                this.img.src = `${this.imgsPath}k${room.focusPlayer.movesToMake}.png`;
                this.ref.appendChild(this.img);
            } else {
                this.ref.appendChild(this.button);
            }
        } else {
            if (this.canRemoveImage) {
                this.ref.innerHTML = '';
                this.canRemoveImage = false;
            }
        }
    }

    speak(value) {
        const utterance = new SpeechSynthesisUtterance(value.toString());
        utterance.voice = this.voice;
        this.synth.speak(utterance);
    }

    async buttonHandler() {
        const data = await fetch('/api/room/kosc');
        const { movesToMake } = await data.json();
        this.img.src = `${this.imgsPath}k${movesToMake}.png`;
        this.speak(movesToMake);
        this.ref.prepend(this.img);
        this.button.remove();
        setTimeout(() => this.canRemoveImage = true, 2000);
    }
}