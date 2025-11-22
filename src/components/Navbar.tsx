import { Link } from 'react-router-dom';
import "../styles/navbar.css";

export default function Navbar() {

    return (
        <nav>
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/cast">Meet the Cast</Link></li>
                <li><Link to="/map">Map</Link></li>
                <li><Link to="/company-portal">Company Portal</Link></li>
                <li><Link to="/admin">Admin</Link></li>
                <li><Link to="/env-check">Env Check</Link></li>
            </ul>
        </nav>
    )
}