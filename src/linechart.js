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


		this.updateScaleX();
	}

	/*
	 * updates this.scaleX which takes a date and maps it to the x position
	 */
	updateScaleX() {
		let domain = this.gas.dateValueRange;
		let range = [this.bounds.minX, this.bounds.maxX];
		this.scaleX = d3.scaleTime().domain(domain).range(range);
		let testrow = this.gas.data[0].chart[0];
		//console.log(this.scaleX(dateMinuteToDate(testrow.date, testrow.minute)))
	}
}
