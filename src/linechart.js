class Linechart {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#linechart-vis");
		this.bounds = {
			minX: 50,
			maxX: 500,
			minY: 20,
			maxY: 500,
		};


		this.updateScaleX();
		this.updateScaleY();
		this.updateAxisX();
		this.updateAxisY();

		// The motherline should be the first value in the data
		this.persistentLineDataIndex = 0;
		this.updateLines()

		this.updatePlayheadLine();
		this.gas.addEventListenerToEvent("date", _ => this.updatePlayheadLine());
	}

	/*
	 * Moves the playhead line to the this.gas.date
	 */
	updatePlayheadLine() {
		this.svg.select("g#playback-follow")
			.attr("transform", `translate(${this.scaleX(this.gas.date)} 0)`)
			.select("line#playback-line")
			.attr("x1", 0)
			.attr("x2", 0)
			.attr("y1", this.bounds.minY)
			.attr("y2", this.bounds.maxY)
	}

	/*
	 * updates this.scaleX which takes a date and maps it to the x position
	 */
	updateScaleX() {
		let domain = this.gas.data[0].chart.map(d => dateMinuteToDate(d.date, d.minute));
		let range = [this.bounds.minX, this.bounds.maxX];
		this.scaleX = d3.scalePoint().domain(domain).range(range);
	}

	/*
	 * updates this.scaleY which takes a percent change and maps it to a y position
	 */
	updateScaleY() {
		let domain = this.gas.percentYValueRange;
		let range = [this.bounds.maxY, this.bounds.minY];
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

	updateLines() {
		let paths = this.svg.select("g#lines")
			.selectAll("path")
			.data(this.gas.data)
		paths
			.join("path")
			.attr("stroke", d => this.gas.colorFunc(d.sector))
			.classed("linechart-path", true)
			.attr("d", d => {
				return d3.line()
				.x(d_m => this.scaleX(dateMinuteToDate(d_m.date, d_m.minute)))
				.y((_, i) => this.scaleY(getPercChange(d, i, this.gas.yValueName)))
				(d.chart)
			}
			)
	}
}
