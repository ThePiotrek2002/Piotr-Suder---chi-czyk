import CORDS from "./offsets.js";

class Pion {
    constructor({ field, home, id }, color) {
        this.id = id;
        this.ref = document.createElement('div');
        this.ref.classList.add('pionek');
        this.ref.style.backgroundColor = color;
        this.field = field;
        this.home = home;
        this.color = color;
        this.ustaw_piona();
        this.indicator = document.createElement('div');
        this.indicator.classList.add('indicator');
    }

    ustaw_piona() {
        let x,y;
        if (this.home) {
            [x, y] = CORDS[this.color].home[this.id];
        } else {
            let cordIndex = this.field + CORDS[this.color].offset;
            if (cordIndex >= CORDS.fields.length) {
                cordIndex -= CORDS.fields.length-1;
            }
            [x, y] = CORDS.fields[cordIndex];
        }
        this.ref.style.left = `${x}%`;
        this.ref.style.top = `${y}%`;
    }

    pion_klik(moves, onClick) {
        fetch('/api/gracz/ruch', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: this.id
            })
        }).then(() => {
            if (this.home) this.home = false;
            else this.field += moves;
            this.ustaw_piona();
            onClick();
        });
    }

    miganie(moves, onClick) {
        this.indicator.style.display = 'none';
        let x,y;
        if (this.home) {
            [x, y] = CORDS.fields[CORDS[this.color].offset];
        } else {
            let cordIndex = this.field + moves + CORDS[this.color].offset;
            if (cordIndex >= CORDS.fields.length) {
                cordIndex -= CORDS.fields.length-1;
            }
            [x, y] = CORDS.fields[cordIndex];
        }

        this.indicator.style.left = `${x}%`;
        this.indicator.style.top = `${y}%`;
        this.indicator.style.backgroundColor = this.color;

        this.ref.addEventListener('click', () => this.pion_klik(moves, onClick));
        this.ref.onmouseover = () => {
            if (this.home) {
                if (moves != 1 && moves != 6) {
                    this.indicator.style.display = 'none';
                    return;
                }
            }

            this.indicator.style.display = 'block';
        };

        this.ref.onmouseleave = () => {
            this.indicator.style.display = 'none';
        };
    }
}

class Piony {
    constructor() {
        this.ref = document.createElement('div');
        this.ref.classList.add('pionki');
        this.pionki = [];
    }

    update({ room, gracz }) {
        this.ref.innerHTML = '';
        this.pionki = [];
        room.gracze.forEach(p => {
            p.pionki.forEach(pionek => {
                const pawnObject = new Pion(pionek, p.color);
                this.ref.appendChild(pawnObject.ref);
                this.pionki.push(pawnObject);
            });
        });

        if (gracz.movesToMake) {
            this.pomigaj(gracz.movesToMake, gracz.color);
        }
    }

    pomigaj(moves, color) {
        const onMove = () => {
            this.pionki.forEach(p => p.indicator.style.display = 'none');
        }
        this.pionki
            .filter(p => p.color == color)
            .forEach(p => {
                p.miganie(moves, onMove);
                this.ref.appendChild(p.indicator);
            });
    }
}


export default class Plansza {
    constructor(selector, background) {
        this.ref = document.querySelector(selector);
        this.background = document.createElement('img');
        this.background.src = background;
        this.pionki = new Piony();
    }

    update({ room, gracz }) {
        this.ref.innerHTML = "";
        if (room.active) {
            this.ref.appendChild(this.background);

            this.ref.appendChild(this.pionki.ref);
            this.pionki.update({ room, gracz });
        }
    }
}