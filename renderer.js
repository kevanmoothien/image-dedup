const { ipcRenderer } = require('electron')
const { dialog } = require('electron').remote

document.getElementById('party').addEventListener('click', event => {
    reset()
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then(result => {
        console.log(result.canceled)
        console.log(result.filePaths)
        if (!result.canceled){
            document.getElementById('spinner').style.display = 'inline-block'
            ipcRenderer.send('filePath', result.filePaths)
        }
      }).catch(err => {
        console.log(err)
      })
})

let numFiles = 0
let numUniqFiles = 0
ipcRenderer.on('results:numFiles', (event, metadata) => {
    numFiles = metadata
    document.getElementById('numFilesHeader').style.display = 'block'
    const pre = document.getElementById('numFiles').innerHTML = numFiles;
    console.log('completed', metadata)
})
  
// error event from catch block in main process
ipcRenderer.on('results:error', (event, error) => {
  console.log(event, error)
})

ipcRenderer.on('results', (event, uniq) => {
  console.log(event, uniq)
  numUniqFiles = Object.keys(uniq).length
  console.log(numUniqFiles)

  document.getElementById('spinner').style.display = 'none'
  document.getElementById('numDuplicateFilesHeader').style.display = 'block'

  document.getElementById('numDuplicateFiles').innerHTML = numFiles - numUniqFiles 
})

const reset = () => {
  document.getElementById('spinner').style.display = 'none'
  document.getElementById('numDuplicateFilesHeader').style.display = 'none'
  document.getElementById('numFilesHeader').style.display = 'none'
  numFiles = 0
  numUniqFiles = 0
}