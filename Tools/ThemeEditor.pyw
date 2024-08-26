# -*- coding: utf-8 -*-
from PyQt5 import uic
from PyQt5.QtCore import *
from PyQt5.QtWidgets import *
from PyQt5.QtGui import *
import sys, os
import shutil

from init import *
import utils

class window(QMainWindow):
    def __init__(self): # Initialize the window
        utils.clear()
        
        app = QApplication(sys.argv)
        super(window, self).__init__()
        
        self.loadConfig()
        self.loadManifest()
        
        self.themeEditor = uic.loadUi('ui/themeEditor.ui')
        self.themeEditor.setWindowTitle("Theme Editor")
        self.themeEditor.setWindowIcon(QIcon(config['path']+self.manifest['icons']['128']))
        
        self.themeData = json.loads(open(config['path']+"/themes/themes.json").read())
        self.functionality()
        
        self.themeEditor.show()
        sys.exit(app.exec_())
        
    def loadConfig(self):
        initConfig()
        if config['debug']: print(f"Debugging is enabled\n\nLoaded Config:\n--> {config}")
        
    def loadManifest(self):
        self.manifest = LoadManifest(config['path'] + "manifest.json")
        if config['debug']: print(f"\nLoaded Manifest:\n--> {self.manifest}")
        
    def saveThemeData(self):
        with open(config['path']+"/themes/themes.json", "w") as jsonfile:
            json.dump(self.themeData, jsonfile, indent="\t")
        
    def functionality(self):
        self.updateThemes()   
        self.themeEditor.themes.itemClicked.connect(lambda: self.loadTheme(self.themeEditor.themes.currentItem().text()))
        self.themeEditor.newTheme.clicked.connect(lambda: self.new())
        self.themeEditor.label_limit.setText(f"{self.themeEditor.themes.count()}/3")
        
    def loadTheme(self, theme):
        self.themeEditor.save.disconnect()
        self.themeEditor.editCSS.disconnect()
        self.themeEditor.editJS.disconnect()
        self.themeEditor.openfolder.disconnect()
        self.themeEditor.deleteBtn.disconnect()
        
        for i in range(len(self.themeData['custom_themes'])):
            if self.themeData['custom_themes'][i]['directory'] == theme: self.themeDataIndex = i
        
        self.themeEditor.themeDirectory.setText(theme)
        self.themeEditor.name.setText(self.themeData['custom_themes'][self.themeDataIndex]['name'])
        self.themeEditor.author.setText(self.themeData['custom_themes'][self.themeDataIndex]['author'])
        self.themeEditor.version.setText(self.themeData['custom_themes'][self.themeDataIndex]['version'])
        self.themeEditor.description.setPlainText(self.themeData['custom_themes'][self.themeDataIndex]['description'])
        
        with open(config['path']+"/themes/"+theme+"/style.css", "r") as jsonfile:
            self.themeEditor.CSSTextEdit.setPlainText(jsonfile.read())
        with open(config['path']+"/themes/"+theme+"/script.js", "r") as jsonfile:
            self.themeEditor.JSTextEdit.setPlainText(jsonfile.read())
        
        try: 
            icon = [file for file in os.listdir(config['path']+"/themes/"+theme) if file.startswith("icon")][0]
            self.themeEditor.icon.setText(config['path']+"themes/"+theme+"/"+icon)
        except: self.themeEditor.icon.setText("No icon found")
            
        self.themeEditor.editCSS.clicked.connect(lambda: utils.openFileWithExplorer(utils.getCurrentPath()+"\\"+config['path']+"themes\\"+theme+"\\style.css"))
        self.themeEditor.editJS.clicked.connect(lambda: utils.openFileWithExplorer(utils.getCurrentPath()+"\\"+config['path']+"themes\\"+theme+"\\script.js"))
        self.themeEditor.openfolder.clicked.connect(lambda: utils.openFileWithExplorer(utils.getCurrentPath()+"\\"+config['path']+"themes\\"+theme))
        self.themeEditor.save.clicked.connect(lambda: self.saveTheme(theme))
        self.themeEditor.deleteBtn.clicked.connect(lambda: self.delete(theme))

    def saveTheme(self, theme):
        with open(config['path']+"/themes/"+theme+"/style.css", "w") as jsonfile:
            jsonfile.write(self.themeEditor.CSSTextEdit.toPlainText())
        with open(config['path']+"/themes/"+theme+"/script.js", "w") as jsonfile:
            jsonfile.write(self.themeEditor.JSTextEdit.toPlainText())
        try: os.rename(config['path']+"/themes/"+theme, config['path']+"/themes/"+self.themeEditor.themeDirectory.text())
        except: return
        self.themeData['custom_themes'][self.themeDataIndex]['directory'] = self.themeEditor.themeDirectory.text()
        self.themeData['custom_themes'][self.themeDataIndex]['name'] = self.themeEditor.name.text()
        self.themeData['custom_themes'][self.themeDataIndex]['author'] = self.themeEditor.author.text()
        self.themeData['custom_themes'][self.themeDataIndex]['version'] = self.themeEditor.version.text()
        self.themeData['custom_themes'][self.themeDataIndex]['description'] = self.themeEditor.description.toPlainText()
        self.saveThemeData()
        
        self.themeEditor.themes.clear()
        self.updateThemes()
        theme = self.themeEditor.themeDirectory.text()
        self.loadTheme(theme)
        
    def new(self):
        if self.themeEditor.themes.count() >= 3: return
        if os.path.exists(config['path']+"/themes/NewTheme"): return
        
        self.themeEditor.themes.addItem("NewTheme")
        os.mkdir(config['path']+"/themes/NewTheme")
        with open(config['path']+"/themes/NewTheme/style.css", "w") as jsonfile: jsonfile.write("")
        with open(config['path']+"/themes/NewTheme/script.js", "w") as jsonfile: jsonfile.write("")
        self.themeData['custom_themes'].append({ 
            "directory": "NewTheme",
            "name": "New Theme",
            "author": "Unknown",
            "version": "1.0",
            "description": "A new theme"
        })
        self.themeEditor.label_limit.setText(f"{self.themeEditor.themes.count()}/3")
        self.saveTheme("NewTheme")
        
    def delete(self, theme):
        msg = QMessageBox(self.themeEditor)
        reply = msg.question(self.themeEditor, 'Delete Theme', f"Are you sure you want to delete the theme: {theme}?", QMessageBox.Yes | QMessageBox.No)
        msg.setParent(self.themeEditor)
        msg.setWindowFlags(Qt.WindowFlags(Qt.Dialog))
        
        if reply == QMessageBox.No: return
        
        self.themeData['custom_themes'].pop(self.themeDataIndex)
        shutil.rmtree(config['path']+"/themes/"+theme)
        self.themeEditor.themes.takeItem(self.themeEditor.themes.currentRow())
        self.themeEditor.label_limit.setText(f"{self.themeEditor.themes.count()}/3")
        self.saveThemeData()
        
    def updateThemes(self):
        for i in range(len(self.themeData['custom_themes'])):
            if config['non_custom_themes'].__contains__(self.themeData['custom_themes'][i]['directory']): continue
            self.themeEditor.themes.addItem(self.themeData['custom_themes'][i]['directory'])
        
        
window() # Run the window
