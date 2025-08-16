import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import { Container, Row, Col, Form, Button, Table } from 'react-bootstrap';
import { BsPlusCircle, BsTrash } from 'react-icons/bs';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  // State for fuel prices
  const [petrolPrice, setPetrolPrice] = useState(1.433);
  const [dieselPrice, setDieselPrice] = useState(1.465);

  // State for car list
  const [cars, setCars] = useState([
    { name: '', buyPrice: '', litersPer100km: '', fuelType: 'petrol' }
  ]);

  // Add new car row
  const addCar = () => {
    setCars([...cars, { name: '', buyPrice: '', litersPer100km: '', fuelType: 'petrol' }]);
  };

  // Update car info
  const updateCar = (idx: number, field: string, value: string) => {
    const newCars = cars.map((car, i) => i === idx ? { ...car, [field]: value } : car);
    setCars(newCars);
  };

  // Remove car row
  const removeCar = (idx: number) => {
    setCars(cars.filter((_, i) => i !== idx));
  };

  // Calculate cost data for Chart.js plot
  const kmSteps = 100;
  const maxKm = 100000;
  const kmArray = Array.from({ length: Math.ceil(maxKm / kmSteps) + 1 }, (_, i) => i * kmSteps);

  const getFuelPrice = (type: string) => type === 'petrol' ? petrolPrice : dieselPrice;

  const datasets = cars.map((car, idx) => {
    const buyPrice = parseFloat(car.buyPrice) || 0;
    const litersPer100km = parseFloat(car.litersPer100km) || 0;
    const fuelPrice = getFuelPrice(car.fuelType);
    const data = kmArray.map(km => buyPrice + (km / 100) * litersPer100km * fuelPrice);
    return {
      // label: car.name ? car.name : `Car ${idx + 1}`,
      label: car.name ? car.name : `No car`,
      data,
      borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
      backgroundColor: 'rgba(0,0,0,0)',
      pointRadius: 0,
      tension: 0.2,
    };
  });

  const chartData = {
    labels: kmArray,
    datasets,
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Total Cost vs. Kilometers Driven' },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { title: { display: true, text: 'Kilometers Driven' } },
      y: { title: { display: true, text: 'Total Cost (€)' } },
    },
  };

  // Calculate break-even points between all car pairs
  type BreakEven = { carA: string; carB: string; km: number };
  const breakEvens: BreakEven[] = [];
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const carA = cars[i];
      const carB = cars[j];
      const nameA = carA.name || `Car ${i + 1}`;
      const nameB = carB.name || `Car ${j + 1}`;
      // Calculate coefficients for cost = buyPrice + (km / 100) * litersPer100km * fuelPrice
      const buyA = parseFloat(carA.buyPrice) || 0;
      const buyB = parseFloat(carB.buyPrice) || 0;
      const lA = parseFloat(carA.litersPer100km) || 0;
      const lB = parseFloat(carB.litersPer100km) || 0;
      const fA = getFuelPrice(carA.fuelType);
      const fB = getFuelPrice(carB.fuelType);
      // Solve: buyA + (km/100)*lA*fA = buyB + (km/100)*lB*fB
      const denom = (lA * fA) - (lB * fB);
      if (denom !== 0) {
        const km = ((buyB - buyA) / denom) * 100;
        if (km > 0 && km < maxKm) {
          breakEvens.push({ carA: nameA, carB: nameB, km: Math.round(km) });
        }
      }
    }
  }

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Car Cost Comparison</h1>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Petrol Price (€/L)</Form.Label>
            <Form.Control type="number" step="0.01" value={petrolPrice} onChange={e => setPetrolPrice(Number(e.target.value))} />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Diesel Price (€/L)</Form.Label>
            <Form.Control type="number" step="0.01" value={dieselPrice} onChange={e => setDieselPrice(Number(e.target.value))} />
          </Form.Group>
        </Col>
      </Row>
      <h4>Cars</h4>
      <Table bordered>
        <thead>
          <tr>
            <th>Name</th>
            <th>Buy Price (€)</th>
            <th>Liters/100km</th>
            <th>Fuel Type</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car, idx) => (
            <tr key={idx}>
              <td>
                <Form.Control type="text" value={car.name} onChange={e => updateCar(idx, 'name', e.target.value)} />
              </td>
              <td>
                <Form.Control type="number" value={car.buyPrice} onChange={e => updateCar(idx, 'buyPrice', e.target.value)} />
              </td>
              <td>
                <Form.Control type="number" step="0.1" value={car.litersPer100km} onChange={e => updateCar(idx, 'litersPer100km', e.target.value)} />
              </td>
              <td>
                <Form.Select value={car.fuelType} onChange={e => updateCar(idx, 'fuelType', e.target.value)}>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                </Form.Select>
              </td>
              <td className="text-center">
                <Button variant="outline-danger" size="sm" onClick={() => removeCar(idx)} disabled={cars.length === 1} title="Remove car">
                  <BsTrash />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button variant="success" onClick={addCar} title="Add car">
        <BsPlusCircle className="me-2" /> Add Car
      </Button>
      <hr />
      <h4>Cost Plot</h4>
      <div style={{ height: 400, background: '#fff', border: '1px solid #dee2e6', borderRadius: 8, padding: 16 }}>
        <Line data={chartData} options={chartOptions} />
      </div>
      {breakEvens.length > 0 && (
        <div className="mt-3">
          <h5>Break-even Points</h5>
          <ul>
            {breakEvens.map((be, idx) => (
              <li key={idx}>
                {be.carA} and {be.carB} break even at <b>{be.km.toLocaleString()} km</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  );
}

export default App;
