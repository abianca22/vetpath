import {Button, Modal} from "react-bootstrap";

export default function Confirm(props) {
    return <>
        <Modal onHide={props.close} show={props.open} centered>
            <Modal.Header>
                <Modal.Title>Confirmare
                </Modal.Title>
            </Modal.Header>
                <Modal.Body className="text-start">
                    <p>{props.message}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" className="px-3" onClick={props.close}>
                        Nu
                    </Button>
                    <Button variant="primary" className="px-3" onClick={() => {
                        props.confirm();
                        props.close();
                    }}
                    >
                        Da
                    </Button>
                </Modal.Footer>
        </Modal>
    </>;
}