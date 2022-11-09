// attaches dev elements

function addDevTools(gas) {
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
	];

	d3.select("div#playback-div")
		.append("div")
		.text("toggle grouping:")
		.selectAll("input")
		.data(sectors)
		.enter()
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
