from init import *
import utils

def main():
    initConfig()
    config['path'] = "src/"
    manifest = LoadManifest(config['path'] + "manifest.json")
    
    config['path'] = createCopy(config['path'], f"dist/extension/")
    LoadManifest(config['path'] + "manifest.json")
    
    del manifest['browser_specific_settings']
    
    utils.minifyHTML(config['path'])
    utils.minifyCSS(config['path'])
    utils.minifyJS(config['path'])
    
    SaveManifest(config['path'] + "manifest.json", manifest)
    
if __name__ == '__main__':
    main()