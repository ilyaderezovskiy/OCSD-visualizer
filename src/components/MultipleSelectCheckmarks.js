import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CSVDataTable from '../CSVDataTable';
import Papa from "papaparse";

export default function MultipleSelectCheckmarks(type, multiple) {
  const [personName, setPersonName] = React.useState([]);

  var products = [];
  var orders = [];
  var packages = [];
  var names = [];
  var items = [];

  // Загрузка параметров фильтрации 
  try {
    //products = type.data.map(function(item){return item.item;}).filter((item, i, ar) => ar.indexOf(item) === i);
    orders = type.data
      .map(item => item.order)
      .filter(order => order !== null && order !== undefined)
      .filter((item, i, ar) => ar.indexOf(item) === i);

    packages = type.data
      .map(item => item.package)
      .filter(package_ => package_ !== null && package_ !== undefined)
      .filter((item, i, ar) => ar.indexOf(item) === i);

    products = type.data.map(function(item){return item.item;}).filter((item, i, ar) => ar.indexOf(item) === i && !orders.includes(item) && !packages.includes(item));
    
    items = type.data;
  } catch {

  }

  // Выбор активного фильтра
  if (type.type === 'item') {
    names = products;
  } else if (type.type === 'order') {
    names = orders;
  } else if (type.type === 'package') {
    names = packages;
  } else {
    names = items;
  }

  // Отображение информации при отсутствии параметра для фильтрации
  if (names.length === 1) {
    names = [];
    return (
      <div>
        <Typography variant="caption" color="#ff0000" p="15px">
          The specified parameter is missing
        </Typography>
      </div>
    )
  }

  return (
    <div>
      <FormControl sx={{ ml: 3, mb: 5, width: 300 }} size='small'>
        <Autocomplete
          multiple={type.format === 'cycle' ? false : true}
          limitTags={1}
          id="fixed-tags-demo"
          value={personName}
          onChange={(event, newValue) => {
            setPersonName(newValue);
            if (type.type === 'item') {
              localStorage.setItem(type.type, newValue);
              localStorage.setItem('order', '');
              localStorage.setItem('package', '');
            } else if (type.type === 'order') {
              localStorage.setItem(type.type, newValue);
              localStorage.setItem('item', '');
              localStorage.setItem('package', '');
            } else if (type.type === 'package') {
              localStorage.setItem(type.type, newValue);
              localStorage.setItem('order', '');
              localStorage.setItem('item', '');
            }
          }}
          options={names}
          getOptionLabel={(option) => option.toString()}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                label={option}
                {...getTagProps({ index })}
              />
            ))
          }
          style={{backgroundColor: "#ffff"}} 
          renderInput={(params) => (
            <TextField {...params} label="Select" variant="outlined" />
          )}
        />
      </FormControl>
      {type.format === 'cycle' && (
        <CSVDataTable data={type.data !== undefined && type.data !== '' ? type.data
          .filter(item => [+personName].includes(item.item)) // Оставляем только нужные item_id
          .sort((a, b) => a.item - b.item) : []} />
      )}
      {/* <CSVDataTable data={type.data !== undefined && type.data !== '' && type.format === 'cycle' ? type.data
        .filter(item => [+personName].includes(item.item)) // Оставляем только нужные item_id
        .sort((a, b) => a.item - b.item) : []} /> */}
    </div>
  );
}
