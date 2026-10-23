#!/usr/bin/env python3
"""Builds the story sound effects in public/story/sfx/ (small mono MP3s).

Recorded (CC0): footsteps are cut from Kenney's `walking.ogg` and placement clicks are Kenney's `placement-*.ogg`
(Kenney Starter Kits, https://github.com/KenneyNL — "Assets included in this package ... sound effects are CC0").
Synthesised here (no third-party material): door latch / close, desk set-down thud, POST beep, UPS beep,
printer feed, soft error knock.
Usage: python3 scripts/build_sfx.py <path-to-Starter-Kit-FPS> <path-to-Starter-Kit-City-Builder>
Requires numpy and ffmpeg."""
import subprocess, sys, pathlib, tempfile, wave
import numpy as np

SR = 44100
OUT = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'story' / 'sfx'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)

def write_mp3(name, x, peak=0.7):
    x = np.asarray(x, dtype=np.float64)
    m = np.max(np.abs(x)) or 1.0
    x = x / m * peak
    with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
        with wave.open(tmp.name, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((x * 32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp.name, '-ac', '1', '-b:a', '64k', str(OUT / f'{name}.mp3')], check=True)

def t(sec): return np.arange(int(SR * sec)) / SR
def env(n, attack=0.002, decay=0.05):
    tt = np.arange(n) / SR
    return np.minimum(1, tt / max(attack, 1e-4)) * np.exp(-tt / decay)
def noise(sec): return rng.standard_normal(int(SR * sec))
def lowpass(x, fc):
    # one-pole low-pass, applied twice
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for _ in range(2):
        for i, v in enumerate(x): s = a * s + (1 - a) * v; y[i] = s
        x = y.copy()
    return y
def highpass(x, fc): return x - lowpass(x, fc)
def bandpass(x, lo, hi): return lowpass(highpass(x, lo), hi)
def place(dst, src, at):
    i = int(at * SR); dst[i:i + len(src)] += src[: max(0, len(dst) - i)]
    return dst

def latch(strength=1.0):
    """short metallic latch click: band-limited transient + a few inharmonic partials"""
    n = int(SR * 0.09); tt = np.arange(n) / SR
    click = bandpass(rng.standard_normal(n), 1800, 6000) * env(n, 0.0005, 0.006)
    ring = sum(a * np.sin(2 * np.pi * f * tt) for f, a in [(1210, 0.5), (2730, 0.35), (4130, 0.2)]) * env(n, 0.0005, 0.025)
    return (click * 1.0 + ring * 0.25) * strength

def thud(sec=0.35, fc=180, decay=0.09, body=70):
    n = int(SR * sec); tt = np.arange(n) / SR
    x = lowpass(rng.standard_normal(n), fc) * env(n, 0.002, decay) * 6
    x += np.sin(2 * np.pi * body * tt) * env(n, 0.003, decay * 1.2) * 0.6
    return x

def build_synth():
    # door opening: handle pressed, latch released, faint air/rub as the leaf starts to move
    x = np.zeros(int(SR * 0.7)); place(x, latch(0.8), 0.0); place(x, latch(0.55), 0.11)
    rub = bandpass(noise(0.45), 300, 1500) * np.hanning(int(SR * 0.45)) * 0.06; place(x, rub, 0.18)
    write_mp3('door-open', x, 0.55)
    # door closing: heavy steel leaf meets the frame, latch snaps in
    x = np.zeros(int(SR * 0.8)); place(x, thud(0.6, 220, 0.11, 62), 0.0); place(x, latch(1.0), 0.012)
    write_mp3('door-close', x, 0.7)
    # desk / heavy object set down on a tiled floor
    x = thud(0.45, 260, 0.07, 85) + bandpass(noise(0.45), 600, 2500) * env(int(SR * 0.45), 0.001, 0.02) * 0.4
    write_mp3('place-heavy', x, 0.6)
    # soft knock for a wrong placement (no buzzer)
    write_mp3('knock', thud(0.25, 500, 0.035, 160), 0.45)
    # single short PC-speaker POST beep (~1 kHz)
    tt = t(0.2); b = (np.sin(2 * np.pi * 1000 * tt) + 0.18 * np.sin(2 * np.pi * 3000 * tt)) * np.minimum(1, np.minimum(tt / 0.004, (0.2 - tt) / 0.006))
    write_mp3('beep', b, 0.35)
    # UPS self-test: two short beeps
    x = np.zeros(int(SR * 0.55)); bb = np.sin(2 * np.pi * 2100 * t(0.11)) * np.minimum(1, np.minimum(t(0.11) / 0.003, (0.11 - t(0.11)) / 0.004))
    place(x, bb, 0.0); place(x, bb, 0.25); write_mp3('ups-beep', x, 0.3)
    # laser printer feeding one page: motor hum with rollers, then the sheet sliding out
    sec = 2.2; n = int(SR * sec); tt = np.arange(n) / SR
    motor = (np.sin(2 * np.pi * 118 * tt) * 0.35 + np.sin(2 * np.pi * 236 * tt) * 0.15 + bandpass(rng.standard_normal(n), 150, 900) * 0.25)
    motor *= (0.75 + 0.25 * np.sin(2 * np.pi * 9 * tt)) * np.minimum(1, np.minimum(tt / 0.25, (sec - tt) / 0.35))
    x = motor; place(x, latch(0.25), 0.05)
    slide = bandpass(noise(0.5), 1500, 6000) * np.hanning(int(SR * 0.5)) * 0.25; place(x, slide, 1.45)
    write_mp3('printer', x, 0.4)

def build_recorded(fps_kit, city_kit):
    src = pathlib.Path(fps_kit) / 'sounds' / 'walking.ogg'
    starts = [0.389, 0.760, 1.202, 1.635, 2.434, 2.848]  # onsets found with ffmpeg silencedetect
    for i, s0 in enumerate(starts):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{s0 - 0.01:.3f}', '-t', '0.32', '-i', str(src), '-ac', '1',
                        '-af', 'afade=t=out:st=0.24:d=0.08,loudnorm=I=-20:TP=-3', '-ar', str(SR), '-b:a', '64k', str(OUT / f'step-{i + 1}.mp3')], check=True)
    for k in 'abcd':
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(pathlib.Path(city_kit) / 'sounds' / f'placement-{k}.ogg'), '-ac', '1', '-ar', str(SR), '-b:a', '64k', str(OUT / f'click-{k}.mp3')], check=True)

if __name__ == '__main__':
    build_synth()
    if len(sys.argv) > 2: build_recorded(sys.argv[1], sys.argv[2])
    print('sfx ->', OUT, sorted(p.name for p in OUT.glob('*.mp3')))
