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
npm -D install three
npm -D install --save-dev @types/three
npm -g install webpack
npm install html-webpack-plugin
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
