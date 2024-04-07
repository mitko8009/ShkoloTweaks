# -*- coding: utf-8 -*-
from PyQt5 import uic
from PyQt5.QtCore import *
from PyQt5.QtWidgets import *
from PyQt5.QtGui import *
import sys, os
import shutil

from init import *

class window(QMainWindow):
    def __init__(self): # Initialize the window
        app = QApplication(sys.argv)
        super(window, self).__init__()
        self.loadConfig()
        self.loadManifest()

        self.mainUi = uic.loadUi('main.ui')
        self.mainUi.setWindowTitle(config['title'])

        self.functionality()

        self.mainUi.show()
        sys.exit(app.exec_())
    
    def loadConfig(self):
        initConfig()
        if config['debug']: print(f"Debugging is enabled\n\nLoaded Config:\n--> {config}")
        
    def loadManifest(self):
        self.manifest = LoadManifest(config['path'] + "manifest.json")
        if config['debug']: print(f"\nLoaded Manifest:\n--> {self.manifest}")

    def functionality(self):
        self.mainUi.Name.setText(self.manifest['name'])
        self.mainUi.Version.setText(self.manifest['version'])
        self.mainUi.Description.setPlainText(self.manifest['description'])
        self.mainUi.Publisher.setText(self.manifest['author'])
        self.mainUi.PublicKey.setText(self.manifest['key'])
        self.mainUi.OptionChromium.setChecked(True)
        
        self.mainUi.Build.clicked.connect(self.build)
        self.mainUi.Save.clicked.connect(self.save)
        
    def save(self):
        self.manifest['name'] = self.mainUi.Name.text()
        self.manifest['version'] = self.mainUi.Version.text()
        self.manifest['description'] = self.mainUi.Description.toPlainText()
        self.manifest['author'] = self.mainUi.Publisher.text()
        self.manifest['key'] = self.mainUi.PublicKey.text()
        
        SaveManifest(config['path'] + "manifest.json", self.manifest)
        if config['debug']: print(f"\nSaved Manifest:\n--> {self.manifest}")
        
    def build(self):
        self.save()
        browser_specific_settings = self.manifest["browser_specific_settings"]
        
        if self.mainUi.OptionChromium.isChecked():
            del self.manifest['browser_specific_settings']
            
        SaveManifest(config['path'] + "manifest.json", self.manifest)
        
        try:
            archivePath = shutil.make_archive("../"+self.manifest['name'], 'zip', config['path'], owner=self.manifest['author'], group=self.manifest['author'])
            self.manifest['browser_specific_settings'] = browser_specific_settings
            SaveManifest(config['path'] + "manifest.json", self.manifest)
            return archivePath
        except ValueError as e:
            self.manifest['browser_specific_settings'] = browser_specific_settings
            SaveManifest(config['path'] + "manifest.json", self.manifest)
            return print(f"Error: {e}")

window() # Start the window