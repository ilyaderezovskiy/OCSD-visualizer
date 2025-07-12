import React from 'react'
import { useState, useEffect } from "react";
import '../App.css';

import Container from "@mui/material/Container";
import Typography from '@mui/material/Typography';
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";

import LoadSankeyData from "../LoadSankeyData";
import CallSankey from '../CallSankey';
import ModalPage from '../components/ModalPage/ModalPage';
import CSVDataTable from '../CSVDataTable';

import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import { Link } from 'react-router-dom';
import '../components/Navbar.css';
import { IconContext } from 'react-icons';
import Button from '@mui/material/Button';

import MultipleSelectCheckmarks from '../components/MultipleSelectCheckmarks';
import Papa from "papaparse";

var energy = [];
var vertices = [];

var tableData = <CSVDataTable data={""} />;
var selectedEventLogID;

const uniqueArray = (objects, uniqueBy, keepFirst = true) => {
  return Array.from(
    objects.reduce((map, e) => {
      let key = uniqueBy.map(key => [e[key], typeof e[key]]).flat().join('-')
      if (keepFirst && map.has(key)) return map
      return map.set(key, e)
    }, new Map()).values()
  )
}

localStorage.setItem('group', 0);
localStorage.setItem('group1', '');
localStorage.setItem('group2', '');
localStorage.setItem('item', []);
localStorage.setItem('order', []);
localStorage.setItem('package', []);

var relatedPackages = [];
var relatedItems = [];
var relatedOrders = [];
var selectedStudents = [];
var selectedLectors = [];
var selectedGroups = [];

function VisualizationPage() {

  const [sidebar, setSidebar] = useState(false);

  const showSidebar = () => setSidebar(!sidebar);

  const [completeData, loadData] = useState([]);

  const [filteredData, filterData] = useState([]);
  
  const [minMax, setMinMax] = useState([]);
  
  const [value1, setValue1] = useState([]);

  const [minMaxNode, setMinMaxNode] = useState([]);

  const [nodes, setNodes] = useState([]);
  
  const [value1Node, setValue1Node] = useState([]);

  const [modalPageActive, setModalPageActive] = useState(false);
  
  const [modalPageActive2, setModalPageActive2] = useState(false);

  const [showWelcome, setShowWelcome] = useState(true);

  const [eventLogs, setEventLogs] = useState([]);
  const [verticesOrder, setVerticesOrder] = useState([]);
  const [activeEventLog, setActiveEventLog] = useState([]);

    const handleStart = async () => {
      try {
        const [newEventLog, newVertices] = await Promise.all([
          getEventLog('/OCSD-visualizer/data/items10.csv', 'example 1'),
          parseVertices('/OCSD-visualizer/data/vertices.csv', 'example 1v')
        ]);
      
        setShowWelcome(false);

        setActiveEventLog(newEventLog);
        energy = newEventLog;
        vertices = newVertices;
        localStorage.setItem('group1', '');
        localStorage.setItem('group2', '');
        localStorage.setItem('item', []);
        localStorage.setItem('order', []);
        localStorage.setItem('package', []);
        selectedStudents = []
        relatedItems = []
        selectedLectors = []
        selectedGroups = []
        relatedOrders = []
        relatedPackages = []
            
        filterData(getFilterData());
        LoadSankeyData(loadData, filterData, setMinMax, setValue1, setMinMaxNode, setValue1Node, setNodes, energy, vertices);
      } catch (err) {
        console.error("Ошибка при чтении CSV:", err);
      }
    }

    async function getEventLog(event, name) {
      return new Promise((resolve, reject) => {
        Papa.parse(event, {
          download: true,
          header: true,
          dynamicTyping: true,
          complete: function(results) {    
  
            const newEventLog = {
              id: '1',
              name: name,
              data: results.data
            };
            setEventLogs([...eventLogs, newEventLog]);
            resolve(newEventLog);

            //Сохранение жс
            // if (!localStorage.getItem('eventlogs')) {
            //   localStorage.setItem('eventlogs', JSON.stringify([newEventLog]))
            // } else {
            //   localStorage.setItem('eventlogs', JSON.stringify([...JSON.parse(localStorage.getItem('eventlogs')), newEventLog]))
            // }
          },
          error: function(error) {
            console.error("CSV parse error:", error);
            reject(error); // Отклоняем Promise при ошибке
          }
        });
      })
    }

    async function parseVertices(event, name) {
      var vertices_ = [];
      return new Promise((resolve, reject) => {
        Papa.parse(event, {
          download: true,
          header: false,
          dynamicTyping: true,
          complete: (results) => {

            var columns = results.data.map(function(item){return item;});
            for (let i = 0; i < Object.keys(columns[0]).length - 1; i++) {
              vertices_.push({'source': 'col ' + columns[0][i], 'target': 'col ' + columns[0][i+1], 'value': localStorage.getItem('maxEl'), 'valueLabel': localStorage.getItem('maxEl')});
            }
            for (let i = 1; i < Object.keys(columns).length; i++) {
              for (let j = 0; j < Object.keys(columns[i]).length - 1; j++) {
                //if (columns[i][j] !== null && columns[i][j+1] !== null) {
                  vertices_.push({'source': `col${j+1} ` + columns[i][j], 'target': `col${j+2} ` + columns[i][j+1], 'value': localStorage.getItem('maxEl') / 1.5, 'valueLabel': localStorage.getItem('maxEl') / 1.5});
                //}
              }
            }

            var newVertices = {}
            newVertices['id'] = '1v';
            newVertices['name'] = name;
            newVertices['data'] = vertices_;
            newVertices['resultData'] = results;
            setVerticesOrder([...verticesOrder, newVertices]);
            resolve(newVertices);

            return newVertices;
          }
        });
      })
    }

    function isEmpty(obj) {
      for(var prop in obj) {
          if(obj.hasOwnProperty(prop))
              return false;
      }
      return true;
    }

    function getFilterData() {
      selectedStudents = []
      relatedItems = []
      selectedLectors = []
      selectedGroups = []
      relatedOrders = []
      relatedPackages = []
      var data = energy.data.map(object => ({ ...object }))
      var el = [];

      if (!isEmpty(vertices)) {
        vertices.data.forEach(element => {
          el.push(element);
        });
      }

      selectedStudents = localStorage.getItem('item') === '' ? [] : localStorage.getItem('item').split(',');
      selectedLectors = localStorage.getItem('order') === '' ? [] : localStorage.getItem('order').split(',');
      selectedGroups = localStorage.getItem('package') === '' ? [] : localStorage.getItem('package').split(',');

      if (selectedStudents.length > 0 && selectedLectors.length === 0 && selectedGroups.length === 0) {
        relatedOrders = []
        relatedPackages = []
        Array.prototype.forEach.call(data, element => {
          if (selectedStudents.includes(String(element.item))) {
            element.source = '1.' + element.source;
            element.target = '1.' + element.target;
            if (!relatedOrders.includes(String(element.order))) {
              relatedOrders.push(String(element.order))
            }
            if (!relatedPackages.includes(String(element.package))) {
              relatedPackages.push(String(element.package))
            }
          }
        });
        Array.prototype.forEach.call(data, element => {
          if (relatedOrders.includes(String(element.item))) {
            element.source = '1.' + element.source;
            element.target = '1.' + element.target;
          }
          if (relatedPackages.includes(String(element.item))) {
            element.source = '1.' + element.source;
            element.target = '1.' + element.target;
          }
        });
      } else if (selectedStudents.length === 0  && selectedLectors.length > 0 && selectedGroups.length === 0) {
        relatedItems = []
        relatedPackages = []
        Array.prototype.forEach.call(data, element => {
          if (selectedLectors.includes(String(element.item))) {
            element.source = '1.' + element.source;
            element.target = '1.' + element.target;
          }
          if (selectedLectors.includes(String(element.order)) && !relatedItems.includes(String(element.item))) {
            relatedItems.push(String(element.item))
          }
          if (selectedLectors.includes(String(element.order)) && !relatedPackages.includes(String(element.package))) {
            relatedPackages.push(String(element.package))
          }
        });
        Array.prototype.forEach.call(data, element => {
          if (relatedItems.includes(String(element.item))) {
            element.source = '1.' + element.source;
            element.target = '1.' + element.target;
          }
          if (relatedPackages.includes(String(element.item))) {
            element.source = '1.' + element.source;
            element.target = '1.' + element.target;
          }
        });
      } else if (selectedStudents.length === 0  && selectedLectors.length === 0 && selectedGroups.length > 0) {
        relatedItems = []
        relatedOrders = []
        Array.prototype.forEach.call(data, element => {
          if (selectedGroups.includes(String(element.item))) {
            element.source = '1.' + element.source;
            element.target = '1.' + element.target;
          }
          if (selectedGroups.includes(String(element.package)) && !relatedItems.includes(String(element.item))) {
            relatedItems.push(String(element.item))
          }
          if (selectedGroups.includes(String(element.package)) && !relatedOrders.includes(String(element.order))) {
            relatedOrders.push(String(element.order))
          }
        });
        Array.prototype.forEach.call(data, element => {
          if (relatedItems.includes(String(element.item))) {
            element.source = '1.' + element.source;
            element.target = '1.' + element.target;
          }
          if (relatedOrders.includes(String(element.item))) {
            element.source = '1.' + element.source;
            element.target = '1.' + element.target;
          }
        });
      }

      var data2 = data.map(function(item){return {'source': item.source, 'target': item.target, 'cycle_1': item.cycle_1};});
      var uniqueData = uniqueArray(data2, ['source', 'target'], true);

      Array.prototype.forEach.call(uniqueData, element => {
        var value = 0;
        Array.prototype.forEach.call(data2, element2 => {
          if (element2.source === element.source && element2.target === element.target) {
            value += 1;
          }
        });
        if (typeof element.source !== 'undefined' && typeof element.target !== 'undefined') {
          el.push({'source': element.source, 'target': element.target, 'value': value, 'valueLabel': value, 'cost': element.cost, 'itemsNum': element.itemsNum})
        }
      });
    
      return el;
    }

    const refresh = () => {
      localStorage.setItem('group1', '');
      localStorage.setItem('group2', '');
      localStorage.setItem('item', []);
      localStorage.setItem('order', []);
      localStorage.setItem('package', []);
      selectedStudents = []
      relatedItems = []
      selectedLectors = []
      selectedGroups = []
      relatedOrders = []
      relatedPackages = []
      handleStart()
    }
  
    //LoadSankeyData(loadData, filterData, setMinMax, setValue1, setMinMaxNode, setValue1Node, setNodes, energy, vertices);

    useEffect(() => {
      filterData(
        completeData.filter((d) => d.value % 1 !== 0 || (d.value >= value1[0] && d.value <= value1[1]
          && nodes[d.target] >= value1Node[0]
          && nodes[d.target] <= value1Node[1]
          && nodes[d.source] >= value1Node[0]
          && nodes[d.source] <= value1Node[1])),
      );
    }, [value1, value1Node, completeData]);

    function handleMousePos(event) {
      if(event.clientX < 1089){
        if(sidebar) {
          showSidebar()
        }
      }
    }

    document.addEventListener("click", handleMousePos);

  return (
    <div>
        <IconContext.Provider value={{ color: '#fff' }}>
        <div className='navbar'>
          <div container className='home-bars'>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleStart}
              sx={{
                py: 1,
                px: 3,
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Start
            </Button>
          </div>

          <Link to='#' id='open' className='menu-bars'>
            <FaIcons.FaBars onClick={showSidebar} />
          </Link>
        </div>
        <div id="nav">
        <nav className={sidebar ? 'nav-menu active' : 'nav-menu'}>
          <ul className='nav-menu-items' >
            <li className='navbar-toggle'>
              <Link to='#' className='menu-bars'>
                <AiIcons.AiOutlineClose onClick={showSidebar} />
              </Link>
            </li>
        <Box sx={{ marginTop: 1, marginBottom: 2 }}>
          <Typography variant="h8" color="#fff" p="15px">
            Select objects of only one type!
          </Typography>
        </Box>
        <Box sx={{ marginTop: 1, marginBottom: 2 }}>
          <Typography variant="h8" color="#fff" p="15px">
            Select item
          </Typography>
        </Box>
        <MultipleSelectCheckmarks type="item" data={energy.data} />
        <Box sx={{ marginTop: -2, marginBottom: 2 }}>
          <Typography variant="h8" color="#fff" p="15px">
            Select order
          </Typography>
        </Box>
        <MultipleSelectCheckmarks type="order" data={energy.data} />
        <Box sx={{ marginTop: -2, marginBottom: 2 }}>
          <Typography variant="h8" color="#fff" p="15px">
              Select package
          </Typography>
        </Box>
        <MultipleSelectCheckmarks type="package" data={energy.data} />

        <Box sx={{ mt: -2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h8" p="15px" color="#fff">
              Selected objects:
          </Typography>
          <Typography 
            variant="body1"
            p="15px" 
            color="#fff"
            sx={{ 
              wordWrap: 'break-word',  // переносит длинные слова
              whiteSpace: 'pre-wrap',  // сохраняет пробелы, но переносит текст
            }}
          >
            {selectedStudents.length > 0 || relatedItems.length > 0 ? 'Items: ' + selectedStudents + ' ' + relatedItems : ''}
          </Typography>
          <Typography 
            variant="body1"
            p="15px" 
            color="#fff"
            sx={{ 
              wordWrap: 'break-word',  // переносит длинные слова
              whiteSpace: 'pre-wrap',  // сохраняет пробелы, но переносит текст
            }}
          >
            {selectedLectors.length > 0 || relatedOrders.length > 0 ? 'Orders: ' + selectedLectors + ' ' + relatedOrders : ''}
          </Typography>
          <Typography 
            variant="body1"
            p="15px" 
            color="#fff"
            sx={{ 
              wordWrap: 'break-word',  // переносит длинные слова
              whiteSpace: 'pre-wrap',  // сохраняет пробелы, но переносит текст
            }}
          >
            {selectedGroups.length > 0 || relatedPackages.length > 0 ? 'Packages: ' + selectedGroups + ' ' + relatedPackages : ''}
          </Typography>
        </Box>


        <li className='reload-button' color="white">
          <Link to='#' className='reload-button'>
            <AiIcons.AiOutlineReload onClick={refresh} />
          </Link>

          <Box sx={{ right: 15, position: sidebar ? 'fixed' : '', bottom: 15 }}>
            <Button variant="contained" onClick={() => {
              if (energy.length !== 0 && verticesOrder.find(x => x.id === energy.id + 'v')) {
                filterData(getFilterData());
                //showSidebar();
              }}}>Apply filters</Button>
          </Box>
        </li>
          </ul>
        </nav>
        </div>

      </IconContext.Provider>

      {showWelcome && (
          <Box 
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="h4" 
            sx={{
              fontWeight: 'bold',
              color: '#1976d2',
              mb: 2
            }}
          >
            Object-Centric Sankey Diagram (Demo)
          </Typography>
          <Typography 
            variant="body1"
            sx={{
              color: '#666',
              fontSize: '1.2rem'
            }}
          >
            Try an interactive demo of our visualization tool for object-centric process models. Using sample data from an online shopping process, you can explore how the modified Sankey diagram represents relationships between events and different types of objects, as well as between individual objects. The visualization also correctly displays cycles and complex flows in object-centric data.
          </Typography>
          <Typography 
            variant="body1"
            sx={{
              color: '#666',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              mt: 4
            }}
          >
            Columns represent events.
          </Typography>
          <Typography 
            variant="body1"
            sx={{
              color: '#666',
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            Flows represent the movement of objects (the number of objects).
          </Typography>
          <Typography 
            variant="body1"
            sx={{
              color: '#666',
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            Vertices represent the number of times objects have passed through the event.
          </Typography>
          </Box>
        )}
        <Container maxWidth="xl">
          <Box sx={{ flexGrow: 1, mb: 5, mt: 13 }}>
          </Box>
          <Box sx={{ flexGrow: 1, height: "100%", width: "100%", ml: 30}}>
        <Grid item xs={12} spacing={3} marginTop={4}>
          {filteredData.length > 0 && <CallSankey data={filteredData} vertices={vertices} eventlog={eventLogs[0].data ? eventLogs[0].data : ''} />}
        </Grid>
      </Box>
    </Container>

    <ModalPage active={modalPageActive2} setActive={setModalPageActive2} data={'hello'} />
    <ModalPage active={modalPageActive} setActive={setModalPageActive} data={tableData} />

    </div>
    
  )
}

export default VisualizationPage
