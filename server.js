const { v4: uuid } = require('uuid');

const kolorki = {
    green: 0,
    yellow: 10,
    red: 20,
    blue: 30
}

function NowyPokoj() {
    let room = rooms.find(room => {
        return room.gracze.length < 4 && !room.active
    });
    if (!room) {
        room = new PokojGry();
        rooms.push(room);
    }

    return room;    
}
class Player {
    constructor(login) {
        this.id = uuid();
        this.login = login;
        this.color = "";
        this.ready = false;
        this.movesToMake = null;
        this.pionki = [];
        for (let i=0; i<4; i++) {
            this.pionki[i] = {
                id: i,
                field: 0,
                home: true,
                finish: false
            }
        }
    }

    ruch(pawnID) {
        const pionek = this.pionki.find(p => p.id == pawnID);
        if (pionek.home) {
            pionek.home = false;
        } else {
            pionek.field += this.movesToMake;
        }
        this.movesToMake = null;
    }

    ruch_ile(dicenum) {
        if (typeof dicenum != "number") {
            return;
        }
        if (dicenum < 1 || valufe > 6) {
            return;
        }
        if (dicenum % 1 != 0) { 
            return;
        }

        this.movesToMake = dicenum;
    }
}


class PokojGry {
    constructor() {
        this.id = uuid();
        this.gracze = [];
        this.availableColors = ['red', 'blue', 'green', 'yellow'];
        this.active = false;
        this.focusPlayer = null;
    }

    
    ruch_pion(pawnID) {
        this.focusPlayer.ruch(pawnID);
        this.zbicie(pawnID);
        this.gracz_next();
    }

    rzut_kostka() {
        const dicenum = Math.floor(Math.random() * 6) + 1;
        if (!this.focusPlayer.movesToMake) {
            this.focusPlayer.movesToMake = dicenum;
        }

        if (this.focusPlayer.pionki.every(p => p.home || p.finished)) {
            if (this.focusPlayer.movesToMake != 6 && this.focusPlayer.movesToMake != 1) {
                const buf = this.focusPlayer.movesToMake;
                this.focusPlayer.movesToMake = null;
                this.gracz_next();
                return buf;
            }
        }   

        return this.focusPlayer.movesToMake;
    }

    gracz_status_upt(playerid, status) {
        if (this.active) return;

        const gracz = this.gracze.find(gracz => gracz.id == playerid);
        gracz.ready = status;

        if (this.gracze.every(gracz => gracz.ready) && this.gracze.length >= 2) {
            this.active = true;
            this.gracz_next();
        }
    }

    gracz_id(id) {
        const gracz = this.gracze.find(gracz => id == gracz.id);
        const result = ((({ id, ...obj }) => obj))(gracz);
        delete result.id;
        return result;
    }

    gracz_nowy(gracz) {
        gracz.color = this.availableColors.pop();
        this.gracze.push(gracz);

        if (!(this.gracze.length < 4 && !this.active)) {
            this.active = true;
            this.gracze.forEach(p => p.ready = true);
            this.gracz_next();
        }
    }

    gracz_next() {
        if (!this.focusPlayer) {
            this.focusPlayer = this.gracze[0];
            return;
        }

        let currentIndex = this.gracze.findIndex(p => p.id == this.focusPlayer.id) + 1;
        if (currentIndex >= this.gracze.length) {
            currentIndex = 0;
        }

        this.focusPlayer = this.gracze[currentIndex];
    }

    zbicie(pawnID) {
        const pionek = this.focusPlayer.pionki.find(p => p.id == pawnID);
        this.gracze.forEach(p => {
            p.pionki.forEach(pn => {
                if (p.id == this.focusPlayer.id) return;
                let offset1 = pn.field + kolorki[p.color]
                if (offset1 >= 40) offset1 -= 39;
                let offset2 = pionek.field + kolorki[this.focusPlayer.color];
                if (offset2 >= 40) offset2 -= 39;
                if (!pn.home && offset1 == offset2) {
                    pn.field = 0;
                    pn.home = true;
                }
            });
        });
    }

    status() {
        return {
            gracze: this.gracze.map(({ id }) => this.gracz_id(id)),
            active: this.active,
            focusPlayer: this.focusPlayer ? this.gracz_id(this.focusPlayer.id) : null
        }
    }
}

const express = require('express');
const session = require('express-session');
const path = require('path');
const MemoryStore = require('memorystore')(session);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
    secret: 'suder',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true
    },
    store: new MemoryStore() 
}))

const rooms = [];

app.get('/', (req, res) => {
    if (req.session.login) {
        res.redirect('/room');
    } else {
        res.sendFile(path.join(__dirname + '/static/index.html'));
    }
});

app.get('/room', (req, res) => {
    if (!req.session.login) {
        res.redirect('/');
    } else {
        res.sendFile(path.join(__dirname + '/static/room/index.html'));
    }
});

app.use(express.static(path.join(__dirname, 'static')));

app.post('/api/login', (req, res) => {
    const { login } = req.body;

    if (login) {
        req.session.login = login;
        const room = NowyPokoj(rooms);
        const gracz= new Player(login);
        req.session.playerid = gracz.id;
        room.gracz_nowy(gracz);
        req.session.roomid = room.id;

        res.send({
            status: "OK"
        })
        return;
    }

    res.status(400)
    res.send({
        status: "Nie OK"
    });
});
app.get('/api/room/status', (req, res) => {
    const { roomid } = req.session;
    if (!roomid) {
        res.status(400);
        res.send("Nie jesteś w pokoju!");
        return;
    }

    const room = rooms.find(room => room.id == roomid);
    if (room) {
        const gracz = room.gracz_id(req.session.playerid);
        const status = { gracz, room: room.status() };
        res.send(JSON.stringify(status));
        return;
    }

    res.send("Nie jesteś w pokoju!");
});

app.post('/api/gracz/ruch', (req, res) => {
    const { roomid } = req.session;
    if (!roomid) {
        res.status(400);
        res.send("Nie jesteś w pokoju!");
    }

    const room = rooms.find(g => g.id == roomid);
    if (room) {
        if (room.focusPlayer.id == req.session.playerid) {
            room.ruch_pion(req.body.id);
            res.send({ status: "OK" });
            return;
        }
    }

    res.send("Wrong");
});

app.get('/api/room/kosc', (req, res) => {
    const { roomid } = req.session;
    if (!roomid) {
        res.status(400);
        res.send("Brak pokoju");
        return;
    }
    const room = rooms.find(room => room.id == roomid);
    if (room) {
        if (room.focusPlayer.id == req.session.playerid) {
            const dicenum = room.rzut_kostka();
            res.send(JSON.stringify({
                movesToMake: dicenum
            }));
            return;
        }
    }
    res.send("!!!");
});
app.post('/api/gracz/status', (req, res) => {
    const { roomid } = req.session;
    if (!roomid) {
        res.status(400);
        res.send("Brak pokoju");
        return;
    }
    const room = rooms.find(room => room.id == roomid);
    if (room) {
        room.gracz_status_upt(req.session.playerid, req.body.ready);
        res.send({ status: `Your status updated` });
        return;
    }
    res.send("Brak pokoju");
});

app.listen(PORT, () => console.log(`Start serwera na porcie ${PORT}`));
 