import {useContext} from "react";
import {AuthContext} from "../api/authContext.ts";

export default function Home() {
    const auth = useContext(AuthContext);

    const handleLogin = () => auth?.login();
    const handleLogout = () => auth?.logout();

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
                            <h1 className="text-2xl font-bold mb-2 text-indigo-600">
                                Welcome, {auth?.user?.firstName}!
                            </h1>
                            <p className="text-gray-700 mb-4">You are logged in as <span className="font-medium">{auth?.user?.username}</span>.</p>

                            <h2 className="text-xl font-semibold mb-2 text-gray-800">Profile</h2>
                            <ul className="text-gray-700 mb-4 space-y-1">
                                <li><strong>Username:</strong> {auth?.user?.username}</li>
                                <li><strong>Email:</strong> {auth?.user.email}</li>
                                <li><strong>Full Name:</strong> {auth?.user.firstName} {auth?.user.lastName}</li>
                                <li><strong>Roles:</strong> {auth?.user?.roles.join(", ") || "No roles assigned"}</li>
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
