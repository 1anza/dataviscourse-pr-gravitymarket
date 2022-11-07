class Beeswarm {
	constructor(gas) {
		this.gas = gas;
		this.bounds = {
			minX: 20,
			maxX: 1000,
			minY: 20,
			maxY: 1000,
		};

		// When selectedSectors changes we need to redraw the grid, and update the simulation x forces
		this.updateScaleX();
		this.updateScaleY();
		this.updateScaleRadius();

		this.drawYAxis();
		this.drawXAxis();

		this.initTooltip();
		this.drawCircles();

		this.simulationSettings = {
			globalForceScale: 1,
			forceXScale: 0.01,
			forceYScale: 0.1,
			collisionStrength: 1.0,
		};

		this.startSimulation();
		this.gas.addEventListenerToEvent("index", (_) => this.updateSimulationY());

		this.gas.addEventListenerToEvent("selectedSectors", (_) => {
			this.updateScaleX();
			this.drawXAxis();
			if (this.gas.groupingBySector) {
				this.circles = this.circles.filter((d) =>
					this.gas.selectedSectors.has(d.sector)
				);
			} else {
				this.drawCircles();
			}
			console.log(this.circles);
			//this.drawCircles();
			this.updateSimulationX();
		});
	}

	getPercChange(row) {
		return (
			(row.chart[this.gas.index][this.gas.yValueName] /
				row.chart[0][this.gas.yValueName] -
				1) *
			100
		);
	}

	/*  ----------------Data scales---------------------    */

	updateScaleRadius(minRadius = 5, maxRadius = 50) {
		this.scaleRadius = d3
			.scaleLinear()
			.domain(this.gas.zValueDataRange)
			.range([minRadius, maxRadius]);
	}

	updateScaleX() {
		if (this.gas.groupingBySector) {
			let step =
				(this.bounds.maxX - this.bounds.minX) /
				(this.gas.selectedSectors.size + 1);
			let x_range = d3.range(
				this.bounds.minX + step,
				this.bounds.maxX + step + 0.001,
				step
			);
			let x_domain_map = {};
			// Hacky way to get a dict of {sector: index}
			let i = 0;
			for (let sec of this.gas.selectedSectors.keys()) {
				x_domain_map[sec] = i;
				i += 1;
			}
			console.log(x_domain_map);
			console.log(x_range);
			// This is a function sector => coordinate
			this.scaleX = (sector) => x_range[x_domain_map[sector]];
			console.log(this.scaleX("Health Care"));
		} else {
			this.scaleX = (_) => (this.bounds.maxX - this.bounds.minX) / 2;
		}
	}

	updateScaleY() {
		this.scaleY = d3
			.scaleLinear()
			.domain([-60, 100])
			.range([this.bounds.maxY, this.bounds.minY]);
	}

	/*  ----------------Rendering-----------------------    */

	drawYAxis() {
		// Hardcoded ticks
		// this can be made to be dynamic - just base
		// these ticks on the extent of the percentages in the data at
		// the current index.
		let ticks = d3.range(-60, 100.01, 20);

		let grid = d3.select("svg#beeswarm-vis").select("g#grid");
		let lines = grid.selectAll("line#horizontal").data(ticks);
		lines.exit().remove();
		lines
			.join("line")
			.attr("id", "horizontal")
			.attr("x1", this.bounds.minX)
			.classed("beeswarm-gridline", true)
			.attr("x2", this.bounds.maxX)
			.attr("y1", (d) => this.scaleY(d))
			.attr("y2", (d) => this.scaleY(d));

		let axis_labels = grid.selectAll("text#axis-label-y").data(ticks);
		axis_labels.exit().remove();
		axis_labels
			.join("text")
			.attr("id", "axis-label-y")
			.attr("x", this.bounds.maxX)
			.attr("y", (d) => this.scaleY(d))
			.text((d) => `${d}%`);
	}

	drawXAxis() {
		let grid = d3.select("svg#beeswarm-vis").select("g#grid");
		let data_to_bind;
		if (this.gas.groupingBySector) {
			data_to_bind = this.gas.selectedSectors;
		} else {
			data_to_bind = [""];
		}
		let lines = grid.selectAll("line#vertical").data(data_to_bind);
		lines.exit().remove();
		lines
			.join("line")
			.attr("id", "vertical")
			.attr("x1", (d) => this.scaleX(d))
			.attr("x2", (d) => this.scaleX(d))
			.attr("y1", this.bounds.minY)
			.attr("y2", this.bounds.maxY)
			.classed("beeswarm-gridline", true);
		let text = grid.selectAll("text#axis-label-x").data(data_to_bind);
		text.exit().remove();
		text
			.join("text")
			.attr("id", "axis-label-x")
			.attr("x", (d) => this.scaleX(d))
			.attr("y", this.bounds.maxY)
			.text((d) => d);
	}

	initTooltip() {
		this.tooltip = d3
			.select("div#beeswarm")
			.append("div")
			.attr("id", "beeswarm-tooltip")
			.attr("class", "tooltip")
			.style("opacity", 0)
			.style("pointer-events", "none");
	}

	drawCircles() {
		let tooltip = this.tooltip;
		this.circles = d3
			.select("svg#beeswarm-vis")
			.select("g#swarm")
			.selectAll("circle")
			.data(this.gas.data);
		this.circles.exit().remove();
		this.circles = this.circles
			.join("circle")
			.attr("fill", (d) => this.gas.colorFunc(d.sector))
			.attr("r", (d) => this.scaleRadius(d[this.gas.zValueName]))
			.classed("swarm-circ", true)
			.on("mouseover", function (_) {
				let hovered = d3.select(this);
				let _data = hovered._groups[0][0].__data__;
				let sector = `${_data.sector}`;
				let html = `Ticker: "${_data.ticker}" Sector: ${sector}`;
				// Sets tooltip to be visible
				tooltip.style("opacity", 1).html(html);
				hovered.classed("hovered-swarm-circ", true);
			})
			.on("mousemove", (e) => {
				tooltip
					.style("left", `${e.pageX + 10}px`)
					.style("top", `${e.pageY + 10}px`);
			})
			.on("mouseleave", function (_) {
				let hovered = d3.select(this);
				tooltip.style("opacity", 0);
				hovered.classed("hovered-swarm-circ", false);
			});
	}

	/*  ----------------Simulation----------------------    */

	startSimulation() {
		this.simulation = d3
			.forceSimulation(this.gas.data)
			.alphaTarget(0.1)
			.velocityDecay(0.1)
			.force(
				"collide",
				d3
					.forceCollide()
					.radius((d) => this.scaleRadius(d[this.gas.zValueName]))
					.iterations(2)
					.strength(this.simulationSettings.collisionStrength)
			)
			.on("tick", (_) => {
				this.circles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
			});

		// Sets the starting locations
		this.circles.datum((d) => {
			d.x = this.scaleX(d.sector);
			//d.y = this.scaleY(this.getPercChange(d));
			return d;
		});

		this.updateSimulationX();
		this.updateSimulationY();
	}

	updateSimulationX() {
		this.simulation.force(
			"x",
			d3
				.forceX()
				.x((d) => this.scaleX(d.sector))
				.strength(
					this.simulationSettings.globalForceScale *
						this.simulationSettings.forceXScale
				)
		);
	}

	updateSimulationY() {
		this.simulation.force(
			"y",
			d3
				.forceY()
				.y((d) => this.scaleY(this.getPercChange(d)))
				.strength(
					this.simulationSettings.globalForceScale *
						this.simulationSettings.forceYScale
				)
		);
	}
}
