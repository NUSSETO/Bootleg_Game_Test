
import math
import wave
import struct
import base64
import os
import random

def generate_wave(filename, duration, generator_func):
    sample_rate = 44100
    n_frames = int(duration * sample_rate)
    
    with wave.open(filename, 'w') as obj:
        obj.setnchannels(1) # mono
        obj.setsampwidth(2) # 2 bytes per sample
        obj.setframerate(sample_rate)
        
        for i in range(n_frames):
            t = i / sample_rate
            value = generator_func(t, duration)
            # Clamp value between -1 and 1
            value = max(-1, min(1, value))
            # Convert to 16-bit PCM integer
            data = struct.pack('<h', int(value * 32767.0))
            obj.writeframesraw(data)

def shoot_sound(t, d):
    # High to low frequency sweep
    freq = 800 - (t / d) * 600
    return math.sin(2 * math.pi * freq * t) * (1 - t/d)

def explosion_sound(t, d):
    # White noise with decay
    return (random.random() * 2 - 1) * (1 - t/d) ** 2

def powerup_sound(t, d):
    # Ascending tones
    if t < d * 0.5:
        freq = 440 # A4
    else:
        freq = 880 # A5
    return math.sin(2 * math.pi * freq * t) * 0.5

def gameover_sound(t, d):
    # Descending low tone with vibrato
    freq = 150 - (t/d) * 50 + math.sin(2 * math.pi * 10 * t) * 10
    return math.sin(2 * math.pi * freq * t) * (1 - t/d)

# Generate WAV files
generate_wave("shoot.wav", 0.15, shoot_sound)
generate_wave("explosion.wav", 0.3, explosion_sound)
generate_wave("powerup.wav", 0.4, powerup_sound)
generate_wave("gameover.wav", 1.5, gameover_sound)

# Convert to Base64 and write to sounds.js
sounds = {
    "shoot": "shoot.wav",
    "explosion": "explosion.wav",
    "powerup": "powerup.wav",
    "gameover": "gameover.wav"
}

with open("sounds.js", "w") as js_file:
    js_file.write("window.loadGameSounds = function() {\n")
    for name, path in sounds.items():
        with open(path, "rb") as wav_file:
            encoded_string = base64.b64encode(wav_file.read()).decode('utf-8')
            js_file.write(f'    loadSound("{name}", "data:audio/wav;base64,{encoded_string}")\n')
    js_file.write("}\n")

print("sounds.js generated successfully.")

# Clean up wav files
for path in sounds.values():
    os.remove(path)
