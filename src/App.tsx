import Home from './pages/Home';
import About from './pages/About';
import Cast from './pages/Cast';
import Map from './pages/Map';
import Navbar from './components/Navbar';
import Footbar from './components/Footbar';
import { Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/cast" element={<Cast />} />
        <Route path="/map" element={<Map />} />
      </Routes>
      <Footbar />
    </div>
  );
}

export default App;
