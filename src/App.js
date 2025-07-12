import React from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import VisualizationPage from "./pages/VisualizationPage";
import ModalPage from './components/ModalPage/ModalPage';

export default function App() {
  const [modalActive, setModalActive] = React.useState(false);
  const [modalData, setModalData] = React.useState("");
  const [chartData, setModalChartData] = React.useState("");
  const [items, setModalItems] = React.useState("");
  const [eventlog, setModalEventlog] = React.useState("");

  // Глобальная функция для открытия модального окна
  window.openModal = (data, chartData, items, eventlog) => {
    setModalData(data);
    setModalChartData(chartData);
    setModalItems(items);
    setModalEventlog(eventlog);
    setModalActive(true);
  };

  window.closeModal = () => {
    setModalActive(false);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<VisualizationPage />} />
      </Routes>

      <ModalPage
        active={modalActive}
        setActive={setModalActive}
        data={modalData}
        barChartData={chartData}
        items={items}
        eventlog={eventlog}
      />
    </>
  );
}
