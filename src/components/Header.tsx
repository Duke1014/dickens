import { Link } from 'react-router-dom';
import "../styles/header.css";

export default function Navbar() {

    return (
        <div className="header">
            <a href="/" className="logo">Dickens Christmas in Skaneateles</a>
            <nav>
                <ul>
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/cast">Meet the Cast</Link></li>
                    <li><Link to="/map">Map</Link></li>
                    <li><Link to="/company-portal">Company Portal</Link></li>
                    <li><Link to="/admin">Admin</Link></li>
                </ul>
            </nav>
        </div>

    )
}