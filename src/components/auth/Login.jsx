import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            await login();
            navigate('/');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center page-container">
            <div className="mb-8">
                <h1 className="mb-2 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">
                    FitFin
                </h1>
                <p className="text-slate-400">
                    Track your fitness and finance journey.
                </p>
            </div>

            <button
                onClick={handleLogin}
                className="w-full max-w-xs btn btn-primary"
            >
                Sign in with Google
            </button>
        </div>
    );
};

export default Login;
