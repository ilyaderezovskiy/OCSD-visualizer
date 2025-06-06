import * as d3 from "d3";
import * as d3Sankey from "d3-sankey";
import './index.css';
import { graphviz } from "d3-graphviz";

// Функция проверки, является ли массив пустым
function isEmpty(obj) {
  for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        return false;
      }
  }
  return true;
}

export default function SankeyFun (
  { links, svgRef, vertices, eventlog },
  {
    nodes,
    // an iterable of link objects (typically [{source, target}, …]
    format = ",", // a function or format specifier for values in titles
    align = "justify", // convenience shorthand for nodeAlign
    nodeId = (d) => d.id, // given d in nodes, returns a unique identifier (string)
    nodeIndex = (d) => d.index,
    nodeGroup, // given d in nodes, returns an (ordinal) value for color
    nodeGroups, // an array of ordinal values representing the node groups
    nodeLabel, // given d in (computed) nodes, text to label the associated rect
    nodeTitle = (d) => `${d.id}\n`, // given d in (computed) nodes, hover text
    nodeAlign = align, // Sankey node alignment strategy: left, right, justify, center
    nodeWidth = 100, // width of node rects
    nodePadding = 0, //18, // vertical separation between adjacent nodes
    nodeLabelPadding = 6, // horizontal separation between node and label
    nodeStroke = "currentColor", // stroke around node rects
    nodeStrokeWidth = 5, // width of stroke around node rects, in pixels
    nodeStrokeOpacity, // opacity of stroke around node rects
    nodeStrokeLinejoin, // line join for stroke around node rects
    linkSource = ({ source }) => source, // given d in links, returns a node identifier string
    linkTarget = ({ target }) => target, // given d in links, returns a node identifier string
    linkValue = ({ value }) => value, // given d in links, returns the quantitative value
    linkValueLabel = ({ valueLabel }) => valueLabel, // given d in links, returns the quantitative value
    linkCycles = ({ cycle_1 }) => cycle_1,
    linkItems = ({ items }) => items,
    linkCost = ({ cost }) => cost,
    linkNum = ({ itemsNum }) => itemsNum,
    linkPath = d3Sankey.sankeyLinkHorizontal(), // given d in (computed) links, returns the SVG path
    linkTitle = (d) => `${d.source.id} → ${d.target.id}\n${format(d.value)}`, // given d in (computed) links
    linkColor = "source-target", // source, target, source-target, or static color
    linkStrokeOpacity = 1, // link stroke opacity
    linkMixBlendMode = "multiply", // link blending mode
    colors =  [d3.color("grey").copy({opacity: 0.6})],//d3.schemeTableau10, // array of colors
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    marginTop = 20, // top margin, in pixels
    marginRight = 30,//parseNodes.filter(el => el.includes('col ')).length > 5 ? -1000 : 1, // right margin, in pixels
    marginBottom = 5, // bottom margin, in pixels
    marginLeft = 100 // left margin, in pixels
  } = {}
) {
  var parseNodes = [];
  if (!isEmpty(vertices)) {
    var columns = vertices.resultData.data.map(function(item){return item;});
    localStorage.setItem('nodesNumber'+vertices.name, columns[0].length);

    for (let i = 0; i < Object.keys(columns[0]).length; i++) {
      parseNodes.push('col ' + columns[0][i]);
      
      for (let j = 1; j < Object.keys(columns).length; j++) {
        parseNodes.push(`col${i+1} ` + columns[j][i]);
          parseNodes.push(`1.` + columns[0][i] + ` ` + columns[j][i]); // парсить source и target и добавлять 1. и 2.
          parseNodes.push(`2.` + columns[0][i] + ` ` + columns[j][i]);
          parseNodes.push(`3.` + columns[0][i] + ` ` + columns[j][i]);
          parseNodes.push(columns[0][i] + ` ` + columns[j][i]);
      }
    }
  }
  
  // Convert nodeAlign from a name to a function (since d3-sankey is not part of core d3).
  if (typeof nodeAlign !== "function")
    nodeAlign =
      {
        left: d3Sankey.sankeyLeft,
        right: d3Sankey.sankeyRight,
        center: d3Sankey.sankeyCenter,
      }[nodeAlign] ?? d3Sankey.sankeyJustify;

  // Compute values.
  const LI = [...Array(links.length).keys()];
  const LS = d3.map(links, linkSource).map(intern);
  const LT = d3.map(links, linkTarget).map(intern);
  const LV = d3.map(links, linkValue);
  const LVL = d3.map(links, linkValueLabel);
  const LC = d3.map(links, linkCycles);
  const LIt = d3.map(links, linkItems);
  const LCost = d3.map(links, linkCost);

  if (nodes === undefined) {
    nodes = []
    var addedNodes = [];
    var cycles = {};
    var items = [];
    var sum = {};
    var itemsNum = {};

    links.forEach(function (d) {
      if (typeof d.source !== 'undefined' && typeof d.target !== 'undefined') {
        addedNodes.push(d.source);
        addedNodes.push(d.target);
        if (typeof d.cost !== 'undefined') {
          sum[d.source] = d.cost.toFixed(2)
        }

        if (typeof d.itemsNum !== 'undefined') {
          itemsNum[d.source] = d.itemsNum
        }

        if (d.cycle_1 !== 0 && typeof d.cycle_1 !== 'undefined') {
          if (!cycles[d.source]) {
            cycles[d.source] = d.cycle_1;
            items[d.source] = d.items;
          }
        }
      }
    });

    if (isEmpty(vertices)) {
      parseNodes = addedNodes;
    }

    var parseNodes2 = parseNodes.filter(item => addedNodes.includes(item));
      
    var i = 0;
    parseNodes2.forEach(function (d) {
      nodes.push({ "id": d, "index": i});
      i += 1;
    });
        
    //nodes = Array.from(d3.union(LS, LT), (id, index) => ({ id, index }));
  }

  const N = d3.map(nodes, nodeId).map(intern);
  const I = d3.map(nodes, nodeIndex).map(intern);
  const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);

  // Replace the input nodes and links with mutable objects for the simulation.
  nodes = d3.map(nodes, (_, i) => ({ id: N[i], index: I[i] }));
  //nodes = nodes.filter(item => !(item.id.includes('null')));

  links = d3.map(links, (_, i) => ({
    index: LI[i],
    source: LS[i],
    target: LT[i],
    value: LV[i],
    valueLabel: LVL[i],
    cycle_1: LC[i],
    items: LIt[i]
  }));

  const svg = d3.select(svgRef.current);

  svg.selectAll("*").remove();

  svg
  .attr("width", width)
  .attr("height", height)
  .style("white-space", "nowrap");

  const greyColor = d3.color("grey").copy({opacity: 0.4});
  const greyCycleColor = d3.rgb(128, 128, 128).copy({opacity: 0.8});
  const greenColor = d3.color("green").copy({opacity: 0.8});
  const blueColor = d3.color("steelblue").copy({opacity: 1});
  const whiteColor = d3.color("white").copy({opacity: 0.8});
  const yellowColor = d3.rgb(255, 215, 0).copy({opacity: 0.8});
  const yellowCycleColor = d3.rgb(204, 102, 0).copy({opacity: 0.8});
  const redColor = d3.rgb(255, 153, 204).copy({opacity: 1});
  const redCycleColor = d3.rgb(217, 28, 97).copy({opacity: 0.8});
  const lightYellowColor = d3.rgb(255, 215, 0).copy({opacity: 0.4});
  const lightRedColor = d3.rgb(255,204,229).copy({opacity: 1}); //d3.rgb(255, 99, 71).copy({opacity: 0.4});
  const lightGreyColor = d3.color("grey").copy({opacity: 0.2});
  const cycleColor = d3.rgb(255, 0, 0).copy({opacity: 1});

  var nodeColors = {
  }

  var flowColors = {
  }

  var linkLabels = []

  links.forEach((element) => {
    if (typeof element.source !== 'undefined' && typeof element.target !== 'undefined') {
      linkLabels.push(element.value)
      if (element.source.includes('1.') && element.target.includes('1.') && !element.source.includes('pass_')) {
        flowColors[element.index] = blueColor;
      } else if (element.source.includes('2.') && element.target.includes('2.')) {
        flowColors[element.index] = greenColor;
      } else if (element.source.includes('3.') && element.target.includes('3.')) {
        getGradient(element.source.x0, element.source.x1, element.source.y0, element.source.y1);
        flowColors[element.index] = "url(#svgGradient)";
      } else if ((element.source.includes('🔁') || element.target.includes('🔁')) && !element.source.includes('pass') && !element.target.includes('pass')) {
        if (element.source.includes(' order') && element.target.includes(' order')) {
          flowColors[element.index] = yellowCycleColor.copy({opacity: 0.8});
        } else if (element.source.includes(' item') && element.target.includes(' item')) {
          flowColors[element.index] = redCycleColor.copy({opacity: 0.8});
        } else if (element.source.includes(' package') && element.target.includes(' package')) {
          flowColors[element.index] = greyCycleColor.copy({opacity: 0.8});
        } else {
          return cycleColor;
        }
      } else if (element.source.includes(' order') && element.target.includes(' order')) {
        flowColors[element.index] = lightYellowColor;
      } else if (element.source.includes(' item') && element.target.includes(' item')) {
        flowColors[element.index] = lightRedColor;
      } else if (element.source.includes('pass_') || element.target.includes('pass_')) {
        flowColors[element.index] = whiteColor;
      } else {
        flowColors[element.index] = lightGreyColor;
      }
    }
  });

  // Ignore a group-based linkColor option if no groups are specified.
  if (!G && ["source", "target", "source-target"].includes(linkColor))
    linkColor = "currentColor";

  // Compute default domains.
  if (G && nodeGroups === undefined) nodeGroups = G;
  // Construct the scales.
  const color = nodeGroup == null ? "null" : d3.scaleOrdinal(nodeGroups, colors);

  // Compute the Sankey layout.
  d3Sankey
    .sankey()
    .nodeId(({ index: i }) => N[i])
    .nodeAlign(customAlign)
    .nodeWidth(nodeWidth)
    .nodePadding(nodePadding)
    .nodeSort(null)
    .extent([
      [marginLeft, marginTop],
      [width - marginRight, height - marginBottom]
    ])({ nodes, links });

    // Сортируем узлы по `depth`, чтобы идти сверху вниз
    nodes.sort((a, b) => a.depth - b.depth || a.y0 - b.y0);

    let lastY = marginTop; // Начальная координата Y
    let lastDepth = 0

    nodes.forEach((node, i) => {
        if (node.depth !== lastDepth) {
          lastY = marginTop;
          lastDepth = node.depth;
        }
        var y = node.y1 - node.y0;
        if (node.id.includes('cycle')) {
          node.y0 = lastY; // Верхняя граница узла
          node.y1 = node.y0 + y; // Оставляем исходную высоту
        }
        lastY = lastY + y + nodePadding; // Сдвигаем следующий узел вниз
    });

    links.forEach(link => {
      if (link.source.id.includes('cycle') && link.y0 > link.source.y1 && link.value === link.source.value) {
        link.y0 = (link.source.y0 + link.source.y1) / 2;
        link.y1 = (link.target.y0 + link.target.y1) / 2;
      }
    })

  // Compute titles and labels using layout nodes, so as to access aggregate values.
  if (typeof format !== "function") format = d3.format(format);
  const Tl =
    nodeLabel === undefined
      ? N
      : nodeLabel == null
      ? null
      : d3.map(nodes, nodeLabel);
  const Tt = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
  const Lt = linkTitle == null ? null : d3.map(links, linkTitle);

  var nodeLabels = []

  nodes.forEach(element => {
    var val = 0;

    element.sourceLinks.forEach(element2 => {
      val += element2.valueLabel == null ? element2.value : element2.valueLabel
    });
    if (element.sourceLinks && element.sourceLinks.length === 0) {
      element.targetLinks.forEach(element2 => {
        val += element2.valueLabel == null ? element2.value : element2.valueLabel
      });
    }
    nodeLabels[element.id] = val
  });

  // A unique identifier for clip paths (to avoid conflicts).
  const uid = `O-${Math.random().toString(16).slice(2)}`;

  const link = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", linkStrokeOpacity)
    .selectAll("g")
    .data(links)
    .join("g")
    .append("path")
    .attr("d", linkPath)
    .attr(
      "stroke", d => d.source.id.includes("col") ? "#00000000" : flowColors[d.index]
    )
    .style("stroke-width", ({ width }) => Math.max(3, width - 2)) // inner paddind node and link
    .attr("stroke-linecap", "butt")
    .style("z-index", 1)
    .call(
      Lt
        ? (path) => path.append("title").text(({ index: i }) => {
          return !Lt[i].includes("col") && !Lt[i].includes("pass") ? Lt[i] : ""; //+ "\ninfo" : "";
        })
        : () => {}
    )

  const node = svg
    .append("g")
    .selectAll("rect")
    .data(nodes)
    .join("rect")
    .attr("data-id", d => d.id)
    .attr("rx",(d) => d.id.includes("col") ? 5 : 0)
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("height", (d) => Math.max(4, d.y1 - d.y0))
    .attr("width", (d) => d.x1 - d.x0)
    .style("z-index", 2)
    .call(
      Tt
        ? (path) => path.append("title").text(({ index: i }) => {
          if (Tt[i].split(' ')[1] === 'order' + `\n`) {
            const resultText = (() => {
              try {
                const distribution = itemsNum[Tt[i]?.split('\n')[0]]?.lengthDistribution ?? {};
                
                return Object.entries(distribution)
                  .filter(([items]) => items !== '0')
                  .map(([items, count]) => `${count} orders contain ${items} item${items !== '1' ? 's' : ''} each`)
                  .join('\n');
              } catch (error) {
                console.error("Error processing order data:", error);
                return "Could not process order distribution";
              }
            })();

            return !Tt[i].includes("col") && !Tt[i].includes("pass") ? 'event: ' + Tt[i].split(' ')[0] + `\n` +
              'obj. type: ' + Tt[i].split(' ')[1] + 'avr. cost: ' + sum[Tt[i].split('\n')[0]] + `\n` +
              'avr. items count: ' + itemsNum[Tt[i].split('\n')[0]]?.average : ""; //+ `\n` + resultText: "";
          } else {
            return !Tt[i].includes("col") && !Tt[i].includes("pass") ? 'event: ' + Tt[i].split(' ')[0] + `\n` +
              'obj. type: ' + Tt[i].split(' ')[1] + 'avr. cost: ' + sum[Tt[i].split('\n')[0]] : "";
          }
        })
        : () => {}
    );

  node.filter(item => !item.id.includes('pas'))
  .on('mouseenter', function(event, d) {
    const miniNode = document.querySelector(`.mini-map-with-links rect[data-id="${d.id}"]`);
    if (miniNode) {
      miniNode.classList.add('highlighted-white');
    }

    // Подсветка в DFG-графе
    const dfgNode = document.querySelector(`.dfg-container g[data-id*="${d.id}"]`);
    if (dfgNode) {
      dfgNode.classList.add('highlighted-dfg');
    }
  })
  .on('mouseleave', function(event, d) {
    const miniNode = document.querySelector(`.mini-map-with-links rect[data-id="${d.id}"]`);
    if (miniNode) {
      miniNode.classList.remove('highlighted-white');
    }

    // Убрать подсветку в DFG-графе
    const dfgNode = document.querySelector(`.dfg-container g[data-id*="${d.id}"]`);
    if (dfgNode) {
      dfgNode.classList.remove('highlighted-dfg');
    }
  });

//Добавление бар-чартов
  nodeGroup = svg
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);
  
    nodeGroup.each(function(d) {
      if (cycles[d.id] && d.y1 - d.y0 > 40) {
        // Определяем максимальный ключ, чтобы узнать размер массива
        const maxKey = Math.max(...Object.keys(cycles[d.id]).map(Number));
        // Создаем массив длиной `maxKey` и заполняем его нулями
        var result = Array(maxKey).fill(0);

        // Заполняем массив значениями из словаря
        Object.entries(cycles[d.id]).forEach(([key, value]) => {
          result[Number(key) - 1] = value; // -1, так как массив начинается с 0
        });

        // Разбиваем массив на две части
        const firstPart = result.slice(0, 4); // Берем первые 4 элемента
        const sum = result.slice(4).reduce((acc, curr) => acc + curr, 0); // Суммируем все элементы начиная с 5

        // Объединяем первую часть и сумму
        result = [...firstPart, sum];
      
      const barChartData = result; // Используем данные из массива cycles
      const nodeWidth = d.x1 - d.x0; // Ширина узла
      const nodeHeight = d.y1 - d.y0; // Высота узла
  
      const barChartWidth = nodeWidth * 0.9; // Ширина бар-чарта (90% ширины узла)
      const barChartHeight = nodeHeight * 0.3; // Высота бар-чарта (30% высоты узла)
  
      const barScale = d3.scaleLinear()
          .domain([0, d3.max(barChartData)])
          .range([0, barChartHeight]);
  
      // Добавляем бар-чарт в правый нижний угол
      const bars = d3.select(this)
          .append("g")
          .attr("class", "bar-chart")
          .attr(
              "transform",
              `translate(${nodeWidth - barChartWidth - 3}, ${nodeHeight - barChartHeight - 2})`
          ); // Смещаем в правый нижний угол узла с отступом 3px
  
      bars.selectAll("rect")
          .data(barChartData)
          .join("rect")
          .attr("x", (d, i) => (i * (barChartWidth / barChartData.length))) // Распределение по ширине
          .attr("y", d => barChartHeight - barScale(d)) // Верхняя точка
          .attr("width", barChartWidth / barChartData.length - 2) // Ширина с отступом
          .attr("height", d => barScale(d)) // Высота столбца
          .style("fill", "steelblue");

        const barWidth = barChartWidth / barChartData.length - 3;
        
        bars.selectAll("text")
          .data(barChartData)
          .join("text")
          .attr("x", (d, i) => i * (barWidth + 4) + barWidth / 2) // Центр столбца
          .attr("y", d => barChartHeight - barScale(d) / 2)
          .text(d => d) // Отображаем значение
          .attr("text-anchor", "middle") // Центрируем текст
          .attr("fill", "white") // Цвет текста
          .style("font-size", "8px");
        }
  });

  nodes.forEach((element) => {
    if (element.id.includes('pass_')) {
      nodeColors[element.index] = whiteColor;
    }
    else if (element.id.includes('pass') && !element.id.includes('1.')) {
      // if (element.sourceLinks.length === 0 || element.targetLinks.length === 0) {
      //   nodeColors[element.index] = whiteColor;
      // } else {
      //   nodeColors[element.index] = d3.color("grey").copy({opacity: 0.2});
      // }
      if (element.id.includes(' order')) {
        nodeColors[element.index] = lightYellowColor;
      } else if (element.id.includes(' item')) {
        nodeColors[element.index] = lightRedColor;
      } else {
        nodeColors[element.index] = lightGreyColor;
      }
    } else if (element.id.includes('pas') && element.id.includes(' item') && !element.id.includes('1.')) {
      nodeColors[element.index] = redCycleColor.copy({opacity: 0.4});
    } else if (element.id.includes('🔁') && !element.id.includes('col') && !element.id.includes('1.')) {
      if (element.id.includes(' order')) {
        nodeColors[element.index] = yellowCycleColor.copy({opacity: 0.6});
      } else if (element.id.includes(' item')) {
        nodeColors[element.index] = redCycleColor.copy({opacity: 0.6});
      } else {
        nodeColors[element.index] = greyCycleColor;
      }
      //nodeColors[element.index] = cycleColor.copy({opacity: 0.5});
    } else if (element.id.includes('1.')) {
      if (element.id.includes('pas')) {
        nodeColors[element.index] = blueColor.copy({opacity: 0.4});
      } else {
        nodeColors[element.index] = blueColor;
      }
    } else if (element.id.includes('2.')) {
      nodeColors[element.index] = greenColor;
    } else if (element.id.includes('3.')) {
      getGradient(element.x0, element.x1, element.y0, element.y1);
      nodeColors[element.index] = "url(#svgGradient)";
    } else if (element.id.includes('col')) { //|| element.id.includes('-')) {
      nodeColors[element.index] = whiteColor;
    } else if (element.id.includes(' order')) {
      nodeColors[element.index] = yellowColor;
    } else if (element.id.includes(' item')) {
      nodeColors[element.index] = redColor;
    } 
    else {
      nodeColors[element.index] = greyColor;
    }
  });

  links.forEach((element) => {
    if (typeof element.source !== 'undefined' && typeof element.target !== 'undefined') {
      if (element.source.id.includes('pass') && (element.source.sourceLinks.length === 0 || element.source.targetLinks.length === 0)) {
        flowColors[element.index] = whiteColor;
      } 
      if (element.target.id.includes('pass') && (element.target.sourceLinks.length === 0 || element.target.targetLinks.length === 0)) {
        flowColors[element.index] = whiteColor;
      } 
      if (element.target.id.includes('pass_') || element.source.id.includes('pass_')) {
        flowColors[element.index] = whiteColor;
      }
    }
  });

  if (G) node.attr("fill", ({ index: i }) => nodeColors[i]);
  if (Tt) node.append("title").text(({ index: i }) => {
    return !Tt[i].includes("col") ? Tt[i] : ""; //+ "\ninfo" : "";
  })

  // Add the link text
  svg.append("g").selectAll(".link")
    .data(links)
    .enter()
    .append("text")
    .attr('class', 'linkText')
    .attr("font-size", 14)
    .attr("x", function(d) { return d.source.id.includes('cycle') ? d.source.x1 + 30 : d.target.x1 - nodeWidth - 20; })
    .attr("y", function(d) { return (d.y1); })
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .attr("transform", null)
    .text(function(d) { return !d.source.id.includes("col") & d.value !== 0 & !d.target.id.includes("pas") & !d.source.id.includes("pass_") & !d.source.id.includes("cycle_pas") ? d.valueLabel : ""; })
    .attr("text-anchor", "end")
    //.attr("text-anchor", function(d) { return d.source.id.includes('cycle') ?  "start" : "end" })

    // Add the link text
  svg.append("g").selectAll(".link")
  .data(links)
  .enter()
  .append("text")
  .attr('class', 'linkText')
  .attr("font-size", 13)
  .attr("x", function(d) { return d.source.id.includes('cycle') ? d.source.x1 + 30 : d.target.x1 - nodeWidth - 20; })
  .attr("y", function(d) { return (d.y1 + 15); })
  .attr("dy", "0.35em")
  .attr("text-anchor", "end")
  .attr("transform", null)
  .text(function(d) { 
    var cycl = 0;
    links.forEach((link) => {
      if (link.target.id === d.target.id + '_cycle' || link.target.id === d.target.id + '_cycle_pas') {
        cycl += link.value;
      }
    })
    return cycl !== 0 &!d.source.id.includes("col") & d.value !== 0 & !d.target.id.includes("pass") & !d.source.id.includes("pass_") & !d.source.id.includes("cycle_pas") ? '+ ' + cycl : ""; })
  .attr("text-anchor", "end")

  if (Tl) {
    svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-weight", "bold")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("font-size", (d) =>  (
        d.id.includes("col ") ? 17 : 15
      ))
      .attr("x", (d) => {
        if (d.id.includes("col ")) {
          return d.x0 < width / 2 ? d.x1 - nodeWidth + 1 : d.x0 - 6;
        } else {
          return d.x0 < width / 2 ? d.x1 - nodeWidth + 1 : d.x0 - 1;
        }
      }
        // d.x0 < width / 2 ? d.x1 - nodeWidth + 1 : d.x0 - 1
      )
      .attr("y", (d) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .text(({ index: i }) =>  {
        const tail = ([x,...xs]) => String(xs.join(" "));
        if (String(Tl[i]).includes("col") && !String(Tl[i]).includes("pas") && nodes[i].value > 0 && String(Tl[i]).includes("col ")) {
          if (String(Tl[i]).includes("🔁")) {
            return tail((String(Tl[i].replaceAll('_', ' ')).split(' '))).split("🔁")[0] + " 🔁";
          } else {
            return tail((String(Tl[i].replaceAll('_', ' ')).split(' ')));
          }
        } else {
          return "";
        }
        return String(Tl[i]).includes("col") ?  tail((String(Tl[i].replaceAll('_', ' ')).split(' '))): ""; // String(Tl[i]).replace("col", '') : tail((String(Tl[i]).split(' ')));
      });

      svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-weight", "bold")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("font-size", (d) => {
        var k = 0;
        d.sourceLinks.forEach(link => {
          if (typeof cycles[link.source.id] !== 'undefined') {
            k = 1;
          }
        });
        return k === 0 ? 16 : 10;
      })
      .attr("x", (d) => d.x0 < width / 2 ? d.x1 - nodeWidth + 10 : d.x0 + 10)
      .attr("y", (d) => (d.y1 + d.y0) / 2) //(d) => (d.y1 + d.y0) / 2 + 20)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .text(({ index: i }) => {
        var flag = false

            nodes.forEach((node) => {
              if (node.id === Tt[i].split(' ')[0] + ' ' + Tt[i].split(' ')[1].split('_')[0]) {
                flag = true
              }
            })

        if (!Tt[i].includes("col") & !Tt[i].includes("pass") & !flag & !Tt[i].includes("cycle_pas") & Tt[i].split('\n')[1] !== "0" && nodes[i].y1 - nodes[i].y0 >= 40) {
          if (typeof cycles[Tt[i].split('\n')[0]] !== 'undefined') {
            return 'uni. ' + nodeLabels[Tt[i].split('\n')[0]]
          } else {
            var val = 0
            links.forEach((link) => {
              if (Tl[i] + '_cycle' === link.target.id || Tl[i] + '_cycle_pas' === link.target.id || Tl[i] + '_cycle' === link.source.id || Tl[i] === link.target.id) {
                val += link.value
              }
            })
            if (val === nodeLabels[Tt[i].split('\n')[0]] || val === 0) {
              return nodeLabels[Tt[i].split('\n')[0]];
            } else {
              return val + ' (uni. ' + nodeLabels[Tt[i].split('\n')[0]] + ' )'
            }
          }
        } else {
          return ""
        }
      });

      svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-weight", "bold")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("font-size", 18)
      .attr("x", (d) => d.x0 < width / 2 ? d.x1 - nodeWidth - 10 : d.x0 - 10)
      .attr("y", (d) => (d.y1 + d.y0) / 2) //(d) => (d.y1 + d.y0) / 2 + 20)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text(({ index: i }) => {
        if (Tt[i].includes("place")) {
          if (Tt[i].includes(" item")) {
            if (Tt[i].includes("1.")) {
              return 'selected i.';
            } else {
              return 'items';
            }
          } else if (Tt[i].includes(" order")) {
            if (Tt[i].includes("1.")) {
              return 'selected o.';
            } else {
              return 'orders';
            }
          } else if (Tt[i].includes(" package")) {
            if (Tt[i].includes("1.")) {
              return 'selected p.';
            } else {
              return 'packages';
            }
          }
        }

        if (Tt[i].includes("create") && !Tt[i].includes("🔁")) {
          if (Tt[i].includes(" package")) {
            return 'packages';
          }
        }
      });

      svg
        .append("g")
        .attr("font-family", "sans-serif")
        .attr("font-weight", "bold")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .each(function (d, i) {
      const group = d3.select(this);

      if (!Tt[i].includes("col") && !Tt[i].includes("pass") && Tt[i].split("\n")[1] !== "0") {
        if (typeof cycles[Tt[i].split("\n")[0]] !== "undefined") {
        // Добавляем текст
        group
          .append("text")
          .attr("font-size", nodes[i].y1 - nodes[i].y0 >= 40 ? 14 : 11)
          .attr("x", d.x0 < width / 2 ? d.x1 - nodeWidth + 10 : d.x0 + 10) // Позиция текста по X
          .attr("y", d.y1 - d.y0 >= 40 ? (d.y1 + d.y0) / 2 - 15 : (d.y1 + d.y0) / 2) // Позиция текста по Y
          .attr("dy", "0.35em")
          .attr("text-anchor", "start")
          .text(() => {
            // var flag = false

            // nodes.forEach((node) => {
            //   if (node.id === Tt[i].split(' ')[0] + ' ' + Tt[i].split(' ')[1].split('_')[0]) {
            //     flag = true
            //   }
            // })

            if (!Tt[i].includes("col") && !Tt[i].includes("pass") &&
            Tt[i].split("\n")[1] !== "0") {
              if (typeof cycles[Tt[i].split("\n")[0]] !== "undefined") {
                if (nodes[i].y1 - nodes[i].y0 >= 40) {
                  return Object.entries(cycles[Tt[i].split('\n')[0]]).reduce((acc, [key, value]) => acc + key * value, 0);
                } else {
                  return Object.entries(cycles[Tt[i].split('\n')[0]]).reduce((acc, [key, value]) => acc + key * value, 0) + '  (uni. ' + nodeLabels[Tt[i].split('\n')[0]] + ')';
                }
              } else {
                return "";
              }
            }
          });
        
    
    // Добавляем "кнопку" рядом с текстом
    group
      .append("rect")
      .attr("x", d.x0 < width / 2 ? d.x1 - nodeWidth + 77 : d.x0 + 77) // Позиция кнопки рядом с текстом
      .attr("y", (d.y1 + d.y0) / 2 - 8) // Позиция кнопки по Y
      .attr("width", 18) // Ширина кнопки
      .attr("height", 16) // Высота кнопки
      .attr("fill", "white") // Цвет кнопки
      .attr("rx", 4) // Скругленные углы
      .style("cursor", "pointer") // Указатель "рука" при наведении
      .on("click", () => {
        window.openModal(`Detailed information about cycle: \n\n${d.id}`, Object.values(d.sourceLinks[0].cycle_1), items[d.id], eventlog);
      });

    // Добавляем иконку внутри кнопки (например, "+" или "↻")
    group
      .append("text")
      .attr("x", d.x0 < width / 2 ? d.x1 - nodeWidth + 87 : d.x0 + 87) // Позиция текста в кнопке
      .attr("y", (d.y1 + d.y0) / 2 + 6) // Центрируем текст в кнопке
      .attr("text-anchor", "middle")
      .attr("font-size", 22)
      .attr("fill", "black")
      .text("⟳")
      .style("pointer-events", "none"); // Чтобы текст не перекрывал событие клика на кнопку
      }
      }
    });
  }

  function intern(value) {
    return value !== null && typeof value === "object"
      ? value.valueOf()
      : value;
  }

  function getGradient(x1, x2, y1, y2) {
    var defs = svg.append("defs");

    var gradient = defs.append("linearGradient")
      .attr("id", "svgGradient")
      // .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      // .attr('class', 'end')
      .attr("offset", "40%")
      .attr("stop-color", blueColor)
      .attr("stop-opacity", 1);
      
    gradient.append("stop")
      // .attr('class', 'end')
      .attr("offset", "80%")
      .attr("stop-color", greenColor)
      .attr("stop-opacity", 1);
  }

  function customAlign(node) {
    const nodeName = node.id.split(" ")[0]; // Берём только первую часть (например, "reorder_item")
  
    let k = 0;
    for (const column of columns[0]) {
      if (nodeName === column) {
        node.depth = k;
        return k;
      }
      k += 1;
    }
  
    return node.depth;
  }
  
  Object.assign(svg.node(), { scales: { color } });

  window.sankey = { nodes, links };

  function createMiniMapWithLinks() {
    // 1. Получаем данные из глобальной переменной (которую мы сохранили ранее)
    const { nodes, links } = window.sankey || {};
    
    if (!nodes || !links) {
      console.warn("Данные для миниатюры не найдены");
      return;
    }
  
    // 2. Фильтрация данных
    const validNodes = nodes.filter(node => 
      node.id && 
      !node.id.toLowerCase().includes('col') &&
      typeof node.x0 === 'number'
    );
  
    const validLinks = links.filter(link => 
      link.source && 
      link.target &&
      !link.target.id.toLowerCase().includes('col') &&
      typeof link.source.x0 === 'number' &&
      typeof link.target.x0 === 'number'
    );
  
    if (validNodes.length === 0 || validLinks.length === 0) {
      console.warn("Недостаточно данных для миниатюры", {
        nodes: validNodes.length,
        links: validLinks.length
      });
      return;
    }

    // 3. Удаляем старую миниатюру
    d3.select(svgRef.current.parentNode)
      .selectAll('.mini-map-with-links')
      .remove();
  
    // 3. Создаем контейнер
    const miniMap = d3.select(svgRef.current.parentNode)
      .append('div')
      .attr('class', 'mini-map-with-links')
      .style('position', 'fixed')
      .style('left', '230px')
      .style('top', '-76px')
      .style('width', '400px')
      .style('height', '300px')
      .style('z-index', '999') // Ниже других элементов
      .style('pointer-events', 'auto'); // Пропускает клики сквозь миниатюру
  
    const miniSvg = miniMap.append('svg')
      .attr('width', '100%')
      .attr('height', '100%');
  
    // 4. Масштабирование
    const padding = 85;
    const xScale = d3.scaleLinear()
      .domain([d3.min(validNodes, d => d.x0), d3.max(validNodes, d => d.x1)])
      .range([padding, 400 - padding]);
  
    const yScale = d3.scaleLinear()
      .domain([d3.min(validNodes, d => d.y0), d3.max(validNodes, d => d.y1)])
      .range([padding, 300 - padding]);
  
    // 5. Отрисовка СВЯЗЕЙ ПЕРВЫМИ (чтобы узлы были сверху)
    miniSvg.selectAll('.mini-link')
      .data(validLinks)
      .join('path')
      .attr('class', 'mini-link')
      .attr('d', d => {
        const sourceY = (d.source.y0 + d.source.y1) / 2;
        const targetY = (d.target.y0 + d.target.y1) / 2;
        return d3.linkHorizontal()({
          source: [xScale(d.source.x0), yScale(sourceY)],
          target: [xScale(d.target.x0), yScale(targetY)]
        });
      })
      .attr('stroke', d => {
        if (d.source.id.includes('pass_')) {
          return 'none';
        } else {
          return '#999';
        }
      })
      .attr('stroke-width', 3)
      .attr('fill', d => {
        if (d.target.id.includes('pass_')) {
          return '#060b26';
        } else {
          return 'none';
        }
      });
  
    // 6. Отрисовка узлов
    const nodeRects = miniSvg.selectAll('.mini-node')
      .data(validNodes)
      .join('rect')
      .attr('class', 'mini-node')
      .attr('data-id', d => d.id)
      .attr('x', d => xScale(d.x0))
      .attr('y', d => yScale(d.y0))
      .attr('width', d => Math.max(3, xScale(d.x1) - xScale(d.x0)))
      .attr('height', d => Math.max(3, yScale(d.y1) - yScale(d.y0)))
      .attr('fill', d => {
        if (d.id.includes('pass_')) {
          return 'none';
        } else if (d.id.includes('🔁') && d.id.includes(' item')) {
          return d.id.includes('pas') ? lightRedColor.copy({opacity: 0.2}) : redCycleColor.copy({opacity: 1.2});
        } else if (d.id.includes('🔁') && d.id.includes(' order')) {
          return d.id.includes('pas') ? lightYellowColor.copy({opacity: 0.5}) : yellowCycleColor.copy({opacity: 1.2});
        } else if (d.id.includes('🔁') && d.id.includes(' package') && !d.id.includes('pass_')) {
          return d.id.includes('pas') ? lightGreyColor.copy({opacity: 0.1}) : d3.rgb(64, 64, 64).copy({opacity: 1.2});
        } else if (d.id.includes('item_pas')) {
          return lightRedColor.copy({opacity: 0.2});
        } else if (d.id.includes(' item')) {
          return redColor;
        }
        if (d.id.includes('order_pas')) {
          return lightYellowColor.copy({opacity: 0.2});
        } else if (d.id.includes(' order')) {
          return yellowColor;
        }
        if (d.id.includes('package_pas') && !d.id.includes('pass_')) {
          return lightGreyColor.copy({opacity: 0.1});
        } else if (d.id.includes(' package')) {
          return greyColor.copy({opacity: 1.2});;
        }
        return greyColor;
      })
      .attr('stroke', d => {
        if (d.id.includes('pass_')) {
          return '#060b26';
        } else if (d.id.includes('🔁') && !d.id.includes('pas')) {
          return cycleColor;
        } else {
          return '#333';
        }
      })
      .style("stroke-width", d => { return d.id.includes('🔁') && !d.id.includes('pas') ? 2 : 1}) // inner paddind node and links
      .on('click', (event, d) => {
        const mainSvgNode = svgRef.current.querySelector(`rect[data-id="${d.id}"]`);
        if (mainSvgNode) {
          const bbox = mainSvgNode.getBoundingClientRect();
          const scrollLeft = window.scrollX + bbox.left - 100; // -100 — небольшой отступ слева
          window.scrollTo({
            left: scrollLeft,
            top: window.scrollY,
            behavior: 'smooth'
          });
        } else {
          console.warn("Не найдена вершина на основной диаграмме:", d.id);
        }
      });

      nodeRects.filter(item => !item.id.includes('pas'))
      .on('mouseenter', (event, d) => {
        const mainNode = svgRef.current.querySelector(`rect[data-id="${d.id}"]`);
        if (mainNode) {
          mainNode.classList.add('highlighted');
        }

        // Подсветка в DFG-графе
        const dfgNode = document.querySelector(`.dfg-container g[data-id*="${d.id}"]`);
        if (dfgNode) {
          dfgNode.classList.add('highlighted-dfg');
        }
      })
      .on('mouseleave', (event, d) => {
        const mainNode = svgRef.current.querySelector(`rect[data-id="${d.id}"]`);
        if (mainNode) {
          mainNode.classList.remove('highlighted');
        }

        // Убрать подсветку в DFG-графе
        const dfgNode = document.querySelector(`.dfg-container g[data-id*="${d.id}"]`);
        if (dfgNode) {
          dfgNode.classList.remove('highlighted-dfg');
        }
      });
      
      nodeRects.append('title')
      .text(d => !d.id.includes('pas') ? d.id : '');
  }

  function createDFGGraph(dfgNodes, dfgLinks, svgRef) {
    // Очищаем контейнер
    d3.select(svgRef.current.parentNode).selectAll('.dfg-container').remove();
    
    // Создаём контейнер для графа
    const container = d3.select(svgRef.current.parentNode)
        .append('div')
        .attr('class', 'dfg-container')
        .style('position', 'fixed')
        .style('left', '0')
        .style('top', '0')
        .style('width', '18vw')
        .style('height', '101vh')
        .style('overflow', 'auto')
        .style('z-index', '999');
    
    // Добавляем заголовки групп перед графами
    const groupTitles = container.append('div')
        .attr('class', 'group-titles')
        .style('display', 'flex')
        .style('justify-content', 'space-around')
        .style('padding', '5px 0');

    // Получаем уникальные группы
    const groups = Array.from(new Set(dfgNodes.map(d => d.group)));

    // Добавляем заголовки для каждой группы
    groups.forEach(group => {
        groupTitles.append('div')
            .attr('class', `group-title ${group}`)
            .style('color', getColorForGroup(group))
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .text(group.toUpperCase());
    });

    // Добавляем SVG элемент для graphviz
    const svg = container.append('svg')
        .attr('width', '18vw')
        .style('min-width', '18vw')
        .attr('height', '101%');

    // Генерируем DOT-код с кластерами для каждого уровня
    let dot = 'digraph {\n';
    dot += '  bgcolor="#FAFAFA";\n';
    dot += '  rankdir=TB;\n';
    dot += '  ranksep=0.2;\n';
    dot += '  nodesep=0.1;\n';
    dot += '  node [shape=circle, style=filled, fontname="Arial", fontsize=10];\n';
    dot += '  edge [fontname="Arial", fontsize=8];\n';
    dot += '  compound=true;\n';
    dot += '  overlap=false;\n'; // Важно для предотвращения наложений
    dot += '  splines=true;\n';  // Используем кривые для связей

    // Настройки для петель
    dot += '  node [fixedsize=true];\n';
    dot += '  edge [dir=none];\n'; // Для петель

    // Группируем узлы по уровням (первая часть ID)
    const levelGroups = d3.group(dfgNodes, d => d.id.split('_').slice(0, -1).join('_'));
    
    // Создаём кластеры для каждого уровня
    levelGroups.forEach((nodes, levelName) => {
        dot += `  subgraph cluster_${levelName} {\n`;
        dot += '    style="rounded,filled";\n';
        dot += '    color=lightgray;\n';
        dot += '    fillcolor="#f0f0f0";\n';
        dot += '    margin=5;\n';
        dot += '    padding=0;\n';
        dot += `    label=<<b>${levelName.replaceAll('_', ' ')}</b>>;\n`;
        dot += '    fontsize=16;\n';
        dot += '    labelloc=t;\n';
        dot += '    penwidth=1;\n';
        dot += '    pencolor="#cccccc";\n';
        dot += '    rounded=true;\n';
        
        // Добавляем узлы в кластер
        nodes.forEach(node => {
            const color = getColorForGroup(node.group);
            dot += `    "${node.id}" [label="${node.weight}", width=0.8, height=0.8, fontsize=14, fillcolor="${color}"];\n`; // Увеличиваем базовый размер узлов
            //dot += `    "${node.id}" [label="${node.weight}", width=${0.4 + node.weight/10000}, height=${0.4 + node.weight/10000}, fillcolor="${color}"];\n`; // Увеличиваем базовый размер узлов
        });
        
        dot += '  }\n\n';
    });
    
    // Добавляем связи
    dfgLinks.forEach(link => {
        const sourceNode = dfgNodes.find(n => n.id === link.source);
        const targetNode = dfgNodes.find(n => n.id === link.target);
        const strokeColor = getColorForGroup(sourceNode.group);

        if (link.source === link.target) {
            // Настройки для петель
            dot += `  "${link.source}" -> "${link.target}" [
                label=" ${link.value} ", 
                penwidth=${4.3 + link.value/10000}, 
                fontsize=14,
                color="${strokeColor}",
                arrowhead=none,
                layer="under",
                constraint=false,
                loopangle=90,  // Угол петли
                minlen=4,      // Минимальная длина связи (увеличивает петли)
                dir=none
            ];\n`;
        } else {
            // Обычные связи
            dot += `  "${link.source}" -> "${link.target}" [
                label=" ${link.value} ", 
                fontsize=16,
                penwidth=${1.3 + link.value/10000}, 
                color="${strokeColor}",
                arrowhead=normal,  // Разные стили для разных групп
                arrowsize=0.7,             // Размер наконечника
                dir=forward
            ];\n`;
        }
    });
    
    dot += '}\n';
    
    // Инициализируем и рендерим граф
    const gv = graphviz(svg.node(), { useWorker: false })
        .width(Math.max(window.innerWidth * 0.18))
        .height(window.innerHeight)
        .zoom(false)
        .fit(true)
        .dot(dot)
        .render();
    
    function getColorForGroup(group) {
        const colors = {
            'item': redColor.formatHex(),
            'order': yellowColor.formatHex(), 
            'package': greyColor.formatHex()
        };
        return colors[group] || '#A5D6A7';
    }

    // Обработчики событий для узлов (остаётся без изменений)
    gv.on('end', () => {
        const allRects = svg.selectAll('g.node');
        allRects.each(function () {
            const nodeGroup = d3.select(this);
            const titleElement = nodeGroup.select('title');
            if (!titleElement.empty()) {
                const parts = titleElement.text().split('_');
                const last = parts.pop();
                const nodeId = parts.join('_') + ' ' + last;
                nodeGroup
                    .attr('data-id', nodeId)
                    .on('mouseenter', function () {
                        d3.selectAll(`rect[data-id='${nodeId}']`).classed('highlighted', true);
                    })
                    .on('mouseleave', function () {
                        d3.selectAll(`rect[data-id='${nodeId}']`).classed('highlighted', false);
                    })
                    .on('click', (event, d) => {
                        const mainSvgNode = svgRef.current.querySelector(`rect[data-id="${nodeId}"]`);
                        if (mainSvgNode) {
                            const bbox = mainSvgNode.getBoundingClientRect();
                            const scrollLeft = window.scrollX + bbox.left - 500;
                            window.scrollTo({
                                left: scrollLeft,
                                top: window.scrollY,
                                behavior: 'smooth'
                            });
                        }
                    });
            }
        });
    });    
}
  
  var dfgNodes = []
  var dfgLinks = []

  var event;
  links.forEach(link => {
    var groupId;
    if (link.source.id.includes(' item')) {
      groupId = 'item'
    } else if (link.source.id.includes(' order')) {
      groupId = 'order'
    } else {
      groupId = 'package'
    }

    if (!link.target.id.includes('col') && !link.target.id.includes('1.') && !link.target.id.includes('pas') && !link.source.id.includes('pas') && !link.target.id.includes('🔁') && !link.source.id.includes('🔁')) {
      if (link.cycle_1) {
        let sum = 0;
        for (const key in link.cycle_1) {
          sum += parseInt(key) * link.cycle_1[key];
        }
        dfgLinks.push({ source: link.source.id.split(' ')[0] + '_' + link.source.id.split(' ')[1], target: link.source.id.split(' ')[0] + '_' + link.source.id.split(' ')[1], value: sum });
        dfgLinks.push({ source: link.source.id.split(' ')[0] + '_' + link.source.id.split(' ')[1], target: link.target.id.split(' ')[0] + '_' + link.target.id.split(' ')[1], value: link.value })
      } else {
        dfgLinks.push({ source: link.source.id.split(' ')[0] + '_' + link.source.id.split(' ')[1], target: link.target.id.split(' ')[0] + '_' + link.target.id.split(' ')[1], value: link.value })
      }
      if (!dfgNodes.includes(link.source.id.split(' ')[0])) {
        dfgNodes.push({ id: link.source.id.split(' ')[0] + '_' + groupId, weight: link.source.value, group: groupId })
      }
      if (!dfgNodes.includes(link.target.id.split(' ')[0])) {
        dfgNodes.push({ id: link.target.id.split(' ')[0] + '_' + groupId, weight: link.target.value, group: groupId })
      }
    }
    if (!link.target.id.includes('col') && !link.target.id.includes('1.') && (link.target.id.includes('pas') || link.target.id.includes('🔁')) && !link.source.id.includes('pas') && !link.source.id.includes('🔁')) {
      event = link.source.id.split(' ')[0] + '_' + link.source.id.split(' ')[1];
    }
    if (!link.target.id.includes('col') && !link.target.id.includes('1.') && (link.source.id.includes('pas') || link.source.id.includes('🔁')) && !link.target.id.includes('pas') && !link.target.id.includes('🔁')) {
      if (event.split('_')[event.split('_').length - 1] === link.target.id.split(' ')[1]) {
        dfgLinks.push({ source: event, target: link.target.id.split(' ')[0] + '_' + link.target.id.split(' ')[1], value: link.value })
      }
    }
  });

  let isDFGVisible = false; // глобальная переменная-флаг

  function toggleDFGGraph() {
    const existing = document.querySelector('.dfg-container');
    if (existing) {
      existing.remove();
      isDFGVisible = false;
    } else {
      if (dfgNodes && dfgLinks) {
        createDFGGraph(dfgNodes, dfgLinks, svgRef);
      }
      isDFGVisible = true;
    }
  }

  const button = document.createElement('button');
  button.textContent = 'DFG';
  button.style.position = 'fixed';
  button.style.top = '10px';
  button.style.left = '18.5vw';
  button.style.zIndex = '1100';
  button.style.padding = '5px 5px';
  button.style.backgroundColor = '#eee';
  button.style.border = '1px solid #ccc';
  button.style.cursor = 'pointer';
  button.style.fontSize = '14px';

  button.addEventListener('click', () => {
    toggleDFGGraph();
  });
  document.body.appendChild(button);

  setTimeout(() => {
    createMiniMapWithLinks();
  }, 100);
}