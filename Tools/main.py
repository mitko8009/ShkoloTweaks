# -*- coding: utf-8 -*-
from PyQt5 import uic
from PyQt5.QtCore import *
from PyQt5.QtWidgets import *
from PyQt5.QtGui import *
import sys, os
import shutil
import random
import logging
import time

from init import *
import utils

class window(QMainWindow):
    def __init__(self): # Initialize the window
        utils.clear()
        
        app = QApplication(sys.argv)
        super(window, self).__init__()
        
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            encoding='utf-8',
            filename='log.log'
        )
        
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
        self.mainUi.minifyHTML.setChecked(config['settings']['minifyHTML'])
        self.mainUi.minifyCSS.setChecked(config['settings']['minifyCSS'])
        self.mainUi.minifyJS.setChecked(config['settings']['minifyJS'])
        
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
        
        for script in self.manifest['content_scripts']:
            for js_file in script['js']:
                self.mainUi.content_scripts.addItem(js_file)
        
        self.mainUi.content_scripts.itemDoubleClicked.connect(
            lambda: utils.reviewFileinSrc(self.mainUi.content_scripts.currentItem().text(), config['path'])
        )
            
        for i in self.manifest['web_accessible_resources'][0]['resources']:
            self.mainUi.web_accessible_resources.addItem(i)
            if i[-1] == '*':
                i = i[:-1]
                for j in os.listdir(config['path'] + i):
                    self.mainUi.web_accessible_resources.addItem(i + j)
                self.mainUi.web_accessible_resources.addItem("")
                
        self.mainUi.web_accessible_resources.itemDoubleClicked.connect(
            lambda: utils.reviewFileinSrc(self.mainUi.web_accessible_resources.currentItem().text(), config['path'])
        )
        
        for i in os.listdir(config['path'] + "/_locales/"):
            self.mainUi.default_locale.addItem(i)
        self.mainUi.default_locale.setCurrentText(self.manifest['default_locale'])
        
    def openFile(self, icon):
        data = QFileDialog.getOpenFileName(self.mainUi, "Select File","","Images (*.png *.xpm *.jpg)",options=QFileDialog.Options())
        data = str(data[0].split(config['path'].split('/')[1])[-1])
        if data.__len__()>0:
            icon.setText(data[1:])
    
    def save(self):
        self.manifest.update({
            "name": self.mainUi.Name.text(),
            "version": self.mainUi.Version.text(),
            "description": self.mainUi.Description.toPlainText(),
            "author": self.mainUi.Publisher.text(),
            "key": self.mainUi.PublicKey.text(),
            "default_locale": self.mainUi.default_locale.currentText(),
            "icons": {
                "16": self.mainUi.icon1.text(),
                "32": self.mainUi.icon2.text(),
                "48": self.mainUi.icon3.text(),
                "128": self.mainUi.icon4.text()
            }
        })
        
        SaveManifest(config['path'] + "manifest.json", self.manifest)
        if config['debug']: print(f"\nSaved Manifest:\n--> {self.manifest}")
        
        config['settings']['minifyHTML'] = self.mainUi.minifyHTML.isChecked()
        config['settings']['minifyCSS'] = self.mainUi.minifyCSS.isChecked()
        config['settings']['minifyJS'] = self.mainUi.minifyJS.isChecked()
        saveConfig()
        
        extConfig = json.loads(open("../public/extension/config.json", "r").read())
        extConfig['version'] = self.manifest['version']
        with open("../public/extension/config.json", "w") as jsonfile:
            json.dump(extConfig, jsonfile, indent='\t')
        self.logger.info(f"Saved extension manifest")
        
    def build(self):
        st = time.time()
        self.save()
        config['path'] = createCopy(config['path'], f"../temp_{random.randint(10000000000, 99999999999)}/")
        self.loadManifest()
        
        if self.mainUi.OptionChromium.isChecked():
            del self.manifest['browser_specific_settings']
        
        if self.mainUi.minifyHTML.isChecked(): utils.minifyHTML(config['path'])
        if self.mainUi.minifyCSS.isChecked(): utils.minifyCSS(config['path'])
        if self.mainUi.minifyJS.isChecked(): utils.minifyJS(config['path'])
            
        SaveManifest(config['path'] + "manifest.json", self.manifest)
        
        shutil.make_archive("../"+self.manifest['name'], 'zip', config['path'], owner=self.manifest['author'], group=self.manifest['author'])
        
        print(f"Succesfully built extension at ../{self.manifest['name']}.zip")
        shutil.rmtree(config['path'])
        
        et = time.time()
        print(f"Time taken to build: {round(et-st, 2)} seconds")
        self.logger.info(f"Time taken to build: {round(et-st, 2)} seconds")
        self.logger.info(f"Extension build information: {self.manifest['name']} v{self.manifest['version']} by {self.manifest['author']}")
        
        self.loadConfig()
        self.loadManifest()
        
    def copy_text_to_clipboard(self, text_box):
        clipboard = QApplication.clipboard()
        clipboard.setText(text_box.text())
        return True

window() # Run the window