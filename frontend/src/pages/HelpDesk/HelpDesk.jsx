import React from 'react';
import styles from './HelpDesk.module.css';

export default function HelpDesk() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>

                <h1 className={styles.title}>Admission Help Desk</h1>
                <p className={styles.subtitle}>Currently it is under process...</p>
                <p className={styles.description}>We are building an interactive help desk to assist you with all your admission queries. Check back soon!</p>
            </div>
        </div>
    );
}
