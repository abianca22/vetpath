import ModalShell, { PrimaryBtn, SecondaryBtn } from "./ModalShell.tsx";

export default function Confirm(props) {
    return (
        <ModalShell
            open={props.open}
            onClose={props.close}
            title="Confirmare"
            maxWidth={400}
            footer={<>
                <SecondaryBtn onClick={props.close}>Nu</SecondaryBtn>
                <PrimaryBtn onClick={() => { props.confirm(); props.close(); }}>Da</PrimaryBtn>
            </>}
        >
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{props.message}</p>
        </ModalShell>
    );
}
