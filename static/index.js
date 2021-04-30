const getin_bt = document.querySelector('#getin_bt');
const nickname = document.querySelector('#nickname');

const post = () => {
    fetch('/api/login/', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            login: nickname.value
        })
    }).then(data => {
        if (data.status) {
            location.replace("/room");
        }
    });
}
addEventListener('keydown', e => {
    if (e.key == "Enter") {
        post();
    }
});

getin_bt.addEventListener('click', () => {
    post();
});


