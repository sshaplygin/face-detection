const fs = require('fs');
const path = require('path');
const cv = require('opencv');

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
    findFace();
}

function findFace() {
  let camera = new cv.VideoCapture(0);
  if (camera){
    let cnvs = document.getElementById('video-flow');
    processVideo(camera, cnvs);
  }else{
    alert("camera not found");
  }
};

function processVideo(camera, cnvs) {
    const FPS = 30;
    try {
        if (!streaming) {
          clearTimeout(id);
          return;
        }
        let begin = Date.now();

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
    var image = canvas.toDataURL("image/png").replace(/^data:image\/\w+;base64,/, "");;
    var buf = new Buffer(image, 'base64');
    fs.writeFile(path.join(pathFile, fileName), buf, (err)=>{
      if (err) throw err;
    });
}

function setupDirectory(){
  let setupDir = document.getElementById('setupDir');
  if (setupDir.files.length >= 1 ){
    fs.writeFileSync('path.txt', path.normalize(setupDir.files[0].path));
    readDirectory();
  }
}

function readDirectory(){
   var res = fs.readFileSync('path.txt', 'utf-8');
   pathFile = res;
}
