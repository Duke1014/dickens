import { useState } from "react"

export default function Login() {

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    return (
        <div>
            <input 
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
            />
            <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
            />
            <button onClick={() => console.log(username, password)}>Login</button>
        </div>
    )
}