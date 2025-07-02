import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Defensive: never render an array of React elements directly in a non-list context
// and never return an object as a child. Add a runtime check for all chart data.
function isPrimitive(val) {
  return val == null || (typeof val !== 'object' && typeof val !== 'function');
}

export function EngagementAreaChart({ data }) {
  const safeLabels = data.map((d, i) => {
    const label = d.title || d.postId || `Post ${i + 1}`;
    if (isPrimitive(label)) return String(label);
    return JSON.stringify(label);
  });
  const safeData = data.map((d) => isPrimitive(d.engagement) ? d.engagement : 0);
  const chartData = {
    labels: safeLabels,
    datasets: [
      {
        label: 'Engagement',
        data: safeData,
        fill: true,
        backgroundColor: 'rgba(255,255,255,0.08)', // changed from yellow
        borderColor: '#fff', // changed from yellow
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };
  const options = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#fff' } }, // changed from yellow
      y: { grid: { color: '#333' }, ticks: { color: '#fff' } }, // changed from yellow
    },
    responsive: true,
    maintainAspectRatio: false,
  };
  return <Line data={chartData} options={options} height={180} aria-label="Engagement Area Chart" />;
}

export function ReachLineChart({ data }) {
  const safeLabels = data.map((d, i) => {
    const label = d.title || d.postId || `Post ${i + 1}`;
    if (isPrimitive(label)) return String(label);
    return JSON.stringify(label);
  });
  const safeData = data.map((d) => isPrimitive(d.reach) ? d.reach : 0);
  const chartData = {
    labels: safeLabels,
    datasets: [
      {
        label: 'Reach',
        data: safeData,
        fill: false,
        borderColor: '#00E676',
        backgroundColor: '#00E676',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };
  const options = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#fff' } }, // changed from yellow
      y: { grid: { color: '#333' }, ticks: { color: '#fff' } }, // changed from yellow
    },
    responsive: true,
    maintainAspectRatio: false,
  };
  return <Line data={chartData} options={options} height={180} aria-label="Reach Line Chart" />;
}

export function FollowersTimelineChart({ data }) {
  const safeLabels = data.map((d, i) => isPrimitive(d.date) ? String(d.date) : JSON.stringify(d.date));
  const safeData = data.map((d) => isPrimitive(d.followers) ? d.followers : 0);
  const chartData = {
    labels: safeLabels,
    datasets: [
      {
        label: 'Followers',
        data: safeData,
        fill: true,
        backgroundColor: 'rgba(33,150,243,0.2)',
        borderColor: '#2196F3',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };
  const options = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#fff', maxTicksLimit: 8 } }, // changed from yellow
      y: { grid: { color: '#333' }, ticks: { color: '#fff' } }, // changed from yellow
    },
    responsive: true,
    maintainAspectRatio: false,
  };
  return <Line data={chartData} options={options} height={180} aria-label="Followers Timeline Chart" />;
}
