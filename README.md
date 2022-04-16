Face detecation
================
Desktop application face detection on web-cam flow


## Usage

```
git clone https://github.com/sshaplygin/face-detection.git
cd face-recog
npm install
npm start

```

If you want tested opencv only command windows use:
```
node webcam.js
```

If you want pack, rebuild or run with debug use:
```
"pack": "electron-builder --dir",
"rebuild": "electron-rebuild -f -w opencv4nodejs",
"dev": "electron . --debug"
```

## Depencies

* electron
* electron-builder
* electron-compilers
* electron-rebuild
* opencv
