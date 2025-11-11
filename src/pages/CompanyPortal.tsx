import Login from "../components/Login";

export default function CompanyPortal() {
    const user = false; // Replace with actual user authentication logic

    return (
        <div className="company-portal">
            {user ? 
                <div>
                    Welcome, user!
                </div> 
            : 
                <div>
                    <Login />
                </div>}
        </div>
    )
}