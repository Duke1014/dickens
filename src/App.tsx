import Home from './pages/Home';
import About from './pages/About';
import Cast from './pages/Cast';
import Map from './pages/Map';
import CompanyPortal from './pages/CompanyPortal';
import Admin from './pages/Admin';
import EnvCheck from './pages/EnvCheck';
import Navbar from './components/Navbar';
import Footbar from './components/Footbar';
// import ProtectedRoute from './components/ProtectedRoute';
// import Sponsors from './components/Sponsors';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/cast" element={<Cast />} />
        <Route path="/map" element={<Map />} />
        <Route path="/company-portal" element={<CompanyPortal />} />
        {/* <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          }
        /> */}
        <Route path="/admin" element={<Admin />} />
        {process.env.NODE_ENV === 'development' && (
          <Route path="/env-check" element={<EnvCheck />} />
        )}
      </Routes>
      {/* <Sponsors /> */}
      <Footbar />
    </div>
  );
}

export default App;
