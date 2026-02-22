(function () {
    /* Insert loading bar element */
    var bar = document.createElement('div');
    bar.id = 'fi-loading-bar';
    document.body.appendChild(bar);

    var timer = null;

    function startBar() {
        clearTimeout(timer);
        bar.style.opacity = '1';
        bar.style.width = '70%';
    }

    function finishBar() {
        bar.style.width = '100%';
        timer = setTimeout(function () {
            bar.style.opacity = '0';
            setTimeout(function () { bar.style.width = '0'; }, 300);
        }, 200);
    }

    /* Livewire v3 — page navigation */
    document.addEventListener('livewire:navigating', startBar);
    document.addEventListener('livewire:navigated', finishBar);

    /* Livewire v3 — component updates (form submits, actions) */
    document.addEventListener('livewire:request', startBar);
    document.addEventListener('livewire:response', finishBar);

    /* Button click → attach spinner via data-loading attribute */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.fi-btn, button[type="submit"]');
        if (!btn) return;
        btn.setAttribute('data-loading', '1');
        document.addEventListener('livewire:response', function cleanup() {
            btn.removeAttribute('data-loading');
            document.removeEventListener('livewire:response', cleanup);
        });
    });
})();
