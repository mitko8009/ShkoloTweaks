import shutil
import os

from init import *
import utils

def main():
    initConfig()
    manifest = LoadManifest(config['path'] + "manifest.json")
    
    config['path'] = createCopy(config['path'], f"../dist/extension/")
    LoadManifest(config['path'] + "manifest.json")
    
    del manifest['browser_specific_settings']
    
    SaveManifest(config['path'] + "manifest.json", manifest)
    
if __name__ == '__main__':
    main()