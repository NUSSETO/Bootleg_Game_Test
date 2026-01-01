
import os

file_path = "sprites.js"
temp_path = "sprites_fixed.js"

with open(file_path, "r") as f_in, open(temp_path, "w") as f_out:
    f_out.write("window.loadGameSprites = function() {\n")
    for line in f_in:
        f_out.write(line)
    f_out.write("}\n")

os.replace(temp_path, file_path)
print("sprites.js wrapped successfully.")
