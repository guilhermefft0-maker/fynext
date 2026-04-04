(function () {
    'use strict';

    /* ── ORANGE PALETTE ── */
    var R = 255, G = 107, B = 0;
    function rgba(a) { return 'rgba(' + R + ',' + G + ',' + B + ',' + a + ')'; }

    /* ══ NeuralNet ══ */
    function NeuralNet(canvas) {
        this.canvas   = canvas;
        this.ctx      = canvas.getContext('2d');
        this.nodes    = [];
        this.signals  = [];
        this.COUNT    = 60;
        this.MAX_DIST = 155;
        this.SIG_RATE = 0.003;

        var self = this;
        this.resize();
        this.buildNodes();
        this.raf = requestAnimationFrame(function tick() {
            self.update();
            self.draw();
            self.raf = requestAnimationFrame(tick);
        });

        window.addEventListener('resize', function () {
            self.resize();
            self.buildNodes();
        });
    }

    NeuralNet.prototype.resize = function () {
        this.W = this.canvas.width  = this.canvas.offsetWidth  || this.canvas.parentElement.offsetWidth;
        this.H = this.canvas.height = this.canvas.offsetHeight || this.canvas.parentElement.offsetHeight;
    };

    NeuralNet.prototype.buildNodes = function () {
        this.nodes   = [];
        this.signals = [];
        for (var i = 0; i < this.COUNT; i++) {
            this.nodes.push({
                x:     Math.random() * this.W,
                y:     Math.random() * this.H,
                vx:    (Math.random() - 0.5) * 0.38,
                vy:    (Math.random() - 0.5) * 0.38,
                r:     Math.random() * 2 + 1.5,
                pulse: Math.random() * Math.PI * 2
            });
        }
    };

    NeuralNet.prototype.update = function () {
        var W = this.W, H = this.H;
        var nodes = this.nodes;
        var MAX   = this.MAX_DIST;
        var RATE  = this.SIG_RATE;

        /* move nodes */
        nodes.forEach(function (n) {
            n.x += n.vx;
            n.y += n.vy;
            n.pulse += 0.022;
            if (n.x <= 0)  { n.x = 0;  n.vx = Math.abs(n.vx); }
            if (n.x >= W)  { n.x = W;  n.vx = -Math.abs(n.vx); }
            if (n.y <= 0)  { n.y = 0;  n.vy = Math.abs(n.vy); }
            if (n.y >= H)  { n.y = H;  n.vy = -Math.abs(n.vy); }
        });

        /* spawn signals on edges */
        for (var i = 0; i < nodes.length; i++) {
            for (var j = i + 1; j < nodes.length; j++) {
                var dx = nodes[i].x - nodes[j].x;
                var dy = nodes[i].y - nodes[j].y;
                var d  = Math.sqrt(dx * dx + dy * dy);
                if (d < MAX && Math.random() < RATE) {
                    this.signals.push({ i: i, j: j, t: 0, dir: Math.random() < 0.5 ? 1 : -1 });
                }
            }
        }

        /* advance signals */
        this.signals = this.signals.filter(function (s) {
            s.t += 0.022;
            return s.t < 1;
        });
    };

    NeuralNet.prototype.draw = function () {
        var ctx   = this.ctx;
        var nodes = this.nodes;
        var MAX   = this.MAX_DIST;
        ctx.clearRect(0, 0, this.W, this.H);

        /* ── edges ── */
        for (var i = 0; i < nodes.length; i++) {
            for (var j = i + 1; j < nodes.length; j++) {
                var dx = nodes[i].x - nodes[j].x;
                var dy = nodes[i].y - nodes[j].y;
                var d  = Math.sqrt(dx * dx + dy * dy);
                if (d < MAX) {
                    ctx.beginPath();
                    ctx.strokeStyle = rgba((1 - d / MAX) * 0.22);
                    ctx.lineWidth   = 0.75;
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        /* ── signal pulses ── */
        this.signals.forEach(function (s) {
            var a  = nodes[s.i];
            var b  = nodes[s.j];
            var t  = s.dir > 0 ? s.t : 1 - s.t;
            var sx = a.x + (b.x - a.x) * t;
            var sy = a.y + (b.y - a.y) * t;
            var fade = Math.sin(s.t * Math.PI); /* peaks mid-travel */
            var g  = ctx.createRadialGradient(sx, sy, 0, sx, sy, 9);
            g.addColorStop(0, rgba(0.95 * fade));
            g.addColorStop(1, rgba(0));
            ctx.beginPath();
            ctx.fillStyle = g;
            ctx.arc(sx, sy, 9, 0, Math.PI * 2);
            ctx.fill();
        });

        /* ── nodes ── */
        nodes.forEach(function (n) {
            var glow = 0.5 + 0.5 * Math.sin(n.pulse);

            /* outer halo */
            var halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
            halo.addColorStop(0, rgba(0.28 * glow));
            halo.addColorStop(1, rgba(0));
            ctx.beginPath();
            ctx.fillStyle = halo;
            ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
            ctx.fill();

            /* core dot */
            ctx.beginPath();
            ctx.fillStyle = rgba(0.65 + 0.35 * glow);
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fill();
        });
    };

    /* ── boot: find every canvas.neural-canvas on the page ── */
    function boot() {
        document.querySelectorAll('canvas.neural-canvas').forEach(function (c) {
            new NeuralNet(c);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}());