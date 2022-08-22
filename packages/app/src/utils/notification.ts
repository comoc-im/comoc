import { error } from '@/utils/logger'

export function notice(level: 'error' | 'warn' | 'info', msg: string): void {
    // Let's check if the browser supports notifications
    if (!('Notification' in window)) {
        error('This browser does not support notification')
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === 'granted') {
        // If it's okay let's create a notification
        new Notification(`${level}: ${msg}`)
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === 'granted') {
                new Notification(`${level}: ${msg}`)
            }
        })
    }

    // At last, if the user has denied notifications, and you
    // want to be respectful there is no need to bother them any more.
}
