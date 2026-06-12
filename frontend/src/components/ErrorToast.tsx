import {Toast, ToastContainer} from "react-bootstrap";

export default function ErrorToast(props) {
    return <>
        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
            <Toast onClose={props.close} show={props.show} delay={5000} autohide className="text-white" bg="danger">
                <Toast.Body>{props.message}</Toast.Body>
            </Toast>
        </ToastContainer>
    </>
}