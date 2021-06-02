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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXktbGliLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL215LWxpYi9zcmMvbGliL215LWxpYi5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBYyxZQUFZLEVBQUUsS0FBSyxFQUFVLE1BQU0sRUFBNEIsU0FBUyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBR2hJLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFDOzs7OztBQVd6QixNQUFNLFVBQVUsU0FBUyxDQUFDLENBQVM7SUFDakMsSUFBRyxDQUFDLElBQUUsSUFBSTtRQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ2hCLElBQUksQ0FBQyxJQUFFLEtBQUs7UUFBRSxPQUFPLENBQUMsQ0FBQzs7UUFDdkIsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNqQixDQUFDO0FBYUQsTUFBTSxPQUFPLGNBQWM7SUFtQ3pCLFlBQW9CLFFBQW1CO1FBQW5CLGFBQVEsR0FBUixRQUFRLENBQVc7UUFsQzlCLFVBQUssR0FBVyxHQUFHLENBQUM7UUFDcEIsV0FBTSxHQUFXLEdBQUcsQ0FBQztRQUNyQixTQUFJLEdBQVcsRUFBRSxDQUFDO1FBQ2xCLFdBQU0sR0FBcUIsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7UUFJakMsVUFBSyxHQUFvQixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztRQUM5QixnQkFBVyxHQUFHLElBQUksWUFBWSxFQUFtQixDQUFDO1FBQ25ELGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1FBQ3ZCLHNCQUFpQixHQUFHLElBQUksWUFBWSxFQUFVLENBQUM7UUFFbEQsVUFBSyxHQUFVLGFBQWEsQ0FBQztRQUM1QixXQUFNLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFF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QUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNuQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDeEUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDakMsSUFBRyxDQUFDLEdBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFDLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUM7aUJBQ3BFLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0QixJQUFJLENBQUMsR0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFDLElBQUksQ0FBQyxRQUFRLENBQUMs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dCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIEVsZW1lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5wdXQsIE9uSW5pdCwgT3V0cHV0LCBSZW5kZXJlcjIsIFNpbXBsZUNoYW5nZXMsIFZpZXdDaGlsZCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTY2FsZVRpbWUsIFNjYWxlTGluZWFyfSBmcm9tICdkMy1zY2FsZSc7XG5pbXBvcnQge1NlbGVjdGlvbn0gZnJvbSAnZDMtc2VsZWN0aW9uJztcbmltcG9ydCAqIGFzIGQzIGZyb20gJ2QzJztcblxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGEge1xuICBsYWJlbDogc3RyaW5nO1xuICB2YWx1ZXM6IFtudW1iZXIsbnVtYmVyXVtdO1xuICBjb2xvcjogc3RyaW5nO1xuICBzdHlsZTogXCJsaW5lXCIgfCBcImFyZWFcIiB8IFwiYm90aFwiO1xuICBpbnRlcnBvbGF0aW9uOiBcImxpbmVhclwiIHwgXCJzdGVwXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUJvb2woczogc3RyaW5nKSB7XG4gIGlmKHM9PSdPTicpIHJldHVybiAxO1xuICBlbHNlIGlmIChzPT0nT0ZGJykgcmV0dXJuIDA7XG4gIGVsc2UgcmV0dXJuIC0xO1xufVxuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdsaWItbXktbGliJyxcbiAgdGVtcGxhdGU6IGBcbiAgPGgyPnt7IHRpdGxlIH19PC9oMj5cbiAgPHN2ZyAjcm9vdCBbYXR0ci53aWR0aF09XCJ3aWR0aFwiIFthdHRyLmhlaWdodF09XCJoZWlnaHRcIj48L3N2Zz5cbiAgPGRpdiAjem9uZT48ZGl2ICNzY3JvbGw+PC9kaXY+PC9kaXY+XG4gIGAsXG4gIHN0eWxlczogW1xuICBdXG59KVxuXG5leHBvcnQgY2xhc3MgTXlMaWJDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBASW5wdXQoKSB3aWR0aDogbnVtYmVyID0gOTAwO1xuICBASW5wdXQoKSBoZWlnaHQ6IG51bWJlciA9IDIwMDsgXG4gIEBJbnB1dCgpIGRhdGE6IERhdGFbXSA9IFtdO1xuICBASW5wdXQoKSBkb21haW46IFtudW1iZXIsIG51bWJlcl0gPSBbMCwwXTtcbiAgQFZpZXdDaGlsZCgncm9vdCcpIHRpbWVsaW5lITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZCgnc2Nyb2xsJykgc2Nyb2xsYmFyITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZCgnem9uZScpIHpvbmVTY3JvbGxiYXIhOiBFbGVtZW50UmVmO1xuICBASW5wdXQoKSByYW5nZTogW251bWJlcixudW1iZXJdID0gWzAsMF07XG4gIEBPdXRwdXQoKSByYW5nZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8W251bWJlcixudW1iZXJdPigpO1xuICBASW5wdXQoKSBjdXJyZW50VGltZTogbnVtYmVyID0gMDtcbiAgQE91dHB1dCgpIGN1cnJlbnRUaW1lQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KCk7XG5cbiAgcHVibGljIHRpdGxlOnN0cmluZyA9ICdUaW1lbGluZSA6ICc7XG4gIHByaXZhdGUgbWFyZ2luID0geyB0b3A6IDIwLCByaWdodDogMjAsIGJvdHRvbTogMzAsIGxlZnQ6IDUwIH07IC8vbWFyZ2UgaW50ZXJuZSBhdSBzdmcgXG4gIHByaXZhdGUgZGF0YVpvb206IERhdGFbXSA9IFtdO1xuICBwcml2YXRlIGlkWm9vbTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtaW5UaW1lOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1heFRpbWU6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbGVuZ3RoVGltZTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBzdmdXaWR0aDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBzdmdIZWlnaHQ6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgc2NhbGVYOiBTY2FsZVRpbWU8bnVtYmVyLG51bWJlcj4gPSBkMy5zY2FsZVRpbWUoKTtcbiAgcHJpdmF0ZSBzY2FsZVk6IFNjYWxlTGluZWFyPG51bWJlcixudW1iZXI+ID0gZDMuc2NhbGVMaW5lYXIoKTtcbiAgcHJpdmF0ZSBzdmc6IGFueTtcbiAgcHJpdmF0ZSBhcmVhOiBkMy5BcmVhPFtudW1iZXIsIG51bWJlcl0+W10gPSBbXTtcbiAgcHJpdmF0ZSBsaW5lOiBkMy5MaW5lPFtudW1iZXIsIG51bWJlcl0+W10gPSBbXTtcbiAgcHJpdmF0ZSB0b29sdGlwITogU2VsZWN0aW9uPFNWR0dFbGVtZW50LHVua25vd24sbnVsbCx1bmRlZmluZWQ+O1xuICBwcml2YXRlIGxhc3REYXRhbGVuZ3RoOm51bWJlciA9IDA7XG4gIHByaXZhdGUgbW9kZVRvb2xUaXBzOiBcIm5vcm1hbFwiIHwgXCJpbnZlcnNlXCIgPSBcIm5vcm1hbFwiO1xuICBwcml2YXRlIGN1cnJlbnRUaW1lU2VsZWN0ZWQ6Ym9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIHNjcm9sbGJhclNlbGVjdGVkOmJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBsYXN0UG9zOiBudW1iZXIgPSAwO1xuICBcbiAgXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMikgeyAgIFxuICB9XG5cbiAgLyoqXG4gICAqIENvcHkgZGF0YSBpbiBkYXRhWm9vbSwgYW5kIGJ1aWxkIHRpdGxlIFxuICAgKi9cbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuZGF0YVpvb20gPSBbLi4udGhpcy5kYXRhXTtcbiAgICB0aGlzLmxhc3REYXRhbGVuZ3RoPXRoaXMuZGF0YVpvb20ubGVuZ3RoO1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICBpZihpbmRleD09dGhpcy5kYXRhLmxlbmd0aC0xKSB0aGlzLnRpdGxlID0gdGhpcy50aXRsZStlbGVtZW50LmxhYmVsKycuJztcbiAgICAgIGVsc2UgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUrZWxlbWVudC5sYWJlbCArICcsICc7XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGxpbmVjaGFydFxuICAgKi9cbiAgcHVibGljIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50aW1lbGluZSAhPSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCB3ID0gdGhpcy50aW1lbGluZS5uYXRpdmVFbGVtZW50LndpZHRoLmFuaW1WYWwudmFsdWU7XG4gICAgICBsZXQgaCA9IHRoaXMudGltZWxpbmUubmF0aXZlRWxlbWVudC5oZWlnaHQuYW5pbVZhbC52YWx1ZTtcbiAgICAgIHRoaXMuc3ZnV2lkdGggPSAodyAtIHRoaXMubWFyZ2luLmxlZnQpIC0gdGhpcy5tYXJnaW4ucmlnaHQ7XG4gICAgICB0aGlzLnN2Z0hlaWdodCA9IChoIC0gdGhpcy5tYXJnaW4udG9wKSAtIHRoaXMubWFyZ2luLmJvdHRvbTtcbiAgICB9XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHRoaXMuYnVpbGRTdHlsZURhdGEoZWxlbWVudCxpbmRleCkpO1xuICAgIHRoaXMuYnVpbGRab29tKCk7IFxuICAgIHRoaXMuYnVpbGRFdmVudCgpO1xuICAgIHRoaXMuZHJhd1Rvb2xUaXBzKCk7XG4gICAgdGhpcy5kcmF3QXhpcygpO1xuICAgIHRoaXMuZHJhd0xpbmVBbmRQYXRoKCk7XG4gICAgdGhpcy5kcmF3TGluZUN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy5kcmF3U2Nyb2xsYmFyKCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGxpbmVjaGFydCBvbiBkYXRhLCByYW5nZSBvciBjdXJyZW50IHRpbWUgY2hhbmdlc1xuICAgKiBAcGFyYW0ge1NpbXBsZUNoYW5nZXN9IGNoYW5nZXMgXG4gICAqL1xuICBwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzLmRhdGEmJiFjaGFuZ2VzLmRhdGEuZmlyc3RDaGFuZ2UpIHRoaXMudXBkYXRlQ2hhcnQoKTtcbiAgICBpZiAoKGNoYW5nZXMuZGF0YSYmIWNoYW5nZXMuZGF0YS5maXJzdENoYW5nZSYmdGhpcy5yYW5nZVswXSE9MCYmdGhpcy5yYW5nZVsxXSE9MCl8fChjaGFuZ2VzLnJhbmdlJiYhY2hhbmdlcy5yYW5nZS5maXJzdENoYW5nZSkpIHtcbiAgICAgIHRoaXMuaWRab29tPU1hdGgucm91bmQoTWF0aC5sb2codGhpcy5sZW5ndGhUaW1lLyh0aGlzLnJhbmdlWzFdLXRoaXMucmFuZ2VbMF0pKS9NYXRoLmxvZygxLjUpKTtcbiAgICAgIHRoaXMucmFuZ2U9dGhpcy5jb250cm9sUmFuZ2UodGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdLXRoaXMucmFuZ2VbMF0pO1xuICAgICAgaWYodGhpcy5kYXRhLmxlbmd0aCE9MCl7XG4gICAgICAgIHRoaXMudXBkYXRlRGF0YVpvb20odGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdmcodGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNoYW5nZXMuY3VycmVudFRpbWUmJiFjaGFuZ2VzLmN1cnJlbnRUaW1lLmZpcnN0Q2hhbmdlJiZ0aGlzLmRhdGEubGVuZ3RoIT0wKSB0aGlzLnVwZGF0ZUN1cnJlbnRUaW1lKCk7XG59XG5cbiAgLyoqXG4gICAqIEFkZCBldmVudCBsaXN0ZW5lcnMgb24gdGhlIHN2Z1xuICAgKi9cbiAgcHJpdmF0ZSBidWlsZEV2ZW50KCk6IHZvaWR7IC8vIGNyZWVyIHVuZSB0aW1lbGluZSBhdmVjIHVuZSBzZXVsIGRvbm7DqWVcbiAgICB0aGlzLnN2ZyA9IGQzLnNlbGVjdCh0aGlzLnRpbWVsaW5lLm5hdGl2ZUVsZW1lbnQpXG4gICAgLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHRoaXMubWFyZ2luLmxlZnQgKyAnLCcgKyB0aGlzLm1hcmdpbi50b3AgKyAnKScpO1xuICAgIGQzLnNlbGVjdCh0aGlzLnRpbWVsaW5lLm5hdGl2ZUVsZW1lbnQpLm9uKFwibW91c2Vtb3ZlXCIsIChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgaWYodGhpcy5jdXJyZW50VGltZVNlbGVjdGVkKSB0aGlzLm1vdmVDdXJyZW50VGltZShldmVudCk7XG4gICAgICBlbHNlIHRoaXMuc2hvd0luZm8oZXZlbnQpO1xuICAgIH0pXG4gICAgLm9uKFwibW91c2VsZWF2ZVwiLCAoKSA9PiB7IHRoaXMuY3VycmVudFRpbWVTZWxlY3RlZCA9IGZhbHNlOyB0aGlzLmhpZGVJbmZvKCkgfSlcbiAgICAub24oXCJ3aGVlbFwiLCAoZXZlbnQ6IFdoZWVsRXZlbnQpID0+IHRoaXMuYWN0aXZlWm9vbShldmVudCkpXG4gICAgLm9uKFwibW91c2V1cFwiLCAoKSA9PiB0aGlzLmN1cnJlbnRUaW1lU2VsZWN0ZWQ9ZmFsc2UpXG4gICAgLm9uKFwibW91c2VvdmVyXCIsIChldmVudDogTW91c2VFdmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgdGhlIHN0eWxlIChhcmVhLCBsaW5lIG9yIGJvdGgpIGFuZCB0aGUgaW50ZXJwb2xhdGlvbiAoc3RwZSBvciBsaW5lYXIpIG9mIGxpbmVzXG4gICAqIEBwYXJhbSB7RGF0YX0gZWxlbWVudCBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFxuICAgKi9cbiAgcHJpdmF0ZSBidWlsZFN0eWxlRGF0YShlbGVtZW50OkRhdGEsIGluZGV4Om51bWJlcik6IHZvaWR7XG4gICAgaWYoZWxlbWVudC5zdHlsZT09XCJhcmVhXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgaWYoZWxlbWVudC5pbnRlcnBvbGF0aW9uPT1cInN0ZXBcIil7XG4gICAgICAgIHRoaXMuYXJlYVtpbmRleF09ZDMuYXJlYSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55MCh0aGlzLnN2Z0hlaWdodClcbiAgICAgICAgLnkxKChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICAgIC5jdXJ2ZShkMy5jdXJ2ZVN0ZXBBZnRlcik7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5hcmVhW2luZGV4XT1kMy5hcmVhKClcbiAgICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgICAgLnkwKHRoaXMuc3ZnSGVpZ2h0KVxuICAgICAgICAueTEoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWShkWzFdKSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoZWxlbWVudC5zdHlsZT09XCJsaW5lXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgaWYoZWxlbWVudC5pbnRlcnBvbGF0aW9uPT1cInN0ZXBcIil7XG4gICAgICAgIHRoaXMubGluZVtpbmRleF09ZDMubGluZSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICAgIC5jdXJ2ZShkMy5jdXJ2ZVN0ZXBBZnRlcik7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5saW5lW2luZGV4XT1kMy5saW5lKClcbiAgICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgICAgLnkoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWShkWzFdKSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoIXRoaXMuY29udHJvbENvbG9yKGVsZW1lbnQuY29sb3IpKXtcbiAgICAgIGVsZW1lbnQuY29sb3I9XCJibGFja1wiO1xuICAgIH0gXG4gIH1cblxuICAvKipcbiAgICogU2F2ZSBpbmZvcm1hdGlvbiBmb3Igem9vbS5cbiAgICovXG4gIHByaXZhdGUgYnVpbGRab29tKCk6IHZvaWR7XG4gICAgdGhpcy5taW5UaW1lID0gdGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ4TWluXCIpO1xuICAgIHRoaXMubWF4VGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieE1heFwiKTtcbiAgICB0aGlzLmxlbmd0aFRpbWUgPSB0aGlzLm1heFRpbWUgLSB0aGlzLm1pblRpbWU7XG4gICAgdGhpcy5pZFpvb209MDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3IHRoZSB0b29sdGlwcydzIHN2Z1xuICAgKi9cbiAgcHJpdmF0ZSBkcmF3VG9vbFRpcHMoKTogdm9pZHsgLy9jcmVlciBsZSB0b29sdGlwc1xuICAgIHRoaXMudG9vbHRpcCA9IHRoaXMuc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXBcIilcbiAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgLy8gTGUgY2VyY2xlIGV4dMOpcmlldXIgYmxldSBjbGFpclxuICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwiI0NDRTVGNlwiKVxuICAgICAgICAuYXR0cihcInJcIiwgMTApO1xuICAgIC8vIExlIGNlcmNsZSBpbnTDqXJpZXVyIGJsZXUgZm9uY8OpXG4gICAgdGhpcy50b29sdGlwLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAuYXR0cihcImZpbGxcIiwgXCIjMzQ5OGRiXCIpXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiI2ZmZlwiKVxuICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjEuNXB4XCIpXG4gICAgICAgIC5hdHRyKFwiclwiLCA0KTtcbiAgICAvLyBMZSB0b29sdGlwIGVuIGx1aS1tw6ptZSBhdmVjIHNhIHBvaW50ZSB2ZXJzIGxlIGJhc1xuICAgIC8vIElsIGZhdXQgbGUgZGltZW5zaW9ubmVyIGVuIGZvbmN0aW9uIGR1IGNvbnRlbnVcbiAgICBsZXQgdGFpbGxlID0gdGhpcy5kYXRhWm9vbS5sZW5ndGg7XG4gICAgaWYgKHRoaXMubW9kZVRvb2xUaXBzID09IFwibm9ybWFsXCIpIHtcbiAgICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJwb2x5bGluZVwiKVxuICAgICAgICAuYXR0cihcInBvaW50c1wiLCBcIjAsMCAwLFwiICsgKDQwICogdGFpbGxlKStcIiwgNzUsXCIgKyAoNDAgKiB0YWlsbGUpK1wiLCA4MCxcIiArICg0NSAqIHRhaWxsZSkrXCIgODUsXCIgKyAoNDAgKiB0YWlsbGUpK1wiIDE2MCxcIiArICg0MCAqIHRhaWxsZSkrXCIgMTYwLDAgMCwwXCIpXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgXCIjZmFmYWZhXCIpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZVwiLFwiIzM0OThkYlwiKVxuICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsXCIwLjlcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsXCIxXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwgXCIgKyAoLTUwICogdGFpbGxlKSArIFwiKVwiKTtcbiAgICAgIHRoaXMuZGF0YVpvb20uZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgICAvLyBDZXQgw6lsw6ltZW50IGNvbnRpZW5kcmEgdG91dCBub3RyZSB0ZXh0ZVxuICAgICAgICBsZXQgdGV4dCA9IHRoaXMudG9vbHRpcC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgLnN0eWxlKFwiZm9udC1zaXplXCIsIFwiMTNweFwiKVxuICAgICAgICAgIC5zdHlsZShcImZvbnQtZmFtaWx5XCIsIFwiU2Vnb2UgVUlcIilcbiAgICAgICAgICAuc3R5bGUoXCJjb2xvclwiLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5zdHlsZShcImZpbGxcIiwgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtODAsXCIrKC00MiooaW5kZXgrMSkpK1wiKVwiKTtcbiAgICAgICAgLy8gRWxlbWVudCBwb3VyIGxhIGRhdGUgYXZlYyBwb3NpdGlvbm5lbWVudCBzcMOpY2lmaXF1ZVxuICAgICAgICB0ZXh0LmFwcGVuZChcInRzcGFuXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeFwiLCBcIjdcIilcbiAgICAgICAgICAuYXR0cihcImR5XCIsIFwiNVwiKVxuICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0b29sdGlwLWRhdGUxXCIgKyBpbmRleCk7XG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiLTkwXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjE1XCIpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTJcIitpbmRleCk7XG4gICAgICB9KTtcbiAgICB9ZWxzZSB7XG4gICAgICB0aGlzLnRvb2x0aXAuYXBwZW5kKFwicG9seWxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJwb2ludHNcIiwgXCIwLFwiKyg5NSsoKHRhaWxsZS0xKSAqNDAgKSkrXCIgLCAwLDU1ICwgNzUsNTUgLCA4MCw1MCAsIDg1LDU1ICwgMTYwLDU1ICwgMTYwLFwiKyg5NSsoKHRhaWxsZS0xKSAqNDAgKSkrXCIgMCxcIisoOTUrKCh0YWlsbGUtMSkgKjQwICkpK1wiXCIpXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgXCIjZmFmYWZhXCIpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZVwiLFwiIzM0OThkYlwiKVxuICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsXCIwLjlcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsXCIxXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwgXCIgKyAoLTUwICogMSkgKyBcIilcIik7XG4gICAgICB0aGlzLmRhdGFab29tLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgICAgLy8gQ2V0IMOpbMOpbWVudCBjb250aWVuZHJhIHRvdXQgbm90cmUgdGV4dGVcbiAgICAgICAgbGV0IHRleHQgPSB0aGlzLnRvb2x0aXAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgIC5zdHlsZShcImZvbnQtc2l6ZVwiLCBcIjEzcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LWZhbWlseVwiLCBcIlNlZ29lIFVJXCIpXG4gICAgICAgICAgLnN0eWxlKFwiY29sb3JcIiwgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTgwLFwiKygtMzAqKGluZGV4KzEpKStcIilcIik7XG4gICAgICAgIC8vIEVsZW1lbnQgcG91ciBsYSBkYXRlIGF2ZWMgcG9zaXRpb25uZW1lbnQgc3DDqWNpZmlxdWVcbiAgICAgICAgdGV4dC5hcHBlbmQoXCJ0c3BhblwiKVxuICAgICAgICAgIC5hdHRyKFwiZHhcIiwgXCI3XCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCA1MCArIDcwKmluZGV4KVxuICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0b29sdGlwLWRhdGUxXCIgKyBpbmRleCk7XG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiLTgwXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjIwXCIpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTJcIitpbmRleCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHJhdyBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBheGlzIGFuZCBzY2FsZVxuICAgKi9cbiAgcHJpdmF0ZSBkcmF3QXhpcygpOiB2b2lke1xuICAgIHRoaXMuc2NhbGVYLnJhbmdlKFswLCB0aGlzLnN2Z1dpZHRoXSk7XG4gICAgdGhpcy5zY2FsZVguZG9tYWluKFt0aGlzLm1pblRpbWUsdGhpcy5tYXhUaW1lXSk7XG4gICAgdGhpcy5zY2FsZVkgPSBkMy5zY2FsZUxpbmVhcigpO1xuICAgIHRoaXMuc2NhbGVZLnJhbmdlKFt0aGlzLnN2Z0hlaWdodCwgMF0pO1xuICAgIHRoaXMuc2NhbGVZLmRvbWFpbih0aGlzLmNvbnRyb2xEb21haW4oKSk7XG4gICAgLy8gQ29uZmlndXJlIHRoZSBYIEF4aXNcbiAgICB0aGlzLnN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwnICsgdGhpcy5zdmdIZWlnaHQgKyAnKScpXG4gICAgICAuYXR0cignY2xhc3MnLCAneEF4aXMnKVxuICAgICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh0aGlzLnNjYWxlWCkpO1xuICAgIC8vIENvbmZpZ3VyZSB0aGUgWSBBeGlzXG4gICAgaWYodGhpcy5kaXNjcmV0ZVZhbHVlKHRoaXMuZGF0YSkpe1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd5QXhpcycpXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh0aGlzLnNjYWxlWSkudGlja3ModGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ5TWF4XCIpKSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLnN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3lBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHRoaXMuc2NhbGVZKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERyYXcgbGluZXMgb24gdGhlIGxpbmUgY2hhcnRcbiAgICovXG4gIHByaXZhdGUgZHJhd0xpbmVBbmRQYXRoKCk6IHZvaWR7XG4gICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKFxuICAgICAgKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJhcmVhXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgICAgIHRoaXMuc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgLmRhdHVtKHRoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcylcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnYXJlYScraW5kZXgpXG4gICAgICAgICAgLmF0dHIoJ2QnLCB0aGlzLmFyZWFbaW5kZXhdKVxuICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDAuMSlcbiAgICAgICAgICAuYXR0cignb3BhY2l0eScsIDAuMylcbiAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICcycHgnKVxuICAgICAgICB9XG4gICAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwibGluZVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgICAgICB0aGlzLnN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgIC5kYXR1bShlbGVtZW50LnZhbHVlcylcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbGluZScraW5kZXgpXG4gICAgICAgICAgLmF0dHIoJ2QnLCB0aGlzLmxpbmVbaW5kZXhdKVxuICAgICAgICAgIC5zdHlsZSgnZmlsbCcsICdub25lJylcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnMnB4JylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3IHRoZSB2ZXJ0aWNhbCBsaW5lIHdoaWNoIHJlcHJlc2VudHMgdGhlIGN1cnJlbnQgdGltZVxuICAgKi9cbiAgcHJpdmF0ZSBkcmF3TGluZUN1cnJlbnRUaW1lKCk6IHZvaWR7XG4gICAgaWYodGhpcy5kYXRhLmxlbmd0aCE9MCl7XG4gICAgICBpZih0aGlzLmN1cnJlbnRUaW1lPT0wKXtcbiAgICAgICAgdGhpcy5jdXJyZW50VGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieE1pblwiKTtcbiAgICAgIH1cbiAgICAgIGxldCB4Om51bWJlcj0wO1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmRhdHVtKFtbdGhpcy5jdXJyZW50VGltZSx0aGlzLmNvbnRyb2xEb21haW4oKVswXV0sW3RoaXMuY3VycmVudFRpbWUsdGhpcy5zdmdIZWlnaHRdXSlcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2N1cnJlbnRUaW1lTGluZScpXG4gICAgICAgIC5hdHRyKCdkJywgZDMubGluZSgpXG4gICAgICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB4PXRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAnbm9uZScpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgJ3JlZCcpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzNweCcpO1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY3VycmVudFRpbWVTZWxlY3RvcicpXG4gICAgICAgIC5hdHRyKCdjeCcsIHgpXG4gICAgICAgIC5hdHRyKCdjeScsIC0xMylcbiAgICAgICAgLmF0dHIoJ3InLCA3KVxuICAgICAgICAuYXR0cignZmlsbCcsICdyZWQnKVxuICAgICAgICAub24oXCJtb3VzZWRvd25cIiwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudFRpbWVTZWxlY3RlZD10cnVlO1xuICAgICAgICAgIHRoaXMuaGlkZUluZm8oKTtcbiAgICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHJhdyB0aGUgc2Nyb2xsYmFyIGFuZCBldmVudCBsaXN0ZW5lciBvbiBpdCAgXG4gICAqL1xuICBwcml2YXRlIGRyYXdTY3JvbGxiYXIoKTogdm9pZHtcbiAgICB0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS53aWR0aCA9IHRoaXMuc3ZnV2lkdGgrXCJweFwiO1xuICAgIHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLm1hcmdpbkxlZnQgPSB0aGlzLm1hcmdpbi5sZWZ0KyBcInB4XCI7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gXCIyMHB4XCI7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJsaWdodGdyZXlcIjtcbiAgICB0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5ib3JkZXJSYWRpdXMgPSBcIjEwcHhcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLndpZHRoID0gdGhpcy5zdmdXaWR0aCtcInB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5oZWlnaHQgPSBcIjIwcHhcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiZ3JleVwiO1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCIxMHB4XCI7XG4gICAgdGhpcy5yZW5kZXJlci5saXN0ZW4odGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudCwgJ21vdXNlZG93bicsIChldmVudDpNb3VzZUV2ZW50KSA9PiB0aGlzLmFjdGl2ZVNjcm9sbGJhcihldmVudCkpO1xuICAgIHRoaXMucmVuZGVyZXIubGlzdGVuKHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LCAnbW91c2VsZWF2ZScsICgpID0+IHRoaXMuZGVzYWN0aXZlU2Nyb2xsYmFyKCkpO1xuICAgIHRoaXMucmVuZGVyZXIubGlzdGVuKHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LCAnbW91c2V1cCcsICgpID0+IHRoaXMuZGVzYWN0aXZlU2Nyb2xsYmFyKCkpO1xuICAgIHRoaXMucmVuZGVyZXIubGlzdGVuKHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LCdtb3VzZW1vdmUnLCAoZXZlbnQ6TW91c2VFdmVudCkgPT4gdGhpcy51cGRhdGVSYW5nZShldmVudCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhbGwgdGhlIGxpbmUgY2hhcnQgKGhvcml6b250YWwgYW5kIHZlcnRpY2FsIGF4aXMgYW5kIHNjYWxlLCBkYXRhLCBsaW5lcyBhbmQgcmFuZ2UpIG9uIGRhdGEgY2hhbmdlcy4gXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZUNoYXJ0KCk6IHZvaWR7XG4gICAgdGhpcy5kYXRhWm9vbSA9IFsuLi50aGlzLmRhdGFdO1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKFxuICAgICAgKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgICAgdGhpcy5idWlsZFN0eWxlRGF0YShlbGVtZW50LGluZGV4KTtcbiAgICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJhcmVhXCIpIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmxpbmUnK2luZGV4KS5yZW1vdmUoKTtcbiAgICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJsaW5lXCIpIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmFyZWEnK2luZGV4KS5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy50aXRsZSA9ICdUaW1lbGluZSA6ICc7XG4gICAgICAgIGlmKGluZGV4PT10aGlzLmRhdGEubGVuZ3RoLTEpIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlK2VsZW1lbnQubGFiZWwrJy4nO1xuICAgICAgICBlbHNlIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlK2VsZW1lbnQubGFiZWwgKyAnLCAnO1xuICAgIH0pXG4gICAgdGhpcy5idWlsZFpvb20oKTtcbiAgICB0aGlzLnNjYWxlWC5kb21haW4oW3RoaXMubWluVGltZSx0aGlzLm1heFRpbWVdKTtcbiAgICB0aGlzLnNjYWxlWS5yYW5nZShbdGhpcy5zdmdIZWlnaHQsIDBdKTtcbiAgICB0aGlzLmNvbnRyb2xEb21haW4oKTtcbiAgICB0aGlzLnNjYWxlWS5kb21haW4odGhpcy5jb250cm9sRG9tYWluKCkpO1xuICAgIGlmKHRoaXMuZGlzY3JldGVWYWx1ZSh0aGlzLmRhdGEpKXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnlBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHRoaXMuc2NhbGVZKS50aWNrcyh0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInlNYXhcIikpKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnlBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHRoaXMuc2NhbGVZKSk7XG4gICAgfVxuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnhBeGlzJykuY2FsbChkMy5heGlzQm90dG9tKHRoaXMuc2NhbGVYKSk7XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVMaW5lJykucmVtb3ZlKCk7XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVTZWxlY3RvcicpLnJlbW92ZSgpO1xuICAgIHRoaXMudXBkYXRlTGluZSgpO1xuICAgIHRoaXMuZHJhd0xpbmVDdXJyZW50VGltZSgpO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsYmFyKHRoaXMubWluVGltZSx0aGlzLm1heFRpbWUpO1xuICAgIHRoaXMudXBkYXRlVG9vbFRpcHMoKTtcbiAgICBmb3IobGV0IGluZGV4PXRoaXMuZGF0YVpvb20ubGVuZ3RoOyBpbmRleDx0aGlzLmxhc3REYXRhbGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmxpbmUnK2luZGV4KS5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmFyZWEnK2luZGV4KS5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5sYXN0RGF0YWxlbmd0aD10aGlzLmRhdGFab29tLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgaG9yaXpvbnRhbCBheGlzLCBjdXJyZW50IHRpbWUgbGluZSwgbGluZXMgYW5kIHNjcm9sbGJhclxuICAgKiBAcGFyYW0ge251bWJlcn0gbWluIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heCBvZiB0aGUgbmV3IHJhbmdlXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVN2ZyhtaW46IG51bWJlciwgbWF4OiBudW1iZXIpe1xuICAgIHRoaXMuc2NhbGVYLmRvbWFpbihbbWluLG1heF0pO1xuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnhBeGlzJykuY2FsbChkMy5heGlzQm90dG9tKHRoaXMuc2NhbGVYKSk7XG4gICAgdGhpcy51cGRhdGVMaW5lKCk7XG4gICAgdGhpcy51cGRhdGVDdXJyZW50VGltZSgpO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsYmFyKG1pbixtYXgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgZGlzcGxheSBvZiBsaW5lc1xuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVMaW5lKCk6IHZvaWR7XG4gICAgbGV0IGxpbmVVcGRhdGU7XG4gICAgbGV0IGFyZWFVcGRhdGU7XG4gICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICBpZihlbGVtZW50LnN0eWxlPT1cImFyZWFcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICAgIGFyZWFVcGRhdGU9IHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmFyZWEnK2luZGV4KS5kYXRhKFt0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXNdKTtcbiAgICAgICAgYXJlYVVwZGF0ZVxuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnYXJlYScraW5kZXgpXG4gICAgICAgIC5tZXJnZShhcmVhVXBkYXRlKVxuICAgICAgICAuYXR0cignZCcsIHRoaXMuYXJlYVtpbmRleF0pXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDAuMSlcbiAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwLjMpXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnMnB4Jyk7XG4gICAgICB9XG4gICAgICBpZihlbGVtZW50LnN0eWxlPT1cImxpbmVcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICAgIGxpbmVVcGRhdGU9IHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmxpbmUnK2luZGV4KS5kYXRhKFt0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXNdKTtcbiAgICAgICAgbGluZVVwZGF0ZVxuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGluZScraW5kZXgpXG4gICAgICAgIC5tZXJnZShsaW5lVXBkYXRlKVxuICAgICAgICAuYXR0cignZCcsIHRoaXMubGluZVtpbmRleF0pXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsICdub25lJylcbiAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICcycHgnKVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcG9zaXRpb24gb2YgdGhlIGN1cnJlbnQgdGltZSBsaW5lXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZUN1cnJlbnRUaW1lKCk6IHZvaWR7XG4gICAgbGV0IGxpbmVVcGRhdGUgPSB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZUxpbmUnKS5kYXR1bShbW3RoaXMuY3VycmVudFRpbWUsdGhpcy5jb250cm9sRG9tYWluKClbMF1dLFt0aGlzLmN1cnJlbnRUaW1lLHRoaXMuc3ZnSGVpZ2h0XV0pO1xuICAgIGxldCB4Om51bWJlcj0wO1xuICAgIGxpbmVVcGRhdGUuZW50ZXIoKVxuICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2N1cnJlbnRUaW1lTGluZScpXG4gICAgLm1lcmdlKGxpbmVVcGRhdGUpXG4gICAgLmF0dHIoJ2QnLCBkMy5saW5lKClcbiAgICAgIC54KChkOiBudW1iZXJbXSkgPT4geD10aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpKVxuICAgIC5zdHlsZSgnZmlsbCcsICdub25lJylcbiAgICAuc3R5bGUoJ3N0cm9rZScsICdyZWQnKVxuICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzNweCcpO1xuICAgIGlmKHRoaXMuY3VycmVudFRpbWU+PXRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNaW5cIikmJnRoaXMuY3VycmVudFRpbWU8PXRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNYXhcIikpe1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVMaW5lJykuYXR0cignZGlzcGxheScsJ2Jsb2NrJyk7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZVNlbGVjdG9yJykuYXR0cignZGlzcGxheScsJ2Jsb2NrJyk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZUxpbmUnKS5hdHRyKCdkaXNwbGF5Jywnbm9uZScpO1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVTZWxlY3RvcicpLmF0dHIoJ2Rpc3BsYXknLCdub25lJyk7XG4gICAgfVxuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lU2VsZWN0b3InKS5hdHRyKCdjeCcseCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgc2Nyb2xsYmFyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtaW4gb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4IG9mIHRoZSBuZXcgcmFuZ2VcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlU2Nyb2xsYmFyKG1pbjpudW1iZXIsIG1heDpudW1iZXIpOiB2b2lke1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUubWFyZ2luTGVmdD0gdGhpcy5zdmdXaWR0aCoobWluLXRoaXMubWluVGltZSkvKHRoaXMubGVuZ3RoVGltZSkgKyBcInB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS53aWR0aD0gdGhpcy5zdmdXaWR0aCoobWF4LW1pbikvKHRoaXMubGVuZ3RoVGltZSkgKyBcInB4XCI7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHRoZSByYW5nZSwgY29udHJvbCBpdCwgdXBkYXRlIGRhdGFzLCB1cGRhdGUgdGhlIGxpbmVjaGFydCBhbmQgdGhlbiBlbWl0IHRoZSBuZXcgcmFuZ2UuXG4gICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVJhbmdlKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZHtcbiAgICBpZih0aGlzLnNjcm9sbGJhclNlbGVjdGVkKXtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBsZXQgbGVuZ3RoTG9jYWxUaW1lID0gdGhpcy5yYW5nZVsxXS10aGlzLnJhbmdlWzBdO1xuICAgICAgbGV0IGxhc3RNaW5Mb2NhbFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpO1xuICAgICAgbGV0IHBvcyA9IGV2ZW50LmNsaWVudFgtdGhpcy5tYXJnaW4ubGVmdDtcbiAgICAgIGlmKHRoaXMubGFzdFBvcz09MCl7XG4gICAgICAgIHRoaXMubGFzdFBvcz0gcG9zO1xuICAgICAgfVxuICAgICAgbGV0IG1pbkxvY2FsVGltZSA9IChwb3MtdGhpcy5sYXN0UG9zKSp0aGlzLmxlbmd0aFRpbWUvdGhpcy5zdmdXaWR0aCArIGxhc3RNaW5Mb2NhbFRpbWU7XG4gICAgICB0aGlzLnJhbmdlID0gdGhpcy5jb250cm9sUmFuZ2UobWluTG9jYWxUaW1lLGxlbmd0aExvY2FsVGltZSk7XG4gICAgICB0aGlzLnVwZGF0ZURhdGFab29tKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICB0aGlzLnVwZGF0ZVN2Zyh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgdGhpcy5yYW5nZUNoYW5nZS5lbWl0KHRoaXMucmFuZ2UpO1xuICAgICAgdGhpcy5sYXN0UG9zPXBvcztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHRoaXMuZGF0YVpvb20gYXQgcmFuZ2UgY2hhbmdlc1xuICAgKiBAcGFyYW0ge251bWJlcn0gbWluIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heCBvZiB0aGUgbmV3IHJhbmdlIFxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVEYXRhWm9vbShtaW46bnVtYmVyLG1heDpudW1iZXIpOiB2b2lke1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICB0aGlzLmRhdGFab29tW2luZGV4XT17XG4gICAgICAgIGxhYmVsOiBlbGVtZW50LmxhYmVsLFxuICAgICAgICB2YWx1ZXM6IGVsZW1lbnQudmFsdWVzLmZpbHRlcigoZWxlbWVudDogbnVtYmVyW10pID0+IG1pbiA8PSBlbGVtZW50WzBdICYmIGVsZW1lbnRbMF0gPD0gIG1heCksXG4gICAgICAgIGNvbG9yOiBlbGVtZW50LmNvbG9yLFxuICAgICAgICBzdHlsZTogZWxlbWVudC5zdHlsZSxcbiAgICAgICAgaW50ZXJwb2xhdGlvbjogZWxlbWVudC5pbnRlcnBvbGF0aW9uXG4gICAgfX0pIFxuICAgIGxldCB0aW1lOiBudW1iZXJbXTtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgdGltZT1bXTtcbiAgICAgIGVsZW1lbnQudmFsdWVzLmZvckVhY2goKGVsZW1lbnQgPT4gdGltZS5wdXNoKGVsZW1lbnRbMF0pKSk7XG4gICAgICBsZXQgaSA9IGQzLmJpc2VjdExlZnQodGltZSwgbWluKS0xO1xuICAgICAgaWYoaT49MCYmaTx0aGlzLmRhdGFbaW5kZXhdLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICB0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXMudW5zaGlmdChbbWluLCh0aGlzLmRhdGFbaW5kZXhdLnZhbHVlc1tpXVsxXSldKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcy5wdXNoKFttYXgsdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzW3RoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcy5sZW5ndGgtMV1bMV1dKTtcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbmQgYnVpbGQgYSBuZXcgdG9vbHRpcHNcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlVG9vbFRpcHMoKTogdm9pZHtcbiAgICB0aGlzLnRvb2x0aXAucmVtb3ZlKCk7XG4gICAgdGhpcy5kcmF3VG9vbFRpcHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBY3RpdmUgbW92ZW1lbnQgb2Ygc2Nyb2xsYmFyIG9uIG1vdXNlZG93biBvbiBpdFxuICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFxuICAgKi8gXG4gIHByaXZhdGUgYWN0aXZlU2Nyb2xsYmFyKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZHtcbiAgICB0aGlzLnNjcm9sbGJhclNlbGVjdGVkPXRydWU7XG4gICAgdGhpcy5sYXN0UG9zPWV2ZW50LmNsaWVudFgtdGhpcy5tYXJnaW4ubGVmdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNhY3RpdmUgbW92ZW1lbnQgb2Ygc2Nyb2xsYmFyIG9uIG1vdXNldXAgb3IgbW91c2VsZWF2ZSBvbiBpdFxuICAgKi9cbiAgcHJpdmF0ZSBkZXNhY3RpdmVTY3JvbGxiYXIoKTogdm9pZHtcbiAgICB0aGlzLnNjcm9sbGJhclNlbGVjdGVkPWZhbHNlO1xuICAgIHRoaXMubGFzdFBvcz0wO1xuICB9XG5cbiAgLyoqXG4gICAqIFNob3cgdGhlIHRvb2x0aXBzIG9uIHRoZSBtb3ZlbWVudCBvZiB0aGUgbW91c2VcbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBcbiAgICovXG4gIHByaXZhdGUgc2hvd0luZm8oZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lke1xuICAgIGxldCB0aW1lOiBudW1iZXJbXSA9IFtdO1xuICAgIGlmICh0aGlzLmRhdGFab29tWzBdICE9IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5kYXRhWm9vbVswXS52YWx1ZXMuZm9yRWFjaCgoZWxlbWVudCkgPT4gdGltZS5wdXNoKGVsZW1lbnRbMF0pKTtcbiAgICAgIHRoaXMudG9vbHRpcC5zdHlsZShcImRpc3BsYXlcIixcImJsb2NrXCIpO1xuICAgICAgdGhpcy50b29sdGlwLnN0eWxlKFwib3BhY2l0eVwiLCAxMDApO1xuICAgICAgbGV0IHgwID0gdGhpcy5zY2FsZVguaW52ZXJ0KGV2ZW50LmNsaWVudFggLSB0aGlzLm1hcmdpbi5sZWZ0KS5nZXRUaW1lKCk7XG4gICAgICBsZXQgeCA9IGQzLmJpc2VjdFJpZ2h0KHRpbWUsIHgwKTtcbiAgICAgIGlmKHg+dGhpcy5kYXRhWm9vbVswXS52YWx1ZXMubGVuZ3RoLTEpeD10aGlzLmRhdGFab29tWzBdLnZhbHVlcy5sZW5ndGgtMTtcbiAgICAgIGVsc2UgaWYgKHggPCAwKSB4ID0gMDtcbiAgICAgIGxldCBkOiBudW1iZXIgPSB0aGlzLmRhdGFab29tWzBdLnZhbHVlc1t4XVsxXTtcbiAgICAgIGxldCB0ID0gdGhpcy5kYXRhWm9vbVswXS52YWx1ZXNbeF1bMF07XG4gICAgICBpZiAodGhpcy5zY2FsZVkoZCkgPD0gNDAqdGhpcy5kYXRhWm9vbS5sZW5ndGgpIHtcbiAgICAgICAgaWYgKHRoaXMubW9kZVRvb2xUaXBzICE9IFwiaW52ZXJzZVwiKSB7XG4gICAgICAgICAgdGhpcy5tb2RlVG9vbFRpcHMgPSBcImludmVyc2VcIjtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVRvb2xUaXBzKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLm1vZGVUb29sVGlwcyAhPSBcIm5vcm1hbFwiKSB7XG4gICAgICAgICAgdGhpcy5tb2RlVG9vbFRpcHMgPSBcIm5vcm1hbFwiO1xuICAgICAgICAgIHRoaXMudXBkYXRlVG9vbFRpcHMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKChlbGVtZW50LCBpbmRleCkgPT4ge1xuICAgICAgICBsZXQgaSA9IHg7XG4gICAgICAgIGlmKGk+ZWxlbWVudC52YWx1ZXMubGVuZ3RoLTEpaT10aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXMubGVuZ3RoLTE7XG4gICAgICAgIGVsc2UgaWYgKGkgPCAwKSBpID0gMDtcbiAgICAgICAgbGV0IGQ6IG51bWJlciA9IGVsZW1lbnQudmFsdWVzW2ldWzFdO1xuICAgICAgICBsZXQgdCA9IGVsZW1lbnQudmFsdWVzW2ldWzBdO1xuICAgICAgICBsZXQgZGF0ZSA9IG5ldyBEYXRlKHQpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImZyXCIsIHsgeWVhcjogJ251bWVyaWMnLCBtb250aDogJ2xvbmcnLCBkYXk6ICdudW1lcmljJywgaG91cjogJ251bWVyaWMnLCBtaW51dGU6ICdudW1lcmljJywgc2Vjb25kOiAnbnVtZXJpYycgfSk7XG4gICAgICAgIGQzLnNlbGVjdEFsbCgnI3Rvb2x0aXAtZGF0ZTEnICsgaW5kZXgpXG4gICAgICAgICAgLnRleHQoZGF0ZSk7XG4gICAgICAgIGQzLnNlbGVjdEFsbCgnI3Rvb2x0aXAtZGF0ZTInICsgaW5kZXgpXG4gICAgICAgICAgLnRleHQodGhpcy5yb3VuZERlY2ltYWwoZCwyKSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMudG9vbHRpcC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgdGhpcy5zY2FsZVgodCkgKyBcIixcIiArIHRoaXMuc2NhbGVZKGQpICsgXCIpXCIpO1xuICAgIH1cbiAgICBcbiAgfVxuXG4gIC8qKlxuICAgKiBIaWRlIHRoZSB0b29sdGlwcyB3aGVuIHRoZSBtb3VzZSBsZWF2ZSB0aGUgc3ZnIFxuICAgKi8gICBcbiAgcHJpdmF0ZSBoaWRlSW5mbygpOiB2b2lke1xuICAgIHRoaXMudG9vbHRpcC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcmFuZ2UgKHJlZHVjZSBvciBpbmNyZWFzZSkgb2YgdGhlIGxpbmVjaGFydCBvbiBzY3JvbGwgXG4gICAqIEBwYXJhbSB7V2hlZWxFdmVudH0gZXZlbnQgXG4gICAqL1xuICBwcml2YXRlIGFjdGl2ZVpvb20oZXZlbnQ6IFdoZWVsRXZlbnQpOiB2b2lke1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgbGV0IGxhc3RMZW5ndGhMb2NhbFRpbWUgPSB0aGlzLmxlbmd0aFRpbWUgLyBNYXRoLnBvdygxLjUsdGhpcy5pZFpvb20pO1xuICAgIGxldCBsYXN0TWluTG9jYWxUaW1lID0gdGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1pblwiKTtcbiAgICBpZigoZXZlbnQuZGVsdGFZPjAmJnRoaXMuaWRab29tPjApfHxldmVudC5kZWx0YVk8MCl7XG4gICAgICBpZihldmVudC5kZWx0YVk+MCYmdGhpcy5pZFpvb20+MCl7XG4gICAgICAgIHRoaXMuaWRab29tLS07XG4gICAgICB9ZWxzZSBpZihldmVudC5kZWx0YVk8MCl7XG4gICAgICAgIHRoaXMuaWRab29tKys7IFxuICAgICAgfVxuICAgICAgbGV0IHBvcyA9IHRoaXMuc2NhbGVYLmludmVydChldmVudC5jbGllbnRYLXRoaXMubWFyZ2luLmxlZnQpLmdldFRpbWUoKTtcbiAgICAgIGxldCBsZW5ndGhMb2NhbFRpbWUgPSB0aGlzLmxlbmd0aFRpbWUgLyBNYXRoLnBvdygxLjUsdGhpcy5pZFpvb20pO1xuICAgICAgbGV0IG1pbkxvY2FsVGltZSA9IChsYXN0TWluTG9jYWxUaW1lLXBvcykqKGxlbmd0aExvY2FsVGltZS9sYXN0TGVuZ3RoTG9jYWxUaW1lKSArIHBvcztcbiAgICAgIHRoaXMucmFuZ2UgPSB0aGlzLmNvbnRyb2xSYW5nZShtaW5Mb2NhbFRpbWUsbGVuZ3RoTG9jYWxUaW1lKTtcbiAgICAgIGlmKGxlbmd0aExvY2FsVGltZT4xMDAwMCl7XG4gICAgICAgIHRoaXMudXBkYXRlRGF0YVpvb20odGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdmcodGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgICAgdGhpcy5yYW5nZUNoYW5nZS5lbWl0KHRoaXMucmFuZ2UpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuaWRab29tLS07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgdmFsdWUgb2YgY3VycmVudCB0aW1lIG9uIHRoZSBtb3ZlbWVudCBvZiB0aGUgbW91c2VcbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBcbiAgICovXG4gIHByaXZhdGUgbW92ZUN1cnJlbnRUaW1lKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGxldCBwb3MgPSB0aGlzLnNjYWxlWC5pbnZlcnQoZXZlbnQuY2xpZW50WC10aGlzLm1hcmdpbi5sZWZ0KS5nZXRUaW1lKCk7XG4gICAgaWYocG9zPHRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNaW5cIikpe1xuICAgICAgdGhpcy5jdXJyZW50VGltZT10aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpO1xuICAgIH1lbHNlIGlmKHBvcz50aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWF4XCIpKXtcbiAgICAgIHRoaXMuY3VycmVudFRpbWU9dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1heFwiKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuY3VycmVudFRpbWU9cG9zO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy5jdXJyZW50VGltZUNoYW5nZS5lbWl0KHRoaXMuY3VycmVudFRpbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnRyb2wgdGhlIHJhbmdlIGJhc2VkIG9uIGRhdGEncyB0aW1lc3RhbXAgYW5kIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiBvZiB0aGUgbmV3IHJhbmdlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGggb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcmV0dXJucyBhIGFkanVzdGVkIHJhbmdlIGJhc2VkIG9uIGRhdGEncyB0aW1lc3RhbXBcbiAgICovXG4gIHByaXZhdGUgY29udHJvbFJhbmdlKG1pbjpudW1iZXIsIGxlbmd0aDpudW1iZXIpIDogW251bWJlcixudW1iZXJde1xuICAgIGlmKHRoaXMubWluVGltZT5taW4pIG1pbj10aGlzLm1pblRpbWU7XG4gICAgbGV0IG1heCA9IG1pbiArIGxlbmd0aDtcbiAgICBpZih0aGlzLm1heFRpbWU8bWF4KXtcbiAgICAgIG1heD10aGlzLm1heFRpbWU7XG4gICAgICBtaW49bWF4IC0gbGVuZ3RoO1xuICAgIH1cbiAgICBpZih0aGlzLm1pblRpbWU+bWluKSBtaW49dGhpcy5taW5UaW1lO1xuICAgIHJldHVybiBbbWluLG1heF07XG4gIH1cblxuICAvKipcbiAgICogQ29udHJvbCB0aGUgZG9tYWluIGJhc2VkIG9uIGRhdGEncyB2YWx1ZSB0eXBlIGFuZCB0aGUgaW5wdXQgZG9tYWluXG4gICAqIEByZXR1cm5zIGEgbmV3IGRvbWFpbiBhdXRvLXNjYWxlZCBpZiB0aGUgaW5wdXQgZG9tYWluIGlzIGVxdWFsIHRvIFswLDBdIG9yIHRoZSBkYXRhJ3MgdmFsdWUgYXJlIHBvc2l0aXZlIGludGVnZXJzLCBlbHNlIHJldHVybiB0aGUgaW5wdXQgZG9tYWluIFxuICAgKi9cbiAgcHJpdmF0ZSBjb250cm9sRG9tYWluKCk6W251bWJlcixudW1iZXJde1xuICAgIGlmKCh0aGlzLmRvbWFpblswXT09MCYmdGhpcy5kb21haW5bMV09PTApfHx0aGlzLmRpc2NyZXRlVmFsdWUodGhpcy5kYXRhKSl7XG4gICAgICByZXR1cm4gW3RoaXMuc2NhbGUodGhpcy5kYXRhLFwieU1pblwiKSx0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInlNYXhcIildO1xuICAgIH1lbHNle1xuICAgICAgcmV0dXJuIHRoaXMuZG9tYWluO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY29udHJvbENvbG9yKGNvbG9yOiBzdHJpbmcpe1xuICAgIGxldCBzID0gbmV3IE9wdGlvbigpLnN0eWxlO1xuICAgIHMuY29sb3IgPSBjb2xvcjtcbiAgICByZXR1cm4gcy5jb2xvciE9XCJcIjtcbiAgfVxuXG4gIC8qKiBcbiAgICogRGV0ZXJtaW5lIHRoZSBtaW5pbXVtIG9yIG1heGltdW0gb2YgdGhlIGhvcml6b250YWwgb3IgdmVydGljYWwgYXhpcyBpbiBkYXRhXG4gICAqIEBwYXJhbSB7RGF0YVtdfSBkYXRhIEFycmF5IG9mIERhdGFcbiAgICogQHBhcmFtIHtcInhNaW5cIiB8IFwieE1heFwiIHwgXCJ5TWluXCIgfCBcInlNYXhcIn0gcyBwcmVjaXNlIHdpaGNoIHNjYWxlIHdlIHdhbnRcbiAgICogQHJldHVybnMgdGhlIHZhbHVlIHRoYXQgbWF0Y2hlcyB3aXRoIHRoZSBwYXJhbWV0ZXIgcyBpbiBkYXRhXG4gICAqL1xuICBwcml2YXRlIHNjYWxlKGRhdGE6IERhdGFbXSwgczogXCJ4TWluXCIgfCBcInhNYXhcIiB8IFwieU1pblwiIHwgXCJ5TWF4XCIpOiBudW1iZXIge1xuICAgIGxldCByZXM6IG51bWJlciA9IDA7XG4gICAgZGF0YS5mb3JFYWNoKFxuICAgICAgKGVsZW1lbnRzLGluZGV4KSA9PiBlbGVtZW50cy52YWx1ZXMuZm9yRWFjaFxuICAgICAgKChlbGVtZW50LGkpID0+IHtcbiAgICAgICAgaWYoKHM9PVwieU1pblwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFsxXTxyZXMpKXx8KHM9PVwieU1heFwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFsxXT5yZXMpKSkgcmVzPWVsZW1lbnRbMV07XG4gICAgICAgIGVsc2UgaWYoKHM9PVwieE1pblwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFswXTxyZXMpKXx8KHM9PVwieE1heFwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFswXT5yZXMpKSkgcmVzPWVsZW1lbnRbMF07XG4gICAgICB9KVxuICAgIClcbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgLyoqIFxuICAqQ2hlY2sgdHlwZSBvZiBkYXRhIChwb3NpdGl2ZSBpbnRlZ2VyIG9yIGZsb2F0KVxuICAqQHBhcmFtIHtEYXRhW119IGRhdGEgQXJyYXkgb2YgRGF0YVxuICAqQHJldHVybnMgZmFsc2UgaWYgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIHZhbHVlIGluIGRhdGEgdGhhdCdzIG5vdCBhIHBvc2l0aXZlIGludGVnZXJcbiAgKi9cbiAgcHJpdmF0ZSBkaXNjcmV0ZVZhbHVlKGRhdGE6IERhdGFbXSk6IGJvb2xlYW57XG4gICAgZm9yKGxldCBpOm51bWJlcj0wO2k8ZGF0YS5sZW5ndGg7aSsrKXtcbiAgICAgIGZvcihsZXQgajpudW1iZXI9MDtqPGRhdGFbaV0udmFsdWVzLmxlbmd0aDtqKyspe1xuICAgICAgICBpZihkYXRhW2ldLnZhbHVlc1tqXVsxXSE9TWF0aC5yb3VuZChkYXRhW2ldLnZhbHVlc1tqXVsxXSkpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUm91bmQgYSBudW1iZXIgd2l0aCBhIHByZWNpc2lvblxuICAgKiBAcGFyYW0ge251bWJlcn0gbnVtIFxuICAgKiBAcGFyYW0ge251bWJlcn0gcHJlY2lzaW9uIFxuICAgKiBAcmV0dXJucyBhIG51bSB3aXRoIGEgbnVtYmVyIG9mIGRlY2ltYWwgKHByZWNpc2lvbilcbiAgICovXG4gIHByaXZhdGUgcm91bmREZWNpbWFsKG51bSA6IG51bWJlciwgcHJlY2lzaW9uOm51bWJlcik6IG51bWJlcntcbiAgICBsZXQgdG1wOiBudW1iZXIgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKTtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCggbnVtKnRtcCApL3RtcDtcbiAgfVxufVxuIl19