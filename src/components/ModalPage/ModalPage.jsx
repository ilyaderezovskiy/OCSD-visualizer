import React, { useEffect, useRef, useState } from "react";
import Typography from '@mui/material/Typography';
import MultipleSelectCheckmarks from "../MultipleSelectCheckmarks";
import Box from "@mui/material/Box";
import CSVDataTable from "../../CSVDataTable";
import * as d3 from "d3";
import "./ModalPage.css";

const ModalPage = ({active, setActive, data, barChartData, items, eventlog}) => {
    const chartRef = useRef(null);
    const filteredArray = eventlog ? eventlog.filter(item => items.includes(item.item)) : [];

    useEffect(() => {
        if (barChartData && chartRef.current) {
            const svg = d3.select(chartRef.current);
            svg.selectAll("*").remove();

            const width = 450;
            const height = 300;
            const margin = { top: 30, right: 20, bottom: 30, left: 80 };

            const formattedData = Object.entries(barChartData).map(([key, value]) => [String(Number(key) + 1), value]);

            const x = d3.scaleBand()
                .domain(formattedData.map(([key]) => key))
                .range([margin.left, width - margin.right])
                .padding(0.1);

            const y = d3.scaleLinear()
                .domain([0, d3.max(formattedData.map(([, value]) => value))])
                .nice()
                .range([height - margin.bottom, margin.top]);

            svg.append("g")
                .attr("fill", "steelblue")
                .selectAll("rect")
                .data(formattedData)
                .join("rect")
                .attr("x", ([key]) => x(key))
                .attr("y", ([, value]) => y(value))
                .attr("height", ([, value]) => y(0) - y(value))
                .attr("width", x.bandwidth());

            svg.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x));

            svg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(y));
            
            // Добавление подписей значений над каждым столбцом
            svg.append("g")
                .selectAll("text")
                .data(formattedData)
                .join("text")
                .attr("x", ([key]) => x(key) + x.bandwidth() / 2)
                .attr("y", ([, value]) => y(value) - 5)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .style("font-size", "12px")
                .text(([, value]) => value);

            // Подпись оси x
            svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 5)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .text("The number of consecutive repetitions of the event");

            // Подпись оси y
            svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .text("Number of objects");
        }
    }, [barChartData]);


    return (
        <div id="modal" className={active ? "modal active" : "modal"} onClick={() => setActive(false)}>
            <div id="modalContent" className={active ? "modal__content active" : "modal__content"} onClick={e => e.stopPropagation()}>
                {data}
                <svg ref={chartRef} width={450} height={320}></svg>
                <Box sx={{ marginTop: 3, marginBottom: 2 }}>
                    <Typography variant="h8" p="15px">
                        Select object
                    </Typography>
                </Box>
                <MultipleSelectCheckmarks type="item" data={filteredArray} format="cycle"/>
            </div>
        </div>
    );
};

export default ModalPage;
