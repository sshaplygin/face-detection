const cv = require('opencv');
var path = require('path');

  try{
    var camera = new cv.VideoCapture(0);
    var window = new cv.NamedWindow('Video', 0);
    var rectColor = [0, 255, 0];
    var rectThickness = 2;
    setInterval(()=>{
      camera.read((err, im)=>{
        if (err) throw err;
        //console.log(im.size());
        if (im.size()[0] > 0 && im.size()[1] >1){
          im.detectObject(cv.FACE_CASCADE, {}, (err, faces)=>{
            if (err) throw err;
            for (let i= 0 ; i < faces.length; i++){
                  let face = faces[i];
                  im.rectangle([face.x, face.y], [face.width, face.height], rectColor, rectThickness);
            }
            window.show(im);
          });
        }
        window.blockingWaitKey(0, 50);
      });
    }, 10);
  }catch(e){
    console.log("Couldn't start camera:", e);
  }
