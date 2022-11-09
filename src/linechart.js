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
		this.updateScaleY();
		this.updateAxisX();
		this.updateAxisY();
	}

	/*
	 * updates this.scaleX which takes a date and maps it to the x position
	 */
	updateScaleX() {
		let domain = this.gas.dateValueRange;
		let range = [this.bounds.minX, this.bounds.maxX];
		this.scaleX = d3.scaleTime().domain(domain).range(range);

		//let testrow = this.gas.data[0].chart[0];
		//console.log(this.scaleX(dateMinuteToDate(testrow.date, testrow.minute)))
	}

	updateScaleY() {
		let domain = this.gas.yValueDataRange;
		let range = [this.bounds.minY, this.bounds.maxY];
		this.scaleY = d3.scaleLinear().domain(domain).range(range);
	}

	updateAxisX() {
		let axisG = this.svg.select("g#x-axis")
			.attr("transform", `translate(0 ${this.bounds.maxY})`);
		let xAxis = d3.axisBottom(this.scaleX);
		axisG.call(xAxis);
	}

	updateAxisY() {
		let axisG = this.svg.select("g#y-axis")
			.attr("transform", `translate(${this.bounds.minX} 0)`);

		let yAxis = d3.axisLeft(this.scaleY);
		axisG.call(yAxis);
	}
}
