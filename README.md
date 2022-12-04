# dataviscourse-pr-gravitymarket

# Beeswarm chart with dynamic node aggregation

### How to run this

* Make sure you have `npm` installed
* Go to the root dir of this project and run `npm i`
* To start the local dev server, run `npm run dev`

### How to build this

* Follow the instructions for running first, make sure that you are able to run the dev server.

* Run `npm run build`, a `./dist/` folder will be created and filled with the distributible website files.

### Project structure and build system

Files `./src/*.js` are built into browser interpretable javascript using Parcel.js. Different elements of visualizations are separated into different files. The `./src/globalAppState.js` defines the global state of the application, with events and event listeners.

Html files `./*.html` are are served as web pages. 

Additional files in `./res` and `./data/` are served as resource content for the website.

### Project Video

Link to the project video: https://youtu.be/VhVIM8NMe6I

### Website

Link to the project website: https://1anza.github.io/dataviscourse-pr-gravitymarket/
