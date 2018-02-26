const fs = require('fs');
const path = require('path');
//const cv = require('opencv');

var pathFile = '';
var streaming = false;

function startVideo(){
    streaming = !streaming;
    let sasBnt = document.getElementById('startAndStop');
    let sBtn = document.getElementById('saveImage');
    if (streaming){
      sasBnt.textContent = 'Stop';
      sBtn.disabled = false;
    }else{
      sasBnt.textContent = 'Start';
      sBtn.disabled = true;
    }
    //findFace();
}

function findFace() {
  let camera = new cv.VideoCapture(0);
  if (true){
    const FPS = 30;
    let cnvs = document.getElementById('video-flow');
    //processVideo(camera, cnvs);
  }else{
    alert("camera not found");
  }
};

function processVideo(camera, cnvs) {
    try {
        if (!streaming) {
          clearTimeout(id);
          return;
        }
        let begin = Date.now();

        // start processing.
        camera.read((err, im)=>{
          if (err) throw err;
          if (im.size()[0] > 0 && im.size()[1] >1){
            im.detectObject(cv.FACE_CASCADE, {}, (err, faces)=>{
              if (err) throw err;
              for (let i= 0 ; i < faces.length; i++){
                    let face = faces[i];
                    im.rectangle([face.x, face.y], [face.width, face.height], rectColor, rectThickness);
              }
              cv.imshow(cnvs, im);
            });
          }
        });
        let delay = 1000/FPS - (Date.now() - begin);
        var id = setTimeout(processVideo, delay);
    } catch (err) {
        console.log(err);
    }
};

function saveImage (){
    let fileName = 'screen' + Date.now()+ '.jpeg';
    let canvas = document.getElementById('video-flow');
    var ctx = canvas.getContext('2d');
    ctx.fillRect(25,25,100,100);
    ctx.clearRect(45,45,60,60);
    ctx.strokeRect(50,50,50,50);
    var image = canvas.toDataURL("image/jpeg");//.replace("image/png", "image/octet-stream");
    console.log(image);
    fs.writeFile(fileName, image, 'binary', (err)=>{
      if (err) throw err;
    });
}

function setupDirectory(){
  let setupDir = document.getElementById('setupDir');
  //const ipcRenderer = require('electron').ipcRenderer;
//  ipcRenderer.sendSync('synchronous-message', pathFile);
  //readDirectory(pathFile);
  console.log(setupDir.files[0].path);
  fs.writeFileSync('path.txt', 'asdsad');
  if (setupDir.files.length > 1 ){
    fs.writeFileSync('path.txt', 'asdsad');
    readDirectory();
  }
}

function readDirectory(){

  //const ipcRenderer = require('electron').ipcRenderer;
  //console.log(ipcRenderer.sendSync('synchronous-message', 'ping')); // prints "pong"

  /*ipcRenderer.on('asynchronous-reply', (event, arg) => {
    console.log(arg);
    event.sender.send('asynchronous-reply', 'ping');
  });*/

   var res = fs.readFileSync('path.txt');
   pathFile = res;
   console.log(pathFile);
}
