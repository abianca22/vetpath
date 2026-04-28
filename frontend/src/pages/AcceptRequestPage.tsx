import {useContext} from "react";
import {AuthContext} from "../api/authContext.ts";
import {useNavigate} from "react-router-dom";

export default function AcceptRequest() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const handleLogin = () => auth?.login();
    const handleLogout = () => auth?.logout();
    const handleRedirect = () => {
        navigate('/requests-list');
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
            <div className="bg-white shadow-xl rounded-xl p-6 w-full max-w-md border border-gray-200">
                {!auth?.token ? (
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-4 text-indigo-600">Welcome!</h1>
                        <p className="mb-6 text-gray-700">You are not logged in. Please log in to see your profile information.</p>
                        <button
                            onClick={handleLogin}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-500 transition"
                        >
                            Login
                        </button>
                    </div>
                ) : (
                    auth?.user && (
                        <div>
                            <ul style={{textDecoration: "none"}}>
                                <li><strong>Username:</strong> {auth?.user.username}</li>
                                <li><strong>Roles:</strong> {auth?.user.roles.join(', ')}</li>
                                <li><button onClick={handleRedirect}>View requests</button></li>
                            </ul>

                            <button
                                onClick={handleLogout}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-400 transition"
                            >
                                Logout
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
