export default class Lista_Graczy {
    constructor(selector) {
        this.ref = document.querySelector(selector);
        this.play_bt = this.ref.querySelector('.play_bt');
        this.play_bt.addEventListener("click", () => this.readyBtnClick());
        this.ready = false;
    }

    readyBtnClick() {
        fetch('/api/gracz/status', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ready: !this.ready
            })
        })
    }

    update({ room, gracz }) {
        const playerRefs = this.ref.querySelectorAll('.gracz');
        playerRefs.forEach(ref => {
            ref.remove();
        });

        const frag = document.createDocumentFragment();
        room.gracze.forEach(gracz => {
            const div = document.createElement('div');
            div.classList.add('gracz');
            div.style.backgroundColor = '#141414';
            div.style.color = '#ffffff';
            div.style.border = 'solid #ffffff';
            if (gracz.ready) {
                div.style.backgroundColor = gracz.color;
                div.style.color = 'black';
                div.style.border = 'none';
            }
            div.innerHTML = gracz.login;
            frag.appendChild(div);
        });
        this.ref.appendChild(frag);

        this.ready = gracz.ready;
        this.play_bt.innerHTML = gracz.ready ? "Naciśnij, by zaczekać na innych" : "Naciśnij, by zagrać";

        if (room.active) {
            this.play_bt.remove();
        }
    }
}