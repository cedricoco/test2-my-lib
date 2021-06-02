import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import * as i0 from "@angular/core";
const _c0 = ["root"];
const _c1 = ["scroll"];
const _c2 = ["zone"];
export function parseBool(s) {
    if (s == 'ON')
        return 1;
    else if (s == 'OFF')
        return 0;
    else
        return -1;
}
export class MyLibComponent {
    constructor(renderer) {
        this.renderer = renderer;
        this.width = 900;
        this.height = 200;
        this.data = [];
        this.domain = [0, 0];
        this.range = [0, 0];
        this.rangeChange = new EventEmitter();
        this.currentTime = 0;
        this.currentTimeChange = new EventEmitter();
        this.title = 'Timeline : ';
        this.margin = { top: 20, right: 20, bottom: 30, left: 50 }; //marge interne au svg 
        this.dataZoom = [];
        this.idZoom = 0;
        this.minTime = 0;
        this.maxTime = 0;
        this.lengthTime = 0;
        this.svgWidth = 0;
        this.svgHeight = 0;
        this.scaleX = d3.scaleTime();
        this.scaleY = d3.scaleLinear();
        this.area = [];
        this.line = [];
        this.lastDatalength = 0;
        this.modeToolTips = "normal";
        this.currentTimeSelected = false;
        this.scrollbarSelected = false;
        this.lastPos = 0;
    }
    /**
     * Copy data in dataZoom, and build title
     */
    ngOnInit() {
        this.dataZoom = [...this.data];
        this.lastDatalength = this.dataZoom.length;
        this.data.forEach((element, index) => {
            if (index == this.data.length - 1)
                this.title = this.title + element.label + '.';
            else
                this.title = this.title + element.label + ', ';
        });
    }
    /**
     * Initialize linechart
     */
    ngAfterViewInit() {
        if (this.timeline != undefined) {
            let w = this.timeline.nativeElement.width.animVal.value;
            let h = this.timeline.nativeElement.height.animVal.value;
            this.svgWidth = (w - this.margin.left) - this.margin.right;
            this.svgHeight = (h - this.margin.top) - this.margin.bottom;
        }
        this.data.forEach((element, index) => this.buildStyleData(element, index));
        this.buildZoom();
        this.buildEvent();
        this.drawToolTips();
        this.drawAxis();
        this.drawLineAndPath();
        this.drawLineCurrentTime();
        this.drawScrollbar();
    }
    /**
     * Update linechart on data, range or current time changes
     * @param {SimpleChanges} changes
     */
    ngOnChanges(changes) {
        if (changes.data && !changes.data.firstChange)
            this.updateChart();
        if ((changes.data && !changes.data.firstChange && this.range[0] != 0 && this.range[1] != 0) || (changes.range && !changes.range.firstChange)) {
            this.idZoom = Math.round(Math.log(this.lengthTime / (this.range[1] - this.range[0])) / Math.log(1.5));
            this.range = this.controlRange(this.range[0], this.range[1] - this.range[0]);
            if (this.data.length != 0) {
                this.updateDataZoom(this.range[0], this.range[1]);
                this.updateSvg(this.range[0], this.range[1]);
            }
        }
        if (changes.currentTime && !changes.currentTime.firstChange && this.data.length != 0)
            this.updateCurrentTime();
    }
    /**
     * Add event listeners on the svg
     */
    buildEvent() {
        this.svg = d3.select(this.timeline.nativeElement)
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
        d3.select(this.timeline.nativeElement).on("mousemove", (event) => {
            if (this.currentTimeSelected)
                this.moveCurrentTime(event);
            else
                this.showInfo(event);
        })
            .on("mouseleave", () => { this.currentTimeSelected = false; this.hideInfo(); })
            .on("wheel", (event) => this.activeZoom(event))
            .on("mouseup", () => this.currentTimeSelected = false)
            .on("mouseover", (event) => event.preventDefault());
    }
    /**
     * Build the style (area, line or both) and the interpolation (stpe or linear) of lines
     * @param {Data} element
     * @param {number} index
     */
    buildStyleData(element, index) {
        if (element.style == "area" || element.style == "both") {
            if (element.interpolation == "step") {
                this.area[index] = d3.area()
                    .x((d) => this.scaleX(d[0]))
                    .y0(this.svgHeight)
                    .y1((d) => this.scaleY(d[1]))
                    .curve(d3.curveStepAfter);
            }
            else {
                this.area[index] = d3.area()
                    .x((d) => this.scaleX(d[0]))
                    .y0(this.svgHeight)
                    .y1((d) => this.scaleY(d[1]));
            }
        }
        if (element.style == "line" || element.style == "both") {
            if (element.interpolation == "step") {
                this.line[index] = d3.line()
                    .x((d) => this.scaleX(d[0]))
                    .y((d) => this.scaleY(d[1]))
                    .curve(d3.curveStepAfter);
            }
            else {
                this.line[index] = d3.line()
                    .x((d) => this.scaleX(d[0]))
                    .y((d) => this.scaleY(d[1]));
            }
        }
        if (!this.controlColor(element.color)) {
            element.color = "black";
        }
    }
    /**
     * Save information for zoom.
     */
    buildZoom() {
        this.minTime = this.scale(this.data, "xMin");
        this.maxTime = this.scale(this.data, "xMax");
        this.lengthTime = this.maxTime - this.minTime;
        this.idZoom = 0;
    }
    /**
     * Draw the tooltips's svg
     */
    drawToolTips() {
        this.tooltip = this.svg.append("g")
            .attr("id", "tooltip")
            .style("display", "none");
        // Le cercle extérieur bleu clair
        this.tooltip.append("circle")
            .attr("fill", "#CCE5F6")
            .attr("r", 10);
        // Le cercle intérieur bleu foncé
        this.tooltip.append("circle")
            .attr("fill", "#3498db")
            .attr("stroke", "#fff")
            .attr("stroke-width", "1.5px")
            .attr("r", 4);
        // Le tooltip en lui-même avec sa pointe vers le bas
        // Il faut le dimensionner en fonction du contenu
        let taille = this.dataZoom.length;
        if (this.modeToolTips == "normal") {
            this.tooltip.append("polyline")
                .attr("points", "0,0 0," + (40 * taille) + ", 75," + (40 * taille) + ", 80," + (45 * taille) + " 85," + (40 * taille) + " 160," + (40 * taille) + " 160,0 0,0")
                .style("fill", "#fafafa")
                .style("stroke", "#3498db")
                .style("opacity", "0.9")
                .style("stroke-width", "1")
                .attr("transform", "translate(-80, " + (-50 * taille) + ")");
            this.dataZoom.forEach((element, index) => {
                // Cet élément contiendra tout notre texte
                let text = this.tooltip.append("text")
                    .style("font-size", "13px")
                    .style("font-family", "Segoe UI")
                    .style("color", element.color)
                    .style("fill", element.color)
                    .attr("transform", "translate(-80," + (-42 * (index + 1)) + ")");
                // Element pour la date avec positionnement spécifique
                text.append("tspan")
                    .attr("dx", "7")
                    .attr("dy", "5")
                    .attr("id", "tooltip-date1" + index);
                text.append("tspan")
                    .attr("dx", "-90")
                    .attr("dy", "15")
                    .attr("id", "tooltip-date2" + index);
            });
        }
        else {
            this.tooltip.append("polyline")
                .attr("points", "0," + (95 + ((taille - 1) * 40)) + " , 0,55 , 75,55 , 80,50 , 85,55 , 160,55 , 160," + (95 + ((taille - 1) * 40)) + " 0," + (95 + ((taille - 1) * 40)) + "")
                .style("fill", "#fafafa")
                .style("stroke", "#3498db")
                .style("opacity", "0.9")
                .style("stroke-width", "1")
                .attr("transform", "translate(-80, " + (-50 * 1) + ")");
            this.dataZoom.forEach((element, index) => {
                // Cet élément contiendra tout notre texte
                let text = this.tooltip.append("text")
                    .style("font-size", "13px")
                    .style("font-family", "Segoe UI")
                    .style("color", element.color)
                    .style("fill", element.color)
                    .attr("transform", "translate(-80," + (-30 * (index + 1)) + ")");
                // Element pour la date avec positionnement spécifique
                text.append("tspan")
                    .attr("dx", "7")
                    .attr("dy", 50 + 70 * index)
                    .attr("id", "tooltip-date1" + index);
                text.append("tspan")
                    .attr("dx", "-80")
                    .attr("dy", "20")
                    .attr("id", "tooltip-date2" + index);
            });
        }
    }
    /**
     * Draw horizontal and vertical axis and scale
     */
    drawAxis() {
        this.scaleX.range([0, this.svgWidth]);
        this.scaleX.domain([this.minTime, this.maxTime]);
        this.scaleY = d3.scaleLinear();
        this.scaleY.range([this.svgHeight, 0]);
        this.scaleY.domain(this.controlDomain());
        // Configure the X Axis
        this.svg.append('g')
            .attr('transform', 'translate(0,' + this.svgHeight + ')')
            .attr('class', 'xAxis')
            .call(d3.axisBottom(this.scaleX));
        // Configure the Y Axis
        if (this.discreteValue(this.data)) {
            this.svg.append('g')
                .attr('class', 'yAxis')
                .call(d3.axisLeft(this.scaleY).ticks(this.scale(this.data, "yMax")));
        }
        else {
            this.svg.append('g')
                .attr('class', 'yAxis')
                .call(d3.axisLeft(this.scaleY));
        }
    }
    /**
     * Draw lines on the line chart
     */
    drawLineAndPath() {
        this.dataZoom.forEach((element, index) => {
            if (element.style == "area" || element.style == "both") {
                this.svg.append('path')
                    .datum(this.dataZoom[index].values)
                    .attr('class', 'area' + index)
                    .attr('d', this.area[index])
                    .attr("stroke-width", 0.1)
                    .attr('opacity', 0.3)
                    .style('fill', element.color)
                    .style('stroke', element.color)
                    .style('stroke-width', '2px');
            }
            if (element.style == "line" || element.style == "both") {
                this.svg.append('path')
                    .datum(element.values)
                    .attr('class', 'line' + index)
                    .attr('d', this.line[index])
                    .style('fill', 'none')
                    .style('stroke', element.color)
                    .style('stroke-width', '2px');
            }
        });
    }
    /**
     * Draw the vertical line which represents the current time
     */
    drawLineCurrentTime() {
        if (this.data.length != 0) {
            if (this.currentTime == 0) {
                this.currentTime = this.scale(this.data, "xMin");
            }
            let x = 0;
            this.svg.append('path')
                .datum([[this.currentTime, this.controlDomain()[0]], [this.currentTime, this.svgHeight]])
                .attr('class', 'currentTimeLine')
                .attr('d', d3.line()
                .x((d) => x = this.scaleX(d[0]))
                .y((d) => this.scaleY(d[1])))
                .style('fill', 'none')
                .style('stroke', 'red')
                .style('stroke-width', '3px');
            this.svg.append('circle')
                .attr('class', 'currentTimeSelector')
                .attr('cx', x)
                .attr('cy', -13)
                .attr('r', 7)
                .attr('fill', 'red')
                .on("mousedown", () => {
                this.currentTimeSelected = true;
                this.hideInfo();
            });
        }
    }
    /**
     * Draw the scrollbar and event listener on it
     */
    drawScrollbar() {
        this.zoneScrollbar.nativeElement.style.width = this.svgWidth + "px";
        this.zoneScrollbar.nativeElement.style.marginLeft = this.margin.left + "px";
        this.zoneScrollbar.nativeElement.style.height = "20px";
        this.zoneScrollbar.nativeElement.style.backgroundColor = "lightgrey";
        this.zoneScrollbar.nativeElement.style.borderRadius = "10px";
        this.scrollbar.nativeElement.style.width = this.svgWidth + "px";
        this.scrollbar.nativeElement.style.height = "20px";
        this.scrollbar.nativeElement.style.backgroundColor = "grey";
        this.scrollbar.nativeElement.style.borderRadius = "10px";
        this.renderer.listen(this.scrollbar.nativeElement, 'mousedown', (event) => this.activeScrollbar(event));
        this.renderer.listen(this.zoneScrollbar.nativeElement, 'mouseleave', () => this.desactiveScrollbar());
        this.renderer.listen(this.zoneScrollbar.nativeElement, 'mouseup', () => this.desactiveScrollbar());
        this.renderer.listen(this.zoneScrollbar.nativeElement, 'mousemove', (event) => this.updateRange(event));
    }
    /**
     * Update all the line chart (horizontal and vertical axis and scale, data, lines and range) on data changes.
     */
    updateChart() {
        this.dataZoom = [...this.data];
        this.data.forEach((element, index) => {
            this.buildStyleData(element, index);
            if (element.style == "area")
                this.svg.selectAll('.line' + index).remove();
            if (element.style == "line")
                this.svg.selectAll('.area' + index).remove();
            this.title = 'Timeline : ';
            if (index == this.data.length - 1)
                this.title = this.title + element.label + '.';
            else
                this.title = this.title + element.label + ', ';
        });
        this.buildZoom();
        this.scaleX.domain([this.minTime, this.maxTime]);
        this.scaleY.range([this.svgHeight, 0]);
        this.controlDomain();
        this.scaleY.domain(this.controlDomain());
        if (this.discreteValue(this.data)) {
            this.svg.selectAll('.yAxis')
                .call(d3.axisLeft(this.scaleY).ticks(this.scale(this.data, "yMax")));
        }
        else {
            this.svg.selectAll('.yAxis')
                .call(d3.axisLeft(this.scaleY));
        }
        this.svg.selectAll('.xAxis').call(d3.axisBottom(this.scaleX));
        this.svg.selectAll('.currentTimeLine').remove();
        this.svg.selectAll('.currentTimeSelector').remove();
        this.updateLine();
        this.drawLineCurrentTime();
        this.updateScrollbar(this.minTime, this.maxTime);
        this.updateToolTips();
        for (let index = this.dataZoom.length; index < this.lastDatalength; index++) {
            this.svg.selectAll('.line' + index).remove();
            this.svg.selectAll('.area' + index).remove();
        }
        this.lastDatalength = this.dataZoom.length;
    }
    /**
     * Update horizontal axis, current time line, lines and scrollbar
     * @param {number} min of the new range
     * @param {number} max of the new range
     */
    updateSvg(min, max) {
        this.scaleX.domain([min, max]);
        this.svg.selectAll('.xAxis').call(d3.axisBottom(this.scaleX));
        this.updateLine();
        this.updateCurrentTime();
        this.updateScrollbar(min, max);
    }
    /**
     * Update the display of lines
     */
    updateLine() {
        let lineUpdate;
        let areaUpdate;
        this.dataZoom.forEach((element, index) => {
            if (element.style == "area" || element.style == "both") {
                areaUpdate = this.svg.selectAll('.area' + index).data([this.dataZoom[index].values]);
                areaUpdate
                    .enter()
                    .append("path")
                    .attr('class', 'area' + index)
                    .merge(areaUpdate)
                    .attr('d', this.area[index])
                    .attr("stroke-width", 0.1)
                    .attr('opacity', 0.3)
                    .style('fill', element.color)
                    .style('stroke', element.color)
                    .style('stroke-width', '2px');
            }
            if (element.style == "line" || element.style == "both") {
                lineUpdate = this.svg.selectAll('.line' + index).data([this.dataZoom[index].values]);
                lineUpdate
                    .enter()
                    .append("path")
                    .attr('class', 'line' + index)
                    .merge(lineUpdate)
                    .attr('d', this.line[index])
                    .style('fill', 'none')
                    .style('stroke', element.color)
                    .style('stroke-width', '2px');
            }
        });
    }
    /**
     * Update the position of the current time line
     */
    updateCurrentTime() {
        let lineUpdate = this.svg.selectAll('.currentTimeLine').datum([[this.currentTime, this.controlDomain()[0]], [this.currentTime, this.svgHeight]]);
        let x = 0;
        lineUpdate.enter()
            .append("path")
            .attr('class', 'currentTimeLine')
            .merge(lineUpdate)
            .attr('d', d3.line()
            .x((d) => x = this.scaleX(d[0]))
            .y((d) => this.scaleY(d[1])))
            .style('fill', 'none')
            .style('stroke', 'red')
            .style('stroke-width', '3px');
        if (this.currentTime >= this.scale(this.dataZoom, "xMin") && this.currentTime <= this.scale(this.dataZoom, "xMax")) {
            this.svg.selectAll('.currentTimeLine').attr('display', 'block');
            this.svg.selectAll('.currentTimeSelector').attr('display', 'block');
        }
        else {
            this.svg.selectAll('.currentTimeLine').attr('display', 'none');
            this.svg.selectAll('.currentTimeSelector').attr('display', 'none');
        }
        this.svg.selectAll('.currentTimeSelector').attr('cx', x);
    }
    /**
     * Update the position of the scrollbar
     * @param {number} min of the new range
     * @param {number} max of the new range
     */
    updateScrollbar(min, max) {
        this.scrollbar.nativeElement.style.marginLeft = this.svgWidth * (min - this.minTime) / (this.lengthTime) + "px";
        this.scrollbar.nativeElement.style.width = this.svgWidth * (max - min) / (this.lengthTime) + "px";
    }
    /**
     * Change the range, control it, update datas, update the linechart and then emit the new range.
     * @param {MouseEvent} event
     */
    updateRange(event) {
        if (this.scrollbarSelected) {
            event.preventDefault();
            let lengthLocalTime = this.range[1] - this.range[0];
            let lastMinLocalTime = this.scale(this.dataZoom, "xMin");
            let pos = event.clientX - this.margin.left;
            if (this.lastPos == 0) {
                this.lastPos = pos;
            }
            let minLocalTime = (pos - this.lastPos) * this.lengthTime / this.svgWidth + lastMinLocalTime;
            this.range = this.controlRange(minLocalTime, lengthLocalTime);
            this.updateDataZoom(this.range[0], this.range[1]);
            this.updateSvg(this.range[0], this.range[1]);
            this.rangeChange.emit(this.range);
            this.lastPos = pos;
        }
    }
    /**
     * Change this.dataZoom at range changes
     * @param {number} min of the new range
     * @param {number} max of the new range
     */
    updateDataZoom(min, max) {
        this.data.forEach((element, index) => {
            this.dataZoom[index] = {
                label: element.label,
                values: element.values.filter((element) => min <= element[0] && element[0] <= max),
                color: element.color,
                style: element.style,
                interpolation: element.interpolation
            };
        });
        let time;
        this.data.forEach((element, index) => {
            time = [];
            element.values.forEach((element => time.push(element[0])));
            let i = d3.bisectLeft(time, min) - 1;
            if (i >= 0 && i < this.data[index].values.length) {
                this.dataZoom[index].values.unshift([min, (this.data[index].values[i][1])]);
            }
            this.dataZoom[index].values.push([max, this.dataZoom[index].values[this.dataZoom[index].values.length - 1][1]]);
        });
    }
    /**
     * Remove and build a new tooltips
     */
    updateToolTips() {
        this.tooltip.remove();
        this.drawToolTips();
    }
    /**
     * Active movement of scrollbar on mousedown on it
     * @param {MouseEvent} event
     */
    activeScrollbar(event) {
        this.scrollbarSelected = true;
        this.lastPos = event.clientX - this.margin.left;
    }
    /**
     * Desactive movement of scrollbar on mouseup or mouseleave on it
     */
    desactiveScrollbar() {
        this.scrollbarSelected = false;
        this.lastPos = 0;
    }
    /**
     * Show the tooltips on the movement of the mouse
     * @param {MouseEvent} event
     */
    showInfo(event) {
        let time = [];
        if (this.dataZoom[0] != undefined) {
            this.dataZoom[0].values.forEach((element) => time.push(element[0]));
            this.tooltip.style("display", "block");
            this.tooltip.style("opacity", 100);
            let x0 = this.scaleX.invert(event.clientX - this.margin.left).getTime();
            let x = d3.bisectRight(time, x0);
            if (x > this.dataZoom[0].values.length - 1)
                x = this.dataZoom[0].values.length - 1;
            else if (x < 0)
                x = 0;
            let d = this.dataZoom[0].values[x][1];
            let t = this.dataZoom[0].values[x][0];
            if (this.scaleY(d) <= 40 * this.dataZoom.length) {
                if (this.modeToolTips != "inverse") {
                    this.modeToolTips = "inverse";
                    this.updateToolTips();
                }
            }
            else {
                if (this.modeToolTips != "normal") {
                    this.modeToolTips = "normal";
                    this.updateToolTips();
                }
            }
            this.dataZoom.forEach((element, index) => {
                let i = x;
                if (i > element.values.length - 1)
                    i = this.dataZoom[index].values.length - 1;
                else if (i < 0)
                    i = 0;
                let d = element.values[i][1];
                let t = element.values[i][0];
                let date = new Date(t).toLocaleDateString("fr", { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
                d3.selectAll('#tooltip-date1' + index)
                    .text(date);
                d3.selectAll('#tooltip-date2' + index)
                    .text(this.roundDecimal(d, 2));
            });
            this.tooltip.attr("transform", "translate(" + this.scaleX(t) + "," + this.scaleY(d) + ")");
        }
    }
    /**
     * Hide the tooltips when the mouse leave the svg
     */
    hideInfo() {
        this.tooltip.style("display", "none");
    }
    /**
     * Update the range (reduce or increase) of the linechart on scroll
     * @param {WheelEvent} event
     */
    activeZoom(event) {
        event.preventDefault();
        let lastLengthLocalTime = this.lengthTime / Math.pow(1.5, this.idZoom);
        let lastMinLocalTime = this.scale(this.dataZoom, "xMin");
        if ((event.deltaY > 0 && this.idZoom > 0) || event.deltaY < 0) {
            if (event.deltaY > 0 && this.idZoom > 0) {
                this.idZoom--;
            }
            else if (event.deltaY < 0) {
                this.idZoom++;
            }
            let pos = this.scaleX.invert(event.clientX - this.margin.left).getTime();
            let lengthLocalTime = this.lengthTime / Math.pow(1.5, this.idZoom);
            let minLocalTime = (lastMinLocalTime - pos) * (lengthLocalTime / lastLengthLocalTime) + pos;
            this.range = this.controlRange(minLocalTime, lengthLocalTime);
            if (lengthLocalTime > 10000) {
                this.updateDataZoom(this.range[0], this.range[1]);
                this.updateSvg(this.range[0], this.range[1]);
                this.rangeChange.emit(this.range);
            }
            else {
                this.idZoom--;
            }
        }
    }
    /**
     * Update the value of current time on the movement of the mouse
     * @param {MouseEvent} event
     */
    moveCurrentTime(event) {
        event.preventDefault();
        let pos = this.scaleX.invert(event.clientX - this.margin.left).getTime();
        if (pos < this.scale(this.dataZoom, "xMin")) {
            this.currentTime = this.scale(this.dataZoom, "xMin");
        }
        else if (pos > this.scale(this.dataZoom, "xMax")) {
            this.currentTime = this.scale(this.dataZoom, "xMax");
        }
        else {
            this.currentTime = pos;
        }
        this.updateCurrentTime();
        this.currentTimeChange.emit(this.currentTime);
    }
    /**
     * Control the range based on data's timestamp and the new range
     * @param {number} min of the new range
     * @param {number} length of the new range
     * @returns a adjusted range based on data's timestamp
     */
    controlRange(min, length) {
        if (this.minTime > min)
            min = this.minTime;
        let max = min + length;
        if (this.maxTime < max) {
            max = this.maxTime;
            min = max - length;
        }
        if (this.minTime > min)
            min = this.minTime;
        return [min, max];
    }
    /**
     * Control the domain based on data's value type and the input domain
     * @returns a new domain auto-scaled if the input domain is equal to [0,0] or the data's value are positive integers, else return the input domain
     */
    controlDomain() {
        if ((this.domain[0] == 0 && this.domain[1] == 0) || this.discreteValue(this.data)) {
            return [this.scale(this.data, "yMin"), this.scale(this.data, "yMax")];
        }
        else {
            return this.domain;
        }
    }
    controlColor(color) {
        let s = new Option().style;
        s.color = color;
        return s.color != "";
    }
    /**
     * Determine the minimum or maximum of the horizontal or vertical axis in data
     * @param {Data[]} data Array of Data
     * @param {"xMin" | "xMax" | "yMin" | "yMax"} s precise wihch scale we want
     * @returns the value that matches with the parameter s in data
     */
    scale(data, s) {
        let res = 0;
        data.forEach((elements, index) => elements.values.forEach((element, i) => {
            if ((s == "yMin" && ((i == 0 && index == 0) || element[1] < res)) || (s == "yMax" && ((i == 0 && index == 0) || element[1] > res)))
                res = element[1];
            else if ((s == "xMin" && ((i == 0 && index == 0) || element[0] < res)) || (s == "xMax" && ((i == 0 && index == 0) || element[0] > res)))
                res = element[0];
        }));
        return res;
    }
    /**
    *Check type of data (positive integer or float)
    *@param {Data[]} data Array of Data
    *@returns false if there is at least one value in data that's not a positive integer
    */
    discreteValue(data) {
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].values.length; j++) {
                if (data[i].values[j][1] != Math.round(data[i].values[j][1]))
                    return false;
            }
        }
        return true;
    }
    /**
     * Round a number with a precision
     * @param {number} num
     * @param {number} precision
     * @returns a num with a number of decimal (precision)
     */
    roundDecimal(num, precision) {
        let tmp = Math.pow(10, precision);
        return Math.round(num * tmp) / tmp;
    }
}
MyLibComponent.ɵfac = function MyLibComponent_Factory(t) { return new (t || MyLibComponent)(i0.ɵɵdirectiveInject(i0.Renderer2)); };
MyLibComponent.ɵcmp = i0.ɵɵdefineComponent({ type: MyLibComponent, selectors: [["lib-my-lib"]], viewQuery: function MyLibComponent_Query(rf, ctx) { if (rf & 1) {
        i0.ɵɵviewQuery(_c0, 1);
        i0.ɵɵviewQuery(_c1, 1);
        i0.ɵɵviewQuery(_c2, 1);
    } if (rf & 2) {
        let _t;
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.timeline = _t.first);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.scrollbar = _t.first);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.zoneScrollbar = _t.first);
    } }, inputs: { width: "width", height: "height", data: "data", domain: "domain", range: "range", currentTime: "currentTime" }, outputs: { rangeChange: "rangeChange", currentTimeChange: "currentTimeChange" }, features: [i0.ɵɵNgOnChangesFeature], decls: 8, vars: 3, consts: [["root", ""], ["zone", ""], ["scroll", ""]], template: function MyLibComponent_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelementStart(0, "h2");
        i0.ɵɵtext(1);
        i0.ɵɵelementEnd();
        i0.ɵɵnamespaceSVG();
        i0.ɵɵelement(2, "svg", null, 0);
        i0.ɵɵnamespaceHTML();
        i0.ɵɵelementStart(4, "div", null, 1);
        i0.ɵɵelement(6, "div", null, 2);
        i0.ɵɵelementEnd();
    } if (rf & 2) {
        i0.ɵɵadvance(1);
        i0.ɵɵtextInterpolate(ctx.title);
        i0.ɵɵadvance(1);
        i0.ɵɵattribute("width", ctx.width)("height", ctx.height);
    } }, encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MyLibComponent, [{
        type: Component,
        args: [{
                selector: 'lib-my-lib',
                template: `
  <h2>{{ title }}</h2>
  <svg #root [attr.width]="width" [attr.height]="height"></svg>
  <div #zone><div #scroll></div></div>
  `,
                styles: []
            }]
    }], function () { return [{ type: i0.Renderer2 }]; }, { width: [{
            type: Input
        }], height: [{
            type: Input
        }], data: [{
            type: Input
        }], domain: [{
            type: Input
        }], timeline: [{
            type: ViewChild,
            args: ['root']
        }], scrollbar: [{
            type: ViewChild,
            args: ['scroll']
        }], zoneScrollbar: [{
            type: ViewChild,
            args: ['zone']
        }], range: [{
            type: Input
        }], rangeChange: [{
            type: Output
        }], currentTime: [{
            type: Input
        }], currentTimeChange: [{
            type: Output
        }] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXktbGliLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL215LWxpYi9zcmMvbGliL215LWxpYi5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBYyxZQUFZLEVBQUUsS0FBSyxFQUFVLE1BQU0sRUFBNEIsU0FBUyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBR2hJLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFDOzs7OztBQWlCekIsTUFBTSxVQUFVLFNBQVMsQ0FBQyxDQUFTO0lBQ2pDLElBQUcsQ0FBQyxJQUFFLElBQUk7UUFBRSxPQUFPLENBQUMsQ0FBQztTQUNoQixJQUFJLENBQUMsSUFBRSxLQUFLO1FBQUUsT0FBTyxDQUFDLENBQUM7O1FBQ3ZCLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDakIsQ0FBQztBQWFELE1BQU0sT0FBTyxjQUFjO0lBbUN6QixZQUFvQixRQUFtQjtRQUFuQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBbEM5QixVQUFLLEdBQVcsR0FBRyxDQUFDO1FBQ3BCLFdBQU0sR0FBVyxHQUFHLENBQUM7UUFDckIsU0FBSSxHQUFXLEVBQUUsQ0FBQztRQUNsQixXQUFNLEdBQXFCLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO1FBSWpDLFVBQUssR0FBb0IsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsZ0JBQVcsR0FBRyxJQUFJLFlBQVksRUFBbUIsQ0FBQztRQUNuRCxnQkFBVyxHQUFXLENBQUMsQ0FBQztRQUN2QixzQkFBaUIsR0FBRyxJQUFJLFlBQVksRUFBVSxDQUFDO1FBRWxELFVBQUssR0FBVSxhQUFhLENBQUM7UUFDNUIsV0FBTSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFB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bnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBFdmVudEVtaXR0ZXIsIElucHV0LCBPbkluaXQsIE91dHB1dCwgUmVuZGVyZXIyLCBTaW1wbGVDaGFuZ2VzLCBWaWV3Q2hpbGQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U2NhbGVUaW1lLCBTY2FsZUxpbmVhcn0gZnJvbSAnZDMtc2NhbGUnO1xuaW1wb3J0IHtTZWxlY3Rpb259IGZyb20gJ2QzLXNlbGVjdGlvbic7XG5pbXBvcnQgKiBhcyBkMyBmcm9tICdkMyc7XG5cblxuZXhwb3J0IGludGVyZmFjZSBEYXRhIHtcbiAgbGFiZWw6IHN0cmluZztcbiAgdmFsdWVzOiBbbnVtYmVyLG51bWJlcl1bXTtcbiAgY29sb3I6IHN0cmluZztcbiAgc3R5bGU6IFwibGluZVwiIHwgXCJhcmVhXCIgfCBcImJvdGhcIjtcbiAgaW50ZXJwb2xhdGlvbjogXCJsaW5lYXJcIiB8IFwic3RlcFwiO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERBVEE8VD57XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xuICB2YWx1ZTogVDtcbiAgc2Vuc29ySWQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQm9vbChzOiBzdHJpbmcpIHtcbiAgaWYocz09J09OJykgcmV0dXJuIDE7XG4gIGVsc2UgaWYgKHM9PSdPRkYnKSByZXR1cm4gMDtcbiAgZWxzZSByZXR1cm4gLTE7XG59XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2xpYi1teS1saWInLFxuICB0ZW1wbGF0ZTogYFxuICA8aDI+e3sgdGl0bGUgfX08L2gyPlxuICA8c3ZnICNyb290IFthdHRyLndpZHRoXT1cIndpZHRoXCIgW2F0dHIuaGVpZ2h0XT1cImhlaWdodFwiPjwvc3ZnPlxuICA8ZGl2ICN6b25lPjxkaXYgI3Njcm9sbD48L2Rpdj48L2Rpdj5cbiAgYCxcbiAgc3R5bGVzOiBbXG4gIF1cbn0pXG5cbmV4cG9ydCBjbGFzcyBNeUxpYkNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIEBJbnB1dCgpIHdpZHRoOiBudW1iZXIgPSA5MDA7XG4gIEBJbnB1dCgpIGhlaWdodDogbnVtYmVyID0gMjAwOyBcbiAgQElucHV0KCkgZGF0YTogRGF0YVtdID0gW107XG4gIEBJbnB1dCgpIGRvbWFpbjogW251bWJlciwgbnVtYmVyXSA9IFswLDBdO1xuICBAVmlld0NoaWxkKCdyb290JykgdGltZWxpbmUhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKCdzY3JvbGwnKSBzY3JvbGxiYXIhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKCd6b25lJykgem9uZVNjcm9sbGJhciE6IEVsZW1lbnRSZWY7XG4gIEBJbnB1dCgpIHJhbmdlOiBbbnVtYmVyLG51bWJlcl0gPSBbMCwwXTtcbiAgQE91dHB1dCgpIHJhbmdlQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxbbnVtYmVyLG51bWJlcl0+KCk7XG4gIEBJbnB1dCgpIGN1cnJlbnRUaW1lOiBudW1iZXIgPSAwO1xuICBAT3V0cHV0KCkgY3VycmVudFRpbWVDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4oKTtcblxuICBwdWJsaWMgdGl0bGU6c3RyaW5nID0gJ1RpbWVsaW5lIDogJztcbiAgcHJpdmF0ZSBtYXJnaW4gPSB7IHRvcDogMjAsIHJpZ2h0OiAyMCwgYm90dG9tOiAzMCwgbGVmdDogNTAgfTsgLy9tYXJnZSBpbnRlcm5lIGF1IHN2ZyBcbiAgcHJpdmF0ZSBkYXRhWm9vbTogRGF0YVtdID0gW107XG4gIHByaXZhdGUgaWRab29tOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1pblRpbWU6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbWF4VGltZTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBsZW5ndGhUaW1lOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHN2Z1dpZHRoOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHN2Z0hlaWdodDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBzY2FsZVg6IFNjYWxlVGltZTxudW1iZXIsbnVtYmVyPiA9IGQzLnNjYWxlVGltZSgpO1xuICBwcml2YXRlIHNjYWxlWTogU2NhbGVMaW5lYXI8bnVtYmVyLG51bWJlcj4gPSBkMy5zY2FsZUxpbmVhcigpO1xuICBwcml2YXRlIHN2ZzogYW55O1xuICBwcml2YXRlIGFyZWE6IGQzLkFyZWE8W251bWJlciwgbnVtYmVyXT5bXSA9IFtdO1xuICBwcml2YXRlIGxpbmU6IGQzLkxpbmU8W251bWJlciwgbnVtYmVyXT5bXSA9IFtdO1xuICBwcml2YXRlIHRvb2x0aXAhOiBTZWxlY3Rpb248U1ZHR0VsZW1lbnQsdW5rbm93bixudWxsLHVuZGVmaW5lZD47XG4gIHByaXZhdGUgbGFzdERhdGFsZW5ndGg6bnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtb2RlVG9vbFRpcHM6IFwibm9ybWFsXCIgfCBcImludmVyc2VcIiA9IFwibm9ybWFsXCI7XG4gIHByaXZhdGUgY3VycmVudFRpbWVTZWxlY3RlZDpib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgc2Nyb2xsYmFyU2VsZWN0ZWQ6Ym9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGxhc3RQb3M6IG51bWJlciA9IDA7XG4gIFxuICBcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZW5kZXJlcjogUmVuZGVyZXIyKSB7ICAgXG4gIH1cblxuICAvKipcbiAgICogQ29weSBkYXRhIGluIGRhdGFab29tLCBhbmQgYnVpbGQgdGl0bGUgXG4gICAqL1xuICBwdWJsaWMgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5kYXRhWm9vbSA9IFsuLi50aGlzLmRhdGFdO1xuICAgIHRoaXMubGFzdERhdGFsZW5ndGg9dGhpcy5kYXRhWm9vbS5sZW5ndGg7XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgIGlmKGluZGV4PT10aGlzLmRhdGEubGVuZ3RoLTEpIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlK2VsZW1lbnQubGFiZWwrJy4nO1xuICAgICAgZWxzZSB0aGlzLnRpdGxlID0gdGhpcy50aXRsZStlbGVtZW50LmxhYmVsICsgJywgJztcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgbGluZWNoYXJ0XG4gICAqL1xuICBwdWJsaWMgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRpbWVsaW5lICE9IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHcgPSB0aGlzLnRpbWVsaW5lLm5hdGl2ZUVsZW1lbnQud2lkdGguYW5pbVZhbC52YWx1ZTtcbiAgICAgIGxldCBoID0gdGhpcy50aW1lbGluZS5uYXRpdmVFbGVtZW50LmhlaWdodC5hbmltVmFsLnZhbHVlO1xuICAgICAgdGhpcy5zdmdXaWR0aCA9ICh3IC0gdGhpcy5tYXJnaW4ubGVmdCkgLSB0aGlzLm1hcmdpbi5yaWdodDtcbiAgICAgIHRoaXMuc3ZnSGVpZ2h0ID0gKGggLSB0aGlzLm1hcmdpbi50b3ApIC0gdGhpcy5tYXJnaW4uYm90dG9tO1xuICAgIH1cbiAgICB0aGlzLmRhdGEuZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4gdGhpcy5idWlsZFN0eWxlRGF0YShlbGVtZW50LGluZGV4KSk7XG4gICAgdGhpcy5idWlsZFpvb20oKTsgXG4gICAgdGhpcy5idWlsZEV2ZW50KCk7XG4gICAgdGhpcy5kcmF3VG9vbFRpcHMoKTtcbiAgICB0aGlzLmRyYXdBeGlzKCk7XG4gICAgdGhpcy5kcmF3TGluZUFuZFBhdGgoKTtcbiAgICB0aGlzLmRyYXdMaW5lQ3VycmVudFRpbWUoKTtcbiAgICB0aGlzLmRyYXdTY3JvbGxiYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgbGluZWNoYXJ0IG9uIGRhdGEsIHJhbmdlIG9yIGN1cnJlbnQgdGltZSBjaGFuZ2VzXG4gICAqIEBwYXJhbSB7U2ltcGxlQ2hhbmdlc30gY2hhbmdlcyBcbiAgICovXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXMuZGF0YSYmIWNoYW5nZXMuZGF0YS5maXJzdENoYW5nZSkgdGhpcy51cGRhdGVDaGFydCgpO1xuICAgIGlmICgoY2hhbmdlcy5kYXRhJiYhY2hhbmdlcy5kYXRhLmZpcnN0Q2hhbmdlJiZ0aGlzLnJhbmdlWzBdIT0wJiZ0aGlzLnJhbmdlWzFdIT0wKXx8KGNoYW5nZXMucmFuZ2UmJiFjaGFuZ2VzLnJhbmdlLmZpcnN0Q2hhbmdlKSkge1xuICAgICAgdGhpcy5pZFpvb209TWF0aC5yb3VuZChNYXRoLmxvZyh0aGlzLmxlbmd0aFRpbWUvKHRoaXMucmFuZ2VbMV0tdGhpcy5yYW5nZVswXSkpL01hdGgubG9nKDEuNSkpO1xuICAgICAgdGhpcy5yYW5nZT10aGlzLmNvbnRyb2xSYW5nZSh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0tdGhpcy5yYW5nZVswXSk7XG4gICAgICBpZih0aGlzLmRhdGEubGVuZ3RoIT0wKXtcbiAgICAgICAgdGhpcy51cGRhdGVEYXRhWm9vbSh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVN2Zyh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2hhbmdlcy5jdXJyZW50VGltZSYmIWNoYW5nZXMuY3VycmVudFRpbWUuZmlyc3RDaGFuZ2UmJnRoaXMuZGF0YS5sZW5ndGghPTApIHRoaXMudXBkYXRlQ3VycmVudFRpbWUoKTtcbn1cblxuICAvKipcbiAgICogQWRkIGV2ZW50IGxpc3RlbmVycyBvbiB0aGUgc3ZnXG4gICAqL1xuICBwcml2YXRlIGJ1aWxkRXZlbnQoKTogdm9pZHsgLy8gY3JlZXIgdW5lIHRpbWVsaW5lIGF2ZWMgdW5lIHNldWwgZG9ubsOpZVxuICAgIHRoaXMuc3ZnID0gZDMuc2VsZWN0KHRoaXMudGltZWxpbmUubmF0aXZlRWxlbWVudClcbiAgICAuYXBwZW5kKCdnJylcbiAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgdGhpcy5tYXJnaW4ubGVmdCArICcsJyArIHRoaXMubWFyZ2luLnRvcCArICcpJyk7XG4gICAgZDMuc2VsZWN0KHRoaXMudGltZWxpbmUubmF0aXZlRWxlbWVudCkub24oXCJtb3VzZW1vdmVcIiwgKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICBpZih0aGlzLmN1cnJlbnRUaW1lU2VsZWN0ZWQpIHRoaXMubW92ZUN1cnJlbnRUaW1lKGV2ZW50KTtcbiAgICAgIGVsc2UgdGhpcy5zaG93SW5mbyhldmVudCk7XG4gICAgfSlcbiAgICAub24oXCJtb3VzZWxlYXZlXCIsICgpID0+IHsgdGhpcy5jdXJyZW50VGltZVNlbGVjdGVkID0gZmFsc2U7IHRoaXMuaGlkZUluZm8oKSB9KVxuICAgIC5vbihcIndoZWVsXCIsIChldmVudDogV2hlZWxFdmVudCkgPT4gdGhpcy5hY3RpdmVab29tKGV2ZW50KSlcbiAgICAub24oXCJtb3VzZXVwXCIsICgpID0+IHRoaXMuY3VycmVudFRpbWVTZWxlY3RlZD1mYWxzZSlcbiAgICAub24oXCJtb3VzZW92ZXJcIiwgKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiBldmVudC5wcmV2ZW50RGVmYXVsdCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCB0aGUgc3R5bGUgKGFyZWEsIGxpbmUgb3IgYm90aCkgYW5kIHRoZSBpbnRlcnBvbGF0aW9uIChzdHBlIG9yIGxpbmVhcikgb2YgbGluZXNcbiAgICogQHBhcmFtIHtEYXRhfSBlbGVtZW50IFxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggXG4gICAqL1xuICBwcml2YXRlIGJ1aWxkU3R5bGVEYXRhKGVsZW1lbnQ6RGF0YSwgaW5kZXg6bnVtYmVyKTogdm9pZHtcbiAgICBpZihlbGVtZW50LnN0eWxlPT1cImFyZWFcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICBpZihlbGVtZW50LmludGVycG9sYXRpb249PVwic3RlcFwiKXtcbiAgICAgICAgdGhpcy5hcmVhW2luZGV4XT1kMy5hcmVhKClcbiAgICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgICAgLnkwKHRoaXMuc3ZnSGVpZ2h0KVxuICAgICAgICAueTEoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWShkWzFdKSlcbiAgICAgICAgLmN1cnZlKGQzLmN1cnZlU3RlcEFmdGVyKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmFyZWFbaW5kZXhdPWQzLmFyZWEoKVxuICAgICAgICAueCgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgICAueTAodGhpcy5zdmdIZWlnaHQpXG4gICAgICAgIC55MSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKVxuICAgICAgfVxuICAgIH1cbiAgICBpZihlbGVtZW50LnN0eWxlPT1cImxpbmVcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICBpZihlbGVtZW50LmludGVycG9sYXRpb249PVwic3RlcFwiKXtcbiAgICAgICAgdGhpcy5saW5lW2luZGV4XT1kMy5saW5lKClcbiAgICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgICAgLnkoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWShkWzFdKSlcbiAgICAgICAgLmN1cnZlKGQzLmN1cnZlU3RlcEFmdGVyKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmxpbmVbaW5kZXhdPWQzLmxpbmUoKVxuICAgICAgICAueCgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgICAueSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKVxuICAgICAgfVxuICAgIH1cbiAgICBpZighdGhpcy5jb250cm9sQ29sb3IoZWxlbWVudC5jb2xvcikpe1xuICAgICAgZWxlbWVudC5jb2xvcj1cImJsYWNrXCI7XG4gICAgfSBcbiAgfVxuXG4gIC8qKlxuICAgKiBTYXZlIGluZm9ybWF0aW9uIGZvciB6b29tLlxuICAgKi9cbiAgcHJpdmF0ZSBidWlsZFpvb20oKTogdm9pZHtcbiAgICB0aGlzLm1pblRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInhNaW5cIik7XG4gICAgdGhpcy5tYXhUaW1lID0gdGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ4TWF4XCIpO1xuICAgIHRoaXMubGVuZ3RoVGltZSA9IHRoaXMubWF4VGltZSAtIHRoaXMubWluVGltZTtcbiAgICB0aGlzLmlkWm9vbT0wO1xuICB9XG5cbiAgLyoqXG4gICAqIERyYXcgdGhlIHRvb2x0aXBzJ3Mgc3ZnXG4gICAqL1xuICBwcml2YXRlIGRyYXdUb29sVGlwcygpOiB2b2lkeyAvL2NyZWVyIGxlIHRvb2x0aXBzXG4gICAgdGhpcy50b29sdGlwID0gdGhpcy5zdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImlkXCIsIFwidG9vbHRpcFwiKVxuICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICAvLyBMZSBjZXJjbGUgZXh0w6lyaWV1ciBibGV1IGNsYWlyXG4gICAgdGhpcy50b29sdGlwLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAuYXR0cihcImZpbGxcIiwgXCIjQ0NFNUY2XCIpXG4gICAgICAgIC5hdHRyKFwiclwiLCAxMCk7XG4gICAgLy8gTGUgY2VyY2xlIGludMOpcmlldXIgYmxldSBmb25jw6lcbiAgICB0aGlzLnRvb2x0aXAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIiMzNDk4ZGJcIilcbiAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCIjZmZmXCIpXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIFwiMS41cHhcIilcbiAgICAgICAgLmF0dHIoXCJyXCIsIDQpO1xuICAgIC8vIExlIHRvb2x0aXAgZW4gbHVpLW3Dqm1lIGF2ZWMgc2EgcG9pbnRlIHZlcnMgbGUgYmFzXG4gICAgLy8gSWwgZmF1dCBsZSBkaW1lbnNpb25uZXIgZW4gZm9uY3Rpb24gZHUgY29udGVudVxuICAgIGxldCB0YWlsbGUgPSB0aGlzLmRhdGFab29tLmxlbmd0aDtcbiAgICBpZiAodGhpcy5tb2RlVG9vbFRpcHMgPT0gXCJub3JtYWxcIikge1xuICAgICAgdGhpcy50b29sdGlwLmFwcGVuZChcInBvbHlsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwicG9pbnRzXCIsIFwiMCwwIDAsXCIgKyAoNDAgKiB0YWlsbGUpK1wiLCA3NSxcIiArICg0MCAqIHRhaWxsZSkrXCIsIDgwLFwiICsgKDQ1ICogdGFpbGxlKStcIiA4NSxcIiArICg0MCAqIHRhaWxsZSkrXCIgMTYwLFwiICsgKDQwICogdGFpbGxlKStcIiAxNjAsMCAwLDBcIilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcIiNmYWZhZmFcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsXCIjMzQ5OGRiXCIpXG4gICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIixcIjAuOVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIixcIjFcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTgwLCBcIiArICgtNTAgKiB0YWlsbGUpICsgXCIpXCIpO1xuICAgICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICAgIC8vIENldCDDqWzDqW1lbnQgY29udGllbmRyYSB0b3V0IG5vdHJlIHRleHRlXG4gICAgICAgIGxldCB0ZXh0ID0gdGhpcy50b29sdGlwLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LXNpemVcIiwgXCIxM3B4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiZm9udC1mYW1pbHlcIiwgXCJTZWdvZSBVSVwiKVxuICAgICAgICAgIC5zdHlsZShcImNvbG9yXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCxcIisoLTQyKihpbmRleCsxKSkrXCIpXCIpO1xuICAgICAgICAvLyBFbGVtZW50IHBvdXIgbGEgZGF0ZSBhdmVjIHBvc2l0aW9ubmVtZW50IHNww6ljaWZpcXVlXG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiN1wiKVxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCI1XCIpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTFcIiArIGluZGV4KTtcbiAgICAgICAgdGV4dC5hcHBlbmQoXCJ0c3BhblwiKVxuICAgICAgICAgIC5hdHRyKFwiZHhcIiwgXCItOTBcIilcbiAgICAgICAgICAuYXR0cihcImR5XCIsIFwiMTVcIilcbiAgICAgICAgICAuYXR0cihcImlkXCIsIFwidG9vbHRpcC1kYXRlMlwiK2luZGV4KTtcbiAgICAgIH0pO1xuICAgIH1lbHNlIHtcbiAgICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJwb2x5bGluZVwiKVxuICAgICAgICAuYXR0cihcInBvaW50c1wiLCBcIjAsXCIrKDk1KygodGFpbGxlLTEpICo0MCApKStcIiAsIDAsNTUgLCA3NSw1NSAsIDgwLDUwICwgODUsNTUgLCAxNjAsNTUgLCAxNjAsXCIrKDk1KygodGFpbGxlLTEpICo0MCApKStcIiAwLFwiKyg5NSsoKHRhaWxsZS0xKSAqNDAgKSkrXCJcIilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcIiNmYWZhZmFcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsXCIjMzQ5OGRiXCIpXG4gICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIixcIjAuOVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIixcIjFcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTgwLCBcIiArICgtNTAgKiAxKSArIFwiKVwiKTtcbiAgICAgIHRoaXMuZGF0YVpvb20uZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgICAvLyBDZXQgw6lsw6ltZW50IGNvbnRpZW5kcmEgdG91dCBub3RyZSB0ZXh0ZVxuICAgICAgICBsZXQgdGV4dCA9IHRoaXMudG9vbHRpcC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgLnN0eWxlKFwiZm9udC1zaXplXCIsIFwiMTNweFwiKVxuICAgICAgICAgIC5zdHlsZShcImZvbnQtZmFtaWx5XCIsIFwiU2Vnb2UgVUlcIilcbiAgICAgICAgICAuc3R5bGUoXCJjb2xvclwiLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5zdHlsZShcImZpbGxcIiwgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtODAsXCIrKC0zMCooaW5kZXgrMSkpK1wiKVwiKTtcbiAgICAgICAgLy8gRWxlbWVudCBwb3VyIGxhIGRhdGUgYXZlYyBwb3NpdGlvbm5lbWVudCBzcMOpY2lmaXF1ZVxuICAgICAgICB0ZXh0LmFwcGVuZChcInRzcGFuXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeFwiLCBcIjdcIilcbiAgICAgICAgICAuYXR0cihcImR5XCIsIDUwICsgNzAqaW5kZXgpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTFcIiArIGluZGV4KTtcbiAgICAgICAgdGV4dC5hcHBlbmQoXCJ0c3BhblwiKVxuICAgICAgICAgIC5hdHRyKFwiZHhcIiwgXCItODBcIilcbiAgICAgICAgICAuYXR0cihcImR5XCIsIFwiMjBcIilcbiAgICAgICAgICAuYXR0cihcImlkXCIsIFwidG9vbHRpcC1kYXRlMlwiK2luZGV4KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3IGhvcml6b250YWwgYW5kIHZlcnRpY2FsIGF4aXMgYW5kIHNjYWxlXG4gICAqL1xuICBwcml2YXRlIGRyYXdBeGlzKCk6IHZvaWR7XG4gICAgdGhpcy5zY2FsZVgucmFuZ2UoWzAsIHRoaXMuc3ZnV2lkdGhdKTtcbiAgICB0aGlzLnNjYWxlWC5kb21haW4oW3RoaXMubWluVGltZSx0aGlzLm1heFRpbWVdKTtcbiAgICB0aGlzLnNjYWxlWSA9IGQzLnNjYWxlTGluZWFyKCk7XG4gICAgdGhpcy5zY2FsZVkucmFuZ2UoW3RoaXMuc3ZnSGVpZ2h0LCAwXSk7XG4gICAgdGhpcy5zY2FsZVkuZG9tYWluKHRoaXMuY29udHJvbERvbWFpbigpKTtcbiAgICAvLyBDb25maWd1cmUgdGhlIFggQXhpc1xuICAgIHRoaXMuc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCcgKyB0aGlzLnN2Z0hlaWdodCArICcpJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd4QXhpcycpXG4gICAgICAuY2FsbChkMy5heGlzQm90dG9tKHRoaXMuc2NhbGVYKSk7XG4gICAgLy8gQ29uZmlndXJlIHRoZSBZIEF4aXNcbiAgICBpZih0aGlzLmRpc2NyZXRlVmFsdWUodGhpcy5kYXRhKSl7XG4gICAgICB0aGlzLnN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3lBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHRoaXMuc2NhbGVZKS50aWNrcyh0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInlNYXhcIikpKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAneUF4aXMnKVxuICAgICAgLmNhbGwoZDMuYXhpc0xlZnQodGhpcy5zY2FsZVkpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHJhdyBsaW5lcyBvbiB0aGUgbGluZSBjaGFydFxuICAgKi9cbiAgcHJpdmF0ZSBkcmF3TGluZUFuZFBhdGgoKTogdm9pZHtcbiAgICB0aGlzLmRhdGFab29tLmZvckVhY2goXG4gICAgICAoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgICBpZihlbGVtZW50LnN0eWxlPT1cImFyZWFcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICAgICAgdGhpcy5zdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgICAuZGF0dW0odGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdhcmVhJytpbmRleClcbiAgICAgICAgICAuYXR0cignZCcsIHRoaXMuYXJlYVtpbmRleF0pXG4gICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMC4xKVxuICAgICAgICAgIC5hdHRyKCdvcGFjaXR5JywgMC4zKVxuICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzJweCcpXG4gICAgICAgIH1cbiAgICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJsaW5lXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgICAgIHRoaXMuc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgLmRhdHVtKGVsZW1lbnQudmFsdWVzKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdsaW5lJytpbmRleClcbiAgICAgICAgICAuYXR0cignZCcsIHRoaXMubGluZVtpbmRleF0pXG4gICAgICAgICAgLnN0eWxlKCdmaWxsJywgJ25vbmUnKVxuICAgICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICcycHgnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9XG5cbiAgLyoqXG4gICAqIERyYXcgdGhlIHZlcnRpY2FsIGxpbmUgd2hpY2ggcmVwcmVzZW50cyB0aGUgY3VycmVudCB0aW1lXG4gICAqL1xuICBwcml2YXRlIGRyYXdMaW5lQ3VycmVudFRpbWUoKTogdm9pZHtcbiAgICBpZih0aGlzLmRhdGEubGVuZ3RoIT0wKXtcbiAgICAgIGlmKHRoaXMuY3VycmVudFRpbWU9PTApe1xuICAgICAgICB0aGlzLmN1cnJlbnRUaW1lID0gdGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ4TWluXCIpO1xuICAgICAgfVxuICAgICAgbGV0IHg6bnVtYmVyPTA7XG4gICAgICB0aGlzLnN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuZGF0dW0oW1t0aGlzLmN1cnJlbnRUaW1lLHRoaXMuY29udHJvbERvbWFpbigpWzBdXSxbdGhpcy5jdXJyZW50VGltZSx0aGlzLnN2Z0hlaWdodF1dKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY3VycmVudFRpbWVMaW5lJylcbiAgICAgICAgLmF0dHIoJ2QnLCBkMy5saW5lKClcbiAgICAgICAgICAueCgoZDogbnVtYmVyW10pID0+IHg9dGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgICAgLnkoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWShkWzFdKSkpXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsICdub25lJylcbiAgICAgICAgLnN0eWxlKCdzdHJva2UnLCAncmVkJylcbiAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnM3B4Jyk7XG4gICAgICB0aGlzLnN2Zy5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjdXJyZW50VGltZVNlbGVjdG9yJylcbiAgICAgICAgLmF0dHIoJ2N4JywgeClcbiAgICAgICAgLmF0dHIoJ2N5JywgLTEzKVxuICAgICAgICAuYXR0cigncicsIDcpXG4gICAgICAgIC5hdHRyKCdmaWxsJywgJ3JlZCcpXG4gICAgICAgIC5vbihcIm1vdXNlZG93blwiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50VGltZVNlbGVjdGVkPXRydWU7XG4gICAgICAgICAgdGhpcy5oaWRlSW5mbygpO1xuICAgICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3IHRoZSBzY3JvbGxiYXIgYW5kIGV2ZW50IGxpc3RlbmVyIG9uIGl0ICBcbiAgICovXG4gIHByaXZhdGUgZHJhd1Njcm9sbGJhcigpOiB2b2lke1xuICAgIHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLndpZHRoID0gdGhpcy5zdmdXaWR0aCtcInB4XCI7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUubWFyZ2luTGVmdCA9IHRoaXMubWFyZ2luLmxlZnQrIFwicHhcIjtcbiAgICB0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5oZWlnaHQgPSBcIjIwcHhcIjtcbiAgICB0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcImxpZ2h0Z3JleVwiO1xuICAgIHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiMTBweFwiO1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUud2lkdGggPSB0aGlzLnN2Z1dpZHRoK1wicHhcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmhlaWdodCA9IFwiMjBweFwiO1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJncmV5XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5ib3JkZXJSYWRpdXMgPSBcIjEwcHhcIjtcbiAgICB0aGlzLnJlbmRlcmVyLmxpc3Rlbih0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LCAnbW91c2Vkb3duJywgKGV2ZW50Ok1vdXNlRXZlbnQpID0+IHRoaXMuYWN0aXZlU2Nyb2xsYmFyKGV2ZW50KSk7XG4gICAgdGhpcy5yZW5kZXJlci5saXN0ZW4odGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQsICdtb3VzZWxlYXZlJywgKCkgPT4gdGhpcy5kZXNhY3RpdmVTY3JvbGxiYXIoKSk7XG4gICAgdGhpcy5yZW5kZXJlci5saXN0ZW4odGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQsICdtb3VzZXVwJywgKCkgPT4gdGhpcy5kZXNhY3RpdmVTY3JvbGxiYXIoKSk7XG4gICAgdGhpcy5yZW5kZXJlci5saXN0ZW4odGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQsJ21vdXNlbW92ZScsIChldmVudDpNb3VzZUV2ZW50KSA9PiB0aGlzLnVwZGF0ZVJhbmdlKGV2ZW50KSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGFsbCB0aGUgbGluZSBjaGFydCAoaG9yaXpvbnRhbCBhbmQgdmVydGljYWwgYXhpcyBhbmQgc2NhbGUsIGRhdGEsIGxpbmVzIGFuZCByYW5nZSkgb24gZGF0YSBjaGFuZ2VzLiBcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlQ2hhcnQoKTogdm9pZHtcbiAgICB0aGlzLmRhdGFab29tID0gWy4uLnRoaXMuZGF0YV07XG4gICAgdGhpcy5kYXRhLmZvckVhY2goXG4gICAgICAoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgICB0aGlzLmJ1aWxkU3R5bGVEYXRhKGVsZW1lbnQsaW5kZXgpO1xuICAgICAgICBpZihlbGVtZW50LnN0eWxlPT1cImFyZWFcIikgdGhpcy5zdmcuc2VsZWN0QWxsKCcubGluZScraW5kZXgpLnJlbW92ZSgpO1xuICAgICAgICBpZihlbGVtZW50LnN0eWxlPT1cImxpbmVcIikgdGhpcy5zdmcuc2VsZWN0QWxsKCcuYXJlYScraW5kZXgpLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLnRpdGxlID0gJ1RpbWVsaW5lIDogJztcbiAgICAgICAgaWYoaW5kZXg9PXRoaXMuZGF0YS5sZW5ndGgtMSkgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUrZWxlbWVudC5sYWJlbCsnLic7XG4gICAgICAgIGVsc2UgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUrZWxlbWVudC5sYWJlbCArICcsICc7XG4gICAgfSlcbiAgICB0aGlzLmJ1aWxkWm9vbSgpO1xuICAgIHRoaXMuc2NhbGVYLmRvbWFpbihbdGhpcy5taW5UaW1lLHRoaXMubWF4VGltZV0pO1xuICAgIHRoaXMuc2NhbGVZLnJhbmdlKFt0aGlzLnN2Z0hlaWdodCwgMF0pO1xuICAgIHRoaXMuY29udHJvbERvbWFpbigpO1xuICAgIHRoaXMuc2NhbGVZLmRvbWFpbih0aGlzLmNvbnRyb2xEb21haW4oKSk7XG4gICAgaWYodGhpcy5kaXNjcmV0ZVZhbHVlKHRoaXMuZGF0YSkpe1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcueUF4aXMnKVxuICAgICAgLmNhbGwoZDMuYXhpc0xlZnQodGhpcy5zY2FsZVkpLnRpY2tzKHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieU1heFwiKSkpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcueUF4aXMnKVxuICAgICAgLmNhbGwoZDMuYXhpc0xlZnQodGhpcy5zY2FsZVkpKTtcbiAgICB9XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcueEF4aXMnKS5jYWxsKGQzLmF4aXNCb3R0b20odGhpcy5zY2FsZVgpKTtcbiAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZUxpbmUnKS5yZW1vdmUoKTtcbiAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZVNlbGVjdG9yJykucmVtb3ZlKCk7XG4gICAgdGhpcy51cGRhdGVMaW5lKCk7XG4gICAgdGhpcy5kcmF3TGluZUN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy51cGRhdGVTY3JvbGxiYXIodGhpcy5taW5UaW1lLHRoaXMubWF4VGltZSk7XG4gICAgdGhpcy51cGRhdGVUb29sVGlwcygpO1xuICAgIGZvcihsZXQgaW5kZXg9dGhpcy5kYXRhWm9vbS5sZW5ndGg7IGluZGV4PHRoaXMubGFzdERhdGFsZW5ndGg7IGluZGV4Kyspe1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcubGluZScraW5kZXgpLnJlbW92ZSgpO1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuYXJlYScraW5kZXgpLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLmxhc3REYXRhbGVuZ3RoPXRoaXMuZGF0YVpvb20ubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBob3Jpem9udGFsIGF4aXMsIGN1cnJlbnQgdGltZSBsaW5lLCBsaW5lcyBhbmQgc2Nyb2xsYmFyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtaW4gb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4IG9mIHRoZSBuZXcgcmFuZ2VcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlU3ZnKG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gICAgdGhpcy5zY2FsZVguZG9tYWluKFttaW4sbWF4XSk7XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcueEF4aXMnKS5jYWxsKGQzLmF4aXNCb3R0b20odGhpcy5zY2FsZVgpKTtcbiAgICB0aGlzLnVwZGF0ZUxpbmUoKTtcbiAgICB0aGlzLnVwZGF0ZUN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy51cGRhdGVTY3JvbGxiYXIobWluLG1heCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBkaXNwbGF5IG9mIGxpbmVzXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZUxpbmUoKTogdm9pZHtcbiAgICBsZXQgbGluZVVwZGF0ZTtcbiAgICBsZXQgYXJlYVVwZGF0ZTtcbiAgICB0aGlzLmRhdGFab29tLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwiYXJlYVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgICAgYXJlYVVwZGF0ZT0gdGhpcy5zdmcuc2VsZWN0QWxsKCcuYXJlYScraW5kZXgpLmRhdGEoW3RoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlc10pO1xuICAgICAgICBhcmVhVXBkYXRlXG4gICAgICAgIC5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdhcmVhJytpbmRleClcbiAgICAgICAgLm1lcmdlKGFyZWFVcGRhdGUpXG4gICAgICAgIC5hdHRyKCdkJywgdGhpcy5hcmVhW2luZGV4XSlcbiAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMC4xKVxuICAgICAgICAuYXR0cignb3BhY2l0eScsIDAuMylcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICcycHgnKTtcbiAgICAgIH1cbiAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwibGluZVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgICAgbGluZVVwZGF0ZT0gdGhpcy5zdmcuc2VsZWN0QWxsKCcubGluZScraW5kZXgpLmRhdGEoW3RoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlc10pO1xuICAgICAgICBsaW5lVXBkYXRlXG4gICAgICAgIC5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsaW5lJytpbmRleClcbiAgICAgICAgLm1lcmdlKGxpbmVVcGRhdGUpXG4gICAgICAgIC5hdHRyKCdkJywgdGhpcy5saW5lW2luZGV4XSlcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgJ25vbmUnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzJweCcpXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgY3VycmVudCB0aW1lIGxpbmVcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlQ3VycmVudFRpbWUoKTogdm9pZHtcbiAgICBsZXQgbGluZVVwZGF0ZSA9IHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lTGluZScpLmRhdHVtKFtbdGhpcy5jdXJyZW50VGltZSx0aGlzLmNvbnRyb2xEb21haW4oKVswXV0sW3RoaXMuY3VycmVudFRpbWUsdGhpcy5zdmdIZWlnaHRdXSk7XG4gICAgbGV0IHg6bnVtYmVyPTA7XG4gICAgbGluZVVwZGF0ZS5lbnRlcigpXG4gICAgLmFwcGVuZChcInBhdGhcIilcbiAgICAuYXR0cignY2xhc3MnLCAnY3VycmVudFRpbWVMaW5lJylcbiAgICAubWVyZ2UobGluZVVwZGF0ZSlcbiAgICAuYXR0cignZCcsIGQzLmxpbmUoKVxuICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB4PXRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgLnkoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWShkWzFdKSkpXG4gICAgLnN0eWxlKCdmaWxsJywgJ25vbmUnKVxuICAgIC5zdHlsZSgnc3Ryb2tlJywgJ3JlZCcpXG4gICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnM3B4Jyk7XG4gICAgaWYodGhpcy5jdXJyZW50VGltZT49dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1pblwiKSYmdGhpcy5jdXJyZW50VGltZTw9dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1heFwiKSl7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZUxpbmUnKS5hdHRyKCdkaXNwbGF5JywnYmxvY2snKTtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lU2VsZWN0b3InKS5hdHRyKCdkaXNwbGF5JywnYmxvY2snKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lTGluZScpLmF0dHIoJ2Rpc3BsYXknLCdub25lJyk7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZVNlbGVjdG9yJykuYXR0cignZGlzcGxheScsJ25vbmUnKTtcbiAgICB9XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVTZWxlY3RvcicpLmF0dHIoJ2N4Jyx4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBzY3JvbGxiYXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiBvZiB0aGUgbmV3IHJhbmdlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXggb2YgdGhlIG5ldyByYW5nZVxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVTY3JvbGxiYXIobWluOm51bWJlciwgbWF4Om51bWJlcik6IHZvaWR7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5tYXJnaW5MZWZ0PSB0aGlzLnN2Z1dpZHRoKihtaW4tdGhpcy5taW5UaW1lKS8odGhpcy5sZW5ndGhUaW1lKSArIFwicHhcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLndpZHRoPSB0aGlzLnN2Z1dpZHRoKihtYXgtbWluKS8odGhpcy5sZW5ndGhUaW1lKSArIFwicHhcIjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2UgdGhlIHJhbmdlLCBjb250cm9sIGl0LCB1cGRhdGUgZGF0YXMsIHVwZGF0ZSB0aGUgbGluZWNoYXJ0IGFuZCB0aGVuIGVtaXQgdGhlIG5ldyByYW5nZS5cbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlUmFuZ2UoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lke1xuICAgIGlmKHRoaXMuc2Nyb2xsYmFyU2VsZWN0ZWQpe1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGxldCBsZW5ndGhMb2NhbFRpbWUgPSB0aGlzLnJhbmdlWzFdLXRoaXMucmFuZ2VbMF07XG4gICAgICBsZXQgbGFzdE1pbkxvY2FsVGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNaW5cIik7XG4gICAgICBsZXQgcG9zID0gZXZlbnQuY2xpZW50WC10aGlzLm1hcmdpbi5sZWZ0O1xuICAgICAgaWYodGhpcy5sYXN0UG9zPT0wKXtcbiAgICAgICAgdGhpcy5sYXN0UG9zPSBwb3M7XG4gICAgICB9XG4gICAgICBsZXQgbWluTG9jYWxUaW1lID0gKHBvcy10aGlzLmxhc3RQb3MpKnRoaXMubGVuZ3RoVGltZS90aGlzLnN2Z1dpZHRoICsgbGFzdE1pbkxvY2FsVGltZTtcbiAgICAgIHRoaXMucmFuZ2UgPSB0aGlzLmNvbnRyb2xSYW5nZShtaW5Mb2NhbFRpbWUsbGVuZ3RoTG9jYWxUaW1lKTtcbiAgICAgIHRoaXMudXBkYXRlRGF0YVpvb20odGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgIHRoaXMudXBkYXRlU3ZnKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICB0aGlzLnJhbmdlQ2hhbmdlLmVtaXQodGhpcy5yYW5nZSk7XG4gICAgICB0aGlzLmxhc3RQb3M9cG9zO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2UgdGhpcy5kYXRhWm9vbSBhdCByYW5nZSBjaGFuZ2VzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtaW4gb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4IG9mIHRoZSBuZXcgcmFuZ2UgXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZURhdGFab29tKG1pbjpudW1iZXIsbWF4Om51bWJlcik6IHZvaWR7XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgIHRoaXMuZGF0YVpvb21baW5kZXhdPXtcbiAgICAgICAgbGFiZWw6IGVsZW1lbnQubGFiZWwsXG4gICAgICAgIHZhbHVlczogZWxlbWVudC52YWx1ZXMuZmlsdGVyKChlbGVtZW50OiBudW1iZXJbXSkgPT4gbWluIDw9IGVsZW1lbnRbMF0gJiYgZWxlbWVudFswXSA8PSAgbWF4KSxcbiAgICAgICAgY29sb3I6IGVsZW1lbnQuY29sb3IsXG4gICAgICAgIHN0eWxlOiBlbGVtZW50LnN0eWxlLFxuICAgICAgICBpbnRlcnBvbGF0aW9uOiBlbGVtZW50LmludGVycG9sYXRpb25cbiAgICB9fSkgXG4gICAgbGV0IHRpbWU6IG51bWJlcltdO1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICB0aW1lPVtdO1xuICAgICAgZWxlbWVudC52YWx1ZXMuZm9yRWFjaCgoZWxlbWVudCA9PiB0aW1lLnB1c2goZWxlbWVudFswXSkpKTtcbiAgICAgIGxldCBpID0gZDMuYmlzZWN0TGVmdCh0aW1lLCBtaW4pLTE7XG4gICAgICBpZihpPj0wJiZpPHRoaXMuZGF0YVtpbmRleF0udmFsdWVzLmxlbmd0aCl7XG4gICAgICAgIHRoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcy51bnNoaWZ0KFttaW4sKHRoaXMuZGF0YVtpbmRleF0udmFsdWVzW2ldWzFdKV0pO1xuICAgICAgfVxuICAgICAgdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzLnB1c2goW21heCx0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXNbdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzLmxlbmd0aC0xXVsxXV0pO1xuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuZCBidWlsZCBhIG5ldyB0b29sdGlwc1xuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVUb29sVGlwcygpOiB2b2lke1xuICAgIHRoaXMudG9vbHRpcC5yZW1vdmUoKTtcbiAgICB0aGlzLmRyYXdUb29sVGlwcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFjdGl2ZSBtb3ZlbWVudCBvZiBzY3JvbGxiYXIgb24gbW91c2Vkb3duIG9uIGl0XG4gICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgXG4gICAqLyBcbiAgcHJpdmF0ZSBhY3RpdmVTY3JvbGxiYXIoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lke1xuICAgIHRoaXMuc2Nyb2xsYmFyU2VsZWN0ZWQ9dHJ1ZTtcbiAgICB0aGlzLmxhc3RQb3M9ZXZlbnQuY2xpZW50WC10aGlzLm1hcmdpbi5sZWZ0O1xuICB9XG5cbiAgLyoqXG4gICAqIERlc2FjdGl2ZSBtb3ZlbWVudCBvZiBzY3JvbGxiYXIgb24gbW91c2V1cCBvciBtb3VzZWxlYXZlIG9uIGl0XG4gICAqL1xuICBwcml2YXRlIGRlc2FjdGl2ZVNjcm9sbGJhcigpOiB2b2lke1xuICAgIHRoaXMuc2Nyb2xsYmFyU2VsZWN0ZWQ9ZmFsc2U7XG4gICAgdGhpcy5sYXN0UG9zPTA7XG4gIH1cblxuICAvKipcbiAgICogU2hvdyB0aGUgdG9vbHRpcHMgb24gdGhlIG1vdmVtZW50IG9mIHRoZSBtb3VzZVxuICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFxuICAgKi9cbiAgcHJpdmF0ZSBzaG93SW5mbyhldmVudDogTW91c2VFdmVudCk6IHZvaWR7XG4gICAgbGV0IHRpbWU6IG51bWJlcltdID0gW107XG4gICAgaWYgKHRoaXMuZGF0YVpvb21bMF0gIT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmRhdGFab29tWzBdLnZhbHVlcy5mb3JFYWNoKChlbGVtZW50KSA9PiB0aW1lLnB1c2goZWxlbWVudFswXSkpO1xuICAgICAgdGhpcy50b29sdGlwLnN0eWxlKFwiZGlzcGxheVwiLFwiYmxvY2tcIik7XG4gICAgICB0aGlzLnRvb2x0aXAuc3R5bGUoXCJvcGFjaXR5XCIsIDEwMCk7XG4gICAgICBsZXQgeDAgPSB0aGlzLnNjYWxlWC5pbnZlcnQoZXZlbnQuY2xpZW50WCAtIHRoaXMubWFyZ2luLmxlZnQpLmdldFRpbWUoKTtcbiAgICAgIGxldCB4ID0gZDMuYmlzZWN0UmlnaHQodGltZSwgeDApO1xuICAgICAgaWYoeD50aGlzLmRhdGFab29tWzBdLnZhbHVlcy5sZW5ndGgtMSl4PXRoaXMuZGF0YVpvb21bMF0udmFsdWVzLmxlbmd0aC0xO1xuICAgICAgZWxzZSBpZiAoeCA8IDApIHggPSAwO1xuICAgICAgbGV0IGQ6IG51bWJlciA9IHRoaXMuZGF0YVpvb21bMF0udmFsdWVzW3hdWzFdO1xuICAgICAgbGV0IHQgPSB0aGlzLmRhdGFab29tWzBdLnZhbHVlc1t4XVswXTtcbiAgICAgIGlmICh0aGlzLnNjYWxlWShkKSA8PSA0MCp0aGlzLmRhdGFab29tLmxlbmd0aCkge1xuICAgICAgICBpZiAodGhpcy5tb2RlVG9vbFRpcHMgIT0gXCJpbnZlcnNlXCIpIHtcbiAgICAgICAgICB0aGlzLm1vZGVUb29sVGlwcyA9IFwiaW52ZXJzZVwiO1xuICAgICAgICAgIHRoaXMudXBkYXRlVG9vbFRpcHMoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMubW9kZVRvb2xUaXBzICE9IFwibm9ybWFsXCIpIHtcbiAgICAgICAgICB0aGlzLm1vZGVUb29sVGlwcyA9IFwibm9ybWFsXCI7XG4gICAgICAgICAgdGhpcy51cGRhdGVUb29sVGlwcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmRhdGFab29tLmZvckVhY2goKGVsZW1lbnQsIGluZGV4KSA9PiB7XG4gICAgICAgIGxldCBpID0geDtcbiAgICAgICAgaWYoaT5lbGVtZW50LnZhbHVlcy5sZW5ndGgtMSlpPXRoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcy5sZW5ndGgtMTtcbiAgICAgICAgZWxzZSBpZiAoaSA8IDApIGkgPSAwO1xuICAgICAgICBsZXQgZDogbnVtYmVyID0gZWxlbWVudC52YWx1ZXNbaV1bMV07XG4gICAgICAgIGxldCB0ID0gZWxlbWVudC52YWx1ZXNbaV1bMF07XG4gICAgICAgIGxldCBkYXRlID0gbmV3IERhdGUodCkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZnJcIiwgeyB5ZWFyOiAnbnVtZXJpYycsIG1vbnRoOiAnbG9uZycsIGRheTogJ251bWVyaWMnLCBob3VyOiAnbnVtZXJpYycsIG1pbnV0ZTogJ251bWVyaWMnLCBzZWNvbmQ6ICdudW1lcmljJyB9KTtcbiAgICAgICAgZDMuc2VsZWN0QWxsKCcjdG9vbHRpcC1kYXRlMScgKyBpbmRleClcbiAgICAgICAgICAudGV4dChkYXRlKTtcbiAgICAgICAgZDMuc2VsZWN0QWxsKCcjdG9vbHRpcC1kYXRlMicgKyBpbmRleClcbiAgICAgICAgICAudGV4dCh0aGlzLnJvdW5kRGVjaW1hbChkLDIpKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy50b29sdGlwLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB0aGlzLnNjYWxlWCh0KSArIFwiLFwiICsgdGhpcy5zY2FsZVkoZCkgKyBcIilcIik7XG4gICAgfVxuICAgIFxuICB9XG5cbiAgLyoqXG4gICAqIEhpZGUgdGhlIHRvb2x0aXBzIHdoZW4gdGhlIG1vdXNlIGxlYXZlIHRoZSBzdmcgXG4gICAqLyAgIFxuICBwcml2YXRlIGhpZGVJbmZvKCk6IHZvaWR7XG4gICAgdGhpcy50b29sdGlwLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSByYW5nZSAocmVkdWNlIG9yIGluY3JlYXNlKSBvZiB0aGUgbGluZWNoYXJ0IG9uIHNjcm9sbCBcbiAgICogQHBhcmFtIHtXaGVlbEV2ZW50fSBldmVudCBcbiAgICovXG4gIHByaXZhdGUgYWN0aXZlWm9vbShldmVudDogV2hlZWxFdmVudCk6IHZvaWR7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBsZXQgbGFzdExlbmd0aExvY2FsVGltZSA9IHRoaXMubGVuZ3RoVGltZSAvIE1hdGgucG93KDEuNSx0aGlzLmlkWm9vbSk7XG4gICAgbGV0IGxhc3RNaW5Mb2NhbFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpO1xuICAgIGlmKChldmVudC5kZWx0YVk+MCYmdGhpcy5pZFpvb20+MCl8fGV2ZW50LmRlbHRhWTwwKXtcbiAgICAgIGlmKGV2ZW50LmRlbHRhWT4wJiZ0aGlzLmlkWm9vbT4wKXtcbiAgICAgICAgdGhpcy5pZFpvb20tLTtcbiAgICAgIH1lbHNlIGlmKGV2ZW50LmRlbHRhWTwwKXtcbiAgICAgICAgdGhpcy5pZFpvb20rKzsgXG4gICAgICB9XG4gICAgICBsZXQgcG9zID0gdGhpcy5zY2FsZVguaW52ZXJ0KGV2ZW50LmNsaWVudFgtdGhpcy5tYXJnaW4ubGVmdCkuZ2V0VGltZSgpO1xuICAgICAgbGV0IGxlbmd0aExvY2FsVGltZSA9IHRoaXMubGVuZ3RoVGltZSAvIE1hdGgucG93KDEuNSx0aGlzLmlkWm9vbSk7XG4gICAgICBsZXQgbWluTG9jYWxUaW1lID0gKGxhc3RNaW5Mb2NhbFRpbWUtcG9zKSoobGVuZ3RoTG9jYWxUaW1lL2xhc3RMZW5ndGhMb2NhbFRpbWUpICsgcG9zO1xuICAgICAgdGhpcy5yYW5nZSA9IHRoaXMuY29udHJvbFJhbmdlKG1pbkxvY2FsVGltZSxsZW5ndGhMb2NhbFRpbWUpO1xuICAgICAgaWYobGVuZ3RoTG9jYWxUaW1lPjEwMDAwKXtcbiAgICAgICAgdGhpcy51cGRhdGVEYXRhWm9vbSh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVN2Zyh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgICB0aGlzLnJhbmdlQ2hhbmdlLmVtaXQodGhpcy5yYW5nZSk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5pZFpvb20tLTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSB2YWx1ZSBvZiBjdXJyZW50IHRpbWUgb24gdGhlIG1vdmVtZW50IG9mIHRoZSBtb3VzZVxuICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFxuICAgKi9cbiAgcHJpdmF0ZSBtb3ZlQ3VycmVudFRpbWUoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lke1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgbGV0IHBvcyA9IHRoaXMuc2NhbGVYLmludmVydChldmVudC5jbGllbnRYLXRoaXMubWFyZ2luLmxlZnQpLmdldFRpbWUoKTtcbiAgICBpZihwb3M8dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1pblwiKSl7XG4gICAgICB0aGlzLmN1cnJlbnRUaW1lPXRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNaW5cIik7XG4gICAgfWVsc2UgaWYocG9zPnRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNYXhcIikpe1xuICAgICAgdGhpcy5jdXJyZW50VGltZT10aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWF4XCIpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5jdXJyZW50VGltZT1wb3M7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlQ3VycmVudFRpbWUoKTtcbiAgICB0aGlzLmN1cnJlbnRUaW1lQ2hhbmdlLmVtaXQodGhpcy5jdXJyZW50VGltZSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udHJvbCB0aGUgcmFuZ2UgYmFzZWQgb24gZGF0YSdzIHRpbWVzdGFtcCBhbmQgdGhlIG5ldyByYW5nZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWluIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCBvZiB0aGUgbmV3IHJhbmdlXG4gICAqIEByZXR1cm5zIGEgYWRqdXN0ZWQgcmFuZ2UgYmFzZWQgb24gZGF0YSdzIHRpbWVzdGFtcFxuICAgKi9cbiAgcHJpdmF0ZSBjb250cm9sUmFuZ2UobWluOm51bWJlciwgbGVuZ3RoOm51bWJlcikgOiBbbnVtYmVyLG51bWJlcl17XG4gICAgaWYodGhpcy5taW5UaW1lPm1pbikgbWluPXRoaXMubWluVGltZTtcbiAgICBsZXQgbWF4ID0gbWluICsgbGVuZ3RoO1xuICAgIGlmKHRoaXMubWF4VGltZTxtYXgpe1xuICAgICAgbWF4PXRoaXMubWF4VGltZTtcbiAgICAgIG1pbj1tYXggLSBsZW5ndGg7XG4gICAgfVxuICAgIGlmKHRoaXMubWluVGltZT5taW4pIG1pbj10aGlzLm1pblRpbWU7XG4gICAgcmV0dXJuIFttaW4sbWF4XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb250cm9sIHRoZSBkb21haW4gYmFzZWQgb24gZGF0YSdzIHZhbHVlIHR5cGUgYW5kIHRoZSBpbnB1dCBkb21haW5cbiAgICogQHJldHVybnMgYSBuZXcgZG9tYWluIGF1dG8tc2NhbGVkIGlmIHRoZSBpbnB1dCBkb21haW4gaXMgZXF1YWwgdG8gWzAsMF0gb3IgdGhlIGRhdGEncyB2YWx1ZSBhcmUgcG9zaXRpdmUgaW50ZWdlcnMsIGVsc2UgcmV0dXJuIHRoZSBpbnB1dCBkb21haW4gXG4gICAqL1xuICBwcml2YXRlIGNvbnRyb2xEb21haW4oKTpbbnVtYmVyLG51bWJlcl17XG4gICAgaWYoKHRoaXMuZG9tYWluWzBdPT0wJiZ0aGlzLmRvbWFpblsxXT09MCl8fHRoaXMuZGlzY3JldGVWYWx1ZSh0aGlzLmRhdGEpKXtcbiAgICAgIHJldHVybiBbdGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ5TWluXCIpLHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieU1heFwiKV07XG4gICAgfWVsc2V7XG4gICAgICByZXR1cm4gdGhpcy5kb21haW47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjb250cm9sQ29sb3IoY29sb3I6IHN0cmluZyl7XG4gICAgbGV0IHMgPSBuZXcgT3B0aW9uKCkuc3R5bGU7XG4gICAgcy5jb2xvciA9IGNvbG9yO1xuICAgIHJldHVybiBzLmNvbG9yIT1cIlwiO1xuICB9XG5cbiAgLyoqIFxuICAgKiBEZXRlcm1pbmUgdGhlIG1pbmltdW0gb3IgbWF4aW11bSBvZiB0aGUgaG9yaXpvbnRhbCBvciB2ZXJ0aWNhbCBheGlzIGluIGRhdGFcbiAgICogQHBhcmFtIHtEYXRhW119IGRhdGEgQXJyYXkgb2YgRGF0YVxuICAgKiBAcGFyYW0ge1wieE1pblwiIHwgXCJ4TWF4XCIgfCBcInlNaW5cIiB8IFwieU1heFwifSBzIHByZWNpc2Ugd2loY2ggc2NhbGUgd2Ugd2FudFxuICAgKiBAcmV0dXJucyB0aGUgdmFsdWUgdGhhdCBtYXRjaGVzIHdpdGggdGhlIHBhcmFtZXRlciBzIGluIGRhdGFcbiAgICovXG4gIHByaXZhdGUgc2NhbGUoZGF0YTogRGF0YVtdLCBzOiBcInhNaW5cIiB8IFwieE1heFwiIHwgXCJ5TWluXCIgfCBcInlNYXhcIik6IG51bWJlciB7XG4gICAgbGV0IHJlczogbnVtYmVyID0gMDtcbiAgICBkYXRhLmZvckVhY2goXG4gICAgICAoZWxlbWVudHMsaW5kZXgpID0+IGVsZW1lbnRzLnZhbHVlcy5mb3JFYWNoXG4gICAgICAoKGVsZW1lbnQsaSkgPT4ge1xuICAgICAgICBpZigocz09XCJ5TWluXCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzFdPHJlcykpfHwocz09XCJ5TWF4XCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzFdPnJlcykpKSByZXM9ZWxlbWVudFsxXTtcbiAgICAgICAgZWxzZSBpZigocz09XCJ4TWluXCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzBdPHJlcykpfHwocz09XCJ4TWF4XCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzBdPnJlcykpKSByZXM9ZWxlbWVudFswXTtcbiAgICAgIH0pXG4gICAgKVxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICAvKiogXG4gICpDaGVjayB0eXBlIG9mIGRhdGEgKHBvc2l0aXZlIGludGVnZXIgb3IgZmxvYXQpXG4gICpAcGFyYW0ge0RhdGFbXX0gZGF0YSBBcnJheSBvZiBEYXRhXG4gICpAcmV0dXJucyBmYWxzZSBpZiB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgdmFsdWUgaW4gZGF0YSB0aGF0J3Mgbm90IGEgcG9zaXRpdmUgaW50ZWdlclxuICAqL1xuICBwcml2YXRlIGRpc2NyZXRlVmFsdWUoZGF0YTogRGF0YVtdKTogYm9vbGVhbntcbiAgICBmb3IobGV0IGk6bnVtYmVyPTA7aTxkYXRhLmxlbmd0aDtpKyspe1xuICAgICAgZm9yKGxldCBqOm51bWJlcj0wO2o8ZGF0YVtpXS52YWx1ZXMubGVuZ3RoO2orKyl7XG4gICAgICAgIGlmKGRhdGFbaV0udmFsdWVzW2pdWzFdIT1NYXRoLnJvdW5kKGRhdGFbaV0udmFsdWVzW2pdWzFdKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSb3VuZCBhIG51bWJlciB3aXRoIGEgcHJlY2lzaW9uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBudW0gXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gXG4gICAqIEByZXR1cm5zIGEgbnVtIHdpdGggYSBudW1iZXIgb2YgZGVjaW1hbCAocHJlY2lzaW9uKVxuICAgKi9cbiAgcHJpdmF0ZSByb3VuZERlY2ltYWwobnVtIDogbnVtYmVyLCBwcmVjaXNpb246bnVtYmVyKTogbnVtYmVye1xuICAgIGxldCB0bXA6IG51bWJlciA9IE1hdGgucG93KDEwLCBwcmVjaXNpb24pO1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCBudW0qdG1wICkvdG1wO1xuICB9XG59XG4iXX0=