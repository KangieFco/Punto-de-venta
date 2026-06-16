// src/components/dashboard/SalesLast7DaysChart.tsx

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
)

export function SalesLast7DaysChart({
  labels,
  values,
}: {
  labels: string[]
  values: number[]
}) {
  return (
    <div className="h-[280px] w-full">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Ventas',
              data: values,
              tension: 0.4,
              fill: true,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              pointBackgroundColor: '#2563eb',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          resizeDelay: 200,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: context =>
                  `$${Number(context.raw ?? 0).toLocaleString('es-MX')}`,
              },
            },
          },
          scales: {
            y: {
              ticks: {
                callback: value =>
                  `$${Number(value ?? 0).toLocaleString('es-MX')}`,
              },
            },
          },
        }}
      />
    </div>
  )
}

export function PaymentMethodsChart({
  cash,
  card,
  dollar,
  other,
}: {
  cash: number
  card: number
  dollar: number
  other: number
}) {
  return (
    <div className="h-[260px] w-full">
      <Doughnut
        data={{
          labels: ['Efectivo', 'Tarjeta', 'Dólares', 'Otros'],
          datasets: [
            {
              data: [cash, card, dollar, other],
              backgroundColor: [
                '#16a34a',
                '#2563eb',
                '#ca8a04',
                '#9333ea',
              ],
              borderColor: '#ffffff',
              borderWidth: 3,
              hoverOffset: 8,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          resizeDelay: 200,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: context =>
                  `${context.label}: $${Number(
                    context.raw ?? 0
                  ).toLocaleString('es-MX')}`,
              },
            },
          },
        }}
      />
    </div>
  )
}

export function TopProductsChart({
  labels,
  values,
}: {
  labels: string[]
  values: number[]
}) {
  return (
    <div className="h-[260px] w-full">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: 'Vendidos',
              data: values,
              backgroundColor: [
                '#2563eb',
                '#16a34a',
                '#ca8a04',
                '#dc2626',
                '#9333ea',
              ],
              borderRadius: 8,
              barThickness: 24,
              maxBarThickness: 28,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          resizeDelay: 200,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                precision: 0,
              },
            },
          },
        }}
      />
    </div>
  )
}