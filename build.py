import json
import os.path
import shutil

# Check if the manifest file exists & load the manifest file
if not os.path.exists("./src/manifest.json"):
    print("An error occurred while reading the manifest file\n./src/manifest.json not found")
    input("Press Enter to continue...")
    exit()

with open("./src/manifest.json", "r") as manifestfile:
    manifest = json.load(manifestfile)


def archive(): # Archive the build
    try:
        return shutil.make_archive(manifest['name'], "zip", "./src/", owner=manifest['author'], group=manifest['author'])
    except ValueError:
        manifest["browser_specific_settings"] = browser_specific_settings
        saveJSON("./src/manifest.json", manifest)
        return f"An error occurred while archiving the build\nBuild Option: {str(buildoption)}\nExseption: {ValueError}"

def saveJSON(jsonFile, data):
    with open(jsonFile, "w") as jsonfile:
        json.dump(data, jsonfile, indent='\t')

############
### Main ###
############

print(f"Working on {manifest['name']} v{manifest['version']}\n")
buildoption = input("1. Build for Chromium\n2. Build for Firefox\nEnter the build platform: ")

if buildoption == "1" or buildoption.lower == "chromium":
    # Remove browser_specific_settings from manifest.json
    browser_specific_settings = manifest["browser_specific_settings"]
    del manifest["browser_specific_settings"]

    # Save the manifest.json
    saveJSON("./src/manifest.json", manifest)
    print(archive())

    # Restore browser_specific_settings to manifest.json
    manifest["browser_specific_settings"] = browser_specific_settings
    saveJSON("./src/manifest.json", manifest)
elif buildoption == "2" or buildoption.lower == "firefox":
    print(archive())
else:
    print("Invalid option")

input("Press Enter to continue...")