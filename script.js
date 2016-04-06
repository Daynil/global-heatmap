'use strict';
require('./styles.css');
const d3 = require('d3');
const axios = require('axios');

const w = 1200;
const h = 600;

window.onload = init();

function init() {
	axios.get('https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json')
		.then(res => {
			plotData(res.data);
		});
}

function plotData(jsonData) {
	/* Data JSON format:
		{
			"baseTemperature": 8.66,
			"monthlyVariance": [
			{
				"year": 1753,
				"month": 1,
				"variance": -1.366
			},...]
		}
	*/

	let baseTemp = jsonData['baseTemperature'];
	let dataset = jsonData['monthlyVariance'];
	
/*	let xScale = d3.scale.ordinal()
					.domain(d3.range((dataset.length / 12)))
					.rangeRoundBands([0, w], 0.01);*/
	let xScale = d3.scale.linear()
					.domain([dataset[0]['year'], dataset[dataset.length - 1]['year']])
					.range([0, w]);
	let yScale = d3.scale.ordinal()
					.domain(d3.range(1, 13))
					.rangeRoundBands([0, h], 0.01);
	
	let svg = d3.select('#chart')
				.append('svg')
				.attr('width', w)
				.attr('height', h);
	console.log(dataset.length);
	svg.selectAll('rect')
		.data(dataset)
		.enter()
		.append('rect')
		.attr('x', d => xScale(d['year']))
		.attr('y', d => yScale(d['month']))
		.attr('width',  w / (dataset.length / 12) )
		.attr('height', yScale.rangeBand())
		.attr('fill', d => {
			let avgMonthTemp = baseTemp + d['variance'];
			let cellCol = getCellColor(avgMonthTemp);
			return cellCol;
		});
}

function getCellColor(avgMonthTemp) {
	/*let maxColor = 255;
	let maxTemp = 13;
	let minTemp = 0;
	let redRatio = avgMonthTemp / maxTemp;
	let greenRatio = Math.abs( (avgMonthTemp - maxTemp) ) / (maxTemp / 2);
	let blueRatio = (maxTemp - avgMonthTemp) / maxTemp;
	let red = Math.floor(maxColor * redRatio);
	let green = Math.floor(maxColor * greenRatio);
	let blue = Math.floor(maxColor * blueRatio);*/
	let coldTemp = 260;
	let skipPoint = 155;
	let skipAmount = 85;
	let hotTemp = 0;
	let maxDataTemp = 13;
	
	let heatRatio = avgMonthTemp / maxDataTemp; // The higher the avgTemp the higher the ratio
	let colorTemp = Math.floor(coldTemp - ((coldTemp - 80) * heatRatio));
	let alpha = 1;
	if (colorTemp < skipPoint && colorTemp > (skipPoint - skipAmount)) {
		colorTemp -= skipAmount;
	}
	
	if (colorTemp > 120 && colorTemp < 200) {
		alpha = 0.3;
	}
	
	return `hsla(${colorTemp}, 100%, 50%, ${alpha})`;
}