"use client";

import {useNotifications} from "@/hooks/useNotifications";

export default function NotificationMount() {
    const {ToastComponent} = useNotifications();
    return <>{ToastComponent}</>;
}
