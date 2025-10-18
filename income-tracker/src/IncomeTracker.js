import React, { useState, useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const IncomeTracker = () => {
    const [incomeData, setIncomeData] = useState([]);
    const [currentValue, setCurrentValue] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [fullscreenChart, setFullscreenChart] = useState(null);
    const chartRefs = {
        chart1: useRef(null),
        chart2: useRef(null),
        chart3: useRef(null)
    };

    // Load data from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('incomeData');
        const savedTheme = localStorage.getItem('theme');

        if (savedData) {
            setIncomeData(JSON.parse(savedData));
        }

        if (savedTheme === 'dark') {
            setDarkMode(true);
        }
    }, []);

    // Save data to localStorage whenever it changes
    useEffect(() => {
        if (incomeData.length > 0) {
            localStorage.setItem('incomeData', JSON.stringify(incomeData));
        }
    }, [incomeData]);

    // Save theme preference
    useEffect(() => {
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const addIncome = () => {
        const value = parseFloat(currentValue);

        if (isNaN(value)) {
            showNotification('Please enter a valid number', 'error');
            return;
        }

        let difference = 0;
        if (incomeData.length > 0) {
            const lastEntry = incomeData[incomeData.length - 1];
            difference = value - lastEntry.value;
        }

        const newEntry = {
            id: incomeData.length + 1,
            value: value,
            difference: difference,
            timestamp: new Date().toISOString()
        };

        setIncomeData([...incomeData, newEntry]);
        setCurrentValue('');
        showNotification(`Entry added! Difference: ${difference >= 0 ? '+' : ''}${difference.toFixed(12)}`);
    };

    const clearData = () => {
        if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            setIncomeData([]);
            localStorage.removeItem('incomeData');
            showNotification('All data cleared successfully!');
        }
    };

    const saveCSV = () => {
        if (incomeData.length === 0) {
            showNotification('No data to export', 'error');
            return;
        }

        let csv = 'ID,Value,Difference,Timestamp\n';
        incomeData.forEach(entry => {
            csv += `${entry.id},${entry.value},${entry.difference},${entry.timestamp}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `income_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('CSV file downloaded successfully!');
    };

    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 z-50 ${type === 'error' ? 'bg-red-500' : 'bg-green-500'
            } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    };

    const toggleFullscreen = (chartId) => {
        if (fullscreenChart === chartId) {
            setFullscreenChart(null);
        } else {
            setFullscreenChart(chartId);
        }
    };

    // Calculate statistics
    const totalEntries = incomeData.length;
    const totalIncome = incomeData.reduce((sum, entry) => sum + entry.difference, 0);
    const validDifferences = incomeData.filter(e => e.difference !== 0);
    const avgIncome = validDifferences.length > 0 ?
        validDifferences.reduce((sum, entry) => sum + entry.difference, 0) / validDifferences.length : 0;
    const lastDifference = totalEntries > 0 ? incomeData[incomeData.length - 1].difference : 0;

    // Prepare chart data
    const sortedData = [...incomeData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const labels = sortedData.map(entry => {
        const date = new Date(entry.timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    });
    const differences = sortedData.map(entry => entry.difference);

    let cumulative = 0;
    const cumulativeData = differences.map(diff => {
        cumulative += diff;
        return cumulative;
    });

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: darkMode ? '#f3f4f6' : '#1f2937'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: darkMode ? '#9ca3af' : '#4b5563'
                },
                grid: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }
            },
            y: {
                ticks: {
                    color: darkMode ? '#9ca3af' : '#4b5563'
                },
                grid: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }
            }
        }
    };

    const chartData1 = {
        labels: labels,
        datasets: [{
            label: 'Income Difference',
            data: differences,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            borderWidth: 2
        }]
    };

    const chartData2 = {
        labels: labels,
        datasets: [{
            label: 'Income Difference',
            data: differences,
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: '#10b981',
            borderWidth: 2
        }]
    };

    const chartData3 = {
        labels: labels,
        datasets: [{
            label: 'Cumulative Income',
            data: cumulativeData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            fill: true,
            tension: 0.4,
            borderWidth: 2
        }]
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl">
                            💰
                        </div>
                        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Income Tracker Pro
                        </h1>
                    </div>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`p-3 rounded-lg transition-all duration-200 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-md`}
                    >
                        <span className="text-2xl">{darkMode ? '☀️' : '🌙'}</span>
                    </button>
                </header>

                {/* Input Section */}
                <section className={`rounded-xl p-6 mb-8 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Current Value
                        </label>
                        <input
                            type="text"
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addIncome()}
                            placeholder="Enter current value (e.g., 0.002746630000)"
                            className={`w-full px-4 py-3 rounded-lg border-2 font-mono text-sm transition-colors ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50`}
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={addIncome}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg"
                        >
                            <span className="mr-2">➕</span> Add Entry
                        </button>
                        <button
                            onClick={saveCSV}
                            className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg"
                        >
                            <span className="mr-2">📥</span> Save CSV
                        </button>
                        <button
                            onClick={clearData}
                            className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg"
                        >
                            <span className="mr-2">🗑️</span> Clear Data
                        </button>
                    </div>
                </section>

                {/* Statistics Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Total Entries
                        </div>
                        <div className={`text-2xl font-bold font-mono ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            {totalEntries}
                        </div>
                    </div>
                    <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Total Income
                        </div>
                        <div className={`text-2xl font-bold font-mono ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            {totalIncome.toFixed(12)}
                        </div>
                    </div>
                    <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Average Income
                        </div>
                        <div className={`text-2xl font-bold font-mono ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            {avgIncome.toFixed(12)}
                        </div>
                    </div>
                    <div className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Last Difference
                        </div>
                        <div className={`text-2xl font-bold font-mono ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            {lastDifference !== 0 ? `${lastDifference >= 0 ? '+' : ''}${lastDifference.toFixed(12)}` : '-'}
                        </div>
                    </div>
                </section>

                {/* Charts */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Chart 1 */}
                    <div className={`rounded-xl p-6 shadow-lg relative ${darkMode ? 'bg-gray-800' : 'bg-white'} ${fullscreenChart === 'chart1' ? 'fixed inset-0 z-50 rounded-none' : ''
                        }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Income Differences Over Time
                            </h3>
                            <button
                                onClick={() => toggleFullscreen('chart1')}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                                <span className="text-xl">⛶</span>
                            </button>
                        </div>
                        <div style={{ height: fullscreenChart === 'chart1' ? 'calc(100vh - 120px)' : '300px' }}>
                            <Line ref={chartRefs.chart1} data={chartData1} options={chartOptions} />
                        </div>
                    </div>

                    {/* Chart 2 */}
                    <div className={`rounded-xl p-6 shadow-lg relative ${darkMode ? 'bg-gray-800' : 'bg-white'} ${fullscreenChart === 'chart2' ? 'fixed inset-0 z-50 rounded-none' : ''
                        }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Income Distribution
                            </h3>
                            <button
                                onClick={() => toggleFullscreen('chart2')}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                                <span className="text-xl">⛶</span>
                            </button>
                        </div>
                        <div style={{ height: fullscreenChart === 'chart2' ? 'calc(100vh - 120px)' : '300px' }}>
                            <Bar ref={chartRefs.chart2} data={chartData2} options={chartOptions} />
                        </div>
                    </div>

                    {/* Chart 3 */}
                    <div className={`rounded-xl p-6 shadow-lg relative ${darkMode ? 'bg-gray-800' : 'bg-white'} ${fullscreenChart === 'chart3' ? 'fixed inset-0 z-50 rounded-none' : ''
                        }`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Cumulative Income
                            </h3>
                            <button
                                onClick={() => toggleFullscreen('chart3')}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                                <span className="text-xl">⛶</span>
                            </button>
                        </div>
                        <div style={{ height: fullscreenChart === 'chart3' ? 'calc(100vh - 120px)' : '300px' }}>
                            <Line ref={chartRefs.chart3} data={chartData3} options={chartOptions} />
                        </div>
                    </div>
                </section>

                {/* Recent Entries Table */}
                <section className={`rounded-xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Recent Entries
                    </h3>
                    {incomeData.length === 0 ? (
                        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            No entries yet. Add your first value entry above!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <th className={`text-left py-3 px-4 text-sm font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            ID
                                        </th>
                                        <th className={`text-left py-3 px-4 text-sm font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Date & Time
                                        </th>
                                        <th className={`text-left py-3 px-4 text-sm font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Value
                                        </th>
                                        <th className={`text-left py-3 px-4 text-sm font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Difference
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incomeData.slice(-10).reverse().map((entry) => (
                                        <tr key={entry.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <td className={`py-3 px-4 font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                                #{entry.id}
                                            </td>
                                            <td className={`py-3 px-4 font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                                {new Date(entry.timestamp).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                })}
                                            </td>
                                            <td className={`py-3 px-4 font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                                {entry.value.toFixed(12)}
                                            </td>
                                            <td className={`py-3 px-4 font-mono text-sm ${entry.difference > 0 ? 'text-green-500' :
                                                    entry.difference < 0 ? 'text-red-500' :
                                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`}>
                                                {entry.difference !== 0 ? `${entry.difference > 0 ? '+' : ''}${entry.difference.toFixed(12)}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default IncomeTracker;