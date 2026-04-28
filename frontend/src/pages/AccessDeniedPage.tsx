export default function AccessDenied() {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
            <h1 className="display-4">Access Denied</h1>
            <p className="lead">You do not have permission to access this page.</p>
        </div>
    );
}