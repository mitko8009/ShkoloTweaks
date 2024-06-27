import requests
import os
import logging

logger = logging.getLogger(__name__)

def clear():
    os.system('cls' if os.name == 'nt' else 'clear')
    
def getAllFilesOfType(path, type):
    iFiles = []
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(type):
                iFiles.append(os.path.join(root, file))
    return iFiles

def minifyCSS(path):
    cssFiles = getAllFilesOfType(path, '.css')
    
    for i in cssFiles:
        if i.endswith(f".min.css"):
            cssFiles.remove(i)
    
    print(f"Minifying {len(cssFiles)} CSS files")
    logger.info(f"Minifying {len(cssFiles)} CSS files")
    for file in cssFiles:
        print(f"Minifying {file}")
        logger.info(f"Minifying {file}")
        
        with open(file, "r") as f: css_text = f.read()
        r = requests.post("https://www.toptal.com/developers/cssminifier/api/raw", data={"input":css_text})
        with open(file, "w") as f2: f2.write(r.text)
    
def minifyJS(path):
    jsFiles = getAllFilesOfType(path, '.js')
    
    for i in jsFiles:
        if i.startswith(f"{path}lib"):
            jsFiles.remove(i)
        elif i.endswith(f".min.js"):
            jsFiles.remove(i)
        
    print(f"Minifying {len(jsFiles)} JS files")
    logger.info(f"Minifying {len(jsFiles)} JS files")
    for file in jsFiles:
        print(f"Minifying {file}")
        logger.info(f"Minifying {file}")
        
        with open(file, "r") as f: js_text = f.read()
        r = requests.post("https://www.toptal.com/developers/javascript-minifier/raw", data={"input":js_text})
        with open(file, "w") as f2: f2.write(r.text)
    
def minifyHTML(path):
    htmlFiles = getAllFilesOfType(path, '.html')
    
    print(f"Minifying {len(htmlFiles)} HTML files")
    logger.info(f"Minifying {len(htmlFiles)} HTML files")
    for file in htmlFiles:
        print(f"Minifying {file}")
        logger.info(f"Minifying {file}")
        
        with open(file, "r") as f: html_text = f.read()
        r = requests.post("https://www.toptal.com/developers/html-minifier/api/raw", data={"input":html_text})
        with open(file, "w") as f2: f2.write(r.text)
