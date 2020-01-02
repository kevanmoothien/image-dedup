const { app, BrowserWindow, ipcMain  } = require('electron')
const fs = require('fs')
const hasha = require('hasha')
const log = require('electron-log')
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('index.html')

  // Open the DevTools.

  //////////win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


ipcMain.on('filePath', async (event, filesArr) => {
    try {
        const uniq_hashes = {}
        const directoryPath = filesArr[0]
        
        uniquePath = path.join(directoryPath, 'unique')
        if (!fs.existsSync(uniquePath)){
          fs.mkdirSync(uniquePath)
        }

        readAllFiles(directoryPath, (err, results) => {
          if (err){
            win.webContents.send('results:error', err)
            return;
          }
          if (results){
            // results.forEach( (file)=>{
              // console.log(file.isFile())
            const files = filterResults(results)
            const length = files.length
            win.webContents.send('results:numFiles', length)
            let count = 0
            let output = {}

            hashing(files, directoryPath, count, output, function(res) {
              log.info(">>>><<<<>>>><<<<<<<", res)
              
              Object.keys(res).forEach( (key) => {
                srcFile = path.join(directoryPath, res[key].name)
                destFile = path.join(uniquePath, res[key].name)
                fs.copyFileSync(srcFile, destFile)
              })
              win.webContents.send('results', res)
            })

              
              
            
          }
        })
    } catch (error) {
        // send an error event if something goes wrong
        win.webContents.send('results:error', 'contains error: ', error)
    }
})

const hashing = (files, directoryPath, count, results, callback) => {
  const length = files.length
  hashFile(path.join(directoryPath, files[count].name)).then((result)=>{
    console.log('######',result)
    results[result] = files[count]
    if (count != (length - 1)) {
      count = count + 1 
      hashing(files, directoryPath, count, results, callback)
    }
    else {
      log.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",results)
      callback(results)
    }
  })
}

const filterResults = (files) => {
  const output = []
  files.forEach( (file) => {
    if (file.isFile() && file.name != 'desktop.ini'){
      output.push(file)
    }
  })
  return output
}

const hashFile = (path) => {
  return hasha.fromFile(path, {algorithm: 'md5'})
}

const readdir = (path) => {
  const files = fs.readdirSync(path)
  return files;
}

const readAllFiles = (path, callback) => {
  fs.readdir(path, { withFileTypes: true }, (err, files) => {
    log.info('>>>>>>', err, files)
    // files.forEach( (file) => {
    //   console.log(file.isFile())
    // })
    //handling error
    if (err) {
      callback(err, undefined)
      return log.error('Unable to scan directory: ' + err);
    } 
    callback(undefined, files)
    //listing all files using forEach
    // files.forEach(function (file) {
    //     // Do whatever you want to do with the file
    //     console.log(file); 
    // });
  });
}