import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../api/authContext.ts";
import {getNotifications, updateNotifications} from "../api/api.ts";
import {Badge, Col, Container, Row, Table} from "react-bootstrap";
import moment from "moment";
import {useNavigate} from "react-router-dom";

export default function NotificationsList() {
    const auth = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();


    useEffect(() => {
        const loadNotifications = async() => {
            try {
                const res = await getNotifications(auth.token);
                setNotifications(res);
                console.log(auth.notifications);
                if (auth.notifications.filter(notification => !notification.seen).length > 0) {
                    const seenRes = await updateNotifications(auth.token);
                    auth.setNotifications(seenRes);
                }
                setError(null);
            }
            catch(err) {
                setError(err.message);
                setNotifications([]);
            }
        }
        loadNotifications();
    }, []);

    function getTimeStamp(date): string {
        const momentDate = moment(`${date.split(' ')[0].split('.').reverse().join('-')} ${date.split(" ")[1]}`);
        if (moment().diff(momentDate, "minutes") < 1) {
            return `acum ${moment().diff(momentDate, "seconds")} secunde`
        }
        else if (moment().diff(momentDate, "hours") < 1) {
            return `acum ${moment().diff(momentDate, "minutes")} minute`
        }
        else if (moment().diff(momentDate, "days") < 1) {
            return `acum ${moment().diff(momentDate, "hours")} ore`
        }
        else return date;
    }

    return <>
        <Container className="d-flex flex-grow-1" fluid>
            <Row className="align-items-start h-100 w-100 justify-content-center">
                <Col className="col-9">
                    <h1 className="m-5 text-center">Notificari</h1>
                    {error && error.split('\n').map((err, index) => <p key={index} className="text-danger mb-1"><small>{err}</small></p>)}
                    <div className="table-responsive text-left">
                        <Table className="mt-5">
                            <tbody>
                            {
                                notifications && notifications.length > 0 ? notifications.map(notification => (
                                    <tr key={notification.id} className={notification.appointment !==  null ? "linked-row" : ""} onClick={() => {
                                        if (notification.appointment !== null) {
                                            sessionStorage.setItem("appointmentId", notification.appointment.id.toString());
                                            navigate("/appointments/details");
                                        }
                                    }}>
                                        <td>{notification.content}</td>
                                        <td>{getTimeStamp(notification.date)}</td>
                                        <td>{!notification.seen &&<Badge className="bg-danger">New</Badge>}</td>
                                    </tr>
                                )) : <tr>
                                    <td colSpan={6}>Nu exista rezultate</td>
                                </tr>
                            }
                            </tbody>
                        </Table>
                    </div>
                </Col>
            </Row>
        </Container>

    </>
}