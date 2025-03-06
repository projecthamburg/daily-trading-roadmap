import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, ReferenceLine } from 'recharts';

// Define interfaces for data types
interface DataItem {
  date: string;
  close: number;
  backtestClose: number | null;
  isPointOfDivergence?: boolean;
  [key: string]: any; // Allow for additional properties
}

interface BollingerBand {
  middle: number | null;
  upper: number | null;
  lower: number | null;
}

const StockChartWithMACD = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const [showActualBands, setShowActualBands] = useState(true);
  const [showBacktestBands, setShowBacktestBands] = useState(true);
  
  useEffect(() => {
    // Parse the data from the table
    const rawData = `Date,Close,Backtest Close
Apr 4 2022,4582.64,4582.64
Apr 5 2022,4525.12,4525.12
Apr 6 2022,4481.15,4481.15
Apr 7 2022,4500.21,4500.21
Apr 8 2022,4488.28,4488.28
Apr 11 2022,4412.53,4412.53
Apr 12 2022,4397.45,4397.45
Apr 13 2022,4446.59,4446.59
Apr 14 2022,4392.59,4392.59
Apr 18 2022,4391.69,4391.69
Apr 19 2022,4462.21,4462.21
Apr 20 2022,4459.45,4459.45
Apr 21 2022,4393.66,4393.66
Apr 22 2022,4271.78,4271.78
Apr 25 2022,4296.12,4296.12
Apr 26 2022,4175.20,4175.20
Apr 27 2022,4183.96,4183.96
Apr 28 2022,4287.50,4287.50
Apr 29 2022,4131.93,4131.93
May 2 2022,4155.38,4155.38
May 3 2022,4175.48,4175.48
May 4 2022,4300.17,4300.17
May 5 2022,4146.87,4146.87
May 6 2022,4123.34,4123.34
May 9 2022,3991.24,3991.24
May 10 2022,4001.05,4001.05
May 11 2022,3935.18,3935.18
May 12 2022,3930.08,3930.08
May 13 2022,4023.89,4023.89
May 16 2022,4008.01,4008.01
May 17 2022,4088.85,4088.85
May 18 2022,3923.68,3949.17
May 19 2022,3900.79,3949.17
May 20 2022,3901.36,3994.07
May 23 2022,3973.75,3934.21
May 24 2022,3941.48,3949.17
May 25 2022,3978.73,3968.41
May 26 2022,4057.84,4000.48
May 27 2022,4158.24,3949.17
May 31 2022,4132.15,3906.41
Jun 1 2022,4101.23,3887.17
Jun 2 2022,4176.82,3870.07
Jun 3 2022,4108.54,3887.17
Jun 6 2022,4121.43,3874.34
Jun 7 2022,4160.68,3962.00
Jun 8 2022,4115.77,3934.21
Jun 9 2022,4017.82,3944.90
Jun 10 2022,3900.86,3942.76
Jun 13 2022,3749.63,3900.00
Jun 14 2022,3735.48,3857.24
Jun 15 2022,3789.99,3859.38
Jun 16 2022,3666.77,3855.10
Jun 17 2022,3674.84,3825.17
Jun 21 2022,3764.79,
Jun 22 2022,3759.89,
Jun 23 2022,3795.73,
Jun 24 2022,3911.74,
Jun 27 2022,3900.11,
Jun 28 2022,3821.55,
Jun 29 2022,3818.83,`;

    // Process the data
    const processedData = rawData.split('\n').slice(1).map((line, index) => {
      const [date, close, backtestClose] = line.split(',');
      // Mark the point of divergence (May 18, 2022) with isPointOfDivergence flag
      const isPointOfDivergence = date.includes("May 18");
      return {
        date,
        close: parseFloat(close),
        backtestClose: backtestClose ? parseFloat(backtestClose) : null,
        isPointOfDivergence
      };
    });

    // Calculate EMA for a specific period
    function calculateEMA(data: DataItem[], field: string, period: number): (number | null)[] {
      const k = 2 / (period + 1);
      const result: (number | null)[] = [];
      
      // Initialize with SMA for the first period points
      let sum = 0;
      let count = 0;
      
      for (let i = 0; i < period && i < data.length; i++) {
        if (data[i][field] !== null && data[i][field] !== undefined) {
          sum += data[i][field];
          count++;
        }
      }
      
      let ema = count > 0 ? sum / count : null;
      result.push(ema);
      
      // Calculate EMA for the rest
      for (let i = 1; i < data.length; i++) {
        if (data[i][field] !== null && data[i][field] !== undefined && ema !== null) {
          ema = data[i][field] * k + ema * (1 - k);
          result.push(ema);
        } else {
          result.push(null);
        }
      }
      
      return result;
    }

    // Calculate MACD
    function calculateMACD(data: DataItem[], field: string) {
      // Calculate short-term EMA (12 days)
      const ema12 = calculateEMA(data, field, 12);
      
      // Calculate long-term EMA (26 days)
      const ema26 = calculateEMA(data, field, 26);
      
      // Calculate MACD line (EMA12 - EMA26)
      const macdLine = ema12.map((value, i) => 
        value !== null && ema26[i] !== null ? value - (ema26[i] as number) : null
      );
      
      // Calculate signal line (9-day EMA of MACD line)
      const macdData = data.map((item, i) => ({
        ...item,
        macd: macdLine[i]
      }));
      
      const signalLine = calculateEMA(macdData, 'macd', 9);
      
      // Calculate histogram (MACD line - signal line)
      const histogram = macdLine.map((value, i) => 
        value !== null && signalLine[i] !== null ? value - (signalLine[i] as number) : null
      );
      
      return { macdLine, signalLine, histogram };
    }

    // Calculate Bollinger Bands for a dataset
    function calculateBollingerBands(data: DataItem[], field: string, period = 20, multiplier = 2): BollingerBand[] {
      const result: BollingerBand[] = [];
      
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          // Not enough data for the calculation
          result.push({
            middle: null,
            upper: null,
            lower: null
          });
          continue;
        }
        
        // Calculate SMA (Simple Moving Average)
        let sum = 0;
        let validPoints = 0;
        for (let j = i - period + 1; j <= i; j++) {
          if (data[j][field] !== null && data[j][field] !== undefined) {
            sum += data[j][field];
            validPoints++;
          }
        }
        
        if (validPoints === 0) {
          result.push({
            middle: null,
            upper: null,
            lower: null
          });
          continue;
        }
        
        const sma = sum / validPoints;
        
        // Calculate standard deviation
        let sumSquaredDiff = 0;
        for (let j = i - period + 1; j <= i; j++) {
          if (data[j][field] !== null && data[j][field] !== undefined) {
            const diff = data[j][field] - sma;
            sumSquaredDiff += diff * diff;
          }
        }
        
        const stdDev = Math.sqrt(sumSquaredDiff / validPoints);
        
        // Calculate Bollinger Bands
        result.push({
          middle: sma,
          upper: sma + (multiplier * stdDev),
          lower: sma - (multiplier * stdDev)
        });
      }
      
      return result;
    }

    // Calculate MACD for both series
    const { macdLine: closeMacd, signalLine: closeSignal, histogram: closeHistogram } = 
      calculateMACD(processedData, 'close');
    
    const { macdLine: backtestMacd, signalLine: backtestSignal, histogram: backtestHistogram } = 
      calculateMACD(processedData, 'backtestClose');
    
    // Calculate Bollinger Bands for both series
    const backtestBollingerBands = calculateBollingerBands(processedData, 'backtestClose');
    const actualBollingerBands = calculateBollingerBands(processedData, 'close');

    // Calculate RSI (14-period) for both series
    function calculateRSI(data: DataItem[], field: string, period = 14): (number | null)[] {
      const rsiValues: (number | null)[] = [];
      
      // Need at least period+1 data points to calculate first RSI
      for (let i = 0; i < data.length; i++) {
        if (i < period) {
          // Not enough prior data for RSI calculation
          rsiValues.push(null);
          continue;
        }
        
        let gains = 0;
        let losses = 0;
        
        // Calculate average gains and losses over the period
        for (let j = i - period + 1; j <= i; j++) {
          const current = data[j][field];
          const previous = data[j-1][field];
          
          if (current === null || previous === null) {
            continue;
          }
          
          const change = current - previous;
          if (change > 0) {
            gains += change;
          } else {
            losses += Math.abs(change);
          }
        }
        
        // Average gains and losses
        const avgGain = gains / period;
        const avgLoss = losses / period;
        
        // Calculate RS and RSI
        if (avgLoss === 0) {
          rsiValues.push(100); // No losses means RSI = 100
        } else {
          const rs = avgGain / avgLoss;
          const rsi = 100 - (100 / (1 + rs));
          rsiValues.push(rsi);
        }
      }
      
      return rsiValues;
    }
    
    const closeRSI = calculateRSI(processedData, 'close');
    const backtestRSI = calculateRSI(processedData, 'backtestClose');
    
    // Combine all data
    const enrichedData = processedData.map((item, i) => ({
      ...item,
      closeMacd: closeMacd[i],
      closeSignal: closeSignal[i],
      closeHistogram: closeHistogram[i],
      closeRSI: closeRSI[i],
      actualBBMiddle: actualBollingerBands[i] ? actualBollingerBands[i].middle : null,
      actualBBUpper: actualBollingerBands[i] ? actualBollingerBands[i].upper : null,
      actualBBLower: actualBollingerBands[i] ? actualBollingerBands[i].lower : null,
      backtestMacd: backtestMacd[i],
      backtestSignal: backtestSignal[i],
      backtestHistogram: backtestHistogram[i],
      backtestRSI: backtestRSI[i],
      backtestBBMiddle: backtestBollingerBands[i] ? backtestBollingerBands[i].middle : null,
      backtestBBUpper: backtestBollingerBands[i] ? backtestBollingerBands[i].upper : null,
      backtestBBLower: backtestBollingerBands[i] ? backtestBollingerBands[i].lower : null
    }));

    setData(enrichedData);
  }, []);

  // Format date for tooltip
  const formatDate = (value: string): string => value;
  
  // Helper function to determine bar color
  const getBarColor = (entry: any, key: string): string => {
    if (!entry || entry[key] === null || entry[key] === undefined) return "#999";
    return entry[key] > 0 ? "#00AA00" : "#DD0000";
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">S&P 500: Actual Close vs Backtest Close (April-June 2022)</h2>
      
      {/* Bollinger Bands Controls */}
      <div className="flex flex-row gap-6 mb-4">
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="actualBands" 
            className="mr-2" 
            checked={showActualBands} 
            onChange={() => setShowActualBands(!showActualBands)}
          />
          <label htmlFor="actualBands" className="text-sm font-medium">Actual Bollinger Bands</label>
        </div>
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="backtestBands" 
            className="mr-2" 
            checked={showBacktestBands} 
            onChange={() => setShowBacktestBands(!showBacktestBands)}
          />
          <label htmlFor="backtestBands" className="text-sm font-medium">Backtest Bollinger Bands</label>
        </div>
      </div>
      
      {/* Main Price Chart */}
      <div className="mb-8">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={5}
              tickFormatter={(value) => {
                const parts = value.split(' ');
                return parts.length > 1 ? `${parts[0]} ${parts[1]}` : value;
              }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value) => value ? value.toFixed(2) : 'N/A'}
              labelFormatter={formatDate}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#000000" 
              strokeWidth={2}
              name="Actual Close" 
              dot={(props) => {
                if (props.payload && props.payload.isPointOfDivergence) {
                  return <circle cx={props.cx} cy={props.cy} r={6} fill="red" stroke="none" />;
                }
                return <circle cx={props.cx} cy={props.cy} r={1} fill={props.stroke} stroke="none" />;
              }}
              activeDot={{ r: 5 }}
            />
            {showActualBands && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="actualBBMiddle" 
                  stroke="#888888" 
                  name="Actual BB Middle" 
                  dot={false}
                  strokeWidth={1}
                />
                <Line 
                  type="monotone" 
                  dataKey="actualBBUpper" 
                  stroke="#9370DB" 
                  name="Actual BB Upper" 
                  dot={false}
                  strokeWidth={1}
                />
                <Line 
                  type="monotone" 
                  dataKey="actualBBLower" 
                  stroke="#9370DB" 
                  name="Actual BB Lower" 
                  dot={false}
                  strokeWidth={1}
                />
              </>
            )}
            <Line 
              type="monotone" 
              dataKey="backtestClose" 
              stroke="#006400" 
              name="Backtest Close" 
              dot={{ r: 1 }} 
              activeDot={{ r: 5 }}
              strokeDasharray="5 5"
            />
            {showBacktestBands && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="backtestBBMiddle" 
                  stroke="#888888" 
                  name="BB Middle (20 SMA)" 
                  dot={false}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <Line 
                  type="monotone" 
                  dataKey="backtestBBUpper" 
                  stroke="#9900FF" 
                  name="BB Upper" 
                  dot={false}
                  strokeWidth={1}
                />
                <Line 
                  type="monotone" 
                  dataKey="backtestBBLower" 
                  stroke="#9900FF" 
                  name="BB Lower" 
                  dot={false}
                  strokeWidth={1}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* MACD for Actual Close */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">MACD - Actual Close</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={5}
              tickFormatter={(value) => {
                const parts = value.split(' ');
                return parts.length > 1 ? `${parts[0]} ${parts[1]}` : value;
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value) => value !== null && value !== undefined ? value.toFixed(2) : 'N/A'}
              labelFormatter={formatDate}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#888888" />
            <Bar 
              dataKey="closeHistogram" 
              fill={(entry) => getBarColor(entry, 'closeHistogram')}
              name="Histogram" 
            />
            <Line 
              type="monotone" 
              dataKey="closeMacd" 
              stroke="#0000FF" 
              name="MACD" 
              dot={false}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="closeSignal" 
              stroke="#FF6600" 
              name="Signal"
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* MACD for Backtest Close */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">MACD - Backtest Close</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={5}
              tickFormatter={(value) => {
                const parts = value.split(' ');
                return parts.length > 1 ? `${parts[0]} ${parts[1]}` : value;
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value) => value !== null && value !== undefined ? value.toFixed(2) : 'N/A'}
              labelFormatter={formatDate}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#888888" />
            <Bar 
              dataKey="backtestHistogram" 
              fill={(entry) => getBarColor(entry, 'backtestHistogram')}
              name="Histogram" 
            />
            <Line 
              type="monotone" 
              dataKey="backtestMacd" 
              stroke="#0000FF" 
              name="MACD" 
              dot={false}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="backtestSignal" 
              stroke="#FF6600" 
              name="Signal"
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* RSI for Actual Close */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">RSI (14) - Actual Close</h3>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={5}
              tickFormatter={(value) => {
                const parts = value.split(' ');
                return parts.length > 1 ? `${parts[0]} ${parts[1]}` : value;
              }}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              ticks={[0, 30, 50, 70, 100]}
            />
            <Tooltip 
              formatter={(value) => value !== null && value !== undefined ? value.toFixed(2) : 'N/A'}
              labelFormatter={formatDate}
            />
            <Legend />
            <ReferenceLine y={70} stroke="#FF0000" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="#00AA00" strokeDasharray="3 3" />
            <ReferenceLine y={50} stroke="#888888" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="closeRSI" 
              stroke="#8884d8" 
              name="RSI" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* RSI for Backtest Close */}
      <div>
        <h3 className="text-lg font-bold mb-2">RSI (14) - Backtest Close</h3>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={5}
              tickFormatter={(value) => {
                const parts = value.split(' ');
                return parts.length > 1 ? `${parts[0]} ${parts[1]}` : value;
              }}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              ticks={[0, 30, 50, 70, 100]}
            />
            <Tooltip 
              formatter={(value) => value !== null && value !== undefined ? value.toFixed(2) : 'N/A'}
              labelFormatter={formatDate}
            />
            <Legend />
            <ReferenceLine y={70} stroke="#FF0000" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="#00AA00" strokeDasharray="3 3" />
            <ReferenceLine y={50} stroke="#888888" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="backtestRSI" 
              stroke="#8884d8" 
              name="RSI" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChartWithMACD;