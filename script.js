'use strict';
require('./styles.css');
const d3 = require('d3');
const axios = require('axios');
const _ = require('lodash');

const w = 1200;
const h = 600;

let mouse = {x: 0, y: 0}

window.onload = init();
window.onmousemove = updateMouse;

function init() {
	axios.get('https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json')
		.then(res => {
			plotData(res.data);
		});
}

function updateMouse(e) {
	mouse.x = e.pageX;
	mouse.y = e.pageY;
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
	
	let xAxisTicks = _.sortedUniq(dataset.map(month => month['year'])).filter(num => num % 10 === 0);
	let xAxis = d3.svg.axis().scale(xScale).orient('bottom').tickValues(xAxisTicks).tickFormat(d3.format('04d'));
	
	let yAxisTicks = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
						'August', 'September', 'October', 'November', 'December'];
	let yAxis = d3.svg.axis().scale(yScale).orient('left').tickFormat(d => yAxisTicks[d - 1]);
	
	let svg = d3.select('#chart')
				.append('svg')
				.attr('width', w + 20)
				.attr('height', h)
				.style('padding', 20 + 'px')
				.style('padding-left', 70 + 'px');
				
	svg.append('g')
		.attr('class', 'x axis')
		.attr('transform', `translate(0, ${h})`)
		.call(xAxis);
		
	svg.append('g')
		.attr('class', 'y axis')
		.attr('transform', 'translate(-1, 0)')
		.call(yAxis);
	
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
		})
		.on('mouseover', d => {
			let tooltip = d3.select('#tooltip');
			tooltip.classed('hidden', false);
			let tooltipDoc = document.getElementById('tooltip');
			let tooltipH = tooltipDoc.clientHeight;
			let tooltipW = tooltipDoc.clientWidth;
			tooltip
				.style('left', (mouse.x - tooltipW/2) + 'px')
				.style('top', (mouse.y - tooltipH) + 'px')
				.select('#month')
				.text(yAxisTicks[d['month'] - 1]);
			tooltip
				.select('#year')
				.text(d['year']);
			tooltip
				.select('#temperature')
				.text(_.round(baseTemp + d['variance'], 3));
			tooltip
				.select('#delta')
				.text(d['variance']);
		})
		.on('mouseout', () => d3.select('#tooltip').classed('hidden', true));
		
	// Legend
	let legendData =  d3.range(baseTemp + d3.max(dataset, d => d['variance']));
	let legendCellWidth = 30;
	d3.select('#legend')
		.append('svg')
		.attr('width', legendData.length * legendCellWidth)
		.attr('height', 20)
		.selectAll('rect')
		.data(legendData)
		.enter()
		.append('rect')
		.attr('x', (d, i) => i * legendCellWidth + legendCellWidth)
		.attr('height', 30)
		.attr('width', legendCellWidth)
		.attr('fill', d => getCellColor(d));
}

function getCellColor(avgMonthTemp) {
	let coldTemp = 260;
	let skipPoint = 180;
	let skipAmount = 90;
	let hotTemp = 0;
	let maxDataTemp = 13;
	
	let heatRatio = avgMonthTemp / maxDataTemp; // The higher the avgTemp the higher the ratio
	let colorTemp = Math.floor(coldTemp - ((coldTemp - (skipPoint - skipAmount)) * heatRatio));
	let alpha = 1;
	if (colorTemp < skipPoint && colorTemp > (skipPoint - skipAmount)) {
		colorTemp -= skipAmount;
	}
	
	if (colorTemp > 120 && colorTemp < 200) {
		alpha = 0.9;
	}
	
	return `hsla(${colorTemp}, 100%, 50%, ${alpha})`;
}