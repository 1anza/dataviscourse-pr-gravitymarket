// attaches dev elements

export function addDevTools(gas) {
	let sectors = [
		"Industrials",
		"Health Care",
		"Technology",
		"Communication Services",
		"Consumer Cyclical",
		"Energy",
		"Financials",
		"Basic Materials",
		"Real Estate",
		"Consumer Staples",
		"Utilities",
		"Index",
	];
	console.log(d3.select("div#playback-div"));

	d3.select("div#playback-div")
		.append("div")
		.text("toggle grouping:")
		.selectAll("g")
		.data(sectors)
		.enter()
		.append("g")
		.html((d) => d)
		.append("input")
		.attr("type", "checkbox")
		.on("change", (e) => {
			let sector = e.target.__data__;
			if (e.target.checked) {
				gas.selectedSectors.add(sector);
			} else {
				gas.selectedSectors.delete(sector);
			}
			gas.set_selectedSectors(gas.selectedSectors);
		});
}
