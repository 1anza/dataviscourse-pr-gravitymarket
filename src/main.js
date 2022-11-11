import { scaleDiscontinuous, discontinuityRange } from 'd3fc-discontinuous-scale';
import { scaleLinear, axisBottom } from 'd3-scale';
import {GlobalAppState} from './globalAppState.js';
import {createPlaybackControls} from './playbackControls.js';
import {Beeswarm} from './beeswarm.js';
import {Linechart} from './linechart.js';
import {Ohlc} from './ohlc.js';
import {addDevTools} from './dev.js';

function main() {
	d3.json("fromMay2022.json").then((data) => {
		console.log("Loaded data.");

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
