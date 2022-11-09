class Linechart {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#linechart-vis");
		this.bounds = {
			minX: 20,
			maxX: 500,
			minY: 20,
			maxY: 500,
		};


	}

	/*
	 * updates this.scaleX which takes a date and maps it to the x position
	 */
	updateScaleX() {
	}
}
