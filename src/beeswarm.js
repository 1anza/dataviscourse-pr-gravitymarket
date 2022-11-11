import {dateMinuteToDate, getPercChange} from "./util.js";

export class Beeswarm {
	constructor(gas) {
		this.gas = gas;
		let svg_width = parseInt(d3.select("svg#beeswarm-vis").style("width"));
		let svg_height = parseInt(d3.select("svg#beeswarm-vis").style("height"));
		this.bounds = {
			minX: 20,
			maxX: svg_width - 90,
			minY: 20,
			maxY: svg_height - 80,
		};

		// When selectedSectors changes we need to redraw the grid, and update the simulation x forces
		this.updateScaleX();
		this.updateScaleY();
		this.updateScaleRadius();

		this.updateRadiusKey();

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

		// We keep track of the previousSelectedSectors so that we know what was just added
		this.previousSelectedSectors = structuredClone(this.gas.selectedSectors);
		this.gas.addEventListenerToEvent("selectedSectors", (_) => {
			// Sets the visibility of all circles, hiding all ones not in the selectedSectors.
			if (this.gas.groupingBySector) {
				this.circles.attr("visibility", (d) =>
					this.gas.selectedSectors.has(d.sector) ? "visible" : "hidden"
				);
			} else {
				this.circles.attr("visibility", "visible");
			}
			this.updateScaleX();
			this.drawXAxis();
			this.updateCollisions();
			this.updateSimulationX();
			// previousSelectedSectors' union selectedSectors
			let newlyAdded = new Set();
			this.gas.selectedSectors.forEach((sector) =>
				this.previousSelectedSectors.has(sector) ? _ : newlyAdded.add(sector)
			);
			this.previousSelectedSectors = structuredClone(this.gas.selectedSectors);
			this.teleportCircles(
				this.circles.filter((d) => newlyAdded.has(d.sector))
			);
		});
	}

	/*  ----------------Data scales---------------------    */

	/*
	 * Sets this.scaleRadius to a function that maps the z value range as an area into a radius
	 */
	updateScaleRadius(minRadius = 3, maxRadius = 25) {
		let zValueRadiusRange = this.gas.zValueDataRange.map((x) =>
			Math.pow(x / Math.PI, 0.5)
		);
		let areaScale = d3
			.scaleLinear()
			.domain(zValueRadiusRange)
			.range([minRadius, maxRadius]);
		this.scaleRadius = (x) => areaScale(Math.pow(x / Math.PI, 0.5));
	}

	/*
	 * Draws a key for the radius
	 */
	updateRadiusKey() {
		// By default, the two values plotted are the min and max of the data
		let ticks = this.gas.zValueDataRange;
		let rad_key_offset = [20, 40];
		let rad_key = d3.select("g#radius-key");
		rad_key
			.attr(
				"transform",
				`translate(${this.bounds.maxX + rad_key_offset[0]} ${
					this.bounds.maxY + rad_key_offset[1]
				})`
			)
			.selectAll("circle")
			.data(ticks)
			.join("circle")
			.attr("r", (d) => this.scaleRadius(d))
			.attr("id", "beeswarm-key-circle");

		// Angle in radians
		let theta = Math.PI / 4;
		let format = d3.format(",.1f");
		rad_key
			.selectAll("text")
			.data(ticks)
			.join("text")
			.attr("x", (d) => this.scaleRadius(d) * Math.cos(theta))
			.attr("y", (d) => this.scaleRadius(d) * Math.sin(theta))
			.text((d) => `$${format(d / 1e9)}B`)
			.attr("id", "beeswarm-key-text");
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
			// This is a function sector => coordinate
			this.scaleX = (sector) => x_range[x_domain_map[sector]];
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
		let that = this;
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
			})
			/////////////////////////////////////////////////////////////////////
			.on("click", function () {
				let clicked = d3.select(this);
				let clicked_ = clicked._groups[0][0].__data__;
				clicked.classed("clicked-swarm-circ", true);
				console.log(clicked_);
				that.gas.set_selectedSingleCompany(clicked_);
			});
	}

	/*  ----------------Simulation----------------------    */

	startSimulation() {
		this.simulation = d3
			.forceSimulation(this.gas.data)
			.alphaTarget(0.1)
			.velocityDecay(0.1)
			.on("tick", (_) => {
				this.circles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
			});

		// Sets the starting locations
		this.circles.datum((d) => {
			d.x = this.scaleX(d.sector);
			return d;
		});

		this.updateCollisions();
		this.updateSimulationX();
		this.updateSimulationY();
		console.log(this.simulation);
	}

	/*
	 * Enables collisions only for datapoints that are in the selectedSectors
	 */
	updateCollisions() {
		this.simulation.force(
			"collide",
			d3
				.forceCollide()
				.radius((d) => {
					if (this.gas.groupingBySector) {
						return this.gas.selectedSectors.has(d.sector)
							? this.scaleRadius(d[this.gas.zValueName])
							: 0;
					} else {
						return this.scaleRadius(d[this.gas.zValueName]);
					}
				})
				.iterations(2)
				.strength(this.simulationSettings.collisionStrength)
		);
	}

	/*
	 * Sets an X force, only for datapoints that are in the selectedSectors
	 */
	updateSimulationX() {
		this.simulation.force(
			"x",
			d3
				.forceX()
				.x((d) => {
					if (
						this.gas.groupingBySector &&
						!this.gas.selectedSectors.has(d.sector)
					) {
						return 0;
					} else {
						return this.scaleX(d.sector);
					}
				})
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
				.y((d) =>
					this.scaleY(getPercChange(d, this.gas.index, this.gas.yValueName))
				)
				.strength(
					this.simulationSettings.globalForceScale *
						this.simulationSettings.forceYScale
				)
		);
	}

	/*
	 * Takes a selection of circles, and sets their x and y values based on
	 * their data
	 */
	teleportCircles(circles) {
		circles.datum((d) => {
			// Puts them with some random x values
			let spread = d3.randomNormal(
				0,
				(this.bounds.maxX - this.bounds.minX) / 30
			);
			d.x = this.scaleX(d.sector) + spread();
			d.y = this.scaleY(getPercChange(d, this.gas.index, this.gas.yValueName));
			return d;
		});
	}
}
