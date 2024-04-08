import os
import json

config={
        "title":"ExtensionEditor",
        "version": "0.0.1",
        "path": "../src/",
        "debug": False
    }

def initConfig():
    if os.path.exists("./config.json"):
        d = json.loads(open("./config.json").read())
        for i in d: config[i] = d[i]
        with open("./config.json", "w") as jsonfile:
            json.dump(config, jsonfile, indent='\t')
    else:
        openfile=open("./config.json","w")
        d = {}
        for i in d: config[i] = d[i]
        openfile.write(json.dumps(config, indent='\t'))
        openfile.close()
        
def saveConfig():
    with open("./config.json", "w") as jsonfile:
        json.dump(config, jsonfile, indent='\t')
        
def LoadManifest(path):
    try:
        with open(path, "r") as jsonfile:
            return json.load(jsonfile)
    except:
        return print(f"Error: Could not load manifest file at {path}")
    
def SaveManifest(path, data):
    with open(path, "w") as jsonfile:
        json.dump(data, jsonfile, indent='\t')
        
def clear():
    os.system('cls' if os.name == 'nt' else 'clear')