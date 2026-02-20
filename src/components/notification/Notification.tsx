import React from "react";
import styles from "./Notification.module.css";
import { useNotification } from "../../contexts/NotificationContext";

const Notification: React.FC = () => {

    const { notifications } = useNotification();

    return (
        <div className={styles.notificationContainer}>
            <div className={styles.notificationList}>
                {notifications.map(notification => (
                    <div key={notification.id} className={`${styles.notificationItem} ${styles[notification.type]}`}>
                        <span className={styles.notificationMessage}>{notification.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Notification;