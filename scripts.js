const prevBotton = document.getElementById('prev');
const nextBotton = document.getElementById('next');
const items = document.querySelectorAll('.item');
const dots  = document.querySelectorAll('.dot');
const list  = document.querySelector('.list');

let active = 0;
const total = items.length;
let timer;

function update(direction) {
    const activeItem = document.querySelector('.item.active');
    const activeDot  = document.querySelector('.dot.active');

    if (!activeItem) return;

    activeItem.classList.remove('active');
    if (activeDot) activeDot.classList.remove('active');

    if (direction > 0) {
        active = active + 1;
        if (active === total) active = 0;
    } else if (direction < 0) {
        active = active - 1;
        if (active < 0) active = total - 1;
    }

    items[active].classList.add('active');
    if (dots[active]) dots[active].classList.add('active');
}

// Carrossel automático só no index (mais de 1 item)
if (total > 1) {
    clearInterval(timer);
    timer = setInterval(function () { update(1); }, 5000);
}

if (prevBotton) prevBotton.addEventListener('click', function () { update(-1); });
if (nextBotton) nextBotton.addEventListener('click', function () { update(1);  });