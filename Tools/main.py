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
        clear()
        
        app = QApplication(sys.argv)
        super(window, self).__init__()
        
        self.loadConfig()
        self.loadManifest()

        self.mainUi = uic.loadUi('main.ui')
        self.mainUi.setWindowTitle(config['title'])
        self.mainUi.setWindowIcon(QIcon(config['path']+self.manifest['icons']['128']))

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
        self.mainUi.icon1.setText(self.manifest['icons']['16'])
        self.mainUi.icon2.setText(self.manifest['icons']['32'])
        self.mainUi.icon3.setText(self.manifest['icons']['48'])
        self.mainUi.icon4.setText(self.manifest['icons']['128'])
        
        self.mainUi.Save.clicked.connect(self.save)
        self.mainUi.actionSave.triggered.connect(self.save)
        self.mainUi.Build.clicked.connect(self.build)
        self.mainUi.actionBuild.triggered.connect(self.build)
        self.mainUi.iconBtn1.clicked.connect(lambda: self.openFile(self.mainUi.icon1))
        self.mainUi.iconBtn2.clicked.connect(lambda: self.openFile(self.mainUi.icon2))
        self.mainUi.iconBtn3.clicked.connect(lambda: self.openFile(self.mainUi.icon3))
        self.mainUi.iconBtn4.clicked.connect(lambda: self.openFile(self.mainUi.icon4))
        self.mainUi.actionCopyPublicKey.triggered.connect(lambda: self.copy_text_to_clipboard(self.mainUi.PublicKey))

        for i in self.manifest['permissions']:
            self.mainUi.permissions.addItem(i)
        
        self.mainUi.permissions.addItem("")
        self.mainUi.permissions.addItem("------- Host Permissions -------")
        for i in self.manifest['host_permissions']:
            self.mainUi.permissions.addItem(i)
            
        for i in self.manifest['content_scripts'][0]['js']:
            self.mainUi.content_scripts.addItem(i)
            
        for i in self.manifest['web_accessible_resources'][0]['resources']:
            self.mainUi.web_accessible_resources.addItem(i)
            if i[-1] == '*':
                i = i[:-1]
                for j in os.listdir(config['path'] + i):
                    self.mainUi.web_accessible_resources.addItem(i + j)
                self.mainUi.web_accessible_resources.addItem("")
        
        for i in os.listdir(config['path'] + "/_locales/"):
            self.mainUi.default_locale.addItem(i)
        self.mainUi.default_locale.setCurrentText(self.manifest['default_locale'])
        
    def openFile(self, icon):
        data = QFileDialog.getOpenFileName(self.mainUi, "Select File","","Images (*.png *.xpm *.jpg)",options=QFileDialog.Options())
        data = str(data[0].split(config['path'].split('/')[1])[-1])
        if data.__len__() > 0:
            icon.setText(data[1:])
    
    def save(self):
        self.manifest['name'] = self.mainUi.Name.text()
        self.manifest['version'] = self.mainUi.Version.text()
        self.manifest['description'] = self.mainUi.Description.toPlainText()
        self.manifest['author'] = self.mainUi.Publisher.text()
        self.manifest['key'] = self.mainUi.PublicKey.text()
        self.manifest['default_locale'] = self.mainUi.default_locale.currentText()
        self.manifest['icons']['16'] = self.mainUi.icon1.text()
        self.manifest['icons']['32'] = self.mainUi.icon2.text()
        self.manifest['icons']['48'] = self.mainUi.icon3.text()
        self.manifest['icons']['128'] = self.mainUi.icon4.text()
        
        SaveManifest(config['path'] + "manifest.json", self.manifest)
        if config['debug']: print(f"\nSaved Manifest:\n--> {self.manifest}")
        
        extConfig = json.loads(open("../public/extension/config.json", "r").read())
        extConfig['version'] = self.manifest['version']
        with open("../public/extension/config.json", "w") as jsonfile:
            json.dump(extConfig, jsonfile, indent='\t')
        
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
        
    def copy_text_to_clipboard(self, text_box):
        clipboard = QApplication.clipboard()
        clipboard.setText(text_box.text())
        return True

window() # Run the window