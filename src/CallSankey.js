import React, { useRef, useEffect } from "react";
import SankeyFun from "./SankeyFun.js";

const saveSvgAsPng = require('save-svg-as-png');

const imageOptions = {
  encoderOptions: 1,
  backgroundColor: 'white',
}

// Функция проверки, является ли массив пустым
function isEmpty(obj) {
  for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
          return false;
      }
  }
  return true;
}

function CallSankey({ data, vertices, eventlog }) {
  var svgRef = useRef('#sankeySvg');
  
  // Вызов построения моделя для визуализации
  useEffect(() => {
    SankeyFun(
      { links: data, svgRef, vertices, eventlog },
      {
        height: 640, // 700
        width: isEmpty(vertices) ? 2900 : localStorage.getItem('nodesNumber' + vertices.name) * 200, // Ширина диаграммы (переходов)
        nodeGroup: (d) => d.id
        // nodeGroup: (d) => d.id.split(/\W/)[0]
      }
    );
  }, [data]);

  // Сохранение изображение визуализации
  var saveAsPng = () => {
    saveSvgAsPng.saveSvgAsPng(document.getElementById("chart"), 'chart.png', imageOptions);
  };

  return (
    <div className="home">
      <svg id="chart" ref={svgRef} />
      <button onClick={saveAsPng}>Save as PNG</button>
    </div>
  );
}

export default CallSankey;
