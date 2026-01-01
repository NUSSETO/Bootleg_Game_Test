
import base64
import os
import subprocess

images = {
    "wizard": "/Users/seto-macair/.gemini/antigravity/brain/4bc790e4-0e72-4fcf-9072-55f3a6381988/wizard_square_icon_1767260213943.png",
    "bat": "/Users/seto-macair/.gemini/antigravity/brain/4bc790e4-0e72-4fcf-9072-55f3a6381988/bat_square_icon_1767260239045.png",
    "eye": "/Users/seto-macair/.gemini/antigravity/brain/4bc790e4-0e72-4fcf-9072-55f3a6381988/eye_square_icon_1767260256311.png",
    "ground": "/Users/seto-macair/.gemini/antigravity/brain/4bc790e4-0e72-4fcf-9072-55f3a6381988/ground_tile_1767259573727.png"
}

# Clear sprites.js content and start the function wrapper
with open("sprites.js", "w") as js_file:
    js_file.write("window.loadGameSprites = function() {\n")

for name, path in images.items():
    if os.path.exists(path):
        # Resize image using sips
        try:
            subprocess.run(["sips", "-z", "32", "32", path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"Resized {name}")
        except subprocess.CalledProcessError:
            print(f"Failed to resize {name}")

        with open(path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            with open("sprites.js", "a") as js_file:
                js_file.write(f'    loadSprite("{name}", "data:image/png;base64,{encoded_string}")\n')
    else:
        print(f"// FILE NOT FOUND: {path}")

# Close the function wrapper
with open("sprites.js", "a") as js_file:
    js_file.write("}\n")

print("sprites.js updated successfully.")
