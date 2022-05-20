import glob
from pathlib import Path

filenames = glob.glob("*.glb")

output = ""
for filename in filenames:
    name = Path(filenames).stem
    output += "'" + name + "',"
print(output)
input("Press Enter to continue...")
