import React from 'react';
import StockChartWithMACD from './stock-chart-dashboard';

function App() {
  return (
    <div className="App" style={{ padding: '20px' }}>
      <h1 style={{ color: 'blue' }}>Daily Trading Roadmap</h1>
      <p>If you can see this text, the React app is loading correctly.</p>
      <StockChartWithMACD />
    </div>
  );
}

export default App;