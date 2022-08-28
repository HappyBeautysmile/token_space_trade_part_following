# space-trade
Real Time Economy

## Develpment

Basic build steps:

```
tsc -p ts/tsconfig.json
webpack
```

Required packages:
```
npm install                               // to install from the package lock

-- or --

npm -D install three@0.140.0              //Version 0.141.0 is not working with this project.
npm -D install --save-dev @types/three
npm -g install webpack
npm install html-webpack-plugin
npm install @google-cloud/storage
npm install multer
```

Start an HTTP server from python (you can leave this running):

python3 -m http.server 8888
Then you can browse to the page on localhost:

http://localhost:8888/dist

Ctrl-Shift-J to see the console log

To enable mouse-as-grip use these parameters:

http://localhost:8888/dist/?mouse=0&hr=0


Happy coding!

## Overview
