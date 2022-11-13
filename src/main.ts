import {GlobalAppState} from './globalAppState';
import {createPlaybackControls} from './playbackControls';
import {Beeswarm} from './beeswarm';
import {Linechart} from './linechart';
import {Ohlc} from './ohlc';
import {addDevTools} from './dev';
import * as d3 from "d3";

function main() {
	d3.json("fromMay2022.json").then((data) => {
		console.log("---- Loaded data ----");

		let gas = new GlobalAppState(data);

		createPlaybackControls(gas);

		let beeswarm = new Beeswarm(gas);
		let linechart = new Linechart(gas);
		let ohlc = new Ohlc(gas);

		// TODO Test setting sectors
		addDevTools(gas);
	});
}

main();
